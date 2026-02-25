const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const Notification = require('../models/Notification');
const { isAuthenticated } = require('../middleware/auth');

// GET /api/issues/geojson - for heatmap
router.get('/issues/geojson', isAuthenticated, async (req, res) => {
  try {
    const { category, status } = req.query;
    const query = { 'location.coordinates': { $exists: true } };
    if (category) query.category = category;
    if (status) query.status = status;

    const issues = await Issue.find(query).select('title category status location severity priorityScore area');
    const geojson = {
      type: 'FeatureCollection',
      features: issues.map(issue => ({
        type: 'Feature',
        geometry: issue.location,
        properties: {
          id: issue._id,
          title: issue.title,
          category: issue.category,
          status: issue.status,
          severity: issue.severity,
          priorityScore: issue.priorityScore,
          area: issue.area
        }
      }))
    };
    res.json(geojson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notifications/unread-count
router.get('/notifications/unread-count', isAuthenticated, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user._id, isRead: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats - live stats for dashboard
router.get('/stats', isAuthenticated, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { reportedBy: req.user._id };
    const [total, reported, inProgress, resolved] = await Promise.all([
      Issue.countDocuments(query),
      Issue.countDocuments({ ...query, status: 'Reported' }),
      Issue.countDocuments({ ...query, status: 'In Progress' }),
      Issue.countDocuments({ ...query, status: 'Resolved' })
    ]);
    res.json({ total, reported, inProgress, resolved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/issues/area-stats
router.get('/issues/area-stats', isAuthenticated, async (req, res) => {
  try {
    const stats = await Issue.aggregate([
      { $group: { _id: '$area', count: { $sum: 1 }, avgSeverity: { $avg: '$severity' } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
