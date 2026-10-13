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
