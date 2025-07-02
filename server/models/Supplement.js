const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../data');
const SUPPLEMENTS_FILE = path.join(DATA_DIR, 'supplements.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

class Supplement {
  constructor(supplementData) {
    this.id = supplementData.id || uuidv4();
    this.name = supplementData.name;
    this.category = supplementData.category;
    this.description = supplementData.description;
    this.benefits = supplementData.benefits || [];
    this.dosage = supplementData.dosage;
    this.sideEffects = supplementData.sideEffects || [];
    this.interactions = supplementData.interactions || [];
    this.contraindications = supplementData.contraindications || [];
    this.targetConditions = supplementData.targetConditions || [];
    this.nutrients = supplementData.nutrients || [];
    this.evidenceLevel = supplementData.evidenceLevel; // high, medium, low
    this.recommendedFor = supplementData.recommendedFor || []; // demographic groups
    this.notRecommendedFor = supplementData.notRecommendedFor || [];
    this.createdAt = supplementData.createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  // Save supplement to database
  async save() {
    await ensureDataDir();
    
    let supplements = [];
    try {
      const data = await fs.readFile(SUPPLEMENTS_FILE, 'utf8');
      supplements = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, start with empty array
    }

    const existingIndex = supplements.findIndex(s => s.id === this.id);
    if (existingIndex >= 0) {
      supplements[existingIndex] = this;
    } else {
      supplements.push(this);
    }

    await fs.writeFile(SUPPLEMENTS_FILE, JSON.stringify(supplements, null, 2));
    return this;
  }

  // Get all supplements
  static async getAll() {
    await ensureDataDir();
    
    try {
      const data = await fs.readFile(SUPPLEMENTS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  // Find supplement by ID
  static async findById(id) {
    const supplements = await this.getAll();
    return supplements.find(s => s.id === id);
  }

  // Search supplements by criteria
  static async search(criteria) {
    const supplements = await this.getAll();
    
    return supplements.filter(supplement => {
      let matches = true;
      
      if (criteria.category) {
        matches = matches && supplement.category.toLowerCase().includes(criteria.category.toLowerCase());
      }
      
      if (criteria.targetConditions) {
        matches = matches && supplement.targetConditions.some(condition => 
          criteria.targetConditions.includes(condition)
        );
      }
      
      if (criteria.nutrients) {
        matches = matches && supplement.nutrients.some(nutrient => 
          criteria.nutrients.includes(nutrient)
        );
      }
      
      if (criteria.name) {
        matches = matches && supplement.name.toLowerCase().includes(criteria.name.toLowerCase());
      }
      
      return matches;
    });
  }

  // Initialize with default supplement data
  static async initializeDefaults() {
    const supplements = await this.getAll();
    if (supplements.length === 0) {
      const defaultSupplements = [
        {
          name: "Vitamin D3",
          category: "Vitamins",
          description: "Essential vitamin for bone health, immune function, and mood regulation",
          benefits: ["Bone health", "Immune support", "Mood regulation", "Muscle function"],
          dosage: "1000-4000 IU daily",
          sideEffects: ["Nausea", "Kidney stones (high doses)"],
          interactions: ["Thiazide diuretics", "Steroids"],
          contraindications: ["Hypercalcemia", "Kidney disease"],
          targetConditions: ["Vitamin D deficiency", "Osteoporosis", "Depression", "Autoimmune conditions"],
          nutrients: ["Vitamin D"],
          evidenceLevel: "high",
          recommendedFor: ["Adults", "Elderly", "People with limited sun exposure"],
          notRecommendedFor: ["Hypercalcemia patients"]
        },
        {
          name: "Omega-3 Fish Oil",
          category: "Essential Fatty Acids",
          description: "EPA and DHA for cardiovascular and brain health",
          benefits: ["Heart health", "Brain function", "Anti-inflammatory", "Eye health"],
          dosage: "1-3g daily",
          sideEffects: ["Fishy burps", "Upset stomach", "Blood thinning"],
          interactions: ["Anticoagulants", "Blood pressure medications"],
          contraindications: ["Fish allergies", "Bleeding disorders"],
          targetConditions: ["High cholesterol", "Heart disease", "Depression", "ADHD"],
          nutrients: ["EPA", "DHA"],
          evidenceLevel: "high",
          recommendedFor: ["Adults", "Elderly", "Athletes"],
          notRecommendedFor: ["Fish allergy", "Bleeding disorders"]
        },
        {
          name: "Magnesium Glycinate",
          category: "Minerals",
          description: "Highly bioavailable form of magnesium for muscle and nerve function",
          benefits: ["Muscle relaxation", "Sleep quality", "Stress reduction", "Heart health"],
          dosage: "200-400mg daily",
          sideEffects: ["Diarrhea (high doses)", "Nausea"],
          interactions: ["Antibiotics", "Diuretics"],
          contraindications: ["Kidney disease", "Heart blocks"],
          targetConditions: ["Magnesium deficiency", "Insomnia", "Anxiety", "Muscle cramps"],
          nutrients: ["Magnesium"],
          evidenceLevel: "high",
          recommendedFor: ["Adults", "Athletes", "Stress-prone individuals"],
          notRecommendedFor: ["Kidney disease", "Heart blocks"]
        },
        {
          name: "Probiotics Multi-Strain",
          category: "Digestive Health",
          description: "Beneficial bacteria for gut health and immune function",
          benefits: ["Digestive health", "Immune support", "Mental health", "Antibiotic recovery"],
          dosage: "10-50 billion CFU daily",
          sideEffects: ["Bloating", "Gas", "Upset stomach"],
          interactions: ["Antibiotics", "Immunosuppressants"],
          contraindications: ["Severe immunodeficiency", "Central venous catheter"],
          targetConditions: ["IBS", "Digestive issues", "Antibiotic-associated diarrhea", "Immune weakness"],
          nutrients: ["Lactobacillus", "Bifidobacterium"],
          evidenceLevel: "medium",
          recommendedFor: ["Adults", "Post-antibiotic treatment", "Digestive issues"],
          notRecommendedFor: ["Severe immunodeficiency", "Critical illness"]
        },
        {
          name: "B-Complex",
          category: "Vitamins",
          description: "Complete B-vitamin complex for energy and nervous system support",
          benefits: ["Energy production", "Nervous system health", "Mood support", "Metabolism"],
          dosage: "1 capsule daily",
          sideEffects: ["Bright yellow urine", "Nausea", "Headache"],
          interactions: ["Levodopa", "Phenytoin"],
          contraindications: ["B12 deficiency with unknown cause"],
          targetConditions: ["Fatigue", "Stress", "Poor concentration", "B-vitamin deficiency"],
          nutrients: ["B1", "B2", "B3", "B5", "B6", "B7", "B9", "B12"],
          evidenceLevel: "high",
          recommendedFor: ["Adults", "Vegetarians", "High-stress individuals"],
          notRecommendedFor: ["Specific B-vitamin allergies"]
        }
      ];

      for (const supplementData of defaultSupplements) {
        const supplement = new Supplement(supplementData);
        await supplement.save();
      }
    }
  }
}

module.exports = Supplement;