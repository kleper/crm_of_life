import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: '/login',
  },
  providers: [],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.isSuperAdmin = (user as any).isSuperAdmin
        token.tenants = (user as any).tenants
        
        // Auto-select tenant if user has exactly one
        if (token.tenants && (token.tenants as any[]).length === 1) {
          const onlyTenant = (token.tenants as any[])[0]
          token.selectedTenantId = onlyTenant.tenantId
          token.selectedTenantRole = onlyTenant.role
        }
      }
      if (trigger === "update" && session?.tenantId) {
        token.selectedTenantId = session.tenantId
        const userTenant = (token.tenants as any[]).find((t: any) => t.tenantId === session.tenantId)
        token.selectedTenantRole = userTenant?.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as any).isSuperAdmin = token.isSuperAdmin
        ;(session.user as any).tenants = token.tenants
        ;(session.user as any).selectedTenantId = token.selectedTenantId
        ;(session.user as any).selectedTenantRole = token.selectedTenantRole
      }
      return session
    },
  },
} satisfies NextAuthConfig
