export const stringifyUnixTime = (time: number) => new Date(time).toLocaleDateString(
  'en-US',
  {
    year: 'numeric',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    timeZoneName: 'short',
  },
);
