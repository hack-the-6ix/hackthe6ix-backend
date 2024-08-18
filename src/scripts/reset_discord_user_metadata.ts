// Since our Discord linked roles metadata is not version by year, we need to reset the metadata for all users
// from the previous year BEFORE we start syncing the new year's roles.

// This script accepts a JSON file. It should be the exported JSON from MongoDB compass. Notably, the JSON should
// be an array of objects, with each object having a subobject "discord", with a field "accessToken",
// "accessTokenExpireTime", and "refreshToken".
import 'dotenv/config';

import * as fs from 'fs';
import {InternalServerError} from "../types/errors";

import axios from "axios";

export interface DiscordTokenResponse {
    access_token: string;
    refresh_token: string;
    expires_at: number; // this is in milliseconds
}

export interface DiscordConnectionMetadata {
    isconfirmedhacker?: 0 | 1,
    isorganizer?: 0 | 1
}

export interface UserDiscordObj {
    accessToken: string;
    accessTokenExpireTime: number;
    refreshToken: string;
}

/**
 * The initial token request comes with both an access token and a refresh
 * token.  Check if the access token has expired, and if it has, use the
 * refresh token to acquire a new, fresh access token.
 */
export async function getAccessToken(userID: string, userDiscordObj: UserDiscordObj):Promise<DiscordTokenResponse> {
    if (Date.now() > userDiscordObj.accessTokenExpireTime) {
        console.log("we are refrehsing", Date.now());
        const url = 'https://discord.com/api/v10/oauth2/token';
        const body = new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID!,
            client_secret: process.env.DISCORD_CLIENT_SECRET!,
            grant_type: 'refresh_token',
            refresh_token: userDiscordObj.refreshToken,
        });

        try {
            const response = await axios({
                url,
                method: "POST",
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                data: body
            });

            const tokenData = response.data;
            tokenData["expires_at"] = Math.floor(Date.now() + (tokenData["expires_in"] * 1000 * 0.8));

            delete tokenData["expires_in"];

            return tokenData as DiscordTokenResponse;
        }
        catch(e: any) {
            throw new InternalServerError("Unable to retrieve access token from refresh token.");
        }

    }

    return {
        access_token: userDiscordObj.accessToken,
        refresh_token: userDiscordObj.refreshToken,
        expires_at: userDiscordObj.accessTokenExpireTime
    }
}

/**
 * Given a user based access token, fetch profile information for the current user.
 */
export async function getUserData(tokens: DiscordTokenResponse): Promise<Record<string, any>> {
    const url = 'https://discord.com/api/v10/oauth2/@me';
    const response = await axios({
        url,
        headers: {
            Authorization: `Bearer ${tokens.access_token}`,
        }
    });

    return response.data;
}

/**
 * Given metadata that matches the schema, push that data to Discord on behalf
 * of the current user.
 */
export async function pushMetadata(tokens: DiscordTokenResponse, metadata: DiscordConnectionMetadata): Promise<void> {
    const url = `https://discord.com/api/v10/users/@me/applications/${process.env.DISCORD_CLIENT_ID}/role-connection`;

    await axios({
        url,
        method: "PUT",
        headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json',
        },
        data: {
            platform_name: 'Hack the 6ix',
            metadata,
        }
    });
}

// This file is run from the command line. It accepts a JSON file as an argument.
// The JSON file should be an array of objects, with each object having a subobject "discord",

(async () => {
    if (process.argv.length < 3) {
        console.error("Usage: node reset_discord_user_metadata.js <path_to_json>");
        process.exit(1);
    }

    const jsonPath = process.argv[2];
    const data = fs.readFileSync(jsonPath, 'utf-8');
    const users = JSON.parse(data);

    console.log(`There are ${users.length} users to process.`)

    const newTokensByUserId = new Map<string, DiscordTokenResponse>();
    const allErrorUserIds = [];

    // Iterate over each user and reset their metadata
    for (const user of users) {
        if (!user.discord) {
            continue;
        }

        try {
            const tokens = user.discord as UserDiscordObj;
            const newTokens = await getAccessToken(user._id, tokens);

            console.log("Got new tokens.", newTokens)

            // Store the new tokens for this user
            newTokensByUserId.set(user._id["$oid"], newTokens);

            await pushMetadata(newTokens, {
                isconfirmedhacker: 0,
                isorganizer: 0
            });

            // Wait 0.5 second to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
        catch(e: any) {
            console.error(`Failed to reset metadata for user ${user._id["$oid"]}`);
            console.error(e);
            allErrorUserIds.push(user._id["$oid"]);
        }
    }

    // Write the new tokens to a file, we should make an array of objects with the user ID and the new tokens
    const newTokensPath = jsonPath.replace('.json', '_new_tokens.json');
    const newTokensData = [];

    for (const [userId, tokens] of newTokensByUserId.entries()) {
        newTokensData.push({
            _id: {
                "$oid": userId
            },
            discord_token_data: tokens
        });
    }

    fs.writeFileSync(newTokensPath, JSON.stringify(newTokensData, null, 2));

    console.log(`All done. There were ${allErrorUserIds.length} errors.`);
    console.log("The errors were: ", allErrorUserIds);
})();