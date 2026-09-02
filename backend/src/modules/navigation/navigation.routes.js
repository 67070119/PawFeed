import { Router } from 'express';
import { asyncHandler } from '../../middlewares/async-handler.js';
import { parse, navigationRouteSchema } from '../../utils/validation.js';
import { sendSuccess } from '../../utils/response.js';
import { fetchRoute } from './navigation.service.js';

export const navigationRouter = Router();

navigationRouter.get('/route', asyncHandler(async (req, res) => {
  const input = parse(navigationRouteSchema, req.query, 'ข้อมูลสำหรับคำนวณเส้นทางไม่ถูกต้อง');
  const route = await fetchRoute(input);
  return sendSuccess(res, route);
}));
