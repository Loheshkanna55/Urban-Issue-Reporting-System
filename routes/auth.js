const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isAuthenticated, isGuest } = require('../middleware/auth');
const { profileUpload } = require('../middleware/upload');

// GET /login
router.get('/login', isGuest, (req, res) => {
  res.render('auth/login', { title: 'Login' });
});

// POST /login
router.post('/login', isGuest, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }
    const valid = await user.comparePassword(password);
    if (!valid) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }

    // Set session
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage
    };

    // Set JWT cookie
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'jwt_secret', { expiresIn: '1d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

    req.flash('success', `Welcome back, ${user.name}!`);
    res.redirect(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
  } catch (err) {
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/login');
  }
});

// GET /register
router.get('/register', isGuest, (req, res) => {
  res.render('auth/register', { title: 'Register' });
});

// POST /register
router.post('/register', isGuest, async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone, area } = req.body;

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match');
      return res.redirect('/register');
    }

    const existing = await User.findOne({ email });
    if (existing) {
      req.flash('error', 'Email already registered');
      return res.redirect('/register');
    }

    const user = await User.create({ name, email, password, phone, area });
    req.flash('success', 'Registration successful! Please login.');
    res.redirect('/login');
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/register');
  }
});

// GET /logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.clearCookie('token');
  req.flash('success', 'Logged out successfully');
  res.redirect('/login');
});

// GET /profile
router.get('/profile', isAuthenticated, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.render('auth/profile', { title: 'My Profile', user });
});

// PUT /profile
router.put('/profile', isAuthenticated, (req, res) => {
  profileUpload(req, res, async (err) => {
    try {
      if (err) {
        req.flash('error', err.message);
        return res.redirect('/profile');
      }
      const { name, phone, area } = req.body;
      const update = { name, phone, area };
      if (req.file) update.profileImage = `/uploads/profiles/${req.file.filename}`;

      const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
      req.session.user = { ...req.session.user, name: user.name, profileImage: user.profileImage };
      req.flash('success', 'Profile updated successfully');
      res.redirect('/profile');
    } catch (e) {
      req.flash('error', e.message);
      res.redirect('/profile');
    }
  });
});

// PUT /profile/password
router.put('/profile/password', isAuthenticated, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    if (newPassword !== confirmNewPassword) {
      req.flash('error', 'New passwords do not match');
      return res.redirect('/profile');
    }
    const user = await User.findById(req.user._id);
    const valid = await user.comparePassword(currentPassword);
    if (!valid) {
      req.flash('error', 'Current password is incorrect');
      return res.redirect('/profile');
    }
    user.password = newPassword;
    await user.save();
    req.flash('success', 'Password changed successfully');
    res.redirect('/profile');
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/profile');
  }
});

module.exports = router;
