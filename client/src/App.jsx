
import React, { useState } from 'react';
import { api } from './services/api.js';
import Aste from './pages/Aste.jsx';
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

  return <div style={{fontFamily:'system-ui', padding:16}}>
    <nav style={{display:'flex', gap:8}}>
      <button onClick={()=>setPage('aste')}>Aste</button>
      <button onClick={()=>setPage('rose')}>Rose</button>
      <button onClick={()=>setPage('personale')}>Personale</button>
      <button onClick={()=>setPage('here')}>Here We Go</button>
      {me?.is_admin && <button onClick={()=>setPage('admin')}>Admin</button>}
      <span style={{marginLeft:'auto'}}>Ciao {me?.username}</span>
      <button onClick={()=>{localStorage.removeItem('token'); setToken(null);}}>Logout</button>
    </nav>
    <hr/>
    {page==='aste' && <Aste me={me}/>} 
    {page==='rose' && <Rose me={me}/>} 
    {page==='personale' && <Personale me={me}/>} 
    {page==='here' && <HereWeGo/>}
    {page==='admin' && me?.is_admin && <Admin/>}
  </div>
}
