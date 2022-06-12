import {pdfToPng, PngPageOutput} from "pdf-to-png-converter";
import { PNG } from 'pngjs';
import jsQR from "jsqr";
import {COVIDQRVerifyResult, parseShc} from "./parsers";
import {BadRequestError, InternalServerError} from "../../types/errors";

const _parsePNG = (png:Buffer):Promise<PNG> => {
    return new Promise((resolve, reject) => {
        new PNG().parse(png, (err, imageData) => {
            if(err) {
                return reject(err);
            }

            return resolve(imageData);
        })
    });
}


export const parseQRCode = async (file: Buffer, mimeType: string):Promise<COVIDQRVerifyResult> => {
    if(!["application/pdf", "image/png"].includes(mimeType)){
        throw new BadRequestError("Only PDFs and PNG images are supported.");
    }

    let pngPages = [file];

    if(mimeType === "application/pdf") {
        try {
            const convertResult = await pdfToPng(file, // The function accepts PDF file path or a Buffer
                {
                    viewportScale: 2.5,
                    outputFileMask: 'buffer',
                    verbosityLevel: 0,
                    pagesToProcess: [1, 2] // Process max 2 pages to avoid DoS
                });

            pngPages = convertResult.map(convertResult => convertResult.content);
        }
        catch(err) {
            throw new BadRequestError("Unable to decode PDF.");
        }
    }

    let willThrowError:Error;

    for(const pngPage of pngPages){
        try {
            const decodedPNG = await _parsePNG(pngPage);
            const code = jsQR(decodedPNG.data as unknown as Uint8ClampedArray, decodedPNG.width, decodedPNG.height, {
                inversionAttempts: "dontInvert"
            });

            if (code) {
                const rawSHC = code.data;
                return await parseShc(rawSHC);

            }
            else {
                willThrowError = new BadRequestError("Unable to locate QR code!")
            }
        }
        catch(err) {
            willThrowError = new InternalServerError("Unable to process QR code.");
        }
    }

    throw willThrowError;
}