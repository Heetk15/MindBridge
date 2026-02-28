import express from 'express';
import { getVideoToken, validateRoom } from '../controllers/video.controller.js';

const router = express.Router();

router.post('/token', getVideoToken);
router.get('/validate/:room', validateRoom);

export default router;
