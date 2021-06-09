# Hack the 6ix Backend

View [API Documentation](api.md) for a detailed breakdown of the API.

## Setup

We are using Mailtrain (https://github.com/hack-the-6ix/mailtrain) to handle mailing lists and 
general email sending. As such, you should have an instance running prior to starting the backend,
otherwise emails won't work.

Setup `.env` with the Mailtrain root path (in our case `https://mailtrain.hackthe6ix.com`) and API key.
The mailing list ID and template IDs will also need to be populated (this might be in `.env`, on the 
admin dashboard, or somewhere else; it hasn't been decided yet).

You will also need to configure SAML authentication. Copy `settings.json.bak` to `settings.json` in `src/bootstrap/data` and configure the settings as desired.
For certificates, you must encode the PEM certificate (with headers) to base64. Note that you can add as many providers as desired, the given ones are there as examples.


Note: You must clear the settings collection in the database for the SAML settings to be updated from the bootstrap config.

### Development
Note: This is WIP and will definitely need to be updated later on
```
npm install
npm run build
npm start
```

### Permission System

Users are assigned groups (which are embedded in the SAML assertion) which determine what they can do.
By default, there are 4 roles:

| Role        | Description     |
| ----------- |:-------------|
| Hacker      | Hacker stuff | 
| Volunteer   | Barebones permissions for checking in user (Currently not really used)      |
| Organizer   | General organizer stuff like reviewing applications, etc.      |
| Admin       | Full system access      |

### Object management

This system was designed to handle data as general as possible. As such, validation and access is
governed through a system of tester functions embedded in the models.

#### Schema Structure
```typescript
{
  // Rule here says that only organizers can read, delete, and create, but anyone is allowed to write
  readCheck: (request: ReadCheckRequest<ObjectType>) => request.requestUser.jwt.roles.organizer,
  writeCheck: true,
  
  // NOTE: These checks are ONLY performed on the top level
  deleteCheck: (request: DeleteCheckRequest<ObjectType>) => request.requestUser.jwt.roles.organizer,
  createCheck: (request: CreateCheckRequest<ObjectType>) => request.requestUser.jwt.roles.organizer,
  
  fields: {
    field1: {
      type: String,
      
      // These rules are applied on top of the rules from the higher scope
      
      // The read will only succeed if the user has a uid of 1234, and 
      fieldValue
      readCheck: (request: ReadCheckRequest<ObjectType>) => request.requestUser.jwt.uid == 1234,
      writeCheck: (request: WriteCheckRequest<FieldType, ObjectType>) => request.value.length < 5, 
    }
  }
}
```
On each nested level of the schema, `readCheck` and `writeCheck` rules should be specified. The fields
for that level should be in a map under the key `fields`. The controller will be expecting this structure for all read/write operations.

On `read`, `write`, `create`, and `delete` operations, `readCheck`, `writeCheck`, `createCheck`, and `deleteCheck` are called with a `ModelRequest` object respectively.
To be safe, the return value is presumed to be `false` unless explicitly stated otherwise.

**createCheck and deleteCheck are ONLY checked on the top level!**

The request object passed into the tester function is defined in `src/types/types.ts` and generally contains the user objects of the
requester and target user. For write operations, the new value for the field is also provided.

When a `read` check returns `false`, there will be no error. Instead, the relevant field(s) will simply be omitted from the results.
On the other hand, when a `write` or `delete` operation fails, the entire request will be rejected and terminated. Reading is more of a passive action, whereas
writing is active.

#### Read/Write Interceptors

### NOTE: WRITE INTERCEPTORS ARE NOT CURRENTLY IMPLEMENTED!

Sometimes it's nice to be able to swap fields as its being read/write. Interceptors allow for this kind of logic to be integrated into
the schema and dynamically loaded. If no interceptors are specified, the system will perform the usual read/write operation.

Note that interceptors may only be applied to the individual fields and **NOT** to groups of fields, since the interception is highly
dependent on the type of the field. 

```typescript
{
  fields: {
    field1: {
      type: String,
      
      // When we read, the value of `field1` will have a suffix of `is very cool!`
      readInterceptor: (request: ReadInterceptRequest<FieldType, ObjectType>) => request.value + " is very cool!"
      
      // When we write, we will prefix the value with `banana`
      writeInterceptor: (request: WriteInterceptRequest<FieldType, ObjectType>) => "banana" + request.value
    }
  }
}
```

#### Form submission validator

A special `submitCheck` can be added to fields where the condition to submit may differ from the condition to
save. An instance where this could be useful is when there is a minimum character requirement for a field, but a user may not
necessarily satisfy that condition if they submit early. Therefore, we must provide a second set of checkers for this situation.

By default, `writeCheck` will be used to evaluate both submission and write attempts, but if `submitCheck` is explicitly provided, 
it will be used IN ADDITION to the write check (at least for the `updateApplication` implementation in `UserController`).

`submitCheck` will be tested separately from the standard `writeCheck` since we want to accumulate all the errors across the entire
to present to the user. `editObject` will normally terminate as soon as an invalid field is found since all `writeCheck` conditions must be true 
for an edit to succeed.

```typescript
{
  writeCheck: true,
  FIELDS: {
    
    myCoolField: {
      type: String,
      
      writeCheck: (request: WriteCheckRequest<string, string>) => request.fieldValue.length < 100,
      submitCheck: (request: WriteCheckRequest<string, string>) => request.fieldValue.length >= 10,
      
      // The user can save myCoolField as much as they want as long as the length is less than 100,
      // however, when they submit the form we will ensure it is also at least length 10
    }
    
  }
}
```
