# Dandonito
This project is a multi-tenant Dental Clinic Relationship Management (CRM) system designed with a decoupled architecture. The backend is built using Django and Django REST Framework (DRF), backed by a PostgreSQL database for persistent storage and Redis for high-performance caching and session synchronization. The entire infrastructure is fully containerized using Docker, orchestrating web applications, databases, and memory caches seamlessly for streamlined production and development workflows.

## Core Technical Features
Multi-Tenant Structural Isolation: Implements rigid relational boundaries at the database level. Every resource—ranging from patients to appointment schedules—is dynamically bound to an isolated clinic instance determined during the request authentication cycle.

Custom Security & Role-Based Access Control (RBAC): Built-in stateless custom authentication layer enforcing distinct permissions for Doctors and Assistants, mitigating privilege escalation risks across API endpoints.

Transactional Two-Phase Authentication: Features a robust stateful signup/login sequence utilizing atomic database transactions (transaction.atomic) integrated with a secure custom time-restricted One-Time Password (OTP) validation framework.

High-Performance Scheduling & Validation Engine: Processes appointment slots based on customizable time durations. The engine executes multi-layered verification checks to block past-date updates, evaluate overlaps, and ensure atomic commitment of newly reserved time frames.

Polymorphic Search Capabilities: Executes optimized database lookups leveraging compound queries (Q objects) over indexed medical sequences, identities, phone records, and patient metadata.

Production-Grade Infrastructure Integration: Managed via custom entrypoint scripts automating safe system migrations, pre-flight dependency network checkups (via netcat validation loops), and dynamic superuser initialization beneath a multi-worker Gunicorn server.

Installation & Local Setup Guide
Follow these steps to build, configure, and initialize the system environment.

## 1. Prerequisites
Ensure the target machine has the following tools installed:

Docker (24.0.0 or higher)

Docker Compose V2

## 2. Environment Configuration
Create a .env file in the root directory of the repository and configure the required infrastructure variables:
```
# Django Config
DJANGO_SECRET_KEY='your-secure-random-secret-key'
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_PASSWORD=your-secure-password
APP_PORT=8080

# PostgreSQL Config
POSTGRES_DB=Dandonitodb
POSTGRES_USER=db_user
POSTGRES_PASSWORD=db_secure_password
POSTGRES_HOST=db
POSTGRES_PORT=5432

# Gunicorn Config
GUNICORN_WORKER_NUMBER=3
GUNICORN_TIMEOUT=120

# Container Registry Configuration
DOCKER_REG=docker.arvancloud.ir/
```

## 3. Execution and Deployment Commands
Launch the entire infrastructure stack using Docker Compose. The runtime automation lifecycle handles the installation of all necessary system extensions, library packages (including cryptography hooks, psycopg2 database adaptors, simple-jwt primitives, and Jdatetime modules), asset preparation, database migrations, and web server execution.
```
Bash
docker compose up --build -d
docker compose ps
docker compose logs -f dandonito_app
```

## Frontend Setup & Execution Guide

The frontend workspace is built on React 18, managed via Vite, and utilizes Tailwind CSS for application styling. Follow the steps below to configure and run the user interface layer.

### 1. Installation of Dependencies
Navigate to the root directory of the frontend application context and execute the package installer to fetch all node module definitions:

```
cd Frontend
npm install
```
## 2. Local Environment Configuration
Create a .env file within the root of the Frontend directory to specify the upstream gateway parameters for API network operations:

```
VITE_API_BASE_URL=http://localhost:8080
```
3. Execution Infrastructure
```
npm run dev
npm run lint
npm run build
```
