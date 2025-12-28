#!/bin/bash
# Start script for Railway deployment
# This ensures PORT environment variable is properly expanded

PORT=${PORT:-8000}
exec uvicorn main:app --host 0.0.0.0 --port "$PORT"

