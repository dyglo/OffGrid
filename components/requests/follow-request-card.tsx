"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { acceptFollowRequest, rejectFollowRequest } from "@/lib/actions/follow-actions"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { Check, X, MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface FollowRequestCardProps {
  request: {
    id: string
    follower_id: string
    created_at: string
    follower: {
      id: string
      display_name: string
      bio: string | null
      avatar_url: string | null
    }
  }
  onRequestHandled: () => void
}

export function FollowRequestCard({ request, onRequestHandled }: FollowRequestCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleAccept = async () => {
    setIsLoading(true)
    try {
      await acceptFollowRequest(request.follower_id)
      toast({
        title: "Follow request accepted!",
        description: `You are now following ${request.follower.display_name}`,
      })
      onRequestHandled()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept follow request",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    setIsLoading(true)
    try {
      await rejectFollowRequest(request.follower_id)
      toast({
        title: "Follow request rejected",
        description: `Follow request from ${request.follower.display_name} was rejected`,
      })
      onRequestHandled()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject follow request",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartChat = () => {
    router.push(`/messages?user=${request.follower.id}&name=${encodeURIComponent(request.follower.display_name)}`)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
  <Card className="bg-[rgba(255,255,255,0.03)] backdrop-blur-sm border border-[rgba(255,255,255,0.04)] hover:shadow-lg transition-all">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={request.follower.avatar_url || undefined} alt={request.follower.display_name} />
              <AvatarFallback className="bg-[#111111] text-yellow-400 text-lg font-semibold">
                {getInitials(request.follower.display_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold text-lg truncate">
                  {request.follower.display_name}
                </h3>
                <span className="text-gray-500 text-xs">
                  {formatDate(request.created_at)}
                </span>
              </div>
              {request.follower.bio && (
                <p className="text-gray-400 text-sm line-clamp-2 mt-1">
                  {request.follower.bio}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex space-x-2">
            <Button
              onClick={handleAccept}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <Check className="h-4 w-4 mr-2" />
              {isLoading ? "..." : "Accept"}
            </Button>
            <Button
              onClick={handleReject}
              disabled={isLoading}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <X className="h-4 w-4 mr-2" />
              {isLoading ? "..." : "Reject"}
            </Button>
          </div>
          <div className="mt-3">
            <Button
              onClick={handleStartChat}
              variant="outline"
              size="sm"
              className="w-full border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Start Chat
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
