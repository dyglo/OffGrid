"use client"

import { useEffect, useState } from "react"
import { getFollowing } from "@/lib/actions/follow-actions"
import { UserCard } from "./user-card"
import { motion, AnimatePresence } from "framer-motion"

interface User {
  id: string
  display_name: string
  bio: string | null
  avatar_url: string | null
}

interface FollowingListProps {
  userId?: string
}

export function FollowingList({ userId }: FollowingListProps) {
  const [following, setFollowing] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadFollowing = async () => {
      try {
        const data = await getFollowing(userId)
        const followingProfiles = data.map((item: any) => item.profiles).filter(Boolean)
        setFollowing(followingProfiles)
      } catch (error) {
        console.error("Failed to load following:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFollowing()
  }, [userId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
      </div>
    )
  }

  if (following.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 text-sm">Not following anyone yet.</p>
        <p className="text-gray-500 text-xs mt-1">Discover and follow people to see them here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {following.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <UserCard 
              key={user.id} 
              user={user} 
              showStartChat={true}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
