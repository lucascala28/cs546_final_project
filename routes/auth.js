import {Router} from 'express';
import xss from 'xss';
import bcrypt from 'bcrypt';
import {createUser, getUserByEmail, getUserById} from '../data/user.js';
import { getReportsByUsername } from '../data/report.js';
import {checkUser, checkPassword, checkEmail} from '../helpers.js';

const router = Router();

// Landing / home — redirect guests to login, show dashboard to authenticated users
router.get('/', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  let reportsCount = 0;
  let badgesCount = 0;

  try {
    const [userReports, freshUser] = await Promise.all([
      getReportsByUsername(req.session.user.username),
      getUserById(req.session.user.userId)
    ]);
    reportsCount = userReports.length;
    badgesCount = Array.isArray(freshUser.badges) ? freshUser.badges.length : 0;
  } catch {
    // stats are best-effort; don't block the page
  }

  return res.render('home', {
    title: 'NJ Trail Monitor',
    pageCss: 'home.css',
    username: req.session.user.username,
    favoritesCount: Array.isArray(req.session.user.favoriteTrailIds)
      ? req.session.user.favoriteTrailIds.length
      : 0,
    reportsCount,
    badgesCount
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