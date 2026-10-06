/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  async rewrites() {
    const target = process.env.API_PROXY_URL;
    return target ? [{ source: '/api/:path*', destination: `${target.replace(/\/$/, '')}/api/:path*` }] : [];
  },
};