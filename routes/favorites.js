import { Router } from "express";
import {
  addFavoriteTrail,
  removeFavoriteTrail,
  getFavoriteTrailsForUser,
  getUserById
} from "../data/user.js";

const router = Router();

router.get("/", async (req, res) => {
  const userId = req.session.user?.userId;
  const trails = await getFavoriteTrailsForUser(userId);
  return res.render("favorites", {
    title: "Favorites",
    pageCss: "favorites.css",
    trails
  });
});

router.post("/toggle/:trailId", async (req, res) => {
  const userId = req.session.user?.userId;
  const trailId = req.params.trailId;
  if (!userId) return res.redirect("/login");

  const user = await getUserById(userId);
  const isFav = Array.isArray(user.favoriteTrailIds) && user.favoriteTrailIds.includes(trailId);

  if (isFav) await removeFavoriteTrail(userId, trailId);
  else await addFavoriteTrail(userId, trailId);

  const updated = await getUserById(userId);
  req.session.user.favoriteTrailIds = updated.favoriteTrailIds || [];

  const returnTo = typeof req.query.returnTo === "string" ? req.query.returnTo : "";
  if (returnTo) return res.redirect(returnTo);
  return res.redirect("/favorites");
});

export default router;

