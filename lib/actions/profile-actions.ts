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

export async function updateProfileWithAvatar(formData: { displayName: string; bio: string; avatarUrl?: string | null }) {
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
      avatar_url: formData.avatarUrl ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (error) {
    throw new Error("Failed to update profile")
  }

  // revalidate pages that use profile/avatar
  revalidatePath("/profile")
  revalidatePath("/messages")
  revalidatePath("/discover")
  return true
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
  try {
    // server actions run in Node — convert File to ArrayBuffer/Buffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, buffer, {
      cacheControl: "3600",
      upsert: false,
      // contentType may help storage identify the MIME
      contentType: file.type,
    } as any)

    if (uploadError) {
      console.error("Supabase upload error:", uploadError)
      throw new Error("Failed to upload avatar")
    }

    // Get public URL
    const pubRes = supabase.storage.from("avatars").getPublicUrl(filePath)
    const publicUrl = (pubRes as any)?.data?.publicUrl || null

    if (!publicUrl) {
      console.warn("No public URL returned for avatar upload")
    }

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
  } catch (err) {
    console.error("uploadAvatar error:", err)
    throw new Error("Failed to upload avatar")
  }
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
