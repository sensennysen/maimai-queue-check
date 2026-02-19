# 🎵 Maimai Queue Management System

A React-based queue management system designed specifically for maimai rhythm game sessions. This application allows players to manage game queues efficiently with an intuitive, responsive interface.

![Maimai Queue System](https://img.shields.io/badge/React-18.3.1-61dafb) ![Vite](https://img.shields.io/badge/Vite-7.3.1-646cff) ![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Key Features

- **Queue Management**: Real-time synchronization, reordering, and "Now Playing" timer.
- **Branch & Location**: Multi-branch support with geolocation-based access.
- **Multi-Cabinet Support**: Independent queues for arcades with multiple machines.
- **Authentication**: Secure Google OAuth for management access.
- **Design**: Modern Maimai DX-inspired theme with Dark/Light mode.

## 🚀 Getting Started

1. **Clone & Install**:
   ```bash
   git clone https://github.com/your-username/smf-queue-check.git
   cd smf-queue-check
   npm install
   ```
2. **Setup Env**: Copy `.env.example` to `.env` and add your Supabase credentials.
3. **Run**: `npm run dev`

## 🕹️ How to Use

- **Players**: Select your branch, join the queue, and track your position live.
- **Managers**: Log in to manage entries, start/end games, and clear queues.
- **Admins**: Access the dashboard to manage branches, schedules, and cabinets.

## 🛠️ Stack

- **Frontend**: React 19, Vite 7, Mantine UI, CSS3.
- **Backend**: Supabase (Auth, DB, Real-time).

## 📄 License & Credits

Licensed under the MIT License. Designed for the rhythm gaming community.
