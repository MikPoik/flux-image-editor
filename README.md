
# AI Image Editor

A full-stack AI-powered image editing application that allows users to upload images, generate new ones from text prompts, and edit them using natural language commands.

## 🚀 Features

- **AI Image Generation**: Create images from text descriptions using Flux.ai models
- **Natural Language Editing**: Edit images with simple text prompts
- **Upload & Transform**: Upload your own images and transform them with AI
- **Freemium Model**: Free tier with 10 edits/generations, paid subscriptions for more
- **Real-time Processing**: Fast image processing with progress tracking
- **Gallery Management**: Save and organize your created images
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark/Light Theme**: Toggle between light and dark modes

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** with shadcn/ui components
- **Wouter** for lightweight routing
- **TanStack Query** for server state management
- **Framer Motion** for animations

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Neon serverless
- **Drizzle ORM** for database operations
- **Replit Object Storage** for image files
- **Sharp** for image processing
- **Stripe** for subscription management

### AI & Services
- **Flux.ai (fal-ai)** for image generation and editing
- **Replit Auth** for authentication
- **Session-based auth** with PostgreSQL storage

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database (Neon recommended)
- Replit account for object storage
- Stripe account for payments
- Flux.ai API key

### Environment Variables
Create a `.env` file with the following variables:

```env
DATABASE_URL=your_postgresql_connection_string
FAL_KEY=your_fal_ai_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
SESSION_SECRET=your_session_secret
REPLIT_CLIENT_ID=your_replit_client_id
REPLIT_CLIENT_SECRET=your_replit_client_secret
```

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   npm run db:push
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at http://localhost:5000

## 📁 Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
├── server/                 # Backend Express application
│   ├── routes.ts           # API route definitions
│   ├── db.ts              # Database configuration
│   ├── objectStorage.ts   # Image storage service
│   └── replitAuth.ts      # Authentication setup
├── shared/                 # Shared TypeScript schemas
└── migrations/            # Database migration files
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type check TypeScript
- `npm run db:push` - Push database schema changes

### Key Components

- **Image Editor**: Main editing interface with prompt input and image display
- **Gallery**: View and manage saved images
- **Subscription**: Stripe-powered subscription management
- **Authentication**: Replit Auth integration with session management

## 🎨 Image Processing Pipeline

1. **Upload**: Images uploaded via drag-and-drop or file picker
2. **Storage**: Images stored in Replit Object Storage with CDN-like serving
3. **Processing**: AI editing via Flux.ai with natural language prompts
4. **Optimization**: Images optimized with Sharp for web delivery
5. **Gallery**: Processed images saved to user's gallery

## 💳 Subscription Model

- **Free Tier**: 10 image edits/generations per month
- **Paid Tiers**: 50+ edits with additional features
- **Gaming Protection**: Prevents rapid subscription changes to reset limits
- **Stripe Integration**: Secure payment processing with webhook support

## 🔐 Authentication

- **Replit Auth**: OAuth integration with Replit accounts
- **Session Management**: Secure HTTP-only cookies with PostgreSQL storage
- **Route Protection**: Authenticated routes for protected content

## 📱 Responsive Design

The application is built mobile-first with:
- Responsive grid layouts
- Touch-friendly interactions
- Optimized image loading
- Progressive Web App capabilities

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Deployment on Replit
The application is configured for deployment on Replit with:
- Automatic dependency installation
- Environment variable management
- Object storage integration
- PostgreSQL database hosting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation in `/replit.md`
- Review the privacy policy at `/privacy-policy`
- Check terms of service at `/terms-of-service`

## 🙏 Acknowledgments

- [Flux.ai](https://fal.ai/) for AI image generation capabilities
- [Replit](https://replit.com/) for hosting and object storage
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Stripe](https://stripe.com/) for payment processing
