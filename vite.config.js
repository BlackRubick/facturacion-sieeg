import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';

export default ({ mode }) => {
  // Cargar variables de entorno
  const env = loadEnv(mode, process.cwd(), '');
  
  // Determinar el entorno basado en la variable de entorno
  const isProduction = env.VITE_FACTURA_API_ENV === 'produccion';
  // Importante: Producción usa https://api.factura.com (sin /api), Sandbox usa https://sandbox.factura.com/api
  const apiBaseUrl = isProduction ? 'https://api.factura.com' : 'https://sandbox.factura.com/api';
  
  console.log(`🔧 Vite Config - Entorno: ${isProduction ? 'Producción' : 'Sandbox'}`);
  console.log(`🔧 Vite Config - API Base URL: ${apiBaseUrl}`);

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 3000,
      proxy: {
        '/v1': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: true,
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              proxyReq.setHeader('F-Api-Key', env.VITE_FACTURA_API_KEY);
              proxyReq.setHeader('F-Secret-Key', env.VITE_FACTURA_SECRET_KEY);
              proxyReq.setHeader('F-PLUGIN', env.VITE_FACTURA_PLUGIN);
              proxyReq.setHeader('F-Api-Env', env.VITE_FACTURA_API_ENV);
              console.log(`🔄 Proxy /v1: ${req.method} ${req.url} -> ${apiBaseUrl}${req.url}`);
            });
          }
        },
        '/v3': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: true,
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              proxyReq.setHeader('F-Api-Key', env.VITE_FACTURA_API_KEY);
              proxyReq.setHeader('F-Secret-Key', env.VITE_FACTURA_SECRET_KEY);
              proxyReq.setHeader('F-PLUGIN', env.VITE_FACTURA_PLUGIN);
              proxyReq.setHeader('F-Api-Env', env.VITE_FACTURA_API_ENV);
              console.log(`🔄 Proxy /v3: ${req.method} ${req.url} -> ${apiBaseUrl}${req.url}`);
            });
          }
        },
        '/v4': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: true,
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              proxyReq.setHeader('F-Api-Key', env.VITE_FACTURA_API_KEY);
              proxyReq.setHeader('F-Secret-Key', env.VITE_FACTURA_SECRET_KEY);
              proxyReq.setHeader('F-PLUGIN', env.VITE_FACTURA_PLUGIN);
              proxyReq.setHeader('F-Api-Env', env.VITE_FACTURA_API_ENV);
              console.log(`🔄 Proxy /v4: ${req.method} ${req.url} -> ${apiBaseUrl}${req.url}`);
            });
          }
        },
        '/payroll': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: true,
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              proxyReq.setHeader('F-Api-Key', env.VITE_FACTURA_API_KEY);
              proxyReq.setHeader('F-Secret-Key', env.VITE_FACTURA_SECRET_KEY);
              proxyReq.setHeader('F-PLUGIN', env.VITE_FACTURA_PLUGIN);
              proxyReq.setHeader('F-Api-Env', env.VITE_FACTURA_API_ENV);
              console.log(`🔄 Proxy /payroll: ${req.method} ${req.url} -> ${apiBaseUrl}${req.url}`);
            });
          }
        },
      },
    },
  };
};
