FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Pre-install torch (CPU only) to save space and ensure compatibility on t3.micro
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Copy requirements and install remaining dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the entire project structure (needed for model resolution)
COPY . .

# Set PYTHONPATH to the backend directory so 'import app' works
ENV PYTHONPATH=/app/backend

# Default port for FastAPI
EXPOSE 8000

# Run entry point
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
