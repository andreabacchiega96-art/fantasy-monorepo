
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
  async function call(path){ const r = await api(path,'POST'); if(r.error) alert(r.error); else load(); }
  async function cancel(id){ if(!confirm('Annullare asta?')) return; const r=await api(`/admin/auctions/${id}/cancel`,'POST'); if(r.error) alert(r.error); else load(); }
  return <div>
    <h2>Admin</h2>
    <div>Fase corrente: <b>{phase}</b></div>
    <div style={{display:'flex', gap:8, margin:'8px 0'}}>
      <button onClick={()=>call('/admin/phase/open-svincoli')}>Apri Svincoli</button>
      <button onClick={()=>call('/admin/phase/close-svincoli')}>Chiudi Svincoli</button>
      <button onClick={()=>call('/admin/phase/open-aste')}>Apri Aste</button>
      <button onClick={()=>call('/admin/phase/close-aste')}>Chiudi Aste</button>
    </div>
    <h3>Aste aperte</h3>
    <ul>
      {auctions.filter(a=>a.status==='open').map(a=> (
        <li key={a.id}>{a.player_name} · {a.role} <button onClick={()=>cancel(a.id)}>Annulla</button></li>
      ))}
    </ul>
  </div>
}
