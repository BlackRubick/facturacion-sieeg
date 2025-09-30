import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppContext } from '../../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/customers', label: 'Clientes' },
  { path: '/factura-normal', label: 'Factura Normal' },
  { path: '/factura-clientes', label: 'Factura Clientes' },
  { path: '/cfdi-list', label: 'Listar CFDI' }, 
];

const Layout = ({ children }) => {
  const location = useLocation();
  const { state, dispatch } = useContext(AppContext);
  const { user, logout } = useAuth();
  const [sandbox, setSandbox] = useState(true);

  const handleToggleSandbox = () => {
    setSandbox(prev => !prev);
    window.localStorage.setItem('factura_mode', !sandbox ? 'sandbox' : 'production');
    window.location.reload(); // Recarga para aplicar el modo
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-blue-600 text-white p-4 font-bold text-lg flex flex-col sm:flex-row items-center justify-between">
        <span className="mb-2 sm:mb-0">Sistema de Facturación</span>
        <nav className="w-full sm:w-auto">
          <ul className="flex flex-col sm:flex-row gap-2 sm:gap-6 w-full sm:w-auto">
            {navItems.map(item => (
              <li key={item.path} className="w-full sm:w-auto">
                <Link
                  to={item.path}
                  className={`block text-center hover:underline px-2 py-1 rounded ${location.pathname === item.path ? 'bg-blue-800' : ''}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center">
          {user ? (
            <>
              <span className="mr-4">{user.email} ({user.type})</span>
              <button onClick={logout} className="bg-red-500 px-3 py-1 rounded">Salir</button>
            </>
          ) : (
            <>
              <Link to="/login" className="mr-4">Login</Link>
              <Link to="/register">Crear usuario</Link>
            </>
          )}
          <button
            onClick={handleToggleSandbox}
            className={`ml-4 px-3 py-1 rounded font-bold shadow transition-colors ${sandbox ? 'bg-green-500' : 'bg-gray-300 text-blue-700'}`}
          >
            {sandbox ? 'Modo Sandbox' : 'Modo Producción'}
          </button>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6">{children}</main>
      <footer className="bg-gray-200 text-center p-2 text-xs text-gray-600">© 2025 Facturación SIEEG</footer>
    </div>
  );
};

export default Layout;
