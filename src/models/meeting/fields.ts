import mongoose from 'mongoose';
import { ReadCheckRequest } from '../../types/checker';
import { IUser } from '../user/fields';
import { isOrganizer } from '../validator';
/*
name
*/
export const fields = {
    createCheck: (request: ReadCheckRequest<IUser>) => isOrganizer(request.requestUser),
    deleteCheck: (request: ReadCheckRequest<IUser>) => isOrganizer(request.requestUser),
    writeCheck: (request: ReadCheckRequest<IUser>) => isOrganizer(request.requestUser),
    FIELDS: {
        name: {
            type: String,
            required: true,
            readCheck: true,
            writeCheck: true,
        }
    }
}

export interface IMeeting extends mongoose.Document {
    name: string
}