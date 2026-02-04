
import { db } from './db.js';

export function getPhase(){
  const r = db.prepare('SELECT phase FROM market_phase WHERE id=1').get();
  return r? r.phase : 'chiusa';
}
export function setPhase(p){
  db.prepare('UPDATE market_phase SET phase=? WHERE id=1').run(p);
}
export function assertPhase(p){
  const cur = getPhase();
  if(cur !== p){
    throw new Error(`Operazione non consentita nella fase '${cur}'. Richiesta: '${p}'.`);
  }
}
