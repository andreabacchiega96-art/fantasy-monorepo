
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api';
export async function api(path, method='GET', body){
  const opts = { method, headers:{ 'Content-Type':'application/json' } };
  const t = localStorage.getItem('token');
  if(t) opts.headers['Authorization'] = `Bearer ${t}`;
  if(body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  return await res.json();
}
