import express from 'express';

import {
    updateWaterRate,
    addWaterNote,
    updateWaterNote,
    deleteWaterNote,
    getTodayWaterConsumption
} from "../controllers/waters.js";

import authenticate from '../middlewares/authenticate.js';

import { waterRateSchema, waterNotesSchema } from '../validation/waters.js';

import controllerWrapper from '../utils/controllerWrapper.js';
import validateBody from '../utils/validateBody.js';

const waterRouter = express.Router();

waterRouter.patch("/rate", authenticate, validateBody(waterRateSchema), controllerWrapper(updateWaterRate));

waterRouter.post("/", authenticate, validateBody(waterNotesSchema), controllerWrapper(addWaterNote));

waterRouter.patch("/:waterNoteId", authenticate, validateBody(waterNotesSchema), controllerWrapper(updateWaterNote));

waterRouter.delete("/:waterNoteId", authenticate, controllerWrapper(deleteWaterNote));

waterRouter.get("/today", authenticate, controllerWrapper(getTodayWaterConsumption));

export default waterRouter;
