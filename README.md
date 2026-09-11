# RB — Resume Builder & Career Networking Platform

This is a monorepo for the RB application, containing both the frontend client and the backend server.

## Project Structure

- `/client` - React + Vite + Tailwind CSS frontend
- `/server` - Node.js + Express + MongoDB backend

## Getting Started

1. Navigate to the `/client` directory and install dependencies: `npm install`
2. Navigate to the `/server` directory and install dependencies: `npm install`
3. In the `/server` directory, copy `.env.example` to `.env` and fill in the required values.
4. From the root directory, install root dependencies: `npm install`
5. Start both client and server concurrently from the root directory:
   ```bash
   npm run dev
   ```
