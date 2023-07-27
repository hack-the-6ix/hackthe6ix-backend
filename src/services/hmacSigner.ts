import * as crypto from 'crypto';

function signString (msg: string) {
    const key = new Buffer(process.env.HMAC_KEY!, 'hex');
    return crypto.createHmac('sha256', key).update(msg).digest('hex');
}