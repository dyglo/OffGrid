"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function sendFollowRequest(userId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  if (user.id === userId) {
    throw new Error("Cannot follow yourself")
  }

  // Check if already following or request exists
  const { data: existingFollow, error: checkError } = await supabase
    .from("follows")
    .select("id, status")
    .eq("follower_id", user.id)
    .eq("following_id", userId)
    .single()

  if (checkError && checkError.code !== 'PGRST116') {
    throw new Error("Failed to check follow status")
  }

  if (existingFollow) {
    if (existingFollow.status === 'accepted') {
      throw new Error("Already following this user")
    }
    if (existingFollow.status === 'pending') {
      throw new Error("Follow request already sent")
    }
  }

  // Insert or update follow request
  const { error } = await supabase.from("follows").upsert({
    follower_id: user.id,
    following_id: userId,
    status: 'pending'
  }, {
    onConflict: 'follower_id,following_id'
  })

  if (error) {
    throw new Error("Failed to send follow request")
  }

  // Create notification for the user being followed
  const { error: notificationError } = await supabase.from("follow_notifications").insert({
    follower_id: user.id,
    following_id: userId,
    status: 'pending'
  })

  if (notificationError) {
    console.error("Failed to create notification:", notificationError)
  }

  revalidatePath("/discover")
  revalidatePath("/requests")
  revalidatePath("/friends")
}

export async function acceptFollowRequest(followerId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  // Update follow status to accepted
  const { error: followError } = await supabase
    .from("follows")
    .update({ status: 'accepted' })
    .eq("follower_id", followerId)
    .eq("following_id", user.id)
    .eq("status", 'pending')

  if (followError) {
    throw new Error("Failed to accept follow request")
  }

  // Update notification status
  const { error: notificationError } = await supabase
    .from("follow_notifications")
    .update({ status: 'accepted' })
    .eq("follower_id", followerId)
    .eq("following_id", user.id)
    .eq("status", 'pending')

  if (notificationError) {
    console.error("Failed to update notification:", notificationError)
  }

  // Create notification for the follower that their request was accepted
  const { error: acceptedNotificationError } = await supabase.from("follow_notifications").insert({
    follower_id: followerId,
    following_id: user.id,
    status: 'accepted'
  })

  if (acceptedNotificationError) {
    console.error("Failed to create accepted notification:", acceptedNotificationError)
  }

  revalidatePath("/requests")
  revalidatePath("/friends")
  revalidatePath("/discover")
}

export async function rejectFollowRequest(followerId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  // Update follow status to rejected
  const { error: followError } = await supabase
    .from("follows")
    .update({ status: 'rejected' })
    .eq("follower_id", followerId)
    .eq("following_id", user.id)
    .eq("status", 'pending')

  if (followError) {
    throw new Error("Failed to reject follow request")
  }

  // Update notification status
  const { error: notificationError } = await supabase
    .from("follow_notifications")
    .update({ status: 'rejected' })
    .eq("follower_id", followerId)
    .eq("following_id", user.id)
    .eq("status", 'pending')

  if (notificationError) {
    console.error("Failed to update notification:", notificationError)
  }

  revalidatePath("/requests")
  revalidatePath("/friends")
  revalidatePath("/discover")
}

export async function unfollowUser(userId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const { error } = await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", userId)

  if (error) {
    throw new Error("Failed to unfollow user")
  }

  // Remove related notifications
  await supabase.from("follow_notifications").delete()
    .eq("follower_id", user.id)
    .eq("following_id", userId)

  revalidatePath("/friends")
  revalidatePath("/discover")
}

export async function getAllUsers() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, display_name, bio, avatar_url")
    .neq("id", user.id)
    .order("display_name")

  if (error) {
    throw new Error("Failed to get users")
  }

  return users || []
}

export async function searchUsers(query: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, display_name, bio, avatar_url")
    .ilike("display_name", `%${query}%`)
    .neq("id", user.id)
    .limit(10)

  if (error) {
    throw new Error("Failed to search users")
  }

  return users || []
}

export async function getFollowStatus(userId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { status: 'none', isFollowing: false }
  }

  const { data, error } = await supabase
    .from("follows")
    .select("id, status")
    .eq("follower_id", user.id)
    .eq("following_id", userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return { status: 'none', isFollowing: false }
  }

  if (!data) {
    return { status: 'none', isFollowing: false }
  }

  return { 
    status: data.status, 
    isFollowing: data.status === 'accepted' 
  }
}

export async function getPendingFollowRequests() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const { data: requests, error } = await supabase
    .from("follows")
    .select(`
      id,
      follower_id,
      created_at,
      follower:profiles!follows_follower_id_fkey (
        id,
        display_name,
        bio,
        avatar_url
      )
    `)
    .eq("following_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error("Failed to get pending follow requests")
  }

  return requests || []
}

export async function getFollowNotifications() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const { data: notifications, error } = await supabase
    .from("follow_notifications")
    .select(`
      id,
      follower_id,
      following_id,
      status,
      created_at,
      follower:profiles!follow_notifications_follower_id_fkey (
        id,
        display_name,
        bio,
        avatar_url
      ),
      following:profiles!follow_notifications_following_id_fkey (
        id,
        display_name,
        bio,
        avatar_url
      )
    `)
    .eq("follower_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) {
    throw new Error("Failed to get follow notifications")
  }

  return notifications || []
}

export async function getFollowers(userId?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const targetUserId = userId || user.id

  const { data: followers, error } = await supabase
    .from("follows")
    .select(
      `
      follower_id,
      profiles!follows_follower_id_fkey (
        id,
        display_name,
        bio,
        avatar_url
      )
    `,
    )
    .eq("following_id", targetUserId)
    .eq("status", "accepted")

  if (error) {
    throw new Error("Failed to get followers")
  }

  return followers || []
}

export async function getFollowing(userId?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const targetUserId = userId || user.id

  const { data: following, error } = await supabase
    .from("follows")
    .select(
      `
      following_id,
      profiles!follows_following_id_fkey (
        id,
        display_name,
        bio,
        avatar_url
      )
    `,
    )
    .eq("follower_id", targetUserId)
    .eq("status", "accepted")

  if (error) {
    throw new Error("Failed to get following")
  }

  return following || []
}
