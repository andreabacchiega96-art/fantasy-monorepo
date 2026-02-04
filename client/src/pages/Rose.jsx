
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
  const roleNames = { P: 'Portieri', D: 'Difensori', C: 'Centrocampisti', A: 'Attaccanti' };
  const grouped = Object.fromEntries(roles.map(r=> [r, mine.filter(x=>x.role===r)]));

  return (
    <div>
      <div className="page-header">
        <h2>La mia rosa</h2>
        <div className={`phase-badge ${phase === 'svincoli' ? 'active' : ''}`}>
          <span className="dot"></span>
          Fase: {phase}
        </div>
      </div>

      {phase !== 'svincoli' && (
        <div className="alert alert-warning">
          La fase svincoli è attualmente chiusa. Non è possibile svincolare giocatori.
        </div>
      )}

      <div className="grid grid-cols-2">
        {roles.map(r => (
          <div key={r} className="section">
            <h3 className="section-title">
              <span className={`auction-role role-${r}`} style={{marginRight: '0.5rem'}}>{r}</span>
              {roleNames[r]}
              <span className="text-muted text-sm ml-auto">({grouped[r].length})</span>
            </h3>

            {grouped[r].length === 0 ? (
              <div className="empty-state" style={{padding: '1.5rem'}}>
                <p className="text-muted">Nessun giocatore</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Giocatore</th>
                      <th>Prezzo</th>
                      <th>Azione</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped[r].map(g => (
                      <tr key={g.id}>
                        <td className="font-semibold">{g.player_name}</td>
                        <td>{g.price}</td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={phase !== 'svincoli'}
                            onClick={() => release(g.id, g.player_name, g.price)}
                          >
                            Svincola
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
