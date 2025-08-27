"use client"

import React, { useEffect, useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ArrowLeft, X, Image as ImageIcon, FileText } from "lucide-react"
import MessageBubble from "./message-bubble"
import MessageInput from "./message-input"
import TypingIndicator from "./typing-indicator"
import { getMessages, sendMessage, getUserProfile } from "@/lib/actions/message-actions"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import useHideBottomNav from "@/hooks/use-hide-bottom-nav"

interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
  receiver_id: string
  status?: "sending" | "sent" | "delivered" | "read" | "failed"
  sender?: any
  receiver?: any
  attachments?: Array<{ url: string; type?: string; name?: string; file_size?: number | null }>
}

interface UserProfile {
  id: string
  display_name: string
  bio?: string | null
  avatar_url?: string | null
}

interface ChatInterfaceProps {
  partnerId: string
  partnerName: string
  currentUserId: string
  onBack: () => void
}

export function ChatInterface({ partnerId, partnerName, currentUserId, onBack }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [partnerProfile, setPartnerProfile] = useState<UserProfile | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const supabase = createClient()
  const ATTACHMENT_BUCKET = process.env.NEXT_PUBLIC_ATTACHMENTS_BUCKET || "attachments"
  const { toast } = useToast()
  const router = useRouter()

  const [partnerTyping, setPartnerTyping] = useState(false)
  const [partnerOnline, setPartnerOnline] = useState<boolean | null>(null)
  const typingTimeoutRef = useRef<number | null>(null)
  const typingStoppedTimeout = useRef<number | null>(null)
  const lastTypingSent = useRef<number>(0)
  const typingChannelRef = useRef<any>(null)
  const typingReceiveChannelRef = useRef<any>(null)
  useHideBottomNav()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [msgs, profile] = await Promise.all([getMessages(partnerId), getUserProfile(partnerId)])
        const normalized = (msgs || []).map((m: any) => ({
          ...m,
          attachments: (m.attachments || []).map((a: any) => ({ url: a.file_url || a.url, type: a.file_type || a.type, name: a.file_name || a.name, file_size: a.file_size }))
        }))
        setMessages(normalized)
        setPartnerProfile(profile || null)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [partnerId])

  // listen for retry reconciliation
  useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail
      if (!detail) return
      const { oldId, newId, status, created_at } = detail
      setMessages((m) => m.map((msg) => (msg.id === oldId ? { ...msg, id: newId, status, created_at } : msg)))
    }
    window.addEventListener("offgrid:message:retry", handler as EventListener)
    return () => window.removeEventListener("offgrid:message:retry", handler as EventListener)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`messages-${partnerId}-${currentUserId}`)
      // listen for new messages
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `or(and(sender_id.eq.${currentUserId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUserId}))`,
        },
        async (payload: any) => {
          try {
            const m = payload?.new
            if (!m) return
            const normalized = {
              ...m,
              attachments: (m.attachments || []).map((a: any) => ({ url: a.file_url || a.url, type: a.file_type || a.type, name: a.file_name || a.name, file_size: a.file_size })),
            }

            setMessages((prev) => {
              // remove duplicates by id
              if (prev.find((msg) => msg.id === normalized.id)) return prev

              // remove optimistic placeholder that matches by content/attachments for the same sender
              const filtered = prev.filter((msg) => {
                if (msg.sender_id === normalized.sender_id && msg.id.startsWith("temp-")) {
                  // match by content
                  if (normalized.content && msg.content && normalized.content === msg.content) return false
                  // match by attachments (simple name match)
                  if (
                    Array.isArray(normalized.attachments) &&
                    Array.isArray(msg.attachments) &&
                    normalized.attachments.length > 0 &&
                    msg.attachments.length > 0 &&
                    normalized.attachments[0].name === msg.attachments[0].name
                  ) {
                    return false
                  }
                }
                return true
              })

              return [...filtered, normalized]
            })
          } catch (e) {
            console.error("Realtime INSERT handler error", e)
          }
        },
      )
      // listen for updates (status changes)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `or(and(sender_id.eq.${currentUserId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUserId}))`,
        },
        async (payload: any) => {
          try {
            const m = payload?.new
            if (!m) return
            setMessages((prev) => prev.map((msg) => (msg.id === m.id ? { ...msg, status: m.status ?? msg.status } : msg)))
          } catch (e) {
            console.error("Realtime UPDATE handler error", e)
          }
        },
      )
      .subscribe()

    const presence = supabase
      .channel(`presence-${partnerId}`)
      .on("broadcast", { event: "presence" }, (payload: any) => {
        if (payload?.user_id === partnerId) {
          setPartnerOnline(Boolean(payload?.online))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(presence)
    }
  }, [partnerId, currentUserId, supabase])

  // Typing channels and local debounce/rate-limit logic
  useEffect(() => {
    // sender channel: used to broadcast our typing state to partner
    try {
      const sender = supabase.channel(`typing-${currentUserId}-${partnerId}`).subscribe()
      typingChannelRef.current = sender

      // receiver channel: listen for partner typing events targeted to us
      const receiver = supabase
        .channel(`typing-${partnerId}-${currentUserId}`)
        .on("broadcast", { event: "typing" }, (payload: any) => {
          if (payload?.user_id === partnerId && payload?.to === currentUserId) {
            setPartnerTyping(Boolean(payload?.isTyping))
          }
        })
        .on("broadcast", { event: "stopped_typing" }, (payload: any) => {
          if (payload?.user_id === partnerId && payload?.to === currentUserId) {
            setPartnerTyping(false)
          }
        })
        .subscribe()
      typingReceiveChannelRef.current = receiver
    } catch (e) {
      // ignore channel creation errors
    }

    // cleanup
    return () => {
      // broadcast that we stopped typing when leaving
      try {
        const ch = typingChannelRef.current
        if (ch) ch.send({ type: "broadcast", event: "stopped_typing", payload: { user_id: currentUserId, to: partnerId } })
      } catch (e) {}
      if (typingChannelRef.current) supabase.removeChannel(typingChannelRef.current)
      if (typingReceiveChannelRef.current) supabase.removeChannel(typingReceiveChannelRef.current)
      if (typingStoppedTimeout.current) window.clearTimeout(typingStoppedTimeout.current)
    }
  }, [currentUserId, partnerId, supabase])

  // Keystroke handler invoked from MessageInput
  const handleLocalTyping = () => {
    const now = Date.now()
    const MIN_SEND_INTERVAL = 2000 // ms - only send 'typing' at most every 2s

    try {
      const ch = typingChannelRef.current
      if (now - lastTypingSent.current >= MIN_SEND_INTERVAL) {
        if (ch) ch.send({ type: "broadcast", event: "typing", payload: { user_id: currentUserId, to: partnerId, isTyping: true } })
        lastTypingSent.current = now
      }
    } catch (e) {
      // ignore
    }

    // reset stopped timer - when this fires we consider typing stopped
    if (typingStoppedTimeout.current) window.clearTimeout(typingStoppedTimeout.current)
    typingStoppedTimeout.current = window.setTimeout(() => {
      try {
        const ch = typingChannelRef.current
        if (ch) ch.send({ type: "broadcast", event: "stopped_typing", payload: { user_id: currentUserId, to: partnerId } })
      } catch (e) {}
      typingStoppedTimeout.current = null
    }, 3000)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedFile) || isSending || isUploading) return
    setIsSending(true)
    try {
      if (newMessage.trim()) {
        // optimistic UI
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const optimisticMessage: Message = {
          id: tempId,
          content: newMessage,
          created_at: new Date().toISOString(),
          sender_id: currentUserId,
          receiver_id: partnerId,
          status: "sending",
        }
        setMessages((m) => [...m, optimisticMessage])

        try {
          const res = await sendMessage(partnerId, newMessage)
          // reconcile optimistic message with server result
          setMessages((m) => m.map((msg) => (msg.id === tempId ? { ...msg, id: res.id, status: res.status || "sent", created_at: res.created_at } : msg)))
          setNewMessage("")
          // clear typing state (we sent a message)
          try {
            const ch = typingChannelRef.current
            if (ch) ch.send({ type: "broadcast", event: "stopped_typing", payload: { user_id: currentUserId, to: partnerId } })
          } catch (e) {}
          if (typingStoppedTimeout.current) {
            window.clearTimeout(typingStoppedTimeout.current)
            typingStoppedTimeout.current = null
          }
        } catch (err) {
          // mark failed
          setMessages((m) => m.map((msg) => (msg.id === tempId ? { ...msg, status: "failed" } : msg)))
          toast({ title: "Error", description: "Failed to send message", variant: "destructive" })
        }
      }
      if (selectedFile) {
        toast({ title: "File upload", description: "Attachments are uploaded by the backend. UI preview only for now." })
        setSelectedFile(null)
      }
    } finally {
      setIsSending(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ["image/jpeg", "image/png", "image/gif", "application/pdf", "text/plain"]
    if (!allowed.includes(file.type)) {
      toast({ title: "Unsupported file", description: "Please select an image, PDF or text file", variant: "destructive" })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Select file under 10MB", variant: "destructive" })
      return
    }
    // auto-send selected file
    ;(async () => {
      try {
        const bucket = ATTACHMENT_BUCKET
        const filePath = `${currentUserId}/${Date.now()}_${file.name}`
        const upload = await supabase.storage.from(bucket).upload(filePath, file)
  let effectiveBucket = bucket
  if (upload.error) {
          // handle bucket not found specifically with helpful instructions
          const msg = String(upload.error.message || upload.error)
          console.error("Upload error:", upload.error)
          if (msg.toLowerCase().includes("bucket not found")) {
            // try fallback to the 'avatars' bucket (created by your DB scripts) so UI works without env changes
            const fallbackBucket = "avatars"
            const fallbackUpload = await supabase.storage.from(fallbackBucket).upload(filePath, file)
            if (!fallbackUpload.error) {
              toast({ title: "Uploaded to fallback bucket", description: `The configured bucket '${bucket}' was missing; uploaded to '${fallbackBucket}' instead.`, })
              // use fallback bucket for server-side processing
              effectiveBucket = fallbackBucket
            } else {
              toast({
                title: "Storage bucket not found",
                description: `The storage bucket '${bucket}' does not exist in your Supabase project. Create it in the Supabase dashboard (Storage → Buckets → New bucket) or set NEXT_PUBLIC_ATTACHMENTS_BUCKET to an existing bucket name.`,
                variant: "destructive",
              })
              return
            }
          } else {
            throw upload.error
          }
  }
  // don't rely on public bucket — pass bucket+path to server and let it generate a signed/public URL
  const filePathResult = filePath

        // optimistic message
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const optimisticMessage: Message = {
          id: tempId,
          content: "",
          created_at: new Date().toISOString(),
          sender_id: currentUserId,
          receiver_id: partnerId,
          status: "sending",
          attachments: [{ url: filePathResult, type: file.type, name: file.name, file_size: file.size }],
        }
        setMessages((m) => [...m, optimisticMessage])

        // call server action to insert message and attachment rows; server will generate access URL
  const res = await sendMessage(partnerId, "", [{ bucket: effectiveBucket, file_path: filePathResult, file_type: file.type, file_name: file.name, file_size: file.size } as any])

        // replace optimistic message with real data (if available)
        setMessages((m) => m.map((msg) => (msg.id === tempId ? { ...msg, id: res.id, status: "sent", created_at: res.created_at } : msg)))
      } catch (err) {
        console.error(err)
        toast({ title: "Upload failed", description: "Could not upload file", variant: "destructive" })
      }
    })()
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
  // root chat container: fill viewport below the sticky header (header is h-12 / 3rem)
  // fixed chat container: position under the app header to guarantee single-viewport layout
  <div className="fixed left-0 right-0 flex flex-col overflow-hidden bg-black" style={{ top: '3.5rem', bottom: 0, zIndex: 40 }}>
      {/* Header - WhatsApp-style flat horizontal bar */}
      <div className="flex-none h-14 flex items-center px-3 gap-3 bg-black text-white" style={{ zIndex: 45 }}>
        <Button variant="ghost" size="sm" onClick={onBack} className="lg:hidden text-white hover:bg-transparent p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Avatar className="h-10 w-10">
          <AvatarImage src={partnerProfile?.avatar_url || undefined} alt={partnerName} />
          <AvatarFallback className="bg-[#111111] text-yellow-400">{partnerName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex flex-col justify-center min-w-0">
          <p className="text-sm font-semibold text-white truncate">{partnerName}</p>
          <span className="text-xs text-gray-400">
            {partnerOnline === null ? "Status unknown" : partnerOnline ? "Online" : "Offline"}
          </span>
        </div>

        <div className="flex-1" />
        {/* reserved space for future action buttons; intentionally empty to match spec (no call buttons) */}
      </div>

  {/* Messages list */}
  <div className="flex-1 overflow-y-auto px-4 py-4 pb-16"> {/* internal scroll area; pb to avoid input overlap */}
        <div className="max-w-full mx-auto space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((message, index) => {
              const isOwnMessage = message.sender_id === currentUserId
              const sender = message.sender && (Array.isArray(message.sender) ? message.sender[0] : message.sender)
              // placeholder status mapping - should come from message object
              const status = isOwnMessage ? (message.status || "sent") : undefined
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: index * 0.03 }}
                >
                  <MessageBubble message={message} isOwn={isOwnMessage} sender={sender} status={status} />
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* messages */}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* File Preview */}
      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="px-4 py-2 bg-[rgba(255,255,255,0.02)] border-t border-[rgba(255,255,255,0.03)] backdrop-blur-sm"
          style={{ position: "absolute", left: 0, right: 0, bottom: 72, zIndex: 29 }}
        >
          <div className="flex items-center space-x-2 p-2 bg-[rgba(255,255,255,0.02)] rounded-lg border border-[rgba(255,255,255,0.03)] max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="text-gray-300">{selectedFile.type.startsWith("image") ? "🖼️" : "📄"}</div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{selectedFile.name}</p>
                <p className="text-gray-400 text-xs">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeSelectedFile}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Message Input */}
      <input ref={fileInputRef} type="file" onChange={handleFileSelect} accept="image/*,.pdf,.txt" className="hidden" />
      <MessageInput
        value={newMessage}
        onChange={(v) => setNewMessage(v)}
        onUserTyping={handleLocalTyping}
        onSend={(e) => {
          // call async handler
          handleSendMessage(e as React.FormEvent)
        }}
        onFileClick={() => fileInputRef.current?.click()}
        disabled={isSending || isUploading}
      />
      {/* Typing indicator positioned above the input (subtle, muted). Rendered outside of messages list to avoid floating card look. */}
      {partnerTyping && (
        <div className="flex-none px-4 pb-2 pt-1 bg-black text-gray-400 text-sm">
          <TypingIndicator name={partnerName} small />
        </div>
      )}
    </div>
  )
}
