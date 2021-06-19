import { getEnumOptions } from '../../../controller/UserController';
import { enumOptions } from '../../../models/user/fields';

test('Enum options', async () => {
  expect(await getEnumOptions()).toEqual(enumOptions);
});
