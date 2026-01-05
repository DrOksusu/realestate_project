import { Router } from 'express';
import * as valuationController from '../controllers/valuation.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

// 수익률 계산 및 매도가 시뮬레이션
router.post('/calculate', valuationController.calculateValuation);

// 저장된 시뮬레이션 목록 조회
router.get('/', valuationController.getValuations);

// 시뮬레이션 상세 조회
router.get('/:id', valuationController.getValuation);

// 시뮬레이션 삭제
router.delete('/:id', valuationController.deleteValuation);

// 전체 포트폴리오 요약
router.get('/portfolio/summary', valuationController.getPortfolioSummary);

export default router;
