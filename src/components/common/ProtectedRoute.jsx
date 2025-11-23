import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedTypes }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  // If there's no user, redirect to top-level 404 route (so Layout isn't shown)
  if (!user) return <Navigate to="/404" replace />;
  // If user exists but is not allowed, redirect to 404 as well
  if (allowedTypes && !allowedTypes.includes(user.type)) return <Navigate to="/404" replace />;
  return children;
};

export default ProtectedRoute;
