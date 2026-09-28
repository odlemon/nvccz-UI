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
import { ORG_NAME, ORG_LOGO_PATH } from '@/lib/branding'
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
  // A supplier is identified by the signed link in its invitation, not by an email address and an RFQ number anyone could type.
  const [invitationLink, setInvitationLink] = useState(searchParams?.get('link') || '')
  const [linkError, setLinkError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [logoError, setLogoError] = useState(false)

  const handleAccess = () => {
    setLinkError(null)
    const raw = invitationLink.trim()
    if (!raw) return
    setIsSubmitting(true)
    try {
      // The invitation link carries `token` and `rfqNumber`; the pasted address may be the whole link or just its query.
      const query = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : raw
      const params = new URLSearchParams(query)
      const token = params.get('token')
      const rfqNumber = params.get('rfqNumber')
      if (!token || !rfqNumber) {
        setLinkError('That is not an invitation link. Paste the full link from your invitation email.')
        return
      }
      window.location.href = `/vendor-quotations/rfq-respond?token=${encodeURIComponent(token)}&rfqNumber=${encodeURIComponent(rfqNumber)}`
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
                    src={ORG_LOGO_PATH}
                    alt={ORG_NAME}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    onError={() => setLogoError(true)}
                    priority
                  />
                ) : (
                  <span className="text-sm font-bold text-blue-700">{ORG_NAME.substring(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">Vendor Portal</h1>
                <p className="text-sm text-muted-foreground">
                  {ORG_NAME}
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
                Submit quotations for Request for Quotations (RFQs) sent by {ORG_NAME}
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
                        <span>You received an email with a personal, secure link to the request for quotation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>Open that link, or paste it below, to see only the events you are invited to</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>Review the requirements and submit your quotation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>Get a receipt for your submission and track its status from the same link</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Access Form */}
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="invitationLink">
                    Your invitation link <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="invitationLink"
                      placeholder="Paste the link from your invitation email"
                      value={invitationLink}
                      onChange={(e) => setInvitationLink(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {linkError && <p className="text-xs text-red-600" role="alert">{linkError}</p>}
                  <p className="text-xs text-muted-foreground">
                    The link is personal to your company and to one event. Do not share it.
                  </p>
                </div>

                <Button
                  onClick={handleAccess}
                  disabled={!invitationLink.trim() || isSubmitting}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    'Accessing...'
                  ) : (
                    <>
                      Open my invitation
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
                  Use the full link from your invitation email. If it has expired, or your company is no longer
                  invited to the event, contact the procurement team.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Want to become a vendor?</h4>
                <p className="text-muted-foreground mb-3">
                  Register now to start receiving RFQ invitations from {ORG_NAME}
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
            <p>© {new Date().getFullYear()} {ORG_NAME}. All rights reserved.</p>
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
