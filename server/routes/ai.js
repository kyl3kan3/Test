const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const aiService = require('../services/aiService');

// Generate personalized supplement recommendations
router.post('/recommendations', authenticateToken, async (req, res) => {
  try {
    const { userInputs, forceRegenerate = false } = req.body;
    
    // Check if user already has recent recommendations (within last 7 days)
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    
    if (!forceRegenerate && user.lastRecommendationDate) {
      const lastRecommendation = new Date(user.lastRecommendationDate);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      if (lastRecommendation > sevenDaysAgo && user.aiRecommendations?.length > 0) {
        return res.json({
          message: 'Using existing recent recommendations',
          recommendations: user.aiRecommendations,
          generatedAt: user.lastRecommendationDate,
          cached: true
        });
      }
    }

    // Generate new recommendations
    const result = await aiService.generateSupplementRecommendations(req.userId, userInputs);
    
    res.json({
      message: 'Recommendations generated successfully',
      ...result
    });

  } catch (error) {
    console.error('Generate recommendations error:', error);
    res.status(500).json({ 
      error: 'Failed to generate recommendations',
      details: error.message 
    });
  }
});

// Get current user recommendations
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    
    if (!user || !user.aiRecommendations || user.aiRecommendations.length === 0) {
      return res.json({
        recommendations: [],
        message: 'No recommendations found. Generate new recommendations to get started.'
      });
    }

    // Group recommendations by status
    const grouped = {
      pending: user.aiRecommendations.filter(r => r.status === 'pending'),
      started: user.aiRecommendations.filter(r => r.status === 'started'),
      completed: user.aiRecommendations.filter(r => r.status === 'completed'),
      ignored: user.aiRecommendations.filter(r => r.status === 'ignored')
    };

    res.json({
      recommendations: user.aiRecommendations,
      grouped,
      lastGenerated: user.lastRecommendationDate,
      stats: {
        total: user.aiRecommendations.length,
        pending: grouped.pending.length,
        started: grouped.started.length,
        completed: grouped.completed.length,
        ignored: grouped.ignored.length
      }
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// Analyze blood work with AI
router.post('/analyze-bloodwork/:bloodworkId', authenticateToken, async (req, res) => {
  try {
    const { bloodworkId } = req.params;
    
    // Verify blood work belongs to user
    const BloodWork = require('../models/BloodWork');
    const bloodwork = await BloodWork.findById(bloodworkId);
    
    if (!bloodwork) {
      return res.status(404).json({ error: 'Blood work not found' });
    }
    
    if (bloodwork.userId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const analysis = await aiService.analyzeBloodworkWithAI(bloodworkId);
    
    res.json({
      message: 'Blood work analysis completed',
      bloodworkId,
      analysis
    });

  } catch (error) {
    console.error('AI bloodwork analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze blood work',
      details: error.message 
    });
  }
});

// Get personalized educational content
router.post('/education', authenticateToken, async (req, res) => {
  try {
    const { topic } = req.body;
    
    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const education = await aiService.getPersonalizedEducation(req.userId, topic);
    
    res.json({
      message: 'Educational content generated',
      education
    });

  } catch (error) {
    console.error('Generate education error:', error);
    res.status(500).json({ 
      error: 'Failed to generate educational content',
      details: error.message 
    });
  }
});

// Chat with AI about health questions
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { question, conversationHistory = [] } = req.body;
    
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Get user context for personalized responses
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    const BloodWork = require('../models/BloodWork');
    const bloodworks = await BloodWork.findByUserId(req.userId);

    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Prepare context
    const userContext = {
      age: user.dateOfBirth ? calculateAge(user.dateOfBirth) : 'Not specified',
      gender: user.gender || 'Not specified',
      healthGoals: user.healthGoals || [],
      medicalConditions: user.medicalConditions || [],
      currentSupplements: user.currentSupplements || [],
      hasRecentBloodwork: bloodworks.length > 0
    };

    const systemPrompt = `You are a knowledgeable health assistant helping users with supplement and wellness questions. 

User context:
- Age: ${userContext.age}
- Gender: ${userContext.gender}
- Health goals: ${userContext.healthGoals.join(', ') || 'None specified'}
- Medical conditions: ${userContext.medicalConditions.join(', ') || 'None specified'}
- Current supplements: ${userContext.currentSupplements.join(', ') || 'None specified'}
- Has recent blood work: ${userContext.hasRecentBloodwork ? 'Yes' : 'No'}

Guidelines:
1. Provide helpful, evidence-based information
2. Always recommend consulting healthcare providers for medical decisions
3. Personalize responses based on user context
4. Be conversational but professional
5. Don't diagnose or provide specific medical advice
6. Focus on general wellness and supplement education`;

    // Build conversation messages
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history (last 10 exchanges)
    const recentHistory = conversationHistory.slice(-10);
    recentHistory.forEach(exchange => {
      messages.push({ role: 'user', content: exchange.question });
      messages.push({ role: 'assistant', content: exchange.answer });
    });

    // Add current question
    messages.push({ role: 'user', content: question });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.7,
      max_tokens: 500
    });

    const answer = response.choices[0].message.content;

    res.json({
      question,
      answer,
      timestamp: new Date().toISOString(),
      conversationId: req.headers['x-conversation-id'] || 'default'
    });

  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat request',
      details: error.message 
    });
  }
});

