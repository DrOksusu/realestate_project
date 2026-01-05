import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('=== Users ===');
  console.log(users);

  const properties = await prisma.property.findMany();
  console.log('\n=== Properties ===');
  console.log(properties);

  const tenants = await prisma.tenant.findMany();
  console.log('\n=== Tenants ===');
  console.log(tenants);

  const leases = await prisma.lease.findMany();
  console.log('\n=== Leases ===');
  console.log(leases);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
