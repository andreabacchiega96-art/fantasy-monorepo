
import { db } from './db.js';

export function logEvent(type, message, payload={}){
  db.prepare('INSERT INTO notifications(type,message,payload) VALUES (?,?,?)')
    .run(type, message, JSON.stringify(payload));
}
export function listEvents(sinceId){
  if(sinceId){
    return db.prepare('SELECT * FROM notifications WHERE id>? ORDER BY id ASC').all(sinceId);
  }
  return db.prepare('SELECT * FROM notifications ORDER BY id DESC LIMIT 200').all();
}
