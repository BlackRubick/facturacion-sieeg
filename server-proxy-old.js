const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Determinar el entorno basado en la variable de entorno (usar variables sin prefijo VITE_ para el servidor)
const isProduction = process.env.FACTURA_API_ENV === 'produccion';
// Importante: Producción usa https://api.factura.com (sin /api), Sandbox usa https://sandbox.factura.com/api
const targetUrl = isProduction ? 'https://api.factura.com' : 'https://sandbox.factura.com/api';

console.log('🔍 Debug variables de entorno:');
console.log('FACTURA_API_ENV:', process.env.FACTURA_API_ENV);
console.log('isProduction:', isProduction);
console.log('targetUrl:', targetUrl);
console.log(`🚀 Configurando proxy para: ${targetUrl}`);
console.log(`📊 Entorno: ${isProduction ? 'Producción' : 'Sandbox'}`);

// Crear proxies individuales para cada ruta
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
    
    console.log(`🔄 Proxy request: ${req.method} ${req.url} -> ${targetUrl}${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Agregar headers CORS
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Content-Length, X-Requested-With, F-Api-Key, F-Secret-Key, F-PLUGIN, F-Api-Env';
    console.log(`✅ Proxy response: ${proxyRes.statusCode} for ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('❌ Proxy Error:', err.message);
    res.status(500).json({ error: 'Proxy Error', message: err.message });
  }
};

// Crear proxies para cada ruta individualmente
const v1Proxy = createProxyMiddleware(proxyOptions);
const v3Proxy = createProxyMiddleware(proxyOptions);
const v4Proxy = createProxyMiddleware(proxyOptions);
const payrollProxy = createProxyMiddleware(proxyOptions);
  changeOrigin: true,
  secure: true,
  pathRewrite: {
    '^/v1': '/v1',
    '^/v3': '/v3', 
    '^/v4': '/v4',
    '^/payroll': '/payroll',
  },
  onProxyReq: (proxyReq, req, res) => {
    // Agregar headers de autenticación (usar variables sin prefijo VITE_ para el servidor)
    if (process.env.FACTURA_API_KEY) {
      proxyReq.setHeader('F-Api-Key', process.env.FACTURA_API_KEY);
    }
    if (process.env.FACTURA_SECRET_KEY) {
      proxyReq.setHeader('F-Secret-Key', process.env.FACTURA_SECRET_KEY);
    }
    if (process.env.FACTURA_PLUGIN) {
      proxyReq.setHeader('F-PLUGIN', process.env.FACTURA_PLUGIN);
    }
    if (process.env.FACTURA_API_ENV) {
      proxyReq.setHeader('F-Api-Env', process.env.FACTURA_API_ENV);
    }
    proxyReq.setHeader('Content-Type', 'application/json');
    
    console.log(`🔄 Proxy request: ${req.method} ${req.url} -> ${apiBaseUrl}${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Agregar headers CORS
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Content-Length, X-Requested-With, F-Api-Key, F-Secret-Key, F-PLUGIN, F-Api-Env';
  },
  onError: (err, req, res) => {
    console.error('❌ Proxy Error:', err.message);
    res.status(500).json({ error: 'Proxy Error', message: err.message });
  }
});

// Usar el proxy para rutas de API
app.use(facturaApiProxy);

// Servir archivos estáticos del build
app.use(express.static(path.join(__dirname, 'dist')));

// Manejar rutas del frontend (SPA routing)
app.get('*', (req, res) => {
  // Si es una ruta de API, no servir el index.html
  if (req.path.startsWith('/v1') || req.path.startsWith('/v3') || req.path.startsWith('/v4') || req.path.startsWith('/payroll')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, 'dist')}`);
  console.log(`🔗 API proxy: ${apiBaseUrl}`);
});
