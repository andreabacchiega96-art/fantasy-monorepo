
import React, { useState } from 'react';
import { api } from '../services/api.js';

export default function AuctionCard({ a, refresh }){
  const [amount, setAmount] = useState('');
  const top = a.current_top || { amount:a.base_bid, username:null };

  async function bid(){
    const r = await api(`/auctions/${a.id}/bid`, 'POST', { amount: Number(amount) });
    if(r.error) alert(r.error); else { setAmount(''); refresh(); }
  }

  async function leave(){
    const r = await api(`/auctions/${a.id}/leave`, 'POST');
    if(r.error) alert(r.error); else refresh();
  }

  return (
    <div className="auction-card">
      <div className="auction-card-header">
        <div className="flex items-center gap-3">
          <span className={`auction-role role-${a.role}`}>{a.role}</span>
          <span className="auction-player-name">{a.player_name}</span>
        </div>
        <span className={`auction-status ${a.status === 'open' ? 'status-open' : 'status-closed'}`}>
          {a.status === 'open' ? 'Aperta' : 'Chiusa'}
        </span>
      </div>

      <div className="auction-stats">
        <div className="auction-stat">
          <span className="auction-stat-label">Offerta attuale</span>
          <span className="auction-stat-value">{top.amount}</span>
        </div>
        <div className="auction-stat">
          <span className="auction-stat-label">Leader</span>
          <span className="auction-stat-value">{top.username || 'Base'}</span>
        </div>
        <div className="auction-stat">
          <span className="auction-stat-label">Partecipanti</span>
          <span className="auction-stat-value">{a.participating_count}</span>
        </div>
      </div>

      {a.status === 'open' && (
        <div className="auction-actions">
          <input
            className="input"
            type="number"
            placeholder="Importo rilancio"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
          <button className="btn btn-success" onClick={bid}>Offri</button>
          <button className="btn btn-danger" onClick={leave}>Lascia</button>
        </div>
      )}
    </div>
  );
}
