
// server/src/bootstrapRose.js
// Idempotent bootstrap of ROSE from a JSON file on startup.
// - Looks for server/data/import_rose.json (same format used by POST /api/rosters/import)
// - If the database already has rosters, it does nothing (unless FORCE mode)
// Usage modes via env:
//   BOOTSTRAP_ROSE=if-empty   (default)
//   BOOTSTRAP_ROSE=always     (danger: will overwrite current rosters)
//   BOOTSTRAP_ROSE=off        (skip)

import fs from 'fs';
import path from 'path';
import { db } from './db.js';

function readJsonSafe(file){
  try{
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }catch(e){
    return null;
  }
}

function clearRosters(){
  db.prepare('DELETE FROM rosters').run();
  // reset slots_used
  db.prepare('UPDATE user_role_slots SET slots_used = 0').run();
  // budgets will be re-applied from credits if provided
}

function ensureUser(username, initialBudget){
  let u = db.prepare('SELECT * FROM users WHERE username=?').get(username);
  if(!u){
    db.prepare('INSERT INTO users(username,password_hash,is_admin,budget) VALUES (?,?,0,?)')
      .run(username,'password', initialBudget ?? 100);
    u = db.prepare('SELECT * FROM users WHERE username=?').get(username);
  }else if(typeof initialBudget === 'number'){
    db.prepare('UPDATE users SET budget=? WHERE id=?').run(initialBudget, u.id);
  }
  // ensure role slots
  const totals = { P:3, D:8, C:8, A:6 };
  for(const r of Object.keys(totals)){
    const ex = db.prepare('SELECT 1 FROM user_role_slots WHERE user_id=? AND role=?').get(u.id, r);
    if(ex){
      db.prepare('UPDATE user_role_slots SET slots_total=? WHERE user_id=? AND role=?').run(totals[r], u.id, r);
    }else{
      db.prepare('INSERT INTO user_role_slots(user_id,role,slots_total,slots_used) VALUES (?,?,?,0)')
        .run(u.id, r, totals[r]);
    }
  }
  return db.prepare('SELECT * FROM users WHERE username=?').get(username);
}

export function bootstrapRose(){
  const mode = (process.env.BOOTSTRAP_ROSE || 'if-empty').toLowerCase();
  if(mode==='off') return;

  const rosterCount = db.prepare('SELECT COUNT(*) AS c FROM rosters').get().c;
  if(mode==='if-empty' && rosterCount>0){
    console.log('[bootstrapRose] rosters already present, skipping.');
    return;
  }

  const file = path.join(process.cwd(), 'data', 'import_rose.json');
  const json = readJsonSafe(file);
  if(!json || !Array.isArray(json.teams)){
    console.warn('[bootstrapRose] Missing or invalid JSON at', file);
    return;
  }

  const tx = db.transaction(()=>{
    if(mode==='always') clearRosters();

    for(const t of json.teams){
      const credits = (typeof t.credits==='number')? t.credits : undefined;
      const user = ensureUser(t.name, credits);
      // reset for safety
      db.prepare('DELETE FROM rosters WHERE user_id=?').run(user.id);
      db.prepare('UPDATE user_role_slots SET slots_used=0 WHERE user_id=?').run(user.id);
      // load players
      for(const p of (t.players||[])){
        const role = ['P','D','C','A'].includes(p.role)? p.role : 'A';
        const price = Number.isFinite(p.price)? p.price : 1;
        db.prepare('INSERT INTO rosters(user_id,player_name,role,price) VALUES (?,?,?,?)')
          .run(user.id, p.name, role, price);
        db.prepare('UPDATE user_role_slots SET slots_used=slots_used+1 WHERE user_id=? AND role=?')
          .run(user.id, role);
      }
      if(typeof credits==='number'){
        // budget should equal credits after import. For safety, recompute from original default (100) + refunds? Here: set directly.
        db.prepare('UPDATE users SET budget=? WHERE id=?').run(credits, user.id);
      }
    }
  });

  tx();
  console.log('[bootstrapRose] Import completed from data/import_rose.json');
}
