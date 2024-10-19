import { Router } from 'express';
import controllerWrapper from '../utils/controllerWrapper.js';
import validateBody from '../utils/validateBody.js';
import { userRegisterloginSchema } from '../validation/auth.js';
import * as authControllers from '../controllers/auth.js';

const authRouter = Router();

authRouter.post(
  '/register',
  validateBody(userRegisterloginSchema),
  controllerWrapper(authControllers.registerController),
);

authRouter.post(
  '/login',
  validateBody(userRegisterloginSchema),
  controllerWrapper(authControllers.loginController),
);

authRouter.post(
  '/refresh',
  controllerWrapper(authControllers.refreshController),
);

authRouter.post('/logout', controllerWrapper(authControllers.logoutController));

export default authRouter;
