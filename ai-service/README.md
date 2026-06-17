# SIMPRO AI Service

## Setup
1. cd ai-service
2. pip install -r requirements.txt
3. Copy .env and fill in values
4. python main.py

## Endpoints
- GET  /health
- POST /recommend-penguji
- POST /check-similarity
- POST /update-similarity-flag

## Running alongside Next.js
Start both servers:
- Next.js: npm run dev (port 3000)
- AI Service: python main.py (port 8000)
