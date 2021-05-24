# Hack the 6ix Backend

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
