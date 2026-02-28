import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server";
import { neon } from '@neondatabase/serverless';

const { auth } = NextAuth(authConfig)

export default auth(async (req) => {
  const { nextUrl } = req;
  const session = req.auth;

  // Real-time check for high-risk routes to bypass 5-min lag
  if (nextUrl.pathname.startsWith("/api/subscription") && session?.user?.id) {
    try {
      const sql = neon(process.env.DATABASE_URL);
      const rows = await sql`SELECT "bannedAt" FROM "User" WHERE id = ${session.user.id} LIMIT 1`;
      
      if (rows?.[0]?.bannedAt) {
        return NextResponse.json({ error: "Access Denied: Account Banned" }, { status: 403 });
      }
    } catch (e) {
      console.error("Middleware real-time check error:", e);
    }
  }

  return NextResponse.next();
})

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)", 
    "/api/subscription/:path*"
  ],
}