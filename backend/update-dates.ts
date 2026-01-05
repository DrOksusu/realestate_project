import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('날짜 업데이트 시작...');

  // 1. 계약 기간 업데이트 (2025-01-01 ~ 2026-12-31)
  await prisma.lease.updateMany({
    data: {
      startDate: new Date('2025-01-01'),
      endDate: new Date('2026-12-31'),
    },
  });
  console.log('계약 기간 업데이트 완료: 2025-01-01 ~ 2026-12-31');

  // 2. 기존 납부 내역 삭제
  await prisma.rentPayment.deleteMany({});
  console.log('기존 납부 내역 삭제 완료');

  // 3. 새 납부 내역 생성 (2025년 1월 ~ 2026년 1월)
  const leases = await prisma.lease.findMany({
    include: { tenant: true },
  });

  for (const lease of leases) {
    // 2025년 1월 ~ 12월 (납부 완료)
    for (let month = 1; month <= 12; month++) {
      await prisma.rentPayment.create({
        data: {
          leaseId: lease.id,
          paymentYear: 2025,
          paymentMonth: month,
          dueDate: new Date(2025, month - 1, 25),
          paymentDate: new Date(2025, month - 1, 25),
          rentAmount: lease.monthlyRent,
          managementFeeAmount: lease.managementFee,
          totalAmount: Number(lease.monthlyRent) + Number(lease.managementFee),
          paymentMethod: 'TRANSFER',
          rentStatus: 'PAID',
          managementFeeStatus: 'PAID',
        },
      });
    }

    // 2026년 1월 (미납 - 아직 납부일 안됨, 25일이 납부일)
    await prisma.rentPayment.create({
      data: {
        leaseId: lease.id,
        paymentYear: 2026,
        paymentMonth: 1,
        dueDate: new Date(2026, 0, 25), // 2026-01-25
        rentAmount: lease.monthlyRent,
        managementFeeAmount: lease.managementFee,
        totalAmount: Number(lease.monthlyRent) + Number(lease.managementFee),
        paymentMethod: 'TRANSFER',
        rentStatus: 'PENDING',
        managementFeeStatus: 'PENDING',
      },
    });

    console.log(`${lease.tenant.name} 납부 내역 생성 완료`);
  }

  // 4. 지출 내역 날짜 업데이트
  await prisma.expense.deleteMany({});

  const property = await prisma.property.findFirst();
  if (property) {
    const expenses = [
      { type: 'PROPERTY_TAX', amount: 5000000, date: '2025-07-15', desc: '2025년 재산세' },
      { type: 'PROPERTY_TAX', amount: 2500000, date: '2025-09-15', desc: '2025년 재산세 2기분' },
      { type: 'INSURANCE', amount: 1200000, date: '2025-03-01', desc: '건물 화재보험' },
      { type: 'MAINTENANCE', amount: 800000, date: '2025-11-10', desc: '엘리베이터 점검' },
      { type: 'MAINTENANCE', amount: 450000, date: '2025-06-20', desc: '배수관 수리' },
      { type: 'LOAN_INTEREST', amount: 3750000, date: '2025-12-01', desc: '12월 대출이자' },
      { type: 'LOAN_INTEREST', amount: 3750000, date: '2026-01-02', desc: '1월 대출이자' },
    ];

    for (const exp of expenses) {
      await prisma.expense.create({
        data: {
          propertyId: property.id,
          expenseType: exp.type as any,
          amount: exp.amount,
          expenseDate: new Date(exp.date),
          description: exp.desc,
        },
      });
    }
    console.log('지출 내역 업데이트 완료');
  }

  console.log('\n=== 업데이트 완료 ===');
  console.log('오늘 날짜: 2026년 01월 06일');
  console.log('- 2025년 1~12월: 납부 완료');
  console.log('- 2026년 1월: 납부 대기 (25일 납부 예정)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
