import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import AuctionCard from '../components/AuctionCard.jsx';

export default function Aste(){
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ player_name:'', role:'', base_bid:1 });
  const [busy, setBusy] = useState(false);

  async function load(){
    const r = await api('/auctions');
    setRows(Array.isArray(r) ? r : []);
  }

  useEffect(()=>{
    load();
    const t = setInterval(load, 3000);
    return ()=>clearInterval(t);
  },[]);

  async function create(e){
    e.preventDefault();
    if(busy) return;
    setBusy(true);
    try{
      const r = await api('/auctions', 'POST', form);
      // r può essere { ok:true, auction:{...} } oppure { ok:false, error:"..." }
      if(!r || r.ok === false || r.error){
        alert(r?.error || 'Errore apertura asta');
      }else{
        // successo
        setForm({ player_name:'', role:'', base_bid:1 });
        // ricarico lista
        await load();
      }
    }catch(err){
      // in caso di eccezione di rete/parsing
      alert('Errore di rete: impossibile aprire l’asta');
    }finally{
      setBusy(false);
    }
  }

  return (
    <div>
      <h2>Aste</h2>

      <form onSubmit={create} className="card" style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'end' }}>
        <div>
          <label>Giocatore</label><br/>
          <input className="input" required
                 value={form.player_name}
                 onChange={e=>setForm({...form, player_name:e.target.value})}/>
        </div>
        <div>
          <label>Ruolo (P/D/C/A)</label><br/>
          <input className="input" required
                 value={form.role}
                 onChange={e=>setForm({...form, role:e.target.value.toUpperCase()})}/>
        </div>
        <div>
          <label>Base d’asta</label><br/>
          <input className="input" type="number" min={1} required
                 value={form.base_bid}
                 onChange={e=>setForm({...form, base_bid:Number(e.target.value)})}/>
        </div>
        <button className={`btn btn-primary`} type="submit" disabled={busy}>
          {busy ? 'Apertura…' : 'Apri asta'}
        </button>
      </form>

      <div style={{height:12}}/>

      {rows.map(a => <AuctionCard key={a.id} a={a} refresh={load}/>)}
    </div>
  );
}
``
