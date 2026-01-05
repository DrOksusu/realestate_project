import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('ok2010ok!!', 10);

  const user = await prisma.user.update({
    where: { email: 'owner@example.com' },
    data: {
      email: 'ok4192@hanmail.com',
      password: hashedPassword,
    },
  });

  console.log('사용자 정보 업데이트 완료');
  console.log('이메일:', user.email);
  console.log('비밀번호: ok2010ok!!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
