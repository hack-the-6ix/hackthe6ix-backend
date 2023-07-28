import mongoose from 'mongoose';
import {
    CreateCheckRequest,
    DeleteCheckRequest,
    ReadCheckRequest,
    WriteCheckRequest,
} from '../../types/checker';
import { isOrganizer } from '../validator';
import {DiscordVerifyInfo} from "../../types/types";

export const fields = {
    createCheck: (request: CreateCheckRequest<any, IQueuedVerification>) => isOrganizer(request.requestUser),
    readCheck: (request: ReadCheckRequest<IQueuedVerification>) => isOrganizer(request.requestUser),
    deleteCheck: (request: DeleteCheckRequest<IQueuedVerification>) => isOrganizer(request.requestUser),
    writeCheck: (request: WriteCheckRequest<any, IQueuedVerification>) => isOrganizer(request.requestUser),
    FIELDS: {
        queuedTime: {
            type: Number,
            required: true,
        },
        processed: {
            type: Boolean,
            required: true,
            default: false
        },
        discordID: {
            type: String,
            required: true
        },
        revert: {
            type: Boolean,
            required: true
        },
        verifyData: {
            type: Object,
            required: true
        }
    },
};

export interface IQueuedVerification extends mongoose.Document {
    queuedTime: number,
    processed: boolean,
    discordID: string,
    revert: boolean,
    verifyData: DiscordVerifyInfo
}
