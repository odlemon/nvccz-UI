// DEV only: the organisation's company profile, and realistic display names for the eight demo personas.
//
//   node dev_profile_personas.mjs            show what would change
//   node dev_profile_personas.mjs --apply    write it
//
// The profile names the organisation on generated documents (letterhead). Registration and tax numbers are
// left empty on purpose: they are statutory identifiers and must come from the organisation, not be invented.
// Persona logins (emails, passwords, roles, departments) do not change; only the names people see do.
import pkg from "@prisma/client"
const { PrismaClient } = pkg
const prisma = new PrismaClient()
const APPLY = process.argv.includes("--apply")

const PROFILE = {
  legalName: "Matanho Investment Management (Private) Limited",
  email: "procurement@matanho.com",
  website: "https://matanho.com",
  fiscalTimezone: "Africa/Harare",
}
const ADDRESS = { label: "Head office", line1: "Head Office", city: "Harare", country: "Zimbabwe", isActive: true }

const PEOPLE = {
  "proc.mgr@nts.local": ["Tafadzwa", "Moyo"],
  "proc.officer@nts.local": ["Rumbidzai", "Chikwanha"],
  "proc.buyer@nts.local": ["Tinotenda", "Marufu"],
  "proc.requester@nts.local": ["Kudakwashe", "Ncube"],
  "proc.ap@nts.local": ["Chipo", "Mlambo"],
  "perf.deptmgr@nts.local": ["Farai", "Mutasa"],
  "payroll.finmgr@nts.local": ["Blessing", "Sibanda"],
  "payroll.intaudit@nts.local": ["Rutendo", "Dube"],
}

try {
  const existing = await prisma.companyProfile.findFirst({ include: { addresses: true } })
  console.log("profile now:", existing ? `${existing.legalName} (${existing.addresses.length} address)` : "none")
  const users = await prisma.user.findMany({ where: { email: { in: Object.keys(PEOPLE) } }, select: { id: true, email: true, firstName: true, lastName: true } })
  for (const u of users) console.log(`  ${u.email.padEnd(28)} ${u.firstName} ${u.lastName} -> ${PEOPLE[u.email].join(" ")}`)
  if (!APPLY) {
    console.log("dry run: nothing written (pass --apply)")
    process.exit(0)
  }
  const profile = existing
    ? await prisma.companyProfile.update({ where: { id: existing.id }, data: PROFILE })
    : await prisma.companyProfile.create({ data: PROFILE })
  if (!(existing?.addresses?.length)) await prisma.companyProfileAddress.create({ data: { ...ADDRESS, companyProfileId: profile.id } })
  for (const u of users) {
    const [firstName, lastName] = PEOPLE[u.email]
    await prisma.user.update({ where: { id: u.id }, data: { firstName, lastName } })
  }
  console.log(`written: profile ${profile.id}, ${users.length} persona names`)
} finally {
  await prisma.$disconnect()
}
