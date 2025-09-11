# AI Image Editor - Replit Project Guide

## Overview

This is a full-stack AI-powered image editing application built with React, Express, and PostgreSQL. Users can upload images, generate new ones from text prompts, and edit them using natural language commands. The app uses Flux.ai for AI image generation and editing, Stripe for subscription management, and includes a freemium model with usage limits.

## User Preferences

Preferred communication style: Simple, everyday language.

Follow these best practices while doing changes:
- Always aim for mobile first UI designs if not otherwise specified or context proves different
- For server routes, create modular structure with separation of concerns
- Always prioritize Replit offered services to thirdparty (DB,Auth,ObjectStorage etc.)
- Test api routes with curl localhost commands
- Keep separation of conserns in routes

For JavaScript/TypeScript function declarations:
grep -r -n "^ *app\." server/

For JavaScript/TypeScript function declarations:
grep -r -n "^ *\(function\|export function\|async function\)" server/

For arrow functions and method definitions:
grep -r -n "^ *\(const\|let\|var\).*=.*=>" server/

For TypeScript/JavaScript methods in classes or objects:
grep -r -n "^ *[a-zA-Z_][a-zA-Z0-9_]*\s*(" server/

For Express route handlers specifically:
grep -r -n "^ *app\.\(get\|post\|put\|delete\|patch\)" server/



## Recent Changes

### January 2025
- **Credit-Based Subscription System (January 21, 2025)**: Complete refactoring from separate edit/generation count limits to unified credit system:
  - Database schema migrated from `editCount`/`editLimit`/`generationCount`/`generationLimit` to `credits`/`maxCredits`/`creditsResetDate`
  - Storage layer updated with `deductCredits`, `refreshCredits`, and `addCredits` methods
  - Frontend components updated to check credit affordability instead of separate counters
  - Immediate switchover implementation with no gradual migration needed
- **Modular Routes Architecture (January 22, 2025)**: Refactored the monolithic server/routes.ts file (1479 lines) into organized modules with separation of concerns:
  - `routes/auth.ts` - Authentication and user management routes
  - `routes/images.ts` - Image upload, editing, generation, and management routes
  - `routes/storage.ts` - Object storage and image serving routes
  - `routes/subscriptions.ts` - Stripe payment and subscription management routes
  - `routes/webhooks.ts` - Stripe webhook handling routes
  - `routes/index.ts` - Central route registration and organization
- **Multi-Image Editing Feature (January 22, 2025)**: Added third navigation option for combining multiple images using Flux AI's "fal-ai/flux-pro/kontext/max/multi" model. Users can upload 2-5 images, view thumbnails, and generate combined results with custom prompts.
- **Mobile-Responsive Navigation (January 22, 2025)**: Implemented responsive tab system that converts to dropdown menu on mobile devices while maintaining full functionality across all screen sizes.
- **AWS S3 Storage Migration (September 11, 2025)**: Complete migration from Google Cloud Storage to AWS S3:
  - Updated ObjectStorageService class to use @aws-sdk/client-s3 instead of @google-cloud/storage
  - Implemented HMAC key authentication using AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
  - Added graceful startup behavior when AWS credentials are not configured
  - Improved content type detection using S3 metadata with extension-based fallback
  - Maintained backward compatibility with existing URL patterns and API interfaces

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
- **Modular route organization** with separation of concerns across multiple files
- **RESTful API** design with organized route modules for different functionalities
- **Middleware-based** request processing with logging and error handling
- **Session-based authentication** using express-session with PostgreSQL storage

### Data Storage
- **PostgreSQL** database using Neon serverless
- **Drizzle ORM** for database operations and migrations
- **AWS S3** for image file storage and serving
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
- **Storage management** using AWS S3 with optimized serving

### Subscription Management
- **Stripe integration** for payment processing
- **Credit-based freemium model** with monthly allowances (Free: 30, Basic: 120, Premium: 200, Premium Plus: 300 credits)
- **Flexible pricing** with different credit costs per operation (Edit: 2, Generation: 3, Multi-gen: 5, Upscale: 1)
- **Webhook handling** for subscription status updates and credit refresh on billing cycles
- **Gaming protection** to prevent rapid subscription changes for credit resets

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
- **AWS S3** - Cloud object storage for image files using HMAC key authentication
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
- **API keys** for Stripe, Flux.ai, AWS S3, and session secrets
- **AWS S3** configurations for bucket and region settings
- **CORS and security** headers for production deployment

### Scaling Considerations
- **Stateless server** design allows horizontal scaling
- **Database connection pooling** for concurrent requests
- **Object storage** provides automatic CDN capabilities
- **Session storage** in database enables multi-instance deployment