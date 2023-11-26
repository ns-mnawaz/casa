import util from 'util';
import notifier from 'node-notifier';
import lockfile from 'proper-lockfile';
import log from './log.js';
import file from './file.js';
import date from './date.js';
import apply from './apply.js';
import constant from './constant.js';

/**
 * search Save Apply
 * @param {houses<Array>} newHouses
 */
async function searchSaveApply(newHouses, apply) {
    let houses = [];
    newHouses.forEach((newHome) => {
        houses = houses.concat(newHome);
    });
    const result = await searchHome(houses);
    await applyHouses(result, apply);
    await save(houses);
}
/**
 * submit request
 * @param {house<Array>} houses 
 * @param {string} company 
 */
async function submit(houses, company) {
    const new_houses = await searchHome(houses, company, true);
    const failures = await homeApply(new_houses);
    const fail_paths = failures.map((fail) => fail.path);
    const filters = houses.filter((house) => fail_paths?.indexOf(house.path) === -1);
    await save(filters, company);
    await recordFails(failures);
}
/**
 * apply for house
 * @param {house<Array>} houses 
 * @returns houses
 */
async function homeApply(houses) {
    houses = houses || [];
    let failures = [];
    for(const house of houses) {
        const failure = await apply(house.company, house.id, house.path);
        if(failure) {
            failures.push(house);
        } else {
            notifier.notify({
                title: util.format('%s - %s', house.company, house.rent),
                message: util.format('Apply Success Address : %s, Rooms: %s', house.address, house.rooms),
                sound: 'Glass',
                timeout: 4000,
                open: house.path
            }, (error, response) => {
                log.error('Notifier Apply Success error ---> ' + house.path, error);
                log.info('Notifier Apply Success response ---> ' + house.path, response);
            });
        }
    }
    return failures;
}
/**
 * record failures
 * @param {house<Array>} house 
 */
async function recordFails(houses) {
    for(const house of houses) {
        notifier.notify({
            title: 'Apply Failure',
            message: util.format('Company: %s', house.company),
            sound: 'Glass',
            timeout: 5000,
            open: house.path
        }, (error, response) => {
            log.error('Notifier Apply Failure error ---> ' + house.path, error);
            log.info('Notifier Apply Failure response ---> ' + house.path, response);
        });
        house.failure_date = new Date();
    }
    await save(houses, constant.FAILURES);
}
/**
 * apply Houses
 * @param {houses<Array>} newHouses
 */
async function applyHouses(newHouses, _apply){
    if (newHouses.length) {
        newHouses.forEach(home => {
            if(!!home?.path) {
                log.info(new Date() + ' ------> ' + home.path, home);
                console.log(new Date() + ' ------> ', home.path);
                if(_apply) {
                    apply(home.company, home.id, home.path);
                }
                notifier.notify({
                    title: util.format('%s - %s', home.company, home.rent),
                    message: util.format('Address : %s, Rooms: %s', home.address, home.rooms),
                    sound: 'Glass',
                    timeout: 3000,
                    open: home.path
                });
            }
        });
    }
}
/**
 * save houses
 *
 * @param {Array<house>} houses 
 * @param {string} company
 */
async function save(houses, company) {
    if(!houses?.length){
        return true;
    }
    let file_name = date.format(new Date());
    if (company) {
        file_name = company + constant.SLASH + file_name;
    }
    try {
        await file.exists(file_name);
        const release = await lockfile.lock(file.fullName(file_name));
        const history = await file.readJson(file_name);
        const allHouses = [].concat(history, houses).uniq(['title', 'path']);
        await file.writeJson(allHouses, file_name);
        await release();
    } catch (error) {
        log.error('File save error', error);
        process.stdout.write('__File save error__' + file_name);
    }
}
/**
 * search home
 *
 * @param {Array<house>} houses
 * @param {string} company
 */
async function searchHome(houses, company, fail_history=false) {
    let file_name = date.format(new Date());
    let file_name2 = date.format(new Date(new Date().setDate(new Date().getDate()-1)));
    if (company) {
        file_name = company + constant.SLASH + file_name;
        file_name2 = company + constant.SLASH + file_name2;
    }
    const today = await file.readJson(file_name);
    const yesterday = await file.readJson(file_name2);
    let history = [].concat(today, yesterday);
    if (fail_history) {
        const failures = await file.readJson(constant.FAILURES + constant.SLASH + date.format(new Date()));
        history = history.concat(failures);
    }
    return houses.diff(history, ['title', 'path']);
}

export { searchSaveApply, submit, searchHome, save, recordFails };
