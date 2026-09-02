FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend
COPY backend/ backend/
COPY data/ data/

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 8000

# Seed database and start server
CMD ["sh", "-c", "python -m backend.seed && uvicorn backend.main:app --host 0.0.0.0 --port 8000"]
