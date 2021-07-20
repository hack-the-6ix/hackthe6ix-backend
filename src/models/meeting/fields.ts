import mongoose from 'mongoose';
import { ReadCheckRequest, WriteCheckRequest, DeleteCheckRequest, CreateCheckRequest } from '../../types/checker';
import { isOrganizer } from '../validator';
/*
name
*/
export const fields = {
    createCheck: (request: CreateCheckRequest<any, IMeeting>) => isOrganizer(request.requestUser),
    readCheck: (request: ReadCheckRequest<IMeeting>) => isOrganizer(request.requestUser),
    deleteCheck: (request: DeleteCheckRequest<IMeeting>) => isOrganizer(request.requestUser),
    writeCheck: (request: WriteCheckRequest<any, IMeeting>) => isOrganizer(request.requestUser),
    FIELDS: {
        name: {
            type: String,
            required: true,
            readCheck: true,
            writeCheck: true,
        },
        description: {
            type: String,
            readCheck: true,
            writeCheck: true,
        },
        dateTime: {
            type: Number,
            readCheck: true,
            writeCheck: true,
        }
    }
}

export interface IMeeting extends mongoose.Document {
    name: string,
    description?: string,
    dateTime?: number
}