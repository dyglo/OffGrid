"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { sendFollowRequest, unfollowUser, getFollowStatus } from "@/lib/actions/follow-actions"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

interface UserDiscoverCardProps {
  user: {
    id: string
    display_name: string
    bio: string | null
    avatar_url: string | null
  }
  onFollowStatusChange: () => void
}

export function UserDiscoverCard({ user, onFollowStatusChange }: UserDiscoverCardProps) {
  const [followStatus, setFollowStatus] = useState<'none' | 'pending' | 'accepted'>('none')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Check follow status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await getFollowStatus(user.id)
        setFollowStatus(status.status)
      } catch (error) {
        console.error("Failed to check follow status:", error)
      }
    }
    checkStatus()
  }, [user.id])

  const handleFollow = async () => {
    setIsLoading(true)
    try {
      await sendFollowRequest(user.id)
      setFollowStatus('pending')
      onFollowStatusChange()
      toast({
        title: "Follow request sent!",
        description: `Follow request sent to ${user.display_name}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send follow request",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnfollow = async () => {
    setIsLoading(true)
    try {
      await unfollowUser(user.id)
      setFollowStatus('none')
      onFollowStatusChange()
      toast({
        title: "Unfollowed",
        description: `Unfollowed ${user.display_name}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unfollow user",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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

  const isButtonDisabled = followStatus === 'pending' || isLoading

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
  <Card className="bg-[rgba(255,255,255,0.03)] backdrop-blur-sm border border-[rgba(255,255,255,0.04)] hover:shadow-lg transition-all">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar_url || undefined} alt={user.display_name} />
              <AvatarFallback className="bg-[#111111] text-yellow-400 text-lg font-semibold">
                {getInitials(user.display_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-lg truncate">
                {user.display_name}
              </h3>
              {user.bio && (
                <p className="text-gray-400 text-sm line-clamp-2 mt-1">
                  {user.bio}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex justify-end">
            {followStatus === 'accepted' ? (
              <Button
                variant="outline"
                onClick={handleUnfollow}
                disabled={isLoading}
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                {isLoading ? "..." : "Unfollow"}
              </Button>
            ) : (
              <Button
                variant={getButtonVariant() as any}
                onClick={handleFollow}
                disabled={isButtonDisabled}
                className={`${
                  followStatus === 'pending'
                    ? 'bg-gray-600 text-gray-300'
                    : 'bg-yellow-400 text-black hover:bg-yellow-300'
                }`}
              >
                {isLoading ? "..." : getButtonText()}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
