# RadiAI Bharat - System Design Document

## 1. System Overview

RadiAI Bharat is an AI-powered fracture detection system designed to assist radiologists in analyzing X-ray images. The system combines computer vision models with a user-friendly web interface to provide automated fracture detection, segmentation, and classification capabilities.

### Key Features
- **Automated Fracture Detection**: YOLO-based object detection for fracture localization
- **Precise Segmentation**: UNet model for detailed fracture boundary identification
- **Classification**: CNN model for fracture type and severity assessment
- **Radiologist Dashboard**: Professional interface for review and validation
- **Report Generation**: Automated medical report creation with AI findings

## 2. High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │   Backend API   │    │   AI Pipeline   │
│   (React+Vite)  │◄──►│    (FastAPI)    │◄──►│  YOLO+UNet+CNN  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Database     │    │  File Storage   │    │  Model Storage  │
│  (PostgreSQL)   │    │   (S3/Local)    │    │   (S3/Local)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Overview
- **Frontend**: React-based web application with modern UI/UX
- **Backend**: FastAPI server handling business logic and API endpoints
- **AI Pipeline**: Three-stage ML pipeline for comprehensive fracture analysis
- **Database**: PostgreSQL for user data, cases, and reports
- **Storage**: Cloud/local storage for X-ray images and AI models

## 3. Data Flow Diagram

```
1. X-ray Upload
   User → Frontend → Backend → File Storage

2. AI Processing
   Backend → AI Pipeline → YOLO Detection → UNet Segmentation → CNN Classification

3. Results Storage
   AI Results → Backend → Database → Report Generation

4. Radiologist Review
   Database → Backend → Frontend → Radiologist Dashboard

5. Final Report
   Validated Results → Report Generator → PDF/Digital Report
```

### Detailed Flow Explanation

1. **Upload Phase**
   - User uploads X-ray image through web interface
   - Frontend validates file format and size
   - Backend stores image in file storage and creates database record

2. **AI Processing Phase**
   - Backend triggers AI pipeline with image path
   - YOLO model detects and localizes potential fractures
   - UNet model segments fracture regions for precise boundaries
   - CNN model classifies fracture type and severity
   - Results aggregated and confidence scores calculated

3. **Review Phase**
   - AI results displayed in radiologist dashboard
   - Radiologist can accept, modify, or reject AI findings
   - Manual annotations and notes can be added

4. **Report Generation**
   - Final validated results compiled into medical report
   - PDF generated with images, findings, and radiologist notes
   - Report stored and made available for download

## 4. AI Model Architecture

### 4.1 YOLO for Fracture Detection

**Purpose**: Localize fractures in X-ray images with bounding boxes

```python
# Model Architecture
YOLOv8n/s/m architecture:
- Backbone: CSPDarknet53
- Neck: PANet (Path Aggregation Network)
- Head: Detection head with anchor-free approach

Input: 640x640 RGB images (X-rays converted to 3-channel)
Output: Bounding boxes [x, y, w, h], confidence scores, class labels

Classes:
- fracture_simple
- fracture_complex  
- fracture_comminuted
- no_fracture
```

**Training Strategy**:
- Dataset: 10,000+ annotated X-ray images
- Augmentation: Rotation, scaling, brightness adjustment
- Loss: Combined classification + localization loss
- Metrics: mAP@0.5, mAP@0.5:0.95

### 4.2 UNet for Fracture Segmentation

**Purpose**: Provide pixel-level segmentation of fracture regions

```python
# UNet Architecture
Encoder (Downsampling):
- Conv2D + BatchNorm + ReLU blocks
- MaxPooling for downsampling
- Skip connections preserved

Decoder (Upsampling):
- Transpose convolutions for upsampling
- Concatenation with encoder features
- Final sigmoid activation for binary masks

Input: 512x512 grayscale images
Output: 512x512 binary masks (fracture regions)
```

**Training Strategy**:
- Dataset: Pixel-level annotated fracture masks
- Loss: Dice loss + Binary Cross-Entropy
- Metrics: Dice coefficient, IoU, pixel accuracy

### 4.3 CNN for Fracture Classification

**Purpose**: Classify fracture severity and type

```python
# CNN Architecture
Base: ResNet50 or EfficientNet-B0
- Pre-trained on ImageNet
- Custom classification head
- Dropout for regularization

Input: 224x224 images (cropped fracture regions from YOLO)
Output: Multi-class probabilities

Classes:
- Severity: [mild, moderate, severe]
- Type: [transverse, oblique, spiral, comminuted]
- Healing: [acute, healing, healed]
```

