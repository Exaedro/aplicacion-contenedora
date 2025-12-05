"use client"

import type React from "react"

import { type ReactNode, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Users, Calendar, FileText, LogOut, Moon, Sun, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[]
}

const navItems: NavItem[] = [
  { label: "Profesores", href: "/dashboard/profesores", icon: Users },
  { label: "Horarios", href: "/dashboard/horarios", icon: Calendar },
]

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isDark, setIsDark] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle("dark")
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const getInitials = (nombres: string, apellidos: string) => {
    return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase()
  }

  const filteredNavItems = navItems.filter((item) => !item.roles || item.roles.includes(user?.rol || ""))

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 md:hidden">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[100vh]">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex w-64 flex-col border-r bg-card min-h-[calc(100vh-4rem)]">
          <nav className="flex-1 space-y-1 p-4">
            {filteredNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive && "bg-primary text-primary-foreground hover:bg-primary/90",
                  )}
                  onClick={() => router.push(item.href)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Button>
              )
            })}
          </nav>
        </aside>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <aside className="fixed left-0 top-16 bottom-0 w-64 border-r bg-card">
              <nav className="flex-1 space-y-1 p-4">
                {filteredNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Button
                      key={item.href}
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        isActive && "bg-primary text-primary-foreground hover:bg-primary/90",
                      )}
                      onClick={() => {
                        router.push(item.href)
                        setIsMobileMenuOpen(false)
                      }}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.label}
                    </Button>
                  )
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
