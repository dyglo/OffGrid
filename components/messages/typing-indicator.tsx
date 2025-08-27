"use client"

import React from "react"

export function TypingIndicator({ name, small }: { name?: string; small?: boolean }) {
  const textClass = small ? "text-xs" : "text-sm"
  const dotSize = small ? "w-1.5 h-1.5" : "w-2 h-2"
  return (
    <div className={`flex items-center gap-2 ${small ? "px-0" : "px-2"}`}>
      <div className={`${textClass} text-gray-400`}>{name ? `${name} is typing` : "User is typing..."}</div>
      <div className="flex items-center gap-1">
        <span className={`${dotSize} bg-gray-500 rounded-full animate-pulse opacity-80`} />
        <span className={`${dotSize} bg-gray-500 rounded-full animate-pulse opacity-60`} style={{ animationDelay: "150ms" }} />
        <span className={`${dotSize} bg-gray-500 rounded-full animate-pulse opacity-40`} style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  )
}

export default TypingIndicator
