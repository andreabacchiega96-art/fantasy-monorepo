
import express from 'express';
import { authRequired } from './auth.js';
import { listEvents } from '../hereWeGo.js';

const router = express.Router();

router.get('/', authRequired, (req,res)=>{
  const since = req.query.since? Number(req.query.since): undefined;
  res.json(listEvents(since));
});

export default router;
