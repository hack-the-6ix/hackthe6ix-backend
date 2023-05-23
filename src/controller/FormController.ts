import FormConfiguration from "../models/formconfiguration/FormConfiguration";
import FormEntry from "../models/formentry/FormEntry";

import DynamicCacheProvider from "../services/cache";

const formConfigurationCache = new DynamicCacheProvider(async (formId: string) => {
    const formConfiguration = await FormConfiguration.findOne({
        _id: formId
    });

    if(!formConfiguration) {
        return;
    }

    const fieldMap = {} as Record<string, number>;

    for(let i = 0;i<formConfiguration.fields.length;++i) {
        fieldMap[formConfiguration.fields[i].id] = i;
    }


    return {
        fieldMap, data: formConfiguration
    }
}, {
    stdTTL: 60
});

export const validateForm = async(formId: string, values: Record<string, string>, submit: boolean, system=false): Promise<{
    result: boolean,
    messages?: string[]
}> => {
    const formConfiguration = await formConfigurationCache.get(formId);
    if(!formConfiguration) {
        return {
            result: false
        }
    }

    const validFields = new Set(formConfiguration.data.fields.map((entry) => entry.id));

    let result = true;
    const messages = [];

    // filter out all unknown fields and ensure they are a normal type
    for(const field of Object.keys(values)) {
        const fieldDef = formConfiguration.data.fields[formConfiguration.fieldMap[field]];

        if(!validFields.has(field)){
            delete values[field];
            messages.push(`WARN: Deleted unrecognized field ${field}.`);
            continue;
        }

        const fieldType = typeof values[field];

        if(fieldType !== "string" && fieldType !== "number" && fieldType !== "boolean") {
            delete values[field];
            messages.push(`WARN: Deleted field ${field} which is not a basic type.`);
            continue;
        }

        if(fieldDef.type !== "enum" && fieldDef.type !== "string") {
            if(fieldType !== fieldDef.type) {
                if(fieldDef.type === "boolean") {
                    // supposed to be a boolean, but it's not, we're only going to accept stringified booleans for now
                    if(values[field].toLowerCase() !== "true" && values[field].toLowerCase() !== "false") {
                        result = false;
                        messages.push(`ERR: ${field} must be a boolean!`);
                        continue;
                    }
                }
                else if(fieldDef.type === "number") {
                    // supposed to be a number, but it's not
                    // allow the string value to be coerced
                    if(isNaN(values[field] as unknown as number) || isNaN(parseFloat(values[field]))) {
                        result = false;
                        messages.push(`ERR: ${field} must be a number!`);
                        continue;
                    }
                }
            }
        } // enums are just cast to strings and compared, so no need for type checking here. strings also don't need to be checked (see below)

        values[field] = values[field].toString(); // we always consider the input to be strings for ease of comparison
    }

    if(result) {
        for(const [field, value] of Object.entries(values)) {
            const fieldDef = formConfiguration.data.fields[formConfiguration.fieldMap[field]];

            if(fieldDef.systemField && !system) {
                result = false;
                messages.push(`ERR: ${field} is a system field!`);
                continue;
            }

            let isFieldRequired = fieldDef.required;

            if(!isFieldRequired) {
                // check if any required ifs are satisfied
                for(const requiredIfRule of fieldDef.requiredIfs) {
                    const targetedValue = values[requiredIfRule.fieldId];

                    if(requiredIfRule.requiredIfFilled && (targetedValue !== undefined && targetedValue !== "") ||
                        (targetedValue !== undefined && (requiredIfRule.requiredIfValues.includes(targetedValue) || requiredIfRule.requiredIfValues.includes(targetedValue.toString())))) {
                        isFieldRequired = true;
                        break;
                    }
                }
            }

            if(isFieldRequired && (value === undefined || value === "")) {
                result = false;
                messages.push(`ERR: ${field} is required!`);
            }

            // check enum
            // check validator
            // check rules

        }
    }



    return {
        result,
        messages
    }
}