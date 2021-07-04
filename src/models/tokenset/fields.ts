import mongoose from "mongoose";
export const fields = {
    token: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
        required: true
    }
}

export interface ITokenset extends mongoose.Document {
    token: string,
    refreshToken: string
}