**Training Strategy**:
- Transfer learning from ImageNet
- Fine-tuning on medical data
- Class balancing with weighted loss
- Metrics: Accuracy, F1-score, AUC-ROC

## 5. API Design

### 5.1 Core Endpoints

```python
# Authentication
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh

# User Management
GET  /api/users/profile
PUT  /api/users/profile
POST /api/users/register

# Case Management
POST /api/cases/upload          # Upload X-ray image
GET  /api/cases/                # List user's cases
GET  /api/cases/{case_id}       # Get specific case
PUT  /api/cases/{case_id}       # Update case (radiologist review)
DELETE /api/cases/{case_id}     # Delete case

# AI Processing
POST /api/ai/analyze/{case_id}  # Trigger AI analysis
GET  /api/ai/results/{case_id}  # Get AI results

# Reports
GET  /api/reports/{case_id}     # Get report data
GET  /api/reports/{case_id}/pdf # Download PDF report

# Admin
GET  /api/admin/stats           # System statistics
GET  /api/admin/users           # User management
```

### 5.2 Request/Response Examples

```json
// POST /api/cases/upload
{
  "patient_name": "John Doe",
  "patient_age": 45,
  "body_part": "left_wrist",
  "clinical_notes": "Patient fell from bicycle"
}

// Response
{
  "case_id": "uuid-123",
  "status": "uploaded",
  "image_url": "/storage/cases/uuid-123/xray.jpg",
  "created_at": "2024-01-15T10:30:00Z"
}

// GET /api/ai/results/{case_id}
{
  "case_id": "uuid-123",
  "status": "completed",
  "detections": [
    {
      "bbox": [100, 150, 200, 180],
      "confidence": 0.92,
      "class": "fracture_simple"
    }
  ],
  "segmentation_mask": "/storage/masks/uuid-123.png",
  "classification": {
    "severity": "moderate",
    "type": "transverse",
    "confidence": 0.87
  },
  "processing_time": 12.5
}
```

## 6. Database Schema

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'radiologist', 'technician', 'admin'
    license_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Cases table
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    patient_name VARCHAR(255) NOT NULL,
    patient_age INTEGER,
    body_part VARCHAR(100),
    clinical_notes TEXT,
    image_path VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'uploaded', -- 'uploaded', 'processing', 'completed', 'reviewed'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Results table
CREATE TABLE ai_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id),
    detections JSONB, -- YOLO detection results
    segmentation_path VARCHAR(500), -- UNet mask path
    classification JSONB, -- CNN classification results
    confidence_score FLOAT,
    processing_time FLOAT,
    model_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id),
    radiologist_id UUID REFERENCES users(id),
    ai_findings TEXT,
    radiologist_notes TEXT,
    final_diagnosis TEXT,
    report_status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'approved', 'rejected'
    pdf_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP
);
```

## 7. Security Design

### 7.1 Authentication & Authorization

```python
# JWT-based authentication
- Access tokens (15 minutes expiry)
- Refresh tokens (7 days expiry)
- Role-based access control (RBAC)

# Password Security
- bcrypt hashing with salt
- Minimum 8 characters, complexity requirements
- Account lockout after 5 failed attempts

# API Security
- Rate limiting (100 requests/minute per user)
- CORS configuration for frontend domain
- Input validation and sanitization
- SQL injection prevention with parameterized queries
```

### 7.2 Data Protection

```python
# File Security
- Secure file upload with type validation
- Virus scanning for uploaded files
- Encrypted storage for sensitive data
- Access logs for all file operations

# Privacy
- Patient data anonymization options
- GDPR compliance for data deletion
- Audit trails for all data access
- Secure data transmission (HTTPS only)
```

### 7.3 Access Control Matrix

| Role | Upload Cases | View Own Cases | View All Cases | AI Analysis | Generate Reports | Admin Functions |
|------|-------------|----------------|----------------|-------------|------------------|-----------------|
| Technician | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| Radiologist | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## 8. Deployment Design

### 8.1 Local Development

```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - VITE_API_URL=http://localhost:8000
  
  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/radiai
      - REDIS_URL=redis://redis:6379
    depends_on: [db, redis]
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=radiai
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes: ["postgres_data:/var/lib/postgresql/data"]
  
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

