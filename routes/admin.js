import {Router} from 'express';
import xss from 'xss';
import { getAllTrails, getTrailById, updateTrail, deleteTrail, removeReportFromTrail } from '../data/trail.js';
import { getAllReports, getReportById, deleteReport } from '../data/report.js';
const router = Router();

// Access gated by admin middleware

// List all trails and all reports
router.get('/', async (req, res) => {
  try {
    const trails = await getAllTrails();
    const reports = await getAllReports();
    return res.render('admin', {
      title: 'Admin Dashboard',
      pageCss: 'admin.css',
      trails,
      reports
    });
  } catch (e) {
    return res.status(500).render('error', { error: e.message });
  }
});

// Get edit form
router.get('/trails/:id/edit', async (req, res) => {
  try {
    const trail = await getTrailById(req.params.id);
    return res.render('admin-edit', {
      title: 'Edit Trail',
      pageCss: 'admin.css',
      trail
    });
  } catch (e) {
    return res.status(404).render('error', { error: e.message });
  }
});

// Submit edits
router.post('/trails/:id/edit', async (req, res) => {
  try {
    await updateTrail(req.params.id, {
      name: xss(req.body.name),
      surface: xss(req.body.surface),
      difficulty: xss(req.body.difficulty),
      status: xss(req.body.status)
    });
    return res.redirect('/admin');
  } catch (e) {
    return res.status(400).render('error', { error: e.message });
  }
});

// Delete a trail
router.post('/trails/:id/delete', async (req, res) => {
  try {
    await deleteTrail(req.params.id);
    return res.redirect('/admin');
  } catch (e) {
    return res.status(400).render('error', { error: e.message });
  }
});

// For Admin
// Delete a report
router.post('/reports/:id/delete', async (req, res) => {
  try {
    const report = await getReportById(req.params.id);
    await deleteReport(req.params.id);
    await removeReportFromTrail(report.trailId, req.params.id);
    return res.redirect('/admin');
  } catch (e) {
    return res.status(400).render('error', { error: e.message });
  }
});

export default router;
