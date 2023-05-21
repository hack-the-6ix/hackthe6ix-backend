import mongoose from 'mongoose';

import {isAdmin} from '../validator';
import {CreateCheckRequest, DeleteCheckRequest, ReadCheckRequest, WriteCheckRequest} from "../../types/checker";

export const fields = {
    createCheck: (request: CreateCheckRequest<any, IInitializationRecord>) => isAdmin(request.requestUser),
    readCheck: (request: ReadCheckRequest<IInitializationRecord>) => isAdmin(request.requestUser),
    deleteCheck: (request: DeleteCheckRequest<IInitializationRecord>) => isAdmin(request.requestUser),
    writeCheck: (request: WriteCheckRequest<any, IInitializationRecord>) => isAdmin(request.requestUser),
    FIELDS: {
        key: {
            type: String,
            index: true,
            required: true
        },
        version: {
            type: Number,
            required: true
        }
    }
}

export interface IInitializationRecord extends mongoose.Document {
    key: string,
    version: number
}