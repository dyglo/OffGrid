"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Camera, Trash2 } from "lucide-react"
import { uploadAvatar, removeAvatar } from "@/lib/actions/profile-actions"

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  displayName: string
  onAvatarChange?: (newUrl: string | null) => void
}

export function AvatarUpload({ currentAvatarUrl, displayName, onAvatarChange }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const newUrl = await uploadAvatar(file)
      setAvatarUrl(newUrl)
      onAvatarChange?.(newUrl)
    } catch (error) {
      console.error("Failed to upload avatar:", error)
      alert(error instanceof Error ? error.message : "Failed to upload avatar")
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveAvatar = async () => {
    setIsUploading(true)
    try {
      await removeAvatar()
      setAvatarUrl(null)
      onAvatarChange?.(null)
    } catch (error) {
      console.error("Failed to remove avatar:", error)
      alert(error instanceof Error ? error.message : "Failed to remove avatar")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={avatarUrl || undefined} alt={displayName} />
          <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <Button
          size="sm"
          variant="secondary"
          className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Camera className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-transparent"
        >
          {isUploading ? "Uploading..." : "Change Avatar"}
        </Button>
        {avatarUrl && (
          <Button size="sm" variant="outline" onClick={handleRemoveAvatar} disabled={isUploading}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      <p className="text-xs text-muted-foreground text-center">
        Upload a profile picture. Max size: 5MB
        <br />
        Supported formats: JPG, PNG, GIF
      </p>
    </div>
  )
}
