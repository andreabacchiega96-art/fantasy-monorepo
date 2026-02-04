
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db, initDb } from './db.js';
import { getPhase } from './phaseManager.js';
import authRouter from './routes/auth.js';
import auctionsRouter from './routes/auctions.js';
import rostersRouter from './routes/rosters.js';
import adminRouter from './routes/admin.js';
import hereRouter from './routes/herewego.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
initDb();

app.get('/api/health', (req,res)=>{
  res.json({ ok:true, phase: getPhase() });
});

app.use('/api/auth', authRouter);
app.use('/api/auctions', auctionsRouter);
app.use('/api/rosters', rostersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/here', hereRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, ()=> console.log(`Server on ${PORT}`));
