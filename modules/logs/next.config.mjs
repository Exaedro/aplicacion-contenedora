/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      // incluir el host/puerto que aparece en x-forwarded-host o en origin
      allowedOrigins: ['localhost', '127.0.0.1', '0.0.0.0', 'localhost:3000'],
    },
  },
}

export default nextConfig
