import React, { useEffect, useState } from "react";
import { api } from "../services/api.js";

export default function Rose(){
  const [rows, setRows] = useState([]);
  const roles = ["P","D","C","A"];

  async function load(){ 
    const r = await api("/rosters/all"); 
    setRows(r);
  }

  useEffect(()=>{ 
    load(); 
    const t=setInterval(load,3000); 
    return ()=>clearInterval(t);
  },[]);

  return (
    <div>
      <h2>Rose di tutte le squadre</h2>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:12}}>
        {rows.map(team=>(
          <div className="card" key={team.team}>
            <strong style={{fontSize:18}}>{team.team}</strong>
            <div style={{opacity:.7}}>Crediti: {team.credits}</div>

            {roles.map(r=>{
              const list = team.players.filter(p=>p.role===r);
              return (
                <div key={r} style={{marginTop:8}}>
                  <div className="section-title">Ruolo {r}</div>
                  <table className="table">
                    <thead><tr><th>Giocatore</th><th style={{width:70}}>Prezzo</th></tr></thead>
                    <tbody>
                      {list.map(p=>(
                        <tr key={p.name}><td>{p.name}</td><td>{p.price}</td></tr>
                      ))}
                      {list.length===0 && <tr><td colSpan={2} style={{opacity:.6}}>—</td></tr>}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
