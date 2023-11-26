import log from './log.js';

import WBM from '../associate/wbm.js';
import Howoge from '../associate/howoge.js';
import Degewo from '../associate/degewo.js';
import Gewobag from '../associate/gewobag.js';
import Vonovia from '../associate/vonovia.js';
import Deutsche from '../associate/deutsche.js';
import Berlinovo from '../associate/berlinovo.js';
import AdlerGroup from '../associate/adlerGroup.js';
import Stadtundland from '../associate/stadtundland.js';
import constant from './constant.js';
/**
 * apply for apartment
 * @param {string} company
 * @param {string} id
 * @param {string} path
 */
async function apply(company, id, path) {
    try {
        switch(company) {
            case constant.DEGEWO: 
                return await Degewo.apply(id, path);
            case constant.VONOVIA: 
                return await Vonovia.apply(id, path);
            case constant.ADLER_GROUP: 
                return await AdlerGroup.apply(id, path);
            case constant.BERLINOVO: 
                return await Berlinovo.apply(id, path);
            case constant.GEWOBAG:
                return await Gewobag.apply(id, path);
            case constant.DEUTSCHE:
                return await Deutsche.apply(id, path);
            case constant.HOWOGE:
                return await Howoge.apply(id, path);
            case constant.WBM:
                return await WBM.apply(id, path);
            case constant.STADT_UND_LAND:
                return await Stadtundland.apply(id, path);
            default:
                log.warn('Apply not implemented for ', company);
        }
    } catch(error) {
        log.error('---- error in apply', { path, error });
    }
}

export default apply;
