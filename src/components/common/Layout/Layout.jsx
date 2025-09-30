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

  if (isVendedor && location.pathname !== '/factura-normal') {
    window.location.replace('/factura-normal');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-blue-600 text-white px-6 py-4 shadow-md">
        <div className="flex items-center justify-between w-full">
          {/* Logo y título */}
          <div className="flex items-center gap-6">
            <span className="text-xl font-extrabold tracking-wide">Sistema de Facturación</span>
            <nav>
              <ul className="flex gap-6 items-center">
                {/* Opciones para admin */}
                {!isVendedor && navItems.map(item => (
                  (!item.admin || (user && user.type === 'admin')) && (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`block px-4 py-2 rounded-lg font-semibold transition-colors duration-150 hover:bg-blue-700 hover:scale-105 shadow-sm ${location.pathname === item.path ? 'bg-blue-800' : 'bg-blue-600'}`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  )
                ))}
                {/* Opción para vendedor */}
                {isVendedor && location.pathname === '/factura-normal' && (
                  <li>
                    <span className="block px-4 py-2 rounded-lg font-semibold bg-blue-800 shadow-sm">Factura Normal</span>
                  </li>
                )}
              </ul>
            </nav>
          </div>
          {/* Info usuario y acciones */}
          <div className="flex items-center gap-4">
            {!isVendedor && user ? (
              <>
                <span className="text-base font-medium bg-blue-700 px-3 py-1 rounded-lg shadow">{user.email} <span className="text-xs">({user.type})</span></span>
                {user && user.type === 'admin' && (
                  <button onClick={() => setShowUserModal(true)} className="bg-blue-500 px-4 py-2 rounded-lg font-bold shadow hover:bg-blue-700 transition-colors">Agregar usuario</button>
                )}
              </>
            ) : null}
            {!isVendedor && (
              <button
                onClick={handleToggleSandbox}
                className={`px-4 py-2 rounded-lg font-bold shadow transition-colors ${sandbox ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 text-blue-700 hover:bg-gray-400'}`}
              >
                {sandbox ? 'Modo Sandbox' : 'Modo Producción'}
              </button>
            )}
            {user && (
              <button onClick={logout} className="bg-red-500 px-4 py-2 rounded-lg font-bold shadow hover:bg-red-600 transition-colors ml-2">Salir</button>
            )}
          </div>
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
