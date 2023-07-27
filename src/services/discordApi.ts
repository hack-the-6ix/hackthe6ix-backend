import {BadRequestError, InternalServerError} from "../types/errors";
import {createJwt, verifyToken} from "./permissions";
import axios from "axios";
import {IUser} from "../models/user/fields";
import User from "../models/user/User";
import {DiscordSyncState} from "../types/types";
import {log} from "./logger";

export interface DiscordTokenResponse {
    access_token: string;
    refresh_token: string;
    expires_at: number; // this is in milliseconds
}

export interface DiscordConnectionMetadata {
    isconfirmedhacker?: 0 | 1,
    isorganizer?: 0 | 1
}

export const getDiscordTokensFromUser = (user: IUser): DiscordTokenResponse => {
    if(!user.discord.refreshToken || !user.discord.accessToken || user.discord.accessTokenExpireTime === undefined) {
        throw new BadRequestError("User does not have a Discord account linked.");
    }

    return {
        access_token: user.discord.accessToken,
        expires_at: user.discord.accessTokenExpireTime,
        refresh_token: user.discord.refreshToken
    };
}
/**
 * Generates a Discord OAuth2 login URL
 */
export const generateDiscordOAuthUrl = async (redirectUrl: string):Promise<string> => {
    const stateData = {
        redirectUrl
    };

    const stateString = createJwt(stateData, '15 minutes');

    const url = new URL('https://discord.com/api/oauth2/authorize');
    url.searchParams.set('client_id', process.env.DISCORD_CLIENT_ID!);
    url.searchParams.set('redirect_uri', redirectUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('state', stateString);
    url.searchParams.set('scope', 'role_connections.write identify');
    url.searchParams.set('prompt', 'consent');
    return url.toString();
}

/**
 * Given an OAuth2 code from the scope approval page, make a request to Discord's
 * OAuth2 service to retrieve an access token, refresh token, and expiration.
 */
export async function getOAuthTokens(stateToken: string, code: string): Promise<DiscordTokenResponse> {
    const stateInfo = verifyToken(stateToken);
    const redirectUrl = stateInfo.redirectUrl;


    if(!redirectUrl) {
        throw new BadRequestError("Unable to retrieve the state redirect url.")
    }

    const url = 'https://discord.com/api/v10/oauth2/token';
    const body = new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUrl,
    });

    const response = await axios({
        url,
        method: "POST",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: body
    });

    const tokenData = response.data;
    tokenData["expires_at"] = Math.floor(Date.now() + (tokenData["expires_in"] * 1000 * 0.8));

    delete tokenData["expires_in"];

    return tokenData as DiscordTokenResponse;
}

/**
 * The initial token request comes with both an access token and a refresh
 * token.  Check if the access token has expired, and if it has, use the
 * refresh token to acquire a new, fresh access token.
 */
export async function getAccessToken(userID: string, tokens: DiscordTokenResponse):Promise<DiscordTokenResponse> {
    if (Date.now() > tokens.expires_at) {
        console.log("we are refrehsing", Date.now(), tokens);
        const url = 'https://discord.com/api/v10/oauth2/token';
        const body = new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID!,
            client_secret: process.env.DISCORD_CLIENT_SECRET!,
            grant_type: 'refresh_token',
            refresh_token: tokens.refresh_token,
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

            await User.updateOne({
                _id: userID
            }, {
                'discord.lastSyncTime': Date.now(),
                'discord.lastSyncStatus': "SUCCESS" as DiscordSyncState,
                'discord.accessTokenExpireTime': tokenData["expires_at"],
                'discord.refreshToken': tokenData.refresh_token
            });

            return tokenData as DiscordTokenResponse;
        }
        catch(e: any) {
            let syncStatus: DiscordSyncState = "SOFTFAIL";

            if(!isNaN(e.response?.status)) {
                // retry for rate limit or server error, otherwise hard fail it
                if(e.response?.status !== 429 && (e.response?.status < 500 || e.response?.status > 599)) {
                    syncStatus = "HARDFAIL";
                }
            }

            await User.updateOne({
                _id: userID
            }, {
                discord: {
                    lastSyncStatus: syncStatus,
                    lastSyncTime: Date.now()
                }
            }).catch((err) => {
                log.error(`The was an error writing an updated Discord refresh token for ${userID}.`, err);
            });

            throw new InternalServerError("Unable to retrieve access token from refresh token.");
        }

    }
    return tokens;
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

/**
 * Fetch the metadata currently pushed to Discord for the currently logged
 * in user, for this specific bot.
 */
export async function getMetadata(tokens: DiscordTokenResponse):Promise<DiscordConnectionMetadata> {
    // GET /users/@me/applications/:id/role-connection
    const url = `https://discord.com/api/v10/users/@me/applications/${process.env.DISCORD_CLIENT_ID}/role-connection`;

    const response = await axios({
        url,
        headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json',
        }
    });

    return response.data.metadata as DiscordConnectionMetadata;
}