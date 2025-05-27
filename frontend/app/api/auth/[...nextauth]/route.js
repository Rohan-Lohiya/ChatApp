import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import jwt from "jsonwebtoken";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account && account.provider === "google") {
        // Store Google user info
        token.googleId = user.id;
        token.email = user.email;
        token.name = user.name;
        
        // Create your own JWT for backend communication
        const customPayload = {
          googleId: user.id,
          email: user.email,
          name: user.name,
        };
        
        token.backendToken = jwt.sign(
          customPayload,
          process.env.NEXTAUTH_SECRET,
          { expiresIn: '7d' }
        );
      }
      return token;
    },
    
    async session({ session, token }) {
      // Pass your custom JWT to the frontend
      session.backendToken = token.backendToken;
      session.googleId = token.googleId;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };