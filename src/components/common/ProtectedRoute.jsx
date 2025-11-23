import React from 'react';
import { useAuth } from '../../context/AuthContext';
import NotFound from '../../pages/NotFound';

const ProtectedRoute = ({ children, allowedTypes }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  // If there's no user, show 404 (instead of redirecting to login)
  if (!user) return <NotFound />;
  // If user exists but is not allowed, show 404 as well
  if (allowedTypes && !allowedTypes.includes(user.type)) return <NotFound />;
  return children;
};

export default ProtectedRoute;
