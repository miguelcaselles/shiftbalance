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
  Home,
  ClipboardList,
  Bell,
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
}

const navItems: NavItem[] = [
  {
    title: "Inicio",
    href: "/dashboard",
    icon: Home,
    roles: ["WORKER", "SUPERVISOR", "ADMIN"],
  },
  {
    title: "Mi Horario",
    href: "/worker/schedule",
    icon: Calendar,
    roles: ["WORKER", "SUPERVISOR"],
  },
  {
    title: "Mis Preferencias",
    href: "/worker/preferences",
    icon: ClipboardList,
    roles: ["WORKER", "SUPERVISOR"],
  },
  {
    title: "Cambios de Turno",
    href: "/worker/changes",
    icon: ArrowLeftRight,
    roles: ["WORKER", "SUPERVISOR", "ADMIN"],
  },
  {
    title: "Mensajes",
    href: "/worker/messages",
    icon: MessageSquare,
    roles: ["WORKER", "SUPERVISOR", "ADMIN"],
  },
  // Admin items
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
    title: "Periodos",
    href: "/admin/periods",
    icon: Calendar,
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

  const filteredItems = navItems.filter((item) => item.roles.includes(userRole))

  // Separar items de worker y admin
  const workerItems = filteredItems.filter(
    (item) => !item.href.startsWith("/admin") || item.href === "/dashboard"
  )
  const adminItems = filteredItems.filter(
    (item) => item.href.startsWith("/admin")
  )

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Calendar className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold">ShiftBalance</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-4">
        {/* Worker items */}
        <div className="space-y-1">
          {workerItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            )
          })}
        </div>

        {/* Admin section */}
        {adminItems.length > 0 && (
          <>
            <div className="my-4 border-t" />
            <p className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
              Administración
            </p>
            <div className="space-y-1">
              {adminItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.title}
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </nav>
    </aside>
  )
}
