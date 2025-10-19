import type { NextConfig } from "next";
// Use require to avoid TS type resolution for webpack in config file
// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require("webpack");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // ⚡ Performance Optimizations
  reactStrictMode: true, // Enable React strict mode
  
  // External packages for server components
  serverExternalPackages: ['mongoose', 'bcryptjs'],
  
  // Pin tracing root to this project (prevents parent lockfile confusion)
  outputFileTracingRoot: path.resolve(__dirname),
  
  // ⚡ Faster builds with caching (no experimental optimizePackageImports to avoid SSR bundling issues)
  
  // ⚡ Development mode optimizations
  ...(process.env.NODE_ENV === 'development' && {
    // Faster refresh in development
    onDemandEntries: {
      maxInactiveAge: 60 * 1000, // 1 minute
      pagesBufferLength: 5,
    },
  }),
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      // YouTube thumbnails
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      },
      // Reddit images
      {
        protocol: 'https',
        hostname: 'external-preview.redd.it',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'a.thumbs.redditmedia.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'b.thumbs.redditmedia.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'preview.redd.it',
        port: '',
        pathname: '/**',
      },
      // CoinGecko images
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'coin-images.coingecko.com',
        port: '',
        pathname: '/**',
      },
      // NewsAPI images (various sources)
      {
        protocol: 'https',
        hostname: '**.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '**.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Disable telemetry in production
  ...(process.env.NODE_ENV === 'production' && {
    compiler: {
      removeConsole: {
        exclude: ['error', 'warn'],
      },
    },
  }),
  
  // ⚡ Webpack optimizations for faster compilation
  webpack: (config, { dev, isServer }) => {
    // Fix for "self is not defined" error with client-only packages
    if (isServer) {
      // Add fallbacks for Node.js modules not available in browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        os: false,
        path: false,
      };
      
      // Ensure webpack uses a safe global object on server
      // Avoids references to 'self' in generated bundles
      config.output = {
        ...config.output,
        globalObject: 'globalThis',
      };
      
      // Define global 'self' in Node.js to satisfy browser-targeted libs
      config.plugins = config.plugins || [];
      config.plugins.push(new webpack.DefinePlugin({
        self: 'globalThis',
      }));
      // Ensure 'self' exists at top of every server chunk (including vendor)
      config.plugins.push(new webpack.BannerPlugin({
        banner: 'var self = globalThis;',
        raw: true,
        entryOnly: false,
      }));
      
      // CRITICAL: Mark browser-only packages as external for server
      // This prevents them from being bundled in server code
      if (!config.externals) {
        config.externals = [];
      }
      
      if (Array.isArray(config.externals)) {
        config.externals.push(({request}: any, callback: any) => {
          if (request === 'socket.io-client' || request?.startsWith('socket.io-client/')) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        });
      }
    }
    
    // Client-side fallbacks
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    // Optimize builds (client only). Avoid custom splitChunks on server to prevent vendor.js SSR issues
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
      };
    }
    
    // Faster rebuilds in development
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    
    return config;
  },
};

export default nextConfig;
