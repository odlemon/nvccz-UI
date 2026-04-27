import { KYCUploadForm } from '@/components/procurement/kyc-upload-form'

export const metadata = {
  title: 'KYC Upload - Arcus Vendor Portal',
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
