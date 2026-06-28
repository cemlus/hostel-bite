import { Router } from 'express';
import { authRequired, shopOwnerOnly } from '../middlewares/auth.middleware.js';
import * as shopsCtrl from '../controllers/shops.controller.js';

const router = Router();

router.get('/', authRequired, shopsCtrl.listShops);
router.get('/mine', authRequired, shopsCtrl.getMyShop);
router.get('/:shopId', authRequired, shopsCtrl.getShop);
router.patch('/:shopId', authRequired, shopsCtrl.updateShop);
router.post('/', authRequired, shopOwnerOnly, shopsCtrl.createShop);

export default router;
