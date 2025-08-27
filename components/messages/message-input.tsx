"use client"

import React, { useRef, useEffect } from "react"
import { Send, Paperclip, Smile } from "lucide-react"

interface MessageInputProps {
  value: string
  onChange: (v: string) => void
  onSend: (e: React.FormEvent) => void
  onFileClick: () => void
  disabled?: boolean
}

export function MessageInput({ value, onChange, onSend, onFileClick, disabled = false }: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = "auto"
    const newHeight = Math.min(ta.scrollHeight, 96) // max 4 lines ~ 96px
    ta.style.height = `${newHeight}px`
  }, [value])

  return (
    <form onSubmit={(e) => onSend(e)} className="flex-none w-full p-3 bg-black/80 backdrop-blur-sm border-t border-[#111111] h-16">
      <div className="max-w-4xl mx-auto flex items-center gap-2 h-full">
        <button
          type="button"
          onClick={onFileClick}
          className="p-3 rounded-lg bg-[rgba(255,255,255,0.02)] text-gray-300 hover:bg-gray-800"
          aria-label="Attach file"
          disabled={disabled}
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <Paperclip className="h-5 w-5" />
        </button>

  <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type a message..."
            className="w-full resize-none bg-[#0b0b0b] text-white placeholder:text-gray-500 rounded-xl p-3 pr-12 border border-[#1a1a1a] outline-none max-h-12 overflow-hidden scrollbar-hide h-10"
            rows={1}
            maxLength={2000}
            aria-label="Type a message"
            disabled={disabled}
          />

          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <button type="button" className="p-2 text-gray-300 rounded-md hover:bg-[rgba(255,255,255,0.02)]" aria-label="Emoji">
              <Smile className="h-5 w-5" />
            </button>
            <button
              type="submit"
              className="p-3 bg-[#28a745] text-black rounded-lg disabled:opacity-60 shadow-sm"
              aria-label="Send message"
              disabled={disabled || (!value || value.trim().length === 0)}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

export default MessageInput
