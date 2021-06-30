export const mockTags = {
  foo: 'bar',
  baz: 'boop',
};
export const mockTagsParsed = {
  'TAGS[foo]': 'bar',
  'TAGS[baz]': 'boop',
};
export const mockTemplateName = 'cool template bro';
export const mockTemplateID = 'mock template';
export const mockSubject = 'this is the subject';

export const mockEmailsEmpty: string[] = [];
export const mockEmailsA: string[] = ['A', 'B', 'C'];
export const mockEmailsB: string[] = ['B', 'C', 'D'];
export const mockMailingListID = 'mock mailinglist id';

export const generateGetSubscriptionsResponse = (emails: string[]) => emails.map((email: string) => ({ email: email }));

export const mockMailingLists = {
  list1: 'list1',
  list2: 'list2',
  list3: 'list3',
};

export const mockGetList = {
  list1: {
    query: {
      firstName: 'Apple',
    },
    listID: 'foo',
  },
  list2: {
    query: {
      firstName: 'Banana',
    },
    listID: 'bar',
  },
  list3: {
    query: {
      firstName: 'Orange',
    },
    listID: 'wtf',
  },
};
