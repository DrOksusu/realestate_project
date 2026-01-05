import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// 임차인 목록 조회
export const getTenants = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // 사용자의 부동산과 연결된 임차인만 조회
    const tenants = await prisma.tenant.findMany({
      where: {
        leases: {
          some: {
            property: { ownerId: userId },
          },
        },
      },
      include: {
        leases: {
          include: {
            property: {
              select: { id: true, name: true, address: true },
            },
          },
          orderBy: { startDate: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(tenants);
  } catch (error) {
    console.error('GetTenants error:', error);
    res.status(500).json({ error: '임차인 목록 조회 중 오류가 발생했습니다.' });
  }
};

// 임차인 상세 조회
export const getTenant = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const tenantId = parseInt(req.params.id);

    const tenant = await prisma.tenant.findFirst({
      where: {
        id: tenantId,
        leases: {
          some: {
            property: { ownerId: userId },
          },
        },
      },
      include: {
        leases: {
          include: {
            property: {
              select: { id: true, name: true, address: true },
            },
            rentPayments: {
              orderBy: [{ paymentYear: 'desc' }, { paymentMonth: 'desc' }],
              take: 12,
            },
          },
          orderBy: { startDate: 'desc' },
        },
      },
    });

    if (!tenant) {
      res.status(404).json({ error: '임차인을 찾을 수 없습니다.' });
      return;
    }

    res.json(tenant);
  } catch (error) {
    console.error('GetTenant error:', error);
    res.status(500).json({ error: '임차인 조회 중 오류가 발생했습니다.' });
  }
};

// 임차인 등록
export const createTenant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, email, idNumber, memo } = req.body;

    const tenant = await prisma.tenant.create({
      data: {
        name,
        phone,
        email,
        idNumber,
        memo,
      },
    });

    res.status(201).json(tenant);
  } catch (error) {
    console.error('CreateTenant error:', error);
    res.status(500).json({ error: '임차인 등록 중 오류가 발생했습니다.' });
  }
};

// 임차인 수정
export const updateTenant = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const tenantId = parseInt(req.params.id);

    // 권한 확인
    const existing = await prisma.tenant.findFirst({
      where: {
        id: tenantId,
        leases: {
          some: {
            property: { ownerId: userId },
          },
        },
      },
    });

    if (!existing) {
      res.status(404).json({ error: '임차인을 찾을 수 없습니다.' });
      return;
    }

    const { name, phone, email, idNumber, memo } = req.body;

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { name, phone, email, idNumber, memo },
    });

    res.json(tenant);
  } catch (error) {
    console.error('UpdateTenant error:', error);
    res.status(500).json({ error: '임차인 수정 중 오류가 발생했습니다.' });
  }
};

// 임차인 삭제
export const deleteTenant = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const tenantId = parseInt(req.params.id);

    // 권한 확인 및 활성 계약 확인
    const existing = await prisma.tenant.findFirst({
      where: {
        id: tenantId,
        leases: {
          some: {
            property: { ownerId: userId },
          },
        },
      },
      include: {
        leases: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    if (!existing) {
      res.status(404).json({ error: '임차인을 찾을 수 없습니다.' });
      return;
    }

    if (existing.leases.length > 0) {
      res.status(400).json({ error: '활성 계약이 있는 임차인은 삭제할 수 없습니다.' });
      return;
    }

    await prisma.tenant.delete({ where: { id: tenantId } });

    res.json({ message: '임차인이 삭제되었습니다.' });
  } catch (error) {
    console.error('DeleteTenant error:', error);
    res.status(500).json({ error: '임차인 삭제 중 오류가 발생했습니다.' });
  }
};
