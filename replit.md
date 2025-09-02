# UltraSecure Messenger

## Overview

UltraSecure Messenger is a modern, secure chat application designed for fast communication even on slow internet connections. The project is a full-stack web application built with React, TypeScript, Express, and PostgreSQL, featuring real-time messaging, secure authentication via Replit Auth, and a comprehensive chat system with support for direct messages, group chats, file sharing, and message reactions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent, accessible UI components
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Comprehensive design system using Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect for secure user authentication
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **File Handling**: Multer for file uploads with configurable storage limits

### Data Storage Solutions
- **Primary Database**: Neon PostgreSQL serverless database
- **Schema Design**: Relational database with tables for users, chats, chat members, messages, reactions, and read receipts
- **Session Storage**: PostgreSQL-backed session store for user authentication state
- **File Storage**: Local file system storage for uploaded files (uploads directory)

### Authentication and Authorization
- **Authentication Provider**: Replit Auth using OpenID Connect protocol
- **Session Management**: Server-side sessions with secure HTTP-only cookies
- **Authorization Pattern**: Route-level middleware protection using `isAuthenticated` middleware
- **User Management**: Automatic user creation/updates on successful authentication

### Real-time Communication
- **Polling Strategy**: Client-side polling every 5 seconds for messages and 30 seconds for chat lists
- **Message Delivery**: RESTful API endpoints for message CRUD operations
- **Optimistic Updates**: Immediate UI updates with server reconciliation via React Query

## External Dependencies

### Core Backend Services
- **Neon Database**: Serverless PostgreSQL database hosting
- **Replit Auth**: Authentication service integration via OpenID Connect

### Major Frontend Libraries
- **React Query**: Server state management and caching
- **shadcn/ui**: Component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Wouter**: Lightweight routing library

### Backend Framework Dependencies
- **Express.js**: Web application framework
- **Drizzle ORM**: Type-safe database toolkit
- **Multer**: Multipart form data handling for file uploads
- **connect-pg-simple**: PostgreSQL session store

### Development and Build Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Static type checking
- **ESBuild**: JavaScript bundler for production builds
- **PostCSS**: CSS processing with Autoprefixer