
import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';

export default function Rose(){
  const [mine, setMine] = useState([]);
  const [phase, setPhase] = useState('chiusa');
  async function load(){
    const r = await api('/rosters/mine'); setMine(r);
    const p = await api('/admin/phase'); setPhase(p.phase);
  }
  async function release(id, player, price){
    if(!confirm(`Sicuro di svincolare ${player}?`)) return;
    const r = await api(`/rosters/${id}/release`, 'POST');
    if(r.error) alert(r.error); else load();
  }
  useEffect(()=>{ load(); },[]);
  const roles = ['P','D','C','A'];
  const grouped = Object.fromEntries(roles.map(r=> [r, mine.filter(x=>x.role===r)]));
  return <div>
    <h2>Rose (mie)</h2>
    {phase!=='svincoli' && <div style={{padding:8, background:'#ffe8d2', border:'1px solid #ffcc99', marginBottom:8}}>La fase svincoli è chiusa</div>}
    {roles.map(r=> (
      <div key={r} style={{marginBottom:12}}>
        <h3>Ruolo {r}</h3>
        <table border='1' cellPadding='6'><tbody>
          {grouped[r].map(g=> (
            <tr key={g.id}><td>{g.player_name}</td><td>{g.price}</td><td>
              <button disabled={phase!=='svincoli'} onClick={()=>release(g.id,g.player_name,g.price)}>Svincola</button>
            </td></tr>
          ))}
        </tbody></table>
      </div>
    ))}
  </div>
}
