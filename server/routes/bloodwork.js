const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const BloodWork = require('../models/BloodWork');
const aiService = require('../services/aiService');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs').promises;

// Upload blood work file
router.post('/upload', authenticateToken, upload.single('bloodwork'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { testDate, testType, labName } = req.body;

    if (!testDate) {
      // Clean up uploaded file
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ error: 'Test date is required' });
    }

    // Create blood work record
    const bloodworkData = {
      userId: req.userId,
      testDate,
      testType: testType || 'comprehensive',
      labName: labName || 'Unknown Lab',
      uploadedFile: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    };

    const bloodwork = new BloodWork(bloodworkData);
    await bloodwork.save();

    // Start background processing to extract data from file
    processBloodworkFile(bloodwork.id, req.file);

    res.status(201).json({
      message: 'Blood work uploaded successfully',
      bloodwork: {
        id: bloodwork.id,
        testDate: bloodwork.testDate,
        testType: bloodwork.testType,
        labName: bloodwork.labName,
        analysisStatus: bloodwork.analysisStatus,
        uploadedAt: bloodwork.createdAt
      }
    });

  } catch (error) {
    console.error('Upload bloodwork error:', error);
    // Clean up uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    res.status(500).json({ error: 'Failed to upload blood work' });
  }
});

// Add upload error handling
router.use(handleUploadError);

// Manually add blood work results
router.post('/manual', authenticateToken, async (req, res) => {
  try {
    const { testDate, testType, labName, results } = req.body;

    if (!testDate || !results || typeof results !== 'object') {
      return res.status(400).json({ 
        error: 'Test date and results object are required' 
      });
    }

    const bloodworkData = {
      userId: req.userId,
      testDate,
      testType: testType || 'manual',
      labName: labName || 'Manual Entry',
      results
    };

    const bloodwork = new BloodWork(bloodworkData);
    
    // Analyze results immediately
    const analysis = bloodwork.analyzeResults();
    await bloodwork.save();

    res.status(201).json({
      message: 'Blood work results added successfully',
      bloodwork: {
        id: bloodwork.id,
        testDate: bloodwork.testDate,
        testType: bloodwork.testType,
        labName: bloodwork.labName,
        results: bloodwork.results,
        analysis: analysis,
        analysisStatus: bloodwork.analysisStatus
      }
    });

  } catch (error) {
    console.error('Manual bloodwork entry error:', error);
    res.status(500).json({ error: 'Failed to add blood work results' });
  }
});

// Get user's blood work history
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const bloodworks = await BloodWork.findByUserId(req.userId);
    
    // Sort by test date (newest first)
    bloodworks.sort((a, b) => new Date(b.testDate) - new Date(a.testDate));
    
    // Apply pagination
    const total = bloodworks.length;
    const paginatedBloodworks = bloodworks.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit)
    );

    res.json({
      bloodworks: paginatedBloodworks.map(b => ({
        id: b.id,
        testDate: b.testDate,
        testType: b.testType,
        labName: b.labName,
        analysisStatus: b.analysisStatus,
        deficienciesCount: b.deficiencies?.length || 0,
        flaggedValuesCount: b.flaggedValues?.length || 0,
        createdAt: b.createdAt
      })),
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });

  } catch (error) {
    console.error('Get bloodwork history error:', error);
    res.status(500).json({ error: 'Failed to fetch blood work history' });
  }
});

// Get specific blood work details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const bloodwork = await BloodWork.findById(id);

    if (!bloodwork) {
      return res.status(404).json({ error: 'Blood work not found' });
    }

    // Verify ownership
    if (bloodwork.userId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ bloodwork });

  } catch (error) {
    console.error('Get bloodwork details error:', error);
    res.status(500).json({ error: 'Failed to fetch blood work details' });
  }
});

