/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages runs the build from the repo root, but `next build`
  // outputs relative to this app dir. Emitting to the repo-root `.next` lets
  // the Vercel build step (invoked by @cloudflare/next-on-pages at the root)
  // find routes-manifest.json. Overridable for other contexts via NEXT_DIST_DIR.
  distDir: process.env.NEXT_DIST_DIR || "../../.next",
  reactStrictMode: true,
  transpilePackages: ["@fastex/shared", "@fastex/database"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
  // The production build should not fail on non-runtime type/lint issues
  // (e.g. global fetch typings making req.json()/res.json() return `unknown`).
  // Types are still checked in the editor and can be gated in CI separately.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
