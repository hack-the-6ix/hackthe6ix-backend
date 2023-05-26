import mongodb, {Db} from "mongoose/node_modules/mongodb";
import {GridFSBucket} from "mongoose/node_modules/mongodb";

export const GRIDFS_BUCKETS = ['resumes'] as const;
export type SystemGridFSBucket = typeof GRIDFS_BUCKETS[number];

const bucketCache: Record<string, GridFSBucket> = {};

export function getBucket(bucket: SystemGridFSBucket, database: Db):GridFSBucket {
    if(bucketCache[bucket] === undefined) {
        bucketCache[bucket] = new mongodb.GridFSBucket(database, { bucketName: "resumes" });
    }

    return bucketCache[bucket];
}