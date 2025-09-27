import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/common/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Invoices from './pages/Invoices/Invoices';
import Customers from './pages/Customers/Customers';
import Orders from './pages/Orders/Orders';
import CFDIListPage from './pages/CFDIListPage';
import FacturaNormal from './pages/FacturaNormal';
import FacturaClientes from './pages/FacturaClientes';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<FacturaNormal />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/factura-normal" element={<FacturaNormal />} />
          <Route path="/factura-clientes" element={<FacturaClientes />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/cfdi-list" element={<CFDIListPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
