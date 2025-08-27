import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

export const metadata: Metadata = {
  title: "OffGrid - Social Messaging",
  description: "Professional social messaging app with real-time chat and file sharing",
  generator: "v0.app",
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased bg-black text-white min-h-screen`}> 
        <div className="relative min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  )
}
