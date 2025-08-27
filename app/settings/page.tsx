"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AppLayout } from "@/components/layout/app-layout"
// ProfileDisplay removed — always show edit form directly
import { ProfileEditForm } from "@/components/profile/profile-edit-form"
import { getCurrentProfile } from "@/lib/actions/profile-actions"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface User {
  id: string
  email: string
  created_at: string
}

interface Profile {
  id: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  // always show edit screen by default to avoid conflicting edit flows
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const loadProfile = async () => {
      try {
        console.log("[v0] Loading user session...")
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          console.log("[v0] No authenticated user, redirecting to login")
          router.push("/auth/login")
          return
        }

        console.log("[v0] User authenticated, loading profile...")
        const { user: userData, profile: profileData } = await getCurrentProfile()
        setUser({
          ...userData,
          email: userData.email ?? "",
        })
        setProfile(profileData)
        console.log("[v0] Profile loaded successfully:", profileData.display_name)
      } catch (error) {
        console.error("[v0] Failed to load profile:", error)
        setError("Failed to load profile. Please try again.")
        // Don't redirect to login if we're already authenticated
        // The error might be temporary
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [supabase, router])

  const handleEditComplete = async () => {
    // Reload profile data
    try {
      const { profile: updatedProfile } = await getCurrentProfile()
      setProfile(updatedProfile)
    } catch (error) {
      console.error("Failed to reload profile:", error)
      setError("Failed to update profile. Please try again.")
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD600] mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            <p className="text-red-400 mb-4">{error}</p>
            <div className="space-y-2">
              <Button
                onClick={() => window.location.reload()}
                className="w-full bg-[#FFD600] text-black hover:bg-[#FFD600]/90"
              >
                Try Again
              </Button>
              <Button onClick={() => router.push("/messages")} variant="outline" className="w-full">
                Go to Messages
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!user || !profile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD600] mx-auto mb-4"></div>
            <p className="text-muted-foreground">Setting up your profile...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-gray-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-white">Settings</h1>
              <p className="text-sm text-gray-400">Manage your account</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <>
              <ProfileEditForm
                initialData={{
                  displayName: profile.display_name,
                  bio: profile.bio,
                  avatarUrl: profile.avatar_url,
                  status: (profile as any).status || "away",
                  email: user.email,
                }}
                onCancel={() => router.back()}
                onSave={handleEditComplete}
              />
              <div className="mt-8">
                <div className="bg-gradient-to-b from-[#18120a] to-[#181818] border border-[#222] shadow-lg rounded-2xl p-6">
                  <h2 className="text-white text-lg font-semibold mb-4">Profile Preview</h2>
                  <div className="flex items-center gap-4">
                    <img
                      src={profile.avatar_url || "/placeholder-user.jpg"}
                      alt={profile.display_name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-[#222]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold text-base">{profile.display_name}</span>
                      </div>
                      <div className="text-gray-400 text-sm">{profile.bio || "A.k.a the app Owner"}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="inline-block w-3 h-3 rounded-full bg-yellow-400" />
                        <span className="text-yellow-400 text-xs">Away</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
