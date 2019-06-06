'use strict';

const ChildProcess = require('child_process');

const Hoek = require('@hapi/hoek');
const Toys = require('toys');

const internals = {};

module.exports = (server, options) => ({
    value: {
        default: {
            command: async (srv, args) => {

                const [domain, timeout] = args;

                Hoek.assert(domain, 'Domain required');

                let firstRun = true;
                let isAvailable;
                let status;
                let messages = [];

                while (!isAvailable) {

                    if (firstRun) {
                        firstRun = false;
                    }
                    else {
                        await internals.awaitTimeout(timeout || 20000);
                    }

                    if (!messages.length) {
                        messages = internals.initMessages();
                    }

                    console.log(`Checking if ${domain} is available...`);

                    const awsCliProcess = ChildProcess.spawn('aws', [
                        'route53domains',
                        'check-domain-availability',
                        '--domain-name',
                        domain,
                        '--region',
                        'us-east-1'
                    ]);

                    awsCliProcess.stdout.on('data', (d) => {

                        const parsedData = JSON.parse(d.toString('utf8'));

                        status = parsedData.Availability;
                        console.log('==================================');
                        console.log('Status:', status);
                        console.log('==================================');

                        if (parsedData.Availability === 'AVAILABLE') {
                            isAvailable = true;
                        }
                        else {
                            console.log('Advice: ' + messages.pop());
                        }
                    });

                    await Toys.event(awsCliProcess, 'exit');
                }

                console.log(`${domain.toUpperCase()} IS AVAILABLE!`);
            }
        }
    }
});

internals.awaitTimeout = async (timeout) => {

    return await new Promise((res, rej) => {

        setTimeout(res, timeout);
    });
};

internals.initMessages = () => internals.shuffle([
    'Not yet!',
    'Be patient my padawan!',
    'Go make a sandwich!',
    'Have you tried drumpstershrimp?',
    'Howbout you ask yourself ya turkey!'
]);

// Adapted from https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array#answer-12646864
// Comments included. Excluding this comment. And the one above.

// Here is a JavaScript implementation of the Durstenfeld shuffle,
// a computer-optimized version of Fisher-Yates:

// Randomize array element order in-place.
// Using Durstenfeld shuffle algorithm.
internals.shuffle = (arr) => {

    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }

    return arr;
};
