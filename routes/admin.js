import {Router} from 'express';
const router = Router();

// Access gated by admin middleware
// Melissa's page
router.get('/', async (req, res) => {
  return res.render('admin', {
    title: 'Admin Dashboard'
  });
});

export default router;
