import * as jose from 'node-jose';

/**
 * Adapted from code by obrassard at https://github.com/obrassard/shc-extractor
 *
 * Retrieved license:
 * MIT License
 *
 * Copyright (c) 2021 Olivier Brassard
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */



/**
 * Extract data from a raw 'shc://' string
 * @param {string} rawSHC The raw 'shc://' string (from a QR code)
 * @return The header, payload and verification result of the SHC
 */
import * as zlib from "zlib";

export const REQUIRED_DOSES = 2;

export interface COVIDQRVerifyResult {
    header: Record<string, any>,
    payload: Record<string, any>,
    verification: Record<string, any>,
    trusted: boolean,
    hasRequiredDoses: boolean
}

export const hasRequiredDoses = (fhirBundle: Record<string, any>, requiredDoses: number):boolean=> {
    let doseCount = 0;
    if(Array.isArray(fhirBundle?.entry)){
        for(const entry of fhirBundle.entry){
            // This will only verify that the person has had some sort of immunization
            // Logic for actual vaccine verification is much more annoying
            if(entry.resource?.resourceType === "Immunization"){
                ++doseCount;
            }
        }
    }
    return doseCount >= requiredDoses;
}

export const parseShc = async (rawSHC:string, keySet: Record<string, any>, requiredDoses = REQUIRED_DOSES):Promise<COVIDQRVerifyResult> => {
    const jwt = numericShcToJwt(rawSHC);
    const splitJwt = jwt.split(".")
    const header = parseJwtHeader(splitJwt[0])
    const payload = parseJwtPayload(splitJwt[1], header["zip"] === "DEF");

    const verification = await verifySignature(jwt, payload.iss, keySet)

    return {
        header,
        payload,
        verification,
        trusted: verification?.trustable ?? false,
        hasRequiredDoses: hasRequiredDoses(payload?.vc?.credentialSubject?.fhirBundle, requiredDoses)
    }
}

/**
 * Convert a SHC raw string to a standard JWT
 * @param {string} rawSHC The raw 'shc://' string (from a QR code)
 * @return {string} The encoded JWT
 */
function numericShcToJwt(rawSHC: string):string {

    if (rawSHC.startsWith('shc:/')) {
        rawSHC = rawSHC.split('/')[1];
    }

    return rawSHC
        .match(/(..?)/g)
        .map((number) => String.fromCharCode(parseInt(number, 10) + 45))
        .join("")
}

/**
 * Decode the JWT header and return it as an object
 * @param {string} header Base64 encoded header
 * @return {object} The decoded header
 */
function parseJwtHeader(header: string):Record<string, any> {
    const headerData = Buffer.from(header, "base64");
    return JSON.parse(headerData.toString('utf-8'))
}

/**
 * Decode and extract the JWT payload
 * @param {string} payload Base64 encoded + zlib compressed jwt payload
 * @return {object} The decoded payload
 */
function parseJwtPayload(payload: string, compressed=true):Record<string, any> {
    const buffer = Buffer.from(payload, "base64");

    const payloadJson = compressed ? zlib.inflateRawSync(buffer) : buffer;
    return JSON.parse(payloadJson.toString('utf-8'));
}

/**
 * Verify the signature of a JWT with the given issuer
 * using the public key of the issuer.
 *
 * @param {string} jwt JWT to verify
 * @param {string} issuer The expected issuer of the JWT
 * @param {object} keySet Set of accepted issuer keys
 * @return The verification result
 */
async function verifySignature(jwt:string, issuer:string, keySet: Record<string, any>) {
    const keys = await getKeys(issuer, keySet);

    if(keys) {
        try {
            const result = await jose.JWS.createVerify(keys.keys).verify(jwt)

            return {
                trustable: true,
                verifiedBy: result.key.kid,
                origin: issuer,
                isFromCache: keys.isFromCache
            }
        } catch (err) {
            return {
                trustable: false,
                isFromCache: keys.isFromCache
            }
        }
    }
    else {
        return {
            trustable: false,
            isFromCache: false
        }
    }

}

/**
 * Get the public keys of the given issuer.
 * We try to get the keys from the cache first,
 * if not found, we fetch them from the issuer.
 *
 * @param {string} issuer Issuer of the JWT to verify
 * @param {object} keySet Set of accepted issuer keys
 * @return {{keys: jose.JWK.Key | jose.JWK.KeyStore, isFromCache: boolean}} Key or keystore from the issuer
 */
async function getKeys(issuer: string, keySet: Record<string, any>) {
    if (keySet[issuer]) {
        const key = keySet[issuer];
        return {
            keys: await jose.JWK.asKey(key),
            isFromCache: true
        }
    }
}
