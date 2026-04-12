const catchAsync = require('../utils/catchAsync');
const { dashboardService } = require('../services');

const getDashboardSummary = catchAsync(async (req, res) => {
  const summary = await dashboardService.getDashboardSummary();
  res.send(summary);
});

module.exports = {
  getDashboardSummary,
};
