import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { authConfig } from "./auth.config"
import { checkLoginRateLimit, recordLoginAttempt, resetLoginAttempts } from "@/lib/rate-limit"
import { loginSchema } from "@/lib/validations"

/**
 * Masks an email for safe logging (e.g. u***@example.com)
 */
function maskEmail(email) {
    if (!email) return "unknown";
    const [local, domain] = email.split("@");
    if (!domain) return local.substring(0, 1) + "***";
    return local.substring(0, 1) + "***@" + domain;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        console.log("[AUTH-CALLBACK] Authorize callback started");
        const parsedCredentials = loginSchema.safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          
          // Check rate limit
          const rateLimit = checkLoginRateLimit(email);
          if (!rateLimit.allowed) {
            console.log(`[AUTH-CALLBACK] Login rate limited for ${email}`);
            return null;
          }

          try {
            const user = await db.user.findUnique({ where: { email } });
            
            if (!user || !user.password) {
              console.log("[AUTH-CALLBACK] User not found or no password hash");
              recordLoginAttempt(email);
              return null;
            }
            
            // Check if user is banned
            if (user.bannedAt) {
              console.log("[AUTH-CALLBACK] User is banned:", email);
              return null;
            }
            
            const passwordsMatch = await bcrypt.compare(password, user.password);

            if (passwordsMatch) {
              console.log("[AUTH-CALLBACK] Password match confirmed for:", email);
              resetLoginAttempts(email);

              // Update lastLogin timestamp
              await db.user.update({
                where: { id: user.id },
                data: { 
                  lastLogin: new Date(),
                  failedLoginAttempts: 0 
                }
              });
              
              return user;
            } else {
              console.log("[AUTH-CALLBACK] Password mismatch for:", email);
              recordLoginAttempt(email);
              await db.user.update({
                where: { id: user.id },
                data: {
                  failedLoginAttempts: { increment: 1 }
                }
              });
            }
          } catch (dbError) {
            console.error("[AUTH-CALLBACK] DB error in authorize:", dbError);
            throw dbError;
          }
        }

        console.log("[AUTH-CALLBACK] Authorization failed (invalid credentials or schema)");
        return null;
      },
    }),

  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.plan = user.plan;
        token.email = user.email;
        token.bannedAt = user.bannedAt;
        token.lastChecked = Date.now();
        return token;
      }
      
      const REFRESH_WINDOW = 5 * 60 * 1000;
      const needsRefresh = !token.lastChecked || (Date.now() - token.lastChecked > REFRESH_WINDOW);
      
      if (needsRefresh && token.userId) {
        console.log("[AUTH-CALLBACK] Refreshing JWT for user:", token.userId);
        const dbUser = await db.user.findUnique({
          where: { id: token.userId },
          select: { bannedAt: true, plan: true }
        });
        
        if (dbUser?.bannedAt) {
          return null;
        }
        
        token.plan = dbUser?.plan || token.plan;
        token.bannedAt = dbUser?.bannedAt;
        token.lastChecked = Date.now();
      }
      
      if (token.bannedAt) {
        return null;
      }
      
      return token;
    },
    
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId;
        session.user.plan = token.plan;
        session.user.email = token.email;
      }
      
      return session;
    },
  },
})
