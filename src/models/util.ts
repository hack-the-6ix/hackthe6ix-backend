/**
 * Converts a dictionary where the highest level is of the following structure to one that can be parsed by mongoose:
 *
 * Input:
 * {
 *   readCheck: ...,
 *   writeCheck: ...,
 *
 *   fields: {
 *
 *     fields go here...
 *
 *     subfields: {
 *       readCheck: ...,
 *       writeCheck: ...,
 *
 *       fields: {
 *
 *         subfields go here...
 *         ...
 *       }
 *
 *     }
 *   }
 * }
 *
 * Output:
 *
 * {
 *   fields go here...
 *
 *   subfields: {
 *      subfields go here...
 *   }
 * }
 *
 * @param rawFields
 */

export const extractFields = (rawFields: any) => {

  // Precondition: rawFields meets the input specification

  const out: any = {
    ...rawFields.FIELDS // Get current level fields
  };

  for (const k of Object.keys(rawFields.FIELDS)) {
    const v = rawFields.FIELDS[k];

    if (v.FIELDS !== undefined) {
        // This field itself has fields, so we're going to need to recurse

        out[k] = extractFields(v);
    }
  }

  return out;

};
