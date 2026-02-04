
import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';

export default function Personale(){
  const [data, setData] = useState({ winning:[], active:[] });
  async function load(){ const r = await api('/auctions');
    const t = localStorage.getItem('token');
    const payload = JSON.parse(atob(t.split('.')[1]));
    const my = payload.id;
    const winning = r.filter(a=> a.status==='open' && a.winner_user_id===my);
    const active = r.filter(a=> a.status==='open' && a.winner_user_id!==my && a.participating_count>0);
    setData({ winning, active }); }
  useEffect(()=>{ load(); const t=setInterval(load,3000); return ()=>clearInterval(t); },[]);
  return <div>
    <h2>Le mie aste</h2>
    <h3>Vincente</h3>
    <ul>{data.winning.map(a=> <li key={a.id}>{a.player_name} · {a.role} · top {a.current_top?.amount}</li>)}</ul>
    <h3>Attivo</h3>
    <ul>{data.active.map(a=> <li key={a.id}>{a.player_name} · {a.role}</li>)}</ul>
  </div>
}
