﻿const config = require("./config.json");
const jsonfile = require('jsonfile');
const Twitter = require('twitter');
const kapitalize = require('./kapitalize');
const twitterBot = new Twitter({
    consumer_key: config.twitConsumer_key,
    consumer_secret: config.twitConsumer_secret,
    access_token_key: config.twitAccess_token_key,
    access_token_secret: config.twitAccess_token_secret
});
const BotUserName = config.yourBotName;
const twitFile = ('./components/twitAddresses.json');

let twitInit = () => {

    console.log(`Connecting To Twitter Account ${BotUserName}`);

    twitterBot.stream('statuses/filter', {track: '!address, !pay, #ECA'}, function(stream) {
        console.log(`Listening On Twitter....`);
        stream.on('data', function(tweet) {
            const addressCall = 'ECA_Tip_Bot';
            let tweeterID = tweet.user.id;
            let tweetUser = tweet.user.name;
            const args = tweet.text.slice(config.prefix.length).trim().split(/ +/g);
            const command = args[0].toLowerCase();
            console.log(`
            New Notification From: ${JSON.stringify(tweet.user.name)}
            user id: ${JSON.stringify(tweet.user.id)}
            Tweet Content: ${JSON.stringify(tweet.text)}           
            `);

            if (command === 'pay' && tweet.user.id === !config.bot_id || command === 'pay' && tweet.user.id === !config.personal_id) {
                console.log(`Someone Is Trying To Pay Someone, Maybe With Another Bot`);
                console.log('userid: ' + tweet.user.id);
                console.log('configID: ' + config.personal_id);
                return;
            }

            if (command === 'pay' && tweet.user.id === config.bot_id && !args[1] || command === 'pay' && tweet.user.id === config.personal_id && !args[1]) {
                console.log(`No User Specified`);
                return;
            }

            if (command === 'pay' && tweet.user.id === config.bot_id && !args[2] || command === 'pay' && tweet.user.id === config.personal_id && !args[2]) {
                console.log(`No Amount Specified`);
                return;
            }

            if (command === 'pay' && tweet.user.id === config.bot_id || command === 'pay' && tweet.user.id === config.personal_id) {
                let replyToThis = addressCall;
                //Do The Thing With The Stuff
                console.log(`Command: ${args[0]}`);
                let sendTo = args[1];
                console.log(`sendTo: ${sendTo}`);
                let params = { screen_name: `${sendTo}`};
                console.log(params);
                let amtString = args[2];
                let amt = (parseInt(amtString));
                console.log(amt);
                twitterBot.get('users/show', params, (err,data,response) => {
                    let sendToID = (data.id);
                    console.log(`Tweeter ID: ${sendToID}`);
                    jsonfile.readFile(twitFile, (err, obj) => {
                        if (err) {
                            console.log(`Error: ${err}`);
                            return;
                        } else if (!obj[sendToID]) {
                            console.log('Nothing Here');
                            twitterBot.post('statuses/update', {status: `(◕‿◕✿) Hey  ${sendTo}\n ${tweetUser} is Trying To Send You ${amt} $ECA! \n Link Your Public Wallet Address By Tweeting the following: \n !address ${replyToThis} Your_Address`});
                            return;
                        } else {
                            console.log(`User ID Found: Sending Payment To: ${obj[sendToID]}`);
                            kapitalize.sendToAddress(obj[sendToID], amt);
                            twitterBot.post('statuses/update', {status: `${addressCall} Just Sent ${sendTo} ${amt} $ECA! \n #ECA #Electracoin @ElectracoinECA`})
                            .then((tweet) => {
                                console.log(`Tweet Sent To: ${sendTo}`);
                                return;
                            })
                            .catch((error) => {
                                throw error;
                            });
                            return;            
                        }
                    })
                });
            }

            if (command === 'address' && args[1] !== config.yourTwitname || command === 'address' && args[1] !== config.yourBotName) {
                console.log(`User Failed - @user <<< Error @Username`);
                console.log(addressCall);
                console.log(`Provided:  ${args[1]}`);
                return;
            }

            if (command === 'address' && args[1] == config.yourBotName && !args[2] || command === 'address' && args[1] == config.yourTwitname && !args[2]) {
                console.log(`User Failed - Address <<< Error: No Address`);
                return;
            }

            if (command === 'address' && args[1] === config.yourBotName || command === 'address' && args[1] === config.yourTwitname) {
                let address = args[2];
                console.log(address);
                let newInfo = (`"${tweeterID}": "${address}"`);
                console.log(newInfo);
                jsonfile.readFile(twitFile, (err, obj) => {
                    if (err) {
                        console.log(`There was an issue reading Addresses.JSON`);
                        return;
                    } else if (!obj[tweeterID]) {
                        let newObj = (JSON.parse(JSON.stringify(obj).slice(0,-1)+","+newInfo+"}"));
                        jsonfile.writeFile(twitFile, newObj, function(err) {
                            if(err) {
                                console.log(err);
                                return;
                            } else {
                                console.log(`Information Saved ID: ${tweetUser} Address: ${newObj[tweeterID]}`);
                                return;
                            }
                        })
                    } else {
                        let oldAddress = obj[tweeterID];
                        let needle = (`"${tweeterID}":"${oldAddress}"`);
                        let newAddress = (`"${tweeterID}":"${address}"`);
                        let saveThis = JSON.parse(JSON.stringify(obj).replace(needle,newAddress));
                        jsonfile.writeFile(twitFile, saveThis, (err) => {
                            if(err) {
                                console.log(err);
                                return;
                            } else {
                                console.log(`Information Saved ID: ${tweetUser} Address: ${saveThis[tweeterID]}`);
                                return;
                            }
                        })
                    }
                })
                console.log(`Adding Info: Name: ${tweetUser} --- Address: ${address}`);
                twitterBot.post('statuses/update', {status: `@${tweetUser} You are all set up to receive #ECA Payments! You Can Repeat This Anytime To Change! #ECA #Electracoin @ElectracoinECA`})
                .then((tweet) => {
                    console.log(`Tweet Sent To: ${tweetUser}`);
                    return;
                })
                .catch((error) => {
                    throw error;
                });
            }
        });

            stream.on('error', (error) => {
                console.log(error);
                return;
        })
    });
};

module.exports = { 
    twitInit
};