const express   = require('express');
const router    = express.Router();
const jwt       = require('jsonwebtoken');
const crypto    = require('crypto');
const User      = require('../models/User');
const sendEmail = require('../utils/SendEmail');

function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized' });
    }
  }
  if (!token) return res.status(401).json({ message: 'No token' });
};

// REGISTER — anyone can create account
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password });
    res.status(201).json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const match = await user.matchPassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid email or password' });

    res.json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// FORGOT PASSWORD — sends reset link to email
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account with that email' });

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken  = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save({ validateBeforeSave: false });

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to:      user.email,
      subject: '🔐 Password Reset — Water AMC System',
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;background:#f9fafb;border-radius:12px;">
          <h2 style="color:#1d4ed8;">💧 Water AMC System</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>You requested a password reset. Click the button below — this link expires in <strong>15 minutes</strong>.</p>
          <a href="${resetUrl}"
            style="display:inline-block;margin:16px 0;padding:12px 24px;background:#3b82f6;color:white;border-radius:8px;text-decoration:none;font-weight:bold;">
            Reset Password
          </a>
          <p style="color:#6b7280;font-size:12px;">If you didn't request this, ignore this email.</p>
          <p style="color:#6b7280;font-size:12px;">— Water AMC System, Jaipur</p>
        </div>
      `,
    });

    res.json({ message: 'Reset link sent to your email' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// RESET PASSWORD
router.post('/reset-password/:token', async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken:  hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired reset link' });

    user.password            = req.body.password;
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET current user
router.get('/me', protect, (req, res) => {
  res.json(req.user);
});

module.exports = router;