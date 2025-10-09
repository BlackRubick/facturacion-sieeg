import React, { createContext, useState, useContext, useEffect, useRef } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const sessionTimeoutRef = useRef(null);
  const SESSION_DURATION = 20 * 60 * 1000; // 20 minutos en ms

  const initialUsers = [
    { email: 'admin@mail.com', password: 'admin123', type: 'admin', name: 'Administrador' },
    { email: 'vendedor@mail.com', password: 'vendedor123', type: 'vendedor', name: 'Vendedor' },
  ];

  const API_URL = '/api';

  useEffect(() => {
    // Verifica si hay usuario y token en localStorage al iniciar
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    const expiresAt = localStorage.getItem('expiresAt');
    if (storedUser && storedToken && expiresAt) {
      if (Date.now() < Number(expiresAt)) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } else {
        handleAutoLogout();
      }
    }
    setLoading(false);
  }, []);

  // Revisa expiración cada minuto
  useEffect(() => {
    if (user) {
      sessionTimeoutRef.current = setInterval(() => {
        const expiresAt = localStorage.getItem('expiresAt');
        if (expiresAt && Date.now() > Number(expiresAt)) {
          handleAutoLogout();
        }
      }, 60000); // cada minuto
    } else {
      clearInterval(sessionTimeoutRef.current);
    }
    return () => clearInterval(sessionTimeoutRef.current);
  }, [user]);

  const handleAutoLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('expiresAt');
    // Puedes mostrar un mensaje si quieres
    window.location.href = '/login';
  };

  // Login usando API
  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        localStorage.setItem('expiresAt', String(Date.now() + SESSION_DURATION));
        return true;
      }
    } catch (err) {
      // Si la API falla, sigue con login local
    }
    // Login local (solo si no hay API o para pruebas)
    const found = initialUsers.find(u => u.email === email && u.password === password);
    if (found) {
      setUser(found);
      localStorage.setItem('user', JSON.stringify(found));
      localStorage.setItem('expiresAt', String(Date.now() + SESSION_DURATION));
      return true;
    }
    return false;
  };

  // Logout usando API si lo necesitas
  const logout = async () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('expiresAt');
    // Si tu API requiere logout, descomenta:
    // await fetch(`${API_URL}/logout`, { method: 'POST', headers: { ...getAuthHeaders() } });
  };

  const register = async (email, password, type, name) => {
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ email, password, type, name })
      });
      if (!res.ok) return false;
      return true;
    } catch (err) {
      return false;
    }
  };

  // Funciones locales para pruebas sin API
  let localUsers = [...initialUsers];

  const getUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/users`, {
        headers: { ...getAuthHeaders() }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {}
    return localUsers;
  };

  const deleteUser = async (idOrEmail) => {
    try {
      const res = await fetch(`${API_URL}/users/${idOrEmail}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      });
      if (res.ok) return true;
    } catch (err) {}
    localUsers = localUsers.filter(u => (u.id ? u.id !== idOrEmail : u.email !== idOrEmail));
    return true;
  };

  const updateUser = async (idOrEmail, data) => {
    try {
      const res = await fetch(`${API_URL}/users/${idOrEmail}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data)
      });
      if (res.ok) return true;
    } catch (err) {}
    localUsers = localUsers.map(u => (u.id ? u.id === idOrEmail : u.email === idOrEmail) ? { ...u, ...data } : u);
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading, getUsers, deleteUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
