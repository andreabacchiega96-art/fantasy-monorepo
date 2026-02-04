import { db, initDb } from './db.js';

initDb();

const names = [
  'admin',
  'utente1','utente2','utente3','utente4','utente5','utente6',
  'utente7','utente8','utente9','utente10','utente11','utente12'
];

for (const n of names) {
  // ✅ CORRETTO: placeholder ?
  const ex = db.prepare('SELECT id FROM users WHERE username = ?').get(n);
  if (!ex) {
    const is_admin = n === 'admin' ? 1 : 0;
    // ✅ CORRETTO: placeholder ? per TUTTI i valori
    db.prepare('INSERT INTO users(username, password_hash, is_admin, budget) VALUES (?, ?, ?, ?)')
      .run(n, is_admin ? 'admin123' : 'password', is_admin, 100);
  }
}

const roles = ['P', 'D', 'C', 'A'];
const totals = { P: 3, D: 8, C: 8, A: 6 };

for (const u of db.prepare('SELECT id FROM users WHERE username <> ?').all('admin')) {
  for (const r of roles) {
    const ex = db.prepare('SELECT 1 FROM user_role_slots WHERE user_id = ? AND role = ?').get(u.id, r);
    if (!ex) {
      db.prepare('INSERT INTO user_role_slots(user_id, role, slots_total, slots_used) VALUES (?, ?, ?, 0)')
        .run(u.id, r, totals[r]);
    }
  }
}

console.log('Seed completato');
