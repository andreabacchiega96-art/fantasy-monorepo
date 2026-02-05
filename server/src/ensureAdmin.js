import { db } from "./db.js";

export function ensureAdminStructure() {
  // --- 1) AGGIUNGI LA COLONNA is_active SE NON ESISTE ---
  const columns = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);

  if (!columns.includes("is_active")) {
    db.exec("ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;");
  }

  // --- 2) CREA ADMIN SE NON ESISTE ---
  db.exec(`
    INSERT OR IGNORE INTO users(username, password_hash, is_admin, is_active, budget)
    VALUES ('admin', 'admin123', 1, 0, 100);
  `);

  // --- 3) ASSICURA CHE ADMIN SIA ADMIN E NON PARTICIPI ALLE ASTE ---
  db.exec(`
    UPDATE users
    SET is_admin = 1,
        is_active = 0
    WHERE username = 'admin';
  `);
}
