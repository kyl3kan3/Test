const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, authenticateToken } = require('../middleware/auth');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      height,
      weight,
      activityLevel,
      healthGoals,
      medicalConditions,
      allergies
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        error: 'Email, password, first name, and last name are required' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create new user
    const userData = {
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      height,
      weight,
      activityLevel,
      healthGoals: healthGoals || [],
      medicalConditions: medicalConditions || [],
      allergies: allergies || []
    };

    const user = new User(userData);
    await user.hashPassword();
    await user.save();

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const userData = await User.findByEmail(email.toLowerCase());
    if (!userData) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create user instance to use methods
    const user = new User(userData);

    // Verify password
    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = new User(req.user);
    res.json({ user: user.toSafeObject() });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      height,
      weight,
      activityLevel,
      healthGoals,
      medicalConditions,
      allergies,
      currentSupplements
    } = req.body;

    const updateData = {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      height,
      weight,
      activityLevel,
      healthGoals,
      medicalConditions,
      allergies,
      currentSupplements
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedUser = await User.updateById(req.userId, updateData);
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = new User(updatedUser);
    res.json({
      message: 'Profile updated successfully',
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'New password must be at least 6 characters long' 
      });
    }

    // Verify current password
    const user = new User(req.user);
    const isCurrentPasswordValid = await user.verifyPassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.hashPassword();
    await user.save();

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Verify token (for frontend to check if token is still valid)
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: new User(req.user).toSafeObject() 
  });
});

module.exports = router;