// Trigger AI analysis for blood work
router.post('/:id/analyze', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const bloodwork = await BloodWork.findById(id);

    if (!bloodwork) {
      return res.status(404).json({ error: 'Blood work not found' });
    }

    // Verify ownership
    if (bloodwork.userId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!bloodwork.results || Object.keys(bloodwork.results).length === 0) {
      return res.status(400).json({ 
        error: 'Blood work results not available for analysis' 
      });
    }

    // Perform AI analysis
    try {
      const analysis = await aiService.analyzeBloodworkWithAI(id);
      
      res.json({
        message: 'Analysis completed successfully',
        analysis
      });
    } catch (aiError) {
      console.error('AI analysis error:', aiError);
      // Fall back to basic analysis
      const bloodworkInstance = new BloodWork(bloodwork);
      const basicAnalysis = bloodworkInstance.analyzeResults();
      await bloodworkInstance.save();
      
      res.json({
        message: 'Basic analysis completed (AI analysis failed)',
        analysis: basicAnalysis,
        warning: 'Advanced AI analysis was not available'
      });
    }

  } catch (error) {
    console.error('Analyze bloodwork error:', error);
    res.status(500).json({ error: 'Failed to analyze blood work' });
  }
});

// Update blood work results
router.put('/:id/results', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { results } = req.body;

    if (!results || typeof results !== 'object') {
      return res.status(400).json({ error: 'Results object is required' });
    }

    const bloodwork = await BloodWork.findById(id);

    if (!bloodwork) {
      return res.status(404).json({ error: 'Blood work not found' });
    }

    // Verify ownership
    if (bloodwork.userId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update results and re-analyze
    const bloodworkInstance = new BloodWork(bloodwork);
    bloodworkInstance.results = { ...bloodworkInstance.results, ...results };
    const analysis = bloodworkInstance.analyzeResults();
    await bloodworkInstance.save();

    res.json({
      message: 'Blood work results updated successfully',
      bloodwork: {
        id: bloodworkInstance.id,
        results: bloodworkInstance.results,
        analysis: analysis,
        analysisStatus: bloodworkInstance.analysisStatus
      }
    });

  } catch (error) {
    console.error('Update bloodwork results error:', error);
    res.status(500).json({ error: 'Failed to update blood work results' });
  }
});

// Delete blood work
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const bloodwork = await BloodWork.findById(id);

    if (!bloodwork) {
      return res.status(404).json({ error: 'Blood work not found' });
    }

    // Verify ownership
    if (bloodwork.userId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete uploaded file if exists
    if (bloodwork.uploadedFile && bloodwork.uploadedFile.path) {
      await fs.unlink(bloodwork.uploadedFile.path).catch(() => {});
    }

    // Remove from database (simplified - in real implementation, mark as deleted)
    // For now, we'll just update the status
    await BloodWork.updateAnalysisStatus(id, 'deleted');

    res.json({ message: 'Blood work deleted successfully' });

  } catch (error) {
    console.error('Delete bloodwork error:', error);
    res.status(500).json({ error: 'Failed to delete blood work' });
  }
});

// Get blood work trends
router.get('/trends/markers', authenticateToken, async (req, res) => {
  try {
    const { markers } = req.query;
    const bloodworks = await BloodWork.findByUserId(req.userId);
    
    // Filter blood works with results and sort by date
    const analyzedBloodworks = bloodworks
      .filter(b => b.results && Object.keys(b.results).length > 0)
      .sort((a, b) => new Date(a.testDate) - new Date(b.testDate));

    if (analyzedBloodworks.length < 2) {
      return res.json({
        trends: [],
        message: 'Insufficient data for trend analysis (need at least 2 blood work results)'
      });
    }

    const requestedMarkers = markers ? markers.split(',') : null;
    const trends = {};

    analyzedBloodworks.forEach((bloodwork, index) => {
      const testDate = bloodwork.testDate;
      
      Object.entries(bloodwork.results).forEach(([marker, value]) => {
        if (requestedMarkers && !requestedMarkers.includes(marker)) {
          return;
        }
        
        if (typeof value === 'number') {
          if (!trends[marker]) {
            trends[marker] = [];
          }
          
          trends[marker].push({
            date: testDate,
            value: value,
            bloodworkId: bloodwork.id
          });
        }
      });
    });

    // Calculate trend direction for each marker
    const trendAnalysis = Object.entries(trends).map(([marker, data]) => {
      if (data.length < 2) return null;
      
      const latest = data[data.length - 1];
      const previous = data[data.length - 2];
      const change = latest.value - previous.value;
      const percentChange = (change / previous.value) * 100;
      
      let direction = 'stable';
      if (Math.abs(percentChange) > 5) {
        direction = change > 0 ? 'increasing' : 'decreasing';
      }
      
      return {
        marker,
        data,
        trend: {
          direction,
          change,
          percentChange: Math.round(percentChange * 100) / 100,
          latest: latest.value,
          previous: previous.value
        }
      };
    }).filter(Boolean);

    res.json({
      trends: trendAnalysis,
      dataPoints: analyzedBloodworks.length,
      timeSpan: {
        from: analyzedBloodworks[0].testDate,
        to: analyzedBloodworks[analyzedBloodworks.length - 1].testDate
      }
    });

  } catch (error) {
    console.error('Get bloodwork trends error:', error);
    res.status(500).json({ error: 'Failed to fetch blood work trends' });
  }
});

