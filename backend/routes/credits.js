import express from 'express';
import {
  getAllCredits,
  makePayment,
  getCreditById
} from '../controllers/credits.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getAllCredits);
router.put('/:id/pay', authenticateToken, makePayment);
router.get('/:id', authenticateToken, getCreditById);

export default router;
