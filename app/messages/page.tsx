"use client"

import { useEffect, useState, Suspense } from "react"
import { redirect, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AppLayout } from "@/components/layout/app-layout"
import { ConversationList } from "@/components/messages/conversation-list"
import { ChatInterface } from "@/components/messages/chat-interface"
import { NewMessageDialog } from "@/components/messages/new-message-dialog"

function MessagesContent() {
  const [user, setUser] = useState<any>(null)
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null)
  const [selectedPartnerName, setSelectedPartnerName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const searchParams = useSearchParams()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        redirect("/auth/login")
      } else {
        setUser(user)
      }
      setIsLoading(false)
    }

    getUser()
  }, [supabase])

  useEffect(() => {
    // Check for URL parameters to start a chat
    const userId = searchParams.get('user')
    const userName = searchParams.get('name')
    
    if (userId && userName) {
      setSelectedPartnerId(userId)
      setSelectedPartnerName(decodeURIComponent(userName))
    }
  }, [searchParams])

  const handleSelectConversation = (partnerId: string, partnerName: string) => {
    setSelectedPartnerId(partnerId)
    setSelectedPartnerName(partnerName)
  }

  const handleNewMessage = (userId: string, userName: string) => {
    setSelectedPartnerId(userId)
    setSelectedPartnerName(userName)
  }

  const handleBack = () => {
    setSelectedPartnerId(null)
    setSelectedPartnerName("")
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex h-full">
        {/* Conversation List - Hidden on mobile when chat is open */}
        <div className={`w-full md:w-80 border-r border-gray-800 ${selectedPartnerId ? "hidden md:block" : "block"}`}>
          <div className="p-4 border-b border-gray-800 bg-gray-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Messages</h2>
              <NewMessageDialog onSelectUser={handleNewMessage} />
            </div>
          </div>
          <ConversationList onSelectConversation={handleSelectConversation} selectedPartnerId={selectedPartnerId} />
        </div>

        {/* Chat Interface */}
        <div className={`flex-1 ${selectedPartnerId ? "block" : "hidden md:flex md:items-center md:justify-center"}`}>
          {selectedPartnerId ? (
            <ChatInterface
              partnerId={selectedPartnerId}
              partnerName={selectedPartnerName}
              currentUserId={user.id}
              onBack={handleBack}
            />
          ) : (
            <div className="text-center p-8">
              <h3 className="text-lg font-medium text-white mb-2">Select a conversation</h3>
              <p className="text-gray-400">Choose a conversation from the list to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      </AppLayout>
    }>
      <MessagesContent />
    </Suspense>
  )
}
