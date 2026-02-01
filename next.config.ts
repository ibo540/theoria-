import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure proper module resolution for TipTap
  serverExternalPackages: [
    '@tiptap/react',
    '@tiptap/starter-kit',
    '@tiptap/extension-placeholder',
    '@tiptap/extension-bubble-menu',
    '@tiptap/extension-floating-menu',
    '@tiptap/core',
    '@tiptap/pm',
  ],
};

export default nextConfig;
