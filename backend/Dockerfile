FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
# libgl1-mesa-glx is deprecated in Debian 12+ (trixie), replaced with libgl1
# libgomp1 is needed for OpenMP support in PyTorch/ultralytics
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

