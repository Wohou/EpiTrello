import express from 'express';
import {
  getAllLists,
  getList,
  createList,
  updateList,
  deleteList
} from '../controllers/listController.js';

const router = express.Router({ mergeParams: true });

router.get('/', getAllLists);
router.get('/:id', getList);
router.post('/', createList);
router.put('/:id', updateList);
router.delete('/:id', deleteList);

export default router;
