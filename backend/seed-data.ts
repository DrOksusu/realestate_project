import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('데이터 시드 시작...');

  // 1. 사용자 생성 (소유주)
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      email: 'owner@example.com',
      password: hashedPassword,
      name: '건물주',
      phone: '010-1234-5678',
    },
  });
  console.log('사용자 생성:', user.name);

  // 2. 부동산(건물) 생성
  const property = await prisma.property.create({
    data: {
      ownerId: user.id,
      name: 'KC빌딩',
      propertyType: 'BUILDING',
      address: '서울 동작구 사당동 127-9번지',
      area: 500, // 예상 면적 (실제 면적 입력 필요)
      purchasePrice: 2000000000, // 예상 매입가 20억 (실제 매입가 입력 필요)
      purchaseDate: new Date('2020-01-01'), // 예상 매입일 (실제 매입일 입력 필요)
      acquisitionCost: 100000000, // 예상 취득비용 1억
      loanAmount: 1000000000, // 예상 대출금 10억 (실제 대출금 입력 필요)
      loanInterestRate: 4.5, // 예상 이자율
      status: 'OCCUPIED',
      currentValue: 2500000000, // 예상 현재 시세 25억
      memo: '사당동 KC빌딩 - 4층 상가 건물',
    },
  });
  console.log('부동산 생성:', property.name);

  // 3. 임차인 및 계약 데이터
  const tenantsData = [
    {
      floor: '1층',
      name: '왕창마트',
      monthlyRent: 3800000,
      managementFee: 300000,
      deposit: 100000000,
    },
    {
      floor: '2층',
      name: '희목',
      monthlyRent: 1300000,
      managementFee: 300000,
      deposit: 45000000,
    },
    {
      floor: '3층',
      name: '골든벨학원',
      monthlyRent: 1400000,
      managementFee: 100000,
      deposit: 20000000,
    },
    {
      floor: '4층',
      name: '주식회사디바',
      monthlyRent: 1200000,
      managementFee: 100000,
      deposit: 20000000,
    },
  ];

  // 계약 시작일/종료일 설정 (예: 2024-01-01 ~ 2025-12-31)
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2025-12-31');

  for (const data of tenantsData) {
    // 임차인 생성
    const tenant = await prisma.tenant.create({
      data: {
        name: data.name,
        memo: `${data.floor} 임차인`,
      },
    });
    console.log('임차인 생성:', tenant.name);

    // 계약 생성
    const lease = await prisma.lease.create({
      data: {
        propertyId: property.id,
        tenantId: tenant.id,
        leaseType: 'MONTHLY',
        deposit: data.deposit,
        monthlyRent: data.monthlyRent,
        managementFee: data.managementFee,
        startDate,
        endDate,
        rentDueDay: 25, // 매월 25일 납부
        status: 'ACTIVE',
        memo: `${data.floor} - ${data.name}`,
      },
    });
    console.log('계약 생성:', `${data.floor} - ${data.name}`);

    // 2024년 12월 납부 내역 생성 (완료 상태)
    await prisma.rentPayment.create({
      data: {
        leaseId: lease.id,
        paymentYear: 2024,
        paymentMonth: 12,
        dueDate: new Date('2024-12-25'),
        paymentDate: new Date('2024-12-25'),
        rentAmount: data.monthlyRent,
        managementFeeAmount: data.managementFee,
        totalAmount: data.monthlyRent + data.managementFee,
        paymentMethod: 'TRANSFER',
        rentStatus: 'PAID',
        managementFeeStatus: 'PAID',
      },
    });

    // 2025년 1월 납부 내역 생성 (대기 상태)
    await prisma.rentPayment.create({
      data: {
        leaseId: lease.id,
        paymentYear: 2025,
        paymentMonth: 1,
        dueDate: new Date('2025-01-25'),
        rentAmount: data.monthlyRent,
        managementFeeAmount: data.managementFee,
        totalAmount: data.monthlyRent + data.managementFee,
        paymentMethod: 'TRANSFER',
        rentStatus: 'PENDING',
        managementFeeStatus: 'PENDING',
      },
    });
  }

  console.log('납부 내역 생성 완료');

  // 4. 지출 데이터 생성 (예시)
  const expenses = [
    { type: 'PROPERTY_TAX', amount: 5000000, date: '2024-07-15', desc: '2024년 재산세' },
    { type: 'INSURANCE', amount: 1200000, date: '2024-03-01', desc: '건물 화재보험' },
    { type: 'MAINTENANCE', amount: 800000, date: '2024-11-10', desc: '엘리베이터 점검' },
    { type: 'LOAN_INTEREST', amount: 3750000, date: '2024-12-01', desc: '12월 대출이자 (월)' },
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
  console.log('지출 내역 생성 완료');

  console.log('\n=== 데이터 시드 완료 ===');
  console.log(`로그인 정보: owner@example.com / password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
