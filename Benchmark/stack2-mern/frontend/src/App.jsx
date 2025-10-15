import { Routes, Route } from 'react-router-dom';
import BoardList from './pages/BoardList';
import BoardView from './pages/BoardView';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>EpiTrello - Stack 2 (MERN)</h1>
        <p className="stack-info">React + Express + MongoDB</p>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<BoardList />} />
          <Route path="/board/:id" element={<BoardView />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
