import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      navigate('/');
    } else {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-blue-100 to-blue-200">
      <div className="bg-white rounded-xl shadow-2xl border border-blue-100 w-full max-w-md p-8 flex flex-col items-center mx-2">
        <img
          src="/SIEEG NEW.png"
          alt="Logo SIEEG"
          className="h-20 object-contain mt-2 mb-6 shadow-lg"
        />
        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-6 text-blue-700 text-center">Iniciar sesión</h2>
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full mb-3 p-2 border border-blue-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full mb-3 p-2 border border-blue-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
            required
          />
          {loading && <div className="text-blue-500 mb-2 text-sm text-center">Verificando...</div>}
          {error && <div className="text-red-500 mb-2 text-sm text-center">{error}</div>}
          <button type="submit" className="w-full bg-blue-700 text-white p-2 rounded font-semibold text-sm shadow hover:bg-blue-800 transition-colors mt-2">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
