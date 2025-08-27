"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AvatarUpload } from "./avatar-upload"
import { updateProfile, updateProfileWithAvatar } from "@/lib/actions/profile-actions"
import { ProfileStatusSelect, ProfileStatus } from "@/app/settings/profile-status"

interface ProfileEditFormProps {
  initialData: {
    displayName: string
    bio: string | null
    avatarUrl: string | null
    status?: ProfileStatus
    email?: string
  }
  onCancel: () => void
  onSave: () => void
}


export function ProfileEditForm({ initialData, onCancel, onSave }: ProfileEditFormProps) {
  const [displayName, setDisplayName] = useState(initialData.displayName)
  const [bio, setBio] = useState(initialData.bio || "")
  const [avatarUrl, setAvatarUrl] = useState(initialData.avatarUrl)
  const [status, setStatus] = useState<ProfileStatus>(initialData.status || "away")
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!displayName.trim()) {
      alert("Display name is required")
      return
    }

    startTransition(async () => {
      try {
        if (avatarUrl) {
          await updateProfileWithAvatar({ displayName: displayName.trim(), bio: bio.trim(), avatarUrl })
        } else {
          await updateProfile({ displayName: displayName.trim(), bio: bio.trim() })
        }
        onSave()
      } catch (error) {
        console.error("Failed to update profile:", error)
        alert(error instanceof Error ? error.message : "Failed to update profile")
      }
    })
  }

  return (
    <Card className="bg-gradient-to-b from-[#18120a] to-[#181818] border border-[#222] shadow-lg rounded-2xl max-w-xl mx-auto w-full p-0">
      <CardHeader className="pb-0 pt-6 px-8">
        <CardTitle className="text-white text-lg md:text-xl">Edit Profile</CardTitle>
      </CardHeader>
      <CardContent className="pt-2 pb-8 px-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex flex-col items-center">
            <AvatarUpload currentAvatarUrl={avatarUrl} displayName={displayName} onAvatarChange={setAvatarUrl} />
            <p className="text-xs text-gray-400 mt-2 text-center">
              Click to upload profile picture<br />
              Max 5MB • JPG, PNG, GIF, WebP
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-yellow-400">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                required
                className="bg-[#181818] border-[#333] text-white rounded-lg"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <ProfileStatusSelect value={status} onChange={setStatus} disabled={isPending} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bio" className="text-yellow-400">Bio <span className="text-xs text-gray-400">({bio.length}/150)</span></Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A.k.a the app Owner"
                rows={3}
                maxLength={150}
                className="bg-[#181818] border-[#333] text-white rounded-lg resize-none"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email" className="text-yellow-400">Email</Label>
              <Input
                id="email"
                value={initialData.email || ""}
                disabled
                className="bg-[#181818] border-[#333] text-gray-400 rounded-lg opacity-60 cursor-not-allowed"
              />
              <span className="text-xs text-gray-500">Email cannot be changed</span>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isPending || !displayName.trim()}
              className="w-full bg-[#FFD600] text-black font-semibold text-base py-3 rounded-lg hover:bg-[#FFD600]/90 transition"
            >
              {isPending ? "Saving..." : "Update Profile"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
