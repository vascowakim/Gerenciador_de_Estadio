# EstagioPro - Internship Management System

## Overview

EstagioPro is a comprehensive internship management system built for educational institutions. The application allows administrators and professors to manage students, advisors, and internships through a modern web interface. The system provides role-based access control, enabling different levels of functionality based on user permissions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side is built using React with TypeScript, implementing a modern single-page application (SPA) architecture:

- **Framework**: React 18 with TypeScript for type safety and developer experience
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Build Tool**: Vite for fast development and optimized production builds

The frontend follows a component-based architecture with clear separation between pages, reusable UI components, and layout components. Form handling is managed through React Hook Form with Zod validation schemas.

### Backend Architecture
The server-side implements a RESTful API using Express.js with TypeScript:

- **Framework**: Express.js for HTTP server and middleware handling
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Session-based authentication using express-session
- **Password Security**: bcrypt for password hashing
- **API Structure**: RESTful endpoints organized by resource type (users, students, advisors, internships)

The backend follows a layered architecture with clear separation between routes, business logic (storage layer), and database operations. The storage layer implements a repository pattern through the IStorage interface.

### Database Design
PostgreSQL database with Drizzle ORM for schema management:

- **Users Table**: Stores system users (administrators and professors) with role-based permissions
- **Students Table**: Student information including registration numbers and course details
- **Advisors Table**: Faculty advisor information with department affiliations
- **Internships Table**: Internship records linking students and advisors with company information
- **Enums**: Predefined types for user roles, internship types, and status tracking

The schema uses UUIDs for primary keys and includes proper foreign key relationships with cascading rules.

### Authentication & Authorization
Role-based access control system:

- **Session Management**: Server-side sessions with secure cookie configuration
- **User Roles**: Administrator and professor roles with different permission levels
- **Route Protection**: Middleware-based authentication checks for protected endpoints
- **Admin-Only Features**: Certain functionalities restricted to administrator users

### Development Environment
Development setup optimized for Replit:

- **Hot Reload**: Vite development server with HMR for instant updates
- **TypeScript**: Full TypeScript support across frontend and backend
- **Path Aliases**: Configured import aliases for cleaner code organization
- **Environment Configuration**: Separate development and production configurations

## External Dependencies

### Database Services
- **Neon Database**: PostgreSQL-compatible serverless database with WebSocket support
- **Connection Pooling**: @neondatabase/serverless with connection pooling for scalability

### UI and Styling
- **Radix UI**: Comprehensive primitive components for accessibility and functionality
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Type-safe utility for component variants

### Development Tools
- **Drizzle Kit**: Database migration and schema management
- **ESBuild**: Fast bundling for production builds
- **PostCSS**: CSS processing with Tailwind and Autoprefixer
- **TSX**: TypeScript execution for development server

### Authentication & Security
- **bcrypt**: Password hashing for secure authentication
- **express-session**: Session management with configurable storage
- **connect-pg-simple**: PostgreSQL session store for production use

### State Management
- **TanStack Query**: Server state management with caching and synchronization
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation and schema parsing

The application is designed to be deployed on Replit with minimal configuration, utilizing environment variables for database connections and session secrets.