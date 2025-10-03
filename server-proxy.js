const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Determinar el entorno
const isProduction = process.env.FACTURA_API_ENV === 'produccion';
const targetUrl = isProduction ? 'https://api.factura.com' : 'https://sandbox.factura.com/api';

console.log('🔍 Configuración del servidor:');
console.log('Entorno:', isProduction ? 'Producción' : 'Sandbox');
console.log('Target URL:', targetUrl);
console.log('Puerto:', PORT);

// Configuración del proxy
const proxyOptions = {
  target: targetUrl,
  changeOrigin: true,
  secure: true,
  onProxyReq: (proxyReq, req, res) => {
    // Agregar headers de autenticación
    proxyReq.setHeader('F-Api-Key', process.env.FACTURA_API_KEY);
    proxyReq.setHeader('F-Secret-Key', process.env.FACTURA_SECRET_KEY);
    proxyReq.setHeader('F-PLUGIN', process.env.FACTURA_PLUGIN);
    proxyReq.setHeader('F-Api-Env', process.env.FACTURA_API_ENV);
    proxyReq.setHeader('Content-Type', 'application/json');
    
    console.log(`🔄 ${req.method} ${req.url} -> ${targetUrl}${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Headers CORS
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Content-Length, X-Requested-With, F-Api-Key, F-Secret-Key, F-PLUGIN, F-Api-Env';
    console.log(`✅ ${proxyRes.statusCode} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('❌ Proxy Error:', err.message);
    res.status(500).json({ error: 'Proxy Error', message: err.message });
  }
};

// Aplicar proxy a las rutas de la API
app.use('/v1', createProxyMiddleware(proxyOptions));
app.use('/v3', createProxyMiddleware(proxyOptions));
app.use('/v4', createProxyMiddleware(proxyOptions));
app.use('/payroll', createProxyMiddleware(proxyOptions));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'dist')));

// Middleware para manejar todas las rutas restantes (SPA fallback)
app.use((req, res, next) => {
  // Si es una ruta de API que no fue manejada por el proxy, devolver 404
  if (req.path.startsWith('/v1') || req.path.startsWith('/v3') || req.path.startsWith('/v4') || req.path.startsWith('/payroll')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  
  // Para todas las demás rutas, servir el index.html (SPA routing)
  res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
    if (err) {
      console.error('Error sirviendo index.html:', err);
      res.status(500).send('Error interno del servidor');
    }
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🌐 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📁 Sirviendo archivos desde: ${path.join(__dirname, 'dist')}`);
  console.log(`🔗 Proxy API: ${targetUrl}`);
});
