import { LpDocumentCentreScreen } from "@/components/lp-portal/screens/lp-document-centre-screen"

export default function DocumentsPage({
  searchParams,
}: {
  searchParams?: { category?: string }
}) {
  return <LpDocumentCentreScreen initialCategory={searchParams?.category} />
}
