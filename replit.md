# School Management System

## Overview

This is a modern school management system built with React, Express.js, and PostgreSQL. The application provides comprehensive tools for managing students, academic levels, subjects, grades, and forum discussions in educational institutions. It features a clean, responsive interface built with shadcn/ui components and includes robust authentication through Replit Auth.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Framework**: shadcn/ui components based on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Middleware**: Express session management and authentication middleware
- **Error Handling**: Centralized error handling with proper HTTP status codes

### Database Architecture
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with Neon serverless driver
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Connection pooling with @neondatabase/serverless

## Key Components

### Authentication System
- **Provider**: Replit Auth with OpenID Connect
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **Authorization**: Role-based access control (admin/student roles)
- **Security**: HTTP-only cookies with secure session handling

### Data Models
- **Users**: Core user authentication and profile data
- **Students**: Extended student information with enrollment details
- **Levels**: Academic levels (Level 1, Level 2, etc.) with duration tracking
- **Subjects**: Course subjects associated with specific levels
- **Grades**: Student assessment records
- **Forums**: Discussion boards for academic communication
- **Forum Posts**: Threaded discussions within forums

### UI Component System
- **Design System**: Consistent design tokens using CSS custom properties
- **Component Library**: Comprehensive set of reusable UI components
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Accessibility**: ARIA-compliant components with keyboard navigation support

## Data Flow

### Client-Server Communication
1. **Authentication Flow**: User authenticates via Replit Auth, session established server-side
2. **API Requests**: Client makes authenticated requests using fetch with credentials
3. **Data Fetching**: TanStack Query manages caching, synchronization, and error handling
4. **Real-time Updates**: Query invalidation ensures data consistency across components

### Database Operations
1. **Connection Management**: Pooled connections to PostgreSQL via Neon serverless
2. **Query Execution**: Type-safe queries using Drizzle ORM
3. **Transaction Support**: Atomic operations for data integrity
4. **Schema Evolution**: Version-controlled migrations using Drizzle Kit

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless driver
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Primitive UI components
- **react-hook-form**: Form state management
- **zod**: Runtime type validation

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production

### Authentication
- **openid-client**: OpenID Connect client implementation
- **passport**: Authentication middleware
- **express-session**: Session management

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 runtime
- **Development Server**: Vite dev server with HMR
- **Database**: PostgreSQL 16 module on Replit
- **Port Configuration**: Port 5000 exposed as external port 80

### Production Build
- **Frontend Build**: Vite builds optimized static assets
- **Backend Build**: ESBuild bundles server code with external dependencies
- **Asset Serving**: Express serves static files in production
- **Environment**: NODE_ENV-based configuration switching

### Scaling Strategy
- **Deployment Target**: Autoscale deployment on Replit
- **Database**: Serverless PostgreSQL for automatic scaling
- **Session Storage**: Database-backed sessions for horizontal scaling
- **Static Assets**: Efficient caching and compression

## Changelog
- June 20, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.