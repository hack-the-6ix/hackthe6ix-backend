# Configuration

WARNING: If you are using the Kubernetes Helm chart, this directory is completely overriden, so do not store any assets that are not loaded by the Helm chart in here (like code)!

## Mailer
Before the server starts up, the configuration file will be checked
against the Enums [here](../src/types/mailer.ts) to ensure it is valid.
If more templates or lists are added, it is important to add it to the list
to ensure reliability.


```
{
  "templates": {
    "applicationIncomplete": { // This is the human-friendly name that can be used within the backend to identify templates
      "subject": "Your Hack the 6ix application is incomplete", // This is used in the subject of transactional emails
      "templateID": "XXXXXX" // This is the Mailtrain templateID
    },
    ...
  },
  "lists": {
    "applicationIncomplete": { // This is the human-friendly name that can be used within the backend to identify mailing lists
      "listID": "XXXXXX", // This is the mailtrain mailing list ID
      "query": { // Users who match this mongoDB query will be included in this mailing list after sync
        "status.applied": true // example
      }
    },
    ...
  }
}
```
