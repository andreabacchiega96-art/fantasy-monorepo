
import React, { useState } from 'react';
import { api } from '../services/api.js';

export default function AuctionCard({ a, refresh }){
  const [amount, setAmount] = useState('');
  const top = a.current_top || { amount:a.base_bid, username:null };
  async function bid(){
    const r = await api(`/auctions/${a.id}/bid`, 'POST', { amount: Number(amount) });
    if(r.error) alert(r.error); else refresh();
  }
  async function leave(){
    const r = await api(`/auctions/${a.id}/leave`, 'POST');
    if(r.error) alert(r.error); else refresh();
  }
  return <div style={{border:'1px solid #ddd', borderRadius:8, padding:12, marginBottom:12}}>
    <div style={{display:'flex', justifyContent:'space-between'}}>
      <strong>{a.player_name} · {a.role}</strong>
      <span>{a.status}</span>
    </div>
    <div>Top: <b>{top.amount}</b> {top.username? `(${top.username})`: '(base)'}</div>
    <div>Partecipanti attivi: <b>{a.participating_count}</b></div>
    {a.status==='open' && <div style={{display:'flex', gap:8, marginTop:8}}>
      <input placeholder='Rilancio' value={amount} onChange={e=>setAmount(e.target.value)} style={{width:120}}/>
      <button onClick={bid}>Offri</button>
      <button onClick={leave}>Lascia</button>
    </div>}
  </div>
}
