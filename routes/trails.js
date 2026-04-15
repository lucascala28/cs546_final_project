import {Router} from 'express';
const router = Router();

// Luca / Molly page to display all trails
router.get('/', async (req, res) => {
  return res.status(501).send('Trails index not yet implemented');
});

export default router;
