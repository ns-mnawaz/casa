import cron from'node-cron';
import './common/array.js';
import log from './common/log.js';
import { searchHome, save } from './common/houses.js';
import constant from './common/constant.js';
import Deutsche from './associate/deutsche.js';
import notifier from 'node-notifier';
import util from 'util';

/**
 * start main function
 *
 * @param {boolean} search 
 */
async function main (apply = false) {
    try {
        const list = await Promise.all([
            Deutsche.search('Berlin - Lichtenberg'),
            Deutsche.search('Berlin - Friedrichsfelde'),
        ]);
        let houses = [];
        list.forEach((newHome) =>  houses = houses.concat(newHome));
        const new_houses = await searchHome(houses);
        for(const house of new_houses) {
            notifier.notify({
                title: util.format('%s - %s', house.company, house.rent),
                message: util.format('Found Apartment : %s, Rooms: %s', house.address, house.rooms),
                sound: 'Glass',
                timeout: 4000,
                open: house.path
            }, (error, response) => {
                log.error('Notifier Apply Success error ---> ' + house.path, error);
                log.info('Notifier Apply Success response ---> ' + house.path, response);
            });
        }
        await save(houses);
    } catch(error) {
        log.error('Error Stack ----->', error);
        console.error('Error Stack ----->', error);
    }
}

log.info({ message: 'Home Search Start ' + new Date(), rooms: constant.rooms, price: constant.price });

await main(true);
cron.schedule('*/3 * * * * *', async () => {
    process.stdout.write('.'+new Date().getSeconds());
    await main(true);
    process.stdout.write('-'+new Date().getSeconds());
});

process
  .on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p);
  })
  .on('uncaughtException', err => {
    console.error('Uncaught Exception thrown');
    log.error('Uncaught Exception thrown', err);
  });
