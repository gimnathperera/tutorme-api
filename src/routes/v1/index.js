const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const gradeRoute = require('./grade.route');
const subjectRoute = require('./subject.route');
const docsRoute = require('./docs.route');
const testimonialRoute = require('./testimonial.route');
const config = require('../../config/config');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/grades',
    route: gradeRoute,
  },
  {
    path: '/subjects',
    route: subjectRoute,
  },
  {
    path: '/testimonials',
    route: testimonialRoute,
  },
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;
