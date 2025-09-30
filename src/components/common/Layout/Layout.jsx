import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppContext } from '../../../context/AppContext';
import { useAuth } from '../../../context/AuthContext';

const navItems = [
  { path: '/customers', label: 'Clientes' },
  { path: '/factura-normal', label: 'Factura Normal' },
  { path: '/factura-clientes', label: 'Factura Clientes' },
  { path: '/cfdi-list', label: 'Listar CFDI' },
  { path: '/users-manager', label: 'Gestionar Usuarios', admin: true },
];

const Layout = ({ children }) => {
  const location = useLocation();
  const { state, dispatch } = useContext(AppContext);
  const { user, logout } = useAuth();
  const [sandbox, setSandbox] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', type: 'vendedor' });
  const [userMsg, setUserMsg] = useState('');
  const { register } = useAuth();

  const handleToggleSandbox = () => {
    setSandbox(prev => !prev);
    window.localStorage.setItem('factura_mode', !sandbox ? 'sandbox' : 'production');
    window.location.reload(); // Recarga para aplicar el modo
  };

  const handleUserInput = e => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleUserSubmit = async e => {
    e.preventDefault();
    setUserMsg('');
    const ok = await register(newUser.email, newUser.password, newUser.type, newUser.name);
    if (ok) {
      setUserMsg('Usuario creado correctamente');
      setNewUser({ name: '', email: '', password: '', type: 'vendedor' });
    } else {
      setUserMsg('Error al crear usuario');
    }
  };

  const isVendedor = user && user.type === 'vendedor';
  const hideLayout = location.pathname === '/login' || location.pathname === '/register';

  if (hideLayout) {
    return <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-blue-600 text-white p-4 font-bold text-lg flex flex-col sm:flex-row items-center justify-between">
        <span className="mb-2 sm:mb-0">Sistema de Facturación</span>
        <nav className="w-full sm:w-auto">
          <ul className="flex flex-col sm:flex-row gap-2 sm:gap-6 w-full sm:w-auto">
            {!isVendedor && navItems.map(item => (
              (!item.admin || (user && user.type === 'admin')) && (
                <li key={item.path} className="w-full sm:w-auto">
                  <Link
                    to={item.path}
                    className={`block text-center hover:underline px-2 py-1 rounded ${location.pathname === item.path ? 'bg-blue-800' : ''}`}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            ))}
            {isVendedor && (
              <li className="w-full sm:w-auto">
                <Link
                  to="/factura-normal"
                  className={`block text-center hover:underline px-2 py-1 rounded ${location.pathname === '/factura-normal' ? 'bg-blue-800' : ''}`}
                >
                  Factura Normal
                </Link>
              </li>
            )}
          </ul>
        </nav>
        <div className="flex items-center">
          {!isVendedor && user ? (
            <>
              <span className="mr-4">{user.email} ({user.type})</span>
              <button onClick={logout} className="bg-red-500 px-3 py-1 rounded">Salir</button>
              {user && user.type === 'admin' && (
                <button onClick={() => setShowUserModal(true)} className="bg-blue-500 px-3 py-1 rounded ml-4">Agregar usuario</button>
              )}
            </>
          ) : null}
          {!isVendedor && (
            <button
              onClick={handleToggleSandbox}
              className={`ml-4 px-3 py-1 rounded font-bold shadow transition-colors ${sandbox ? 'bg-green-500' : 'bg-gray-300 text-blue-700'}`}
            >
              {sandbox ? 'Modo Sandbox' : 'Modo Producción'}
            </button>
          )}
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6">{children}</main>
      <footer className="bg-gray-200 text-center p-2 text-xs text-gray-600">© 2025 Facturación SIEEG</footer>
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <form onSubmit={handleUserSubmit} className="bg-white p-6 rounded shadow-md w-80 relative">
            <button type="button" onClick={() => setShowUserModal(false)} className="absolute top-2 right-2 text-gray-500">✕</button>
            <h2 className="text-xl mb-4">Agregar usuario</h2>
            <input
              type="text"
              name="name"
              placeholder="Nombre"
              value={newUser.name}
              onChange={handleUserInput}
              className="w-full mb-2 p-2 border rounded"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Correo"
              value={newUser.email}
              onChange={handleUserInput}
              className="w-full mb-2 p-2 border rounded"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              value={newUser.password}
              onChange={handleUserInput}
              className="w-full mb-2 p-2 border rounded"
              required
            />
            <select
              name="type"
              value={newUser.type}
              onChange={handleUserInput}
              className="w-full mb-2 p-2 border rounded"
            >
              <option value="admin">Administrador</option>
              <option value="vendedor">Vendedor</option>
            </select>
            {userMsg && <div className="mb-2 text-green-600">{userMsg}</div>}
            <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Agregar</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Layout;
