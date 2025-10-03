import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = env.VITE_FACTURA_API_ENV === 'produccion';
  const apiBaseUrl = isProduction ? 'https://api.factura.com' : 'https://sandbox.factura.com/api';
  
  console.log(`🔧 Vite Proxy - Entorno: ${isProduction ? 'Producción' : 'Sandbox'}`);
  console.log(`🔧 Vite Proxy - Target: ${apiBaseUrl}`);

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
          headers: {
            'F-Api-Key': env.VITE_FACTURA_API_KEY,
            'F-Secret-Key': env.VITE_FACTURA_SECRET_KEY,
            'F-PLUGIN': env.VITE_FACTURA_PLUGIN,
            'F-Api-Env': env.VITE_FACTURA_API_ENV,
          }
        },
        '/v3': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: true,
          headers: {
            'F-Api-Key': env.VITE_FACTURA_API_KEY,
            'F-Secret-Key': env.VITE_FACTURA_SECRET_KEY,
            'F-PLUGIN': env.VITE_FACTURA_PLUGIN,
            'F-Api-Env': env.VITE_FACTURA_API_ENV,
          }
        },
        '/v4': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: true,
          headers: {
            'F-Api-Key': env.VITE_FACTURA_API_KEY,
            'F-Secret-Key': env.VITE_FACTURA_SECRET_KEY,
            'F-PLUGIN': env.VITE_FACTURA_PLUGIN,
            'F-Api-Env': env.VITE_FACTURA_API_ENV,
          }
        },
        '/payroll': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: true,
          headers: {
            'F-Api-Key': env.VITE_FACTURA_API_KEY,
            'F-Secret-Key': env.VITE_FACTURA_SECRET_KEY,
            'F-PLUGIN': env.VITE_FACTURA_PLUGIN,
            'F-Api-Env': env.VITE_FACTURA_API_ENV,
          }
        },
      },
    },
  };
};
