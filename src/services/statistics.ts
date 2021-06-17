import User from '../models/user/User';

let statistics: IStatistics;

export const statisticsLifetime = 1000 * 60 * 5; // stats live for 5 minutes

export const getStatistics = async (update?: boolean) => {
  if (!statistics || (new Date().getTime() - statistics.timestamp) > statisticsLifetime || update) {
    // The cache is too old, or the user explicitly asked for an update

    statistics = {
      timestamp: new Date().getTime(),

      hacker: {
        status: {
          applied: 0,
          accepted: 0,
          rejected: 0,
          waitlisted: 0,
          confirmed: 0,
          declined: 0,
          expired: 0,
          checkedIn: 0,
        },
        submittedApplicationStats: {
          gender: {
            male: 0,
            female: 0,
            other: 0,
            chooseNotToSay: 0
          },
          swag: {
            wantSwag: 0,
            noSwag: 0
          }
        }
      },
      roles: {
        hacker: 0,
        admin: 0,
        organizer: 0,
        volunteer: 0
      },
      review: {
        reviewed: 0,
        notReviewed: 0
      }
    };

    const users = await User.find({});

    for (const user of users) {
      // Update status
      for (const s of Object.keys(user.status)) {
        if ((user.status as any)[s]) {
          (statistics.hacker.status as any)[s]++;
        }
      }

      if (user.status.applied) {
        // Gender
        switch (user.hackerApplication.gender) {
          case "Male":
            statistics.hacker.submittedApplicationStats.gender.male++;
            break;
          case "Female":
            statistics.hacker.submittedApplicationStats.gender.female++;
            break;
          case "Other":
            statistics.hacker.submittedApplicationStats.gender.other++;
            break;
          case "Prefer not to say":
            statistics.hacker.submittedApplicationStats.gender.chooseNotToSay++;
            break;
        }

        // Swag
        if (user.hackerApplication.wantSwag) {
          statistics.hacker.submittedApplicationStats.swag.wantSwag++;
        } else {
          statistics.hacker.submittedApplicationStats.swag.noSwag++;
        }
      }

      // Roles
      for (const r of Object.keys(user.roles)) {
        if ((user.roles as any)[r]) {
          (statistics.roles as any)[r]++;
        }
      }

      // Review state
      if (user.internal.computedApplicationScore >= 0) {
        statistics.review.reviewed++;
      } else {
        statistics.review.notReviewed++;
      }
    }
  }

  return statistics;
};

export type IStatistics = {
  timestamp: number,
  hacker: {
    status: {
      applied: number,
      accepted: number,
      rejected: number,
      waitlisted: number,
      confirmed: number,
      declined: number,
      expired: number,
      checkedIn: number,
    },
    submittedApplicationStats: {
      gender: {
        male: number,
        female: number,
        other: number,
        chooseNotToSay: number
      },
      swag: {
        wantSwag: number,
        noSwag: number
      }
    }
  },
  roles: {
    hacker: number,
    admin: number,
    organizer: number,
    volunteer: number
  },
  review: {
    reviewed: number,
    notReviewed: number
  }
}
