import react from '@vitejs/plugin-react';

// Determinar el entorno basado en la variable de entorno
const isProduction = process.env.VITE_FACTURA_API_ENV === 'produccion';
// Importante: Producción usa https://api.factura.com (sin /api), Sandbox usa https://sandbox.factura.com/api
const apiBaseUrl = isProduction ? 'https://api.factura.com' : 'https://sandbox.factura.com/api';

/** @type {import('vite').UserConfig} */
export default {
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000, // Puedes cambiar a 80 si lo prefieres y tienes permisos
    proxy: {
      '/v1': {
        target: apiBaseUrl,
        changeOrigin: true,
        secure: true,
      },
      '/v3': {
        target: apiBaseUrl,
        changeOrigin: true,
        secure: true,
      },
      '/v4': {
        target: apiBaseUrl,
        changeOrigin: true,
        secure: true,
      },
      '/payroll': {
        target: apiBaseUrl,
        changeOrigin: true,
        secure: true,
      },
    },
  },
};
