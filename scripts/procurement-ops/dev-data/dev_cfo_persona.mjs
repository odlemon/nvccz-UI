// DEV only: a Chief Financial Officer persona, for testing what only an administrator or the CFO may do in procurement
// (changing the requisition approval matrix, deciding any approval step). Run inside the dev API container through
// dev_api_node.py, like the other dev-data scripts; it signs in the way the eight demo personas do.
//
//   node dev_cfo_persona.mjs            show what would change
//   node dev_cfo_persona.mjs --apply    create or update it
import pkg from "@prisma/client"
import bcrypt from "bcrypt"
const { PrismaClient } = pkg
const prisma = new PrismaClient()
const APPLY = process.argv.includes("--apply")
const EMAIL = "proc.cfo@nts.local"

try {
  const role = await prisma.role.findFirst({ where: { name: "Chief Financial Officer" }, select: { id: true } })
  if (!role) throw new Error('role "Chief Financial Officer" not found')
  const existing = await prisma.user.findFirst({ where: { email: EMAIL }, select: { id: true, roleCode: true, userDepartment: true } })
  console.log(existing ? `${EMAIL} exists (${existing.roleCode}, ${existing.userDepartment})` : `${EMAIL} will be created`)
  if (!APPLY) {
    console.log("dry run: nothing written (pass --apply)")
    process.exit(0)
  }
  const data = {
    firstName: "Tendai",
    lastName: "Chirwa",
    roleId: role.id,
    roleCode: "CFO",
    userDepartment: "Finance",
    departmentRole: "MEMBER",
    mustChangePassword: false,
  }
  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data })
  } else {
    await prisma.user.create({ data: { ...data, email: EMAIL, password: await bcrypt.hash("admin123", 10) } })
  }
  console.log(`written: ${EMAIL}`)
} finally {
  await prisma.$disconnect()
}
