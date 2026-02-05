import express from "express";
import { authRequired } from "./auth.js";
import { db } from "../db.js";
import { assertPhase } from "../phaseManager.js";
import { createAuction } from "../auctionEngine.js";

const router = express.Router();

router.get("/", authRequired, (req, res) => {
  const onlyOpen = req.query.open === "1";

  const rows = db
    .prepare(
      onlyOpen
        ? `
          SELECT a.*,
            (SELECT COUNT(*) 
               FROM auction_participants ap 
              WHERE ap.auction_id=a.id 
                AND ap.status='participating') AS participating_count,
            (SELECT json_object('amount', b.amount, 'username', u.username, 'user_id', u.id)
               FROM bids b 
               JOIN users u ON u.id=b.user_id
              WHERE b.auction_id=a.id
              ORDER BY b.amount DESC, b.id ASC
              LIMIT 1) AS current_top
          FROM auctions a
          WHERE a.status='open'
          ORDER BY a.id DESC
        `
        : `
          SELECT a.*,
            (SELECT COUNT(*) 
               FROM auction_participants ap 
              WHERE ap.auction_id=a.id 
                AND ap.status='participating') AS participating_count,
            (SELECT json_object('amount', b.amount, 'username', u.username, 'user_id', u.id)
               FROM bids b 
               JOIN users u ON u.id=b.user_id
              WHERE b.auction_id=a.id
              ORDER BY b.amount DESC, b.id ASC
              LIMIT 1) AS current_top
          FROM auctions a
          WHERE a.status <> 'cancelled'
          ORDER BY 
            CASE a.status 
              WHEN 'open' THEN 0
              WHEN 'closed' THEN 1
            END,
            a.id DESC
        `
    )
    .all();

  const formatted = rows.map((r) => ({
    ...r,
    current_top: r.current_top ? JSON.parse(r.current_top) : null,
  }));

  res.json(formatted);
});


// ------------------------
// CREA ASTA
// ------------------------
router.post("/", authRequired, (req, res) => {
  try {
    assertPhase("aste");

    const { player_name, role, base_bid } = req.body;

    // Slot check: (il tuo codice qui…)

    const id = createAuction({
      player_name,
      role,
      base_bid: Math.max(1, Number(base_bid || 1)),
      created_by: req.user.id,
    });

    const auction = db.prepare("SELECT * FROM auctions WHERE id=?").get(id);

    res.status(201).json({ ok: true, auction });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

export default router;
