
import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';

export default function Personale(){
  const [data, setData] = useState({ winning:[], active:[] });

  async function load(){
    const r = await api('/auctions');
    const t = localStorage.getItem('token');
    const payload = JSON.parse(atob(t.split('.')[1]));
    const my = payload.id;
    const winning = r.filter(a=> a.status==='open' && a.winner_user_id===my);
    const active = r.filter(a=> a.status==='open' && a.winner_user_id!==my && a.participating_count>0);
    setData({ winning, active });
  }

  useEffect(()=>{ load(); const t=setInterval(load,3000); return ()=>clearInterval(t); },[]);

  return (
    <div>
      <div className="page-header">
        <h2>Le mie aste</h2>
      </div>

      <div className="grid grid-cols-2">
        <div className="section">
          <h3 className="section-title">
            Stai vincendo
            <span className="text-muted text-sm ml-auto">({data.winning.length})</span>
          </h3>
          {data.winning.length === 0 ? (
            <div className="empty-state card">
              <p className="text-muted">Nessuna asta in cui stai vincendo</p>
            </div>
          ) : (
            <ul className="list">
              {data.winning.map(a => (
                <li key={a.id} className="list-item">
                  <span className={`auction-role role-${a.role}`}>{a.role}</span>
                  <span className="font-semibold">{a.player_name}</span>
                  <span className="ml-auto text-muted">Top: {a.current_top?.amount}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="section">
          <h3 className="section-title">
            Aste attive
            <span className="text-muted text-sm ml-auto">({data.active.length})</span>
          </h3>
          {data.active.length === 0 ? (
            <div className="empty-state card">
              <p className="text-muted">Nessuna altra asta attiva</p>
            </div>
          ) : (
            <ul className="list">
              {data.active.map(a => (
                <li key={a.id} className="list-item">
                  <span className={`auction-role role-${a.role}`}>{a.role}</span>
                  <span className="font-semibold">{a.player_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
