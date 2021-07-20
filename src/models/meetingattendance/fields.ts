import mongoose from 'mongoose';
import { ReadCheckRequest, WriteCheckRequest, DeleteCheckRequest, CreateCheckRequest } from '../../types/checker';
import { isOrganizer } from '../validator';
export const fields = {
    createCheck: (request: CreateCheckRequest<any, IMeetingAttendance>) => isOrganizer(request.requestUser),
    readCheck: (request: ReadCheckRequest<IMeetingAttendance>) => isOrganizer(request.requestUser),
    deleteCheck: (request: DeleteCheckRequest<IMeetingAttendance>) => isOrganizer(request.requestUser),
    writeCheck: (request: WriteCheckRequest<any, IMeetingAttendance>) => isOrganizer(request.requestUser),
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
            default: 0,
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
    enterTime?: number,
    exitTime?: number
}