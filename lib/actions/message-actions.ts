"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function sendMessage(
  receiverId: string,
  content: string,
  attachments?: Array<{
    // either provide file_url (public) OR provide bucket + file_path for server to create signed url
    file_url?: string
    bucket?: string
    file_path?: string
    file_type?: string
    file_name?: string
    file_size?: number
  }>,
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  // allow empty content if attachments will be provided
  if (!content.trim() && !(attachments && attachments.length > 0)) {
    throw new Error("Message cannot be empty")
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content: content.trim(),
      status: "sent", // initial status
    })
    .select()
    .single()

  if (error) {
    throw new Error("Failed to send message")
  }

  // insert attachments if provided
  if (attachments && attachments.length > 0) {
    const attachRows: any[] = []
    for (const a of attachments) {
      let fileUrl = a.file_url || null
      if (!fileUrl && a.bucket && a.file_path) {
        try {
          // Try to create a signed URL valid for 1 hour
          const { data: signed, error: signErr } = await supabase.storage.from(a.bucket).createSignedUrl(a.file_path, 3600)
          if (!signErr && signed?.signedUrl) {
            fileUrl = signed.signedUrl
          } else {
            // fallback to public URL (if bucket is public)
            try {
              const pub = supabase.storage.from(a.bucket).getPublicUrl(a.file_path)
              if ((pub as any)?.data?.publicUrl) fileUrl = (pub as any).data.publicUrl
            } catch (err) {
              console.error("Failed to get public URL", err)
            }
          }
        } catch (err) {
          console.error("Failed to create signed URL", err)
        }
      }

      attachRows.push({
        message_id: data.id,
        file_url: fileUrl || a.file_url || "",
        file_type: a.file_type || "",
        file_name: a.file_name || "",
        file_size: a.file_size || null,
      })
    }

    const { error: attErr } = await supabase.from("attachments").insert(attachRows)
    if (attErr) {
      // log but don't fail the message send
      console.error("Failed to insert attachments", attErr)
    }
  }

  revalidatePath("/messages")
  // If this send is a reply from the current user, mark any incoming messages from the receiver as read
  try {
    await supabase
      .from("messages")
      .update({ status: "read" })
      .match({ sender_id: receiverId, receiver_id: user.id })
      .neq("status", "read")
  } catch (err) {
    console.error("Failed to mark messages as read on reply", err)
  }
  return data
}

export async function markMessageDelivered(messageId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Not authenticated")

  try {
    const { error } = await supabase.from("messages").update({ status: "delivered" }).eq("id", messageId)
    if (error) console.error("Failed to mark delivered", error)
  } catch (err) {
    console.error("markMessageDelivered error", err)
  }

  revalidatePath("/messages")
}

export async function getConversations() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  // Get latest message for each conversation
  const { data: conversations, error } = await supabase
    .from("messages")
    .select(
      `
      id,
      content,
      created_at,
      sender_id,
      receiver_id,
      sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url),
      receiver:profiles!messages_receiver_id_fkey(id, display_name, avatar_url)
    `,
    )
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error("Failed to get conversations")
  }

  // Group by conversation partner and get latest message
  const conversationMap = new Map()

  conversations?.forEach((message: any) => {
    const partnerId = message.sender_id === user.id ? message.receiver_id : message.sender_id
    const partner = message.sender_id === user.id ? message.receiver : message.sender

    if (!conversationMap.has(partnerId)) {
      conversationMap.set(partnerId, {
        partnerId,
        partner,
        lastMessage: message,
        unreadCount: 0, // TODO: Implement unread count
      })
    }
  })

  return Array.from(conversationMap.values())
}

export async function getMessages(partnerId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const { data: messages, error } = await supabase
    .from("messages")
    .select(
      `
      id,
      content,
      created_at,
      sender_id,
      receiver_id,
      sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url),
      receiver:profiles!messages_receiver_id_fkey(id, display_name, avatar_url),
      attachments:attachments(file_url, file_type, file_name, file_size, created_at)
    `,
    )
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`,
    )
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error("Failed to get messages")
  }

  return messages || []
}

export async function getUserProfile(userId: string) {
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, display_name, bio, avatar_url")
    .eq("id", userId)
    .single()

  if (error) {
    throw new Error("Failed to get user profile")
  }

  return profile
}
