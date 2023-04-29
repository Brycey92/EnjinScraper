import { Database } from "sqlite3";
import { getUsers } from "../scrapers/users";
import { MessageType, statusMessage } from "./console";
import { insertRow, isModuleScraped } from "./database";
import { SiteAuth } from "../interfaces/generic";
import { fileExists, parseJsonFile } from "./files";
import { addExitListeners, removeExitListeners } from "./exit";
import { enjinRequest } from "./request";
import { Messages } from "../interfaces/messages";
import { writeJsonFile } from "./files";

export async function startNotifier(database: Database, domain: string, apiKey: string, siteAuths: SiteAuth[], messageSubject: string, messageBody: string) {
    statusMessage(MessageType.Info, 'Running in notifier mode...');
    statusMessage(MessageType.Info, 'The users module will be immediately scraped, and then the program will begin sending messages to each user found');
    statusMessage(MessageType.Critical, 'NOTE: It is highly reccomended that you do not use this mode with your primary account, as it very well could be banned by Enjin');
    statusMessage(MessageType.Info, `The message with the subject "${messageSubject}" and the folling content will be sent to all site users: ${messageBody}`);
    statusMessage(MessageType.Info, 'Press enter to continue or Ctrl + C to exit...');
    await new Promise<void>(resolve => process.stdin.once('data', () => resolve()));

    const disableUserParams = {ips: true, tags: true, fullinfo: true, characters: true, games: true, photos: true, wall: true};
    await isModuleScraped(database, 'users') ? {} : await getUsers(database, domain, apiKey, disableUserParams, []);

    const users: { user_id: string, username: string }[] = await new Promise((resolve, reject) => {
        database.all(`SELECT user_id, username FROM users`,
            (err, rows: [{ user_id: string, username: string }]) => {
                if (err) {
                    reject(err);
                } else {
                    const userValues = rows.map(row => ({user_id: `id-${row.user_id}`, username: row.username}));
                    resolve(userValues);
                }
            });
    });

    // let userCount = [0];
    // const rateLimits: { 
    //     [authId: number]: Date | undefined
    // } = Object.fromEntries(siteAuths.map((_, i) => [i, undefined]));

    let userCount = [0];
    interface RateLimit {
        authId: number;
        date?: Date;
    };
    var rateLimits:RateLimit[] = [];
    for (let i = 0; i < siteAuths.length; i++) {
        let authId = i;
        rateLimits.push({authId});
    }

    var findNextAuth:number = () => {
        //const authIds = Object.keys(rateLimits).map(id => parseInt(id));
        var authIds:number[] = [];
        for (let i = 0; i < rateLimits.length; i++) {
            authIds.push(rateLimits[i].authId);
        }
        
        
        var authsWithoutRateLimit:number[] = [];
        var authsWithRateLimit:number[] = [];
        for (let i = 0; i < authIds.length; i++) {
            if(typeof rateLimits[i].date === 'undefined') {
                authsWithoutRateLimit.push(i);
            } else {
                authsWithRateLimit.push(i);
            }
        }
        // Return the first auth without a rate-limit
        if (authsWithoutRateLimit.length > 0) {
            return authsWithoutRateLimit[0]!;
        }
        var minRateLimit = rateLimits[authsWithRateLimit[0]].date!.valueOf();
        for (let i = 0; i < authsWithRateLimit.length; i++) {
            let curRateLimit = rateLimits[authsWithRateLimit[i]].date!.valueOf();
            if (curRateLimit < minRateLimit) {
                minRateLimit = curRateLimit;
            }
        }
        
        // Return the auth with the closest rate-limit to now
        statusMessage(MessageType.Info, `Finding auth with rate limit at '${minRateLimit}'...`);
        for (let i = 0; i < authsWithRateLimit.length; i++) {
            if (rateLimits[authsWithRateLimit[i]].date!.valueOf() === minRateLimit) {
                return rateLimits[authsWithRateLimit[i]].authId!;
            }
        }
    }

    if (fileExists('./target/recovery/notifier_progress.json')) {
        statusMessage(MessageType.Info, 'Recovering notifier progress from previous session...')
        var progress = parseJsonFile('./target/recovery/notifier_progress.json') as [number[]];
        userCount = progress[0];
    }

    //addExitListeners(['./target/recovery/notifier_progress.json'], [[userCount]])

    const totalUsers = users.length;

    statusMessage(MessageType.Info, `Sending messages to ${totalUsers} users... Estimated time: ${(totalUsers - userCount[0]) * 21 / 3600} hours`);

    for (let i = userCount[0]; i < totalUsers; i++) {
        
        // Select the next auth with the lowest rate or no rate-limit
        const authId = findNextAuth();
        statusMessage(MessageType.Process, `Current time: '${Date.now()}'...`);
        statusMessage(MessageType.Process, `Auth rate-limit time: '${rateLimits[authId] ? rateLimits[authId]!.valueOf() : 'none'}'...`);
        statusMessage(MessageType.Process, `Selecting Auth ${authId} with rate-limit ms of '${rateLimits[authId] ? rateLimits[authId]!.valueOf() - Date.now() : 'none'}'...`);

        // Sleep if the auth has a rate-limit
        const delay = rateLimits[authId] ? Math.max(rateLimits[authId]!.valueOf() - Date.now(), 0) : 0;
        if (delay > 0) {
            statusMessage(MessageType.Process, `Waiting ${delay / 1000} seconds before sending next message...`);
            await new Promise<void>(resolve => setTimeout(() => resolve(), delay));
        } else if (i != 0) {
            statusMessage(MessageType.Process, `Waiting 21 seconds before sending next message...`);
            await new Promise<void>(resolve => setTimeout(() => resolve(), 21000));
        }
        
        // Select the site auth with this auth id
        const siteAuth = siteAuths[authId % siteAuths.length];

        userCount = [i];
        writeJsonFile('./target/recovery/notifier_progress.json', [userCount]);
        const pmRequest = await enjinRequest<Messages.SendMessage> ({
            recipients: [users[i].user_id],
            message_subject: messageSubject,
            message_body: messageBody.replace('{USERNAME}', users[i].username),
        }, 'Messages.sendMessage', domain, {
            Cookie: `${siteAuth.csrfToken}; enjin_browsertype=web; ${siteAuth.phpSessID}`,
            Referer: `https://${domain}/dashboard/messages/compose`,
        })

        if (pmRequest.error) {
            statusMessage(MessageType.Error, `Error sending message to ${users[i].user_id} ${users[i].username}: ${pmRequest.error.code}, ${pmRequest.error.message}`);
            if (pmRequest.error.message.startsWith('This user has chosen to only')) {
                await insertRow(database, 'private_users', users[i].user_id, users[i].username);
                statusMessage(MessageType.Process, `Skipping ${users[i].user_id} ${users[i].username} [(++${userCount[0]}/${totalUsers})]`);
            } else {
                const match = pmRequest.error.message.match(/Please wait (\d+) (\w+) before sending another message\./);
                const dailyLimitMatch = pmRequest.error.message.match(/You have reached your daily message limit, please try again tomorrow\./);
                if (match) {
                    const time = parseInt(match[1]);
                    const unit = match[2];
                    let timeInMilliseconds = 0;
                  
                    if (unit === "seconds" || unit === "second") {
                      timeInMilliseconds = time * 1000;
                    } else if (unit === "minutes" || unit === "minute") {
                      timeInMilliseconds = time * 60 * 1000;
                    } else if (unit === "hours" || unit === "hour") {
                      timeInMilliseconds = time * 60 * 60 * 1000;
                    } else {
                        statusMessage(MessageType.Error, `Did not expect unit ${unit}... Exiting...`);
                        process.kill(process.pid, 'SIGINT');
                    }
                    statusMessage(MessageType.Process, `Auth ${authId} rate-limited for ${timeInMilliseconds}ms (${time} ${unit}). Trying ${users[i].user_id} ${users[i].username} again...`);

                    // Add the rate-limit to the auth
                    rateLimits[authId] = new Date(Date.now() + timeInMilliseconds);

                    // Retry the user.
                    i--;
                    
                    continue;
                } else if (dailyLimitMatch) {
                    statusMessage(MessageType.Process, `Auth ${authId} rate-limited for the day. Setting a 1-hour cooldown. Trying ${users[i].user_id} ${users[i].username} again...`);

                    // Add the rate-limit to the auth
                    statusMessage(MessageType.Info, `Now: '${Date.now()}'`);
                    rateLimits[authId] = new Date(Date.now() + (60 * 60 * 1000));
                    statusMessage(MessageType.Info, `Rate limit until: '${rateLimits[authId]!.valueOf()}'`);

                    // Retry the user.
                    i--;
                } else {
                    process.kill(process.pid, 'SIGINT');
                }
            }
            // Set the rate-limit to 21 seconds for this auth as to avoid spamming the API
            rateLimits[authId] = new Date(Date.now() + 21000);
            continue;
        }

        // Set the rate-limit to 21 seconds for auth as to avoid spamming the API
        rateLimits[authId] = new Date(Date.now() + 21000);
        statusMessage(MessageType.Process, `Sent message to ${users[i].user_id} ${users[i].username} [(++${userCount[0]}/${totalUsers})]`);
    }

    //removeExitListeners();
}