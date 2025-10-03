import React, { useState } from 'react';
import FacturaAPIService from '../services/facturaApi';

const APITestComponent = () => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      console.log('🔍 Probando conexión con credenciales:', {
        'F-Api-Key': import.meta.env.VITE_FACTURA_API_KEY?.substring(0, 20) + '...',
        'F-Secret-Key': import.meta.env.VITE_FACTURA_SECRET_KEY?.substring(0, 20) + '...',
        'F-PLUGIN': import.meta.env.VITE_FACTURA_PLUGIN,
        'F-Api-Env': import.meta.env.VITE_FACTURA_API_ENV,
      });
      
      // Intentar obtener el catálogo de uso CFDI (endpoint simple para probar)
      const response = await FacturaAPIService.getUsoCFDI();
      setTestResult({
        success: true,
        message: 'Conexión exitosa',
        data: response.data
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error.response?.data?.message || error.message,
        error: error.response?.data || error
      });
    }
    
    setLoading(false);
  };

  const testClients = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      const response = await FacturaAPIService.listClients();
      setTestResult({
        success: true,
        message: 'Lista de clientes obtenida',
        data: response.data
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error.response?.data?.message || error.message,
        error: error.response?.data || error
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Prueba de API Factura.com</h2>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Configuración actual:</h3>
        <div className="text-sm space-y-1">
          <div><strong>Entorno:</strong> {import.meta.env.VITE_FACTURA_API_ENV}</div>
          <div><strong>API Key:</strong> {import.meta.env.VITE_FACTURA_API_KEY?.substring(0, 30)}...</div>
          <div><strong>Secret Key:</strong> {import.meta.env.VITE_FACTURA_SECRET_KEY?.substring(0, 30)}...</div>
          <div><strong>Plugin:</strong> {import.meta.env.VITE_FACTURA_PLUGIN}</div>
        </div>
      </div>

      <div className="space-x-4 mb-4">
        <button
          onClick={testConnection}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Probando...' : 'Probar Catálogo UsoCFDI'}
        </button>
        
        <button
          onClick={testClients}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Probando...' : 'Probar Lista Clientes'}
        </button>
      </div>

      {testResult && (
        <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'} border`}>
          <h3 className={`font-semibold ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
            {testResult.success ? '✅ Éxito' : '❌ Error'}
          </h3>
          <p className="mt-2">{testResult.message}</p>
          {testResult.error && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium">Ver detalles del error</summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(testResult.error, null, 2)}
              </pre>
            </details>
          )}
          {testResult.success && testResult.data && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium">Ver respuesta</summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(testResult.data, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
};

export default APITestComponent;
