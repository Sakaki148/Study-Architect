import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse', 'mammoth', 'jszip'],
  outputFileTracingIncludes: {
    '/api/**/*': [
      './node_modules/**/*.pdf', 
      './node_modules/pdf-parse/test/data/**/*.pdf',
      './node_modules/pdfjs-dist/**/*'
    ],
  },
};

export default nextConfig;
