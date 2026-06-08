import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { connectDB } from "./mongodb"
import { authConfig } from "./auth.config"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        await connectDB()
        // Dynamic import keeps mongoose out of edge runtime
        const { default: User } = await import("@/models/User")
        const user = await User.findOne({ email: credentials.email }).select("+password")
        if (!user) return null
        if (!user.is_active) return null                  // deactivated accounts can't login
        if (user.role === "agent") return null            // agents use public survey links, not dashboard
        const valid = await bcrypt.compare(credentials.password as string, user.password)
        if (!valid) return null
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
})
