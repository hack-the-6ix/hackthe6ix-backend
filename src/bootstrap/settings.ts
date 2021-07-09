import * as fs from 'fs';
import * as path from 'path';
import Settings from '../models/settings/Settings';

const settingsData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'config', 'settings.json')).toString('utf8'));

const settings = Settings.findOne({}).then((settings) => {
  if (!settings) {
    Settings.create(settingsData).then(() => {
      console.log('Settings initialized! Restart the server to apply changes.');
      process.exit(0);
    }).catch((err) => {
      console.log(err);
      console.log('Error initializing settings! Exiting.');
      process.exit(1);
    });
  }
});
