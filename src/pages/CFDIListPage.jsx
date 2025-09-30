import React from 'react';
import ListCFDI from '../components/ListCFDI';

const CFDIListPage = () => {
  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-blue-700 text-center">Listar CFDI</h1>
        <ListCFDI />
      </div>
    </div>
  );
};

export default CFDIListPage;
