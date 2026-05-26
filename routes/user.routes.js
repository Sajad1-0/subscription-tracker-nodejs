import { Router } from 'express';
import { getAllUsers, getUserById } from '../controllers/user.controller.js';
import { authorizeUser } from '../middlewares/auth.middleware.js';

const userRouter = Router();

userRouter.get('/', getAllUsers);

userRouter.get('/:id', authorizeUser, getUserById);

userRouter.post('/', (req, res) => res.send({ title: 'CREATE new users' }));

userRouter.put('/:id', (req, res) => res.send({ title: 'UPDATE user details' }));

userRouter.delete('/:id', (req, res) => res.send({ title: 'DELETE user' }));

export default userRouter;
