
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_FILE = process.env.DB_FILE || 'data.sqlite';
export const db = new Database(DB_FILE);

export function initDb(){
  const schema = fs.readFileSync(path.join(process.cwd(),'src','schema.sql'),'utf8');
  db.exec(schema);
}
