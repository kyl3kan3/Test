# HealthAI - Personalized Supplement Recommendations

A comprehensive health application that provides AI-powered personalized supplement recommendations based on user health profiles and blood work analysis.

## 🌟 Features

### Core Functionality
- **AI-Powered Recommendations**: Get personalized supplement suggestions based on your health profile, goals, and blood work results
- **Blood Work Analysis**: Upload lab results (PDF, Word, images) for automated analysis and nutrient deficiency detection
- **Supplement Database**: Comprehensive database of supplements with detailed information on benefits, interactions, and dosages
- **Health Dashboard**: Track your health score, recommendations progress, and key metrics
- **Interactive Chat**: Ask health-related questions and get personalized AI responses

### Key Features
- **User Profiles**: Complete health profiles including demographics, medical conditions, allergies, and health goals
- **Blood Work Management**: Upload, analyze, and track blood work results over time
- **Trend Analysis**: View trends in blood markers and health metrics
- **Interaction Checker**: Check for supplement-supplement and supplement-medication interactions
- **Educational Content**: Personalized educational content about supplements and health
- **Progress Tracking**: Monitor recommendation adherence and health improvements

## 🏗️ Architecture

### Backend (Node.js/Express)
- **API Server**: RESTful API with comprehensive endpoints
- **AI Integration**: OpenAI GPT integration for recommendations and analysis
- **File Processing**: PDF and document parsing for blood work extraction
- **Data Models**: User, Supplement, BloodWork models with JSON file storage
- **Authentication**: JWT-based authentication with secure password hashing

