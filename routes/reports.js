import { Router } from "express";
import xss from "xss";
import multer from "multer";
import path from "path";

import { checkDate } from "../helpers.js";
import { getAllTrails, getTrailById, addReportToTrail, removeReportFromTrail } from "../data/trail.js";
import { createReport, getReportById, deleteReport, resolveReport, upvoteReport } from "../data/report.js";

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), "public", "uploads"));
  },
  filename: (req, file, cb) => {
    const safeExt = path.extname(file.originalname || "").toLowerCase().slice(0, 10);
    const base = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${base}${safeExt}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype);
    if (!ok) return cb(new Error("Only image uploads are allowed"));
    return cb(null, true);
  }
});

router
  .route("/new")
  .get(async (req, res) => {
    const trailId = typeof req.query.trailId === "string" ? req.query.trailId : "";
    let trail = null;
    if (trailId) {
      try {
        trail = await getTrailById(trailId);
      } catch {
        trail = null;
      }
    }
    const trails = !trail ? await getAllTrails() : null;
    return res.render("reports-new", {
      title: "Create Report",
      pageCss: "reports.css",
      trail,
      trails
    });
  })
  .post((req, res, next) => {
    upload.array("photos", 5)(req, res, (err) => {
      if (err) {
        return res.status(400).render("reports-new", {
          title: "Create Report",
          pageCss: "reports.css",
          error: err.message
        });
      }
      next();
    });
  }, async (req, res) => {
    const trailId = xss(req.body.trailId);
    const date = xss(req.body.date);
    const severity = xss(req.body.severity);
    const description = xss(req.body.description).trim();

    let trail;
    try {
      trail = await getTrailById(trailId);
    } catch {
      const trails = await getAllTrails();
      return res.status(400).render("reports-new", {
        title: "Create Report",
        pageCss: "reports.css",
        trails,
        error: "Invalid trail selected"
      });
    }
    if (!trail || typeof trail.name !== "string" || trail.name.trim().length === 0) {
      const trails = await getAllTrails();
      return res.status(400).render("reports-new", {
        title: "Create Report",
        pageCss: "reports.css",
        trails,
        error: "This trail is missing a name in the dataset; please pick a different trail."
      });
    }

    try {
      checkDate(date);
    } catch (e) {
      return res.status(400).render("reports-new", { title: "Create Report", pageCss: "reports.css", trail, error: e.message });
    }

    if (!severity || typeof severity !== "string") {
      return res.status(400).render("reports-new", { title: "Create Report", pageCss: "reports.css", trail, error: "Severity is required" });
    }
    if (!description || typeof description !== "string" || description.trim().length < 5) {
      return res.status(400).render("reports-new", { title: "Create Report", pageCss: "reports.css", trail, error: "Description must be at least 5 characters" });
    }
    if (description.length > 2000) {
      return res.status(400).render("reports-new", { title: "Create Report", pageCss: "reports.css", trail, error: "Description must be 2000 characters or less" });
    }

    const attachments = Array.isArray(req.files) ? req.files.map((f) => `/uploads/${f.filename}`) : [];

    try {
      const username = req.session.user?.username || "unknown";
      const report = await createReport(trailId, username, date, severity, description, attachments, trail.name);
      await addReportToTrail(trailId, report._id.toString());
      return res.redirect(`/trails/${trailId}`);
    } catch (e) {
      return res.status(400).render("reports-new", { title: "Create Report", pageCss: "reports.css", trail, error: e.message });
    }
  });
  router.post("/:id/upvote", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    
    try {
      const report = await upvoteReport(req.params.id, req.session.user.username);
      return res.redirect(`/trails/${report.trailId}`);
    } catch (e) {
      return res.status(400).render("error", { error: e.message });
    }
  });
  router.post("/:id/resolve", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
  
    try {
      const report = await getReportById(req.params.id);
      
      if (req.session.user.username !== report.username && req.session.user.role !== "admin") {
        return res.status(403).render("error", { error: "You are not allowed to resolve this report" });
      }

      const updated = await resolveReport(req.params.id);
      return res.redirect(`/trails/${updated.trailId}`);
    } catch (e) {
      return res.status(400).render("error", { error: e.message });
    }
  });
  router.post("/:id/delete", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    
    try {
      const report = await getReportById(req.params.id);
      
      if (req.session.user.username !== report.username && req.session.user.role !== "admin") {
        return res.status(403).render("error", { error: "You are not allowed to delete this report" });
      }
      
      await deleteReport(req.params.id);
      await removeReportFromTrail(report.trailId, req.params.id);
      return res.redirect(`/trails/${report.trailId}`);
    } catch (e) {
      return res.status(400).render("error", { error: e.message });
    }
  });

export default router;

