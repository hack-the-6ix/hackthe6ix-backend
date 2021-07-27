import Team from '../../models/team/Team';
import { IUser } from '../../models/user/fields';
import User from '../../models/user/User';

/**
 * Export a list of users who have applied in descending order by grade
 *
 * @param usePersonalApplicationScore - when true, users are sorted by their individual scores,
 *                                      without any adjustment from their team
 */
export default async (usePersonalApplicationScore?: boolean) => {
  const sortCriteria = usePersonalApplicationScore
    ? 'computedApplicationScore'
    : 'computedFinalApplicationScore';

  const users = await Promise.all((await User.find({
    'status.applied': true,
  })).map(async (user: IUser) => {
    // We will inject the team score at this point
    // This isn't done at the user object level to prevent recursive dependencies

    const jsonUser: IUser = user.toJSON() as IUser;
    const teamCode = jsonUser?.hackerApplication?.teamCode;

    let teamScore = -1;

    if (teamCode) {
      const team = await Team.findOne({ code: teamCode });
      teamScore = team.teamScore;
    }

    jsonUser.internal.computedFinalApplicationScore = Math.max(teamScore, jsonUser.internal.computedApplicationScore);

    return jsonUser;
  }));

  return users
  .sort((a: IUser, b: IUser) => {
    const diff = b.internal[sortCriteria] - a.internal[sortCriteria];

    if (diff === 0) {
      // If the scores are the same, the tiebreaker is whoever submitted earlier
      return a.hackerApplication.lastUpdated - b.hackerApplication.lastUpdated;
    } else {
      return diff;
    }
  });
}
