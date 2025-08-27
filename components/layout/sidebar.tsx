"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, MessageCircle, Layers, User, ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"

const navItems = [
  { name: "Friends", href: "/friends", icon: Users },
  { name: "Messages", href: "/messages", icon: MessageCircle },
  { name: "Requests", href: "/requests", icon: Layers },
  { name: "Settings", href: "/settings", icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    // Sidebar visible only on large screens (desktop). Tablet/mobile use bottom nav.
    <aside className={`hidden lg:flex lg:flex-col ${collapsed ? 'w-20' : 'w-72'} min-h-screen bg-[#111111] border-r border-[#1a1a1a] text-white transition-all`}> 
      <div className="px-4 py-4 flex items-center space-x-3 border-b border-[#161616]">
        <motion.h1
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className={`text-2xl font-bold text-[#FFD600] ${collapsed ? 'hidden' : 'block'}`}
        >
          OffGrid
        </motion.h1>
        <button
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 rounded-md hover:bg-white/5"
        >
          {collapsed ? <ChevronRight className="h-5 w-5 text-gray-300" /> : <ChevronLeft className="h-5 w-5 text-gray-300" />}
        </button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href === "/messages" && pathname?.startsWith("/messages"))
          return (
            <motion.div key={item.name} whileHover={{ x: 4 }}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mx-2 ${
                  isActive
                    ? "bg-[#FFD600]/10 text-[#FFD600] border-l-4 border-[#FFD600]"
                    : "text-gray-300 hover:bg-white/2"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className={`font-medium truncate ${collapsed ? 'hidden' : 'block'}`}>{item.name}</span>
              </Link>
            </motion.div>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-[#161616]">
        <p className={`text-xs text-gray-400 ${collapsed ? 'hidden' : 'block'}`}>© OffGrid</p>
      </div>
    </aside>
  )
}
