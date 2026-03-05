import QrGenerator from './components/QrGenerator'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">QRni</h1>
        <p className="tagline">Your free, instant QR code maker — no sign-up needed!</p>
      </header>

      <main className="card">
        <div className="card-titlebar">
          <span className="dot dot-close"></span>
          <span className="dot dot-minimize"></span>
          <span className="dot dot-maximize"></span>
        </div>
        <div className="card-body">
          <QrGenerator />
        </div>
      </main>

      <footer className="footer">
        <p className="powered-by">
          Powered by
          <a href="https://imbensantos.com" target="_blank" rel="noopener noreferrer">
            <img src="/imbento-logo-white.svg" alt="imBento" className="imbento-logo" />
          </a>
        </p>
      </footer>
    </div>
  )
}

export default App
