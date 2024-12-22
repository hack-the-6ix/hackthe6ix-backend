import { mongoose } from "../services/mongoose_service";

const NfcSchema = new mongoose.Schema({
    nfcId: { type: String, required: true },
    userId: { type: String, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

const NfcModel = mongoose.model('nfc-user-assignments', NfcSchema);

export const assignNFCToUser = async (nfcId: string, userId: string) => {
    if (!nfcId || !userId) {
        console.log('nfcId and userId are required');
        throw new Error('nfcId and userId are required');
    }

    try {
        const newAssignment = new NfcModel({
            nfcId: nfcId,
            userId: userId,
            createdAt: new Date()
        });

        const savedAssignment = await newAssignment.save();
        return savedAssignment;
    } catch (error: any) {
        console.log(error);
        throw new Error(`Error saving document: ${error.message}`);
    }
};


export const getUserIdFromNfcId = async (nfcId: string) => {
    if (!nfcId) {
        console.log('nfcId is required');
        throw new Error('nfcId is required');
    }

    try {
        const assignment = await NfcModel.findOne({ nfcId: nfcId });
        return assignment?.userId;
    } catch (error: any) {
        console.log(error);
        throw new Error(`Error finding document: ${error.message}`);
    }
};
