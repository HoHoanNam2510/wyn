import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { authConfig } from '@/auth.config';
import { db } from '@/lib/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  trustHost: true,
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
  },
  // must come last — nothing in authConfig should override this
  secret: process.env.AUTH_SECRET,
});
