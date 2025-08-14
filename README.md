# Gemini Chat Application

<p align="center">
  <img src="https://img.shields.io/badge/next.js-000000?logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Prisma-3982CE?logo=Prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
</p>

## 🌟 Overview

Gemini Chat is a modern, privacy-focused AI chat application that leverages Google's Gemini AI to provide intelligent conversations. Built with a robust tech stack, it offers a seamless user experience with secure authentication, real-time chat capabilities, and a responsive interface.

### 🎯 Key Objectives
- Provide a secure, private chat experience with AI assistance
- Implement modern authentication flows with phone-based OTP
- Create a responsive, accessible user interface
- Ensure data privacy with local-first architecture
- Deliver fast, real-time interactions

## ✨ Features

### 🔐 Authentication & Security
- **Phone-based Authentication**: Secure sign-in with phone number verification (OTP)
- **JWT Sessions**: Secure, stateless authentication with NextAuth.js
- **Protected Routes**: Middleware-based route protection
- **Role-based Access Control**: Different permissions for different user types

### 💬 Chat Functionality
- **AI-Powered Conversations**: Integration with Google's Gemini AI
- **Real-time Messaging**: Instant message delivery and updates
- **Chat History**: Persistent chat history with local storage fallback
- **Markdown Support**: Rich text formatting in messages
- **Responsive Design**: Works on desktop and mobile devices

### 🛠️ Developer Experience
- **Type Safety**: Built with TypeScript for better code quality
- **Modern Architecture**: App Router and Server Components
- **State Management**: Global state with Zustand
- **Database**: Prisma ORM with SQLite (easy to switch to other databases)
- **Styling**: Utility-first CSS with Tailwind

## 🏗️ Implementation Details

### 🔄 Throttling
API requests are throttled to prevent rate limiting and ensure smooth performance. The application uses a custom hook `useThrottle` to limit the frequency of function calls.

### 📚 Pagination & Infinite Scroll
- Chat messages are loaded in pages using cursor-based pagination
- The `useInfiniteQuery` hook from React Query handles loading more messages as the user scrolls
- Messages are stored in a virtualized list for optimal performance

### ✅ Form Validation
- Client-side validation is implemented using React Hook Form with Zod schema validation
- Real-time validation provides immediate feedback
- Server-side validation ensures data integrity

### 🗂️ Component Structure
```
src/
├── components/
│   ├── auth/           # Authentication components
│   │   ├── SignInForm.tsx
│   │   ├── VerifyOTP.tsx
│   │   └── AuthProvider.tsx
│   ├── chat/           # Chat components
│   │   ├── ChatWindow.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   └── ChatHeader.tsx
│   └── ui/             # Reusable UI components
│       ├── Button.tsx
│       ├── Input.tsx
│       └── Spinner.tsx
├── hooks/              # Custom hooks
│   ├── useThrottle.ts
│   └── useChat.ts
└── lib/               # Utility functions
    ├── validation.ts  # Validation schemas
    └── api.ts         # API client
```

### 🖼️ Application Screenshots

#### Authentication Flow
![Authentication](screenshots/Screenshot%202025-08-15%20at%2012.07.02%E2%80%AFAM.png)

#### Chat Interface
![Chat Interface](screenshots/Screenshot%202025-08-15%20at%2012.07.39%E2%80%AFAM.png)

## 🚀 Tech Stack

### Core Technologies
- **Frontend**: Next.js 15 with React 19
- **Styling**: Tailwind CSS + Radix UI components
- **State Management**: Zustand
- **Authentication**: NextAuth.js v5 (beta)
- **Database**: Prisma ORM with SQLite
- **AI Integration**: Google's Generative AI (Gemini)

### Development Tools
- **TypeScript**: For type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks
- **Jest**: Testing framework

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or later
- npm (v9+) or yarn (v1.22+)
- Google Gemini API key
- Basic understanding of React and Next.js

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/gemini-chat-app.git
   cd gemini-chat-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn
   # or
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory with the following variables:
   ```env
   # Application
   NODE_ENV=development
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_secure_random_string
   
   # Database
   DATABASE_URL="file:./dev.db"
   
   # Google Gemini
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📱 Usage

### Authentication
1. Click "Continue with Phone" on the home page
2. Enter your phone number (format: +1234567890)
3. Enter the 6-digit OTP (for development, check the console for the code)
4. You'll be redirected to your chat dashboard

### Chat Interface
- **New Chat**: Click the "+ New Chat" button to start a new conversation
- **Chat History**: Access previous conversations from the sidebar
- **Send Messages**: Type your message and press Enter or click the send button
- **AI Responses**: The system will respond using Google's Gemini AI

### User Profile
- Click on your profile picture to access account settings
- View your chat history and preferences
- Sign out when finished

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests
- `npx prisma studio` - Open Prisma Studio for database management

### Project Structure

```
gemini-chat-app/
├── .github/               # GitHub configurations
├── public/               # Static files
├── prisma/               # Database schema and migrations
│   └── schema.prisma     # Prisma schema definition
├── src/
│   ├── app/              # App Router pages
│   │   ├── (auth)/       # Authentication pages
│   │   ├── api/          # API routes
│   │   └── dashboard/    # Protected dashboard routes
│   ├── components/       # Reusable UI components
│   ├── lib/              # Utility functions and configurations
│   │   ├── auth.ts       # Authentication configuration
│   │   ├── db.ts         # Database client
│   │   └── gemini.ts     # AI service
│   └── store/            # State management
└── tests/                # Test files
```

