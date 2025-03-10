import { Database } from "sqlite3";
import { getUsers } from "../scrapers/users";
import { MessageType, statusMessage } from "./console";
import { insertRow, isModuleScraped } from "./database";
import { SiteAuth } from "../interfaces/generic";
import { fileExists, parseJsonFile } from "./files";
import { addExitListeners, removeExitListeners } from "./exit";
import { enjinRequest } from "./request";
import { Messages } from "../interfaces/messages";

export async function startNotifier(database: Database, domain: string, apiKey: string, siteAuth: SiteAuth, messageSubject: string, messageBody: string) {
    statusMessage(MessageType.Info, 'Running in notifier mode...');
    statusMessage(MessageType.Info, 'The users module will be immediately scraped, and then the program will begin sending messages to each user found');
    statusMessage(MessageType.Critical, 'NOTE: It is highly reccomended that you do not use this mode with your primary account, as it very well could be banned by Enjin');
    statusMessage(MessageType.Info, `The message with the subject "${messageSubject}" and the folling content will be sent to all site users: ${messageBody}`);
    statusMessage(MessageType.Info, 'Press enter to continue or Ctrl + C to exit...');
    await new Promise<void>(resolve => process.stdin.once('data', () => resolve()));

    const disableUserParams = {ips: true, tags: true, fullinfo: true, characters: true, games: true, photos: true, wall: true, yourFriends: true};
    await isModuleScraped(database, 'users') ? {} : await getUsers(database, domain, '', apiKey, disableUserParams, []);

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

    let userCount = [0];

    if (fileExists('./target/recovery/notifier_progress.json')) {
        statusMessage(MessageType.Info, 'Recovering notifier progress from previous session...')
        const progress = parseJsonFile('./target/recovery/notifier_progress.json') as [number[]];
        userCount = progress[0];
    }

    addExitListeners(['./target/recovery/notifier_progress.json'], [[userCount]])

    const totalUsers = users.length;

    statusMessage(MessageType.Info, `Sending messages to ${totalUsers} users... Estimated time: ${(totalUsers - userCount[0]) * 21 / 3600} hours`);

    for (let i = userCount[0]; i < totalUsers; i++) {
        userCount = [i]
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
                const match = pmRequest.error.message.match(/Please wait (\d+) (\w+) before sending another message\./)
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
                    statusMessage(MessageType.Process, `Waiting ${timeInMilliseconds}ms (${time} ${unit}) before trying ${users[i].user_id} ${users[i].username} again...`);
                    await new Promise((resolve) => setTimeout(resolve, timeInMilliseconds + 1000));

                    // Retry the user.
                    i--;
                    continue;
                } else {
                    process.kill(process.pid, 'SIGINT');
                }
            }
            await new Promise((resolve) => setTimeout(resolve, 21000));
            continue;
        }

        await new Promise((resolve) => setTimeout(resolve, 21000));
        statusMessage(MessageType.Process, `Sent message to ${users[i].user_id} ${users[i].username} [(++${userCount[0]}/${totalUsers})]`);
    }

    removeExitListeners();
}