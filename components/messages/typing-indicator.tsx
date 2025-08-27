"use client"

import React from "react"

export function TypingIndicator({ name }: { name?: string }) {
  return (
    <div className="px-4 py-2">
      <div className="inline-flex items-center gap-3 bg-[rgba(255,255,255,0.9)] text-black px-3 py-2 rounded-xl shadow-sm">
        <div className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full text-xs font-semibold">{name?.charAt(0) || "U"}</div>
        <div>
          <div className="text-sm font-medium">{name || "User"} is typing</div>
          <div className="flex items-center gap-1 mt-1">
            <span className="dot animate-bounce bg-gray-600 w-2 h-2 rounded-full"></span>
            <span className="dot animate-bounce200 bg-gray-600 w-2 h-2 rounded-full"></span>
            <span className="dot animate-bounce400 bg-gray-600 w-2 h-2 rounded-full"></span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TypingIndicator
