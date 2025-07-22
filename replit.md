# AI Image Editor - Replit Project Guide

## Overview

This is a full-stack AI-powered image editing application built with React, Express, and PostgreSQL. Users can upload images, generate new ones from text prompts, and edit them using natural language commands. The app uses Flux.ai for AI image generation and editing, Stripe for subscription management, and includes a freemium model with usage limits.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### January 2025
- **Multi-Image Editing Feature (January 22, 2025)**: Added third navigation option for combining multiple images using Flux AI's "fal-ai/flux-pro/kontext/max/multi" model. Users can upload 2-5 images, view thumbnails, and generate combined results with custom prompts.
- **Mobile-Responsive Navigation (January 22, 2025)**: Implemented responsive tab system that converts to dropdown menu on mobile devices while maintaining full functionality across all screen sizes.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for the user interface
- **Vite** as the build tool and development server
- **Tailwind CSS** with shadcn/ui components for styling
- **Wouter** for client-side routing (lightweight React router)
- **TanStack Query** for server state management and caching
- **Dark/Light theme** support with theme provider

### Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** design with route-based organization
- **Middleware-based** request processing with logging and error handling
- **Session-based authentication** using express-session with PostgreSQL storage

### Data Storage
- **PostgreSQL** database using Neon serverless
- **Drizzle ORM** for database operations and migrations
- **Object Storage** using Replit's object storage service for image files
- **Session storage** in PostgreSQL for user authentication

## Key Components

### Authentication System
- **Replit Auth integration** using OpenID Connect (OIDC)
- **Passport.js** strategy for authentication flow
- **Session management** with secure HTTP-only cookies
- **User profile management** with subscription tracking

### Image Processing Pipeline
- **Upload handling** with Multer for multipart form data
- **AI integration** with Flux.ai (fal-ai client) for image generation and editing
- **Image optimization** with Sharp for resizing and format conversion
- **Storage management** using Replit Object Storage with CDN-like serving

### Subscription Management
- **Stripe integration** for payment processing
- **Freemium model** with usage limits (free: 10 edits/generations, paid: 50+ edits)
- **Webhook handling** for subscription status updates
- **Gaming protection** to prevent rapid subscription changes for limit resets

### UI Components
- **Component library** using shadcn/ui (Radix UI primitives)
- **Responsive design** with mobile-first approach
- **Form handling** with React Hook Form and Zod validation
- **Toast notifications** for user feedback

## Data Flow

### Image Upload Flow
1. User selects image file through drag-and-drop or file picker
2. Frontend uploads file to `/api/images/upload` endpoint
3. Server validates file type and size limits
4. Image is processed and stored in object storage
5. Database record created with image metadata
6. Frontend receives image data and updates UI

### Image Editing Flow
1. User enters natural language prompt for editing
2. Frontend sends edit request to `/api/images/:id/edit`
3. Server checks user's edit count against subscription limits
4. If allowed, request sent to Flux.ai API for processing
5. Processed image stored in object storage
6. Edit history updated in database
7. User's edit count incremented
8. New image URL returned to frontend

### Subscription Flow
1. User selects subscription plan on frontend
2. Stripe Checkout session created via API
3. User completes payment on Stripe
4. Webhook receives payment confirmation
5. User's subscription status and limits updated in database
6. Frontend reflects new subscription status

## External Dependencies

### AI Services
- **Flux.ai (fal-ai)** - Primary AI service for image generation and editing
- **Models used**: Flux Pro Max, Flux Kontext Pro for different image operations

### Payment Processing
- **Stripe** - Complete payment infrastructure including:
  - Checkout sessions for subscription signup
  - Webhook handling for payment events
  - Customer and subscription management

### Storage Services
- **Replit Object Storage** - Image file storage with built-in CDN capabilities
- **PostgreSQL (Neon)** - Serverless database for application data

### Authentication
- **Replit Auth** - OAuth provider using OpenID Connect protocol
- Eliminates need for custom user registration/login flows

## Deployment Strategy

### Development Environment
- **Hot module replacement** with Vite for fast development
- **TypeScript compilation** for type safety
- **Database migrations** using Drizzle Kit
- **Environment variables** for API keys and database connections

### Production Build
- **Client build** using Vite with static asset optimization
- **Server bundle** using esbuild for Node.js deployment
- **Database schema** deployed via Drizzle migrations
- **Static serving** of client assets through Express

### Environment Configuration
- **Database connection** via `DATABASE_URL` environment variable
- **API keys** for Stripe, Flux.ai, and session secrets
- **Replit-specific** configurations for auth and object storage
- **CORS and security** headers for production deployment

### Scaling Considerations
- **Stateless server** design allows horizontal scaling
- **Database connection pooling** for concurrent requests
- **Object storage** provides automatic CDN capabilities
- **Session storage** in database enables multi-instance deployment