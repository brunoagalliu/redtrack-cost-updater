import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Add your users here (or use a database)
        const users = [
          {
            id: "1",
            name: "Admin",
            email: "admin@redtrack.com",
            username: process.env.ADMIN_USERNAME,
            password: process.env.ADMIN_PASSWORD,
          }
        ];

        const user = users.find(
          u => u.username === credentials?.username && 
               u.password === credentials?.password
        );

        if (user) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
          };
        }

        return null;
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };