"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type UserRole = "admin" | "secretaria" | "jefe_area" | "preceptor" | "docente"

export interface User {
  id: string
  nombres: string
  apellidos: string
  email: string
  rol: UserRole
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock users for demo
const MOCK_USERS: (User & { password: string })[] = [
  {
    id: "1",
    nombres: "Admin",
    apellidos: "Sistema",
    email: "admin@escuela.edu",
    password: "admin123",
    rol: "admin",
  },
  {
    id: "2",
    nombres: "María",
    apellidos: "González",
    email: "secretaria@escuela.edu",
    password: "secretaria123",
    rol: "secretaria",
  },
  {
    id: "3",
    nombres: "Juan",
    apellidos: "Pérez",
    email: "docente@escuela.edu",
    password: "docente123",
    rol: "docente",
  },
]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    const foundUser = MOCK_USERS.find((u) => u.email === email && u.password === password)

    if (!foundUser) {
      throw new Error("Credenciales inválidas")
    }

    const { password: _, ...userWithoutPassword } = foundUser
    setUser(userWithoutPassword)
    localStorage.setItem("user", JSON.stringify(userWithoutPassword))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
