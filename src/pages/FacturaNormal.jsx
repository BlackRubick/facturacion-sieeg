import React from 'react';
import CFDIForm from '../components/forms/CFDIForm';

const FacturaNormal = () => (
  <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8 py-8">
    <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 sm:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-6 text-center">Facturacion Electrónica</h1>
      <CFDIForm />
    </div>
  </div>
);

export default FacturaNormal;
