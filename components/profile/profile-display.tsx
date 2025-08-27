"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Edit } from "lucide-react"

interface ProfileDisplayProps {
  profile: {
    display_name: string
    bio: string | null
    avatar_url: string | null
    created_at: string
  }
  userEmail: string
  onEdit: () => void
}

export function ProfileDisplay({ profile, userEmail, onEdit }: ProfileDisplayProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
            <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
              {profile.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-foreground">{profile.display_name}</h3>
            {profile.bio && <p className="text-muted-foreground max-w-md">{profile.bio}</p>}
          </div>

          <Button onClick={onEdit} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        <div className="mt-6 pt-6 border-t border-border space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Email</span>
            <span className="text-sm text-foreground">{userEmail}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Member Since</span>
            <span className="text-sm text-foreground">{new Date(profile.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
