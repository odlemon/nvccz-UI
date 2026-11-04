import { FpaRollingForecast } from "@/components/fpa/fpa-rolling-forecast"

export default function FpaRollingPage() {
  // Authorization for this protected route is enforced by middleware using
  // the server-side session. Keeping a second client-only guard here caused
  // valid admin sessions to fall back to Home while auth details hydrated.
  return <FpaRollingForecast />
}
