import { Router } from 'express';
import * as rentPaymentController from '../controllers/rentPayment.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

// 납부 내역 목록 조회
router.get('/', rentPaymentController.getRentPayments);

// 납부 내역 상세 조회
router.get('/:id', rentPaymentController.getRentPayment);

// 납부 내역 등록
router.post('/', rentPaymentController.createRentPayment);

// 월별 납부 내역 일괄 생성
router.post('/generate', rentPaymentController.generateRentPayments);

// 납부 내역 수정
router.put('/:id', rentPaymentController.updateRentPayment);

// 납부 상태 변경 (납부 완료 처리)
router.patch('/:id/status', rentPaymentController.updatePaymentStatus);

// 납부 내역 삭제
router.delete('/:id', rentPaymentController.deleteRentPayment);

// 미납 내역 조회
router.get('/overdue/list', rentPaymentController.getOverduePayments);

export default router;
