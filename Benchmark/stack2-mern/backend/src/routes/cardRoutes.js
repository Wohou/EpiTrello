import express from 'express';
import {
  getAllCards,
  getCard,
  createCard,
  updateCard,
  deleteCard
} from '../controllers/cardController.js';

const router = express.Router({ mergeParams: true });

router.get('/', getAllCards);
router.get('/:id', getCard);
router.post('/', createCard);
router.put('/:id', updateCard);
router.delete('/:id', deleteCard);

export default router;
