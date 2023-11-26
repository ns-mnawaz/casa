import cron from'node-cron';
import { EventEmitter } from 'node:events';

import './common/array.js';
import log from './common/log.js';
import { searchSaveApply } from './common/houses.js';

import WBM from './associate/wbm.js';
import Howoge from './associate/howoge.js';
import Degewo from './associate/degewo.js';
import constant from './common/constant.js';
import Gewobag from './associate/gewobag.js';
import Gesobau from './associate/gesobau.js';
import Vonovia from './associate/vonovia.js';
import Deutsche from './associate/deutsche.js';
import Berlinovo from './associate/berlinovo.js';
import AdlerGroup from './associate/adlerGroup.js';
import Stadtundland from './associate/stadtundland.js';
import InBerlinWohnen from './associate/inBerlinWohnen.js';

/**
 * start main function
 *
 * @param {boolean} search 
 */
async function main (apply = false) {
    try {
        const houses = await Promise.all([
            Deutsche.search(),
            Berlinovo.search(),
            Vonovia.search(),
            Gewobag.search(),
            AdlerGroup.search(),
            Degewo.search(),
            Howoge.search(),
            // InBerlinWohnen.search(),
            Stadtundland.search(),
            Gesobau.search(),
        ]);
        await searchSaveApply(houses, apply);
    } catch(error) {
        log.error('Error Stack ----->', error);
        console.error('Error Stack ----->', error);
    }
}

async function searchWBM(apply = false) {
    try {
        const houses = await Promise.all([
            WBM.search(),
        ]);
        await searchSaveApply(houses, apply);
    } catch(error) {
        log.error('Error Stack searchWBM ----->', error);
        console.error('Error Stack searchWBM ----->', error);
    }
}
log.info({ message: 'Home Search Start ' + new Date(), rooms: constant.rooms, price: constant.price });

await main(true);
new EventEmitter().setMaxListeners(50);
cron.schedule('*/3 * * * * *', async () => {
    process.stdout.write('.'+new Date().getSeconds());
    await main(true);
    process.stdout.write('-'+new Date().getSeconds());
});

await searchWBM(true);
cron.schedule('5 */15 * * * *', async () => {
    await searchWBM(true);
});

process
  .on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p);
  })
  .on('uncaughtException', err => {
    console.error('Uncaught Exception thrown');
    log.error('Uncaught Exception thrown', err);
  });
