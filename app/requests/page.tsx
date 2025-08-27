"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { FollowRequestCard } from "@/components/requests/follow-request-card"
import { getPendingFollowRequests } from "@/lib/actions/follow-actions"
import { motion, AnimatePresence } from "framer-motion"
import { UserCheck, Users } from "lucide-react"

interface FollowRequest {
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

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      const pendingRequests = await getPendingFollowRequests()
      setRequests(pendingRequests)
    } catch (error) {
      console.error("Failed to load requests:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestHandled = () => {
    // Remove the handled request from the list
    loadRequests()
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading requests...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6 py-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Requests</h1>
          <p className="text-gray-400">Manage your follow requests and invitations</p>
        </div>

        <div className="space-y-4">
          {requests.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-900 rounded-lg p-8 border border-gray-800 text-center"
            >
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-white font-semibold text-lg mb-2">No Pending Requests</h3>
              <p className="text-gray-400 text-sm">
                You don't have any pending follow requests at the moment.
              </p>
            </motion.div>
          ) : (
            <>
              <div className="flex items-center space-x-2 mb-4">
                <UserCheck className="h-5 w-5 text-yellow-400" />
                <span className="text-white font-medium">
                  {requests.length} Pending Follow Request{requests.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="space-y-4">
                <AnimatePresence>
                  {requests.map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <FollowRequestCard
                        request={request}
                        onRequestHandled={handleRequestHandled}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
