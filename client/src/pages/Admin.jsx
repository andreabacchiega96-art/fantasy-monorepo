
import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';

export default function Admin(){
  const [phase, setPhase] = useState('chiusa');
  const [auctions, setAuctions] = useState([]);

  async function load(){
    const p = await api('/admin/phase'); setPhase(p.phase);
    const a = await api('/auctions'); setAuctions(a);
  }

  useEffect(()=>{ load(); },[]);

  async function call(path){
    const r = await api(path,'POST');
    if(r.error) alert(r.error); else load();
  }

  async function cancel(id){
    if(!confirm('Annullare asta?')) return;
    const r = await api(`/admin/auctions/${id}/cancel`,'POST');
    if(r.error) alert(r.error); else load();
  }

  const openAuctions = auctions.filter(a => a.status === 'open');

  return (
    <div>
      <div className="page-header">
        <h2>Pannello Admin</h2>
        <div className={`phase-badge ${phase === 'chiusa' ? '' : 'active'}`}>
          <span className="dot"></span>
          Fase: <strong>{phase}</strong>
        </div>
      </div>

      <div className="section">
        <h3 className="section-title">Gestione Fasi</h3>
        <div className="card">
          <div className="flex gap-2" style={{flexWrap: 'wrap'}}>
            <button className="btn btn-primary" onClick={() => call('/admin/phase/open-svincoli')}>
              Apri Svincoli
            </button>
            <button className="btn btn-secondary" onClick={() => call('/admin/phase/close-svincoli')}>
              Chiudi Svincoli
            </button>
            <button className="btn btn-success" onClick={() => call('/admin/phase/open-aste')}>
              Apri Aste
            </button>
            <button className="btn btn-secondary" onClick={() => call('/admin/phase/close-aste')}>
              Chiudi Aste
            </button>
          </div>
        </div>
      </div>

      <div className="section">
        <h3 className="section-title">
          Aste aperte
          <span className="text-muted text-sm ml-auto">({openAuctions.length})</span>
        </h3>
        {openAuctions.length === 0 ? (
          <div className="empty-state card">
            <p className="text-muted">Nessuna asta aperta</p>
          </div>
        ) : (
          <ul className="list">
            {openAuctions.map(a => (
              <li key={a.id} className="list-item">
                <span className={`auction-role role-${a.role}`}>{a.role}</span>
                <span className="font-semibold">{a.player_name}</span>
                <button className="btn btn-danger ml-auto" onClick={() => cancel(a.id)}>
                  Annulla
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
