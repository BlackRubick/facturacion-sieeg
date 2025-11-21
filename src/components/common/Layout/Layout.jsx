import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppContext } from '../../../context/AppContext';
import { useAuth } from '../../../context/AuthContext';

const navItems = [
  { path: '/customers', label: 'Clientes' },
  { path: '/factura-normal', label: 'Facturacion Electrónica' },
  { path: '/factura-clientes', label: 'Factura Clientes' },
  { path: '/cfdi-list', label: 'Listar CFDI' },
  { path: '/users-manager', label: 'Gestionar Usuarios', admin: true },
];

const Layout = ({ children }) => {
  const location = useLocation();
  const { state, dispatch } = useContext(AppContext);
  const { user, logout } = useAuth();
  const isProduction = import.meta.env.VITE_FACTURA_API_ENV === 'produccion';
  const [sandbox, setSandbox] = useState(!isProduction);
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
  const isFacturaClientesPublic = location.pathname === '/factura-clientes' && !user;
  const isFacturaClientesVendedor = location.pathname === '/factura-clientes' && user && user.type === 'vendedor';
  const isFacturaNormalVendedor = location.pathname === '/factura-normal' && user && user.type === 'vendedor';

  if (hideLayout) {
    return <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">{children}</div>;
  }

  if (isVendedor && location.pathname !== '/factura-normal' && location.pathname !== '/factura-clientes') {
    window.location.replace('/factura-normal');
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col w-full">
      {!(isFacturaClientesPublic || isFacturaClientesVendedor || isFacturaNormalVendedor) && (
        <header className="bg-white text-black px-2 sm:px-4 py-2 shadow-sm w-full border-b">
          <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-7xl mx-auto gap-2">
            {/* Logo y título */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <img src="/SIEEGNEW.png" alt="SIEEG" className="h-8 w-auto" />
              <nav className="w-full sm:w-auto">
                <ul className="flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto">
                  {/* Opciones para admin */}
                  {!isVendedor && navItems.map(item => (
                    (!item.admin || (user && user.type === 'admin')) && (
                      <li key={item.path} className="w-full sm:w-auto">
                        <Link
                          to={item.path}
                          className={`block px-3 py-1 rounded-md font-medium transition-colors duration-150 hover:bg-blue-700 hover:scale-105 shadow-sm text-sm w-full sm:w-auto text-center text-white ${location.pathname === item.path ? 'bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                          {item.label}
                        </Link>
                      </li>
                    )
                  ))}
                  {/* Opción para vendedor */}
                  {isVendedor && location.pathname === '/factura-normal' && (
                    <li className="w-full sm:w-auto">
                      <span className="block px-3 py-1 rounded-md font-medium bg-blue-600 text-white shadow-sm text-sm w-full sm:w-auto text-center">Factura Normal</span>
                    </li>
                  )}
                </ul>
              </nav>
            </div>
            {/* Info usuario y acciones */}
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              {!isVendedor && user ? (
                <>
                  <span className="text-sm font-medium bg-blue-500 text-white px-2 py-1 rounded shadow w-full sm:w-auto text-center">{user.email} <span className="text-xs">({user.type})</span></span>
                  {user && user.type === 'admin' && (
                    <button onClick={() => setShowUserModal(true)} className="bg-blue-600 text-white px-3 py-1 rounded font-semibold shadow hover:bg-blue-700 transition-colors text-sm w-full sm:w-auto text-center">Agregar usuario</button>
                  )}
                </>
              ) : null}
              {!isVendedor && (
                <button
                  onClick={handleToggleSandbox}
                  className={`px-3 py-1 rounded font-semibold shadow transition-colors text-sm w-full sm:w-auto text-center ${sandbox ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                >
                  {sandbox ? 'Sandbox' : 'Producción'}
                </button>
              )}
              {user && (
                <button onClick={logout} className="bg-red-500 text-white px-3 py-1 rounded font-semibold shadow hover:bg-red-600 transition-colors text-sm w-full sm:w-auto text-center ml-0 sm:ml-1">Salir</button>
              )}
            </div>
          </div>
        </header>
      )}
      <main className="flex-1 p-2 sm:p-4 md:p-6 max-w-7xl mx-auto w-full">{children}</main>
      <footer className="bg-gray-100 text-center p-2 text-xs text-gray-500 border-t w-full">© 2025 Facturación SIEEG</footer>
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <form onSubmit={handleUserSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-xs relative">
            <button type="button" onClick={() => setShowUserModal(false)} className="absolute top-2 right-2 text-gray-500">✕</button>
            <h2 className="text-lg mb-4 font-semibold text-blue-700">Agregar usuario</h2>
            <input
              type="text"
              name="name"
              placeholder="Nombre"
              value={newUser.name}
              onChange={handleUserInput}
              className="w-full mb-2 p-2 border rounded text-sm"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Correo"
              value={newUser.email}
              onChange={handleUserInput}
              className="w-full mb-2 p-2 border rounded text-sm"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              value={newUser.password}
              onChange={handleUserInput}
              className="w-full mb-2 p-2 border rounded text-sm"
              required
            />
            <select
              name="type"
              value={newUser.type}
              onChange={handleUserInput}
              className="w-full mb-2 p-2 border rounded text-sm"
            >
              <option value="admin">Administrador</option>
              <option value="vendedor">Vendedor</option>
            </select>
            {userMsg && <div className="mb-2 text-green-600 text-sm">{userMsg}</div>}
            <button type="submit" className="w-full bg-blue-700 text-white p-2 rounded font-semibold text-sm">Agregar</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Layout;
