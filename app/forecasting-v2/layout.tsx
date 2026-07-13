import type { Metadata } from 'next'
import './globals.css'
import { ForecastingThemeProvider } from '@/components/fpna/theme-provider'

export const metadata: Metadata = {
  title: 'Arcus FP&A',
  description: 'Financial Planning & Analysis Platform',
}

export default function ForecastingV2Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <ForecastingThemeProvider>{children}</ForecastingThemeProvider>
}
