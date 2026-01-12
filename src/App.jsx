import { useState } from 'react'
import './App.css'
import QueueManager from './components/QueueManager'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>🎵 Maimai Queue System</h1>
        <p>Manage your maimai game queue with ease!</p>
      </header>
      <main>
        <QueueManager />
      </main>
    </div>
  )
}

export default App
