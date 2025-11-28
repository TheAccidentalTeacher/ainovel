#!/bin/bash
set -e

echo "Installing Python dependencies..."
pip install -r backend/requirements.txt

echo "Downloading spaCy model..."
python -m spacy download en_core_web_sm

echo "Installing frontend dependencies..."
cd frontend
npm install

echo "Building frontend..."
npm run build

echo "Build complete!"
