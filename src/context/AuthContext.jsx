import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

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
      return true;
    } catch (err) {
      return false;
    }
  };

  // Logout usando API si lo necesitas
  const logout = async () => {
    setUser(null);

  };

  const register = async (email, password, type) => {
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, type })
      });
      if (!res.ok) return false;
      return true;
    } catch (err) {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
