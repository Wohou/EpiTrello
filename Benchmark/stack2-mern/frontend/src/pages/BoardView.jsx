import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { boardAPI, listAPI, cardAPI } from '../services/api';
import './BoardView.css';

function BoardView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showListModal, setShowListModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedListId, setSelectedListId] = useState(null);
  const [newList, setNewList] = useState({ title: '' });
  const [newCard, setNewCard] = useState({ title: '', description: '' });

  useEffect(() => {
    fetchBoard();
  }, [id]);

  const fetchBoard = async () => {
    try {
      setLoading(true);
      const response = await boardAPI.getOne(id);
      setBoard(response.data);
      setLists(response.data.lists || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching board:', err);
      setError('Failed to load board');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();

    if (!newList.title.trim()) {
      alert('Please enter a list title');
      return;
    }

    try {
      const response = await listAPI.create(id, {
        title: newList.title,
        position: lists.length
      });
      setLists([...lists, { ...response.data, cards: [] }]);
      setNewList({ title: '' });
      setShowListModal(false);
    } catch (err) {
      console.error('Error creating list:', err);
      alert('Failed to create list');
    }
  };

  const handleDeleteList = async (listId, e) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this list and all its cards?')) {
      return;
    }

    try {
      await listAPI.delete(listId);
      setLists(lists.filter(list => list._id !== listId));
    } catch (err) {
      console.error('Error deleting list:', err);
      alert('Failed to delete list');
    }
  };

  const openCardModal = (listId) => {
    setSelectedListId(listId);
    setShowCardModal(true);
  };

  const handleCreateCard = async (e) => {
    e.preventDefault();

    if (!newCard.title.trim()) {
      alert('Please enter a card title');
      return;
    }

    try {
      const list = lists.find(l => l._id === selectedListId);
      const cardCount = list?.cards?.length || 0;

      const response = await cardAPI.create(selectedListId, {
        title: newCard.title,
        description: newCard.description,
        position: cardCount
      });

      setLists(lists.map(list => {
        if (list._id === selectedListId) {
          return {
            ...list,
            cards: [...(list.cards || []), response.data]
          };
        }
        return list;
      }));

      setNewCard({ title: '', description: '' });
      setShowCardModal(false);
      setSelectedListId(null);
    } catch (err) {
      console.error('Error creating card:', err);
      alert('Failed to create card');
    }
  };

  const handleDeleteCard = async (listId, cardId, e) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this card?')) {
      return;
    }

    try {
      await cardAPI.delete(cardId);
      setLists(lists.map(list => {
        if (list._id === listId) {
          return {
            ...list,
            cards: list.cards.filter(card => card._id !== cardId)
          };
        }
        return list;
      }));
    } catch (err) {
      console.error('Error deleting card:', err);
      alert('Failed to delete card');
    }
  };

  if (loading) return <div className="loading">Loading board...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!board) return <div className="error">Board not found</div>;

  return (
    <div className="board-view-container">
      <div className="board-view-header">
        <button onClick={() => navigate('/')} className="btn btn-back">
          ← Back to Boards
        </button>
        <h2>{board.title}</h2>
        {board.description && <p className="board-description">{board.description}</p>}
      </div>

      <div className="lists-container">
        {lists.map(list => (
          <div key={list._id} className="list">
            <div className="list-header">
              <h3>{list.title}</h3>
              <button
                onClick={(e) => handleDeleteList(list._id, e)}
                className="btn-delete-list"
                title="Delete list"
              >
                🗑️
              </button>
            </div>

            <div className="cards-container">
              {list.cards && list.cards.map(card => (
                <div key={card._id} className="card">
                  <h4>{card.title}</h4>
                  {card.description && (
                    <p className="card-description">{card.description}</p>
                  )}
                  <button
                    onClick={(e) => handleDeleteCard(list._id, card._id, e)}
                    className="btn-delete-card"
                    title="Delete card"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => openCardModal(list._id)}
              className="btn btn-add-card"
            >
              ➕ Add Card
            </button>
          </div>
        ))}

        <div className="list list-add">
          <button onClick={() => setShowListModal(true)} className="btn btn-add-list">
            ➕ Add List
          </button>
        </div>
      </div>

      {/* Create List Modal */}
      {showListModal && (
        <div className="modal-overlay" onClick={() => setShowListModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New List</h2>
            <form onSubmit={handleCreateList}>
              <div className="form-group">
                <label htmlFor="list-title">List Title *</label>
                <input
                  type="text"
                  id="list-title"
                  value={newList.title}
                  onChange={(e) => setNewList({ title: e.target.value })}
                  placeholder="Enter list title"
                  autoFocus
                />
              </div>

              <div className="modal-buttons">
                <button type="button" onClick={() => setShowListModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Card Modal */}
      {showCardModal && (
        <div className="modal-overlay" onClick={() => setShowCardModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Card</h2>
            <form onSubmit={handleCreateCard}>
              <div className="form-group">
                <label htmlFor="card-title">Card Title *</label>
                <input
                  type="text"
                  id="card-title"
                  value={newCard.title}
                  onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                  placeholder="Enter card title"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="card-description">Description</label>
                <textarea
                  id="card-description"
                  value={newCard.description}
                  onChange={(e) => setNewCard({ ...newCard, description: e.target.value })}
                  placeholder="Enter card description (optional)"
                  rows="3"
                />
              </div>

              <div className="modal-buttons">
                <button type="button" onClick={() => setShowCardModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BoardView;
