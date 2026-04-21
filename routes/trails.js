import {Router} from 'express';
const router = Router();

// Luca / Molly page to display all trails
router.get('/', async (req, res) => {
  return res.render('trails-index', {
    title: 'Trails'
  });
});

export default router;
