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
          src="https://scontent.fvsa3-1.fna.fbcdn.net/v/t39.30808-6/515292611_1284277727032591_8320234014361064430_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeGdanYlcmHYPjafcCDzEzzlyJok2LBdrCLImiTYsF2sIrkE24XlUQfRwY_PgjExbMm3s95yZmeK5JNz6tE-Up4Z&_nc_ohc=5ztiVbOUyp0Q7kNvwFq6qMG&_nc_oc=Adk8soL-EgZlUlNdHaxEUPxfgHB2IjG5O-s3ibSKdA6nqoE2Xj2pCHie-7V2c1nB9LU&_nc_zt=23&_nc_ht=scontent.fvsa3-1.fna&_nc_gid=DZT-u_jS_qXgydy6k4m1ow&oh=00_Afbh2xXI1MrAd5DqLAt2E3SjNEsVmZ0jU5_E6b9RNiZQWQ&oe=68E15EBA"
          alt="Logo"
          className="w-32 h-32 object-cover rounded-full mt-2 mb-4 shadow-lg border-4 border-blue-200"
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
