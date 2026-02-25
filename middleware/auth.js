const jwt = require('jsonwebtoken');
const User = require('../models/User');

const isAuthenticated = async (req, res, next) => {
  try {
    // Check session first
    if (req.session && req.session.user) {
      req.user = await User.findById(req.session.user._id);
      if (req.user) return next();
    }

    // Then check JWT cookie
    const token = req.cookies.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt_secret');
      req.user = await User.findById(decoded.id);
      if (req.user) {
        req.session.user = req.user;
        return next();
      }
    }

    req.flash('error', 'Please login to continue');
    res.redirect('/login');
  } catch (err) {
    req.flash('error', 'Session expired, please login again');
    res.redirect('/login');
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  req.flash('error', 'Access denied. Admin only.');
  res.redirect('/dashboard');
};

const isGuest = (req, res, next) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  next();
};

module.exports = { isAuthenticated, isAdmin, isGuest };
