const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { emitIssueUpdate } = require('../config/socket');
const { sendStatusEmail } = require('../config/mailer');

// All admin routes require auth + admin role
router.use(isAuthenticated, isAdmin);

// GET /admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [total, reported, verified, inProgress, resolved, rejected, recentIssues, categoryStats] = await Promise.all([
      Issue.countDocuments(),
      Issue.countDocuments({ status: 'Reported' }),
      Issue.countDocuments({ status: 'Verified' }),
      Issue.countDocuments({ status: 'In Progress' }),
      Issue.countDocuments({ status: 'Resolved' }),
      Issue.countDocuments({ status: 'Rejected' }),
      Issue.find().sort({ createdAt: -1 }).limit(10).populate('reportedBy', 'name'),
      Issue.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    // Monthly data for last 6 months
    const monthlyData = await Issue.aggregate([
      { $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 }
    ]);

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      stats: { total, reported, verified, inProgress, resolved, rejected },
      recentIssues, categoryStats, monthlyData
    });
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/dashboard');
  }
});

// GET /admin/issues
router.get('/issues', async (req, res) => {
  try {
    const { status, category, area, priority, page = 1 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (area) query.area = new RegExp(area, 'i');

    const limit = 15;
    const skip = (page - 1) * limit;
    const total = await Issue.countDocuments(query);

    let sort = { createdAt: -1 };
    if (priority === 'high') sort = { priorityScore: -1 };

    const issues = await Issue.find(query)
      .populate('reportedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Update priority scores
    for (const issue of issues) {
      await issue.calculatePriority();
      await issue.save();
    }

    const areas = await Issue.distinct('area');

    res.render('admin/issues', {
      title: 'Manage Issues',
      issues, areas,
      filters: { status, category, area, priority },
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/admin/dashboard');
  }
});

// PUT /admin/issues/:id/status - Update status
router.put('/issues/:id/status', async (req, res) => {
  try {
    const { status, comment } = req.body;
    const issue = await Issue.findById(req.params.id).populate('reportedBy');

    if (!issue) {
      req.flash('error', 'Issue not found');
      return res.redirect('/admin/issues');
    }

    const oldStatus = issue.status;
    issue.status = status;
    issue.statusHistory.push({
      status, updatedBy: req.user._id, updatedByName: req.user.name,
      comment: comment || `Status changed to ${status}`
    });
    if (status === 'Resolved') issue.resolvedAt = new Date();

    await issue.calculatePriority();
    await issue.save();

    // Notify reporter
    await Notification.create({
      user: issue.reportedBy._id, issue: issue._id, issueId: issue.issueId,
      message: `Your issue #${issue.issueId} status updated to: ${status}`,
      type: 'status_update'
    });

    // Send email notification
    if (issue.reportedBy.email) {
      sendStatusEmail({
        to: issue.reportedBy.email,
        name: issue.reportedBy.name,
        issueId: issue.issueId,
        issueTitle: issue.title,
        status, message: comment
      });
    }

    // Emit real-time update
    emitIssueUpdate(issue._id, {
      issueId: issue.issueId, status,
      message: `Issue #${issue.issueId} updated to ${status}`
    });

    req.flash('success', `Issue status updated to ${status}`);
    res.redirect('/admin/issues');
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/admin/issues');
  }
});

// PUT /admin/issues/:id/priority - Update priority/severity
router.put('/issues/:id/priority', async (req, res) => {
  try {
    const { severity, adminNote } = req.body;
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.redirect('/admin/issues');

    issue.severity = parseInt(severity);
    issue.adminNote = adminNote || issue.adminNote;
    await issue.calculatePriority();
    await issue.save();

    req.flash('success', 'Priority updated');
    res.redirect('/admin/issues');
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/admin/issues');
  }
});

// PUT /admin/issues/:id/spam - Mark as spam
router.put('/issues/:id/spam', async (req, res) => {
  try {
    await Issue.findByIdAndUpdate(req.params.id, { isSpam: true, status: 'Rejected' });
    req.flash('success', 'Issue marked as spam');
    res.redirect('/admin/issues');
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/admin/issues');
  }
});

// GET /admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.render('admin/users', { title: 'Manage Users', users });
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/admin/dashboard');
  }
});

// GET /admin/heatmap
router.get('/heatmap', async (req, res) => {
  res.render('admin/heatmap', { title: 'Issue Heatmap' });
});

module.exports = router;
