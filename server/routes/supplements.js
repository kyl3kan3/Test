const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const Supplement = require('../models/Supplement');

// Initialize supplement database on first access
router.use(async (req, res, next) => {
  try {
    await Supplement.initializeDefaults();
    next();
  } catch (error) {
    console.error('Supplement initialization error:', error);
    next();
  }
});

// Get all supplements
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, search, limit = 50, offset = 0 } = req.query;
    
    let supplements = await Supplement.getAll();
    
    // Filter by category if specified
    if (category) {
      supplements = supplements.filter(s => 
        s.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    // Filter by search term if specified
    if (search) {
      const searchTerm = search.toLowerCase();
      supplements = supplements.filter(s => 
        s.name.toLowerCase().includes(searchTerm) ||
        s.description.toLowerCase().includes(searchTerm) ||
        s.benefits.some(benefit => benefit.toLowerCase().includes(searchTerm)) ||
        s.targetConditions.some(condition => condition.toLowerCase().includes(searchTerm))
      );
    }
    
    // Apply pagination
    const total = supplements.length;
    const paginatedSupplements = supplements.slice(
      parseInt(offset), 
      parseInt(offset) + parseInt(limit)
    );
    
    res.json({
      supplements: paginatedSupplements,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });
    
  } catch (error) {
    console.error('Get supplements error:', error);
    res.status(500).json({ error: 'Failed to fetch supplements' });
  }
});

// Get supplement by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const supplement = await Supplement.findById(id);
    
    if (!supplement) {
      return res.status(404).json({ error: 'Supplement not found' });
    }
    
    res.json({ supplement });
    
  } catch (error) {
    console.error('Get supplement error:', error);
    res.status(500).json({ error: 'Failed to fetch supplement' });
  }
});

// Search supplements by criteria
router.post('/search', optionalAuth, async (req, res) => {
  try {
    const { 
      category, 
      targetConditions, 
      nutrients, 
      name, 
      excludeAllergies = [],
      excludeInteractions = []
    } = req.body;
    
    const criteria = {
      category,
      targetConditions,
      nutrients,
      name
    };
    
    // Remove undefined values
    Object.keys(criteria).forEach(key => {
      if (criteria[key] === undefined) {
        delete criteria[key];
      }
    });
    
    let supplements = await Supplement.search(criteria);
    
    // Filter out supplements with user allergies or interactions
    if (excludeAllergies.length > 0) {
      supplements = supplements.filter(supplement => {
        return !supplement.nutrients.some(nutrient => 
          excludeAllergies.some(allergy => 
            nutrient.toLowerCase().includes(allergy.toLowerCase())
          )
        );
      });
    }
    
    if (excludeInteractions.length > 0) {
      supplements = supplements.filter(supplement => {
        return !supplement.interactions.some(interaction => 
          excludeInteractions.some(med => 
            interaction.toLowerCase().includes(med.toLowerCase())
          )
        );
      });
    }
    
    res.json({
      supplements,
      count: supplements.length,
      searchCriteria: criteria
    });
    
  } catch (error) {
    console.error('Search supplements error:', error);
    res.status(500).json({ error: 'Failed to search supplements' });
  }
});