### Frontend (React)
- **Modern UI**: Built with Chakra UI for beautiful, responsive design
- **State Management**: React Context for authentication and global state
- **Data Fetching**: React Query for efficient API calls and caching
- **Routing**: React Router for seamless navigation
- **File Uploads**: Drag-and-drop file upload interface

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd health-supplement-ai-app
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Environment Setup**
   ```bash
   # Copy environment file
   cp server/.env.example server/.env
   
   # Edit server/.env and add your configuration:
   PORT=5000
   JWT_SECRET=your-super-secret-jwt-key
   OPENAI_API_KEY=your-openai-api-key
   CLIENT_URL=http://localhost:3000
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

   This will start both the server (port 5000) and client (port 3000).

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### User Endpoints
- `GET /api/users/dashboard` - Get dashboard data
- `GET /api/users/timeline` - Get health timeline
- `PUT /api/users/recommendations/:id/status` - Update recommendation status

### Supplement Endpoints
- `GET /api/supplements` - Get all supplements
- `GET /api/supplements/:id` - Get supplement by ID
- `POST /api/supplements/search` - Search supplements
- `GET /api/supplements/meta/categories` - Get categories
- `POST /api/supplements/check-interactions` - Check interactions

### Blood Work Endpoints
- `POST /api/bloodwork/upload` - Upload blood work file
- `POST /api/bloodwork/manual` - Add manual blood work results
- `GET /api/bloodwork` - Get user's blood work history
- `GET /api/bloodwork/:id` - Get specific blood work
- `POST /api/bloodwork/:id/analyze` - Analyze blood work

### AI Endpoints
- `POST /api/ai/recommendations` - Generate recommendations
- `GET /api/ai/recommendations` - Get current recommendations
- `POST /api/ai/chat` - Chat with AI
- `POST /api/ai/education` - Get educational content
- `GET /api/ai/insights` - Get AI insights

## 🔧 Configuration

### Environment Variables

#### Server (.env)
```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Client Configuration
CLIENT_URL=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,jpeg,png,txt
```

#### Client (.env.local)
```bash
REACT_APP_API_URL=http://localhost:5000/api
```

## 📊 Data Models

### User Model
```javascript
{
  id: string,
  email: string,
  firstName: string,
  lastName: string,
  dateOfBirth: string,
  gender: string,
  height: number,
  weight: number,
  activityLevel: string,
  healthGoals: array,
  medicalConditions: array,
  allergies: array,
  currentSupplements: array,
  aiRecommendations: array
}
```

### Blood Work Model
```javascript
{
  id: string,
  userId: string,
  testDate: string,
  testType: string,
  results: object,
  deficiencies: array,
  recommendations: array,
  analysisStatus: string
}
```

### Supplement Model
```javascript
{
  id: string,
  name: string,
  category: string,
  description: string,
  benefits: array,
  dosage: string,
  interactions: array,
  targetConditions: array,
  evidenceLevel: string
}
```

## 🎯 Usage Guide

### Getting Started
1. **Create Account**: Register with email and basic information
2. **Complete Profile**: Add health goals, medical conditions, and current supplements
3. **Upload Blood Work**: Upload recent lab results for analysis
4. **Get Recommendations**: Generate AI-powered supplement recommendations
5. **Track Progress**: Monitor your health score and recommendation adherence

### Key Workflows

#### Blood Work Analysis
1. Navigate to Blood Work section
2. Upload lab results (PDF/Word/Image)
3. Wait for automatic extraction and analysis
4. Review flagged values and recommendations
5. Generate AI analysis for detailed insights

#### Supplement Recommendations
1. Ensure profile is complete
2. Upload recent blood work (optional but recommended)
3. Navigate to Recommendations
4. Click "Generate New Recommendations"
5. Review AI-generated suggestions
6. Mark recommendations as started/completed

#### Health Dashboard
- View overall health score
- Monitor recent blood work results
- Track recommendation progress
- View timeline of health events

## 🛠️ Development

### Project Structure
```
health-supplement-ai-app/
├── server/                 # Backend API
│   ├── models/            # Data models
│   │   ├── models/        # Data models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   └── data/          # JSON data storage
│   ├── client/            # Frontend React app
│   │   ├── src/
│   │   │   ├── components/    # React components
│   │   │   ├── pages/         # Page components
│   │   │   ├── contexts/      # React contexts
│   │   │   ├── services/      # API services
│   │   │   └── utils/         # Utility functions
│   └── package.json       # Root package file
```

### Available Scripts

#### Root Level
- `npm run dev` - Start both server and client
- `npm run install:all` - Install all dependencies
- `npm run build` - Build client for production

#### Server
- `npm run server:dev` - Start server in development
- `npm start` - Start server in production

#### Client
- `npm run client:dev` - Start client in development
- `npm run build` - Build client
- `npm test` - Run tests

### Adding New Features

1. **Backend**: Add routes in `server/routes/`, models in `server/models/`
2. **Frontend**: Add components in `client/src/components/`, pages in `client/src/pages/`
3. **API Integration**: Update `client/src/services/apiService.js`

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- File upload restrictions
- CORS configuration
- Rate limiting (can be added)

## 📈 Performance

- React Query for efficient data fetching
- Lazy loading of components
- Optimized bundle size
- Image optimization
- API response caching

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Use strong JWT secret
- Configure proper CORS origins
- Set up proper database (PostgreSQL/MongoDB)
- Configure file storage (AWS S3)

### Recommended Hosting
- **Backend**: Heroku, Railway, or AWS
- **Frontend**: Vercel, Netlify, or AWS S3
- **Database**: PostgreSQL on Heroku or AWS RDS
- **File Storage**: AWS S3 or Cloudinary

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper tests
4. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed description

## 🎯 Roadmap

### Upcoming Features
- [ ] Mobile app (React Native)
- [ ] Integration with wearable devices
- [ ] Medication tracking
- [ ] Meal planning integration
- [ ] Social features and community
- [ ] Healthcare provider dashboard
- [ ] Advanced analytics and reporting

### Technical Improvements
- [ ] Database migration (PostgreSQL)
- [ ] Redis caching
- [ ] Real-time notifications
- [ ] Advanced AI models
- [ ] API rate limiting
- [ ] Comprehensive testing suite

---

Built with ❤️ for better health outcomes through personalized AI recommendations.
