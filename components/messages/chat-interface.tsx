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

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`messages-${partnerId}-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `or(and(sender_id.eq.${currentUserId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUserId}))`,
        },
        async () => {
          const newMessages = await getMessages(partnerId)
          const normalized = (newMessages || []).map((m: any) => ({
            ...m,
            attachments: (m.attachments || []).map((a: any) => ({ url: a.file_url || a.url, type: a.file_type || a.type, name: a.file_name || a.name, file_size: a.file_size }))
          }))
          setMessages(normalized)
        },
      )
      .subscribe()

    const presence = supabase
      .channel(`presence-${partnerId}`)
      .on("broadcast", { event: "typing" }, (payload: any) => {
        if (payload?.user_id === partnerId && payload?.to === currentUserId) {
          setPartnerTyping(Boolean(payload?.isTyping))
        }
      })
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

  useEffect(() => {
    const sendTyping = async (isTyping: boolean) => {
      try {
        const ch = supabase.channel(`presence-${partnerId}`)
        // @ts-ignore internal broadcast
        ch.send({ type: "broadcast", event: "typing", payload: { user_id: currentUserId, to: partnerId, isTyping } })
      } catch (e) {
        // ignore
      }
    }

    if (newMessage.length > 0) {
      sendTyping(true)
      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = window.setTimeout(() => {
        sendTyping(false)
        typingTimeoutRef.current = null
      }, 1500)
    } else {
      sendTyping(false)
    }

    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
    }
  }, [newMessage, supabase, currentUserId, partnerId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedFile) || isSending || isUploading) return
    setIsSending(true)
    try {
      if (newMessage.trim()) {
        await sendMessage(partnerId, newMessage)
        setNewMessage("")
      }
      if (selectedFile) {
        toast({ title: "File upload", description: "Attachments are uploaded by the backend. UI preview only for now." })
        setSelectedFile(null)
      }
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" })
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
      {/* Header */}
  <div className="flex-none flex items-center space-x-3 p-4 border-b border-[#111111] bg-[#0a0a0a]">
  <Button variant="ghost" size="sm" onClick={onBack} className="lg:hidden text-white hover:bg-gray-800">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <Avatar className="h-10 w-10">
          <AvatarImage src={partnerProfile?.avatar_url || undefined} alt={partnerName} />
          <AvatarFallback className="bg-[#111111] text-yellow-400">{partnerName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="ml-2">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-white">{partnerName}</p>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${partnerOnline === null ? "bg-gray-500" : partnerOnline ? "bg-green-400" : "bg-gray-600"}`}></span>
              <span className="text-xs text-gray-300">{partnerTyping ? "typing..." : partnerOnline ? "Online" : "Offline"}</span>
            </div>
          </div>
          {partnerProfile?.bio && <p className="text-xs text-gray-400">{partnerProfile.bio}</p>}
        </div>

  {/* intentionally left empty: removed View Profile button per UX request */}
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

          {partnerTyping && <TypingIndicator name={partnerName} />}

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
        onSend={(e) => {
          // call async handler
          handleSendMessage(e as React.FormEvent)
        }}
        onFileClick={() => fileInputRef.current?.click()}
        disabled={isSending || isUploading}
      />
    </div>
  )
}
