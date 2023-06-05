import { IUser } from '../../../models/user/fields';
import {
    canUserOverrideDeadlines
} from '../../../models/validator';
import { hackerUser } from '../../test-utils';

jest.mock('../../../consts', () => (
    {
        ...jest.requireActual('../../../consts'),
        deadlinesOverrides: ["@override.com", "specific@overridetwo.com"]
    }
));

describe('Deadline override', () => {
    describe('Not covered by override', () => {
        test('Complete mismatch', () => {
            expect(canUserOverrideDeadlines(hackerUser)).toBe(false);
        });

        test('Email override is suffix', () => {
            expect(canUserOverrideDeadlines({
                ...hackerUser,
                email: "notspecific@overridetwo.com"
            } as IUser)).toBe(false);
        });
    });

    test('Domain override', () => {
        expect(canUserOverrideDeadlines({
            ...hackerUser,
            email: "tester@override.com"
        } as IUser)).toBe(true);
    });

    test('Email address override', () => {
        expect(canUserOverrideDeadlines({
            ...hackerUser,
            email: "specific@overridetwo.com"
        } as IUser)).toBe(true);
    })
});