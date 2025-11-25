import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { getUserPermissions, findUserByUsername } from "@/lib/auth/service"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                if (!credentials?.username || !credentials?.password) {
                    return null
                }

                const username = credentials.username as string
                const password = credentials.password as string

                // Super Admin Check
                const superUsername = process.env.SUPER_USER_USERNAME
                const superPassword = process.env.SUPER_USER_PASSWORD

                if (superUsername && superPassword && username === superUsername && password === superPassword) {
                    return {
                        id: 'super_admin',
                        name: 'Super Admin',
                        username: superUsername,
                        role: 'admin',
                        permissions: ['access_all']
                    }
                }

                // DB User Check
                const userFromDb = await findUserByUsername(username)
                if (!userFromDb) return null

                if (password === userFromDb.password) {
                    const permissions = await getUserPermissions({ id: userFromDb.id, role: userFromDb.role.name })
                    return {
                        id: userFromDb.id,
                        username: userFromDb.username,
                        name: userFromDb.name,
                        role: userFromDb.role.name,
                        permissions: permissions
                    }
                }

                return null
            },
        }),
    ],
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.permissions = user.permissions
            }
            return token
        },
        session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as any
                session.user.permissions = token.permissions as string[]
            }
            return session
        },
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
    trustHost: true,
})
