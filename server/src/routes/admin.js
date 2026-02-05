
import express from 'express';
import { authRequired, adminOnly } from './auth.js';
import { getPhase, setPhase } from '../phaseManager.js';
import { cancelAuctionByAdmin } from '../auctionEngine.js';
import { db } from '../db.js';
import { logEvent } from '../hereWeGo.js';
import { bootstrapRose } from "../bootstrapRose.js";

const router = express.Router();

router.get('/phase', authRequired, (req,res)=>{ res.json({ phase: getPhase() }); });

router.post('/phase/open-svincoli', authRequired, adminOnly, (req,res)=>{
  setPhase('svincoli');
  logEvent('phase','Fase SVINCOLI aperta.');
  res.json({ ok:true, phase:'svincoli' });
});
router.post('/phase/close-svincoli', authRequired, adminOnly, (req,res)=>{
  setPhase('chiusa');
  logEvent('phase','Fase SVINCOLI chiusa.');
  res.json({ ok:true, phase:'chiusa' });
});
router.post('/phase/open-aste', authRequired, adminOnly, (req,res)=>{
  setPhase('aste');
  logEvent('phase','Fase ASTE aperta.');
  res.json({ ok:true, phase:'aste' });
});
router.post('/phase/close-aste', authRequired, adminOnly, (req,res)=>{
  setPhase('chiusa');
  logEvent('phase','Fase ASTE chiusa.');
  res.json({ ok:true, phase:'chiusa' });
});

router.post('/auctions/:id/cancel', authRequired, adminOnly, (req,res)=>{
  try{ cancelAuctionByAdmin(Number(req.params.id)); res.json({ ok:true }); }
  catch(e){ res.status(400).json({ error:e.message }); }
});

router.post("/reset-rosters", authRequired, adminOnly, (req, res) => {
  try {
    bootstrapRose("always");
    logEvent("reset_rosters", "Admin ha resettato le ROSE allo stato del JSON canonico.");
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
  });

router.post('/maintenance/fix-admin', (req, res) => {
  try {
    db.prepare(`
      INSERT OR IGNORE INTO users(username, password_hash, is_admin, is_active, budget)
      VALUES ('admin', 'admin123', 1, 0, 100)
    `).run();

    // assicura permessi admin e lo esclude dalle aste (is_active=0)
    db.prepare(`
      UPDATE users SET is_admin=1, is_active=0 WHERE username='admin'
    `).run();

    return res.json({ ok: true, message: "Admin tecnico ripristinato" });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});
``

export default router;
