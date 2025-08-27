"use client"

import { useState, useTransition } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { searchUsers } from "@/lib/actions/follow-actions"
import { UserCard } from "@/components/friends/user-card"
import { motion, AnimatePresence } from "framer-motion"

interface User {
  id: string
  display_name: string
  bio: string | null
  avatar_url: string | null
}

interface NewMessageDialogProps {
  onSelectUser: (userId: string, userName: string) => void
}

export function NewMessageDialog({ onSelectUser }: NewMessageDialogProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<User[]>([])
  const [isPending, startTransition] = useTransition()

  const handleSearch = () => {
    if (!query.trim()) {
      setResults([])
      return
    }

    startTransition(async () => {
      try {
        const users = await searchUsers(query)
        setResults(users)
      } catch (error) {
        console.error("Search failed:", error)
        setResults([])
      }
    })
  }

  const handleSelectUser = (user: User) => {
    onSelectUser(user.id, user.display_name)
    setOpen(false)
    setQuery("")
    setResults([])
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-yellow-400 text-black hover:bg-yellow-300">
          <Plus className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </DialogTrigger>
  <DialogContent className="bg-[rgba(255,255,255,0.03)] backdrop-blur-sm border border-[rgba(255,255,255,0.04)]">
        <DialogHeader>
          <DialogTitle className="text-white">Start New Conversation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search for users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-400"
            />
            <Button onClick={handleSearch} disabled={isPending} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {isPending && (
            <div className="flex items-center justify-center h-16">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              <AnimatePresence>
                {results.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    onClick={() => handleSelectUser(user)}
                    className="cursor-pointer"
                  >
                    <UserCard user={user} showStartChat={true} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {!isPending && query && results.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No users found matching "{query}"</p>
              <p className="text-gray-500 text-xs mt-1">Try a different search term.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