// Background function to process uploaded files
async function processBloodworkFile(bloodworkId, file) {
  try {
    const bloodwork = await BloodWork.findById(bloodworkId);
    if (!bloodwork) return;

    let extractedText = '';

    // Extract text based on file type
    if (file.mimetype === 'application/pdf') {
      const buffer = await fs.readFile(file.path);
      const data = await pdfParse(buffer);
      extractedText = data.text;
    } else if (file.mimetype.includes('word')) {
      const buffer = await fs.readFile(file.path);
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (file.mimetype === 'text/plain') {
      extractedText = await fs.readFile(file.path, 'utf8');
    }

    if (extractedText) {
      // Simple extraction of numerical values (this could be enhanced with ML/NLP)
      const results = extractBloodWorkValues(extractedText);
      
      // Update blood work with extracted results
      const bloodworkInstance = new BloodWork(bloodwork);
      bloodworkInstance.results = results;
      
      if (Object.keys(results).length > 0) {
        bloodworkInstance.analyzeResults();
      } else {
        bloodworkInstance.analysisStatus = 'manual_entry_required';
      }
      
      await bloodworkInstance.save();
    } else {
      await BloodWork.updateAnalysisStatus(bloodworkId, 'extraction_failed');
    }

  } catch (error) {
    console.error('Process bloodwork file error:', error);
    await BloodWork.updateAnalysisStatus(bloodworkId, 'error');
  }
}

// Simple function to extract blood work values from text
function extractBloodWorkValues(text) {
  const results = {};
  const patterns = {
    'vitamin_d': /vitamin\s*d.*?(\d+\.?\d*)\s*ng\/ml/i,
    'b12': /b12.*?(\d+\.?\d*)\s*pg\/ml/i,
    'iron': /iron.*?(\d+\.?\d*)\s*μg\/dl/i,
    'ferritin': /ferritin.*?(\d+\.?\d*)\s*ng\/ml/i,
    'total_cholesterol': /total\s*cholesterol.*?(\d+\.?\d*)\s*mg\/dl/i,
    'hdl_cholesterol': /hdl.*?(\d+\.?\d*)\s*mg\/dl/i,
    'ldl_cholesterol': /ldl.*?(\d+\.?\d*)\s*mg\/dl/i,
    'triglycerides': /triglycerides.*?(\d+\.?\d*)\s*mg\/dl/i,
    'glucose': /glucose.*?(\d+\.?\d*)\s*mg\/dl/i,
    'hemoglobin': /hemoglobin.*?(\d+\.?\d*)\s*g\/dl/i,
    'tsh': /tsh.*?(\d+\.?\d*)\s*miu\/l/i
  };

  Object.entries(patterns).forEach(([key, pattern]) => {
    const match = text.match(pattern);
    if (match && match[1]) {
      results[key] = parseFloat(match[1]);
    }
  });

  return results;
}

module.exports = router;