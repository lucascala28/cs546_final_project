import {Router} from 'express';
import xss from 'xss';
import { getAllTrails, searchTrailsByName, getTrailById, addCommentToTrail } from '../data/trail.js';
import { createComment, getCommentsForTrail } from '../data/comment.js';
import { getReportsForTrail } from '../data/report.js';
const router = Router();

// Browse trails + search
router.get('/', async (req, res) => {
  const qRaw = typeof req.query.q === 'string' ? req.query.q : '';
  const q = xss(qRaw).trim().slice(0, 80);
  const trails = q ? await searchTrailsByName(q) : await getAllTrails();
  return res.render('trails-index', {
    title: 'Trails',
    pageCss: 'trails.css',
    q,
    trails
  });
});

// Trail detail page + comments
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const trail = await getTrailById(id);
    const comments = await getCommentsForTrail(id);
    const reports = await getReportsForTrail(id);
    const isFavorited = Array.isArray(req.session.user?.favoriteTrailIds)
      ? req.session.user.favoriteTrailIds.includes(id)
      : false;

    return res.render('trail', {
      title: trail.name,
      pageCss: 'trail.css',
      trail,
      comments,
      reports,
      isFavorited
    });
  } catch (e) {
    return res.status(404).render('error', { error: 'Trail not found' });
  }
});

router.post('/:id/comments', async (req, res) => {
  const trailId = req.params.id;
  const content = xss(req.body.content).trim();
  const username = req.session.user?.username;
  if (!username) return res.redirect('/login');

  if (!content || content.length < 1 || content.length > 500) {
    return res.status(400).render('error', { error: 'Comment must be between 1 and 500 characters.' });
  }

  const now = new Date();
  const date = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;

  const commentObj = {
    trailId,
    username,
    content,
    date,
    upvotes: 0,
    replies: []
  };

  try {
    const newComment = await createComment(commentObj);
    await addCommentToTrail(trailId, newComment._id.toString());
    return res.redirect(`/trails/${trailId}`);
  } catch (e) {
    return res.status(400).render('error', { error: e.message });
  }
});

export default router;
