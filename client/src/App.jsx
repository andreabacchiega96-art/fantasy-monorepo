
import React, { useState } from 'react';
import { api } from './services/api.js';
import Aste from './pages/Aste.jsx';
import Squadra from './pages/Squadra.jsx';
import Rose from './pages/Rose.jsx';
import Admin from './pages/Admin.jsx';
import Personale from './pages/Personale.jsx';
import HereWeGo from './pages/HereWeGo.jsx';

export default function App(){
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [page, setPage] = useState('aste');
  const [login, setLogin] = useState({ username:'utente1', password:'password' });
  const [me, setMe] = useState(null);

  async function doLogin(e){
    e.preventDefault();
    const r = await api('/auth/login','POST',login);
    if(r.token){ localStorage.setItem('token', r.token); setToken(r.token); setMe(r.user); }
    else alert(r.error||'Errore login');
  }

  if(!token){
    return <div style={{maxWidth:420, margin:'60px auto', fontFamily:'system-ui'}}>
      <h2>Login</h2>
      <form onSubmit={doLogin}>
        <div><label>Username</label><br/><input value={login.username} onChange={e=>setLogin({...login, username:e.target.value})}/></div>
        <div><label>Password</label><br/><input type='password' value={login.password} onChange={e=>setLogin({...login, password:e.target.value})}/></div>
        <button type='submit'>Entra</button>
      </form>
    </div>
  }

  return (
  <div className="container">
    <div className="navbar">
      <button className="btn" onClick={()=>setPage('aste')}>Aste</button>
      <button className="btn" onClick={()=>setPage('mia')}>La mia squadra</button>
      <button className="btn" onClick={()=>setPage('rose')}>Rose</button>
      <button className="btn" onClick={()=>setPage('personale')}>Personale</button>
      <button className="btn" onClick={()=>setPage('here')}>Here We Go</button>
      {me?.is_admin && <button className="btn" onClick={()=>setPage('admin')}>Admin</button>}
      <div style={{marginLeft:'auto'}}>Ciao {me?.username}</div>
      <button className="btn" onClick={()=>{localStorage.removeItem('token');setToken(null);}}>Logout</button>
    </div>

    <div style={{marginTop:16}}>
      {page==='aste' && <Aste me={me}/>}
      {page==='mia' && <Squadra me={me}/>}
      {page==='rose' && <Rose/>}
      {page==='personale' && <Personale me={me}/>}
      {page==='here' && <HereWeGo/>}
      {page==='admin' && me?.is_admin && <Admin/>}
    </div>
  </div>
)}

