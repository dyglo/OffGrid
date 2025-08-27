"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AppLayout } from "@/components/layout/app-layout"
import { ProfileDisplay } from "@/components/profile/profile-display"
import { ProfileEditForm } from "@/components/profile/profile-edit-form"
import { getCurrentProfile } from "@/lib/actions/profile-actions"

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

export default function ProfilePage() {
  // supabase types may not perfectly line up with our local types; use any for fetched results
  const [user, setUser] = useState<any | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          console.log("[v0] No authenticated user, redirecting to login")
          router.push("/auth/login")
          return
        }

        console.log("[v0] User authenticated, loading profile")
        const { user: userData, profile: profileData } = await getCurrentProfile()
        setUser(userData)
        setProfile(profileData)
        console.log("[v0] Profile loaded successfully")
      } catch (error) {
        console.error("[v0] Failed to load profile:", error)
        setError("Failed to load profile. Please try again.")
        router.push("/auth/login")
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [supabase, router])

  const handleEditComplete = async () => {
    setIsEditing(false)
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
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#FFD600] text-black rounded-lg hover:bg-[#FFD600]/90"
            >
              Try Again
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!user || !profile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <div className="flex-1 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-foreground mb-2">Profile</h2>
              <p className="text-muted-foreground">Manage your account settings</p>
            </div>

            {isEditing ? (
              <ProfileEditForm
                initialData={{
                  displayName: profile.display_name,
                  bio: profile.bio,
                  avatarUrl: profile.avatar_url,
                }}
                onCancel={() => setIsEditing(false)}
                onSave={handleEditComplete}
              />
            ) : (
              <ProfileDisplay profile={profile} userEmail={user.email} onEdit={() => setIsEditing(true)} />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
