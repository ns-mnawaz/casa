import apply from './common/apply.js';
import logger from './common/log.js';
import {findHome} from './common/houses.js';

const [ company, id, path ] = process.argv.slice(2);

async function main(_company, _id, _path) {
    try {

        const house = await findHome(_company, _path, true);
        if(house) {
            const res = await apply(_company, _id, _path, house);
            if (res) {
                const message = { message: 'Apply triggered', _company, _id, _path };
                console.log(message);
                logger.info(message);
            }
        } else {
            logger.error('House not found in history');
        }
    } catch(error) {
        logger.error('Apply Error Stack ----->', error);
        console.error('Apply Error Stack ----->', error);
    }
}

await main(company, id, path);

process
  .on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Apply Unhandled Rejection at Promise', p);
    log.error(reason, 'Apply Unhandled Rejection at Promise', p);
  })
  .on('uncaughtException', err => {
    console.error('Apply Uncaught Exception thrown');
    log.error('Apply Uncaught Exception thrown', err);
  });
