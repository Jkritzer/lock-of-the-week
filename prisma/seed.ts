import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PARTICIPANTS = [
  "Divo",
  "Kev",
  "Shooter Mike",
  "Kritzer",
  "Russ",
  "Kris",
  "Cwieka",
  "Fabz",
  "Burg",
];

async function main() {
  for (const name of PARTICIPANTS) {
    await prisma.participant.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Seeded ${PARTICIPANTS.length} participants.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
