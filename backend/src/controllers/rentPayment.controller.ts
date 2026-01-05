import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { PaymentStatus } from '@prisma/client';

// 납부 내역 목록 조회
export const getRentPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { leaseId, propertyId, year, month, status } = req.query;

    const where: {
      lease: { property: { ownerId: number }; propertyId?: number };
      leaseId?: number;
      paymentYear?: number;
      paymentMonth?: number;
      rentStatus?: PaymentStatus;
    } = {
      lease: { property: { ownerId: userId } },
    };

    if (leaseId) where.leaseId = parseInt(leaseId as string);
    if (propertyId) where.lease.propertyId = parseInt(propertyId as string);
    if (year) where.paymentYear = parseInt(year as string);
    if (month) where.paymentMonth = parseInt(month as string);
    if (status) where.rentStatus = status as PaymentStatus;

    const rentPayments = await prisma.rentPayment.findMany({
      where,
      include: {
        lease: {
          include: {
            property: {
              select: { id: true, name: true, address: true },
            },
            tenant: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
      },
      orderBy: [{ paymentYear: 'desc' }, { paymentMonth: 'desc' }],
    });

    res.json(rentPayments);
  } catch (error) {
    console.error('GetRentPayments error:', error);
    res.status(500).json({ error: '납부 내역 조회 중 오류가 발생했습니다.' });
  }
};

// 납부 내역 상세 조회
export const getRentPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const paymentId = parseInt(req.params.id);

    const rentPayment = await prisma.rentPayment.findFirst({
      where: {
        id: paymentId,
        lease: { property: { ownerId: userId } },
      },
      include: {
        lease: {
          include: {
            property: true,
            tenant: true,
          },
        },
      },
    });

    if (!rentPayment) {
      res.status(404).json({ error: '납부 내역을 찾을 수 없습니다.' });
      return;
    }

    res.json(rentPayment);
  } catch (error) {
    console.error('GetRentPayment error:', error);
    res.status(500).json({ error: '납부 내역 조회 중 오류가 발생했습니다.' });
  }
};

// 납부 내역 등록
export const createRentPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      leaseId,
      paymentYear,
      paymentMonth,
      dueDate,
      paymentDate,
      rentAmount,
      managementFeeAmount,
      paymentMethod,
      rentStatus,
      managementFeeStatus,
      memo,
    } = req.body;

    // 계약 권한 확인
    const lease = await prisma.lease.findFirst({
      where: {
        id: leaseId,
        property: { ownerId: userId },
      },
    });

    if (!lease) {
      res.status(404).json({ error: '계약을 찾을 수 없습니다.' });
      return;
    }

    const totalAmount = Number(rentAmount || 0) + Number(managementFeeAmount || 0);

    const rentPayment = await prisma.rentPayment.create({
      data: {
        leaseId,
        paymentYear,
        paymentMonth,
        dueDate: new Date(dueDate),
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        rentAmount,
        managementFeeAmount: managementFeeAmount || 0,
        totalAmount,
        paymentMethod,
        rentStatus: rentStatus || 'PENDING',
        managementFeeStatus: managementFeeStatus || 'PENDING',
        memo,
      },
      include: {
        lease: {
          include: {
            property: { select: { name: true } },
            tenant: { select: { name: true } },
          },
        },
      },
    });

    res.status(201).json(rentPayment);
  } catch (error) {
    console.error('CreateRentPayment error:', error);
    res.status(500).json({ error: '납부 내역 등록 중 오류가 발생했습니다.' });
  }
};

// 월별 납부 내역 일괄 생성
export const generateRentPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { leaseId, startYear, startMonth, endYear, endMonth } = req.body;

    // 계약 확인
    const lease = await prisma.lease.findFirst({
      where: {
        id: leaseId,
        property: { ownerId: userId },
      },
    });

    if (!lease) {
      res.status(404).json({ error: '계약을 찾을 수 없습니다.' });
      return;
    }

    const payments = [];
    let year = startYear;
    let month = startMonth;

    while (year < endYear || (year === endYear && month <= endMonth)) {
      const dueDate = new Date(year, month - 1, lease.rentDueDay);
      const totalAmount = Number(lease.monthlyRent) + Number(lease.managementFee);

      payments.push({
        leaseId,
        paymentYear: year,
        paymentMonth: month,
        dueDate,
        rentAmount: lease.monthlyRent,
        managementFeeAmount: lease.managementFee,
        totalAmount,
      });

      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }

    // 이미 존재하는 월은 건너뛰기
    const created = await prisma.$transaction(
      payments.map((payment) =>
        prisma.rentPayment.upsert({
          where: {
            leaseId_paymentYear_paymentMonth: {
              leaseId: payment.leaseId,
              paymentYear: payment.paymentYear,
              paymentMonth: payment.paymentMonth,
            },
          },
          create: payment,
          update: {},
        })
      )
    );

    res.status(201).json({ message: `${created.length}개의 납부 내역이 생성되었습니다.`, count: created.length });
  } catch (error) {
    console.error('GenerateRentPayments error:', error);
    res.status(500).json({ error: '납부 내역 생성 중 오류가 발생했습니다.' });
  }
};

