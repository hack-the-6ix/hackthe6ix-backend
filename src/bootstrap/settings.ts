import Settings from '../models/settings/Settings';
import settingsData from './data/settings.json';

const settings = Settings.findOne({}).then((settings) => {
    if(!settings) {
        Settings.create(settingsData).then(() => {
            console.log("Settings initialized!");
        }).catch((err) => {
            console.log(err);
            console.log("Error initializing settings! Exiting.");
            process.exit(1);
        })
    }
});