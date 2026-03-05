import QrGenerator from './components/QrGenerator'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">QRni</h1>
        <p className="tagline">Turn any link into a QR code — instantly</p>
      </header>

      <main className="card">
        <QrGenerator />
      </main>

      <footer className="footer">
        <p>Made with fun by QRni</p>
      </footer>
    </div>
  )
}

export default App
