
# Server

## Comandi
```
npm install
npm run seed
npm run dev
```

Utenti seed:
- admin / admin123 (admin)
- utente1..utente12 / password

Fasi mercato:
- POST /api/admin/phase/open-svincoli
- POST /api/admin/phase/close-svincoli
- POST /api/admin/phase/open-aste
- POST /api/admin/phase/close-aste

Aste:
- GET /api/auctions
- POST /api/auctions { player_name, role, base_bid }
- POST /api/auctions/:id/bid { amount }
- POST /api/auctions/:id/leave
- POST /api/auctions/:id/finalize
- POST /api/admin/auctions/:id/cancel (admin)

Rose:
- GET /api/rosters
- GET /api/rosters/mine
- POST /api/rosters/:id/release (svincoli only, no open auctions)
- POST /api/rosters/import { teams:[{ name, credits, players:[{name,price,role}] }...] }

Here We Go:
- GET /api/here?since=<id>
