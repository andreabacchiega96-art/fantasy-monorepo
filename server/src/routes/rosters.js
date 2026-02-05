
import express from 'express';
import XLSX from 'xlsx';
import { authRequired } from './auth.js';
import { db } from '../db.js';
import { getPhase, assertPhase } from '../phaseManager.js';
import { logEvent } from '../hereWeGo.js';

const router = express.Router();

router.get('/', authRequired, (req,res)=>{
  const rows = db.prepare(`SELECT r.*, u.username FROM rosters r JOIN users u ON u.id=r.user_id ORDER BY u.username, r.role`).all();
  res.json(rows);
});

router.get('/mine', authRequired, (req,res)=>{
  const rows = db.prepare('SELECT * FROM rosters WHERE user_id=? ORDER BY role, player_name').all(req.user.id);
  res.json(rows);
});

router.get("/all", authRequired, (req, res)=>{
  const users = db.prepare(`
    SELECT id, username, budget 
    FROM users 
    WHERE username <> 'admin'
    ORDER BY username
  `).all();

  const out = users.map(u => {
    const players = db.prepare(`
      SELECT player_name AS name, role, price
      FROM rosters
      WHERE user_id=?
      ORDER BY role, player_name
    `).all(u.id);
    return { team: u.username, credits: u.budget, players };
  });

  res.json(out);
});

router.post('/:id/release', authRequired, (req,res)=>{
  try{
    assertPhase('svincoli');
    const open = db.prepare("SELECT COUNT(*) c FROM auctions WHERE status='open'").get().c;
    if(open>0) return res.status(400).json({ error:'Non puoi svincolare mentre ci sono aste aperte' });
    const row = db.prepare('SELECT * FROM rosters WHERE id=?').get(req.params.id);
    if(!row || db.prepare('SELECT user_id FROM rosters WHERE id=?').get(req.params.id).user_id !== req.user.id)
      return res.status(403).json({ error:'Non autorizzato' });
    const refund = Math.ceil(row.price/2);
    db.prepare('DELETE FROM rosters WHERE id=?').run(req.params.id);
    db.prepare('UPDATE users SET budget=budget+? WHERE id=?').run(refund, req.user.id);
    db.prepare('UPDATE user_role_slots SET slots_used=slots_used-1 WHERE user_id=? AND role=?').run(req.user.id, row.role);
    const u = db.prepare('SELECT username FROM users WHERE id=?').get(req.user.id);
    logEvent('release', `La squadra ${u.username} ha svincolato ${row.player_name} recuperando ${refund} crediti.`, { user_id:req.user.id, player:row.player_name, refund });
    res.json({ ok:true, refund });
  }catch(e){ res.status(400).json({ error:e.message }); }
});

// Import ROSE.xlsx (upload non gestito qui: si accetta un JSON già parsato per semplicità)
router.post('/import', authRequired, (req,res)=>{
  // payload atteso: { teams: [ { name, credits, players: [ {name, price, role} ... ] } ] }
  try{
    const { teams } = req.body;
    const roleOrder = ['P','D','C','A'];
    const tx = db.transaction(()=>{
      for(const t of teams){
        // ensure user
        let u = db.prepare('SELECT * FROM users WHERE username=?').get(t.name);
        if(!u){ db.prepare('INSERT INTO users(username,password_hash,is_admin,budget) VALUES (?,?,0,?)').run(t.name,'password',t.credits||100); u = db.prepare('SELECT * FROM users WHERE username=?').get(t.name); }
        // slots reset
        const slots = { P:3, D:8, C:8, A:6 };
        for(const r of roleOrder){
          const ex = db.prepare('SELECT 1 FROM user_role_slots WHERE user_id=? AND role=?').get(u.id, r);
          if(ex) db.prepare('UPDATE user_role_slots SET slots_total=?, slots_used=0 WHERE user_id=? AND role=?').run(slots[r], u.id, r);
          else db.prepare('INSERT INTO user_role_slots(user_id,role,slots_total,slots_used) VALUES (?,?,?,0)').run(u.id, r, slots[r]);
        }
        // roster load
        for(const p of t.players||[]){
          db.prepare('INSERT INTO rosters(user_id,player_name,role,price) VALUES (?,?,?,?)').run(u.id, p.name, p.role, p.price);
          db.prepare('UPDATE user_role_slots SET slots_used=slots_used+1 WHERE user_id=? AND role=?').run(u.id, p.role);
          db.prepare('UPDATE users SET budget=budget-? WHERE id=?').run(p.price, u.id);
        }
        if(typeof t.credits==='number') db.prepare('UPDATE users SET budget=? WHERE id=?').run(t.credits, u.id); // trust provided credits
      }
    });
    tx();
    res.json({ ok:true });
  }catch(e){ res.status(400).json({ error:e.message }); }
});

export default router;
