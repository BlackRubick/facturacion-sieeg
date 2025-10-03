const axios = require('axios');
require('dotenv').config();

async function testCredentials() {
  const isProduction = process.env.VITE_FACTURA_API_ENV === 'produccion';
  const baseURL = isProduction ? 'https://api.factura.com' : 'https://sandbox.factura.com/api';
  
  console.log('🔍 Probando credenciales...');
  console.log('🌐 Entorno:', isProduction ? 'Producción' : 'Sandbox');
  console.log('🔗 URL Base:', baseURL);
  console.log('🔑 API Key:', process.env.VITE_FACTURA_API_KEY?.substring(0, 30) + '...');
  console.log('🔐 Secret Key:', process.env.VITE_FACTURA_SECRET_KEY?.substring(0, 30) + '...');
  console.log('🔧 Plugin:', process.env.VITE_FACTURA_PLUGIN);
  console.log('');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      'F-PLUGIN': process.env.VITE_FACTURA_PLUGIN,
      'F-Api-Key': process.env.VITE_FACTURA_API_KEY,
      'F-Secret-Key': process.env.VITE_FACTURA_SECRET_KEY,
      'F-Api-Env': process.env.VITE_FACTURA_API_ENV,
    }
  };

  try {
    console.log('📡 Probando endpoint: /v4/catalogo/UsoCfdi');
    const response = await axios.get(`${baseURL}/v4/catalogo/UsoCfdi`, config);
    console.log('✅ ÉXITO: Credenciales válidas');
    console.log('📊 Respuesta:', {
      status: response.status,
      dataLength: response.data?.data?.length || 0
    });
  } catch (error) {
    console.log('❌ ERROR en /v4/catalogo/UsoCfdi:');
    if (error.response) {
      console.log('📄 Status:', error.response.status);
      console.log('📝 Mensaje:', error.response.data?.message || 'Sin mensaje');
      console.log('📋 Datos completos:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('🔥 Error de conexión:', error.message);
    }
  }

  try {
    console.log('\n📡 Probando endpoint alternativo: /v1/clients');
    const response = await axios.get(`${baseURL}/v1/clients`, config);
    console.log('✅ ÉXITO: Lista de clientes obtenida');
    console.log('📊 Respuesta:', {
      status: response.status,
      clientsCount: response.data?.data?.length || 0
    });
  } catch (error) {
    console.log('❌ ERROR en /v1/clients:');
    if (error.response) {
      console.log('📄 Status:', error.response.status);
      console.log('📝 Mensaje:', error.response.data?.message || 'Sin mensaje');
      console.log('📋 Datos completos:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('🔥 Error de conexión:', error.message);
    }
  }
}

testCredentials();
