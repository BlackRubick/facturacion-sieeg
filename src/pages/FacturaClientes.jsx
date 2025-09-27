import React from 'react';
import CFDIGlobalForm from '../components/forms/CFDIGlobalForm';

const FacturaClientes = () => (
  <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 className="text-3xl font-extrabold mb-8 text-blue-700 text-center">Factura Clientes</h1>
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-bold mb-4 text-blue-600">CFDI Clientes</h2>
      <CFDIGlobalForm />
    </div>
  </div>
);

export default FacturaClientes;
