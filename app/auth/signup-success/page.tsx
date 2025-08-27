import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary">OffGrid</h1>
          </div>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Check Your Email</CardTitle>
              <CardDescription className="text-muted-foreground">We've sent you a confirmation link</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Please check your email and click the confirmation link to activate your OffGrid account.
                </p>
                <div className="pt-4">
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href="/auth/login">Back to Sign In</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
