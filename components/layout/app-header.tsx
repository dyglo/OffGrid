"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function AppHeader() {
  const router = useRouter()
  const supabase = createClient()
  const [compact, setCompact] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#111111] bg-black/80 backdrop-blur-sm">
      <div className="flex h-12 items-center justify-between px-4 md:px-6">
        <div className="flex items-center space-x-3">
          <button className="md:hidden text-yellow-400 font-bold">OffGrid</button>
          <h2 className="hidden md:block text-lg font-semibold text-white">OffGrid</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Compact mode switch visible on tablet and mobile */}
          <div className="flex items-center gap-2 md:flex lg:hidden">
            <label className="text-sm text-gray-300">Compact</label>
            <button
              onClick={() => setCompact((s) => !s)}
              className={`w-10 h-6 rounded-full p-1 ${compact ? 'bg-yellow-400' : 'bg-gray-700'}`}
              aria-pressed={compact}
            >
              <div className={`h-4 w-4 rounded-full bg-white transition-transform ${compact ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-gray-300 hover:text-white"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}
