import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import exphbs from 'express-handlebars';
import path from 'path';
import {fileURLToPath} from 'url';
import configRoutes from './routes/index.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Body parsers (lecture registers express.json() before session)
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Static assets
app.use(express.static('public'));

// Handlebars view engine
app.engine(
  'handlebars',
  exphbs.engine({
    defaultLayout: 'main',
    partialsDir: path.join(__dirname, 'views', 'partials')
  })
);
app.set('view engine', 'handlebars');

// Session setup
app.use(
  session({
    name: 'AwesomeTrailApp',
    secret: process.env.SESSION_SECRET || 'this is a secret',
    saveUninitialized: false,
    resave: false,
    cookie: {maxAge: 1000 * 60 * 60} // 1 hour
  })
);

// Middleware Architecture

// Make auth state available to all templates
app.use((req, res, next) => {
  const u = req.session.user || null;
  res.locals.user = u;
  res.locals.isAdmin = !!u && u.role === 'admin';
  next();
});

// Middleare logging 
app.use(async (req, res, next) => {
  const timestamp = new Date().toUTCString();
  let authStatus = 'guest';
  if (req.session.user) {
    authStatus = req.session.user.role === 'admin' ? 'admin' : 'user';
  }
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl} (Auth: ${authStatus})`);
  next();
});

// Redirect authenticated users away from /login
app.use('/login', (req, res, next) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  next();
});

// Redirect authenticated users away from /signup
app.use('/signup', (req, res, next) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  next();
});

// Protect authenticated only routes by sending them to /login
app.use('/profile', (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
});

app.use('/favorites', (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
});

app.use('/reports/new', (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
});

app.use('/trails', (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
});

// Admin-only protection for /admin 
app.use('/admin', (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  if (req.session.user.role !== 'admin') {
    return res.status(403).render('error', {error: '403: Forbidden'});
  }
  next();
});

// Mount the routes
configRoutes(app);

app.listen(3000, () => {
  console.log("We've now got a server!");
  console.log('Your routes will be running on http://localhost:3000');
});
