import mongoose from 'mongoose';

import {isAdmin} from '../validator';
import {CreateCheckRequest, DeleteCheckRequest, ReadCheckRequest, WriteCheckRequest} from "../../types/checker";

export const fields = {
    createCheck: (request: CreateCheckRequest<any, IMailerTemplate>) => isAdmin(request.requestUser),
    readCheck: (request: ReadCheckRequest<IMailerTemplate>) => isAdmin(request.requestUser),
    deleteCheck: (request: DeleteCheckRequest<IMailerTemplate>) => isAdmin(request.requestUser),
    writeCheck: (request: WriteCheckRequest<any, IMailerTemplate>) => isAdmin(request.requestUser),
    FIELDS: {
        name: {
            type: String,
            index: true,
            required: true
        },
        subject: {
            type: String,
            required: true
        },
        templateID: {
            type: String,
            required: true
        }
    }
}

export interface IMailerTemplate extends mongoose.Document {
    name: string,
    subject: string,
    templateID: string
}