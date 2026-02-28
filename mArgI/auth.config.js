export const authConfig = {
    pages: {
      signIn: "/sign-in",
    },
    providers: [], // Providers handled in auth.js
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.userId = user.id; // Store DB ID in token
            }
            if (trigger === "update" && session) {
                token = { ...token, ...session }
            }
            return token;
        },
        async session({ session, token }) {
            if (token?.userId) {
                session.user.id = token.userId; // Make ID available in session
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isPublicRoute = 
                nextUrl.pathname === "/" || 
                nextUrl.pathname.startsWith("/sign-in") || 
                nextUrl.pathname.startsWith("/sign-up") ||
                nextUrl.pathname.startsWith("/forgot-password") ||
                nextUrl.pathname.startsWith("/reset-password");

            if (!isPublicRoute && !isLoggedIn) {
                return false;
            }
            return true;
        },
    }
  }
