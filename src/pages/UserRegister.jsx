import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const UserRegister = () => {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [type, setType] = useState('vendedor');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const ok = await register(email, password, type, name);
    if (ok) {
      setSuccess('Usuario creado correctamente');
      setEmail('');
      setPassword('');
      setType('vendedor');
      setName('');
    } else {
      setError('El correo ya existe o hubo un error');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-2">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 sm:p-8 w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-blue-700 text-center">Crear usuario</h2>
        <input
          type="text"
          placeholder="Nombre"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full mb-3 p-2 border border-blue-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full mb-3 p-2 border border-blue-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full mb-3 p-2 border border-blue-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="w-full mb-3 p-2 border border-blue-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="admin">Administrador</option>
          <option value="vendedor">Vendedor</option>
        </select>
        {error && <div className="text-red-500 mb-2 text-sm">{error}</div>}
        {success && <div className="text-green-600 mb-2 text-sm">{success}</div>}
        <button type="submit" className="w-full bg-blue-700 text-white p-2 rounded font-semibold text-sm shadow hover:bg-blue-800 transition-colors">Registrar</button>
      </form>
    </div>
  );
};

export default UserRegister;
