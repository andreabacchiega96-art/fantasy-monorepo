
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';

const router = express.Router();

function sign(user){
  return jwt.sign({ id:user.id, username:user.username, is_admin: !!user.is_admin }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '12h' });
}

router.post('/login', (req,res)=>{
  const { username, password } = req.body;
  const u = db.prepare('SELECT * FROM users WHERE username=?').get(username);
  if(!u) return res.status(401).json({ error:'Credenziali non valide' });
  const ok = (password === u.password_hash) || bcrypt.compareSync(password, u.password_hash);
  if(!ok) return res.status(401).json({ error:'Credenziali non valide' });
  const token = sign(u);
  res.json({ token, user: { id:u.id, username:u.username, is_admin:!!u.is_admin, budget:u.budget } });
});

export function authRequired(req,res,next){
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ')? hdr.slice(7) : null;
  if(!token) return res.status(401).json({ error:'Token mancante' });
  try{
    const p = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    req.user = p; next();
  }catch(e){ return res.status(401).json({ error:'Token non valido' }); }
}

export function adminOnly(req,res,next){
  if(!req.user?.is_admin) return res.status(403).json({ error:'Solo admin' });
  next();
}

export default router;
