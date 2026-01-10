import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { LeaseStatus, LeaseType } from '@prisma/client';

// 계약 목록 조회
export const getLeases = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { propertyId, status } = req.query;

    const where: {
      property: { ownerId: number };
      propertyId?: number;
      status?: LeaseStatus;
    } = {
      property: { ownerId: userId },
    };

    if (propertyId) where.propertyId = parseInt(propertyId as string);
    if (status) where.status = status as LeaseStatus;

    const leases = await prisma.lease.findMany({
      where,
      include: {
        property: {
          select: { id: true, name: true, address: true },
        },
        tenant: true,
        _count: {
          select: { rentPayments: true },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    res.json(leases);
  } catch (error) {
    console.error('GetLeases error:', error);
    res.status(500).json({ error: '계약 목록 조회 중 오류가 발생했습니다.' });
  }
};

// 계약 상세 조회
export const getLease = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const leaseId = parseInt(req.params.id);

    const lease = await prisma.lease.findFirst({
      where: {
        id: leaseId,
        property: { ownerId: userId },
      },
      include: {
        property: {
          select: { id: true, name: true, address: true, propertyType: true },
        },
        tenant: true,
        rentPayments: {
          orderBy: [{ paymentYear: 'desc' }, { paymentMonth: 'desc' }],
        },
      },
    });

    if (!lease) {
      res.status(404).json({ error: '계약을 찾을 수 없습니다.' });
      return;
    }

    res.json(lease);
  } catch (error) {
    console.error('GetLease error:', error);
    res.status(500).json({ error: '계약 조회 중 오류가 발생했습니다.' });
  }
};

// 계약 등록
export const createLease = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      propertyId,
      tenantId,
      floor,
      areaPyeong,
      leaseType,
      deposit,
      monthlyRent,
      managementFee,
      hasVat,
      startDate,
      endDate,
      rentDueDay,
      memo,
    } = req.body;

    // 부동산 소유권 확인
    const property = await prisma.property.findFirst({
      where: { id: propertyId, ownerId: userId },
    });

    if (!property) {
      res.status(404).json({ error: '부동산을 찾을 수 없습니다.' });
      return;
    }

    const lease = await prisma.lease.create({
      data: {
        propertyId,
        tenantId,
        floor: floor || null,
        areaPyeong: areaPyeong || null,
        leaseType,
        deposit,
        monthlyRent: monthlyRent || 0,
        managementFee: managementFee || 0,
        hasVat: hasVat || false,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        rentDueDay: rentDueDay || 1,
        memo,
      },
      include: {
        property: {
          select: { id: true, name: true },
        },
        tenant: true,
      },
    });

    // 부동산 상태를 임대중으로 변경
    await prisma.property.update({
      where: { id: propertyId },
      data: { status: 'OCCUPIED' },
    });

    res.status(201).json(lease);
  } catch (error) {
    console.error('CreateLease error:', error);
    res.status(500).json({ error: '계약 등록 중 오류가 발생했습니다.' });
  }
};

// 계약 수정
export const updateLease = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const leaseId = parseInt(req.params.id);

    // 권한 확인
    const existing = await prisma.lease.findFirst({
      where: {
        id: leaseId,
        property: { ownerId: userId },
      },
    });

    if (!existing) {
      res.status(404).json({ error: '계약을 찾을 수 없습니다.' });
      return;
    }

    const {
      floor,
      areaPyeong,
      leaseType,
      deposit,
      monthlyRent,
      managementFee,
      hasVat,
      startDate,
      endDate,
      rentDueDay,
      memo,
    } = req.body;

    const lease = await prisma.lease.update({
      where: { id: leaseId },
      data: {
        floor,
        areaPyeong,
        leaseType,
        deposit,
        monthlyRent,
        managementFee,
        hasVat,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        rentDueDay,
        memo,
      },
      include: {
        property: {
          select: { id: true, name: true },
        },
        tenant: true,
      },
    });

    res.json(lease);
  } catch (error) {
    console.error('UpdateLease error:', error);
    res.status(500).json({ error: '계약 수정 중 오류가 발생했습니다.' });
  }
};

// 계약 상태 변경
export const updateLeaseStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const leaseId = parseInt(req.params.id);
    const { status } = req.body;

    const existing = await prisma.lease.findFirst({
      where: {
        id: leaseId,
        property: { ownerId: userId },
      },
      include: { property: true },
    });

    if (!existing) {
      res.status(404).json({ error: '계약을 찾을 수 없습니다.' });
      return;
    }

    const lease = await prisma.lease.update({
      where: { id: leaseId },
      data: { status },
    });

    // 계약 종료 시 다른 활성 계약이 없으면 부동산 상태를 공실로 변경
    if (status === 'EXPIRED' || status === 'TERMINATED') {
      const activeLeases = await prisma.lease.count({
        where: {
          propertyId: existing.propertyId,
          status: 'ACTIVE',
          id: { not: leaseId },
        },
      });

      if (activeLeases === 0) {
        await prisma.property.update({
          where: { id: existing.propertyId },
          data: { status: 'VACANT' },
        });
      }
    }

    res.json(lease);
  } catch (error) {
    console.error('UpdateLeaseStatus error:', error);
    res.status(500).json({ error: '계약 상태 변경 중 오류가 발생했습니다.' });
  }
};

// 계약 삭제
export const deleteLease = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const leaseId = parseInt(req.params.id);

    const existing = await prisma.lease.findFirst({
      where: {
        id: leaseId,
        property: { ownerId: userId },
      },
    });

    if (!existing) {
      res.status(404).json({ error: '계약을 찾을 수 없습니다.' });
      return;
    }

    await prisma.$transaction([
      prisma.rentPayment.deleteMany({ where: { leaseId } }),
      prisma.lease.delete({ where: { id: leaseId } }),
    ]);

    res.json({ message: '계약이 삭제되었습니다.' });
  } catch (error) {
    console.error('DeleteLease error:', error);
    res.status(500).json({ error: '계약 삭제 중 오류가 발생했습니다.' });
  }
};

// 계약 갱신
export const renewLease = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const leaseId = parseInt(req.params.id);
    const { deposit, monthlyRent, managementFee, startDate, endDate, rentDueDay } = req.body;

    const existing = await prisma.lease.findFirst({
      where: {
        id: leaseId,
        property: { ownerId: userId },
      },
    });

    if (!existing) {
      res.status(404).json({ error: '기존 계약을 찾을 수 없습니다.' });
      return;
    }

    // 기존 계약 만료 처리 및 새 계약 생성
    const [, newLease] = await prisma.$transaction([
      prisma.lease.update({
        where: { id: leaseId },
        data: { status: 'EXPIRED' },
      }),
      prisma.lease.create({
        data: {
          propertyId: existing.propertyId,
          tenantId: existing.tenantId,
          floor: existing.floor,
          areaPyeong: existing.areaPyeong,
          leaseType: existing.leaseType,
          deposit: deposit ?? existing.deposit,
          monthlyRent: monthlyRent ?? existing.monthlyRent,
          managementFee: managementFee ?? existing.managementFee,
          hasVat: existing.hasVat,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          rentDueDay: rentDueDay ?? existing.rentDueDay,
        },
        include: {
          property: {
            select: { id: true, name: true },
          },
          tenant: true,
        },
      }),
    ]);

    res.status(201).json(newLease);
  } catch (error) {
    console.error('RenewLease error:', error);
    res.status(500).json({ error: '계약 갱신 중 오류가 발생했습니다.' });
  }
};
