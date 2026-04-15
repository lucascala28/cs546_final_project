import authRoutes from './auth.js';
import trailRoutes from './trails.js';
import adminRoutes from './admin.js';

const constructorMethod = (app) => {
  app.use('/', authRoutes);
  app.use('/trails', trailRoutes);
  app.use('/admin', adminRoutes);

  app.use((req, res) => {
    res.status(404).render('error', {error: 'Page not found'});
  });
};

export default constructorMethod;
