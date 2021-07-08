# Hack the 6ix API Documentation

Unless otherwise stated, request fields are (probably) optional.

Also, pretend that the JSON is valid :) I left out some double quotes to make it a bit more cleaner.

In general, APIs will respond in the following format:
```
{
  status: <status code>,
  message: <main payload>
}
```

## API - General Object Operations

### POST - Get Object (Organizer)
`/api/get/:objectType`

Get the result of a search query for any object type. Queries are checked against `readCheck` policy.

##### Input Specification
`objectType` refers to the name of the object being operated on (duh).

The API requires the object type passed in as a query parameter. Additionally, a search query must be specified in the body of the request.
```
{
  page: 1, // Required - 1 indexed page number to fetch
  size: 20, // Required - Number of objects per page
  sortCriteria: "asc", // Can be asc or desc
  sortField: "profile.internal.applicationScore", // Path to field to use for sort
  text: "Banana", // Is added as an "OR" filter
  filter: { // Any additional manual filters
    "$or": [ // If any of these expressions are true, then there's a match
      { baz: "bar" },
      { bang: "pang" },
    ],
    "$and": [ // All these expressions need to be true
      { lastName: "foo" },
      { firstName: "baz", bop: "beep" },
    ],
    beep: "boop", // Statements like this on the top level also need to be true
    internal: {
      notes: "trash" // Nested field (note this is different than the boo.bap example as internal must match this map exactly)
    },
    "boo.bap": "reee"
  }
}
```

##### Output Specification
The API will return an array of maps corresponding to the queried object. 
Note that the number of items returned may not match the limit specified in the query if some objects were
filtered out as part of field sanitation.
```
{
  status: 200,
  message: [
    {
       ...results1
    },
    {
       ...results2
    }
  ]
}
```



### POST - Edit Object (Organizer)
`/api/edit/:objectType`

Edit existing objects. Changes are validated against `writeCheck` policy.

##### Input Specification
`objectType` refers to the name of the object being operated on (duh).


```
{
  filter: { // All objects that match this filter (mongoDB format) will be affected
     _id: 12345
  },
  changes: { // Changes to apply to the object (mongoDB format)
    firstName: "foobar"
  }  
}
```

##### Output Specification

```
{
  status: 200,
  message: [ // IDs of objects that were changed
    "id1234",
    "id1235",
    ...
  ]
}
```

### POST - Delete Object (Admin)
`/api/delete/:objectType`

Delete existing objects. Changes are validated against `deleteCheck` policy.

##### Input Specification
`objectType` refers to the name of the object being operated on (duh).

All objects that match the filter query will be deleted.

```
{ // The entire body is the mongoDB filter query
  _id: 12345,
  firstName: "foobar",
  ...
}
```

##### Output Specification


```
{
  status: 200,
  message: [ // IDs of objects that were deleted
    "id1234",
    "id1235",
    ...
  ]
}
```

### POST - Create Object (Admin)
`/api/create/:objectType`

Create new object. Requests are validated against `createCheck` and `writeCheck` policy.

##### Input Specification
`objectType` refers to the name of the object being operated on (duh).

Note that all inputs will be validated using `writeCheck`.

```
{ // Initial values for the new object
  firstName: "test",
  lastName: "bar",
  ....
}
```

##### Output Specification

```
{
  status: 200,
  message: "id1234" // ID of the new object is returned
}
```

### GET - Get file from GridFS (Organizer)
`/api/gridfs?filename=<filename goes here>`

Fetch a file stored in GridFS given its name. Note that it isn't guaranteed for files to have 
unique names if they are added to GridFS through methods other than `writeGridFSFile`.

##### Input Specification
Specify the name of the file to be fetched as a query parameter. 

##### Output Specification
The queried file will be returned if successful.

### PUT - Write file to GridFS (Organizer)
`/api/gridfs?filename=<filename goes here>`

Upload a file to GridFS with a specific file name. If a file exists with that name, delete it first.

##### Input Specification
Specify the filename as a query parameter and submit the file to be uploaded with the name "file".

For example, a file can be manually added by running:
```bash
http --form put localhost:3005/api/gridfs?filename=thisisthefilename.pdf file@file.pdf x-access-token:$TOKEN
```

