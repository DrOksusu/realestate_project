import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// 수익률 계산 및 매도가 시뮬레이션
export const calculateValuation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { propertyId, targetYield, memo } = req.body;

    // 부동산 조회
    const property = await prisma.property.findFirst({
      where: { id: propertyId, ownerId: userId },
      include: {
        leases: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    if (!property) {
      res.status(404).json({ error: '부동산을 찾을 수 없습니다.' });
      return;
    }

    const currentYear = new Date().getFullYear();

    // 연간 임대 수입 계산 (활성 계약 기준)
    const monthlyRent = property.leases.reduce(
      (sum, lease) => sum + Number(lease.monthlyRent),
      0
    );
    const annualRent = monthlyRent * 12;

    // 총 보증금 계산
    const totalDeposit = property.leases.reduce(
      (sum, lease) => sum + Number(lease.deposit),
      0
    );

    // 연간 지출 계산
    const expenseResult = await prisma.expense.aggregate({
      where: {
        propertyId,
        expenseDate: {
          gte: new Date(currentYear, 0, 1),
          lt: new Date(currentYear + 1, 0, 1),
        },
      },
      _sum: { amount: true },
    });
    const annualExpense = Number(expenseResult._sum.amount || 0);

    // 대출 이자 계산 (연간)
    const loanInterest =
      (Number(property.loanAmount) * Number(property.loanInterestRate)) / 100;
    const totalAnnualExpense = annualExpense + loanInterest;

    // 순수익
    const netIncome = annualRent - totalAnnualExpense;

    // 투자금 계산
    const purchasePrice = Number(property.purchasePrice);
    const acquisitionCost = Number(property.acquisitionCost);
    const loanAmount = Number(property.loanAmount);
    // 자기자본 = 매입가 + 취득부대비용 - 대출금 - 보증금
    const totalInvestment = purchasePrice + acquisitionCost - loanAmount - totalDeposit;

    // 수익률 계산
    const grossYield = purchasePrice > 0 ? (annualRent / purchasePrice) * 100 : 0;
    const netYield = purchasePrice > 0 ? (netIncome / purchasePrice) * 100 : 0;
    const cashOnCash = totalInvestment > 0 ? (netIncome / totalInvestment) * 100 : 0;

    // 목표 수익률에 따른 매도가 계산
    // 제안 매도가 = (연간 임대료 / 목표수익률) + 보증금
    const targetYieldValue = targetYield || 5; // 기본 5%
    const basePrice = annualRent > 0 ? Math.round(annualRent / (targetYieldValue / 100)) : 0;
    const suggestedPrice = basePrice + totalDeposit;

    // 예상 매매차익
    const expectedProfit = suggestedPrice - purchasePrice - acquisitionCost;

    // 시뮬레이션 저장
    const valuation = await prisma.propertyValuation.create({
      data: {
        propertyId,
        annualRent,
        totalDeposit,
        annualExpense: totalAnnualExpense,
        netIncome,
        totalInvestment,
        grossYield: Math.round(grossYield * 100) / 100,
        netYield: Math.round(netYield * 100) / 100,
        cashOnCash: Math.round(cashOnCash * 100) / 100,
        targetYield: targetYieldValue,
        suggestedPrice,
        expectedProfit,
        memo,
      },
      include: {
        property: {
          select: { id: true, name: true, address: true, purchasePrice: true },
        },
      },
    });

    res.status(201).json({
      valuation,
      details: {
        monthlyRent,
        annualRent,
        totalDeposit,
        annualExpense,
        loanInterest,
        totalAnnualExpense,
        netIncome,
        purchasePrice,
        acquisitionCost,
        loanAmount,
        totalInvestment,
        yields: {
          grossYield: Math.round(grossYield * 100) / 100,
          netYield: Math.round(netYield * 100) / 100,
          cashOnCash: Math.round(cashOnCash * 100) / 100,
        },
        targetYield: targetYieldValue,
        suggestedPrice,
        expectedProfit,
      },
    });
  } catch (error) {
    console.error('CalculateValuation error:', error);
    res.status(500).json({ error: '수익률 계산 중 오류가 발생했습니다.' });
  }
};

// 저장된 시뮬레이션 목록 조회
export const getValuations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { propertyId } = req.query;

    const where: {
      property: { ownerId: number };
      propertyId?: number;
    } = {
      property: { ownerId: userId },
    };

    if (propertyId) where.propertyId = parseInt(propertyId as string);

    const valuations = await prisma.propertyValuation.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            leases: {
              where: { status: 'ACTIVE' },
              select: { deposit: true },
            },
          },
        },
      },
      orderBy: { calculatedAt: 'desc' },
    });

    res.json(valuations);
  } catch (error) {
    console.error('GetValuations error:', error);
    res.status(500).json({ error: '시뮬레이션 목록 조회 중 오류가 발생했습니다.' });
  }
};

