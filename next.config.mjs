import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Configurar para que PDFKit pueda acceder a sus archivos
      config.externals = [...(config.externals || []), 'canvas', 'bufferutil', 'utf-8-validate'];
      
      // Copiar las fuentes de PDFKit a una ubicación accesible en producción
      // Las copiamos al directorio de output del servidor
      const pdfkitFontsSource = path.join(__dirname, 'node_modules/pdfkit/js/data');
      if (fs.existsSync(pdfkitFontsSource)) {
        config.plugins.push(
          new CopyWebpackPlugin({
            patterns: [
              {
                from: pdfkitFontsSource,
                to: 'pdfkit-fonts', // Relativo al output.path del servidor
                noErrorOnMissing: true,
              },
            ],
          })
        );
      }
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

