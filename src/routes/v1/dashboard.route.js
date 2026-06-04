const express = require('express');
const auth = require('../../middlewares/auth');
const dashboardController = require('../../controllers/dashboard.controller');

const router = express.Router();

router.get('/summary', auth('getUsers'), dashboardController.getDashboardSummary);
router.get('/full', auth('getUsers'), dashboardController.getFullDashboard);

module.exports = router;
