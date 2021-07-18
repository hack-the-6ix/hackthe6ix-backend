import User from '../models/user/User';

let statistics: IStatistics;

export const statisticsLifetime = 1000 * 60 * 60; // stats live for 60 minutes

export const getStatistics = async (update?: boolean): Promise<IStatistics> => {
  if (!statistics || (new Date().getTime() - statistics.timestamp) > statisticsLifetime || update) {
    // The cache is too old, or the user explicitly asked for an update

    statistics = {
      timestamp: new Date().getTime(),

      total: 0,

      hacker: {
        status: {
          applied: 0,
          accepted: 0,
          rejected: 0,
          waitlisted: 0,
          confirmed: 0,
          declined: 0,
          checkedIn: 0,
        },
        submittedApplicationStats: {
          gender: {
            male: 0,
            female: 0,
            other: 0,
            nonBinary: 0,
            chooseNotToSay: 0,
          },
          swag: {
            wantSwag: 0,
            noSwag: 0,
          },
          preEventWorkshops: {},
          review: {
            reviewed: 0,
            notReviewed: 0,
            applicationScores: {
              accomplish: 0,
              project: 0,
              portfolio: 0,
            },
          },
        },
        questionBreakdown: {},
      },
      groups: {
        hacker: 0,
        admin: 0,
        organizer: 0,
        volunteer: 0,
      },
      summary: {},
    };

    const users = await User.find({});

    // Write a summary statistic entry
    const addSummaryDate = (date: string, category: string) => {
      if (!statistics.summary[date]) {
        statistics.summary[date] = {};
      }

      if (!statistics.summary[date][category]) {
        statistics.summary[date][category] = {
          dailyChange: 0,
          cumulative: 0,
        };
      }

      statistics.summary[date][category].dailyChange++;
    };

    const generateDate = (date: Date) => {

      let month = (date.getMonth() + 1).toString();

      if (month.length < 2) {
        month = `0${month}`;
      }

      let day = date.getDate().toString();

      if (day.length < 2) {
        day = `0${day}`;
      }

      return `${month}-${day}`;

    };

    for (const rawUser of users) {
      const user = rawUser.toJSON();
      statistics.total++;

      // Summary statistics
      const created = new Date(user.created);
      const createdStr = generateDate(created);
      addSummaryDate(createdStr, 'created');

      if (user?.status?.applied && user?.hackerApplication?.lastUpdated) {
        const lastUpdated = new Date(user?.hackerApplication?.lastUpdated);
        const lastUpdatedStr = generateDate(lastUpdated);
        addSummaryDate(lastUpdatedStr, 'submitted');
      }

      // Statistics for each question
      for (const question in user.hackerApplication) {
        if ((user.hackerApplication as any)[question]) {
          if (statistics.hacker.questionBreakdown[question] === undefined) {
            statistics.hacker.questionBreakdown[question] = 1;
          } else {
            statistics.hacker.questionBreakdown[question]++;
          }
        }
      }

      // Update status
      for (const s of Object.keys(user.status)) {
        if ((user.status as any)[s]) {
          (statistics.hacker.status as any)[s]++;
        }
      }

      if (user?.status?.applied) {
        // Gender
        switch (user?.hackerApplication?.gender) {
          case 'Male':
            statistics.hacker.submittedApplicationStats.gender.male++;
            break;
          case 'Female':
            statistics.hacker.submittedApplicationStats.gender.female++;
            break;
          case 'Non-Binary':
            statistics.hacker.submittedApplicationStats.gender.nonBinary++;
            break;
          case 'Prefer not to say':
            statistics.hacker.submittedApplicationStats.gender.chooseNotToSay++;
            break;
          default:
            statistics.hacker.submittedApplicationStats.gender.other++;
            break;
        }

        // Preevent workshops
        if (user?.hackerApplication?.preEventWorkshops) {

          const wsOption = user?.hackerApplication?.preEventWorkshops;

          if (statistics.hacker.submittedApplicationStats.preEventWorkshops[wsOption] === undefined) {
            statistics.hacker.submittedApplicationStats.preEventWorkshops[wsOption] = 0;
          }

          statistics.hacker.submittedApplicationStats.preEventWorkshops[wsOption]++;
        }

        // Swag
        if (user?.hackerApplication?.wantSwag) {
          statistics.hacker.submittedApplicationStats.swag.wantSwag++;
        } else {
          statistics.hacker.submittedApplicationStats.swag.noSwag++;
        }

        // Review state
        if (user?.internal?.computedApplicationScore >= 0) {
          statistics.hacker.submittedApplicationStats.review.reviewed++;
        } else {
          statistics.hacker.submittedApplicationStats.review.notReviewed++;
        }

        // Individual questions
        if (user?.internal?.applicationScores?.accomplish?.score >= 0) {
          statistics.hacker.submittedApplicationStats.review.applicationScores.accomplish++;
        }
        if (user?.internal?.applicationScores?.project?.score >= 0) {
          statistics.hacker.submittedApplicationStats.review.applicationScores.project++;
        }
        if (user?.internal?.applicationScores?.portfolio?.score >= 0) {
          statistics.hacker.submittedApplicationStats.review.applicationScores.portfolio++;
        }
      }

      // Roles
      for (const r of Object.keys(user.groups)) {
        if ((user.groups as any)[r]) {
          (statistics.groups as any)[r]++;
        }
      }
    }

    // Compute cumulative statistics
    const cumulativeRecords: any = {};

    for (const date of Object.keys(statistics.summary).sort()) {
      for (const category in statistics.summary[date]) {

        if (!cumulativeRecords[category]) {
          cumulativeRecords[category] = 0;
        }

        cumulativeRecords[category] += statistics.summary[date][category].dailyChange;

        statistics.summary[date][category].cumulative = cumulativeRecords[category];
      }
    }
  }

  return statistics;
};

export type IStatistics = {
  timestamp: number,
  total: number,
  hacker: {
    status: {
      applied: number,
      accepted: number,
      rejected: number,
      waitlisted: number,
      confirmed: number,
      declined: number,
      checkedIn: number,
    },
    submittedApplicationStats: {
      gender: {
        male: number,
        female: number,
        nonBinary: number,
        other: number,
        chooseNotToSay: number
      },
      swag: {
        wantSwag: number,
        noSwag: number
      },
      preEventWorkshops: any,
      review: {
        reviewed: number,
        notReviewed: number,
        applicationScores: {
          accomplish: number,
          project: number,
          portfolio: number
        }
      },
    },
    questionBreakdown: any
  },
  groups: {
    hacker: number,
    admin: number,
    organizer: number,
    volunteer: number
  },
  summary: {
    [date: string]: {
      [category: string]: {
        dailyChange: number,
        cumulative: number
      }
    }
  }
}
