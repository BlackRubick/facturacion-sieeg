import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/common/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Invoices from './pages/Invoices/Invoices';
import Customers from './pages/Customers/Customers';
import Orders from './pages/Orders/Orders';
import CFDIListPage from './pages/CFDIListPage';
import FacturaNormal from './pages/FacturaNormal';
import FacturaClientes from './pages/FacturaClientes';
import Login from './pages/Login';
import UserRegister from './pages/UserRegister';
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<UserRegister />} />
            <Route path="/factura-clientes" element={
              <ProtectedRoute>
                <FacturaClientes />
              </ProtectedRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <FacturaNormal />
              </ProtectedRoute>
            } />
            <Route path="/invoices" element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <Invoices />
              </ProtectedRoute>
            } />
            <Route path="/factura-normal" element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <FacturaNormal />
              </ProtectedRoute>
            } />
            <Route path="/customers" element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <Customers />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <Orders />
              </ProtectedRoute>
            } />
            <Route path="/cfdi-list" element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <CFDIListPage />
              </ProtectedRoute>
            } />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
