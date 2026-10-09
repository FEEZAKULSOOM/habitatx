import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { auth } from '../config/firebase.js';
import generateTokenAndSetCookie from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    console.log('[AUTH] Registration attempt:', { name, email, role });

    if (!name || !email || !password) {
      console.warn('[AUTH] Registration failed: Missing required fields');
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.warn(`[AUTH] Registration failed: Email ${email} already exists`);
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password with bcryptjs
    console.log('[AUTH] Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role === 'landlord' ? 'landlord' : 'tenant',
    });
    console.log(`[AUTH] User created successfully in DB: ${user._id} (${user.role})`);

    // Set HttpOnly JWT cookie
    generateTokenAndSetCookie(res, user._id, user.role);
    console.log('[AUTH] JWT cookie generated and set in response header');

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    });
  } catch (error) {
    console.error('[AUTH ERROR] registerUser:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user & set token cookie
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('[AUTH] Login attempt for:', email);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Lowercase and trim for exact database match
    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      console.warn(`[AUTH] Login failed: User not found with email ${cleanEmail}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      console.warn(`[AUTH] Login failed: Incorrect password for ${cleanEmail}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    generateTokenAndSetCookie(res, user._id, user.role);
    console.log(`[AUTH] Login successful for: ${cleanEmail} (${user.role})`);

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    });
  } catch (error) {
    console.error('[AUTH ERROR] loginUser:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Log out user & clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = (req, res) => {
  console.log('[AUTH] Logging out user and clearing cookie');

  // Must match the exact production cross-site cookie options
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: true,      // REQUIRED for HTTPS / Railway
    sameSite: 'none',  // REQUIRED for cross-site (Vercel <-> Railway)
    path: '/',         // Ensures the root path cookie is targeted
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = async (req, res) => {
  try {
    console.log('[AUTH] Fetching current user details for ID:', req.user?._id);
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      console.warn('[AUTH] Current user profile not found');
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('[AUTH ERROR] getCurrentUser:', error.message);
    res.status(500).json({ message: error.message });
  }
};





// @desc    Authenticate with Firebase Google ID Token
// @route   POST /api/auth/google
// @access  Public


// Inside your googleAuth controller:
// @desc    Authenticate with Firebase Google ID Token
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req, res) => {
  try {
    const { idToken, role = 'tenant' } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'Firebase ID Token is required' });
    }

    // Verify token with Firebase Admin Auth
    const decodedToken = await auth.verifyIdToken(idToken);
    const { email, name, picture, uid } = decodedToken;

    if (!email) {
      return res.status(400).json({ message: 'Google account missing verified email' });
    }

    // Find or create user in MongoDB
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: name || 'Google User',
        email,
        role,
        avatar: picture || '',
        firebaseUid: uid,
      });
      console.log('[AUTH] New Google user registered:', email);
    } else {
      console.log('[AUTH] Existing Google user logged in:', email);
    }

    // Generate JWT and set HttpOnly cookie with (res, userId, role)
    generateTokenAndSetCookie(res, user._id, user.role);

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    });
  } catch (error) {
    console.error('[AUTH ERROR] googleAuth:', error.message);
    res.status(401).json({ message: 'Invalid or expired Firebase token' });
  }
};