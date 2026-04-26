import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: '/sign-in',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnApp =
        nextUrl.pathname.startsWith('/dashboard') ||
        nextUrl.pathname.startsWith('/words') ||
        nextUrl.pathname.startsWith('/categories') ||
        nextUrl.pathname.startsWith('/review') ||
        nextUrl.pathname.startsWith('/stats');
      if (isOnApp) return isLoggedIn;
      if (isLoggedIn && nextUrl.pathname === '/sign-in') {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
  },
};
