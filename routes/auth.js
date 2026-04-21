import {Router} from 'express';
import xss from 'xss';
import bcrypt from 'bcrypt';
import {createUser, getUserByEmail} from '../data/user.js';
import {checkUser, checkPassword, checkEmail} from '../helpers.js';

const router = Router();

// Landing / home — redirect guests to login, show dashboard to authenticated users
router.get('/', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const u = req.session.user;
  return res.render('home', {
    title: 'NJ Trail Monitor',
    user: u,
    isAdmin: u.role === 'admin'
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
      role: user.role
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
      role: newUser.role
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

// Profile (protected by M4 in app.js) — Molly will build out
router.get('/profile', async (req, res) => {
  return res.status(501).send('Profile page not yet implemented');
});

// Favorites (protected by M4) — Ian will build out
router.get('/favorites', async (req, res) => {
  return res.status(501).send('Favorites page not yet implemented');
});

export default router;