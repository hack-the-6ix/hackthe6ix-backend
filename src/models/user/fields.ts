const userOrAdmin = (requestUser: any, targetUser: any) => requestUser._id == targetUser._id ||
                                                           requestUser.jwt.roles.admin;

/**
 * TODO: The requestUser.jwt.roles.admin; above is temporary. Change it to match whatever we end up
 *       doing.
 *
 *       We can fetch the request user's profile from their ID using the jwt and inject the jwt data
 *       into that object too so that we can easily access permissions.
 */

export default {
  firstName: {
    type: String,
    required: true,
    onWrite: (value: string, requestUser: any, targetUser: any) => value.length <= 50,
    onRead: (value: string, requestUser: any, targetUser: any) => userOrAdmin(requestUser, targetUser),
    caption: 'First Name',
  },

  lastName: {
    type: String,
    required: true,
    onWrite: (value: string, requestUser: any, targetUser: any) => value.length <= 50,
    caption: 'Last Name',
  },

  email: {
    type: String,
    required: true,
    onWrite: (value: string, requestUser: any, targetUser: any) => value.length <= 50,
    caption: 'Email',
  },
};
