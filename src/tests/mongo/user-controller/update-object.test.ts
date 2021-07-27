import updateObject from '../../../controller/util/update-object';

describe('Update object', () => {
  test('Top level', () => {
    const object = {
      a: '123',
      b: '423432',
    };

    const change = {
      a: '542',
    };

    updateObject(object, change);
    expect(object).toEqual({
      a: '542',
      b: '423432',
    });
  });

  test('Nested', () => {
    const object = {
      a: {
        c: {
          d: 'foo',
          f: 'baz',
        },
        e: 'bar',
      },
      b: '423432',
    };

    const change = {
      'a.c.d': 'banana',
      'a.e': 'alberta',
    };

    updateObject(object, change);
    expect(object).toEqual({
      a: {
        c: {
          d: 'banana',
          f: 'baz',
        },
        e: 'alberta',
      },
      b: '423432',
    });
  });
});
