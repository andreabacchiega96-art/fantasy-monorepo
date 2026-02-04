
import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';

export default function HereWeGo(){
  const [rows, setRows] = useState([]);

  async function load(){ const r = await api('/here'); setRows(r); }

  useEffect(()=>{ load(); const t=setInterval(load,3000); return ()=>clearInterval(t); },[]);

  return (
    <div>
      <div className="page-header">
        <h2>Here We Go</h2>
        <span className="text-muted text-sm">Aggiornamento automatico ogni 3 secondi</span>
      </div>

      {rows.length === 0 ? (
        <div className="empty-state card">
          <p className="text-muted">Nessuna attività recente</p>
        </div>
      ) : (
        <ul className="list">
          {rows.map(n => (
            <li key={n.id} className="list-item">
              <span className="text-muted text-sm" style={{minWidth: '80px'}}>
                {new Date(n.created_at).toLocaleTimeString()}
              </span>
              <span>{n.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
