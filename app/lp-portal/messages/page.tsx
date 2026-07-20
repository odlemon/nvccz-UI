import { redirect } from "next/navigation"

export default function MessagesPage() {
  redirect("/lp-portal/requests?tab=messages")
}
