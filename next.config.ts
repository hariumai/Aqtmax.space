
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'sublime.statics.csio.aqtmax.space',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https'
        ,
        hostname: 'images.ctfassets.net',
        port: '',
        pathname: '/**',
      }
    ],
  },
   webpack(config) {
    config.module.rules.push({
      resourceQuery: /raw-loader/,
      type: 'asset/source',
    });
    config.module.rules.push({
      resourceQuery: /public-loader/,
      type: 'asset/source',
      loader: 'raw-loader',
    });
    config.module.rules.push({
      test: /\.rules$/,
      type: 'asset/source',
    });
    return config;
  },
};

export default nextConfig;
