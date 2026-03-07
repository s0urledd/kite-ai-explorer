/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["*"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.gokite.ai" },
    ],
  },
  webpack: (config) => {
    // Fix missing optional dependencies from WalletConnect / MetaMask SDK
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "pino-pretty": false,
      "@react-native-async-storage/async-storage": false,
    };
    // Suppress WalletConnect externals that aren't needed in browser
    config.externals.push("pino-pretty", "encoding");
    return config;
  },
};

export default nextConfig;
