import type React from "react"
import { AppHeader } from "./app-header"
import { BottomNav } from "./bottom-nav"
import { FollowNotifications } from "@/components/notifications/follow-notification"
import { Sidebar } from "./sidebar"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      <AppHeader />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-h-screen pb-28 pt-2 px-2 sm:px-4 overflow-x-hidden">
          <div className="w-full max-w-full">
            {/* Follow Notifications */}
            <div className="mb-4 px-2 md:px-6">
              <FollowNotifications />
            </div>
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