### 8.2 Cloud Deployment (AWS)

```yaml
# Infrastructure Components
- ECS Fargate: Container orchestration
- RDS PostgreSQL: Managed database
- S3: File storage for images and models
- CloudFront: CDN for static assets
- ALB: Application Load Balancer
- ElastiCache: Redis for caching
- ECR: Container registry

# Deployment Pipeline
GitHub → GitHub Actions → Docker Build → ECR Push → ECS Deploy
```

### 8.3 Environment Configuration

```python
# Production Environment Variables
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/radiai
REDIS_URL=redis://elasticache-endpoint:6379
S3_BUCKET=radiai-storage-prod
AWS_REGION=us-east-1
JWT_SECRET_KEY=secure-random-key
CORS_ORIGINS=https://radiai.example.com
LOG_LEVEL=INFO
```

## 9. Scalability Design

### 9.1 Horizontal Scaling

```python
# Application Scaling
- Stateless backend services (multiple instances)
- Load balancer distribution
- Database connection pooling
- Redis for session storage

# AI Model Scaling
- GPU instances for model inference
- Model caching in memory
- Batch processing for multiple images
- Queue system for AI processing jobs
```

### 9.2 Performance Optimization

```python
# Database Optimization
- Indexing on frequently queried columns
- Read replicas for reporting queries
- Connection pooling (PgBouncer)
- Query optimization and caching

# File Storage Optimization
- CDN for image delivery
- Image compression and resizing
- Lazy loading in frontend
- Presigned URLs for direct S3 access

# Caching Strategy
- Redis for API response caching
- Browser caching for static assets
- Model result caching
- Database query result caching
```

### 9.3 Monitoring & Observability

```python
# Application Monitoring
- Prometheus metrics collection
- Grafana dashboards
- ELK stack for logging
- Health check endpoints

# AI Model Monitoring
- Model performance metrics
- Inference time tracking
- Accuracy monitoring
- Model drift detection

# Business Metrics
- Cases processed per day
- Average processing time
- User engagement metrics
- Error rates and types
```

## 10. Future Improvements

### 10.1 Short-term Enhancements (3-6 months)

- **Multi-modal AI**: Combine X-ray with patient history and symptoms
- **Real-time Collaboration**: Multiple radiologists reviewing same case
- **Mobile App**: Native iOS/Android applications
- **Advanced Reporting**: Customizable report templates
- **Integration APIs**: PACS and EMR system integration

### 10.2 Medium-term Features (6-12 months)

- **3D Visualization**: CT scan support and 3D fracture modeling
- **Predictive Analytics**: Healing timeline prediction
- **Federated Learning**: Privacy-preserving model training across hospitals
- **Voice Interface**: Voice-to-text for radiologist notes
- **Automated Measurements**: Fracture displacement and angulation metrics

### 10.3 Long-term Vision (1-2 years)

- **Multi-organ Support**: Expand beyond fractures to other conditions
- **AR/VR Integration**: Immersive 3D fracture visualization
- **AI-powered Surgical Planning**: Treatment recommendation system
- **Research Platform**: Anonymized data for medical research
- **Global Deployment**: Multi-language, multi-region support

## 11. Technical Specifications

### 11.1 System Requirements

```python
# Minimum Hardware Requirements
- CPU: 4 cores, 2.5GHz
- RAM: 16GB
- Storage: 500GB SSD
- GPU: NVIDIA GTX 1060 or equivalent (for AI inference)

# Recommended Production Setup
- CPU: 8+ cores, 3.0GHz
- RAM: 32GB+
- Storage: 1TB+ NVMe SSD
- GPU: NVIDIA RTX 3080 or equivalent
- Network: 1Gbps connection
```

### 11.2 Technology Stack Summary

```python
# Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Query for state management
- Axios for API calls

# Backend
- Python 3.11+
- FastAPI framework
- SQLAlchemy ORM
- Alembic for migrations
- Celery for background tasks

# AI/ML
- PyTorch 2.0+
- Ultralytics YOLOv8
- Segmentation Models (UNet)
- OpenCV for image processing
- NumPy, Pandas for data handling

# Infrastructure
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose
- AWS/GCP/Azure cloud services
- Nginx for reverse proxy
```

This design document provides a comprehensive technical blueprint for RadiAI Bharat, suitable for hackathon judges and development teams to understand the system architecture, implementation approach, and future roadmap.