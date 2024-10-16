import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
/* import logger from './middlewares/logger.js';
import swaggerDocs from'./middlewares/swaggerDocs.js';
*/
import { env } from './utils/env.js';

import notFoundHandler from './middlewares/notFoundHandler.js';
import errorHandler from './middlewares/errorHandler.js';

const setupServer = () => {
  const app = express();

  //app.use(logger);  в кінці розкоментувати
  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());

  //app.use('/api-docs', swaggerDocs());
  //app.use('/auth', authRouter);
  //app.use('/water', waterRouter);

  app.use('*', notFoundHandler);
  app.use(errorHandler);

  const PORT = Number(env('PORT', '5050'));
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

export default setupServer;
