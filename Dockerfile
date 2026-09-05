# Use the official Python lightweight image
FROM python:3.11-slim

# Install system libraries needed by dlib and OpenCV (C++ compiler, CMake, and graphics libs)
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install the CPU-only version of PyTorch to save massive amounts of RAM and disk space
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Install the rest of the requirements (including dlib)
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project code into the container
COPY . .

# Ensure the data directory exists so CSV files can be created
RUN mkdir -p data

# Expose the default port used by Hugging Face Spaces
EXPOSE 7860

# Command to run the AI backend when the container starts
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
