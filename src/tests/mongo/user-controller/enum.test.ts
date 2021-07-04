import { getEnumOptions } from '../../../controller/UserController';
import { enumOptions } from '../../../models/user/enums';

test('Enum options', async () => {
  expect(await getEnumOptions()).toEqual(enumOptions);
});
