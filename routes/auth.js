import {Router} from 'express';
import xss from 'xss';
import bcrypt from 'bcrypt';
import {createUser, getUserByEmail, getUserById, getCommunityFavorites} from '../data/user.js';
import { getReportsByUsername, getRecentReports } from '../data/report.js';
import {checkUser, checkPassword, checkEmail} from '../helpers.js';

function timeAgo(idStr) {
  const ts = new Date(parseInt(idStr.substring(0, 8), 16) * 1000);
  const diff = Date.now() - ts.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

const router = Router();

// Landing / home — redirect guests to login, show dashboard to authenticated users
router.get('/', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  let reportsCount = 0;
  let badgesCount = 0;
  let communityFavorites = [];
  let recentReports = [];

  try {
    const [userReports, freshUser] = await Promise.all([
      getReportsByUsername(req.session.user.username),
      getUserById(req.session.user.userId)
    ]);
    reportsCount = userReports.length;
    badgesCount = Array.isArray(freshUser.badges) ? freshUser.badges.length : 0;
  } catch (e) {
    console.error('[home] user stats error:', e.message);
  }

  try {
    const favs = await getCommunityFavorites(5);
    communityFavorites = favs.map((f, i) => ({ ...f, rank: i + 1 }));
  } catch (e) {
    console.error('[home] community favorites error:', e.message);
  }

  try {
    const recent = await getRecentReports(5);
    recentReports = recent.map((r) => ({
      ...r,
      timeAgo: timeAgo(r._id),
      severityClass: `dot-${r.severity ? r.severity.toLowerCase() : 'low'}`
    }));
  } catch (e) {
    console.error('[home] recent reports error:', e.message);
  }

  return res.render('home', {
    title: 'NJ Trail Monitor',
    pageCss: 'home.css',
    username: req.session.user.username,
    favoritesCount: Array.isArray(req.session.user.favoriteTrailIds)
      ? req.session.user.favoriteTrailIds.length
      : 0,
    reportsCount,
    badgesCount,
    communityFavorites,
    recentReports,
    hasCommunityFavorites: communityFavorites.length > 0,
    hasRecentReports: recentReports.length > 0
  });
});


// Login page 
router
  .route('/login')
  .get(async (req, res) => {
    return res.render('login', {title: 'Log In', layout: 'auth'});
  })
  .post(async (req, res) => {
    // XSS sanitize all inputs from req.body
    const email = xss(req.body.email);
    const password = xss(req.body.password);

    // Validate format
    try {
      checkEmail(email);
    } catch (e) {
      return res.status(400).render('login', {title: 'Log In', layout: 'auth', error: e.message});
    }

    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      return res.status(400).render('login', {title: 'Log In', layout: 'auth', error: 'Password is required'});
    }

    // Look up user
    let user;
    try {
      user = await getUserByEmail(email);
    } catch (e) {
      return res.status(400).render('login', {title: 'Log In', layout: 'auth', error: 'Invalid email or password'});
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).render('login', {title: 'Log In', layout: 'auth', error: 'Invalid email or password'});
    }

    // Set session 
    req.session.user = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      favoriteTrailIds: Array.isArray(user.favoriteTrailIds) ? user.favoriteTrailIds : []
    };

    return res.redirect('/');
  });

// Signup page 
router
  .route('/signup')
  .get(async (req, res) => {
    return res.render('signup', {title: 'Sign Up', layout: 'auth'});
  })
  .post(async (req, res) => {
    // XSS sanitize all inputs from req.body
    const username = xss(req.body.username);
    const email = xss(req.body.email);
    const password = xss(req.body.password);

    // Validate each field
    let validUsername, validEmail, validPassword;

    try {
      validUsername = checkUser(username);
    } catch (e) {
      return res.status(400).render('signup', {title: 'Sign Up', layout: 'auth', error: e.message});
    }

    try {
      validEmail = checkEmail(email);
    } catch (e) {
      return res.status(400).render('signup', {title: 'Sign Up', layout: 'auth', error: e.message});
    }

    try {
      validPassword = checkPassword(password);
    } catch (e) {
      return res.status(400).render('signup', {title: 'Sign Up', layout: 'auth', error: e.message});
    }

    // Create user 
    let newUser;
    try {
      newUser = await createUser(validEmail, validPassword, validUsername);
    } catch (e) {
      return res.status(400).render('signup', {title: 'Sign Up', layout: 'auth', error: e.message});
    }

    // Log them in immediately after successful signup
    req.session.user = {
      userId: newUser._id.toString(),
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      favoriteTrailIds: Array.isArray(newUser.favoriteTrailIds) ? newUser.favoriteTrailIds : []
    };

    return res.redirect('/');
  });

// Logout — destroys session and clears cookies
router.get('/logout', async (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('AwesomeTrailApp');
    return res.redirect('/login');
  });
});

// Profile (protected by M4 in app.js)
router.get('/profile', async (req, res) => {
  try {
    const user = await getUserById(req.session.user.userId);
    const reports = await getReportsByUsername(user.username);

    return res.render('profile', {
      title: 'Profile',
      pageCss: 'profile.css',
      user,
      reports
    });
  } catch (e) {
    return res.status(500).render('error', { error: e.message });
  }
});

// Favorites (protected by M4) — Ian will build out
export default router;