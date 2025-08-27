"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getConversations } from "@/lib/actions/message-actions"
import { formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"

interface Conversation {
  partnerId: string
  partner: {
    id: string
    display_name: string
    avatar_url: string | null
  }
  lastMessage: {
    id: string
    content: string
    created_at: string
    sender_id: string
  }
  unreadCount: number
}

interface ConversationListProps {
  onSelectConversation: (partnerId: string, partnerName: string) => void
  selectedPartnerId?: string | null
}

export function ConversationList({ onSelectConversation, selectedPartnerId }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState<'all'|'people'|'groups'>('all')

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await getConversations()
        setConversations(data)
      } catch (error) {
        console.error("Failed to load conversations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadConversations()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
      </div>
    )
  }

  const filtered = conversations.filter(c => {
    if (query && !c.partner.display_name.toLowerCase().includes(query.toLowerCase())) return false
    if (tab === 'people') return true // placeholder - server-side filter later
    if (tab === 'groups') return true
    return true
  })

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-400 text-sm">No conversations yet.</p>
        <p className="text-xs text-gray-500 mt-1">Start by following someone and sending them a message.</p>
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-2 p-2">
      <div className="p-2">
        <input
          className="w-full bg-[#0b0b0b] border border-[#222] rounded-md p-2 text-white placeholder:text-gray-500"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex items-center gap-2 mt-2">
          <button className={`px-3 py-1 rounded-md ${tab==='all' ? 'bg-[#FFD600]/10 text-[#FFD600]' : 'text-gray-400'}`} onClick={() => setTab('all')}>All</button>
          <button className={`px-3 py-1 rounded-md ${tab==='people' ? 'bg-[#FFD600]/10 text-[#FFD600]' : 'text-gray-400'}`} onClick={() => setTab('people')}>People</button>
          <button className={`px-3 py-1 rounded-md ${tab==='groups' ? 'bg-[#FFD600]/10 text-[#FFD600]' : 'text-gray-400'}`} onClick={() => setTab('groups')}>Groups</button>
        </div>
      </div>
      <AnimatePresence>
        {filtered.map((conversation, index) => (
          <motion.div
            key={conversation.partnerId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card
              className={`cursor-pointer transition-all ${
                selectedPartnerId === conversation.partnerId 
                  ? "bg-[rgba(255,214,0,0.06)] border-yellow-400" 
                  : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.04)]"
              } hover:shadow-lg`}
              onClick={() => onSelectConversation(conversation.partnerId, conversation.partner.display_name)}
            >
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={conversation.partner.avatar_url || undefined}
                      alt={conversation.partner.display_name}
                    />
                    <AvatarFallback className="bg-gray-800 text-yellow-400">
                      {getInitials(conversation.partner.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white truncate">{conversation.partner.display_name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(conversation.lastMessage.created_at), { addSuffix: true })}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <div className="w-6 h-6 bg-[#FFD600] rounded-full flex items-center justify-center text-black text-xs font-bold">{conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}</div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{conversation.lastMessage.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
