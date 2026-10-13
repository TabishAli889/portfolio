import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,

  /**
   * Hides the floating Next.js dev indicator in the bottom-left corner.
   * It only ever renders during `next dev` - it is not part of a production
   * build - but it sits on top of the page while you are working. Compile and
   * runtime errors are still surfaced in the overlay.
   */
  devIndicators: false,

  /**
   * `next/image` refuses to optimise a remote host that is not listed here.
   * Uploads land on res.cloudinary.com, so that host is allowed - scoped to
   * this deployment's own cloud name where it is known, so the image
   * optimiser cannot be used as an open proxy for other Cloudinary accounts.
   *
   * Any other host (an image URL pasted into the admin instead of uploaded)
   * is rendered with `unoptimized`, which skips both the optimiser and this
   * check. See `isOptimizable` in lib/images.ts.
   */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: process.env.CLOUDINARY_CLOUD_NAME
          ? `/${process.env.CLOUDINARY_CLOUD_NAME}/**`
          : '/**',
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
