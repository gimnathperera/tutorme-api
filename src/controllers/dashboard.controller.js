const catchAsync = require('../utils/catchAsync');
const { dashboardService } = require('../services');

const getDashboardSummary = catchAsync(async (req, res) => {
  const summary = await dashboardService.getDashboardSummary();
  res.send(summary);
});

const getFullDashboard = catchAsync(async (req, res) => {
  const data = await dashboardService.getFullDashboard();
  res.send(data);
});

module.exports = {
  getDashboardSummary,
  getFullDashboard,
};
