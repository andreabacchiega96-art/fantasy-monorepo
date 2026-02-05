import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import AuctionCard from '../components/AuctionCard.jsx';

export default function Aste(){

  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ player_name:'', role:'', base_bid:1 });
  const [busy, setBusy] = useState(false);
  const [showOnlyOpen, setShowOnlyOpen] = useState(true);
  const [budgets, setBudgets] = useState([]);

  async function loadAuctions(){
    const query = showOnlyOpen ? "?open=1" : "";
    const r = await api(`/auctions${query}`);
    setRows(Array.isArray(r) ? r : []);
  }

  async function loadBudgets(){
    const r = await api('/rosters/budgets');
    setBudgets(Array.isArray(r) ? r : []);
  }

  useEffect(()=>{
    loadAuctions();
    loadBudgets();

    const t = setInterval(()=>{
      loadAuctions();
      loadBudgets();
    }, 3000);

    return ()=>clearInterval(t);
  }, [showOnlyOpen]);  // ricarica quando cambi filtro

  async function create(e){
    e.preventDefault();
    if(busy) return;
    setBusy(true);

    try{
      const r = await api('/auctions', 'POST', form);

      if(!r || r.ok === false || r.error){
        alert(r?.error || 'Errore apertura asta');
      } else {
        setForm({ player_name:'', role:'', base_bid:1 });
        await loadAuctions();
        await loadBudgets();
      }

    } catch(err){
      alert('Errore di rete: impossibile aprire l’asta');
    } finally {
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

        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Apertura…' : 'Apri asta'}
        </button>

        <button 
          type="button"
          className="btn"
          onClick={()=> setShowOnlyOpen(!showOnlyOpen)}>
          {showOnlyOpen ? "Mostra anche chiuse" : "Mostra solo aperte"}
        </button>
      </form>

      <div className="card" style={{marginTop:12}}>
        <h3>Budget squadre</h3>
        <table className="table">
          <thead>
            <tr><th>Squadra</th><th>Crediti</th></tr>
          </thead>
          <tbody>
            {budgets.map(b=>(
              <tr key={b.username}>
                <td>{b.username}</td>
                <td>{b.budget}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{height:12}}/>

      {rows.map(a => <AuctionCard key={a.id} a={a} refresh={loadAuctions}/>)}
    </div>
  );
}
