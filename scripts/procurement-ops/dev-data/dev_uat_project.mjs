// DEV only: one active project named "UAT project ..." so the requisition form's Project / cost centre can be tested.
// Run inside the dev API container through dev_api_node.py.
//
//   node dev_uat_project.mjs            show what exists
//   node dev_uat_project.mjs --apply    create it if missing
//   node dev_uat_project.mjs --remove   clear it from any requisition and delete it
import pkg from "@prisma/client"
const { PrismaClient } = pkg
const prisma = new PrismaClient()
const APPLY = process.argv.includes("--apply")
const REMOVE = process.argv.includes("--remove")
const NAME = "UAT project: warehouse refurbishment"

try {
  const existing = await prisma.project.findMany({ where: { name: { startsWith: "UAT project" } }, select: { id: true, name: true, isActive: true } })
  console.log(`UAT projects: ${existing.map((p) => `${p.name} (${p.isActive ? "active" : "inactive"})`).join(", ") || "none"}`)
  if (APPLY && !existing.length) {
    const p = await prisma.project.create({ data: { name: NAME, clientName: "Internal", projectType: "Capital works", status: "ACTIVE", isActive: true } })
    console.log(`created ${p.id}`)
  }
  if (REMOVE && existing.length) {
    const ids = existing.map((p) => p.id)
    const cleared = await prisma.purchaseRequisition.updateMany({ where: { projectId: { in: ids } }, data: { projectId: null } })
    const deleted = await prisma.project.deleteMany({ where: { id: { in: ids } } })
    console.log(`cleared from ${cleared.count} requisition(s); deleted ${deleted.count} project(s)`)
  }
} finally {
  await prisma.$disconnect()
}
