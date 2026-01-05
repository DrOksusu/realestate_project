import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// 회원가입
router.post('/register', authController.register);

// 로그인
router.post('/login', authController.login);

// 내 정보 조회
router.get('/me', authMiddleware, authController.getMe);

// 내 정보 수정
router.put('/me', authMiddleware, authController.updateMe);

export default router;
