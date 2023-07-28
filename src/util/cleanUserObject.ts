import {IApplication, IUser} from "../models/user/fields";

export const cleanUserObject = (user?: IUser):IUser|undefined => {
    if(user?.["hackerApplication"] !== undefined) {
        user["hackerApplication"] = {} as IApplication;
    }

    return user;
}