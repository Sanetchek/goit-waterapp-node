import express from "express";

import {
    updateWaterRate,
    addWaterNote,
    updateWaterNote,
    deleteWaterNote
} from "../controllers/waters.js";

import authenticate from "../middlewares/authenticate.js";

import {
    waterRateSchema,
    waterNotesSchema
} from "../validation/waters.js";

import controllerWrapper from "../utils/controllerWrapper.js";
import validateBody from "../utils/validateBody.js";

const waterRouter = express.Router();

waterRouter.patch("/:ownerId/rate", authenticate, validateBody(waterRateSchema), controllerWrapper(updateWaterRate));

waterRouter.post("/:ownerId", authenticate, validateBody(waterNotesSchema), controllerWrapper(addWaterNote));

waterRouter.patch("/:ownerId/note/:waterNoteId", authenticate, validateBody(waterNotesSchema), controllerWrapper(updateWaterNote));

waterRouter.delete("/:ownerId/note/:waterNoteId", authenticate, controllerWrapper(deleteWaterNote));

export default waterRouter;