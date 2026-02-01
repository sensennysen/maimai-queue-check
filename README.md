# 🎵 Maimai Queue Management System

A React-based queue management system designed specifically for maimai rhythm game sessions. This application allows players to manage game queues efficiently with an intuitive, responsive interface.

![Maimai Queue System](https://img.shields.io/badge/React-18.3.1-61dafb) ![Vite](https://img.shields.io/badge/Vite-7.3.1-646cff) ![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### Queue Management
- **Add Queue Entries**: Create queue entries with player names
- **Edit Entries**: Modify existing queue entries in real-time
- **Reorder Queue**: Organize queue order with up/down controls
- **Remove Entries**: Delete individual entries with confirmation
- **Clear Queue**: Clear all entries at once
- **Live Updates**: Real-time synchronization across all connected clients
- **Now Playing**: Visual feedback for active game sessions with timer

### Authentication & Access Control
- **Google Authentication**: Secure login to control queue management access
- **Role-Based Permissions**: Admin and editor roles for different access levels
- **Session Persistence**: Stay logged in across browser refreshes

### Branch & Location Management
- **Multi-Branch Support**: Switch between different arcade locations
- **Geolocation**: Location-based access restriction (~100m radius)
- **Branch Manager**: Admin interface for managing branches
- **Schedule Management**: Configure operating hours for each branch

### Multi-Cabinet Support
- **Cabinet Tabs**: Separate queue management for arcades with multiple cabinets
- **Cabinet-Specific Operations**: Independent queue control per cabinet

### Design & UX
- **Maimai DX Theme**: Beautiful gradient design inspired by the game
- **Dark/Light Mode**: Toggle between themes
- **Responsive Design**: Works seamlessly on mobile and desktop
- **Real-time Feedback**: Instant updates and smooth animations

## 🚀 Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/smf-queue-check.git
cd smf-queue-check
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Then edit `.env` and add your Supabase credentials.

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173/`

## 🏗️ Project Structure

```
src/
├── components/
│   ├── QueueManager.jsx      # Main container component
│   ├── QueueManager.css      # Styling for queue manager
│   ├── QueueForm.jsx         # Form for adding/editing entries
│   ├── QueueForm.css         # Form styling
│   ├── QueueList.jsx         # Queue display container
│   ├── QueueList.css         # List styling
│   ├── QueueItem.jsx         # Individual queue entry
│   └── QueueItem.css         # Item styling
├── App.jsx                   # Main application component
├── App.css                   # App styling
├── main.jsx                  # Application entry point
└── index.css                 # Global styles
```

## 🎮 How to Use

### For Players
1. **Select Branch**: Choose your arcade location from the dropdown
2. **Join Queue**: Enter your player name and optional partner name
3. **Track Position**: Monitor your position in the queue with real-time updates
4. **View Timer**: See how long the current game has been playing

### For Queue Managers (Authenticated Users)
1. **Login**: Click the login button and authenticate with Google
2. **Manage Queue**: Add, edit, remove, or reorder queue entries
3. **Start/End Games**: Control when games start and end
4. **Clear Queue**: Clear all entries if needed
5. **Switch Cabinets**: Manage multiple cabinets independently (if applicable)

### For Admins
1. **Access Admin Panel**: Click the admin button after logging in
2. **Manage Branches**: Add, edit, or remove arcade locations
3. **Set Schedules**: Configure operating hours for each branch
4. **Configure Cabinets**: Set the number of cabinets per location

## 🛠️ Built With

- **React 19** - Frontend framework with latest features
- **Vite 7** - Build tool and development server
- **Supabase** - Backend-as-a-Service for authentication, database, and real-time subscriptions
- **Mantine UI** - Modern React component library
- **Google OAuth** - Secure authentication
- **CSS3** - Styling with modern features and Maimai DX theme
- **JavaScript ES6+** - Modern JavaScript features

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Design Features

- **Gradient Background**: Beautiful gradient background for modern appeal
- **Maimai-inspired Colors**: Color scheme inspired by the maimai game
- **Responsive Layout**: Adapts to different screen sizes
- **Smooth Animations**: CSS transitions for better user experience
- **Visual Hierarchy**: Clear distinction between different queue positions

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the maimai rhythm game series
- Built with modern React patterns and best practices
- Designed for arcade and community gaming environments
