import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const leases = await prisma.lease.findMany({
    include: { tenant: true }
  });

  console.log('=== 계약별 관리비 ===');
  leases.forEach(l => {
    console.log(`${l.tenant.name}: 월세 ${Number(l.monthlyRent).toLocaleString()}원 / 관리비 ${Number(l.managementFee).toLocaleString()}원`);
  });

  const payments = await prisma.rentPayment.findMany({
    include: { lease: { include: { tenant: true } } },
    orderBy: [{ paymentYear: 'desc' }, { paymentMonth: 'desc' }],
    take: 8
  });

  console.log('\n=== 납부 내역 (관리비 포함) ===');
  payments.forEach(p => {
    console.log(`${p.lease.tenant.name} ${p.paymentYear}년 ${p.paymentMonth}월: 월세 ${Number(p.rentAmount).toLocaleString()}원 + 관리비 ${Number(p.managementFeeAmount).toLocaleString()}원 = 총 ${Number(p.totalAmount).toLocaleString()}원 [${p.managementFeeStatus}]`);
  });
}

main().finally(() => prisma.$disconnect());
