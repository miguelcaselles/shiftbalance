"use client"

import { Bell, LogOut, User, Menu, Moon, Sun, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { useState } from "react"

interface HeaderProps {
  user: {
    email: string
    firstName?: string
    lastName?: string
    role: string
  }
  notificationCount?: number
}

export function Header({ user, notificationCount = 0 }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const initials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user.email[0].toUpperCase()

  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.email

  const roleLabel = {
    WORKER: "Trabajador",
    SUPERVISOR: "Supervisor",
    ADMIN: "Administrador",
  }[user.role] || user.role

  const roleColor = {
    WORKER: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    SUPERVISOR: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    ADMIN: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  }[user.role] || "bg-gray-100 text-gray-700"

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left side - Mobile menu */}
        <div className="flex items-center gap-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Center - Search (optional, hidden on mobile) */}
        <div className="hidden flex-1 justify-center lg:flex lg:max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              className="h-10 w-full rounded-xl border bg-muted/50 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Link href="/worker/messages">
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-xl hover:bg-accent"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </Button>
          </Link>

          {/* Divider */}
          <div className="mx-2 h-8 w-px bg-border" />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-3 rounded-xl px-2 hover:bg-accent"
              >
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-600 text-sm font-medium text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden flex-col items-start md:flex">
                  <span className="text-sm font-semibold">{displayName}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${roleColor}`}>
                    {roleLabel}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                <Link href="/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Mi perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
