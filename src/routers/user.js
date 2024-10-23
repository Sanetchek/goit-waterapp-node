import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import controllerWrapper from '../utils/controllerWrapper.js';
import isValidId from '../middlewares/isValidid.js';
import authenticate from '../middlewares/authenticate.js';
import upload from '../middlewares/upload.js';
// import validateBody from '../utils/validateBody.js';

const userRouter = Router();

userRouter.use(authenticate);

userRouter.get(
  '/:id',
  isValidId,
  controllerWrapper(userController.getUserByIdController),
);

userRouter.put(
  '/:id',
  isValidId,
  controllerWrapper(userController.upsertUserController),
);

userRouter.patch(
  '/:id',
  upload.single('avatar'),
  isValidId,
  controllerWrapper(userController.patchUserController),
);

export default userRouter;
