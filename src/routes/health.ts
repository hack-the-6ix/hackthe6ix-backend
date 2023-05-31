import express, {Request, Response} from "express";

import {isConnected} from "../services/mongoose_service";

const healthRouter = express.Router();

healthRouter.get('/live', (req: Request, res: Response) => {
    return res.status(204).end();
})

healthRouter.get('/ready', (req: Request, res:Response) => {
    if(isConnected()) {
        return res.status(204).end();
    }
    return res.status(503).end();
})

export default healthRouter;