# Hack the 6ix API Documentation

Unless otherwise stated, request fields are (probably) optional.

## API - General Object Operations

#### POST - Get Object (Admin)
`/get/:objectType` <br/>
Get the result of a search query for any object type. Queries are checked against `readCheck` policy.

##### Input Specification
The API requires the object type passed in as a query parameter. Additionally, a search query must be specified in the body of the request.
```json
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
    ]
  }
}
```

##### Output Specification
The API will return an array of maps corresponding to the queried object. 
Note that the number of items returned may not match the limit specified in the query if some objects were
filtered out as part of field sanitation.
```json
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



#### POST - Edit Object (Admin)
`/edit/:objectType`<br/>
Edit existing objects. Changes are validated against `writeCheck` policy.

#### POST - Delete Object (Admin)
`/delete/:objectType`
Delete existing objects. Changes are validated against `deleteCheck` policy.

#### POST - Create Object (Admin)
`/create/:objectType`
Create new object. Requests are validated against `createCheck` and `writeCheck` policy.

## Action - Operations for specific object types

## Auth - Authentication related operations
