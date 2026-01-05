import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { ExpenseType } from '@prisma/client';

// 지출 목록 조회
export const getExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { propertyId, expenseType, year } = req.query;

    const where: {
      property: { ownerId: number };
      propertyId?: number;
      expenseType?: ExpenseType;
      expenseDate?: { gte: Date; lt: Date };
    } = {
      property: { ownerId: userId },
    };

    if (propertyId) where.propertyId = parseInt(propertyId as string);
    if (expenseType) where.expenseType = expenseType as ExpenseType;
    if (year) {
      const y = parseInt(year as string);
      where.expenseDate = {
        gte: new Date(y, 0, 1),
        lt: new Date(y + 1, 0, 1),
      };
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        property: {
          select: { id: true, name: true, address: true },
        },
      },
      orderBy: { expenseDate: 'desc' },
    });

    res.json(expenses);
  } catch (error) {
    console.error('GetExpenses error:', error);
    res.status(500).json({ error: '지출 목록 조회 중 오류가 발생했습니다.' });
  }
};

// 지출 상세 조회
export const getExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const expenseId = parseInt(req.params.id);

    const expense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        property: { ownerId: userId },
      },
      include: {
        property: true,
      },
    });

    if (!expense) {
      res.status(404).json({ error: '지출 내역을 찾을 수 없습니다.' });
      return;
    }

    res.json(expense);
  } catch (error) {
    console.error('GetExpense error:', error);
    res.status(500).json({ error: '지출 조회 중 오류가 발생했습니다.' });
  }
};

// 지출 등록
export const createExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      propertyId,
      expenseType,
      amount,
      expenseDate,
      description,
      isRecurring,
      recurringMonth,
      memo,
    } = req.body;

    // 부동산 권한 확인
    const property = await prisma.property.findFirst({
      where: { id: propertyId, ownerId: userId },
    });

    if (!property) {
      res.status(404).json({ error: '부동산을 찾을 수 없습니다.' });
      return;
    }

    const expense = await prisma.expense.create({
      data: {
        propertyId,
        expenseType,
        amount,
        expenseDate: new Date(expenseDate),
        description,
        isRecurring: isRecurring || false,
        recurringMonth,
        memo,
      },
      include: {
        property: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error('CreateExpense error:', error);
    res.status(500).json({ error: '지출 등록 중 오류가 발생했습니다.' });
  }
};

// 지출 수정
export const updateExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const expenseId = parseInt(req.params.id);

    const existing = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        property: { ownerId: userId },
      },
    });

    if (!existing) {
      res.status(404).json({ error: '지출 내역을 찾을 수 없습니다.' });
      return;
    }

    const {
      expenseType,
      amount,
      expenseDate,
      description,
      isRecurring,
      recurringMonth,
      memo,
    } = req.body;

    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        expenseType,
        amount,
        expenseDate: expenseDate ? new Date(expenseDate) : undefined,
        description,
        isRecurring,
        recurringMonth,
        memo,
      },
    });

    res.json(expense);
  } catch (error) {
    console.error('UpdateExpense error:', error);
    res.status(500).json({ error: '지출 수정 중 오류가 발생했습니다.' });
  }
};

// 지출 삭제
export const deleteExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const expenseId = parseInt(req.params.id);

    const existing = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        property: { ownerId: userId },
      },
    });

    if (!existing) {
      res.status(404).json({ error: '지출 내역을 찾을 수 없습니다.' });
      return;
    }

    await prisma.expense.delete({ where: { id: expenseId } });

    res.json({ message: '지출 내역이 삭제되었습니다.' });
  } catch (error) {
    console.error('DeleteExpense error:', error);
    res.status(500).json({ error: '지출 삭제 중 오류가 발생했습니다.' });
  }
};

// 지출 요약
export const getExpenseSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { propertyId, year } = req.query;

    const currentYear = year ? parseInt(year as string) : new Date().getFullYear();

    const where: {
      property: { ownerId: number };
      propertyId?: number;
      expenseDate: { gte: Date; lt: Date };
    } = {
      property: { ownerId: userId },
      expenseDate: {
        gte: new Date(currentYear, 0, 1),
        lt: new Date(currentYear + 1, 0, 1),
      },
    };

    if (propertyId) where.propertyId = parseInt(propertyId as string);

    // 유형별 합계
    const byType = await prisma.expense.groupBy({
      by: ['expenseType'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    // 월별 합계
    const expenses = await prisma.expense.findMany({
      where,
      select: { amount: true, expenseDate: true },
    });

    const byMonth: { [key: number]: number } = {};
    for (let i = 1; i <= 12; i++) byMonth[i] = 0;

    expenses.forEach((e) => {
      const month = e.expenseDate.getMonth() + 1;
      byMonth[month] += Number(e.amount);
    });

    // 총계
    const total = await prisma.expense.aggregate({
      where,
      _sum: { amount: true },
    });

    res.json({
      year: currentYear,
      total: Number(total._sum.amount || 0),
      byType: byType.map((t) => ({
        type: t.expenseType,
        amount: Number(t._sum.amount || 0),
        count: t._count,
      })),
      byMonth: Object.entries(byMonth).map(([month, amount]) => ({
        month: parseInt(month),
        amount,
      })),
    });
  } catch (error) {
    console.error('GetExpenseSummary error:', error);
    res.status(500).json({ error: '지출 요약 조회 중 오류가 발생했습니다.' });
  }
};
