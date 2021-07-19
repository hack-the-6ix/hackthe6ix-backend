import mongoose from 'mongoose';
import { BasicUser } from '../../types/types';
import { ReadCheckRequest } from '../../types/checker';
import { IUser } from '../user/fields';
import { isOrganizer } from '../validator';
import discordShared from '../shared/discordShared';
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
        notes: {
            type: String,
            readCheck: true,
            writeCheck: true,
        },
        discord: discordShared
    }
}

export interface IExternalUser extends BasicUser {
    notes: string
}