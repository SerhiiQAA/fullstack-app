import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import NET from 'vanta/dist/vanta.net.min';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  email: string;
}

function App() {
  // --- 1.  (STATES) ---
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') !== 'light');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [vantaEffect, setVantaEffect] = useState<any>(null);
  const myRef = useRef(null);
  
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // --- 2. Dinamic theme ---
  const theme = {
    bg: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    text: isDarkMode ? '#ffffff' : '#1a1a1a',
    cardBorder: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    inputBg: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)',
    accent: isDarkMode ? '#3fbbff' : '#0077ff'
  };

  // --- 3.  (EFFECTS) ---
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (vantaEffect) {
      vantaEffect.setOptions({
        backgroundColor: isDarkMode ? 0x0a0a0a : 0xf0f0f0,
        color: isDarkMode ? 0x3fbbff : 0x0077ff,
      });
    }
  }, [isDarkMode, vantaEffect]);

  useEffect(() => {
    if (!vantaEffect) {
      setVantaEffect(NET({
        el: myRef.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        color: isDarkMode ? 0x3fbbff : 0x0077ff,
        backgroundColor: isDarkMode ? 0x0a0a0a : 0xf0f0f0,
        points: 12.0,
        maxDistance: 22.0,
        spacing: 16.0
      }));
    }
    return () => { if (vantaEffect) vantaEffect.destroy(); };
  }, [vantaEffect]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUsers();
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // --- 4. Functions ---
  const playClick = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) { console.log("Audio error"); }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/users');
      setUsers(res.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) handleLogout();
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); playClick();
    const endpoint = isLoginMode ? 'login' : 'register';
    try {
      const res = await axios.post(`http://localhost:3001/api/auth/${endpoint}`, {
        email: authEmail, password: authPassword
      });
      if (isLoginMode) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
      } else {
        alert('Успіх! Тепер увійдіть.');
        setIsLoginMode(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Помилка');
    } finally { setIsLoading(false); }
  };

  const handleLogout = () => {
    playClick();
    localStorage.removeItem('token');
    setToken(null);
    setUsers([]);
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault(); playClick();
    if (!name || !email) return;
    try {
      if (editingId) {
        await axios.put(`http://localhost:3001/api/users/${editingId}`, { name, email });
        setEditingId(null);
      } else {
        await axios.post('http://localhost:3001/api/users', { name, email });
      }
      setName(''); setEmail(''); fetchUsers();
    } catch (err) { alert("Помилка збереження"); }
  };

  const handleDelete = async (id: number) => {
    playClick();
    if (window.confirm('Видалити?')) {
      await axios.delete(`http://localhost:3001/api/users/${id}`);
      fetchUsers();
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* 1. Font */}
      <div 
        ref={myRef} 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          zIndex: 0 
        }} 
      />

      <style>{`
        button { transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important; cursor: pointer; border: none; }
        button:hover { transform: scale(1.05); filter: brightness(1.2); }
        button:active { transform: scale(0.95); }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        input { border: 1px solid ${theme.cardBorder}; outline: none; transition: 0.3s; }
        input:focus { border-color: ${theme.accent}; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loader { width: 18px; height: 18px; border: 2px solid rgba(0,0,0,0.2); border-top-color: #000; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
        .theme-btn { position: fixed; top: 20px; right: 20px; z-index: 100; width: 45px; height: 45px; border-radius: 50%; background: ${theme.bg}; color: ${theme.text}; border: 1px solid ${theme.cardBorder}; backdrop-filter: blur(10px); font-size: 1.2rem; }
        
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${theme.cardBorder}; border-radius: 10px; }
      `}</style>

      <button className="theme-btn" onClick={() => { playClick(); setIsDarkMode(!isDarkMode); }}>
        {isDarkMode ? '☀️' : '🌙'}
      </button>

      {/* 2. Content   */}
      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        width: '100vw', 
        display: 'flex', 
        justifyContent: 'flex-start',
        alignItems: 'center',
        flexDirection: 'column',
        padding: '40px 0' 
      }}>
        <div style={{ 
          padding: '40px',
          width: '90%', maxWidth: '550px', 
          background: theme.bg,
          backdropFilter: 'blur(20px)', 
          borderRadius: '30px', 
          border: `1px solid ${theme.cardBorder}`,
          color: theme.text, 
          textAlign: 'center', 
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          transition: 'all 0.5s ease',
          margin: '0 auto'
        }}>
          
          {!token ? (
            /* Auth screen */
            <div>
              <h1 style={{ fontWeight: 200, letterSpacing: '2px' }}>{isLoginMode ? 'LOGIN ADMIN' : 'CREATE ADMIN'}</h1>
              <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '30px' }}>
                <input 
                  type="email" placeholder="Email" value={authEmail} required
                  onChange={(e) => setAuthEmail(e.target.value)}
                  style={{ padding: '14px', borderRadius: '12px', background: theme.inputBg, color: theme.text }}
                />
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? "text" : "password"} placeholder="Password" value={authPassword} required
                    onChange={(e) => setAuthPassword(e.target.value)}
                    style={{ width: '100%', padding: '14px', paddingRight: '45px', borderRadius: '12px', background: theme.inputBg, color: theme.text, boxSizing: 'border-box' }} 
                  />
                  <span onClick={() => { playClick(); setShowPassword(!showPassword); }}
                    style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '1.2rem', zIndex: 2 }}>
                    {showPassword ? '👀' : '🫣'}
                  </span>
                </div>
                <button type="submit" disabled={isLoading}
                  style={{ padding: '14px', borderRadius: '12px', background: theme.accent, color: isDarkMode ? 'black' : 'white', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                  {isLoading && <span className="loader"></span>}
                  {isLoading ? 'WAIT...' : (isLoginMode ? 'LOGIN' : 'REGISTER')}
                </button>
                <p onClick={() => setIsLoginMode(!isLoginMode)} style={{ cursor: 'pointer', opacity: 0.6, fontSize: '0.85rem' }}>
                  {isLoginMode ? "Need account? Sign Up" : "Have account? Log In"}
                </p>
              </form>
            </div>
          ) : (
            /* Main Panel */
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '0.7rem', opacity: 0.5, letterSpacing: '1px' }}>ADMIN ACTIVE</span>
                <button onClick={handleLogout} style={{ background: 'transparent', color: '#ff4747', fontSize: '0.75rem', border: '1px solid #ff4747', padding: '4px 10px', borderRadius: '6px' }}>LOGOUT</button>
              </div>

              <h1 style={{ fontWeight: 200, marginBottom: '25px' }}>{editingId ? 'EDITING...' : 'User Management'}</h1>
              
              <form onSubmit={handleSubmitUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="User Name" style={{ padding: '14px', borderRadius: '12px', background: theme.inputBg, color: theme.text }} />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="User Email" style={{ padding: '14px', borderRadius: '12px', background: theme.inputBg, color: theme.text }} />
                <button type="submit" style={{ padding: '14px', borderRadius: '12px', background: editingId ? '#ffcc00' : theme.accent, color: 'black', fontWeight: 'bold' }}>
                  {editingId ? 'SAVE CHANGES' : 'ADD NEW USER'}
                </button>
              </form>

              <input 
                type="text" placeholder="🔍 Search in database..." value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', marginTop: '30px', padding: '12px', borderRadius: '10px', background: theme.inputBg, color: theme.text, boxSizing: 'border-box' }} 
              />

              <div style={{ marginTop: '30px', textAlign: 'left' }}>
                <h3 style={{ fontWeight: 300, opacity: 0.6, fontSize: '0.8rem', marginBottom: '15px' }}>DATABASE RECORDS: {filteredUsers.length}</h3>
                
                {filteredUsers.map(user => (
                  <div key={user.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '12px', 
                    marginBottom: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '15px',
                    border: `1px solid ${theme.cardBorder}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img 
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`} 
                        alt="avatar" 
                        style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(63, 187, 255, 0.1)' }} 
                      />
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 400 }}>{user.name}</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{user.email}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => { playClick(); setEditingId(user.id); setName(user.name); setEmail(user.email); }} style={{ padding: '5px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: theme.text, fontSize: '0.7rem' }}>Edit</button>
                      <button onClick={() => handleDelete(user.id)} style={{ padding: '5px 10px', borderRadius: '6px', background: 'rgba(255,71,71,0.1)', color: '#ff4747', fontSize: '0.7rem' }}>Del</button>
                    </div>
                  </div>
                ))}
                
                {filteredUsers.length === 0 && <p style={{ textAlign: 'center', opacity: 0.4, marginTop: '20px' }}>No records found</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;