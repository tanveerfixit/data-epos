import { Router } from 'express';
import { queryOne } from '../mysql.js';

const router = Router();

// GET /api/public/business/:slug
router.get('/business/:slug', async (req: any, res, next) => {
  const { slug } = req.params;
  try {
    const business = await queryOne(`
      SELECT id, name, email, phone, address, city, state, zip_code, country, status
      FROM businesses 
      WHERE slug = ? AND status = 'active' AND deleted_at IS NULL
    `, [slug]) as any;

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Get branches for this business
    const branches = await queryOne('SELECT id, name, address, phone FROM branches WHERE business_id = ? AND deleted_at IS NULL', [business.id]);
    
    res.json({
      ...business,
      branches: Array.isArray(branches) ? branches : [branches].filter(Boolean)
    });
  } catch (e: any) {
    next(e);
  }
});

export default router;
