import type { Metadata } from 'next'
import { ForecastingV2Layout } from '@/components/layout/forecasting-v2-layout'

export const metadata: Metadata = {
  title: 'Arcus FP&A',
  description: 'Financial Planning & Analysis Platform',
}

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <ForecastingV2Layout>{children}</ForecastingV2Layout>
}
