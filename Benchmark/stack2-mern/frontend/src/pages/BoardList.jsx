import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { boardAPI } from '../services/api';
import './BoardList.css';

function BoardList() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newBoard, setNewBoard] = useState({ title: '', description: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const response = await boardAPI.getAll();
      setBoards(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching boards:', err);
      setError('Failed to load boards');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();

    if (!newBoard.title.trim()) {
      alert('Please enter a board title');
      return;
    }

    try {
      const response = await boardAPI.create(newBoard);
      setBoards([...boards, response.data]);
      setNewBoard({ title: '', description: '' });
      setShowModal(false);
      navigate(`/board/${response.data._id}`);
    } catch (err) {
      console.error('Error creating board:', err);
      alert('Failed to create board');
    }
  };

  const handleDeleteBoard = async (id, e) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this board?')) {
      return;
    }

    try {
      await boardAPI.delete(id);
      setBoards(boards.filter(board => board._id !== id));
    } catch (err) {
      console.error('Error deleting board:', err);
      alert('Failed to delete board');
    }
  };

  const goToBoard = (id) => {
    navigate(`/board/${id}`);
  };

  if (loading) return <div className="loading">Loading boards...</div>;

  return (
    <div className="board-list-container">
      <div className="board-list-header">
        <h2>Your Boards</h2>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          ➕ Create Board
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="boards-grid">
        {boards.map(board => (
          <div
            key={board._id}
            className="board-card"
            onClick={() => goToBoard(board._id)}
          >
            <h3>{board.title} →</h3>
            <p className="board-description">
              {board.description || 'No description'}
            </p>
            <div className="board-meta">
              <span>📋 {board.lists_count || 0} lists</span>
            </div>
            <button
              onClick={(e) => handleDeleteBoard(board._id, e)}
              className="btn-delete"
              title="Delete board"
            >
              🗑️
            </button>
          </div>
        ))}

        {boards.length === 0 && (
          <div className="board-card board-card-empty">
            <p>No boards yet. Create your first board! 🚀</p>
          </div>
        )}
      </div>

      {/* Create Board Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Board</h2>
            <form onSubmit={handleCreateBoard}>
              <div className="form-group">
                <label htmlFor="title">Board Title *</label>
                <input
                  type="text"
                  id="title"
                  value={newBoard.title}
                  onChange={(e) => setNewBoard({ ...newBoard, title: e.target.value })}
                  placeholder="Enter board title"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={newBoard.description}
                  onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
                  placeholder="Enter board description (optional)"
                  rows="3"
                />
              </div>

              <div className="modal-buttons">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BoardList;
