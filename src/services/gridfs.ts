import mongoose from "mongoose";
import type {GridFSBucket, Db} from "mongodb";
import {BadRequestError} from "../types/errors";

export const GRIDFS_BUCKETS = ['resumes'] as const;
export type SystemGridFSBucket = typeof GRIDFS_BUCKETS[number];

const bucketCache: Record<string, GridFSBucket> = {};
const bucketsSet = new Set(GRIDFS_BUCKETS);

export function getBucket(bucket: SystemGridFSBucket, database: Db):GridFSBucket {
    if(!bucketsSet.has(bucket)) {
        throw new BadRequestError(`Invalid GridFS bucket: ${bucket}`);
    }
    if(bucketCache[bucket] === undefined) {
        bucketCache[bucket] = new mongoose.mongo.GridFSBucket(database, { bucketName: "resumes" });
    }

    return bucketCache[bucket];
}