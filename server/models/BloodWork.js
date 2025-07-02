const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../data');
const BLOODWORK_FILE = path.join(DATA_DIR, 'bloodwork.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

class BloodWork {
  constructor(bloodworkData) {
    this.id = bloodworkData.id || uuidv4();
    this.userId = bloodworkData.userId;
    this.testDate = bloodworkData.testDate;
    this.testType = bloodworkData.testType; // comprehensive, basic, lipid, etc.
    this.labName = bloodworkData.labName;
    this.results = bloodworkData.results || {}; // key-value pairs of test results
    this.uploadedFile = bloodworkData.uploadedFile;
    this.analysisStatus = bloodworkData.analysisStatus || 'pending'; // pending, analyzed, error
    this.aiAnalysis = bloodworkData.aiAnalysis || null;
    this.deficiencies = bloodworkData.deficiencies || [];
    this.recommendations = bloodworkData.recommendations || [];
    this.flaggedValues = bloodworkData.flaggedValues || [];
    this.createdAt = bloodworkData.createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  // Save bloodwork to database
  async save() {
    await ensureDataDir();
    
    let bloodworks = [];
    try {
      const data = await fs.readFile(BLOODWORK_FILE, 'utf8');
      bloodworks = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, start with empty array
    }

    const existingIndex = bloodworks.findIndex(b => b.id === this.id);
    if (existingIndex >= 0) {
      bloodworks[existingIndex] = this;
    } else {
      bloodworks.push(this);
    }

    await fs.writeFile(BLOODWORK_FILE, JSON.stringify(bloodworks, null, 2));
    return this;
  }

  // Find bloodwork by user ID
  static async findByUserId(userId) {
    await ensureDataDir();
    
    try {
      const data = await fs.readFile(BLOODWORK_FILE, 'utf8');
      const bloodworks = JSON.parse(data);
      return bloodworks.filter(b => b.userId === userId);
    } catch (error) {
      return [];
    }
  }

  // Find bloodwork by ID
  static async findById(id) {
    await ensureDataDir();
    
    try {
      const data = await fs.readFile(BLOODWORK_FILE, 'utf8');
      const bloodworks = JSON.parse(data);
      return bloodworks.find(b => b.id === id);
    } catch (error) {
      return null;
    }
  }

  // Analyze blood work results
  analyzeResults() {
    const analysis = {
      deficiencies: [],
      excesses: [],
      recommendations: [],
      flaggedValues: []
    };

    // Define normal ranges for common blood markers
    const normalRanges = {
      'vitamin_d': { min: 30, max: 100, unit: 'ng/mL' },
      'b12': { min: 300, max: 900, unit: 'pg/mL' },
      'iron': { min: 65, max: 175, unit: 'μg/dL' },
      'ferritin': { min: 15, max: 300, unit: 'ng/mL' },
      'folate': { min: 3, max: 20, unit: 'ng/mL' },
      'magnesium': { min: 1.7, max: 2.2, unit: 'mg/dL' },
      'zinc': { min: 70, max: 120, unit: 'μg/dL' },
      'total_cholesterol': { min: 125, max: 200, unit: 'mg/dL' },
      'ldl_cholesterol': { min: 0, max: 100, unit: 'mg/dL' },
      'hdl_cholesterol': { min: 40, max: 999, unit: 'mg/dL' },
      'triglycerides': { min: 0, max: 150, unit: 'mg/dL' },
      'glucose': { min: 70, max: 99, unit: 'mg/dL' },
      'hemoglobin': { min: 12, max: 16, unit: 'g/dL' },
      'hematocrit': { min: 36, max: 48, unit: '%' },
      'tsh': { min: 0.4, max: 4.0, unit: 'mIU/L' },
      'creatinine': { min: 0.6, max: 1.2, unit: 'mg/dL' }
    };

    // Analyze each result
    for (const [marker, value] of Object.entries(this.results)) {
      const normalRange = normalRanges[marker.toLowerCase()];
      if (normalRange && typeof value === 'number') {
        if (value < normalRange.min) {
          analysis.deficiencies.push({
            marker,
            value,
            normalRange,
            severity: this.calculateSeverity(value, normalRange, 'low')
          });
        } else if (value > normalRange.max) {
          analysis.excesses.push({
            marker,
            value,
            normalRange,
            severity: this.calculateSeverity(value, normalRange, 'high')
          });
        }
      }
    }

    // Generate recommendations based on deficiencies
    analysis.recommendations = this.generateRecommendations(analysis.deficiencies, analysis.excesses);
    
    this.aiAnalysis = analysis;
    this.deficiencies = analysis.deficiencies;
    this.recommendations = analysis.recommendations;
    this.flaggedValues = [...analysis.deficiencies, ...analysis.excesses];
    this.analysisStatus = 'analyzed';
    
    return analysis;
  }

  calculateSeverity(value, normalRange, type) {
    let deviation;
    if (type === 'low') {
      deviation = (normalRange.min - value) / normalRange.min;
    } else {
      deviation = (value - normalRange.max) / normalRange.max;
    }

    if (deviation > 0.5) return 'severe';
    if (deviation > 0.2) return 'moderate';
    return 'mild';
  }

  generateRecommendations(deficiencies, excesses) {
    const recommendations = [];

    // Supplement recommendations based on deficiencies
    const supplementMap = {
      'vitamin_d': {
        supplements: ['Vitamin D3'],
        dosage: '2000-4000 IU daily',
        duration: '2-3 months, then retest'
      },
      'b12': {
        supplements: ['B-Complex', 'Methylcobalamin B12'],
        dosage: '1000-2000 mcg daily',
        duration: '1-2 months, then retest'
      },
      'iron': {
        supplements: ['Iron Bisglycinate'],
        dosage: '18-25mg daily with Vitamin C',
        duration: '2-3 months, then retest'
      },
      'magnesium': {
        supplements: ['Magnesium Glycinate'],
        dosage: '200-400mg daily',
        duration: 'Ongoing'
      },
      'folate': {
        supplements: ['Methylfolate', 'B-Complex'],
        dosage: '400-800 mcg daily',
        duration: '1-2 months, then retest'
      }
    };

    deficiencies.forEach(deficiency => {
      const marker = deficiency.marker.toLowerCase();
      const supplementInfo = supplementMap[marker];
      
      if (supplementInfo) {
        recommendations.push({
          type: 'supplement',
          marker: deficiency.marker,
          supplements: supplementInfo.supplements,
          dosage: supplementInfo.dosage,
          duration: supplementInfo.duration,
          severity: deficiency.severity,
          priority: deficiency.severity === 'severe' ? 'high' : deficiency.severity === 'moderate' ? 'medium' : 'low'
        });
      }
    });

    // Lifestyle recommendations
    if (deficiencies.some(d => d.marker.toLowerCase() === 'vitamin_d')) {
      recommendations.push({
        type: 'lifestyle',
        category: 'sun_exposure',
        recommendation: 'Increase sun exposure to 15-30 minutes daily when possible',
        priority: 'medium'
      });
    }

    if (excesses.some(e => e.marker.toLowerCase().includes('cholesterol'))) {
      recommendations.push({
        type: 'lifestyle',
        category: 'diet',
        recommendation: 'Consider reducing saturated fats and increasing fiber intake',
        priority: 'high'
      });
    }

    return recommendations;
  }

  // Update analysis status
  static async updateAnalysisStatus(id, status, analysisData = null) {
    await ensureDataDir();
    
    try {
      const data = await fs.readFile(BLOODWORK_FILE, 'utf8');
      const bloodworks = JSON.parse(data);
      const bloodworkIndex = bloodworks.findIndex(b => b.id === id);
      
      if (bloodworkIndex >= 0) {
        bloodworks[bloodworkIndex].analysisStatus = status;
        bloodworks[bloodworkIndex].updatedAt = new Date().toISOString();
        
        if (analysisData) {
          bloodworks[bloodworkIndex].aiAnalysis = analysisData;
        }
        
        await fs.writeFile(BLOODWORK_FILE, JSON.stringify(bloodworks, null, 2));
        return bloodworks[bloodworkIndex];
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}

module.exports = BloodWork;