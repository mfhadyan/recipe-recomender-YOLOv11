# AI Recipe Recommender

An AI-powered recipe recommendation system that detects ingredients from images using YOLO and generates recipe suggestions using Google's Gemini API.

## Features

- 📸 **Image-based ingredient detection** using custom YOLO model
- 🤖 **AI-powered recipe generation** using Gemini API
- 🎯 **Smart ingredient matching** and coverage scoring
- 💻 **Modern Next.js frontend** with Tailwind CSS
- 🚀 **FastAPI backend** with async support

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm (or yarn/pnpm)
- **Python** 3.9 or higher
- **Gemini API key** ([Get one here](https://ai.google.dev/))
- **Custom YOLO model file** (`my_model.pt`) - should be in the `backend` directory

## Getting Started

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd my-app
```

### Step 2: Backend Setup

1. **Navigate to the backend directory:**

   ```bash
   cd backend
   ```

2. **Create a Python virtual environment:**

   ```bash
   python -m venv venv
   ```

   **Activate the virtual environment:**

   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```

3. **Install Python dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Create a `.env` file:**

   ```bash
   # On macOS/Linux
   touch .env

   # On Windows
   type nul > .env
   ```

5. **Configure environment variables:**

   Open the `.env` file and add the following:

   ```env
   # Required: Your Gemini API key
   GEMINI_API_KEY=your_gemini_api_key_here

   # Optional: CORS configuration (defaults to * for development)
   # For development, you can leave this as * or use: http://localhost:3000
   ```

# For production, specify exact origins: https://yourdomain.com,https://www.yourdomain.com

ALLOWED_ORIGINS=\*

   # Optional: Model file path (defaults to my_model.pt in current directory)

   # MODEL_PATH=my_model.pt

````

6. **Verify the model file:**

   Make sure `my_model.pt` is in the `backend` directory. If it's in a different location, set the `MODEL_PATH` variable in your `.env` file.

7. **Start the backend server:**
   ```bash
   uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
````

The API will be available at `http://localhost:8000`

You can verify it's running by visiting:

- API root: http://localhost:8000
- Health check: http://localhost:8000/health
- API docs: http://localhost:8000/docs

### Step 3: Frontend Setup

1. **Navigate to the project root** (if you're still in the backend directory):

   ```bash
   cd ..
   ```

2. **Install Node.js dependencies:**

   ```bash
   npm install
   ```

   Or if you prefer yarn or pnpm:

   ```bash
   yarn install
   # or
   pnpm install
   ```

3. **Configure frontend environment variables (optional):**

   Create a `.env.local` file in the project root:

   ```env
   # Optional: Backend API URL (defaults to http://localhost:8000)
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   ```

   **Note:** If you don't create this file, the frontend will default to `http://localhost:8000`.

4. **Start the development server:**

   ```bash
   npm run dev
   ```

   Or with yarn/pnpm:

   ```bash
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser:**

   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## Running the Application

### Development Mode

1. **Terminal 1 - Backend:**

   ```bash
   cd backend
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Terminal 2 - Frontend:**

   ```bash
   npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Production Build

**Frontend:**

```bash
npm run build
npm start
```

**Backend:**

```bash
cd backend
source venv/bin/activate
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

## Project Structure

```
my-app/
├── app/                    # Next.js frontend application
│   ├── components/         # React components
│   │   ├── ImageUploader.js
│   │   ├── IngredientInput.js
│   │   ├── RecipeCard.js
│   │   ├── RecipeCardSkeleton.js
│   │   ├── RecipeDetailModal.js
│   │   └── RecipeList.js
│   ├── globals.css         # Global styles
│   ├── layout.js           # Root layout
│   └── page.js             # Main page
├── backend/                # FastAPI backend
│   ├── __init__.py
│   ├── gemini_client.py    # Gemini API client
│   ├── ingredient_normalizer.py
│   ├── main.py             # FastAPI application
│   ├── model.py            # YOLO model integration
│   ├── requirements.txt    # Python dependencies
│   ├── venv/               # Python virtual environment (gitignored)
│   └── my_model.pt         # Custom YOLO model file
├── public/                 # Static assets
├── package.json            # Node.js dependencies
├── next.config.mjs         # Next.js configuration
└── README.md               # This file
```

## Troubleshooting

### Backend Issues

**Problem: `ModuleNotFoundError` or import errors**

- Solution: Make sure you've activated the virtual environment and installed all dependencies:
  ```bash
  cd backend
  source venv/bin/activate
  pip install -r requirements.txt
  ```

**Problem: `GEMINI_API_KEY` not found**

- Solution: Create a `.env` file in the `backend` directory with your API key:
  ```env
  GEMINI_API_KEY=your_actual_api_key_here
  ```

**Problem: Model file not found**

- Solution: Ensure `my_model.pt` is in the `backend` directory, or set `MODEL_PATH` in your `.env` file.

**Problem: Port 8000 already in use**

- Solution: Either stop the process using port 8000, or run the backend on a different port:
  ```bash
  uvicorn backend.main:app --reload --port 8001
  ```
  Then update `NEXT_PUBLIC_API_BASE_URL` in your frontend `.env.local` file.

### Frontend Issues

**Problem: Cannot connect to backend API**

- Solution:
  1. Verify the backend is running on `http://localhost:8000`
  2. Check that `NEXT_PUBLIC_API_BASE_URL` in `.env.local` matches your backend URL
  3. Check browser console for CORS errors

**Problem: `npm install` fails**

- Solution: Try clearing the cache and reinstalling:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

**Problem: Port 3000 already in use**

- Solution: Next.js will automatically use the next available port, or you can specify one:
  ```bash
  npm run dev -- -p 3001
  ```

## Environment Variables Reference

### Backend (`.env` in `backend/` directory)

| Variable          | Required | Default      | Description                                  |
| ----------------- | -------- | ------------ | -------------------------------------------- |
| `GEMINI_API_KEY`  | Yes      | -            | Your Google Gemini API key                   |
| `ALLOWED_ORIGINS` | No       | `*`          | Comma-separated list of allowed CORS origins |
| `MODEL_PATH`      | No       | `my_model.pt` | Path to the YOLO model file                  |

### Frontend (`.env.local` in project root)

| Variable                   | Required | Default                 | Description          |
| -------------------------- | -------- | ----------------------- | -------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | No       | `http://localhost:8000` | Backend API base URL |

## API Endpoints

- `GET /` - API information
- `GET /health` - Health check endpoint
- `GET /ingredients/autocomplete?query=<ingredient>` - Ingredient autocomplete
- `POST /recommend` - Generate recipe recommendations from image and ingredients

See http://localhost:8000/docs for interactive API documentation.

## Technologies Used

- **Frontend:**
  - Next.js 16
  - React 19
  - Tailwind CSS 4
- **Backend:**
  - FastAPI
  - Python 3.9+
  - Custom YOLO model (Ultralytics)
  - Google Gemini API
  - Pillow (PIL)

## Deployment

This application can be deployed to production. Since it consists of a Next.js frontend and a Python backend with a large ML model, they need to be deployed separately:

- **Frontend**: Deploy on [Vercel](https://vercel.com) (native Next.js support)
- **Backend**: Deploy on [Railway](https://railway.app), [Render](https://render.com), or [Fly.io](https://fly.io)

### Quick Start

1. **Deploy Frontend to Vercel**:

   - Push your code to GitHub
   - Import the repository in [Vercel Dashboard](https://vercel.com/dashboard)
   - Add environment variable: `NEXT_PUBLIC_API_BASE_URL` (set after backend deployment)
   - Deploy

2. **Deploy Backend**:

   - Choose a platform (Railway recommended)
   - Set root directory to `backend`
   - Add environment variables: `GEMINI_API_KEY` and `ALLOWED_ORIGINS`
   - Deploy

3. **Connect Services**:
   - Update `NEXT_PUBLIC_API_BASE_URL` in Vercel with your backend URL
   - Update `ALLOWED_ORIGINS` in backend with your Vercel frontend URL

### Detailed Deployment Guide

For comprehensive step-by-step instructions, see **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

The deployment guide covers:

- ✅ Frontend deployment on Vercel (Dashboard & CLI methods)
- ✅ Backend deployment on Railway, Render, and Fly.io
- ✅ Environment variable configuration
- ✅ CORS setup
- ✅ Troubleshooting common issues
- ✅ Post-deployment checklist

## License

[Add your license information here]

## Contributing

[Add contribution guidelines here]

## Support

If you encounter any issues or have questions, please [open an issue](link-to-issues) or contact the maintainers.
