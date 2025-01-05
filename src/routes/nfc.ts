import express, {Request, Response} from "express";

import { isConnected } from "../services/mongoose_service";

import { assignNFCToUser, getUserIdFromNfcId, deleteAssignmentByNfc, deleteAssignmentByUser } from "../controller/NfcController";

import { isVolunteer } from "../models/validator";

const nfcRouter = express.Router();

nfcRouter.post('/assign', async (req: Request, res: Response) => {
    try {
        await assignNFCToUser(req.body.nfcId, req.body.userId);
        return res.status(200).json({ message: 'NFC assigned successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to assign NFC Id' });
    }
});

nfcRouter.get('/getUserId/:nfcId', async (req: Request, res: Response) => {
    try {
        const userId = await getUserIdFromNfcId(req.params.nfcId);
        return res.status(200).json({ userId });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to get user Id' });
    }
});

nfcRouter.delete('/deleteAssignmentByNfc/:nfcId', async (req: Request, res: Response) => {
    try {
        await deleteAssignmentByNfc(req.params.nfcId);
        return res.status(200).json({ message: 'NFC assignment deleted successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to delete assignment' });
    }
});

nfcRouter.delete('/deleteAssignmentByUser/:userId', async (req: Request, res: Response) => {
    try {
        await deleteAssignmentByUser(req.params.userId);
        return res.status(200).json({ message: 'NFC assignment deleted successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to delete assignment' });
    }
});

nfcRouter.get('/test', (req: Request, res: Response) => { 
    return res.json({test: 'true'})
})

export default nfcRouter;
