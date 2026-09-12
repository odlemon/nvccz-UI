// ============================================================================
// VENDOR PORTAL - PUBLIC LANDING PAGE
// No authentication required - vendors access via email link
// ============================================================================

'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  Mail,
  FileText,
  ArrowRight,
  Info,
  CheckCircle2,
  Plus,
} from 'lucide-react'

export default function VendorPortalPage() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState(searchParams?.get('email') || '')
  const [rfqNumber, setRfqNumber] = useState(searchParams?.get('rfq') || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [logoError, setLogoError] = useState(false)

  const getOrgLogo = () => {
    return process.env.NEXT_PUBLIC_ORGANIZATION_LOGO || '/logo.png'
  }

  const getOrgName = () => {
    return process.env.NEXT_PUBLIC_ORGANIZATION_NAME || 'Arcus'
  }

  const handleAccess = async () => {
    if (!email || !rfqNumber) return

    setIsSubmitting(true)
    try {
      // Redirect to RFQ details page
      window.location.href = `/vendor-portal/rfq/${rfqNumber}?email=${encodeURIComponent(email)}`
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 shadow-sm border border-blue-200 flex items-center justify-center overflow-hidden">
                {!logoError ? (
                  <Image
                    src={getOrgLogo()}
                    alt={getOrgName()}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    onError={() => setLogoError(true)}
                    priority
                  />
                ) : (
                  <span className="text-sm font-bold text-blue-700">{getOrgName().substring(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">Vendor Portal</h1>
                <p className="text-sm text-muted-foreground">
                  {getOrgName()}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-white">
              Public Portal
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Welcome Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Welcome to the Vendor Portal</CardTitle>
              <p className="text-muted-foreground">
                Submit quotations for Request for Quotations (RFQs) sent by {getOrgName()}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Info Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900 mb-1">How it works</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>You received an email with an RFQ number and access link</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>Enter your email and RFQ number below to access the RFQ</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>Review the requirements and submit your quotation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>Track your submission status via this portal</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Access Form */}
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Your Email Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="vendor@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter the email address where you received the RFQ invitation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rfqNumber">
                    RFQ Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="rfqNumber"
                      placeholder="RFQ-2024-001"
                      value={rfqNumber}
                      onChange={(e) => setRfqNumber(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Found in the email invitation you received
                  </p>
                </div>

                <Button
                  onClick={handleAccess}
                  disabled={!email || !rfqNumber || isSubmitting}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    'Accessing...'
                  ) : (
                    <>
                      Access RFQ
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium mb-1">Didn't receive an RFQ invitation?</h4>
                <p className="text-muted-foreground">
                  RFQ invitations are sent directly to registered vendors. Please check your spam
                  folder or contact the procurement team at{' '}
                  <a href="mailto:procurement@nvccz.co.zw" className="text-primary hover:underline">
                    procurement@nvccz.co.zw
                  </a>
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-1">Can't access your RFQ?</h4>
                <p className="text-muted-foreground">
                  Make sure you're using the exact email address and RFQ number from the
                  invitation. If you're still having trouble, contact our support team.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Want to become a vendor?</h4>
                <p className="text-muted-foreground mb-3">
                  Register now to start receiving RFQ invitations from {getOrgName()}
                </p>
                <Link href="/vendor-portal/register">
                  <Button className="gap-2">
                    <Plus size={18} />
                    Register as Vendor
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 {getOrgName()}. All rights reserved.</p>
            <p className="mt-1">
              This is a secure vendor portal. For security reasons, please do not share your access
              link.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
