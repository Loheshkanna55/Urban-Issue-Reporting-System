const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const Notification = require('../models/Notification');
const { isAuthenticated } = require('../middleware/auth');

// GET /dashboard
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { reportedBy: req.user._id };

    const [total, reported, verified, inProgress, resolved, recentIssues, notifications] = await Promise.all([
      Issue.countDocuments(query),
      Issue.countDocuments({ ...query, status: 'Reported' }),
      Issue.countDocuments({ ...query, status: 'Verified' }),
      Issue.countDocuments({ ...query, status: 'In Progress' }),
      Issue.countDocuments({ ...query, status: 'Resolved' }),
      Issue.find(query).sort({ createdAt: -1 }).limit(5).populate('reportedBy', 'name'),
      Notification.find({ user: req.user._id, isRead: false }).sort({ createdAt: -1 }).limit(5)
    ]);

    res.render('dashboard', {
      title: 'Dashboard',
      stats: { total, reported, verified, inProgress, resolved },
      recentIssues,
      notifications
    });
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/login');
  }
});

// GET /dashboard/notifications
router.get('/notifications', isAuthenticated, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.render('notifications', { title: 'Notifications', notifications });
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/dashboard');
  }
});

module.exports = router;
