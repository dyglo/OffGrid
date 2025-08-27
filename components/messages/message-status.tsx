"use client"

import React from "react"
import { Clock, Check, CheckSquare, AlertCircle } from "lucide-react"

interface MessageStatusProps {
  status?: "sending" | "sent" | "delivered" | "read" | "failed"
  size?: number
}

export function MessageStatus({ status = "sent", size = 14 }: MessageStatusProps) {
  switch (status) {
    case "sending":
      return <Clock className="text-gray-400" size={size} /> // single tick equivalent: pending
    case "sent":
      return <Check className="text-gray-400" size={size} /> // single tick (gray)
    case "delivered":
      return <CheckSquare className="text-gray-400" size={size} /> // double tick (gray)
    case "read":
      return <CheckSquare className="text-yellow-400" size={size} /> // double tick (yellow)
    case "failed":
      return <AlertCircle className="text-red-500" size={size} />
    default:
      return <Check className="text-gray-400" size={size} />
  }
}

export default MessageStatus
