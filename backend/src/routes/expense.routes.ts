import { Router } from 'express';
import * as expenseController from '../controllers/expense.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

// 지출 목록 조회
router.get('/', expenseController.getExpenses);

// 지출 상세 조회
router.get('/:id', expenseController.getExpense);

// 지출 등록
router.post('/', expenseController.createExpense);

// 지출 수정
router.put('/:id', expenseController.updateExpense);

// 지출 삭제
router.delete('/:id', expenseController.deleteExpense);

// 지출 요약 (유형별/월별)
router.get('/summary/stats', expenseController.getExpenseSummary);

export default router;
