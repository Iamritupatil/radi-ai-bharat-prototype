# RadiAI Bharat 🩻

> AI-powered fracture detection system for radiologists — automated analysis, precise segmentation, and streamlined reporting.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [AI Pipeline](#ai-pipeline)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Security](#security)
- [Deployment](#deployment)
- [Scalability](#scalability)
- [Tech Stack](#tech-stack)
- [System Requirements](#system-requirements)
- [Roadmap](#roadmap)

---

## Overview

RadiAI Bharat combines computer vision models with a professional radiologist dashboard to deliver automated fracture detection, segmentation, and classification from X-ray images. The system is designed to assist — not replace — radiologists by surfacing AI findings for expert review and validation before final report generation.

---

## Features

| Feature | Description |
|---|---|
| **Fracture Detection** | YOLO-based object detection localizes fractures with bounding boxes |
| **Precise Segmentation** | UNet model identifies exact fracture boundaries at the pixel level |
| **Classification** | CNN classifies fracture type, severity, and healing stage |
| **Radiologist Dashboard** | Review, modify, or override AI findings with manual annotations |
| **Report Generation** | Auto-generates structured PDF medical reports with AI findings |

---

## Architecture

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

### Data Flow

```
1. Upload      →  User → Frontend → Backend → File Storage
2. Processing  →  Backend → YOLO Detection → UNet Segmentation → CNN Classification
3. Storage     →  AI Results → Database → Report Generation
4. Review      →  Database → Frontend → Radiologist Dashboard
5. Report      →  Validated Results → PDF Generator → Download
```

---

## AI Pipeline

### Stage 1 — YOLO Fracture Detection

Localizes fractures with bounding boxes using a YOLOv8 architecture.

- **Input**: 640×640 RGB images (X-rays converted to 3-channel)
- **Output**: Bounding boxes `[x, y, w, h]`, confidence scores, class labels
- **Classes**: `fracture_simple`, `fracture_complex`, `fracture_comminuted`, `no_fracture`
- **Metrics**: mAP@0.5, mAP@0.5:0.95
- **Training**: 10,000+ annotated X-ray images with rotation, scaling, and brightness augmentation

### Stage 2 — UNet Segmentation

Provides pixel-level segmentation of detected fracture regions.

- **Input**: 512×512 grayscale images
- **Output**: 512×512 binary masks
- **Architecture**: Encoder–decoder with skip connections and transpose convolutions
- **Loss**: Dice loss + Binary Cross-Entropy
- **Metrics**: Dice coefficient, IoU, pixel accuracy

### Stage 3 — CNN Classification

Classifies fracture severity and type from cropped YOLO detection crops.

- **Input**: 224×224 cropped fracture regions
- **Base model**: ResNet50 or EfficientNet-B0 (ImageNet pretrained)
- **Output**: Multi-class probabilities across three dimensions:
  - **Severity**: mild, moderate, severe
  - **Type**: transverse, oblique, spiral, comminuted
  - **Healing**: acute, healing, healed
- **Metrics**: Accuracy, F1-score, AUC-ROC

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Log in and receive tokens |
| POST | `/api/auth/logout` | Invalidate session |
| POST | `/api/auth/refresh` | Refresh access token |

### Cases

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/cases/upload` | Upload X-ray image |
| GET | `/api/cases/` | List all cases |
| GET | `/api/cases/{case_id}` | Get a specific case |
| PUT | `/api/cases/{case_id}` | Update case (radiologist review) |
| DELETE | `/api/cases/{case_id}` | Delete case |

### AI Processing

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/analyze/{case_id}` | Trigger AI analysis |
| GET | `/api/ai/results/{case_id}` | Retrieve AI results |

### Reports

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reports/{case_id}` | Get structured report data |
| GET | `/api/reports/{case_id}/pdf` | Download PDF report |

### Example Responses

**Upload response:**
```json
{
  "case_id": "uuid-123",
  "status": "uploaded",
  "image_url": "/storage/cases/uuid-123/xray.jpg",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**AI results response:**
```json
{
  "case_id": "uuid-123",
  "status": "completed",
  "detections": [
    { "bbox": [100, 150, 200, 180], "confidence": 0.92, "class": "fracture_simple" }
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

---

## Database Schema

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,         -- 'radiologist', 'technician', 'admin'
    license_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Cases
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    patient_name VARCHAR(255) NOT NULL,
    patient_age INTEGER,
    body_part VARCHAR(100),
    clinical_notes TEXT,
    image_path VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'uploaded',  -- 'uploaded', 'processing', 'completed', 'reviewed'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Results
CREATE TABLE ai_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id),
    detections JSONB,
    segmentation_path VARCHAR(500),
    classification JSONB,
    confidence_score FLOAT,
    processing_time FLOAT,
    model_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id),
    radiologist_id UUID REFERENCES users(id),
    ai_findings TEXT,
    radiologist_notes TEXT,
    final_diagnosis TEXT,
    report_status VARCHAR(50) DEFAULT 'draft',  -- 'draft', 'approved', 'rejected'
    pdf_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP
);
```

---

## Security

### Authentication
- JWT access tokens (15-minute expiry) + refresh tokens (7-day expiry)
- bcrypt password hashing with salt
- Account lockout after 5 failed login attempts
- Rate limiting: 100 requests/minute per user

### Data Protection
- HTTPS-only transmission
- Secure file upload with type validation and virus scanning
- Patient data anonymization options
- GDPR-compliant data deletion
- Audit trails for all data access

### Access Control

| Permission | Technician | Radiologist | Admin |
|---|:---:|:---:|:---:|
| Upload cases | ✓ | ✓ | ✓ |
| View own cases | ✓ | ✓ | ✓ |
| View all cases | ✗ | ✓ | ✓ |
| Run AI analysis | ✓ | ✓ | ✓ |
| Generate reports | ✗ | ✓ | ✓ |
| Admin functions | ✗ | ✗ | ✓ |

---

## Deployment

### Local Development (Docker Compose)

```yaml
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
```

### Cloud Deployment (AWS)

| Service | Role |
|---|---|
| ECS Fargate | Container orchestration |
| RDS PostgreSQL | Managed database |
| S3 | Image and model storage |
| CloudFront | CDN for static assets |
| ALB | Application Load Balancer |
| ElastiCache | Redis caching |
| ECR | Container registry |

**CI/CD pipeline**: GitHub → GitHub Actions → Docker Build → ECR Push → ECS Deploy

---

## Scalability

- Stateless backend instances behind a load balancer
- Redis for distributed session and response caching
- Database connection pooling via PgBouncer
- Read replicas for reporting workloads
- GPU instances with model caching for AI inference
- Celery task queue for async AI processing jobs
- Prometheus + Grafana for metrics; ELK stack for logging
- Model drift detection and inference time tracking

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Query |
| Backend | Python 3.11+, FastAPI, SQLAlchemy, Alembic, Celery |
| AI/ML | PyTorch 2.0+, YOLOv8 (Ultralytics), UNet, OpenCV |
| Database | PostgreSQL 15+, Redis 7+ |
| Infrastructure | Docker, AWS (ECS/RDS/S3), Nginx |

---

## System Requirements

### Minimum
- CPU: 4 cores, 2.5 GHz
- RAM: 16 GB
- Storage: 500 GB SSD
- GPU: NVIDIA GTX 1060 or equivalent

### Recommended (Production)
- CPU: 8+ cores, 3.0 GHz
- RAM: 32 GB+
- Storage: 1 TB+ NVMe SSD
- GPU: NVIDIA RTX 3080 or equivalent
- Network: 1 Gbps

---

## Roadmap

### Short-term (3–6 months)
- Multi-modal AI incorporating patient history and symptoms
- Real-time collaboration for multi-radiologist case review
- Native iOS/Android mobile apps
- PACS and EMR system integration

### Medium-term (6–12 months)
- CT scan support with 3D fracture modeling
- Healing timeline prediction
- Federated learning across hospital networks
- Voice-to-text for radiologist notes
- Automated displacement and angulation measurements

### Long-term (1–2 years)
- Multi-organ and multi-condition support
- AR/VR immersive fracture visualization
- AI-powered surgical planning and treatment recommendations
- Anonymized research data platform
- Multi-language, multi-region global deployment

---

*RadiAI Bharat — Built to assist radiologists, not replace them.*
