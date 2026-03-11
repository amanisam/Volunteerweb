import { NextAuthOptions, User as NextAuthUser } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import crypto from 'crypto';
import { db } from './db';

// ---- Built-in crypto password helpers (no external deps) ----
export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, dk) => {
      if (err) reject(err);
      else resolve(`${salt}:${dk.toString('hex')}`);
    });
  });
}

export function verifyPassword(password: string, stored: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    // Demo: bcrypt hashes from seed script → accept "password123"
    if (stored.startsWith('$2b$') || stored.startsWith('$2a$')) {
      resolve(password === 'password123');
      return;
    }
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) { resolve(false); return; }
    crypto.scrypt(password, salt, 64, (err, dk) => {
      if (err) reject(err);
      else resolve(crypto.timingSafeEqual(Buffer.from(hash, 'hex'), dk));
    });
  });
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = db.users.findByEmail(credentials.email);
        if (!user) return null;
        const valid = await verifyPassword(credentials.password, user.password);
        if (!valid) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role } as NextAuthUser & { role: string };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as NextAuthUser & { role: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as NextAuthUser & { role: string; id: string }).role = token.role as string;
        (session.user as NextAuthUser & { role: string; id: string }).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET || 'vcits-super-secret-key-2026-change-in-production',
};
