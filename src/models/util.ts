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
    ...rawFields.FIELDS, // Get current level fields
  };

  for (const k of Object.keys(rawFields.FIELDS)) {
    const v = rawFields.FIELDS[k];

    if (v.FIELDS !== undefined) {
      // This field itself has fields, so we're going to need to recurse

      out[k] = extractFields(v);
    }

    // Don't include virtual fields in the schema
    if (v.virtual) {
      delete out[k];
    }
  }

  return out;

};

/**
 * Get an array of fields that should be queried as part of an in text search
 * @param rawFields
 * @param prefix
 */
export const getInTextSearchableFields = (rawFields: any, prefix = '') => {

  let out: string[] = [];

  for (const k of Object.keys(rawFields.FIELDS)) {
    const v = rawFields.FIELDS[k];

    if (v.FIELDS !== undefined) {
      // This field itself has fields, so we're going to need to recurse

      out = [...out, ...getInTextSearchableFields(v, k)];
    } else {
      // This is a plain old field

      if (v.inTextSearch) {
        out.push(`${prefix}${prefix.length > 0 ? '.' : ''}${k}`);
      }
    }
  }

  return out;
};
