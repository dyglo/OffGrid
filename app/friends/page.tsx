import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppLayout } from "@/components/layout/app-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserSearch } from "@/components/friends/user-search"
import { FollowersList } from "@/components/friends/followers-list"
import { FollowingList } from "@/components/friends/following-list"

export default async function FriendsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full w-full max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">Friends</h2>
          <p className="text-gray-400">People you've accepted or who accepted you. Click a friend to view profile or start a chat.</p>
        </div>

        <div className="mb-4">
          <input placeholder="Search friends by name or bio..." className="w-full bg-[#0b0b0b] border border-[#222] rounded-md p-3 text-white" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Reuse FollowingList as accepted friends list for now (UI only) */}
          <div className="col-span-1">
            <FollowingList />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
