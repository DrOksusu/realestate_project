import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// 공유된 부동산 조회 (인증 불필요)
export const getSharedProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    const property = await prisma.property.findFirst({
      where: { shareToken: token },
      include: {
        leases: {
          where: { status: 'ACTIVE' },
          include: {
            tenant: {
              select: {
                name: true, // 이름만 공개
              },
            },
          },
        },
        valuations: {
          orderBy: { calculatedAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!property) {
      res.status(404).json({ error: '공유 링크가 유효하지 않습니다.' });
      return;
    }

    // 만료 확인
    if (property.shareExpiresAt && new Date() > property.shareExpiresAt) {
      res.status(410).json({ error: '공유 링크가 만료되었습니다.' });
      return;
    }

    // 민감 정보 제거 후 반환
    const safeProperty = {
      id: property.id,
      name: property.name,
      propertyType: property.propertyType,
      address: property.address,
      area: property.area,
      status: property.status,
      purchasePrice: property.purchasePrice,
      acquisitionCost: property.acquisitionCost,
      loanAmount: property.loanAmount,
      currentValue: property.currentValue,
      leases: property.leases.map((lease) => ({
        id: lease.id,
        floor: lease.floor,
        areaPyeong: lease.areaPyeong,
        leaseType: lease.leaseType,
        deposit: lease.deposit,
        monthlyRent: lease.monthlyRent,
        managementFee: lease.managementFee,
        hasVat: lease.hasVat,
        startDate: lease.startDate,
        endDate: lease.endDate,
        status: lease.status,
        tenant: lease.tenant,
      })),
      valuations: property.valuations.map((v) => ({
        id: v.id,
        annualRent: v.annualRent,
        totalDeposit: v.totalDeposit,
        annualExpense: v.annualExpense,
        netIncome: v.netIncome,
        totalInvestment: v.totalInvestment,
        grossYield: v.grossYield,
        netYield: v.netYield,
        cashOnCash: v.cashOnCash,
        targetYield: v.targetYield,
        suggestedPrice: v.suggestedPrice,
        expectedProfit: v.expectedProfit,
        calculatedAt: v.calculatedAt,
      })),
    };

    res.json(safeProperty);
  } catch (error) {
    console.error('GetSharedProperty error:', error);
    res.status(500).json({ error: '공유 정보 조회 중 오류가 발생했습니다.' });
  }
};
