const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const gradeRoute = require('./grade.route');
const subjectRoute = require('./subject.route');
const docsRoute = require('./docs.route');
const testimonialRoute = require('./testimonial.route');
const faqRoute = require('./faq.route');
const inquiryRoute = require('./inquiry.route');
const paperRoute = require('./paper.route');
const tutorRoute = require('./tutor.route');
const tuitionAssignmentRoute = require('./tuitionAssignment.route');
const levelRoute = require('./level.route');
const tuitionRateRoutes = require('./tuitionRates.route');
const config = require('../../config/config');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/tuitionRates',
    route: tuitionRateRoutes,
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
  {
    path: '/faqs',
    route: faqRoute,
  },
  {
    path: '/inquiries',
    route: inquiryRoute,
  },
  {
    path: '/papers',
    route: paperRoute,
  },
  {
    path: '/tutors',
    route: tutorRoute,
  },
  {
    path: '/levels',
    route: levelRoute,
  },
  {
    path: '/tuition-assignments',
    route: tuitionAssignmentRoute,
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
