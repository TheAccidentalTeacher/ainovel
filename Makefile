.PHONY: help dev install test lint format clean

help:
	@echo "AI Novel Generator - Makefile Commands"
	@echo ""
	@echo "  make dev          - Start all services with docker-compose"
	@echo "  make install      - Install Python dependencies"
	@echo "  make test         - Run tests"
	@echo "  make lint         - Run linters (ruff, mypy)"
	@echo "  make format       - Format code (black, ruff)"
	@echo "  make clean        - Clean temporary files"
	@echo "  make logs         - Follow docker-compose logs"
	@echo "  make shell-api    - Open shell in API container"
	@echo "  make shell-worker - Open shell in worker container"

dev:
	docker-compose up --build

install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

test:
	cd backend && pytest -v

lint:
	cd backend && ruff check .
	cd backend && mypy .

format:
	cd backend && black .
	cd backend && ruff check --fix .

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type d -name .pytest_cache -exec rm -rf {} +
	find . -type d -name .mypy_cache -exec rm -rf {} +

logs:
	docker-compose logs -f

shell-api:
	docker-compose exec api /bin/bash

shell-worker:
	docker-compose exec worker /bin/bash

stop:
	docker-compose down

rebuild:
	docker-compose down
	docker-compose build --no-cache
	docker-compose up
