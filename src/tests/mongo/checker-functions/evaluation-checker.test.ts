import { evaluateChecker } from '../../../controller/util/checker';
import { ReadCheckRequest } from '../../../types/checker';
import { UniverseState } from '../../../types/types';
import { adminUser, nopermUser } from '../../test-utils';


describe('Evaluation Checker', () => {

  describe('Static condition', () => {

    test('True', () => {
      const result = evaluateChecker(true, {
        requestUser: nopermUser,
        targetObject: {},
        universeState: {} as UniverseState,
      });

      expect(result).toBeTruthy();
    });

    test('False', () => {
      const result = evaluateChecker(false, {
        requestUser: nopermUser,
        targetObject: {},
        universeState: {} as UniverseState,
      });

      expect(result).toBeFalsy();
    });

    test('Implicit False', () => {
      const result = evaluateChecker(undefined, {
        requestUser: nopermUser,
        targetObject: {},
        universeState: {} as UniverseState,
      });

      expect(result).toBeFalsy();
    });

  });

  describe('Dynamic condition', () => {

    describe('Universe state', () => {
      test('Success', () => {
        const result = evaluateChecker((request: any) => request.universeState.foo == true, {
          requestUser: nopermUser,
          targetObject: {},
          universeState: {
            foo: true,
          } as any,
        });

        expect(result).toBeTruthy();
      });

      test('Fail', () => {
        const result = evaluateChecker((request: any) => request.universeState.foo == true, {
          requestUser: nopermUser,
          targetObject: {},
          universeState: {
            foo: false,
          } as any,
        });

        expect(result).toBeFalsy();
      });
    });

    describe('Target object', () => {
      test('Success', () => {
        const result = evaluateChecker((request: ReadCheckRequest) => request.targetObject.moo == true, {
          requestUser: nopermUser,
          targetObject: {
            moo: true,
          },
          universeState: {} as any,
        });

        expect(result).toBeTruthy();
      });

      test('Fail', () => {
        const result = evaluateChecker((request: ReadCheckRequest) => request.targetObject.moo == true, {
          requestUser: nopermUser,
          targetObject: {
            moo: false,
          },
          universeState: {} as any,
        });

        expect(result).toBeFalsy();
      });
    });

    describe('Request User', () => {
      test('Success', () => {
        const result = evaluateChecker((request: ReadCheckRequest) => Object.keys(request.requestUser.roles || {}).length == 0, {
          requestUser: nopermUser,
          targetObject: {},
          universeState: {} as any,
        });

        expect(result).toBeTruthy();
      });

      test('Fail', () => {
        const result = evaluateChecker((request: ReadCheckRequest) => Object.keys(request.requestUser.roles || {}).length == 0, {
          requestUser: adminUser,
          targetObject: {},
          universeState: {} as any,
        });

        expect(result).toBeFalsy();
      });
    });

  });

});
