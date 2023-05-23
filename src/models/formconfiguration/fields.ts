import mongoose from "mongoose";
import {CreateCheckRequest, DeleteCheckRequest, ReadCheckRequest, WriteCheckRequest} from "../../types/checker";
import {isAdmin} from "../validator";
import {IExternalUser} from "../externaluser/fields";



const FormScoringImplementations = ['Default', 'Application2023'] as const;
const FormValueTypes = ['string', 'number', 'boolean', 'enum'] as const;
const FormValueValidators = ['isEmail', 'isTrue', 'isFalse'] as const;
const FormValueEnumSources = ['Schools'] as const;

const FormValueValidatorsSet = new Set<string>(FormValueValidators);

export type FormScoringImplementation = typeof FormScoringImplementations[number];
export type FormValueType = typeof FormValueTypes[number];
export type FormValueValidator = typeof FormValueValidators[number];
export type FormValueEnumSource = typeof FormValueEnumSources[number];

const FormFieldRequiredIf = {
    _id : false,
    fieldId: {
        type: String,
        required: true
    },
    requiredIfFilled: {
        type: Boolean,
        required: true,
        default: false
    },
    requiredIfValues: {
        type: String,
        required: true
    }
};

const FormFieldDefinition = {
    _id : false,
    id: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: FormValueTypes
    },
    description: {
        type: String
    },
    internalNote: {
        type: String
    },
    systemField: {
        type: Boolean,
        required: true,
        default: false
    },
    scored: {
        type: Boolean,
        required: true,
        default: false
    },
    required: {
        type: Boolean,
        required: true,
        default: false
    },
    requiredIfs: {
        type: [FormFieldRequiredIf]
    },
    validators: {
        type: [String],
        validator: (v: string[]) => {
            for(const val of v) {
                if(!FormValueValidatorsSet.has(val)){
                    return false;
                }
            }
            return true;
        }
    },
    rules: {
        minLength: {
            type: Number
        },
        maxLength: {
            type: Number
        },
        minWords: {
            type: Number
        },
        maxWords: {
            type: Number,
        }
    },
    enumValues: {
        type: [String]
    },
    enumValuesSource: {
        type: String,
        enumValues: FormValueEnumSources,
        required: function():boolean {
            return this.type === "enum" && this.enumValues?.length === 0;
        }
    }
}

export const fields = {
    createCheck: (request: CreateCheckRequest<any, IExternalUser>) => isAdmin(request.requestUser),
    readCheck: (request: ReadCheckRequest<IExternalUser>) => isAdmin(request.requestUser),
    deleteCheck: (request: DeleteCheckRequest<IExternalUser>) => isAdmin(request.requestUser),
    writeCheck: (request: WriteCheckRequest<any, IExternalUser>) => isAdmin(request.requestUser),
    FIELDS: {
        description: {
            type: String
        },
        locked: {
            type: Boolean,
            required: true,
            default: false
        },
        scoringImplementation: {
            type: String,
            required: true,
            default: "Default",
            enumValues: FormScoringImplementations
        },
        fields: {
            type: [FormFieldDefinition]
        }
    }
}

export interface FormFieldRequiredIf {
    fieldId: string,
    requiredIfFilled: boolean,
    requiredIfValues: string[]
}
export interface FormValueRule {
    minLength?: number,
    maxLength?: number,
    maxWords?: number,
    minWords?: number
}

export interface FormFieldDefinition {
    id: string,
    type: FormValueType,
    description?: string,
    internalNote?: string,
    systemField: boolean,
    scored: boolean,
    points?: number,
    required: boolean,
    requiredIfs?: FormFieldRequiredIf[],
    validators: FormValueValidator[],
    rules: FormValueRule,
    enumValues?: string[],
    enumValuesSource?: FormValueEnumSource
}

export interface IFormConfiguration extends mongoose.Document<string> {
    description?: string,
    locked: boolean,
    scoringImplementation?: FormScoringImplementation,
    fields: FormFieldDefinition[]
}