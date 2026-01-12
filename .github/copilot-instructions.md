# Maimai Queue Management System

This is a React-based queue management system for maimai rhythm game sessions. Players can manage queues for games with the following features:

## Features
- Add new queue entries with Player 1 and Player 2 names
- Edit existing queue entries
- Reorder queue entries (move up/down)
- Remove individual entries from queue
- Clear entire queue
- Real-time visual feedback for next player up

## Project Structure
- Built with React + Vite for fast development
- Component-based architecture
- Responsive design for mobile and desktop
- Clean, modern UI with maimai-inspired styling

## Components
- QueueManager: Main container component with state management
- QueueForm: Form for adding/editing entries with validation
- QueueList: Display container for the queue
- QueueItem: Individual queue entry with controls

## Development
Use `npm run dev` to start the development server.
The application will be available at http://localhost:5173/