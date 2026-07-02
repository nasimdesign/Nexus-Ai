import { getServerSession } from 'next-auth/next';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '../../lib/prisma';
import NextAuth from 'next-auth';

// This is a very small helper export so server-side code can reuse auth options.
export const authOptions = {
  adapter: PrismaAdapter(prisma),
  // providers are configured in the main [...nextauth].ts file
};

export default NextAuth(authOptions);
