import { Router } from 'express';
import * as shareController from '../controllers/share.controller';

const router = Router();

// 공유된 부동산 조회 (인증 불필요)
router.get('/:token', shareController.getSharedProperty);

export default router;
