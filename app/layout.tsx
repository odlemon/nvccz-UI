import type React from "react"
import type { Metadata } from "next"
import { Montserrat } from "next/font/google"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { StoreProvider } from "@/lib/store/provider"
import { AuthProvider } from "@/lib/auth/AuthProvider"
import { Toaster } from "sonner"
import { RouteTransition } from "@/components/route-transition"
import "./globals.css"

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Arcus - Investment ERP",
  description: "Professional Investment Management Platform",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${montserrat.variable} ${GeistMono.variable} antialiased`}>
        <StoreProvider>
          <AuthProvider>
            <RouteTransition>
              <Suspense fallback={null}>{children}</Suspense>
            </RouteTransition>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid rgba(0, 0, 0, 0.1)",
                  color: "rgba(0, 0, 0, 0.9)",
                  fontWeight: "600",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                },
                className: "font-semibold",
              }}
            />
          </AuthProvider>
        </StoreProvider>
        <Analytics />
      </body>
    </html>
  )
}
