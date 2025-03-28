import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { SupabaseAuthProvider } from "@/components/supabase-auth-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Find Winning Ads",
  description: "Search for winning ad creatives",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SupabaseAuthProvider>
          {children}
        </SupabaseAuthProvider>
      </body>
    </html>
  )
}



import './globals.css'