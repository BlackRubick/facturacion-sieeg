import react from '@vitejs/plugin-react';

/** @type {import('vite').UserConfig} */
export default {
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    // Removemos el proxy complejo para usar conexiones directas
  },
};
