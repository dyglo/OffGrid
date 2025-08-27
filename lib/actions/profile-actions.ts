"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateProfile(formData: {
  displayName: string
  bio: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: formData.displayName,
      bio: formData.bio,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (error) {
    throw new Error("Failed to update profile")
  }

  revalidatePath("/profile")
}

export async function uploadAvatar(file: File) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image")
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File size must be less than 5MB")
  }

  // Create unique filename
  const fileExt = file.name.split(".").pop()
  const fileName = `${user.id}-${Date.now()}.${fileExt}`
  const filePath = `avatars/${fileName}`

  // Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (uploadError) {
    throw new Error("Failed to upload avatar")
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath)

  // Update profile with new avatar URL
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (updateError) {
    // Clean up uploaded file if profile update fails
    await supabase.storage.from("avatars").remove([filePath])
    throw new Error("Failed to update profile with new avatar")
  }

  revalidatePath("/profile")
  return publicUrl
}

export async function removeAvatar() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  // Get current profile to find avatar URL
  const { data: profile } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single()

  // Update profile to remove avatar URL
  const { error } = await supabase
    .from("profiles")
    .update({
      avatar_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (error) {
    throw new Error("Failed to remove avatar")
  }

  // Try to delete the file from storage (optional, don't fail if it doesn't exist)
  if (profile?.avatar_url) {
    try {
      const fileName = profile.avatar_url.split("/").pop()
      if (fileName) {
        await supabase.storage.from("avatars").remove([`avatars/${fileName}`])
      }
    } catch (error) {
      // Ignore storage deletion errors
      console.warn("Failed to delete avatar file from storage:", error)
    }
  }

  revalidatePath("/profile")
}

export async function getCurrentProfile() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  // Try to get existing profile
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (error && error.code === "PGRST116") {
    // Profile doesn't exist, create one
    const defaultDisplayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "User"

    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        display_name: defaultDisplayName,
        bio: null,
        avatar_url: null,
      })
      .select("*")
      .single()

    if (createError) {
      throw new Error("Failed to create profile")
    }

    return { user, profile: newProfile }
  }

  if (error) {
    throw new Error("Failed to get profile")
  }

  return { user, profile }
}
