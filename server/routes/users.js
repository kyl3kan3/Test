const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');

// Get user dashboard data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const user = new User(req.user);
    const BloodWork = require('../models/BloodWork');
    
    // Get user's blood work history
    const bloodworks = await BloodWork.findByUserId(req.userId);
    
    // Get latest recommendations
    const latestRecommendations = user.aiRecommendations || [];
    
    // Calculate health score based on available data
    const healthScore = calculateHealthScore(user, bloodworks);
    
    const dashboardData = {
      user: user.toSafeObject(),
      healthScore,
      recentBloodwork: bloodworks.slice(0, 3).map(b => ({
        id: b.id,
        testDate: b.testDate,
        testType: b.testType,
        analysisStatus: b.analysisStatus,
        flaggedValues: b.flaggedValues?.length || 0
      })),
      activeRecommendations: latestRecommendations.filter(r => r.status === 'pending').slice(0, 5),
      totalRecommendations: latestRecommendations.length,
      completedRecommendations: latestRecommendations.filter(r => r.status === 'completed').length,
      stats: {
        totalBloodworks: bloodworks.length,
        deficienciesFound: bloodworks.reduce((acc, b) => acc + (b.deficiencies?.length || 0), 0),
        supplementsRecommended: latestRecommendations.length,
        profileCompleteness: calculateProfileCompleteness(user)
      }
    };
    
    res.json(dashboardData);
    
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Update recommendation status
router.put('/recommendations/:recommendationId/status', authenticateToken, async (req, res) => {
  try {
    const { recommendationId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'started', 'completed', 'ignored'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const user = await User.findById(req.userId);
    if (!user || !user.aiRecommendations) {
      return res.status(404).json({ error: 'User or recommendations not found' });
    }
    
    const recommendationIndex = user.aiRecommendations.findIndex(r => r.id === recommendationId);
    if (recommendationIndex === -1) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }
    
    // Update the recommendation status
    const updatedRecommendations = [...user.aiRecommendations];
    updatedRecommendations[recommendationIndex] = {
      ...updatedRecommendations[recommendationIndex],
      status,
      updatedAt: new Date().toISOString()
    };
    
    await User.updateById(req.userId, { aiRecommendations: updatedRecommendations });
    
    res.json({
      message: 'Recommendation status updated',
      recommendation: updatedRecommendations[recommendationIndex]
    });
    
  } catch (error) {
    console.error('Update recommendation error:', error);
    res.status(500).json({ error: 'Failed to update recommendation status' });
  }
});

// Get user's health timeline
router.get('/timeline', authenticateToken, async (req, res) => {
  try {
    const BloodWork = require('../models/BloodWork');
    const bloodworks = await BloodWork.findByUserId(req.userId);
    const user = new User(req.user);
    
    const timeline = [];
    
    // Add blood work entries
    bloodworks.forEach(bloodwork => {
      timeline.push({
        type: 'bloodwork',
        date: bloodwork.testDate,
        title: `Blood Work - ${bloodwork.testType}`,
        description: `${bloodwork.flaggedValues?.length || 0} flagged values`,
        data: {
          id: bloodwork.id,
          testType: bloodwork.testType,
          labName: bloodwork.labName,
          analysisStatus: bloodwork.analysisStatus
        }
      });
    });
    
    // Add recommendation entries
    if (user.aiRecommendations) {
      user.aiRecommendations.forEach(rec => {
        timeline.push({
          type: 'recommendation',
          date: rec.generatedAt,
          title: `New Recommendation: ${rec.supplementName}`,
          description: rec.reasoning,
          data: rec
        });
      });
    }
    
    // Sort by date (newest first)
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json({ timeline });
    
  } catch (error) {
    console.error('Timeline error:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

// Add/Update health goal
router.post('/health-goals', authenticateToken, async (req, res) => {
  try {
    const { goal } = req.body;
    
    if (!goal || typeof goal !== 'string') {
      return res.status(400).json({ error: 'Valid goal is required' });
    }
    
    const user = await User.findById(req.userId);
    const currentGoals = user.healthGoals || [];
    
    if (!currentGoals.includes(goal)) {
      currentGoals.push(goal);
      await User.updateById(req.userId, { healthGoals: currentGoals });
    }
    
    res.json({
      message: 'Health goal added',
      healthGoals: currentGoals
    });
    
  } catch (error) {
    console.error('Add health goal error:', error);
    res.status(500).json({ error: 'Failed to add health goal' });
  }
});

// Remove health goal
router.delete('/health-goals/:goal', authenticateToken, async (req, res) => {
  try {
    const { goal } = req.params;
    const user = await User.findById(req.userId);
    const currentGoals = user.healthGoals || [];
    
    const updatedGoals = currentGoals.filter(g => g !== decodeURIComponent(goal));
    await User.updateById(req.userId, { healthGoals: updatedGoals });
    
    res.json({
      message: 'Health goal removed',
      healthGoals: updatedGoals
    });
    
  } catch (error) {
    console.error('Remove health goal error:', error);
    res.status(500).json({ error: 'Failed to remove health goal' });
  }
});

// Helper functions
function calculateHealthScore(user, bloodworks) {
  let score = 50; // Base score
  
  // Profile completeness (max 20 points)
  const completeness = calculateProfileCompleteness(user);
  score += completeness * 0.2;
  
  // Recent blood work (max 15 points)
  const recentBloodwork = bloodworks.find(b => {
    const testDate = new Date(b.testDate);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return testDate > sixMonthsAgo;
  });
  
  if (recentBloodwork) {
    score += 15;
    // Deduct points for flagged values
    const flaggedCount = recentBloodwork.flaggedValues?.length || 0;
    score -= Math.min(flaggedCount * 2, 10);
  }
  
  // Following recommendations (max 15 points)
  if (user.aiRecommendations) {
    const totalRecs = user.aiRecommendations.length;
    const followedRecs = user.aiRecommendations.filter(r => r.status === 'completed' || r.status === 'started').length;
    if (totalRecs > 0) {
      score += (followedRecs / totalRecs) * 15;
    }
  }
  
  return Math.min(Math.max(Math.round(score), 0), 100);
}

function calculateProfileCompleteness(user) {
  const fields = [
    'firstName', 'lastName', 'email', 'dateOfBirth', 'gender',
    'height', 'weight', 'activityLevel'
  ];
  
  const arrayFields = ['healthGoals', 'medicalConditions'];
  
  let completedFields = 0;
  let totalFields = fields.length + arrayFields.length;
  
  fields.forEach(field => {
    if (user[field] && user[field] !== '') {
      completedFields++;
    }
  });
  
  arrayFields.forEach(field => {
    if (user[field] && Array.isArray(user[field]) && user[field].length > 0) {
      completedFields++;
    }
  });
  
  return Math.round((completedFields / totalFields) * 100);
}

module.exports = router;