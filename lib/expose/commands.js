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

                let isAvailable;
                let status;

                while (!isAvailable) {

                    console.log('Checking...');

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
                        console.log('Status:', status);

                        if (parsedData.Availability === 'AVAILABLE') {
                            isAvailable = true;
                        }
                    });

                    await Toys.event(awsCliProcess, 'exit');

                    if (!isAvailable) {
                        console.log('Advice: ' + internals.patienceInspiration[Math.floor(Math.random() * internals.patienceInspiration.length)]);
                    }

                    await internals.awaitTimeout(timeout || 20000);
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

internals.patienceInspiration = [
    'Not yet!',
    'Be patient my padawan!',
    'Go make a sandwich!',
    'Have you tried drumpstershrimp?',
    'Ask yourself ya turkey!'
];
