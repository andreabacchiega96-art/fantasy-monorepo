
import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import AuctionCard from '../components/AuctionCard.jsx';

export default function Aste(){
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ player_name:'', role:'', base_bid:1 });

  async function load(){ const r = await api('/auctions'); setRows(r); }

  async function create(e){
    e.preventDefault();
    const r = await api('/auctions','POST',form);
    if(r.error) alert(r.error);
    else { setForm({player_name:'',role:'',base_bid:1}); load(); }
  }

  useEffect(()=>{ load(); const t=setInterval(load,3000); return ()=>clearInterval(t); },[]);

  return (
    <div>
      <div className="page-header">
        <h2>Aste</h2>
      </div>

      <form onSubmit={create} className="form-inline">
        <div className="form-group">
          <label className="form-label">Giocatore</label>
          <input
            className="input"
            placeholder="Nome giocatore"
            value={form.player_name}
            onChange={e=>setForm({...form, player_name:e.target.value})}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Ruolo</label>
          <input
            className="input"
            placeholder="P/D/C/A"
            value={form.role}
            onChange={e=>setForm({...form, role:e.target.value})}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Base</label>
          <input
            className="input"
            type='number'
            min={1}
            value={form.base_bid}
            onChange={e=>setForm({...form, base_bid:Number(e.target.value)})}
          />
        </div>
        <button type='submit' className="btn btn-primary">Apri asta</button>
      </form>

      {rows.length === 0 ? (
        <div className="empty-state">
          <p>Nessuna asta disponibile</p>
        </div>
      ) : (
        <div className="grid grid-cols-2">
          {rows.map(a => <AuctionCard key={a.id} a={a} refresh={load}/>) }
        </div>
      )}
    </div>
  );
}
