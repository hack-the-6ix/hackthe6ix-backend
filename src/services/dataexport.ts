import { exportAsZip } from '../controller/GridFSController';
import mongoose from '../services/mongoose_service';
import {Writable} from 'stream';
import User from '../models/user/User';

export const resumeExport = async (outputStream: Writable) => {
    const resumeUsers = await User.find({
        "hackerApplication.resumeSharePermission": true,
        "hackerApplication.resumeFileName": {
            $exists: true
        }
    }, {
        "hackerApplication.resumeSharePermission": 1,
        "hackerApplication.resumeFileName": 1
    });

    const filenames = resumeUsers.map((user) => {
        return user.hackerApplication.resumeFileName;
    });

    await exportAsZip(filenames, mongoose, outputStream);

    return;
}