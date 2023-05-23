import mongoose from "mongoose";
import {CreateCheckRequest, DeleteCheckRequest, ReadCheckRequest, WriteCheckRequest} from "../../types/checker";
import {IExternalUser} from "../externaluser/fields";
import {isAdmin} from "../validator";
export const fields = {
    createCheck: (request: CreateCheckRequest<any, IExternalUser>) => isAdmin(request.requestUser),
    readCheck: (request: ReadCheckRequest<IExternalUser>) => isAdmin(request.requestUser),
    deleteCheck: (request: DeleteCheckRequest<IExternalUser>) => isAdmin(request.requestUser),
    writeCheck: (request: WriteCheckRequest<any, IExternalUser>) => isAdmin(request.requestUser),
    FIELDS: {
        userId: {
            type: String,
            required: true
        },
        lastUpdated: {
            type: Number,
            required: true,
        },
        values: {
            type: Object
        },
        scoring: {
            type: Object
        }
    }
}

export interface FormEntryScore {
    score: number,
    reviewer: string
}

export interface IFormEntry extends mongoose.Document {
    userId: string,
    lastUpdated: number,
    values: Record<string, unknown>,
    scoring: Record<string, FormEntryScore>
}