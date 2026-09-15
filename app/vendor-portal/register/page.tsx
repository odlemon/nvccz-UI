import { VendorRegistrationForm } from '@/components/procurement/vendor-registration-form'
import { ORG_NAME } from '@/lib/branding'

export const metadata = {
  title: `Vendor Registration - ${ORG_NAME}`,
  description: `Register as a vendor with ${ORG_NAME}`,
}

export default function VendorRegistrationPage() {
  return <VendorRegistrationForm />
}
