
import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (token && !me) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setMe(payload);
      } catch (e) {}
    }
  }, [token]);

  async function doLogin(e){
    e.preventDefault();
    const r = await api('/auth/login','POST',login);
    if(r.token){ localStorage.setItem('token', r.token); setToken(r.token); setMe(r.user); }
    else alert(r.error||'Errore login');
  }

  if(!token){
    return (
      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">Fantasy Auction</h1>
          <p className="login-subtitle">Accedi per gestire le tue aste</p>
          <form onSubmit={doLogin}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="input"
                value={login.username}
                onChange={e=>setLogin({...login, username:e.target.value})}
                placeholder="Inserisci username"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="input"
                type='password'
                value={login.password}
                onChange={e=>setLogin({...login, password:e.target.value})}
                placeholder="Inserisci password"
              />
            </div>
            <button type='submit' className="btn btn-primary" style={{width:'100%', marginTop:'0.5rem'}}>
              Accedi
            </button>
          </form>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'aste', label: 'Aste' },
    { id: 'rose', label: 'Rose' },
    { id: 'personale', label: 'Personale' },
    { id: 'here', label: 'Here We Go' },
  ];

  return (
    <div>
      <nav className="nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-btn ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
          >
            {item.label}
          </button>
        ))}
        {me?.is_admin && (
          <button
            className={`nav-btn ${page === 'admin' ? 'active' : ''}`}
            onClick={() => setPage('admin')}
          >
            Admin
          </button>
        )}
        <div className="nav-user">
          <span className="nav-username">Ciao, {me?.username}</span>
          <button
            className="btn btn-secondary"
            onClick={() => {localStorage.removeItem('token'); setToken(null); setMe(null);}}
          >
            Logout
          </button>
        </div>
      </nav>
      <main className="container">
        {page==='aste' && <Aste me={me}/>}
        {page==='rose' && <Rose me={me}/>}
        {page==='personale' && <Personale me={me}/>}
        {page==='here' && <HereWeGo/>}
        {page==='admin' && me?.is_admin && <Admin/>}
      </main>
    </div>
  );
}
