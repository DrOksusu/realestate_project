import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { PropertyType, PropertyStatus } from '@prisma/client';
import crypto from 'crypto';

// 내 부동산 목록 조회
export const getProperties = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { status, propertyType } = req.query;

    const where: {
      ownerId: number;
      status?: PropertyStatus;
      propertyType?: PropertyType;
    } = { ownerId: userId };

    if (status) where.status = status as PropertyStatus;
    if (propertyType) where.propertyType = propertyType as PropertyType;

    const properties = await prisma.property.findMany({
      where,
      include: {
        leases: {
          where: { status: 'ACTIVE' },
          include: { tenant: true },
        },
        _count: {
          select: { expenses: true, valuations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(properties);
  } catch (error) {
    console.error('GetProperties error:', error);
    res.status(500).json({ error: '부동산 목록 조회 중 오류가 발생했습니다.' });
  }
};

// 부동산 상세 조회
export const getProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const propertyId = parseInt(req.params.id);

    const property = await prisma.property.findFirst({
      where: { id: propertyId, ownerId: userId },
      include: {
        leases: {
          include: {
            tenant: true,
            rentPayments: {
              orderBy: [{ paymentYear: 'desc' }, { paymentMonth: 'desc' }],
              take: 12,
            },
          },
          orderBy: { startDate: 'desc' },
        },
        expenses: {
          orderBy: { expenseDate: 'desc' },
          take: 20,
        },
        valuations: {
          orderBy: { calculatedAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!property) {
      res.status(404).json({ error: '부동산을 찾을 수 없습니다.' });
      return;
    }

    res.json(property);
  } catch (error) {
    console.error('GetProperty error:', error);
    res.status(500).json({ error: '부동산 조회 중 오류가 발생했습니다.' });
  }
};

// 부동산 등록
export const createProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      name,
      propertyType,
      address,
      addressDetail,
      area,
      purchasePrice,
      purchaseDate,
      acquisitionCost,
      loanAmount,
      loanInterestRate,
      currentValue,
      memo,
    } = req.body;

    const property = await prisma.property.create({
      data: {
        ownerId: userId,
        name,
        propertyType,
        address,
        addressDetail,
        area,
        purchasePrice,
        purchaseDate: new Date(purchaseDate),
        acquisitionCost: acquisitionCost || 0,
        loanAmount: loanAmount || 0,
        loanInterestRate: loanInterestRate || 0,
        currentValue,
        memo,
      },
    });

    res.status(201).json(property);
  } catch (error) {
    console.error('CreateProperty error:', error);
    res.status(500).json({ error: '부동산 등록 중 오류가 발생했습니다.' });
  }
};

// 부동산 수정
export const updateProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const propertyId = parseInt(req.params.id);

    // 소유권 확인
    const existing = await prisma.property.findFirst({
      where: { id: propertyId, ownerId: userId },
    });

    if (!existing) {
      res.status(404).json({ error: '부동산을 찾을 수 없습니다.' });
      return;
    }

    const {
      name,
      propertyType,
      address,
      addressDetail,
      area,
      purchasePrice,
      purchaseDate,
      acquisitionCost,
      loanAmount,
      loanInterestRate,
      status,
      currentValue,
      memo,
    } = req.body;

    const property = await prisma.property.update({
      where: { id: propertyId },
      data: {
        name,
        propertyType,
        address,
        addressDetail,
        area,
        purchasePrice,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        acquisitionCost,
        loanAmount,
        loanInterestRate,
        status,
        currentValue,
        memo,
      },
    });

    res.json(property);
  } catch (error) {
    console.error('UpdateProperty error:', error);
    res.status(500).json({ error: '부동산 수정 중 오류가 발생했습니다.' });
  }
};

// 부동산 삭제
export const deleteProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const propertyId = parseInt(req.params.id);

    // 소유권 확인
    const existing = await prisma.property.findFirst({
      where: { id: propertyId, ownerId: userId },
    });

    if (!existing) {
      res.status(404).json({ error: '부동산을 찾을 수 없습니다.' });
      return;
    }

    // 관련 데이터 삭제 (cascade)
    await prisma.$transaction([
      prisma.rentPayment.deleteMany({
        where: { lease: { propertyId } },
      }),
      prisma.lease.deleteMany({ where: { propertyId } }),
      prisma.expense.deleteMany({ where: { propertyId } }),
      prisma.propertyValuation.deleteMany({ where: { propertyId } }),
      prisma.property.delete({ where: { id: propertyId } }),
    ]);

    res.json({ message: '부동산이 삭제되었습니다.' });
  } catch (error) {
    console.error('DeleteProperty error:', error);
    res.status(500).json({ error: '부동산 삭제 중 오류가 발생했습니다.' });
  }
};

