
import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';

export default function HereWeGo(){
  const [rows, setRows] = useState([]);
  async function load(){ const r = await api('/here'); setRows(r); }
  useEffect(()=>{ load(); const t=setInterval(load,3000); return ()=>clearInterval(t); },[]);
  return <div>
    <h2>Here We Go</h2>
    <ul>
      {rows.map(n=> <li key={n.id}>[{new Date(n.created_at).toLocaleTimeString()}] {n.message}</li>)}
    </ul>
  </div>
}
