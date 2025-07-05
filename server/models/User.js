const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

class User {
  constructor(userData) {
    this.id = userData.id || uuidv4();
    this.email = userData.email;
    this.password = userData.password;
    this.firstName = userData.firstName;
    this.lastName = userData.lastName;
    this.dateOfBirth = userData.dateOfBirth;
    this.gender = userData.gender;
    this.height = userData.height;
    this.weight = userData.weight;
    this.activityLevel = userData.activityLevel;
    this.healthGoals = userData.healthGoals || [];
    this.medicalConditions = userData.medicalConditions || [];
    this.allergies = userData.allergies || [];
    this.currentSupplements = userData.currentSupplements || [];
    this.bloodworkHistory = userData.bloodworkHistory || [];
    this.aiRecommendations = userData.aiRecommendations || [];
    this.createdAt = userData.createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  // Hash password before saving
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  // Verify password
  async verifyPassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  // Save user to file
  async save() {
    await ensureDataDir();
    
    let users = [];
    try {
      const data = await fs.readFile(USERS_FILE, 'utf8');
      users = JSON.parse(data);
    } catch (error) {
      // File doesn't exist or is empty, start with empty array
    }

    const existingIndex = users.findIndex(u => u.id === this.id);
    if (existingIndex >= 0) {
      users[existingIndex] = this;
    } else {
      users.push(this);
    }

    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    return this;
  }

  // Find user by email
  static async findByEmail(email) {
    await ensureDataDir();
    
    try {
      const data = await fs.readFile(USERS_FILE, 'utf8');
      const users = JSON.parse(data);
      return users.find(u => u.email === email);
    } catch (error) {
      return null;
    }
  }

  // Find user by ID
  static async findById(id) {
    await ensureDataDir();
    
    try {
      const data = await fs.readFile(USERS_FILE, 'utf8');
      const users = JSON.parse(data);
      return users.find(u => u.id === id);
    } catch (error) {
      return null;
    }
  }

  // Update user
  static async updateById(id, updateData) {
    await ensureDataDir();
    
    try {
      const data = await fs.readFile(USERS_FILE, 'utf8');
      const users = JSON.parse(data);
      const userIndex = users.findIndex(u => u.id === id);
      
      if (userIndex >= 0) {
        users[userIndex] = { ...users[userIndex], ...updateData, updatedAt: new Date().toISOString() };
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
        return users[userIndex];
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Remove sensitive data for API responses
  toSafeObject() {
    const { password, ...safeUser } = this;
    return safeUser;
  }
}

module.exports = User;