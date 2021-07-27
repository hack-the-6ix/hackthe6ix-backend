/**
 * Updates a dictionary with a
 *
 * @param object - dictionary to operate on
 * @param changes - dictionary of changes, where the key is a string delimited by periods (.)
 *                  where each keyword is converted into dictionary index notation.
 *
 *                  For example: { 'a.b.c': 123 } would result in object['a']['b']['c'] = 123
 */
export default (object: any, changes: any) => {
  for (const change of Object.keys(changes)) {
    const fields = change.split('.');
    let value: any = object;

    let field;
    for (let i = 0; i < fields.length; i++) {
      field = fields[i];

      if (i < fields.length - 1) {
        value = value[field];
      } else {
        value[field] = changes[change];
      }
    }
  }
};
