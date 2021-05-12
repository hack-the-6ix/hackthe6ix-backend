// Admins can do anything and bypass validation
export const admin = (requestUser: any, targetUser: any) => requestUser.jwt.roles.organizer;

export const userOrAdmin = (requestUser: any, targetUser: any) =>
  admin(requestUser, targetUser) || requestUser._id == targetUser._id;

export const notApplied = (requestUser: any, targetUser: any) =>
  admin(requestUser, targetUser) || !requestUser?.status?.applied;
