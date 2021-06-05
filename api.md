# Hack the 6ix API Documentation

Unless otherwise stated, request fields are (probably) optional.

Also, pretend that the JSON is valid :) I left out some double quotes to make it a bit more cleaner.

## API - General Object Operations

#### POST - Get Object (Organizer)
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
  data: [
    {
       ...results1
    },
    {
       ...results2
    }
  ]
}
```



#### POST - Edit Object (Organizer)
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
  data: [ // IDs of objects that were changed
    "id1234",
    "id1235",
    ...
  ]
}
```

#### POST - Delete Object (Admin)
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
  data: [ // IDs of objects that were deleted
    "id1234",
    "id1235",
    ...
  ]
}
```

#### POST - Create Object (Admin)
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
  data: "id1234" // ID of the new object is returned
}
```

## Action - Operations for specific object types

## Auth - Authentication related operations

#### GET - Get metadata

#### GET - Starting point for login

#### POST - Assert endpoint for when login completes

#### POST - Starting point for logout

