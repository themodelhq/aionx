# AionX - Next Generation AI Creative Platform

Create stunning images, videos, and audio with AI that understands your vision.

![AionX Banner](https://via.placeholder.com/1200x400/0a0a0f/00d4ff?text=AionX)

## Features

- **Image Generation** - Create stunning visuals from text descriptions
- **Video Creation** - Transform images into dynamic videos or generate from prompts
- **Text-to-Speech** - Convert text to natural-sounding audio with multiple voice options
- **AI Chat** - Creative conversations with AI that understands your vision
- **User Authentication** - Secure JWT-based authentication with SQLite database
- **Credits System** - Track usage with built-in credits
- **Premium Mode** - Unlimited generations for Pro users

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/aionx.git
cd aionx

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

Visit http://localhost:3000

### Demo Account

```
Email: demo@aionx.ai
Password: demo123
```

## Deployment

### Netlify

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Netlify will automatically detect the configuration from `netlify.toml`
4. Add environment variables in Netlify dashboard:
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `API_URL` (your backend URL)

### Render

1. Push your code to GitHub
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Render will use `render.yaml` for configuration
5. Add the following environment variables:
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`

For persistent SQLite storage, Render will automatically create disks specified in `render.yaml`.

### Manual Deployment

```bash
# Build for production
npm run build

# The built files will be in the 'public' directory
# Start the production server
npm start
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Get current user |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get user profile |
| PUT | `/api/users/profile` | Update profile |
| PUT | `/api/users/password` | Change password |
| POST | `/api/users/credits` | Add credits |

### Generations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/generations` | List generations |
| POST | `/api/generations/image` | Generate image |
| POST | `/api/generations/video` | Generate video |
| POST | `/api/generations/audio` | Generate audio |
| DELETE | `/api/generations/:id` | Delete generation |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message |
| GET | `/api/chat/history` | Get chat history |

## Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Zustand
- React Router

**Backend:**
- Node.js
- Express
- SQLite (better-sqlite3)
- JWT Authentication
- bcryptjs

## Project Structure

```
aionx/
├── api/                    # Backend API
│   ├── routes/            # API routes
│   ├── middleware/        # Auth, error handling
│   ├── services/         # AI generation services
│   ├── models/           # Database models
│   └── utils/            # Helpers, config
├── src/                   # Frontend React app
│   ├── components/       # UI components
│   ├── pages/            # Page components
│   ├── store/            # Zustand stores
│   ├── types/            # TypeScript types
│   └── utils/            # API utilities
├── public/               # Static assets
├── data/                 # SQLite database
├── uploads/              # User uploads
├── netlify.toml          # Netlify config
└── render.yaml           # Render config
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | development |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_REFRESH_SECRET` | Refresh token secret | Required |
| `FRONTEND_URL` | CORS origin | http://localhost:3000 |

### Credits System

| Action | Credits |
|--------|---------|
| Image Generation | 2 |
| Video Generation | 5 |
| Audio Generation | 1 |
| Chat | 0 |
| New User | 100 |

## Development

```bash
# Run both frontend and backend
npm run dev

# Run backend only
cd api && npm install && npm start

# Run frontend only
cd src && npm install && npm run dev
```

## License

MIT License - See LICENSE file for details

## Support

For issues and feature requests, please open a GitHub issue.

---

Built with passion by the AionX Team
