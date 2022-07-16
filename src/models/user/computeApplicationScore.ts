import { enumOptions } from './enums';
import { IUser } from './fields';

export default function() {
  const user = this as IUser;
  const applicationScores: any = user.internal.applicationScores;

  // Calculate score in accordance to the agreed on formula
  const firstHackathon = user.hackerApplication?.hackathonsAttended === enumOptions.hackathonsAttended[0];

  // Ensure all categories are graded before performing the calculation
  for (const category of ['whyHT6', 'techInnovation', 'project', 'portfolio']) {
    if (
      (category !== 'portfolio' || !firstHackathon) && // If this is the applicant's first hackathon, we waive the validation for portfolio
      (applicationScores[category]?.score < 0) // Ensure we have all the relevant data on file
    ) {
      return -1;
    }
  }

  const total: number = (user.hackerApplication.requestedWorkshops?.length > 0 ? 1 : 0) +
    applicationScores.techInnovation?.score +
    applicationScores.whyHT6?.score +
    applicationScores.project?.score +
    (!firstHackathon ? applicationScores.portfolio?.score : 0);

  return (total / (firstHackathon ? 13 : 15)) * 100;
}
