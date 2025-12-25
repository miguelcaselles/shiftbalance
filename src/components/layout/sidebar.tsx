"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Calendar,
  CalendarDays,
  Users,
  Settings,
  BarChart3,
  MessageSquare,
  ArrowLeftRight,
  Clock,
  LayoutDashboard,
  ClipboardList,
  Sparkles,
  ChevronRight,
  Palmtree,
} from "lucide-react"
import type { UserRole } from "@prisma/client"

interface SidebarProps {
  userRole: UserRole
}

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
  badge?: string
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["WORKER", "SUPERVISOR", "ADMIN"],
  },
  {
    title: "Mi Horario",
    href: "/worker/schedule",
    icon: Calendar,
    roles: ["WORKER", "SUPERVISOR"],
  },
  {
    title: "Preferencias",
    href: "/worker/preferences",
    icon: ClipboardList,
    roles: ["WORKER", "SUPERVISOR"],
  },
  {
    title: "Cambios",
    href: "/worker/changes",
    icon: ArrowLeftRight,
    roles: ["WORKER", "SUPERVISOR", "ADMIN"],
  },
  {
    title: "Vacaciones",
    href: "/worker/vacations",
    icon: Palmtree,
    roles: ["WORKER", "SUPERVISOR"],
  },
  {
    title: "Mensajes",
    href: "/worker/messages",
    icon: MessageSquare,
    roles: ["WORKER", "SUPERVISOR", "ADMIN"],
  },
]

const adminItems: NavItem[] = [
  {
    title: "Usuarios",
    href: "/admin/users",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    title: "Tipos de Turno",
    href: "/admin/shifts",
    icon: Clock,
    roles: ["ADMIN"],
  },
  {
    title: "Horarios",
    href: "/admin/schedules",
    icon: CalendarDays,
    roles: ["ADMIN"],
  },
  {
    title: "Estadísticas",
    href: "/admin/stats",
    icon: BarChart3,
    roles: ["SUPERVISOR", "ADMIN"],
  },
  {
    title: "Configuración",
    href: "/admin/settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
]

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()

  const filteredNavItems = navItems.filter((item) => item.roles.includes(userRole))
  const filteredAdminItems = adminItems.filter((item) => item.roles.includes(userRole))

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col border-r bg-gradient-to-b from-card via-card to-card/95 lg:flex">
      {/* Logo */}
      <div className="flex h-20 items-center gap-3 border-b px-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 shadow-lg shadow-primary/25">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight">ShiftBalance</span>
          <span className="text-xs text-muted-foreground">Gestión de Turnos</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
        {/* Main nav */}
        <div className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  !isActive && "group-hover:scale-110"
                )} />
                <span className="flex-1">{item.title}</span>
                {isActive && (
                  <ChevronRight className="h-4 w-4 opacity-70" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Admin section */}
        {filteredAdminItems.length > 0 && (
          <>
            <div className="my-4 flex items-center gap-3 px-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Admin
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="space-y-1">
              {filteredAdminItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      !isActive && "group-hover:scale-110"
                    )} />
                    <span className="flex-1">{item.title}</span>
                    {isActive && (
                      <ChevronRight className="h-4 w-4 opacity-70" />
                    )}
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="rounded-xl bg-gradient-to-r from-primary/10 to-emerald-500/10 p-4">
          <p className="text-xs font-medium text-foreground">
            ShiftBalance v1.0
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Sistema de gestión de turnos
          </p>
        </div>
      </div>
    </aside>
  )
}
