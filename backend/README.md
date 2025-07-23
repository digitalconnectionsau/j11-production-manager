# J11 Production Manager - Backend

## Overview
Express.js backend API with PostgreSQL database using Drizzle ORM for the J11 Production Manager application.

## Tech Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Security**: Helmet, CORS
- **Development**: tsx (TypeScript execution)

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env` and update with your database credentials:
```bash
cp .env.example .env
```

### 3. Database Setup (Railway)
1. Create a PostgreSQL database on Railway
2. Copy the DATABASE_URL from Railway to your `.env` file
3. Run database migrations:
```bash
npm run db:generate
npm run db:migrate
```

### 4. Development
```bash
npm run dev
```
Server will start on http://localhost:3001

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

## Railway Deployment

### 1. Connect to Railway
```bash
railway login
railway link
```

### 2. Add Environment Variables
Set these in Railway dashboard:
- `DATABASE_URL` (automatically provided by Railway PostgreSQL)
- `FRONTEND_URL` (your frontend domain)
- `JWT_SECRET` (generate a secure secret)

### 3. Deploy
```bash
railway up
```

## Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## Database Schema

### Users
- id, name, email, password, isActive, createdAt, updatedAt

### Production Tasks
- id, title, description, status, priority, assignedToId, createdAt, updatedAt

### Projects
- id, name, description, status, createdAt, updatedAt

### Project Tasks (Junction)
- id, projectId, taskId, createdAt

## Environment Variables
See `.env.example` for all required environment variables.
