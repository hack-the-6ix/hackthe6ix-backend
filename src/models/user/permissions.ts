export const userOrAdmin = (requestUser: any, targetUser: any) => requestUser._id == targetUser._id ||
  requestUser.jwt.roles.admin;
