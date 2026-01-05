import { Router } from 'express';
import * as propertyController from '../controllers/property.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// 모든 라우트에 인증 필요
router.use(authMiddleware);

// 내 부동산 목록 조회
router.get('/', propertyController.getProperties);

// 부동산 상세 조회
router.get('/:id', propertyController.getProperty);

// 부동산 등록
router.post('/', propertyController.createProperty);

// 부동산 수정
router.put('/:id', propertyController.updateProperty);

// 부동산 삭제
router.delete('/:id', propertyController.deleteProperty);

// 부동산 요약 통계
router.get('/:id/summary', propertyController.getPropertySummary);

export default router;
