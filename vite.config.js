import react from '@vitejs/plugin-react';

/** @type {import('vite').UserConfig} */
export default {
  plugins: [react()],
  server: {
    proxy: {
      '/v1': {
        target: 'https://sandbox.factura.com/api',
        changeOrigin: true,
        secure: true,
      },
      '/v3': {
        target: 'https://sandbox.factura.com/api',
        changeOrigin: true,
        secure: true,
      },
      '/v4': {
        target: 'https://sandbox.factura.com/api',
        changeOrigin: true,
        secure: true,
      },
      '/payroll': {
        target: 'https://sandbox.factura.com/api',
        changeOrigin: true,
        secure: true,
      },
    },
  },
};
