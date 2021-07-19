import mongoose from 'mongoose';
import { BasicUser } from '../../types/types';
import { ReadCheckRequest, WriteCheckRequest, DeleteCheckRequest, CreateCheckRequest } from '../../types/checker';
import { isOrganizer } from '../validator';
import discordShared from '../shared/discordShared';
export const fields = {
    createCheck: (request: CreateCheckRequest<any, IExternalUser>) => isOrganizer(request.requestUser),
    readCheck: (request: ReadCheckRequest<IExternalUser>) => isOrganizer(request.requestUser),
    deleteCheck: (request: DeleteCheckRequest<IExternalUser>) => isOrganizer(request.requestUser),
    writeCheck: (request: WriteCheckRequest<any, IExternalUser>) => isOrganizer(request.requestUser),
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