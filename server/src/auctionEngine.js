
import { db } from './db.js';
import { logEvent } from './hereWeGo.js';

function nowISO(){ return new Date().toISOString(); }

function getUserSlotsSummary(userId){
  const rows = db.prepare('SELECT role, slots_total, slots_used FROM user_role_slots WHERE user_id=?').all(userId);
  const totalRemaining = rows.reduce((a,r)=> a + (r.slots_total - r.slots_used), 0);
  const perRole = Object.fromEntries(rows.map(r=> [r.role, { total:r.slots_total, used:r.slots_used }]));
  return { totalRemaining, perRole };
}

export function getMaxBid(userId){
  const u = db.prepare('SELECT budget FROM users WHERE id=?').get(userId);
  const { totalRemaining } = getUserSlotsSummary(userId);
  return Math.max(0, u.budget - Math.max(0, totalRemaining - 1));
}

export function hasRoleSlot(userId, role){
  const r = db.prepare('SELECT slots_total, slots_used FROM user_role_slots WHERE user_id=? AND role=?').get(userId, role);
  return r ? (r.slots_total - r.slots_used) > 0 : false;
}

export function countOpenAuctionsByRole(role){
  const r = db.prepare("SELECT COUNT(*) c FROM auctions WHERE status='open' AND role=?").get(role);
  return r.c;
}

export function totalRemainingSlotsForRole(role){
   const r = db.prepare(`
     SELECT SUM(s.slots_total - s.slots_used) AS c
     FROM user_role_slots s
     JOIN users u ON u.id = s.user_id
     WHERE s.role = ? AND u.is_active = 1 AND u.is_admin = 0
   `).get(role);
   return r.c || 0;
 }

export function ensureRoleCapacityForNewAuction(role){
  const open = countOpenAuctionsByRole(role);
  const remaining = totalRemainingSlotsForRole(role);
  if(open >= remaining){
    throw new Error(`Impossibile aprire nuova asta per ruolo ${role}: nessuno slot globale disponibile`);
  }
}

export function ensureAllParticipants(auctionId){
   const users = db.prepare(`
     SELECT id FROM users
     WHERE is_active = 1 AND is_admin = 0
   `).all();
   for(const u of users){
     const exists = db.prepare('SELECT 1 FROM auction_participants WHERE auction_id = ? AND user_id = ?').get(auctionId, u.id);
     if(!exists){
       db.prepare('INSERT INTO auction_participants(auction_id,user_id,status) VALUES (?,?,?)')
         .run(auctionId, u.id, 'participating');
     }
   }
 }

export function recomputeParticipants(auctionId){
  const a = db.prepare('SELECT * FROM auctions WHERE id=?').get(auctionId);
  if(!a || a.status!=='open') return;
  const top = db.prepare('SELECT user_id,amount,created_at FROM bids WHERE auction_id=? ORDER BY amount DESC, id ASC LIMIT 1').get(auctionId);
  const topAmount = top ? top.amount : a.base_bid;
  const parts = db.prepare('SELECT * FROM auction_participants WHERE auction_id=?').all(auctionId);
  for(const p of parts){
    if(p.status==='left') continue;
    const maxBid = getMaxBid(p.user_id);
    const slotOk = hasRoleSlot(p.user_id, a.role);
    const newStatus = (topAmount > maxBid || !slotOk) ? 'excluded_constraints' : 'participating';
    if(newStatus !== p.status){
      db.prepare('UPDATE auction_participants SET status=? WHERE auction_id=? AND user_id=?').run(newStatus, auctionId, p.user_id);
      if(newStatus==='excluded_constraints'){
        const user = db.prepare('SELECT username FROM users WHERE id=?').get(p.user_id);
        logEvent('exclude', `La squadra ${user.username} è stata esclusa dall'asta per ${a.player_name} (vincoli).`, { auction_id: auctionId, user_id: p.user_id });
      }
    }
  }
  // update current winner among eligible
  const elig = db.prepare("SELECT user_id FROM auction_participants WHERE auction_id=? AND status='participating'").all(auctionId).map(r=>r.user_id);
  let currentTop = null;
  if(elig.length){
    currentTop = db.prepare(`SELECT user_id,amount,created_at FROM bids WHERE auction_id=? AND user_id IN (${elig.map(()=>'?').join(',')}) ORDER BY amount DESC, id ASC LIMIT 1`).get(auctionId, ...elig);
  }
  db.prepare('UPDATE auctions SET winning_bid=?, winner_user_id=? WHERE id=?').run(currentTop?currentTop.amount:null, currentTop?currentTop.user_id:null, auctionId);
}

export function placeBid(auctionId, userId, amount){
  const a = db.prepare('SELECT * FROM auctions WHERE id=?').get(auctionId);
  if(!a || a.status!=='open') throw new Error('Asta non valida');
  const p = db.prepare('SELECT * FROM auction_participants WHERE auction_id=? AND user_id=?').get(auctionId, userId);
  if(!p || p.status!=='participating') throw new Error('Non puoi offrire');
  if(amount < a.base_bid) throw new Error('Offerta inferiore alla base');
  const maxBid = getMaxBid(userId);
  if(amount > maxBid) throw new Error('Oltre il tuo massimo disponibile');
  const cur = db.prepare('SELECT amount FROM bids WHERE auction_id=? ORDER BY amount DESC, id ASC LIMIT 1').get(auctionId);
  const min = cur? cur.amount+1 : a.base_bid;
  if(amount < min) throw new Error('Offerta non sufficiente');
  const top = getTopForAuction(auctionId);
  if(top && top.user_id === userId){
  throw new Error("Hai già l'offerta più alta");
}

  const ts = nowISO();
  db.prepare('INSERT INTO bids(auction_id,user_id,amount,created_at) VALUES (?,?,?,?)').run(auctionId, userId, amount, ts);
  db.prepare('UPDATE auctions SET last_bid_timestamp=? WHERE id=?').run(ts, auctionId);
  recomputeParticipants(auctionId);
}

