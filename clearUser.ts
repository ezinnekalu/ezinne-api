import { PrismaClient } from "./src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.deleteMany({});
  console.log("All users deleted");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
