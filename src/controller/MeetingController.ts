import MeetingAttendance from '../models/meetingattendance/MeetingAttendance';

export const recordJoin = async (meetingID: string, userID: string, time: number): Promise<string> => {
    let meetingAttendanceInfo = await MeetingAttendance.findOne({
        meetingID, userID,
    });

    // Only record it is there is no record already or the current enter time is later than the requested
    if (!meetingAttendanceInfo || meetingAttendanceInfo.enterTime > time || meetingAttendanceInfo.enterTime === -1) {
        meetingAttendanceInfo = await MeetingAttendance.findOneAndUpdate({
            meetingID, userID,
        }, {
            meetingID, userID,
            enterTime: time,
        }, {
            upsert: true,
            setDefaultsOnInsert: true,
            new: true,
        });
    }

    return meetingAttendanceInfo._id;
};

export const recordLeave = async (meetingID: string, userID: string, time: number): Promise<string> => {
    const meetingAttendanceInfo = await MeetingAttendance.findOneAndUpdate({
        meetingID, userID,
    }, {
        meetingID, userID,
        exitTime: time,
    }, {
        upsert: true,
        setDefaultsOnInsert: true,
        new: true,
    });

    return meetingAttendanceInfo._id;
};
