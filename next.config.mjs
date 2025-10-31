/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    AFIP_CUIT: process.env.AFIP_CUIT,
    AFIP_CERT_PATH: process.env.AFIP_CERT_PATH,
    AFIP_KEY_PATH: process.env.AFIP_KEY_PATH,
    AFIP_PRODUCTION: process.env.AFIP_PRODUCTION,
  },
};

export default nextConfig;