##### Output Specification
```
{
    "message": "Success",
    "status": 200
}
```

### DELETE - Delete file from GridFS (Organizer)
`/api/gridfs?filename=<filename goes here>`

Delete a file from GridFS given its name if it exists.

##### Input Specification
Specify the file to be deleted as a query parameter.

##### Output Specification
```
{
    "message": "Success",
    "status": 200
}
```

Error 404 will be returned if the file is not found.

## Action - Operations for specific object types

### GET - Get hacker profile (Hacker)
`/api/action/profile`

Get the sanitized user object corresponding to the requesting user.

#### Output Specification
```
{
  status: 200,
  message: {
    // User object goes here
  }
}
```

### POST - Update Application (Hacker)
`/api/action/updateapp`

Update the hacker application

#### Input Specification
```
{
  submit: true, // Whether to mark the application for submission
  application: {
    // Application content goes here
  }
}
```

#### Output Specification
```
{
  status: 200,
  message: "Success" 
}
```

On failure:
```
{
  status: 403,
  message: ["firstName", "lastName"] // Return an array of fields that failed validation
}
```

### PUT - Update Resume (Hacker)
`/api/action/updateresume`

#### Input Specification
Send the resume file with the name field `resume` and magic will happen!


### GET - Get application enums (Hacker)
`/api/action/applicationEnums`

#### Output Specification
Dictionary of fields with enums and an array of valid values.

### POST - Create Team
`/api/action/createTeam`

Create a new team and add the user to it.

#### Output Specification
```
{
  status: 200,
  message: {
    code: "teamcode goes here",
    memberNames: [
      "Bill Gates"
    ]
  }
}
```

### POST - Join Team
`/api/action/joinTeam`

Join an existing team if there is room.

#### Input Specification
```
{
  teamCode: "teamcodegoeshere"
}
```

#### Output Specification
```
{
  status: 200,
  message: {
    code: "teamcodegoeshere",
    memberNames: [
      "Bill Gates"
    ]
  }
}
```

### POST - Leave Team
`/api/action/leaveTeam`

Remove the user from their team, and delete it if they were the last user.

#### Output Specification
```
{
  status: 200,
  message: "Success"
}
```

### GET - Get Team
`/api/action/getTeam`

Get the user's current team

#### Output Specification
```
{
  status: 200,
  message: {
    code: "teamcodegoeshere",
    memberNames: [
      "Bill Gates"
    ]
  }
}
```

### GET - Get statistics
`/api/action/getStatistics?update=false`

#### Input Specification
Change `update` in the query string to `true` if the most up to date statistics are required immediately.
This will also update the cache, which by default has a lifetime of 5 minutes.

#### Output Specification
```
{
  status: 200,
  message: {
    ...stats go here, look at src/services/statistics.ts for the full typedef
  }
}
```

### POST - Sync Mailing Lists
`/api/action/syncMailingLists`

Trigger a mailing list sync with Mailtrain. If `forceUpdate` is enabled, all users
eligible for a mailing list will be sent to mailtrain, even if they are already synced, to ensure all tags
are updated too.

#### Input Specification
```
{
  mailingList: <array of name of mailing list to sync> (all if omitted),
  forceUpdate: true | false,
  email: <if specified, only changes will be made to this address>
}
```

#### Output Specification
```
{
  status: 200,
  message: {
    added: [
      ... emails that were sent to mailtrain to be added/updated
    ],
    deleted: [
      ... emails removed from mailing list
    ]
   }
}
```

### POST - Verify Mailing List
`/api/action/verifyMailingList`

This will add a user to every registered mailing list with the (expected)
name of the mailing list in their email.

This can be used to verify that the correct list ID was used; however,
it does NOT verify that the query is correct.

The request user's mail merge will be used for all of the test users.

#### Output Specification
```
{
  status: 200,
  message: [
    // list of the names of mailing lists that were verified
  ]
}
```

### POST - Send a singular email
`/api/action/sendEmail`

Send an email to a user using the Mailtrain transactional API. If `email` corresponds to a user registered
in the system, tags will automatically be injected with information such as application deadline, confirmation deadline, etc.

