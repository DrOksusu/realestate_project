import { Router } from 'express';
import * as tenantController from '../controllers/tenant.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

// 임차인 목록 조회
router.get('/', tenantController.getTenants);

// 임차인 상세 조회
router.get('/:id', tenantController.getTenant);

// 임차인 등록
router.post('/', tenantController.createTenant);

// 임차인 수정
router.put('/:id', tenantController.updateTenant);

// 임차인 삭제
router.delete('/:id', tenantController.deleteTenant);

export default router;
