"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { sendFollowRequest, unfollowUser, getFollowStatus } from "@/lib/actions/follow-actions"
import { useEffect } from "react"
import { MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

interface User {
  id: string
  display_name: string
  bio: string | null
  avatar_url: string | null
}

interface UserCardProps {
  user: User
  showFollowButton?: boolean
  initialFollowStatus?: boolean
  showStartChat?: boolean
}

export function UserCard({ user, showFollowButton = false, initialFollowStatus = false, showStartChat = false }: UserCardProps) {
  const [followStatus, setFollowStatus] = useState<'none' | 'pending' | 'accepted'>('none')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    if (showFollowButton) {
      startTransition(async () => {
        try {
          const status = await getFollowStatus(user.id)
          setFollowStatus(status.status)
        } catch (error) {
          console.error("Failed to get follow status:", error)
        }
      })
    }
  }, [user.id, showFollowButton])

  const handleFollowToggle = () => {
    startTransition(async () => {
      try {
        if (followStatus === 'accepted') {
          await unfollowUser(user.id)
          setFollowStatus('none')
        } else if (followStatus === 'none') {
          await sendFollowRequest(user.id)
          setFollowStatus('pending')
        }
      } catch (error) {
        console.error("Follow action failed:", error)
      }
    })
  }

  const handleStartChat = () => {
    router.push(`/messages?user=${user.id}&name=${encodeURIComponent(user.display_name)}`)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getButtonText = () => {
    switch (followStatus) {
      case 'pending':
        return 'Request Sent'
      case 'accepted':
        return 'Following'
      default:
        return 'Follow'
    }
  }

  const getButtonVariant = () => {
    switch (followStatus) {
      case 'pending':
        return 'secondary'
      case 'accepted':
        return 'outline'
      default:
        return 'default'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
  <Card className="bg-[rgba(255,255,255,0.03)] backdrop-blur-sm border border-[rgba(255,255,255,0.04)] hover:shadow-lg transition-all">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar_url || undefined} alt={user.display_name} />
                <AvatarFallback className="bg-gray-800 text-yellow-400">
                  {getInitials(user.display_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.display_name}</p>
                {user.bio && <p className="text-xs text-gray-400 truncate">{user.bio}</p>}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {showStartChat && followStatus === 'accepted' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStartChat}
                  className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              )}
              {showFollowButton && (
                <Button
                  size="sm"
                  variant={getButtonVariant() as any}
                  onClick={handleFollowToggle}
                  disabled={isPending || followStatus === 'pending'}
                  className={`${
                    followStatus === 'pending'
                      ? 'bg-gray-600 text-gray-300'
                      : followStatus === 'accepted'
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white'
                      : 'bg-yellow-400 text-black hover:bg-yellow-300'
                  }`}
                >
                  {isPending ? "..." : getButtonText()}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
