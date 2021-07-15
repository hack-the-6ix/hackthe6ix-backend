import mongoose from 'mongoose';
import { ReadCheckRequest } from '../../types/checker';
import { IUser } from '../user/fields';
import { isOrganizer } from '../validator';
/*
meetingID,
userID,
enterTime,
exitTime
*/
export const fields = {
    createCheck: (request: ReadCheckRequest<IUser>) => isOrganizer(request.requestUser),
    deleteCheck: (request: ReadCheckRequest<IUser>) => isOrganizer(request.requestUser),
    writeCheck: (request: ReadCheckRequest<IUser>) => isOrganizer(request.requestUser),
    FIELDS: {
        meetingID: {
            type: String,
            required: true,
            index: true,
            readCheck: true,
            writeCheck: true,
        },
        userID: {
            type: String,
            required: true,
            index: true,
            readCheck: true,
            writeCheck: true,
        },
        enterTime: {
            type: Number,
            required: true,
            readCheck: true,
            writeCheck: true,
        },
        exitTime: {
            type: Number,
            readCheck: true,
            writeCheck: true,
        }
    }
}

export interface IMeetingAttendance extends mongoose.Document {
    meetingID: string,
    userID: string,
    enterTime: number,
    exitTime: number
}