"use client"

import React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import MessageStatus from "./message-status"

interface Attachment {
  url: string
  type?: string
  name?: string
  file_size?: number | null
  file_url?: string
  file_type?: string
  file_name?: string
}

interface MessageBubbleProps {
  message: {
    id: string
    content?: string
    created_at: string
    sender_id: string
    receiver_id: string
    attachments?: Array<{ url: string; type?: string; name?: string }>
  }
  isOwn: boolean
  sender?: { id?: string; display_name?: string; avatar_url?: string }
  status?: "sending" | "sent" | "delivered" | "read" | "failed"
}

export function MessageBubble({ message, isOwn, sender, status }: MessageBubbleProps) {
  return (
    <div className={`flex items-end ${isOwn ? "justify-end" : "justify-start"}`}> 
      {!isOwn && (
        <div className="mr-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={sender?.avatar_url || undefined} alt={sender?.display_name || "User"} />
            <AvatarFallback className="bg-[#111111] text-yellow-400 text-xs font-semibold">{(sender?.display_name || "U").charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      )}

      <div className={`max-w-[80%] lg:max-w-[60%] px-2 ${isOwn ? "ml-4" : ""}`}>
        <div
          className={`relative px-4 py-3 rounded-[14px] shadow-sm transition-colors duration-200 ${
            isOwn ? "bg-[#FFD600] text-black" : "bg-white text-black"
          }`}
          aria-live="polite"
        >
          {message.content && <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>}

          {Array.isArray(message.attachments) && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((a: Attachment, i: number) => (
                <div key={i} className={`flex items-center gap-2 p-2 rounded-md ${isOwn ? 'justify-end' : ''}`}>
                  {((a.type || a.file_type) || '').startsWith("image") ? (
                    <img src={(a.url || (a as any).file_url) as string} alt={(a.name || (a as any).file_name) || "attachment"} className="w-40 rounded-md object-cover" />
                  ) : (
                    <div className="flex items-center gap-3 bg-[rgba(0,0,0,0.03)] p-2 rounded-md">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-800">{a.name || (a as any).file_name || 'Document'}</div>
                        <div className="text-xs text-gray-600">{(a.file_size || (a as any).file_size) ? `${(((a.file_size || (a as any).file_size) as number) / 1024).toFixed(2)} KB` : ''}</div>
                      </div>
                      <a
                        href={(a.url || (a as any).file_url) as string}
                        download={(a.name || (a as any).file_name) as string}
                        rel="noopener noreferrer"
                        className="ml-2 inline-flex items-center px-3 py-1 rounded bg-yellow-400 text-black text-sm"
                        onClick={async (e) => {
                          // prevent Next.js client-side routing
                          e.stopPropagation()
                          // Let browser handle the download if possible; fallback to fetch+blob if CORS/signed URL requires it
                          const url = (a.url || (a as any).file_url) as string
                          try {
                            const res = await fetch(url)
                            if (!res.ok) throw new Error('network')
                            const blob = await res.blob()
                            const link = document.createElement('a')
                            const blobUrl = URL.createObjectURL(blob)
                            link.href = blobUrl
                            link.download = (a.name || (a as any).file_name) as string
                            document.body.appendChild(link)
                            link.click()
                            link.remove()
                            URL.revokeObjectURL(blobUrl)
                          } catch (err) {
                            // fallback: open in new tab
                            window.open(url, '_blank', 'noopener')
                          }
                        }}
                      >
                        Download
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

                  <div className={`text-xs mt-2 text-gray-600 flex items-center ${isOwn ? "justify-end" : "justify-start"} gap-2`}>
                    <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span>
                    {isOwn && <MessageStatus status={status} />}
                    {/* retry button for failed sends */}
                    {isOwn && status === "failed" && (
                      <button
                        className="text-xs text-red-400 ml-2 underline"
                        onClick={async () => {
                          // simple retry: call sendMessage again
                          try {
                            const { sendMessage: sendFn } = await import("@/lib/actions/message-actions")
                            const res = await sendFn(message.receiver_id, message.content || "")
                            // update status
                            // @ts-ignore
                            const event = new CustomEvent("offgrid:message:retry", { detail: { oldId: message.id, newId: res.id, status: res.status || "sent", created_at: res.created_at } })
                            window.dispatchEvent(event)
                          } catch (e) {
                            console.error(e)
                          }
                        }}
                      >
                        Retry
                      </button>
                    )}
                  </div>
        </div>
      </div>
    </div>
  )
}

export default MessageBubble
