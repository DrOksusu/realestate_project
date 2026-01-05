import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 부동산 소유주를 id: 2 (ok4192@hanmail.net)로 변경
  await prisma.property.update({
    where: { id: 1 },
    data: { ownerId: 2 },
  });

  console.log('부동산 소유주 변경 완료: ok4192@hanmail.net');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