// Get supplement categories
router.get('/meta/categories', optionalAuth, async (req, res) => {
  try {
    const supplements = await Supplement.getAll();
    const categories = [...new Set(supplements.map(s => s.category))].sort();
    
    res.json({ categories });
    
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get common target conditions
router.get('/meta/conditions', optionalAuth, async (req, res) => {
  try {
    const supplements = await Supplement.getAll();
    const allConditions = supplements.flatMap(s => s.targetConditions);
    const conditions = [...new Set(allConditions)].sort();
    
    res.json({ conditions });
    
  } catch (error) {
    console.error('Get conditions error:', error);
    res.status(500).json({ error: 'Failed to fetch conditions' });
  }
});

// Get supplements for specific health goals
router.post('/for-goals', authenticateToken, async (req, res) => {
  try {
    const { healthGoals } = req.body;
    
    if (!Array.isArray(healthGoals) || healthGoals.length === 0) {
      return res.status(400).json({ error: 'Health goals array is required' });
    }
    
    const supplements = await Supplement.getAll();
    
    // Find supplements that target the user's health goals
    const relevantSupplements = supplements.filter(supplement => {
      return supplement.targetConditions.some(condition => 
        healthGoals.some(goal => 
          goal.toLowerCase().includes(condition.toLowerCase()) ||
          condition.toLowerCase().includes(goal.toLowerCase())
        )
      ) || supplement.benefits.some(benefit => 
        healthGoals.some(goal => 
          goal.toLowerCase().includes(benefit.toLowerCase()) ||
          benefit.toLowerCase().includes(goal.toLowerCase())
        )
      );
    });
    
    // Sort by evidence level and relevance
    relevantSupplements.sort((a, b) => {
      const evidenceScore = { high: 3, medium: 2, low: 1 };
      return (evidenceScore[b.evidenceLevel] || 0) - (evidenceScore[a.evidenceLevel] || 0);
    });
    
    res.json({
      supplements: relevantSupplements,
      healthGoals,
      count: relevantSupplements.length
    });
    
  } catch (error) {
    console.error('Get supplements for goals error:', error);
    res.status(500).json({ error: 'Failed to fetch supplements for goals' });
  }
});

// Check supplement interactions
router.post('/check-interactions', authenticateToken, async (req, res) => {
  try {
    const { supplementIds, medications = [], currentSupplements = [] } = req.body;
    
    if (!Array.isArray(supplementIds) || supplementIds.length === 0) {
      return res.status(400).json({ error: 'Supplement IDs array is required' });
    }
    
    const supplements = await Promise.all(
      supplementIds.map(id => Supplement.findById(id))
    );
    
    const validSupplements = supplements.filter(Boolean);
    
    const interactions = [];
    
    // Check medication interactions
    validSupplements.forEach(supplement => {
      supplement.interactions.forEach(interaction => {
        medications.forEach(medication => {
          if (interaction.toLowerCase().includes(medication.toLowerCase()) ||
              medication.toLowerCase().includes(interaction.toLowerCase())) {
            interactions.push({
              type: 'medication',
              supplement: supplement.name,
              interaction: interaction,
              medication: medication,
              severity: 'moderate' // Could be enhanced with severity levels
            });
          }
        });
      });
    });
    
    // Check supplement-supplement interactions
    validSupplements.forEach((supplement, index) => {
      currentSupplements.forEach(currentSup => {
        if (supplement.name.toLowerCase() !== currentSup.toLowerCase()) {
          // Simple interaction check - could be enhanced with a proper interaction database
          const hasNutrientOverlap = supplement.nutrients.some(nutrient => 
            currentSup.toLowerCase().includes(nutrient.toLowerCase())
          );
          
          if (hasNutrientOverlap) {
            interactions.push({
              type: 'supplement',
              supplement: supplement.name,
              interaction: `Potential overlap with ${currentSup}`,
              severity: 'mild',
              recommendation: 'Monitor total intake to avoid excess'
            });
          }
        }
      });
    });
    
    res.json({
      supplements: validSupplements.map(s => ({ id: s.id, name: s.name })),
      interactions,
      interactionCount: interactions.length,
      hasInteractions: interactions.length > 0
    });
    
  } catch (error) {
    console.error('Check interactions error:', error);
    res.status(500).json({ error: 'Failed to check interactions' });
  }
});

// Get popular supplements
router.get('/meta/popular', optionalAuth, async (req, res) => {
  try {
    const supplements = await Supplement.getAll();
    
    // Sort by evidence level and general popularity
    const popularSupplements = supplements
      .filter(s => s.evidenceLevel === 'high')
      .sort((a, b) => {
        // Simple popularity score based on number of benefits and conditions
        const aScore = a.benefits.length + a.targetConditions.length;
        const bScore = b.benefits.length + b.targetConditions.length;
        return bScore - aScore;
      })
      .slice(0, 10);
    
    res.json({ supplements: popularSupplements });
    
  } catch (error) {
    console.error('Get popular supplements error:', error);
    res.status(500).json({ error: 'Failed to fetch popular supplements' });
  }
});

module.exports = router;