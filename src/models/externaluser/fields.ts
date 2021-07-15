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
        firstName: {
            type: String,
            required: true,
            readCheck: true,
            writeCheck: true,
        },
        lastName: {
            type: String,
            required: true,
            readCheck: true,
            writeCheck: true,
        },
        email: {
            type: String,
            required: true,
            index: true,
            readCheck: true,
            writeCheck: true,
        },
        roles: {
            type: [String],
            readCheck: true,
            writeCheck: true,
        },
        suffix: {
            type: String,
            readCheck: true,
            writeCheck: true,
        },
        discordID: {
            type: String,
            index: true,
            readCheck: true,
            writeCheck: true,
        }
    }
}

export interface IExternalUser extends mongoose.Document {
    firstName: string,
    lastName: string,
    email: string,
    roles: string[],
    suffix: string,
    discordID: string
}