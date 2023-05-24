import { log } from './logger';

if(!process.env.JWT_SECRET) {
    log.error("A valid JWT_SECRET must be defined!");
    process.exit(1);
}