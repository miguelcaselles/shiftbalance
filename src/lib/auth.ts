import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import type { UserRole } from "@prisma/client"
import type { Adapter } from "next-auth/adapters"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      role: UserRole
      employeeId?: string
      firstName?: string
      lastName?: string
    }
  }

  interface User {
    role: UserRole
    employeeId?: string
    firstName?: string
    lastName?: string
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db) as Adapter,
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 días
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email y contraseña son requeridos")
        }

        const email = credentials.email as string
        const password = credentials.password as string

        const user = await db.user.findUnique({
          where: { email },
          include: {
            employeeProfile: true,
          },
        })

        if (!user) {
          throw new Error("Usuario no encontrado")
        }

        if (user.status !== "ACTIVE") {
          throw new Error("Tu cuenta está desactivada. Contacta con el administrador.")
        }

        if (!user.passwordHash) {
          throw new Error("Esta cuenta no tiene contraseña configurada")
        }

        const isValid = await bcrypt.compare(password, user.passwordHash)

        if (!isValid) {
          throw new Error("Contraseña incorrecta")
        }

        // Actualizar último login
        await db.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          employeeId: user.employeeProfile?.id,
          firstName: user.employeeProfile?.firstName,
          lastName: user.employeeProfile?.lastName,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.employeeId = user.employeeId
        token.firstName = user.firstName
        token.lastName = user.lastName
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.employeeId = token.employeeId as string | undefined
        session.user.firstName = token.firstName as string | undefined
        session.user.lastName = token.lastName as string | undefined
      }
      return session
    },
  },
})

// Helper para verificar permisos
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    WORKER: 1,
    SUPERVISOR: 2,
    ADMIN: 3,
  }
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

// Helper para obtener la sesión actual en server components
export async function getCurrentUser() {
  const session = await auth()
  return session?.user
}

// Helper para requerir autenticación
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("No autenticado")
  }
  return user
}

// Helper para requerir rol específico
export async function requireRole(role: UserRole) {
  const user = await requireAuth()
  if (!hasPermission(user.role, role)) {
    throw new Error("No autorizado")
  }
  return user
}
