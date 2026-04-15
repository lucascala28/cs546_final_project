import {Router} from 'express';
const router = Router();

// Landing page
router.get('/', async (req, res) => {
  return res.render('home', {
    title: 'NJ Trail Monitor',
    user: req.session.user || null
  });
});

// Login page 
router.get('/login', async (req, res) => {
  return res.render('login', {title: 'Log In'});
});

router.post('/login', async (req, res) => {
  return res.status(501).send('Login POST not yet implemented');
});

// Signup page 
router.get('/signup', async (req, res) => {
  return res.render('signup', {title: 'Sign Up'});
});

router.post('/signup', async (req, res) => {
  return res.status(501).send('Signup POST not yet implemented');
});

// Logout — destroys session and clears cookies
router.get('/logout', async (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('AwesomeTrailApp');
    return res.redirect('/');
  });
});

// Profile 
router.get('/profile', async (req, res) => {
  return res.status(501).send('Profile page not yet implemented');
});

// Favorites 
router.get('/favorites', async (req, res) => {
  return res.status(501).send('Favorites page not yet implemented');
});

export default router;
