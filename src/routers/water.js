import express from "express";

import { updateWaterRate } from "../controllers/waters.js";

import authenticate from "../middlewares/authenticate.js";

import { waterRateSchema } from "../validation/waters.js";

import controllerWrapper from "../utils/controllerWrapper.js";
import validateBody from "../utils/validateBody.js";

const waterRouter = express.Router();

waterRouter.patch("/rate", authenticate, validateBody(waterRateSchema), controllerWrapper(updateWaterRate));

export default waterRouter;