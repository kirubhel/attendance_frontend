import type { NextConfig } from "next";
import path from "path";
import webpack from "webpack";

const nextConfig: NextConfig = {
  // Turbopack configuration for Next.js 16
  turbopack: {
    resolveAlias: {
      '@backend': path.resolve(__dirname, './backend'),
    },
  },
  // Webpack fallback for compatibility
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@backend': path.resolve(__dirname, './backend'),
    };
    
    // Prioritize frontend node_modules over backend node_modules
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      'node_modules',
    ];
    
    // Don't resolve from backend node_modules
    config.resolve.symlinks = false;
    
    // Ignore optional dependencies that might cause issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'aws4': false,
      'kerberos': false,
      'snappy': false,
      '@mongodb-js/zstd': false,
    };
    
    // Ignore binary files (.node files) that can't be processed by webpack
    // These are native modules that should only run on the server
    if (isServer) {
      const originalExternals = config.externals;
      config.externals = [
        ...(Array.isArray(originalExternals) ? originalExternals : originalExternals ? [originalExternals] : []),
        ({ request }: any, callback: any) => {
          // Ignore .node files and native MongoDB modules
          if (
            /\.node$/.test(request) ||
            request.includes('@mongodb-js/zstd') ||
            request.includes('kerberos') ||
            request.includes('snappy') ||
            request.includes('aws4')
          ) {
            return callback(null, `commonjs ${request}`);
          }
          if (typeof originalExternals === 'function') {
            return originalExternals({ request }, callback);
          }
          callback();
        },
      ];
    } else {
      // For client-side, completely ignore these modules
      config.resolve.alias = {
        ...config.resolve.alias,
        '@mongodb-js/zstd': false,
        'kerberos': false,
        'snappy': false,
        'aws4': false,
      };
    }
    
    // Add rule to ignore .node files completely (binary files can't be processed)
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    
    // Ignore .node binary files
    config.module.rules.push({
      test: /\.node$/,
      use: {
        loader: 'null-loader',
      },
    });
    
    // Use webpack's IgnorePlugin for native modules
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\.node$/,
        contextRegExp: /node_modules\/@mongodb-js\/zstd/,
      })
    );
    
    return config;
  },
};

export default nextConfig;
