import { db } from "./db.js";

export function ensureAdminUser() {
  // crea admin se non esiste
  db.prepare(`
    INSERT OR IGNORE INTO users(username, password_hash, is_admin, is_active, budget)
    VALUES ('admin', 'admin123', 1, 0, 100)
  `).run();

  // assicura che admin abbia i permessi e non partecipi alle aste
  db.prepare(`
    UPDATE users 
    SET is_admin = 1,
        is_active = 0
    WHERE username = 'admin'
  `).run();
}
