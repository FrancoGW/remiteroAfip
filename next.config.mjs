/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Configurar para que PDFKit pueda acceder a sus archivos
      config.externals = [...(config.externals || []), 'canvas', 'bufferutil', 'utf-8-validate'];
    }
    return config;
  },
  env: {
    AFIP_CUIT: process.env.AFIP_CUIT,
    AFIP_CERT_PATH: process.env.AFIP_CERT_PATH,
    AFIP_KEY_PATH: process.env.AFIP_KEY_PATH,
    AFIP_PRODUCTION: process.env.AFIP_PRODUCTION,
    // TusFacturas.app Configuration
    TUSFACTURAS_API_KEY: process.env.TUSFACTURAS_API_KEY,
    TUSFACTURAS_API_TOKEN: process.env.TUSFACTURAS_API_TOKEN,
    TUSFACTURAS_USER_TOKEN: process.env.TUSFACTURAS_USER_TOKEN,
    TUSFACTURAS_WEBHOOK_TOKEN: process.env.TUSFACTURAS_WEBHOOK_TOKEN,
    TUSFACTURAS_BASE_URL: process.env.TUSFACTURAS_BASE_URL,
  },
};

export default nextConfig;

