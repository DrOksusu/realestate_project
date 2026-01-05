import { Router } from 'express';
import * as leaseController from '../controllers/lease.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

// 계약 목록 조회
router.get('/', leaseController.getLeases);

// 계약 상세 조회
router.get('/:id', leaseController.getLease);

// 계약 등록
router.post('/', leaseController.createLease);

// 계약 수정
router.put('/:id', leaseController.updateLease);

// 계약 상태 변경 (해지/만료)
router.patch('/:id/status', leaseController.updateLeaseStatus);

// 계약 삭제
router.delete('/:id', leaseController.deleteLease);

// 계약 갱신 (새 계약 생성)
router.post('/:id/renew', leaseController.renewLease);

export default router;
