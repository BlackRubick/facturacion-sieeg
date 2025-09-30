import React from 'react';

const stats = [
  { label: 'Facturas emitidas', value: 128, icon: '\ud83d\udcc4', color: 'bg-blue-100 text-blue-700' },
  { label: 'Clientes registrados', value: 42, icon: '\ud83d\udc64', color: 'bg-green-100 text-green-700' },
  { label: 'Pedidos importados', value: 19, icon: '\ud83d\udce6', color: 'bg-yellow-100 text-yellow-700' },
];

const Dashboard = () => (
  <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-8 py-8">
    <h1 className="text-2xl sm:text-3xl font-bold mb-8 text-blue-700 text-center">Dashboard</h1>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-8">
      {stats.map(s => (
        <div key={s.label} className={`rounded-xl shadow-lg border border-blue-100 p-6 flex flex-col items-center ${s.color} transition hover:scale-105 duration-200`}>
          <span className="text-4xl mb-2">{s.icon}</span>
          <span className="text-2xl font-bold">{s.value}</span>
          <span className="text-sm mt-2 font-medium">{s.label}</span>
        </div>
      ))}
    </div>
    <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 text-center">
      <h2 className="text-xl font-bold mb-4 text-blue-600">Bienvenido al sistema de facturación SIEEG</h2>
      <p className="text-gray-700">Aquí puedes gestionar tus facturas, clientes y pedidos de forma profesional y eficiente.</p>
    </div>
  </div>
);

export default Dashboard;
