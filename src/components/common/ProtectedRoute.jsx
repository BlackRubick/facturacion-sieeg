import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const ProtectedRoute = ({ children, allowedTypes }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;
  if (allowedTypes && !allowedTypes.includes(user.type)) return <Navigate to="/factura-clientes" />;
  return children;
};

export default ProtectedRoute;
