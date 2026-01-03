import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's role. */
      role: string
      id: string
      forcePasswordChange?: boolean
    } & DefaultSession["user"]
  }

  interface User {
      role: string;
      id: string; // Add ID here as well if needed for the User object in authorize
      forcePasswordChange?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    id: string
    forcePasswordChange?: boolean
  }
}
