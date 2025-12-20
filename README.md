# AI Recruitment Application

A modern recruitment platform built with Next.js and FastAPI that connects job seekers with recruiters. The system features intelligent resume processing with AI-powered parsing, redaction, and skill extraction capabilities.

## Features

- **Job Seeker Portal**: Browse jobs, apply with resumes, track applications
- **Recruiter Dashboard**: Post jobs, review candidates, manage applicants
- **AI Resume Processing**: Automated resume parsing, bias redaction, and skill extraction
- **Real-time Notifications**: Stay updated on application status changes
- **Company Profiles**: Showcase company information and available positions

## System Requirements

### Required Versions

- **Node.js**: `22.x` or higher
- **Python**: `3.10` or higher
- **npm**: `10.x` or higher (comes with Node.js)

### Additional Requirements

- **Tesseract OCR**: Required for image-based resume processing
  - Windows: Download from [UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki)
  - macOS: `brew install tesseract`
  - Linux: `sudo apt-get install tesseract-ocr`

## Local Setup Guide

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-recruitment-app
```

### 2. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=

GMAIL_USERNAME=
GMAIL_APP_PASSWORD=

TESSERACT_PATH=
ROBOFLOW_API_URL=
ROBOFLOW_API_KEY=
ROBOFLOW_MODEL_ID=
HF_MODEL_ID=
```

### 3. Install Dependencies

#### Frontend (Next.js)
```bash
npm install
```

#### Backend (FastAPI)
```bash
# Create Python virtual environment
python -m venv .venv

# Activate virtual environment
# Windows PowerShell:
.venv\Scripts\Activate.ps1

# Windows CMD:
.venv\Scripts\activate.bat

# macOS/Linux:
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Download spaCy language model
python -m spacy download en_core_web_sm
```


### 4. Run the Application

#### Start the Next.js Development Server

```bash
npm run dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000)

#### Start the FastAPI Server

In a separate terminal:

```bash
# Windows PowerShell:
npm run fastapi-dev

# Or manually:
.venv\Scripts\Activate.ps1
python -m uvicorn api.index:app --reload
```

The backend API will be available at [http://127.0.0.1:8000](http://127.0.0.1:8000)

## How It Works

### Resume Processing Pipeline

1. Job seeker uploads a resume (PDF or image format)
2. Next.js server stores the original file in Supabase storage
3. FastAPI service processes the resume:
   - Parses PDF content or performs OCR on images
   - Extracts personal information, experience, education, and skills
   - Redacts sensitive/bias-prone information (photos, age, gender, etc.)
   - Stores redacted version in separate bucket
4. Processed data is saved to the database
5. Job seeker receives real-time updates via webhook

## Project Structure

```
ai-recruitment-app/
├── api/                    # FastAPI backend
│   ├── image/             # Image processing & OCR
│   ├── pdf/               # PDF parsing & processing
│   └── services/          # Job Score Matching
├── src/
│   ├── app/               # Next.js app router
│   │   ├── jobseeker/    # Job seeker pages
│   │   ├── recruiter/    # Recruiter pages
│   │   └── api/          # API routes
│   ├── components/        # React components
│   ├── services/          # Frontend services
│   └── utils/             # Utility functions
├── supabase/              # Database migrations
└── public/                # Static assets
```

## Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build Next.js for production
- `npm start` - Start Next.js production server
- `npm run fastapi-dev` - Start FastAPI development server
- `npm run lint` - Run ESLint