// 시뮬레이션 상세 조회
export const getValuation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const valuationId = parseInt(req.params.id);

    const valuation = await prisma.propertyValuation.findFirst({
      where: {
        id: valuationId,
        property: { ownerId: userId },
      },
      include: {
        property: true,
      },
    });

    if (!valuation) {
      res.status(404).json({ error: '시뮬레이션을 찾을 수 없습니다.' });
      return;
    }

    res.json(valuation);
  } catch (error) {
    console.error('GetValuation error:', error);
    res.status(500).json({ error: '시뮬레이션 조회 중 오류가 발생했습니다.' });
  }
};

// 시뮬레이션 삭제
export const deleteValuation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const valuationId = parseInt(req.params.id);

    const existing = await prisma.propertyValuation.findFirst({
      where: {
        id: valuationId,
        property: { ownerId: userId },
      },
    });

    if (!existing) {
      res.status(404).json({ error: '시뮬레이션을 찾을 수 없습니다.' });
      return;
    }

    await prisma.propertyValuation.delete({ where: { id: valuationId } });

    res.json({ message: '시뮬레이션이 삭제되었습니다.' });
  } catch (error) {
    console.error('DeleteValuation error:', error);
    res.status(500).json({ error: '시뮬레이션 삭제 중 오류가 발생했습니다.' });
  }
};

// 전체 포트폴리오 요약
export const getPortfolioSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // 전체 부동산 조회
    const properties = await prisma.property.findMany({
      where: { ownerId: userId },
      include: {
        leases: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    const currentYear = new Date().getFullYear();

    // 전체 통계 계산
    let totalPurchasePrice = 0;
    let totalCurrentValue = 0;
    let totalLoanAmount = 0;
    let totalMonthlyRent = 0;
    let totalAnnualExpense = 0;

    for (const property of properties) {
      totalPurchasePrice += Number(property.purchasePrice);
      totalCurrentValue += Number(property.currentValue || property.purchasePrice);
      totalLoanAmount += Number(property.loanAmount);

      const monthlyRent = property.leases.reduce(
        (sum, lease) => sum + Number(lease.monthlyRent),
        0
      );
      totalMonthlyRent += monthlyRent;
    }

    // 전체 연간 지출
    const expenseResult = await prisma.expense.aggregate({
      where: {
        property: { ownerId: userId },
        expenseDate: {
          gte: new Date(currentYear, 0, 1),
          lt: new Date(currentYear + 1, 0, 1),
        },
      },
      _sum: { amount: true },
    });
    totalAnnualExpense = Number(expenseResult._sum.amount || 0);

    const totalAnnualRent = totalMonthlyRent * 12;
    const totalNetIncome = totalAnnualRent - totalAnnualExpense;
    const totalEquity = totalPurchasePrice - totalLoanAmount;

    const avgGrossYield =
      totalPurchasePrice > 0 ? (totalAnnualRent / totalPurchasePrice) * 100 : 0;
    const avgNetYield =
      totalPurchasePrice > 0 ? (totalNetIncome / totalPurchasePrice) * 100 : 0;
    const avgCashOnCash =
      totalEquity > 0 ? (totalNetIncome / totalEquity) * 100 : 0;

    // 물건별 요약
    const propertySummary = properties.map((p) => {
      const monthlyRent = p.leases.reduce((sum, l) => sum + Number(l.monthlyRent), 0);
      return {
        id: p.id,
        name: p.name,
        status: p.status,
        purchasePrice: Number(p.purchasePrice),
        currentValue: Number(p.currentValue || p.purchasePrice),
        monthlyRent,
        leaseCount: p.leases.length,
      };
    });

    res.json({
      totalProperties: properties.length,
      occupiedCount: properties.filter((p) => p.status === 'OCCUPIED').length,
      vacantCount: properties.filter((p) => p.status === 'VACANT').length,
      financials: {
        totalPurchasePrice,
        totalCurrentValue,
        totalLoanAmount,
        totalEquity,
        totalMonthlyRent,
        totalAnnualRent,
        totalAnnualExpense,
        totalNetIncome,
      },
      yields: {
        avgGrossYield: Math.round(avgGrossYield * 100) / 100,
        avgNetYield: Math.round(avgNetYield * 100) / 100,
        avgCashOnCash: Math.round(avgCashOnCash * 100) / 100,
      },
      properties: propertySummary,
    });
  } catch (error) {
    console.error('GetPortfolioSummary error:', error);
    res.status(500).json({ error: '포트폴리오 요약 조회 중 오류가 발생했습니다.' });
  }
};
