import './common/array.js';
import cron from'node-cron';
import log from './common/log.js';
import Howoge from './associate/howoge.js';
import Degewo from './associate/degewo.js';
import Gewobag from './associate/gewobag.js';
import Vonovia from './associate/vonovia.js';
import Deutsche from './associate/deutsche.js';
import Berlinovo from './associate/berlinovo.js';
import AdlerGroup from './associate/adlerGroup.js';
import Stadtundland from './associate/stadtundland.js';
import { searchSaveApply } from './common/houses.js';
import WBM from './associate/wbm.js';
import constant from './common/constant.js';

/**
 * start main function
 */
async function main () {
    try {
        process.stdout.write('.'+new Date().getSeconds());
        await Promise.all([
            AdlerGroup.submit(),
            Berlinovo.submit(),
            Degewo.submit(),
            Gewobag.submit(),
            Vonovia.submit(),
        ]);
        process.stdout.write('-'+new Date().getSeconds());

        setTimeout(async () => {
            await main();
        }, 1000);

    } catch(error) {
        console.error('Error Stack main----->', error);
        log.error('Error Stack main----->', error);
    }
}
/**
 * start main function
 */
async function mainExec () {
    try {
        process.stdout.write('*'+new Date().getSeconds());
        await Promise.all([
            Howoge.submit(),
            Stadtundland.submit(),
            Deutsche.submit(),
        ]);
        process.stdout.write('^'+new Date().getSeconds());

        setTimeout(async () => {
            await mainExec();
        }, 1000);

    } catch(error) {
        log.error('Error Stack mainExec----->', error);
        console.error('Error Stack mainExec----->', error);
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

await Promise.all([ main(), mainExec()]);

// await searchWBM(true);
// cron.schedule('10 */15 * * * *', async () => {
//     await searchWBM(true);
// });

process
  .on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p);
    log.error(reason, 'Unhandled Rejection at Promise', p);
  })
  .on('uncaughtException', err => {
    console.error('Uncaught Exception thrown');
    log.error('Uncaught Exception thrown', err);
  });
