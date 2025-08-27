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
      return <Clock className="text-gray-400" size={size} />
    case "sent":
      return <Check className="text-gray-400" size={size} />
    case "delivered":
      return <CheckSquare className="text-gray-400" size={size} />
    case "read":
      return <CheckSquare className="text-yellow-400" size={size} />
    case "failed":
      return <AlertCircle className="text-red-500" size={size} />
    default:
      return <Check className="text-gray-400" size={size} />
  }
}

export default MessageStatus