// 부동산 요약 통계
export const getPropertySummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const propertyId = parseInt(req.params.id);

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

    // 현재 연도 기준 수입/지출 계산
    const currentYear = new Date().getFullYear();

    // 연간 임대 수입
    const rentPayments = await prisma.rentPayment.aggregate({
      where: {
        lease: { propertyId },
        paymentYear: currentYear,
        rentStatus: 'PAID',
      },
      _sum: {
        rentAmount: true,
        managementFeeAmount: true,
      },
    });

    // 연간 지출
    const expenses = await prisma.expense.aggregate({
      where: {
        propertyId,
        expenseDate: {
          gte: new Date(currentYear, 0, 1),
          lt: new Date(currentYear + 1, 0, 1),
        },
      },
      _sum: { amount: true },
    });

    // 활성 계약의 월세 합계
    const monthlyRentTotal = property.leases.reduce(
      (sum, lease) => sum + Number(lease.monthlyRent),
      0
    );

    const annualRent = Number(rentPayments._sum.rentAmount || 0);
    const annualExpense = Number(expenses._sum.amount || 0);
    const netIncome = annualRent - annualExpense;
    const purchasePrice = Number(property.purchasePrice);
    const totalInvestment = purchasePrice + Number(property.acquisitionCost) - Number(property.loanAmount);

    const grossYield = purchasePrice > 0 ? (annualRent / purchasePrice) * 100 : 0;
    const netYield = purchasePrice > 0 ? (netIncome / purchasePrice) * 100 : 0;
    const cashOnCash = totalInvestment > 0 ? (netIncome / totalInvestment) * 100 : 0;

    res.json({
      property: {
        id: property.id,
        name: property.name,
        status: property.status,
      },
      currentYear,
      monthlyRentTotal,
      annualRent,
      annualExpense,
      netIncome,
      totalInvestment,
      yields: {
        grossYield: Math.round(grossYield * 100) / 100,
        netYield: Math.round(netYield * 100) / 100,
        cashOnCash: Math.round(cashOnCash * 100) / 100,
      },
    });
  } catch (error) {
    console.error('GetPropertySummary error:', error);
    res.status(500).json({ error: '부동산 요약 조회 중 오류가 발생했습니다.' });
  }
};

// 공유 링크 생성
export const createShareLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const propertyId = parseInt(req.params.id);
    const { expiresIn } = req.body; // 만료 기간 (일 단위, null이면 무제한)

    // 소유권 확인
    const property = await prisma.property.findFirst({
      where: { id: propertyId, ownerId: userId },
    });

    if (!property) {
      res.status(404).json({ error: '부동산을 찾을 수 없습니다.' });
      return;
    }

    // 토큰 생성 (URL-safe base64)
    const shareToken = crypto.randomBytes(16).toString('base64url');

    // 만료일 계산
    let shareExpiresAt = null;
    if (expiresIn) {
      shareExpiresAt = new Date();
      shareExpiresAt.setDate(shareExpiresAt.getDate() + expiresIn);
    }

    // 업데이트
    await prisma.property.update({
      where: { id: propertyId },
      data: { shareToken, shareExpiresAt },
    });

    res.json({
      shareToken,
      shareExpiresAt,
      message: '공유 링크가 생성되었습니다.',
    });
  } catch (error) {
    console.error('CreateShareLink error:', error);
    res.status(500).json({ error: '공유 링크 생성 중 오류가 발생했습니다.' });
  }
};

// 공유 링크 해제
export const revokeShareLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const propertyId = parseInt(req.params.id);

    // 소유권 확인
    const property = await prisma.property.findFirst({
      where: { id: propertyId, ownerId: userId },
    });

    if (!property) {
      res.status(404).json({ error: '부동산을 찾을 수 없습니다.' });
      return;
    }

    // 공유 해제
    await prisma.property.update({
      where: { id: propertyId },
      data: { shareToken: null, shareExpiresAt: null },
    });

    res.json({ message: '공유가 해제되었습니다.' });
  } catch (error) {
    console.error('RevokeShareLink error:', error);
    res.status(500).json({ error: '공유 해제 중 오류가 발생했습니다.' });
  }
};

// 공유 상태 확인
export const getShareStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const propertyId = parseInt(req.params.id);

    const property = await prisma.property.findFirst({
      where: { id: propertyId, ownerId: userId },
      select: { shareToken: true, shareExpiresAt: true },
    });

    if (!property) {
      res.status(404).json({ error: '부동산을 찾을 수 없습니다.' });
      return;
    }

    res.json({
      isShared: !!property.shareToken,
      shareToken: property.shareToken,
      shareExpiresAt: property.shareExpiresAt,
    });
  } catch (error) {
    console.error('GetShareStatus error:', error);
    res.status(500).json({ error: '공유 상태 조회 중 오류가 발생했습니다.' });
  }
};
