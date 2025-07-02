const OpenAI = require('openai');
const User = require('../models/User');
const Supplement = require('../models/Supplement');
const BloodWork = require('../models/BloodWork');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateSupplementRecommendations(userId, userInputs = {}) {
    try {
      // Get user data
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user's latest blood work
      const bloodworks = await BloodWork.findByUserId(userId);
      const latestBloodwork = bloodworks.length > 0 ? 
        bloodworks.sort((a, b) => new Date(b.testDate) - new Date(a.testDate))[0] : null;

      // Get all available supplements
      const supplements = await Supplement.getAll();

      // Prepare context for AI
      const context = this.prepareUserContext(user, latestBloodwork, userInputs);

      // Generate AI recommendations
      const aiResponse = await this.callOpenAI(context, supplements);

      // Parse and validate recommendations
      const recommendations = this.parseRecommendations(aiResponse, supplements);

      // Save recommendations to user profile
      await User.updateById(userId, {
        aiRecommendations: recommendations,
        lastRecommendationDate: new Date().toISOString()
      });

      return {
        recommendations,
        context,
        generatedAt: new Date().toISOString(),
        basedOn: {
          hasBloodwork: !!latestBloodwork,
          bloodworkDate: latestBloodwork?.testDate,
          userProfile: true,
          userInputs: Object.keys(userInputs).length > 0
        }
      };

    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error(`Failed to generate recommendations: ${error.message}`);
    }
  }

  prepareUserContext(user, bloodwork, userInputs) {
    const context = {
      demographics: {
        age: user.dateOfBirth ? this.calculateAge(user.dateOfBirth) : null,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        activityLevel: user.activityLevel
      },
      healthProfile: {
        goals: user.healthGoals,
        conditions: user.medicalConditions,
        allergies: user.allergies,
        currentSupplements: user.currentSupplements
      },
      bloodwork: bloodwork ? {
        testDate: bloodwork.testDate,
        deficiencies: bloodwork.deficiencies,
        flaggedValues: bloodwork.flaggedValues,
        recommendations: bloodwork.recommendations
      } : null,
      userInputs: userInputs
    };

    return context;
  }

  async callOpenAI(context, supplements) {
    const systemPrompt = `You are a knowledgeable health and nutrition expert specializing in supplement recommendations. Your role is to provide personalized, evidence-based supplement advice based on user health data, blood work results, and individual needs.

Guidelines:
1. Always prioritize safety and recommend consulting healthcare providers for serious deficiencies
2. Consider interactions between supplements and medications
3. Factor in existing supplements to avoid over-supplementation
4. Provide specific dosage recommendations based on evidence
5. Consider bioavailability and supplement forms
6. Address deficiencies shown in blood work as priority
7. Factor in demographics, activity level, and health goals
8. Recommend retesting timelines where appropriate

Available supplements database includes: ${supplements.map(s => s.name).join(', ')}

Respond with a JSON object containing an array of recommendations, each with:
- supplementName (must match available supplements)
- reasoning (why this supplement is recommended)
- dosage (specific amount and timing)
- duration (how long to take)
- priority (high/medium/low)
- interactions (any warnings)
- monitoring (when to retest or monitor)`;

    const userPrompt = `Please analyze this user's health profile and provide personalized supplement recommendations:

User Context:
${JSON.stringify(context, null, 2)}

Focus on:
1. Address any blood work deficiencies first
2. Support stated health goals
3. Consider current supplements to avoid duplicates
4. Account for medical conditions and allergies
5. Factor in demographics and activity level

Provide evidence-based recommendations with clear reasoning.`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    return response.choices[0].message.content;
  }

  parseRecommendations(aiResponse, supplements) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const recommendations = parsed.recommendations || [];

      // Validate and enrich recommendations
      return recommendations.map(rec => {
        // Find matching supplement in database
        const supplement = supplements.find(s => 
          s.name.toLowerCase() === rec.supplementName.toLowerCase()
        );

        return {
          id: require('uuid').v4(),
          supplementId: supplement?.id,
          supplementName: rec.supplementName,
          supplement: supplement,
          reasoning: rec.reasoning,
          dosage: rec.dosage,
          duration: rec.duration,
          priority: rec.priority || 'medium',
          interactions: rec.interactions || [],
          monitoring: rec.monitoring,
          generatedAt: new Date().toISOString(),
          status: 'pending' // user can mark as taken, ignored, etc.
        };
      }).filter(rec => rec.supplement); // Only include supplements we have in database

    } catch (error) {
      console.error('Error parsing AI recommendations:', error);
      // Return fallback recommendations based on common deficiencies
      return this.getFallbackRecommendations(supplements);
    }
  }

  getFallbackRecommendations(supplements) {
    // Basic recommendations if AI fails
    const basicSupplements = ['Vitamin D3', 'Omega-3 Fish Oil', 'Magnesium Glycinate'];
    
    return basicSupplements.map(name => {
      const supplement = supplements.find(s => s.name === name);
      if (supplement) {
        return {
          id: require('uuid').v4(),
          supplementId: supplement.id,
          supplementName: supplement.name,
          supplement: supplement,
          reasoning: 'Basic health maintenance (AI analysis unavailable)',
          dosage: supplement.dosage,
          duration: 'Ongoing',
          priority: 'medium',
          interactions: supplement.interactions,
          monitoring: 'Regular health check-ups',
          generatedAt: new Date().toISOString(),
          status: 'pending'
        };
      }
    }).filter(Boolean);
  }

  async analyzeBloodworkWithAI(bloodworkId) {
    try {
      const bloodwork = await BloodWork.findById(bloodworkId);
      if (!bloodwork) {
        throw new Error('Blood work not found');
      }

      const user = await User.findById(bloodwork.userId);
      const context = this.prepareUserContext(user, bloodwork, {});

      const systemPrompt = `You are a medical professional analyzing blood work results. Provide detailed analysis of the results, identify deficiencies, excesses, and potential health concerns.

Respond with a JSON object containing:
- summary: Overall health summary
- criticalFindings: Any urgent concerns
- deficiencies: Detailed analysis of low values
- excesses: Analysis of high values
- recommendations: Specific supplement and lifestyle recommendations
- followUp: When to retest and what to monitor`;

      const userPrompt = `Analyze these blood work results:

${JSON.stringify(bloodwork.results, null, 2)}

User demographics: Age ${this.calculateAge(user.dateOfBirth)}, Gender: ${user.gender}
Medical conditions: ${user.medicalConditions.join(', ') || 'None reported'}

Provide comprehensive analysis and recommendations.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 1500
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      
      // Update blood work with AI analysis
      await BloodWork.updateAnalysisStatus(bloodworkId, 'analyzed', analysis);

      return analysis;

    } catch (error) {
      console.error('AI Blood Work Analysis Error:', error);
      await BloodWork.updateAnalysisStatus(bloodworkId, 'error');
      throw new Error(`Failed to analyze blood work: ${error.message}`);
    }
  }

  calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  async getPersonalizedEducation(userId, topic) {
    try {
      const user = await User.findById(userId);
      const context = this.prepareUserContext(user, null, {});

      const systemPrompt = `You are a health educator providing personalized information about supplements and nutrition. Tailor your response to the user's specific profile and needs.`;

      const userPrompt = `Provide educational information about: ${topic}

User context: ${JSON.stringify(context, null, 2)}

Please provide:
1. Basic explanation relevant to this user
2. How it applies to their specific situation
3. Practical tips and recommendations
4. Any precautions based on their profile`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.4,
        max_tokens: 800
      });

      return {
        topic,
        content: response.choices[0].message.content,
        personalizedFor: userId,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('AI Education Error:', error);
      throw new Error(`Failed to generate educational content: ${error.message}`);
    }
  }
}

module.exports = new AIService();