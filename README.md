# AI-Enhanced SaaS CRM for Service Companies

A comprehensive Customer Relationship Management system designed specifically for service-based businesses, featuring AI-powered automation, SMS/chat capabilities, field service management, and customer portal functionality.

## 🌐 Live Demo
**🚀 Project is live at: [http://storm-ai.decodersdigital.net/](http://storm-ai.decodersdigital.net/)**

*Experience the full functionality of our AI-enhanced CRM system in action.*

## 🚀 Features

### Core CRM Features
- **Contact & Lead Management** - Complete contact database with lead tracking and pipeline visualization
- **Job Scheduling & Management** - Advanced scheduling with route optimization and GPS tracking
- **Estimates & Invoicing** - Professional estimate builder and invoice generation system
- **Field Service Management** - Technician management, mobile workflows, and real-time GPS tracking
- **Analytics & Reporting** - Comprehensive dashboard with business intelligence and performance metrics

### AI-Powered Automation
- **Conversational AI Assistant** - Twilio-powered SMS bot for customer interactions
- **Lead Scoring & Qualification** - Automated lead qualification using machine learning
- **Smart Campaign Management** - AI-driven SMS and email campaigns
- **Predictive Analytics** - Churn prediction, demand forecasting, and revenue insights
- **Route Optimization** - AI-powered route planning for field technicians

### Customer Experience
- **Customer Portal** - Self-service dashboard for customers to view service history and make payments
- **Web Chat Integration** - AI chatbot for website integration
- **SMS Automation** - Two-way SMS communication with intelligent responses
- **Payment Processing** - Integrated payment solutions with Stripe

### Integrations
- **Twilio** - SMS messaging and voice communications
- **Stripe** - Payment processing and recurring billing
- **QuickBooks** - Financial data synchronization
- **Google Calendar** - Appointment and schedule sync
- **Email Services** - Automated email campaigns and notifications

## 🏗️ Architecture

### Backend (FastAPI + MongoDB)
```
backend/
├── app/
│   ├── api/v1/endpoints/          # API endpoints
│   ├── core/                     # Configuration and security
│   ├── models/                   # Database models
│   ├── schemas/                  # Pydantic schemas
│   ├── services/                 # Business logic
│   ├── middleware/               # Request middleware
│   └── dependencies/             # Dependency injection
```

### Frontend (React + TypeScript + Vite)
```
frontend/
├── src/
│   ├── components/               # Reusable UI components
│   ├── Pages/                    # Application pages
│   ├── services/                 # API service layer
│   ├── store/                    # State management
│   └── styles/                   # Styling and themes
```

## 🛠️ Technology Stack

### Backend Technologies
- **FastAPI** - High-performance Python web framework
- **MongoDB** - NoSQL database with Motor async driver
- **Redis** - Caching and background task queue
- **OpenAI/Anthropic APIs** - AI conversation and analysis
- **Twilio API** - SMS and voice communications
- **Stripe API** - Payment processing
- **Pydantic** - Data validation and serialization
- **JWT** - Authentication and authorization

### Frontend Technologies
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe JavaScript development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Server state management
- **React Router** - Client-side routing
- **Zustand** - Lightweight state management

### Development Tools
- **Docker** - Containerization
- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **Pytest** - Python testing framework
- **Sentry** - Error monitoring

## 📋 Prerequisites

- **Python 3.9+**
- **Node.js 18+**
- **MongoDB 5.0+**
- **Redis 6.0+**
- **Docker** (optional)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd crm-project
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your configuration
```

### 4. Environment Configuration

Create `.env` files with the following variables:

#### Backend (.env)
```env
# Database
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=crm_db
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Twilio (SMS/Voice)
TWILIO_ACCOUNT_SID=ACxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Stripe (Payments)
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Email
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_SMS_AUTOMATION=true
ENABLE_EMAIL_AUTOMATION=true
ENABLE_INTEGRATIONS=true
ENABLE_ANALYTICS=true
```

#### Frontend (.env.local)
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_TWILIO_PHONE_NUMBER=+1234567890
```

### 5. Database Setup
```bash
# Start MongoDB and Redis
# For local development, you can use Docker:
docker run -d -p 27017:27017 --name mongodb mongo:5.0
docker run -d -p 6379:6379 --name redis redis:6-alpine

# Run database migrations (if any)
cd backend
python -m app.db.init_db
```

### 6. Start Development Servers

#### Backend
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend
```bash
cd frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📱 Usage

### For Service Company Staff
1. **Dashboard** - View business metrics and recent activity
2. **CRM** - Manage contacts, leads, and sales pipeline
3. **Scheduling** - Schedule jobs and optimize technician routes
4. **Field Service** - Track technicians and manage work orders
5. **Estimates & Invoicing** - Create professional estimates and invoices
6. **AI Automation** - Set up automated workflows and campaigns

### For Customers
1. **Customer Portal** - View service history and upcoming appointments
2. **Payment Portal** - Make payments online
3. **SMS Communication** - Chat with AI assistant via SMS
4. **Web Chat** - Get instant support through the website

### AI Assistant Capabilities
- **Lead Qualification** - Automatically qualify incoming leads via SMS
- **Appointment Scheduling** - Help customers book appointments
- **Service Information** - Provide information about services
- **Payment Reminders** - Send automated payment reminders
- **Follow-up Messages** - Nurture leads with personalized follow-ups

## 🔧 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Refresh access token

### CRM
- `GET /api/v1/contacts` - List contacts
- `POST /api/v1/contacts` - Create contact
- `GET /api/v1/leads` - List leads
- `POST /api/v1/leads` - Create lead

### AI Assistant
- `POST /api/v1/ai/webhooks/twilio` - Twilio SMS webhook
- `POST /api/v1/ai/chat` - Web chat endpoint
- `GET /api/v1/ai/conversations` - Get conversation history

### Scheduling
- `GET /api/v1/jobs` - List jobs
- `POST /api/v1/jobs` - Create job
- `POST /api/v1/scheduling/optimize-routes` - Route optimization

### Customer Portal
- `GET /api/v1/customer-portal/dashboard` - Customer dashboard data
- `GET /api/v1/customer-portal/service-history` - Service history
- `POST /api/v1/customer-portal/payments` - Process payment

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 🚀 Deployment

### Using Docker
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build individual services
docker build -t crm-backend ./backend
docker build -t crm-frontend ./frontend
```

### Production Environment
1. Set up production database (MongoDB Atlas recommended)
2. Configure Redis instance
3. Set up SSL certificates
4. Configure environment variables for production
5. Deploy to your preferred hosting platform (AWS, GCP, Azure, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the [API documentation](http://localhost:8000/docs)
- Review the troubleshooting guide in the `docs/` folder

## 🔮 Roadmap

### Upcoming Features
- [ ] Mobile app for field technicians
- [ ] Advanced analytics with custom reports
- [ ] Multi-language support
- [ ] Advanced AI workflows with custom triggers
- [ ] Integration marketplace
- [ ] White-label solutions
- [ ] Advanced permission system
- [ ] Audit logging
- [ ] Advanced scheduling algorithms
- [ ] IoT device integration

### Version History
- **v1.0.0** - Initial release with core CRM features
- **v1.1.0** - AI assistant and SMS automation
- **v1.2.0** - Customer portal and payment integration
- **v1.3.0** - Advanced analytics and reporting
- **v1.4.0** - Route optimization and GPS tracking

---

**Built with ❤️ for service companies who want to leverage AI to grow their business.**
