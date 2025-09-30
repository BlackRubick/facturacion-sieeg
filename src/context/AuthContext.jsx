import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica si hay usuario en localStorage al iniciar
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Login usando API
  const login = async (email, password) => {
    try {
      // Reemplaza la URL por la de tu API
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) return false;
      const data = await res.json();
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      return true;
    } catch (err) {
      return false;
    }
  };

  // Logout usando API si lo necesitas
  const logout = async () => {
    setUser(null);
    localStorage.removeItem('user');
    // Si tu API requiere logout, descomenta:
    // await fetch('/api/logout', { method: 'POST' });
  };

  const register = async (email, password, type, name) => {
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, type, name })
      });
      if (!res.ok) return false;
      return true;
    } catch (err) {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
