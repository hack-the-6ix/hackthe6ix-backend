export type JWT = {
  id: string,
  samlNameID: string,
  samlSessionIndex: string,
  groups: string[],
  roles: {
    organizer: boolean,
    hacker: boolean
  }
}
