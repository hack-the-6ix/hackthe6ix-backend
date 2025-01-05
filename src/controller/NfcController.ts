import { mongoose } from "../services/mongoose_service";

const NfcSchema = new mongoose.Schema({
    nfcId: { type: String, required: true },
    userId: { type: String, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

const NfcModel = mongoose.model('nfc-user-assignments', NfcSchema);

const UserModel = mongoose.model('User');

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

export const deleteAssignmentByNfc = async (nfcId: string) => {
    if (!nfcId) {
        console.log('nfcId is required');
        throw new Error('nfcId is required');
    }

    try {
        await NfcModel.deleteOne({ nfcId: nfcId });
        console.log(`NFC assignment with nfcId ${nfcId} deleted successfully`);
    } catch (error: any) {
        console.log(error);
        throw new Error(`Error deleting document: ${error.message}`);
    }
}

export const deleteAssignmentByUser = async (userId: string) => {
    if (!userId) {
        console.log('userId is required');
        throw new Error('userId is required');
    }

    try {
        await NfcModel.deleteOne({ userId: userId });
        console.log(`NFC assignment with userId ${userId} deleted successfully`);
    } catch (error: any) {
        console.log(error);
        throw new Error(`Error deleting document: ${error.message}`);
    }
}

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

export const getUserFromNfcId = async (nfcId: string) => {
    if (!nfcId) {
        console.log('nfcId is required');
        throw new Error('nfcId is required');
    }

    const userId = await getUserIdFromNfcId(nfcId);
    if (!userId) {
        console.log('No user found for the given nfcId');
        return null;
    }

    try {
        const user = await UserModel.findById(userId);
        return user;
    } catch (error: any) {
        console.log(error);
        throw new Error(`Error finding user: ${error.message}`);
    }

}
