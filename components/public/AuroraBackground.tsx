/**
 * The ambient background: three drifting aurora blobs, a faint grid and a
 * noise layer.
 *
 * Deliberately a Server Component with no JavaScript - it is pure CSS, so it
 * costs nothing in the bundle and `prefers-reduced-motion` in globals.css
 * freezes the drift without any media-query listener.
 *
 * Positioned `fixed inset-0 -z-10`: because it is taken out of flow and sits
 * behind the content, no ancestor needs `overflow: hidden` to contain the
 * oversized blurred blobs. That matters - an `overflow: hidden` wrapper here
 * would become a clipping ancestor and cut the neon glows off every card
 * inside it.
 */
export function AuroraBackground({ withGrid = true }: { withGrid?: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-950"
    >
      {/* Aurora blobs. Sized in vmax so they stay oversized on any viewport. */}
      <div className="absolute -top-[22vmax] -left-[12vmax] size-[58vmax] animate-aurora rounded-full bg-neon-violet/22 blur-[100px] will-change-transform" />
      <div className="absolute -top-[8vmax] -right-[16vmax] size-[46vmax] animate-aurora-slow rounded-full bg-neon-cyan/18 blur-[90px] will-change-transform" />
      <div className="absolute -bottom-[26vmax] left-[18vmax] size-[52vmax] animate-aurora rounded-full bg-neon-magenta/14 blur-[110px] will-change-transform [animation-delay:-9s]" />

      {/* Grid, faded out towards the edges with a radial mask. */}
      {withGrid && (
        <div
          className="bg-grid absolute inset-0 opacity-[0.5]"
          style={{
            maskImage: 'radial-gradient(ellipse 85% 65% at 50% 38%, #000 25%, transparent 78%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 85% 65% at 50% 38%, #000 25%, transparent 78%)',
          }}
        />
      )}

      {/* Film grain. An inline SVG turbulence avoids shipping a texture file. */}
      <div
        className="absolute inset-0 opacity-[0.045] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Vignette, so the content never fights the background for contrast. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,transparent_30%,rgba(4,5,10,0.72)_100%)]" />
    </div>
  )
}
