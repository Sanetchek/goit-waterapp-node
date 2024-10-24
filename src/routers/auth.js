import { Router } from 'express';
import controllerWrapper from '../utils/controllerWrapper.js';
import validateBody from '../utils/validateBody.js';
import authenticate from '../middlewares/authenticate.js';
import {
  userRegisterSchema,
  userloginSchema,
  sendResetEmailSchema,
  resetPasswordSchema,
} from '../validation/auth.js';
import * as authControllers from '../controllers/auth.js';

const authRouter = Router();

authRouter.use(authenticate);

authRouter.post(
  '/register',
  validateBody(userRegisterSchema),
  controllerWrapper(authControllers.registerController),
);

authRouter.post(
  '/login',
  validateBody(userloginSchema),
  controllerWrapper(authControllers.loginController),
);

authRouter.post(
  '/refresh',
  controllerWrapper(authControllers.refreshController),
);

authRouter.post('/logout', controllerWrapper(authControllers.logoutController));

authRouter.post(
  '/send-reset-email',
  validateBody(sendResetEmailSchema),
  controllerWrapper(authControllers.sendResetEmailController),
);

authRouter.post(
  '/reset-pwd',
  validateBody(resetPasswordSchema),
  controllerWrapper(authControllers.resetPasswordController),
);

export default authRouter;
