const { User, Tutor, RequestTutor, Inquiry } = require('../models');

// Helpers

const ASSIGNED_STATUSES = ['Rejected', 'Tutor Assigned', 'Assiged', 'Assigned'];
const APPROVED_TUTOR_ACTIVITY_DATE = { $ifNull: ['$approvedAt', '$updatedAt'] };

/** Return midnight (UTC) of a date offset by `days` from today */
const dayOffset = (days) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
};

/** Build a { today, last7Days, prev7Days } trend object for a given model + optional match filter */
const buildTrend = async (Model, matchFilter = {}) => {
  const todayStart = dayOffset(0);
  const tomorrowStart = dayOffset(1);
  const last7Start = dayOffset(-6); // inclusive of today = 7 days
  const prev7Start = dayOffset(-13);

  const [today, last7Days, prev7Days] = await Promise.all([
    Model.countDocuments({ ...matchFilter, createdAt: { $gte: todayStart, $lt: tomorrowStart } }),
    Model.countDocuments({ ...matchFilter, createdAt: { $gte: last7Start, $lt: tomorrowStart } }),
    Model.countDocuments({ ...matchFilter, createdAt: { $gte: prev7Start, $lt: last7Start } }),
  ]);

  return { today, last7Days, prev7Days };
};

/** Build a trend object from a computed date expression, such as approval date with legacy fallback */
const buildTrendByDateExpression = async (Model, matchFilter = {}, dateExpression) => {
  const todayStart = dayOffset(0);
  const tomorrowStart = dayOffset(1);
  const last7Start = dayOffset(-6); // inclusive of today = 7 days
  const prev7Start = dayOffset(-13);

  const countRange = async (start, end) => {
    const result = await Model.aggregate([
      { $match: matchFilter },
      { $addFields: { dashboardActivityDate: dateExpression } },
      { $match: { dashboardActivityDate: { $gte: start, $lt: end } } },
      { $count: 'total' },
    ]);

    return result.length > 0 ? result[0].total : 0;
  };

  const [today, last7Days, prev7Days] = await Promise.all([
    countRange(todayStart, tomorrowStart),
    countRange(last7Start, tomorrowStart),
    countRange(prev7Start, last7Start),
  ]);

  return { today, last7Days, prev7Days };
};