#### Input Specification
```
{
  email: <email of the recipient>
  templateName: <name of the template to send>
  tags: <dictionary of tags to inject for mailmerge>
}
```

#### Output Specification
```
{
  status: 200,
  message: "Success"
}
```

### POST - Send email template tests
`/api/action/templateTest`

Send the requester an instance of every available email template to ensure everything looks correct.
This endpoint should be called after configuring the server to ensure that the correct template IDs
were used, and that all the mail merges were successful.

In the email, each mail merge field should be replaced by something that looks like `<<<FIELD goes here>>>`,
where `FIELD` is the name of the field it is replacing. Ensure that `FIELD` matches what you expect should be filled
in that spot.

#### Output Specification
```
{
  status: 200,
  message: [
    // List of template names that were sent
  ]
}
```

### POST - Update RSVP
`/api/action/rsvp`

This endpoint is used to update a user's RSVP status. A user may only RSVP if they are accepted, not previously declined, and are in the RSVP period (whether global or personal).
Once a user has declined, they cannot retract this decision.

#### Input Specification
```
{
  "attending": true // false if they are not attending... duh
}
```

#### Output Specification
```
{
  status: 200,
  message: "Success"
}
```

### GET - Get candidate (Organizer)
`/api/action/getCandidate?category=<category goes here>`

Fetch a random applicant that hasn't been graded yet.

#### Input Specification
`category` can be optionally specified as a query parameter to only return candidates
who are ungraded in that category. If left blank, no category will be prioritized.

#### Output Specification
```
{
  status: 200,
  message: {
    // User object goes here
  }
}
```

### POST - Grade candidate (Organizer)
`/api/action/gradeCandidate`

Assign a grade to a user in a particular category. The submitted grades will override any existing
ones and the dictionary will be merged (so omitted fields are unchanged).

#### Input Specification
```
{
  "candidateID": <id of user to grade>,
   "grades": {
     <category name>: <grade to assign the user>,
     ... // multiple categories can be graded simultaneously, if needed
   }
}
```

#### Output Specification
```
{
  status: 200,
  message: "Success"
}
```

## Auth - Authentication related operations

### POST - Starting point for login
`/auth/:provider/login`


##### Input Specification
`provider` refers to the name of the OpenID provider being operated on.

```
{
  "redirectTo": "<url to redirect the user to after authentication>", // the redirect is handled by frontend
  "callbackURL": "<url of the OpenID callback endpoint>" // will default to provider.callback_url
}
```

`callbackURL` should be set to the OpenID callback endpoint on the frontend. The frontend callback should then POST the code and state query parameters to the callback endpoint on the backend to retrieve the JWTs.

`redirectTo` is simply passed to the callback endpoint on the frontend. Generally it will be where the user is redirected to after the JWTs are retrieved and the session is started.
##### Output Specification
```
{
  "status": 200,
  "message": {
    "url": "<url to redirect the user to to begin auth flow>"
  }
}
```

The flow state will be set to a JSON string. The callback URL is stored in the `callbackURL` property and the redirect URL is stored in the `redirectTo` property.

### POST - Assert endpoint for when login completes
`/auth/:provider/callback`


##### Input Specification
`provider` refers to the name of the OpenID provider being operated on.

```
{
  "code": "<OpenID authorization code>",
  "state": "<the flow state>"
}
```

##### Output Specification
```
{
  "status": 200,
  "message": {
    "token": "<backend access token>",
    "refreshToken": "<OpenID refresh token>",
    "redirectTo": "<the url to redirect the user to> (optional)"
  }
}
```

### POST - Refresh Token
`/auth/:provider/refresh`

##### Input Specification
`provider` refers to the name of the OpenID provider being operated on.

```
{
  "refreshToken": "<refresh token goes here>"
}
```

##### Output Specification
```
{
  status: 200,
  message: {
    token: ...,
    refreshToken: ...
  }
}
```

### POST - Destroy the session
`/auth/:provider/logout`

##### Input Specification
`provider` refers to the name of the OpenID provider being operated on.

```
{
  "refreshToken": "<refresh token goes here>"
}
```

##### Output Specification
```
{
  "status": 200
}
```
