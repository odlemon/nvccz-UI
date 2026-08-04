import { EhPage } from "@/components/employee-hub-mock/eh-page"
import { ProfileScreen } from "@/components/employee-hub-mock/screens/profile-screen"

export default function ProfilePage() {
  return (
    <EhPage subModuleId="eh-people">
      <ProfileScreen />
    </EhPage>
  )
}