export function createAuction({ player_name, role, base_bid, created_by }) {

  const info = db.prepare(`
    INSERT INTO auctions(player_name, role, base_bid, status, created_by) VALUES (?, ?, ?, 'open', ?)`).run(player_name, role, base_bid, created_by);
  const id = info.lastInsertRowid;

  db.prepare(`INSERT INTO bids(auction_id, user_id, amount) VALUES (?, ?, ?)`).run(id, created_by, base_bid);

  ensureAllParticipants(id);
  recomputeParticipants(id);

  return id;
}

export function leaveAuction(auctionId, userId){
  db.prepare("UPDATE auction_participants SET status='left' WHERE auction_id=? AND user_id=?").run(auctionId, userId);
  recomputeParticipants(auctionId);
}

function closeAuctionVoid(auctionId){
  db.prepare("UPDATE auctions SET status='void', closed_at=CURRENT_TIMESTAMP WHERE id=?").run(auctionId);
  const a = db.prepare('SELECT * FROM auctions WHERE id=?').get(auctionId);
  logEvent('auction_void', `L'asta per ${a.player_name} è stata annullata (void).`, { auction_id: auctionId });
}

export function finalizeAuction(auctionId){
  const a = db.prepare('SELECT * FROM auctions WHERE id=?').get(auctionId);
  if(!a || a.status!=='open') return;
  const w = db.prepare('SELECT user_id,amount FROM bids WHERE auction_id=? ORDER BY amount DESC, id ASC LIMIT 1').get(auctionId);
  if(!w){ closeAuctionVoid(auctionId); return; }
  db.prepare("UPDATE auctions SET status='closed', winner_user_id=?, winning_bid=?, closed_at=CURRENT_TIMESTAMP WHERE id=?").run(w.user_id, w.amount, auctionId);
  // apply effects
  db.prepare('UPDATE users SET budget=budget-? WHERE id=?').run(w.amount, w.user_id);
  db.prepare('UPDATE user_role_slots SET slots_used=slots_used+1 WHERE user_id=? AND role=?').run(w.user_id, a.role);
  db.prepare('INSERT INTO rosters(user_id,player_name,role,price) VALUES (?,?,?,?)').run(w.user_id, a.player_name, a.role, w.amount);
  const user = db.prepare('SELECT username FROM users WHERE id=?').get(w.user_id);
  logEvent('auction_won', `La squadra ${user.username} ha vinto l'asta per ${a.player_name} con un'offerta di ${w.amount} crediti.`, { auction_id: auctionId, user_id:w.user_id, player:a.player_name, price:w.amount });

  // Domino: process other open auctions ordered by last_bid_timestamp ASC
  const open = db.prepare("SELECT id FROM auctions WHERE status='open' ORDER BY COALESCE(last_bid_timestamp, created_at) ASC").all();
  for(const r of open){
    // recompute constraints
    recomputeParticipants(r.id);
    // if winner was top elsewhere but excluded now → re-admit non-constrained lefts
    const top = db.prepare('SELECT user_id,amount FROM bids WHERE auction_id=? ORDER BY amount DESC, id ASC LIMIT 1').get(r.id);
    if(top && top.user_id===w.user_id){
      const p = db.prepare('SELECT status FROM auction_participants WHERE auction_id=? AND user_id=?').get(r.id, w.user_id);
      if(p && p.status==='excluded_constraints'){
        const a2 = db.prepare('SELECT * FROM auctions WHERE id=?').get(r.id);
        const candidates = db.prepare("SELECT user_id,status FROM auction_participants WHERE auction_id=?").all(r.id);
        for(const c of candidates){
          if(c.status==='left'){
            // check constraints to re-enter
            const hasSlot = hasRoleSlot(c.user_id, a2.role);
            const maxBid = getMaxBid(c.user_id);
            if(hasSlot && maxBid >= a2.base_bid){
              db.prepare("UPDATE auction_participants SET status='participating' WHERE auction_id=? AND user_id=?").run(r.id, c.user_id);
              const u = db.prepare('SELECT username FROM users WHERE id=?').get(c.user_id);
              logEvent('reenter', `La squadra ${u.username} rientra nell'asta per ${a2.player_name} dopo ricalcolo vincoli.`, { auction_id:r.id, user_id:c.user_id });
            }
          }
        }
        recomputeParticipants(r.id);
      }
    }
    // Close if determined (<=1 eligible)
    const eligCount = db.prepare("SELECT COUNT(*) c FROM auction_participants WHERE auction_id=? AND status='participating'").get(r.id).c;
    if(eligCount<=1){ finalizeAuction(r.id); }
  }
}

export function cancelAuctionByAdmin(auctionId){
  const a = db.prepare('SELECT * FROM auctions WHERE id=?').get(auctionId);
  if(!a || a.status!=='open') return;
  db.prepare("UPDATE auctions SET status='cancelled', closed_at=CURRENT_TIMESTAMP WHERE id=?").run(auctionId);
  db.prepare('DELETE FROM bids WHERE auction_id=?').run(auctionId);
  db.prepare('DELETE FROM auction_participants WHERE auction_id=?').run(auctionId);
  logEvent('auction_cancelled', `L'admin ha annullato l'asta per ${a.player_name}.`, { auction_id: auctionId });
}