// 납부 내역 수정
export const updateRentPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const paymentId = parseInt(req.params.id);

    const existing = await prisma.rentPayment.findFirst({
      where: {
        id: paymentId,
        lease: { property: { ownerId: userId } },
      },
    });

    if (!existing) {
      res.status(404).json({ error: '납부 내역을 찾을 수 없습니다.' });
      return;
    }

    const {
      dueDate,
      paymentDate,
      rentAmount,
      managementFeeAmount,
      paymentMethod,
      rentStatus,
      managementFeeStatus,
      memo,
    } = req.body;

    const totalAmount =
      Number(rentAmount ?? existing.rentAmount) +
      Number(managementFeeAmount ?? existing.managementFeeAmount);

    const rentPayment = await prisma.rentPayment.update({
      where: { id: paymentId },
      data: {
        dueDate: dueDate ? new Date(dueDate) : undefined,
        paymentDate: paymentDate ? new Date(paymentDate) : undefined,
        rentAmount,
        managementFeeAmount,
        totalAmount,
        paymentMethod,
        rentStatus,
        managementFeeStatus,
        memo,
      },
    });

    res.json(rentPayment);
  } catch (error) {
    console.error('UpdateRentPayment error:', error);
    res.status(500).json({ error: '납부 내역 수정 중 오류가 발생했습니다.' });
  }
};

// 납부 상태 변경
export const updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const paymentId = parseInt(req.params.id);
    const { rentStatus, managementFeeStatus, paymentDate } = req.body;

    const existing = await prisma.rentPayment.findFirst({
      where: {
        id: paymentId,
        lease: { property: { ownerId: userId } },
      },
    });

    if (!existing) {
      res.status(404).json({ error: '납부 내역을 찾을 수 없습니다.' });
      return;
    }

    const rentPayment = await prisma.rentPayment.update({
      where: { id: paymentId },
      data: {
        rentStatus,
        managementFeeStatus,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      },
    });

    res.json(rentPayment);
  } catch (error) {
    console.error('UpdatePaymentStatus error:', error);
    res.status(500).json({ error: '납부 상태 변경 중 오류가 발생했습니다.' });
  }
};

// 납부 내역 삭제
export const deleteRentPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const paymentId = parseInt(req.params.id);

    const existing = await prisma.rentPayment.findFirst({
      where: {
        id: paymentId,
        lease: { property: { ownerId: userId } },
      },
    });

    if (!existing) {
      res.status(404).json({ error: '납부 내역을 찾을 수 없습니다.' });
      return;
    }

    await prisma.rentPayment.delete({ where: { id: paymentId } });

    res.json({ message: '납부 내역이 삭제되었습니다.' });
  } catch (error) {
    console.error('DeleteRentPayment error:', error);
    res.status(500).json({ error: '납부 내역 삭제 중 오류가 발생했습니다.' });
  }
};

// 미납 내역 조회
export const getOverduePayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const today = new Date();

    const overduePayments = await prisma.rentPayment.findMany({
      where: {
        lease: { property: { ownerId: userId } },
        dueDate: { lt: today },
        OR: [{ rentStatus: 'PENDING' }, { rentStatus: 'OVERDUE' }],
      },
      include: {
        lease: {
          include: {
            property: { select: { id: true, name: true, address: true } },
            tenant: { select: { id: true, name: true, phone: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // 미납으로 상태 업데이트
    await prisma.rentPayment.updateMany({
      where: {
        id: { in: overduePayments.map((p) => p.id) },
        rentStatus: 'PENDING',
      },
      data: { rentStatus: 'OVERDUE' },
    });

    res.json(overduePayments);
  } catch (error) {
    console.error('GetOverduePayments error:', error);
    res.status(500).json({ error: '미납 내역 조회 중 오류가 발생했습니다.' });
  }
};
