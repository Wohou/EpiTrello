import List from '../models/List.js';
import Card from '../models/Card.js';

export const getAllLists = async (req, res) => {
  try {
    const lists = await List.find({ board: req.params.boardId })
      .sort({ position: 1 })
      .populate('cards_count');
    res.json(lists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id)
      .populate({
        path: 'cards',
        options: { sort: { position: 1 } }
      });

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createList = async (req, res) => {
  try {
    const { title, position } = req.body;
    const { boardId } = req.params;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const list = new List({
      title,
      position: position || 0,
      board: boardId
    });

    const savedList = await list.save();
    res.status(201).json(savedList);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateList = async (req, res) => {
  try {
    const { title, position } = req.body;
    const list = await List.findByIdAndUpdate(
      req.params.id,
      { title, position },
      { new: true, runValidators: true }
    );

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    res.json(list);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteList = async (req, res) => {
  try {
    const list = await List.findByIdAndDelete(req.params.id);

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    // Delete all cards in this list
    await Card.deleteMany({ list: req.params.id });

    res.json({ message: 'List deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
