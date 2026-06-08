import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

// Lightweight config — no mongoose, safe for edge middleware
export const authConfig: NextAuthConfig = {
  providers: [Credentials({})],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const role = (auth?.user as any)?.role
      const isDashboard = nextUrl.pathname.startsWith("/dashboard")
      if (isDashboard) return isLoggedIn && role !== "agent"
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as string
      return session
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
}