// Get AI-powered supplement interactions
router.post('/check-interactions', authenticateToken, async (req, res) => {
  try {
    const { supplements, medications = [], conditions = [] } = req.body;
    
    if (!supplements || !Array.isArray(supplements) || supplements.length === 0) {
      return res.status(400).json({ error: 'Supplements array is required' });
    }

    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `Analyze potential interactions between these supplements and provide safety information:

Supplements: ${supplements.join(', ')}
Medications: ${medications.join(', ') || 'None'}
Medical conditions: ${conditions.join(', ') || 'None'}

Please provide:
1. Potential supplement-supplement interactions
2. Supplement-medication interactions
3. Considerations for medical conditions
4. Safety recommendations
5. Overall risk assessment (Low/Medium/High)

Format as JSON with clear categorization.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: 'system', 
          content: 'You are a clinical pharmacist analyzing supplement interactions. Provide detailed, evidence-based interaction analysis.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 1000
    });

    let analysis;
    try {
      analysis = JSON.parse(response.choices[0].message.content);
    } catch (parseError) {
      // If JSON parsing fails, return the raw content
      analysis = {
        raw_analysis: response.choices[0].message.content,
        supplements_analyzed: supplements,
        medications: medications,
        conditions: conditions
      };
    }

    res.json({
      message: 'Interaction analysis completed',
      analysis,
      supplements_analyzed: supplements,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI interaction check error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze interactions',
      details: error.message 
    });
  }
});

// Get AI insights from user data
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const User = require('../models/User');
    const BloodWork = require('../models/BloodWork');
    
    const user = await User.findById(req.userId);
    const bloodworks = await BloodWork.findByUserId(req.userId);
    
    // Generate insights based on available data
    const insights = [];
    
    // Profile completeness insight
    const profileCompleteness = calculateProfileCompleteness(user);
    if (profileCompleteness < 80) {
      insights.push({
        type: 'profile',
        priority: 'medium',
        title: 'Complete Your Profile',
        message: `Your profile is ${profileCompleteness}% complete. Adding more information helps generate better recommendations.`,
        action: 'Update profile'
      });
    }

    // Blood work insights
    if (bloodworks.length === 0) {
      insights.push({
        type: 'bloodwork',
        priority: 'high',
        title: 'Add Blood Work',
        message: 'Upload your blood work results to get personalized supplement recommendations based on your actual nutrient levels.',
        action: 'Upload blood work'
      });
    } else {
      const recentBloodwork = bloodworks.find(b => {
        const testDate = new Date(b.testDate);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return testDate > sixMonthsAgo;
      });

      if (!recentBloodwork) {
        insights.push({
          type: 'bloodwork',
          priority: 'medium',
          title: 'Update Blood Work',
          message: 'Your most recent blood work is over 6 months old. Consider getting updated tests for current recommendations.',
          action: 'Upload recent blood work'
        });
      }
    }

    // Recommendation insights
    if (!user.aiRecommendations || user.aiRecommendations.length === 0) {
      insights.push({
        type: 'recommendations',
        priority: 'high',
        title: 'Get Personalized Recommendations',
        message: 'Generate AI-powered supplement recommendations based on your health profile and goals.',
        action: 'Generate recommendations'
      });
    } else {
      const pendingCount = user.aiRecommendations.filter(r => r.status === 'pending').length;
      if (pendingCount > 0) {
        insights.push({
          type: 'recommendations',
          priority: 'medium',
          title: 'Review Pending Recommendations',
          message: `You have ${pendingCount} pending supplement recommendations to review.`,
          action: 'Review recommendations'
        });
      }
    }

    // Health goals insight
    if (!user.healthGoals || user.healthGoals.length === 0) {
      insights.push({
        type: 'goals',
        priority: 'medium',
        title: 'Set Health Goals',
        message: 'Setting specific health goals helps us provide more targeted supplement recommendations.',
        action: 'Add health goals'
      });
    }

    res.json({
      insights,
      insights_count: insights.length,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Generate insights error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// Helper functions
function calculateAge(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
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