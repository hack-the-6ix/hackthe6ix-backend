import mongoose from 'mongoose';

import {isAdmin} from '../validator';
import {CreateCheckRequest, DeleteCheckRequest, ReadCheckRequest, WriteCheckRequest} from "../../types/checker";

export const fields = {
    createCheck: (request: CreateCheckRequest<any, IMailerList>) => isAdmin(request.requestUser),
    readCheck: (request: ReadCheckRequest<IMailerList>) => isAdmin(request.requestUser),
    deleteCheck: (request: DeleteCheckRequest<IMailerList>) => isAdmin(request.requestUser),
    writeCheck: (request: WriteCheckRequest<any, IMailerList>) => isAdmin(request.requestUser),
    FIELDS: {
        name: {
            type: String,
            index: true,
            required: true
        },
        listID: {
            type: String,
            required: true
        },
        query: {
            type: Object,
            required: true
        }
    }
}

export interface IMailerList extends mongoose.Document {
    name: string,
    listID: string,
    query: Record<string, any>
}