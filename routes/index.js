import authRoutes from './auth.js';
import trailRoutes from './trails.js';
import adminRoutes from './admin.js';
import favoritesRoutes from './favorites.js';
import reportsRoutes from './reports.js';

const constructorMethod = (app) => {
  app.use('/trails', trailRoutes);
  app.use('/favorites', favoritesRoutes);
  app.use('/reports', reportsRoutes);
  app.use('/', authRoutes);
  app.use('/admin', adminRoutes);

  app.use((req, res) => {
    res.status(404).render('error', {error: 'Page not found'});
  });
};

export default constructorMethod;
