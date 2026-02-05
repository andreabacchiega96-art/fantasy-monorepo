import React, { useState, useMemo } from 'react';
import { api } from '../services/api.js';

export default function AuctionCard({ a, me, refresh }) {
  const [amount, setAmount] = useState('');

  // La tua API a volte espone current_top con solo amount/username.
  // Dopo la Patch 3 (sotto) esporrà anche user_id.
  const top = a.current_top || { amount: a.base_bid, username: null, user_id: null };

  // Ricava il mio id in modo robusto:
  const myId = useMemo(() => {
    if (me?.id) return me.id;
    try {
      const t = localStorage.getItem('token');
      if (!t) return null;
      const payload = JSON.parse(atob(t.split('.')[1]));
      return payload?.id ?? null;
    } catch {
      return null;
    }
  }, [me]);

  // Sei top se:
  // 1) la GET /auctions include current_top.user_id (Patch 3), oppure
  // 2) in fallback, se winner_user_id coincide, quando la card è stata aggiornata dopo un bid
  const amITop = (top?.user_id && myId && top.user_id === myId)
              || (a?.winner_user_id && myId && a.winner_user_id === myId);

  async function bid() {
    const r = await api(`/auctions/${a.id}/bid`, 'POST', { amount: Number(amount) });
    if (r?.error) alert(r.error); else refresh();
  }

  async function leave() {
    const r = await api(`/auctions/${a.id}/leave`, 'POST');
    if (r?.error) alert(r.error); else refresh();
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center' }}>
        <strong style={{ fontSize: 18 }}>{a.player_name} · {a.role}</strong>
        <span style={{ opacity: .8 }}>{a.status}</span>
      </div>

      <div style={{ marginTop: 6 }}>
        Top: <b>{top.amount}</b> {top.username ? `(${top.username})` : '(base)'}
      </div>
      <div>Partecipanti attivi: <b>{a.participating_count}</b></div>

      {a.status === 'open' && (
        amITop ? (
          <div style={{opacity:.7, marginTop:8}}>Sei già il miglior offerente</div>
        ) : (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input
              className="input"
              placeholder="Rilancio"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{ width: 120 }}
            />
            <button className="btn btn-primary" onClick={bid}>Offri</button>
            <button className="btn" onClick={leave}>Lascia</button>
          </div>
        )
      )}
    </div>
  );
}
