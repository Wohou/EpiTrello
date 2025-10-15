import Board from '../models/Board.js';
import List from '../models/List.js';
import Card from '../models/Card.js';

export const getAllBoards = async (req, res) => {
  try {
    const boards = await Board.find().populate('lists_count');
    res.json(boards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Get all lists for this board with their cards
    const lists = await List.find({ board: board._id })
      .sort({ position: 1 })
      .populate({
        path: 'cards',
        options: { sort: { position: 1 } }
      });

    const boardData = board.toObject();
    boardData.lists = lists;

    res.json(boardData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createBoard = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const board = new Board({ title, description });
    const savedBoard = await board.save();

    res.status(201).json(savedBoard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateBoard = async (req, res) => {
  try {
    const { title, description } = req.body;
    const board = await Board.findByIdAndUpdate(
      req.params.id,
      { title, description },
      { new: true, runValidators: true }
    );

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    res.json(board);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findByIdAndDelete(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Delete all lists and cards associated with this board
    const lists = await List.find({ board: req.params.id });
    const listIds = lists.map(list => list._id);

    // Delete all cards in these lists
    await Card.deleteMany({ list: { $in: listIds } });

    // Delete all lists
    await List.deleteMany({ board: req.params.id });

    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
