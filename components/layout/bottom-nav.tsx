"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageCircle, Users, User, Search, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { getPendingFollowRequests } from "@/lib/actions/follow-actions"

const navItems = [
  {
    name: "Home",
    href: "/",
    icon: MessageCircle,
  },
  {
    name: "Friends",
    href: "/friends",
    icon: Users,
  },
  {
    name: "Discover",
    href: "/discover",
    icon: Search,
  },
  {
    name: "Requests",
    href: "/requests",
    icon: Bell,
    badge: true,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: User,
  },
]

export function BottomNav() {
  const pathname = usePathname()
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const loadPendingRequests = async () => {
      try {
        const requests = await getPendingFollowRequests()
        setPendingRequestsCount(requests.length)
      } catch (error) {
        console.error("Failed to load pending requests:", error)
      }
    }

    loadPendingRequests()
    const interval = setInterval(loadPendingRequests, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const onToggle = (e: any) => {
      // only toggle on small screens and tablets (<=1024px)
      const isSmallOrTablet = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(max-width: 1024px)").matches
      if (!isSmallOrTablet) return
      setHidden(Boolean(e?.detail?.hidden))
    }

    window.addEventListener("offgrid:bottom-nav", onToggle as EventListener)
    return () => window.removeEventListener("offgrid:bottom-nav", onToggle as EventListener)
  }, [])

  return (
    <nav
      aria-hidden={hidden}
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95vw] max-w-md rounded-2xl bg-[#0b0b0b]/95 border border-[#161616] shadow-lg flex md:flex lg:hidden transition-all duration-200",
        hidden ? "opacity-0 pointer-events-none translate-y-8" : "opacity-100 pointer-events-auto translate-y-0",
      )}
      style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.6)' }}
    >
      <div className="flex items-center justify-around w-full h-16 px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === "/messages" && pathname === "/messages")
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 px-1 py-2 rounded-xl transition-colors relative min-w-0 flex-1",
                isActive ? "text-[#FFD600] bg-[#FFD600]/10" : "text-gray-400 hover:text-white",
              )}
              style={{ minWidth: 0 }}
            >
              <div className="relative flex items-center justify-center">
                <Icon className="h-6 w-6" />
                {item.badge && pendingRequestsCount > 0 && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-black">
                    <span className="text-black text-xs font-bold">
                      {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-xs font-semibold truncate">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
