
import express from 'express';
import { authRequired } from './auth.js';
import { db } from '../db.js';
import { getPhase, assertPhase } from '../phaseManager.js';
import { createAuction, placeBid, leaveAuction, recomputeParticipants, finalizeAuction } from '../auctionEngine.js';

const router = express.Router();

router.get('/', authRequired, (req,res)=>{
  const rows = db.prepare(`
    SELECT a.*, 
           (SELECT COUNT(*) FROM auction_participants ap WHERE ap.auction_id=a.id AND ap.status='participating') AS participating_count,
           (SELECT json_object('amount',b.amount,'username',u.username)
              FROM bids b JOIN users u ON u.id=b.user_id 
             WHERE b.auction_id=a.id ORDER BY b.amount DESC, b.id ASC LIMIT 1) AS current_top
    FROM auctions a
    WHERE a.status IN ('open','closed','void','cancelled')
    ORDER BY a.status='open' DESC, COALESCE(a.last_bid_timestamp,a.created_at) DESC
  `).all();
  res.json(rows.map(r=> ({...r, current_top: r.current_top? JSON.parse(r.current_top): null })));
});

router.post('/', authRequired, (req,res)=>{
  try{
    assertPhase('aste');
    const { player_name, role, base_bid } = req.body;
    const id = createAuction({ player_name, role, base_bid: Math.max(1, Number(base_bid||1)), created_by: req.user.id });
    const a = db.prepare('SELECT * FROM auctions WHERE id=?').get(id);
    res.status(201).json(a);
  }catch(e){ res.status(400).json({ error: e.message }); }
});

router.post('/:id/bid', authRequired, (req,res)=>{
  try{
    assertPhase('aste');
    placeBid(Number(req.params.id), req.user.id, Number(req.body.amount));
    res.json({ ok:true });
  }catch(e){ res.status(400).json({ error: e.message }); }
});

router.post('/:id/leave', authRequired, (req,res)=>{
  try{
    assertPhase('aste');
    leaveAuction(Number(req.params.id), req.user.id);
    res.json({ ok:true });
  }catch(e){ res.status(400).json({ error: e.message }); }
});

router.post('/:id/finalize', authRequired, (req,res)=>{
  try{ finalizeAuction(Number(req.params.id)); res.json({ ok:true }); }
  catch(e){ res.status(400).json({ error:e.message }); }
});

export default router;
