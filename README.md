# 🎵 Maimai Queue Management System

A React-based queue management system designed specifically for maimai rhythm game sessions. This application allows players to manage game queues efficiently with an intuitive, responsive interface.

![Maimai Queue System](https://img.shields.io/badge/React-18.3.1-61dafb) ![Vite](https://img.shields.io/badge/Vite-7.3.1-646cff) ![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

- **Add Queue Entries**: Create new queue entries with Player 1 and Player 2 names
- **Edit Entries**: Modify existing queue entries in real-time
- **Reorder Queue**: Move entries up or down in the queue
- **Remove Entries**: Delete individual entries with confirmation
- **Clear Queue**: Clear all entries at once with confirmation
- **Visual Feedback**: Special highlighting for the next players up
- **Responsive Design**: Works seamlessly on mobile and desktop devices
- **Form Validation**: Ensures all required fields are filled

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

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173/`

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

1. **Add Players**: Enter Player 1 and Player 2 names in the form and click "Add to Queue"
2. **Edit Entry**: Click the edit button (✏️) on any queue item to modify player names
3. **Reorder**: Use the up (↑) and down (↓) buttons to change queue order
4. **Remove Entry**: Click the delete button (🗑️) to remove a specific entry
5. **Clear All**: Use the "Clear All" button to empty the entire queue

## 🛠️ Built With

- **React 18** - Frontend framework
- **Vite** - Build tool and development server
- **CSS3** - Styling with modern features
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
