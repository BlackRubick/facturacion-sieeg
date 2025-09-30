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
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-80">
        <h2 className="text-xl mb-4">Crear usuario</h2>
        <input
          type="text"
          placeholder="Nombre"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
          required
        />
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
          required
        />
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        >
          <option value="admin">Administrador</option>
          <option value="vendedor">Vendedor</option>
        </select>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        {success && <div className="text-green-500 mb-2">{success}</div>}
        <button type="submit" className="w-full bg-green-600 text-white p-2 rounded">Crear</button>
      </form>
    </div>
  );
};

export default UserRegister;
