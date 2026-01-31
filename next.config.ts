import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure proper module resolution for TipTap
  experimental: {
    serverComponentsExternalPackages: ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-placeholder'],
  },
};

export default nextConfig;
