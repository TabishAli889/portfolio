import type { NextAuthConfig } from 'next-auth'

/**
 * Edge-safe half of the Auth.js configuration.
 *
 * `proxy.ts` runs in the edge runtime and must not import Mongoose or bcrypt,
 * so the Credentials provider (which needs both) lives in `auth.ts` instead.
 * This file holds only what both runtimes need: cookie/session settings, the
 * custom sign-in page and the `authorized` callback.
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  session: {
    strategy: 'jwt',
    // Session expiry: 8 hours, refreshed at most once an hour while active.
    maxAge: 60 * 60 * 8,
    updateAge: 60 * 60,
  },
  callbacks: {
    /**
     * Consulted by the `auth()` wrapper in `proxy.ts`. Returning false for an
     * unauthenticated /admin request makes Auth.js redirect to the sign-in page.
     */
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user)
      const { pathname } = request.nextUrl

      if (pathname === '/admin/login') {
        // Already signed in? Skip the login form.
        if (isLoggedIn) {
          return Response.redirect(new URL('/admin', request.nextUrl))
        }
        return true
      }

      if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
        return isLoggedIn
      }

      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.role = 'admin'
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as string | undefined) ?? 'admin'
      }
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig
