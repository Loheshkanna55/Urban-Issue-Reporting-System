const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const Notification = require('../models/Notification');
const { isAuthenticated } = require('../middleware/auth');
const { issueUpload } = require('../middleware/upload');
const { emitIssueUpdate } = require('../config/socket');

// GET /issues - list user's issues
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { status, category, page = 1 } = req.query;
    const query = req.user.role === 'admin' ? {} : { reportedBy: req.user._id };
    if (status) query.status = status;
    if (category) query.category = category;

    const limit = 10;
    const skip = (page - 1) * limit;
    const total = await Issue.countDocuments(query);
    const issues = await Issue.find(query)
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render('issues/index', {
      title: 'My Issues',
      issues,
      currentStatus: status || '',
      currentCategory: category || '',
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/dashboard');
  }
});

// GET /issues/new
router.get('/new', isAuthenticated, (req, res) => {
  res.render('issues/new', { title: 'Report an Issue' });
});

// POST /issues
router.post('/', isAuthenticated, (req, res) => {
  issueUpload(req, res, async (err) => {
    try {
      if (err) {
        req.flash('error', err.message);
        return res.redirect('/issues/new');
      }
      const { title, description, category, area, locality, address, severity, lat, lng } = req.body;
      const images = req.files ? req.files.map(f => `/uploads/issues/${f.filename}`) : [];

      const issue = new Issue({
        title, description, category, area, locality, address, severity: parseInt(severity) || 3,
        images,
        reportedBy: req.user._id,
        location: (lat && lng) ? { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] } : undefined,
        statusHistory: [{ status: 'Reported', updatedByName: req.user.name, comment: 'Issue reported by citizen' }]
      });

      await issue.calculatePriority();
      await issue.save();

      // Notify admins
      const admins = await require('../models/User').find({ role: 'admin' });
      for (const admin of admins) {
        await Notification.create({
          user: admin._id, issue: issue._id, issueId: issue.issueId,
          message: `New issue reported: ${issue.title} in ${issue.area}`,
          type: 'new_issue'
        });
      }

      emitIssueUpdate(issue._id, { type: 'new_issue', issueId: issue.issueId });

      req.flash('success', `Issue reported successfully! Your Issue ID: ${issue.issueId}`);
      res.redirect(`/issues/${issue._id}`);
    } catch (e) {
      req.flash('error', e.message);
      res.redirect('/issues/new');
    }
  });
});

// GET /issues/:id
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'name email phone')
      .populate('assignedTo', 'name email')
      .populate('statusHistory.updatedBy', 'name');

    if (!issue) {
      req.flash('error', 'Issue not found');
      return res.redirect('/issues');
    }

    // Only allow access to own issues or admins
    if (req.user.role !== 'admin' && issue.reportedBy._id.toString() !== req.user._id.toString()) {
      req.flash('error', 'Access denied');
      return res.redirect('/issues');
    }

    res.render('issues/show', { title: `Issue #${issue.issueId}`, issue });
  } catch (err) {
    req.flash('error', 'Issue not found');
    res.redirect('/issues');
  }
});

// POST /issues/:id/upvote
router.post('/:id/upvote', isAuthenticated, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    const uid = req.user._id.toString();
    const idx = issue.upvotes.findIndex(id => id.toString() === uid);
    if (idx > -1) issue.upvotes.splice(idx, 1);
    else issue.upvotes.push(req.user._id);
    await issue.save();
    res.json({ upvotes: issue.upvotes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
