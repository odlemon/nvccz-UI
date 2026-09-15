import { KYCUploadForm } from '@/components/procurement/kyc-upload-form'
import { ORG_NAME } from '@/lib/branding'

export const metadata = {
  title: `KYC Upload - ${ORG_NAME} Vendor Portal`,
  description: 'Upload KYC documents for vendor verification',
}

interface KYCPageProps {
  params: {
    token: string
  }
}

export default function KYCUploadPage({ params }: KYCPageProps) {
  return <KYCUploadForm token={params.token} />
}
