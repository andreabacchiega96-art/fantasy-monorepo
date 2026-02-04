
import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import AuctionCard from '../components/AuctionCard.jsx';

export default function Aste(){
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ player_name:'', role:'', base_bid:1 });
  async function load(){ const r = await api('/auctions'); setRows(r); }
  async function create(e){ e.preventDefault(); const r = await api('/auctions','POST',form); if(r.error) alert(r.error); else { setForm({player_name:'',role:'',base_bid:1}); load(); } }
  useEffect(()=>{ load(); const t=setInterval(load,3000); return ()=>clearInterval(t); },[]);
  return <div>
    <h2>Aste</h2>
    <form onSubmit={create} style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:12}}>
      <input placeholder='Giocatore' value={form.player_name} onChange={e=>setForm({...form, player_name:e.target.value})}/>
      <input placeholder='Ruolo (P/D/C/A)' value={form.role} onChange={e=>setForm({...form, role:e.target.value})}/>
      <input type='number' min={1} value={form.base_bid} onChange={e=>setForm({...form, base_bid:Number(e.target.value)})}/>
      <button type='submit'>Apri asta</button>
    </form>
    {rows.map(a=> <AuctionCard key={a.id} a={a} refresh={load}/>) }
  </div>
}
