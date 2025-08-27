"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { searchUsers } from "@/lib/actions/follow-actions"
import { UserCard } from "./user-card"
import { motion, AnimatePresence } from "framer-motion"

interface User {
  id: string
  display_name: string
  bio: string | null
  avatar_url: string | null
}

export function UserSearch() {
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search for users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-400"
        />
        <Button
          onClick={handleSearch}
          disabled={isPending}
          className="bg-yellow-400 text-black hover:bg-yellow-300"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {isPending && (
        <div className="flex items-center justify-center h-16">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white">Search Results</h3>
          <AnimatePresence>
            {results.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <UserCard 
                  key={user.id} 
                  user={user} 
                  showFollowButton={true}
                  showStartChat={true}
                />
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
  )
}
