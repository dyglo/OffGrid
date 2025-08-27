"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { getFollowNotifications, markFollowNotificationShown } from "@/lib/actions/follow-actions"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, Check, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface FollowNotification {
  id: string
  follower_id: string
  following_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  follower: {
    id: string
    display_name: string
    bio: string | null
    avatar_url: string | null
  }
  following: {
    id: string
    display_name: string
    bio: string | null
    avatar_url: string | null
  }
}

export function FollowNotifications() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const followNotifications = await getFollowNotifications()
      setNotifications(followNotifications)
    } catch (error) {
      console.error("Failed to load notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartChat = (userId: string, userName: string) => {
    // Find notification for this user (if any) and mark it shown so it's not repeated
    const notif = notifications.find(n => n.following_id === userId && n.status === 'accepted' && !n.notification_shown)
    if (notif) {
      // fire-and-forget: mark shown, then navigate
      markFollowNotificationShown(notif.id).catch(() => {})
    }
    router.push(`/messages?user=${userId}&name=${encodeURIComponent(userName)}`)
  }

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
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

  const getNotificationMessage = (notification: FollowNotification) => {
    if (notification.status === 'accepted') {
      return `${notification.following.display_name} accepted your follow request!`
    }
    if (notification.status === 'rejected') {
      return `${notification.following.display_name} rejected your follow request.`
    }
    return `${notification.following.display_name} sent you a follow request.`
  }

  const getNotificationIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Check className="h-5 w-5 text-green-400" />
      case 'rejected':
        return <X className="h-5 w-5 text-red-400" />
      default:
        return <MessageCircle className="h-5 w-5 text-blue-400" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
      </div>
    )
  }

  // filter out already-shown notifications
  const visibleNotifications = notifications.filter(n => !n.notification_shown)

  if (visibleNotifications.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
  {visibleNotifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="bg-[rgba(255,255,255,0.03)] backdrop-blur-sm border border-[rgba(255,255,255,0.04)] hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-10 w-10 mt-1">
                    <AvatarImage 
                      src={notification.following.avatar_url || undefined} 
                      alt={notification.following.display_name} 
                    />
                    <AvatarFallback className="bg-gray-800 text-yellow-400 text-sm font-semibold">
                      {getInitials(notification.following.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getNotificationIcon(notification.status)}
                        <span className="text-white font-medium text-sm">
                          {getNotificationMessage(notification)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissNotification(notification.id)}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="text-gray-500 text-xs mt-1 block">
                      {formatDate(notification.created_at)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              {notification.status === 'accepted' && (
                <CardContent className="pt-0">
                  <Button
                    onClick={() => handleStartChat(notification.following.id, notification.following.display_name)}
                    size="sm"
                    className="w-full bg-yellow-400 text-black hover:bg-yellow-300"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Start Chat with {notification.following.display_name}
                  </Button>
                </CardContent>
              )}
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
