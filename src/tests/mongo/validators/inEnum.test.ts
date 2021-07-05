import { inEnum } from '../../../models/validator';
import { WriteCheckRequest } from '../../../types/checker';

describe('Check Enum', () => {

  describe('Strict', () => {
    test('Success', () => {
      expect(inEnum(['1', '2', '3'])({
        fieldValue: '1',
      } as WriteCheckRequest<any, string>)).toEqual(true);
    });

    test('Reject', () => {
      expect(inEnum(['1', '2', '3'])({
        fieldValue: '4',
      } as WriteCheckRequest<any, string>)).toEqual(false);
    });
  });

  describe('Unstrict', () => {
    test('Success - Normal', () => {
      expect(inEnum(['1', '2', '3'], true)({
        fieldValue: '1',
      } as WriteCheckRequest<any, string>)).toEqual(true);
    });

    test('Success - Blank', () => {
      expect(inEnum(['1', '2', '3'], true)({
        fieldValue: '',
      } as WriteCheckRequest<any, string>)).toEqual(true);
    });


    test('Success - Undefined', () => {
      expect(inEnum(['1', '2', '3'], true)({
        fieldValue: undefined,
      } as WriteCheckRequest<any, string>)).toEqual(true);
    });

    test('Reject', () => {
      expect(inEnum(['1', '2', '3'], true)({
        fieldValue: '4',
      } as WriteCheckRequest<any, string>)).toEqual(false);
    });
  });
});
