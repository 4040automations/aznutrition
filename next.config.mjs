/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.openfoodfacts.org" },
      { protocol: "https", hostname: "*.openfoodfacts.net" },
    ],
  },
};

export default nextConfig;
