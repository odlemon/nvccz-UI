import { Hv3Page } from "@/components/home-v3-mock/hv3-page"

export default function Page({ params }: { params: { id: string } }) {
  return <Hv3Page subModuleId="hv3-forums">{params.id}</Hv3Page>
}