/** Build an array of { date: 'YYYY-MM-DD', count: N } for the last `days` days */
const buildDailyChart = async (Model, matchFilter = {}, days = 30) => {
  const startDate = dayOffset(-(days - 1));
  const endDate = dayOffset(1); // exclusive: tomorrow midnight

  const pipeline = [
    { $match: { ...matchFilter, createdAt: { $gte: startDate, $lt: endDate } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' },
        },
        count: { $sum: 1 },
      },
    },
  ];

  const raw = await Model.aggregate(pipeline);
  const byDate = Object.fromEntries(raw.map((r) => [r._id, r.count]));

  // Build a complete day-by-day array (fill gaps with 0)
  return Array.from({ length: days }, (_, i) => {
    const d = dayOffset(-(days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    return { date: key, count: byDate[key] || 0 };
  });
};

/** Build daily chart data from a computed date expression */
const buildDailyChartByDateExpression = async (Model, matchFilter = {}, days = 30, dateExpression) => {
  const startDate = dayOffset(-(days - 1));
  const endDate = dayOffset(1); // exclusive: tomorrow midnight

  const pipeline = [
    { $match: matchFilter },
    { $addFields: { dashboardActivityDate: dateExpression } },
    { $match: { dashboardActivityDate: { $gte: startDate, $lt: endDate } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$dashboardActivityDate', timezone: 'UTC' },
        },
        count: { $sum: 1 },
      },
    },
  ];

  const raw = await Model.aggregate(pipeline);
  const byDate = Object.fromEntries(raw.map((r) => [r._id, r.count]));

  return Array.from({ length: days }, (_, i) => {
    const d = dayOffset(-(days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    return { date: key, count: byDate[key] || 0 };
  });
};

/** Count tutor requests that are considered "open" (no tutor fully assigned) */
const countOpenTutorRequests = async () => {
  // A request is open if its status is NOT one of the closed statuses
  // AND it has no tutor blocks or at least one tutor block has no assignedTutor.
  const result = await RequestTutor.aggregate([
    {
      $match: {
        status: { $nin: ASSIGNED_STATUSES },
      },
    },
    {
      $addFields: {
        tutorBlocks: { $ifNull: ['$tutors', []] },
      },
    },
    {
      $addFields: {
        hasNoTutorBlocks: {
          $eq: [{ $size: '$tutorBlocks' }, 0],
        },
        hasUnassignedBlock: {
          $anyElementTrue: {
            $map: {
              input: '$tutorBlocks',
              as: 'block',
              in: {
                $or: [
                  { $eq: ['$$block.assignedTutor', null] },
                  { $eq: [{ $trim: { input: { $ifNull: ['$$block.assignedTutor', ''] } } }, ''] },
                ],
              },
            },
          },
        },
      },
    },
    {
      $match: {
        $or: [{ hasNoTutorBlocks: true }, { hasUnassignedBlock: true }],
      },
    },
    { $count: 'total' },
  ]);

  return result.length > 0 ? result[0].total : 0;
};

/** Build the recent activity feed - top 8 most-recent items across tutors, requests, inquiries */
const buildRecentActivity = async () => {
  const LIMIT = 8;

  const [recentTutors, recentRequests, recentInquiries] = await Promise.all([
    Tutor.find({}).select('fullName email status createdAt').sort({ createdAt: -1 }).limit(LIMIT).lean(),

    RequestTutor.find({}).select('name grade medium status createdAt updatedAt').sort({ updatedAt: -1 }).limit(LIMIT).lean(),

    Inquiry.find({}).select('sender message createdAt').sort({ createdAt: -1 }).limit(LIMIT).lean(),
  ]);

  const tutorItems = recentTutors.map((t) => ({
    type: 'tutor',
    id: String(t._id),
    name: t.fullName || '',
    email: t.email || '',
    status: t.status || 'pending',
    timestamp: t.createdAt,
  }));

  const requestItems = recentRequests.map((r) => ({
    type: 'tutorRequest',
    id: String(r._id),
    name: r.name || '',
    grade: r.grade || '',
    medium: r.medium || '',
    status: r.status || 'Pending',
    timestamp: r.updatedAt || r.createdAt,
  }));

  const inquiryItems = recentInquiries.map((i) => {
    const sender = i.sender || {};

    return {
      type: 'inquiry',
      id: String(i._id),
      senderName: sender.name || '',
      senderEmail: sender.email || '',
      message: i.message || '',
      timestamp: i.createdAt,
    };
  });

  return [...tutorItems, ...requestItems, ...inquiryItems]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, LIMIT);
};

// Public service functions

/** Existing lightweight summary (kept for backward compatibility) */
const getDashboardSummary = async () => {
  const [registeredTutors, registeredStudents, requestTutorRequests, registerAsTutorRequests] = await Promise.all([
    Tutor.countDocuments({ status: 'approved' }),
    User.countDocuments({ role: 'user' }),
    RequestTutor.countDocuments(),
    Tutor.countDocuments(),
  ]);

  return {
    registeredTutors,
    registeredStudents,
    requestTutorRequests,
    registerAsTutorRequests,
  };
};

/**
 * Single consolidated endpoint for the admin dashboard.
 * Replaces 5 separate heavy API calls from the frontend.
 */
const getFullDashboard = async () => {
  const CHART_DAYS = 60;

  const [
    // Summary counts
    registeredTutors,
    registeredStudents,
    requestTutorRequests,
    registerAsTutorRequests,

    // 7-day trends
    tutorTrend,
    requestTrend,
    applicationTrend,

    // Chart totals
    approvedTutorsTotal,

    // Daily chart history for current and previous dashboard windows
    approvedTutorsChart,
    tutorRequestsChart,
    tutorApplicationsChart,

    // Attention panel
    pendingTutorApplicationsTotal,
    openTutorRequestsTotal,
    inquiriesTotal,
    latestInquiry,

    // Recent activity
    recentActivity,
  ] = await Promise.all([
    // Summary
    Tutor.countDocuments({ status: 'approved' }),
    User.countDocuments({ role: 'user' }),
    RequestTutor.countDocuments(),
    Tutor.countDocuments(),

    // Trends
    buildTrendByDateExpression(Tutor, { status: 'approved' }, APPROVED_TUTOR_ACTIVITY_DATE), // approved tutors trend
    buildTrend(RequestTutor), // requestTutorRequests trend
    buildTrend(Tutor), // registerAsTutorRequests trend

    // Chart totals
    Tutor.countDocuments({ status: 'approved' }),

    // Chart
    buildDailyChartByDateExpression(Tutor, { status: 'approved' }, CHART_DAYS, APPROVED_TUTOR_ACTIVITY_DATE),
    buildDailyChart(RequestTutor, {}, CHART_DAYS),
    buildDailyChart(Tutor, {}, CHART_DAYS),

    // Attention
    Tutor.countDocuments({ status: 'pending' }),
    countOpenTutorRequests(),
    Inquiry.countDocuments(),
    Inquiry.findOne({}).sort({ createdAt: -1 }).select('sender').lean(),

    // Recent activity
    buildRecentActivity(),
  ]);

  return {
    summary: {
      registeredTutors,
      registeredStudents,
      requestTutorRequests,
      registerAsTutorRequests,
    },

    trends: {
      registeredTutors: tutorTrend,
      requestTutorRequests: requestTrend,
      registerAsTutorRequests: applicationTrend,
    },

    chart: {
      approvedTutors: approvedTutorsChart,
      tutorRequests: tutorRequestsChart,
      tutorApplications: tutorApplicationsChart,
      totals: {
        approvedTutors: approvedTutorsTotal,
        tutorRequests: requestTutorRequests,
        tutorApplications: registerAsTutorRequests,
      },
      daysIncluded: CHART_DAYS,
    },

    attention: {
      pendingTutorApplicationsTotal,
      openTutorRequestsTotal,
      inquiriesTotal,
      latestInquirySenderName: latestInquiry && latestInquiry.sender ? latestInquiry.sender.name || null : null,
    },

    recentActivity,
  };
};

module.exports = {
  getDashboardSummary,
  getFullDashboard,
};
