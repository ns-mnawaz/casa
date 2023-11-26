import util from 'util';
import axios from 'axios';
import constant from '../common/constant.js';
import log from '../common/log.js';
import puppeteer from 'puppeteer';
import requests from '../common/requests.js';
import { recordFails, save, searchHome } from '../common/houses.js';
import exec from '../common/exec.js';

const deutsche = {
    ui: 'https://www.deutsche-wohnen.com/en/rent/renting-property/rent-an-apartment#page=1&locale=en&commercializationType=rent&utilizationType=flat,retirement&location=Berlin&city=Berlin&price=%s&rooms=%s',
    api: 'https://immo-api.deutsche-wohnen.com/estate/findByFilter',
    apiData: '{"infrastructure":{},"flatTypes":{},"other":{"requiresQualificationCertificate":false},"page":"1","locale":"en","commercializationType":"rent","utilizationType":"flat,retirement","location":"Berlin","city":"Berlin","price":"%s","rooms":"%s"}',
    basePath: 'https://www.deutsche-wohnen.com/en/expose/object/'
};

class Deutsche {
    /**
     * search Deutsche
     *
     * @returns houses
     */
    static async search() {
        try {
            const { price, rooms, showUI } = constant;
            const ui = util.format(deutsche.ui, price, rooms);
            if (showUI) {
                console.log('Deutsche -----> ', ui);
            }
            const roomParam = String(+rooms + 0.5);
            const config = {
                method: 'post',
                url: deutsche.api,
                headers: {'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'},
                data: util.format(deutsche.apiData, price, roomParam)
            };
            const response = await axios.request(config);
            let data = response.data || [];
            data = data.filter((item) => !item.requiresQualificationCertificate);
            const houses = data.map((house) => {
                return {
                    title: house.title,
                    rent: String(house.price) + ' €',
                    area: String(house.area),
                    address: house.address.street + ' ' + house.address.houseNumber + ' ' + house.address.zip + ' ' + house.address.district + ' ' + house.address.city,
                    path: deutsche.basePath + house.id,
                    company: constant.DEUTSCHE,
                    rooms: house.rooms,
                    date: new Date(house.date),
                    id: house.id
                }
            });
            return houses;
        } catch (error) {
            log.error({message: '---- Deutsche search error' });
            process.stdout.write('---- Deutsche search error ----');
            return [];
        }
    }
    /**
     * apply Deutsche
     *
     * @param {string} path page path 
     */
    static async apply(id, path) {
        console.log('Apply Deutsche Start');
        for(const person of requests) {
            try {
                this._apply(id, path, person);
            } catch(error) {
                log.error('---- Deutsche applied error APPLY_ERROR', error);
            }
        }
        return Promise.resolve(false);
    }

    static async _apply(_id, _page, request, retry=0) {
        const { firstName, lastName, email, phoneNumber, message } = request;
        log.info('---- Deutsche apply start', { _page, email, firstName, lastName });
        const currentEmployment = 'Angestellte(r)';
        const incomeType = '1';
        const incomeLevel = 'M_3';
        const delay = 100;
        const browser = await puppeteer.launch({ headless: 'new' });
        try {
            const page = await browser.newPage();
            await page.goto(_page, { waitUntil: 'networkidle2' });
            await page.waitForSelector('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll');
            await page.click('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll');
            log.info('____ Deutsche Form accept cookie', { _page, email });
            await page.waitForSelector('#first-name');
            await page.click('#first-name');
            await page.type('#first-name', firstName, {delay});
            log.info('____ Deutsche Form first name', { _page, email });
            await page.waitForSelector('#last-name');
            await page.click('#last-name')
            await page.type('#last-name', lastName, {delay});
            log.info('____ Deutsche Form last name', { _page, email });
            await page.waitForSelector('#email');
            await page.click('#email')
            await page.type('#email', email, {delay});
            log.info('____ Deutsche Form email', { _page, email });
            await page.waitForSelector('#phone');
            await page.click('#phone')
            await page.type('#phone', phoneNumber, {delay});
            log.info('____ Deutsche Form phone', { _page, email });
            await page.waitForSelector('#currentEmployment');
            await page.select('#currentEmployment', currentEmployment);
            log.info('____ Deutsche Form current employment', { _page, email });
            await page.waitForSelector('#incomeType');
            await page.select('#incomeType', incomeType);
            log.info('____ Deutsche Form income type', { _page, email });
            await page.waitForSelector('#incomeLevel');
            await page.select('#incomeLevel', incomeLevel);
            log.info('____ Deutsche Form income level', { _page, email });
            await page.waitForSelector('#message');
            await page.click('#message');
            await page.type('#message', message, {delay: delay/10});
            log.info('____ Deutsche Form message', { _page, email });
            await page.waitForSelector('#form-requestEstate > div.form__submit-container.form-expose__submit-container > button');
            await page.click('#form-requestEstate > div.form__submit-container.form-expose__submit-container > button');
            log.info('____ Deutsche Form submit button', { _page, email });
            const element = await page.waitForSelector('#page-header > div.page-content__hero.module.fade-in-early > div.article-head > div');
            const info = await page.evaluate(name => name.innerText, element);
            log.info('____ Deutsche Form submit form', { _page, email });
            console.log('Deutsche ' + info);
            if(info === 'Thank you for your request.') {
                const message = { _page, email, date: new Date() }
                log.info('---- Deutsche applied success APPLY_DONE', message);
            } else {
                log.error('---- Deutsche applied error APPLY_ERROR', { email, firstName, lastName, _page });
                throw new Error('---- Deutsche applied error APPLY_ERROR');
            }
            await browser.close();
        } catch(error) {
            log.error('---- Deutsche applied error APPLY_ERROR', { error });
            await browser.close();
            setTimeout(() => {
                if (retry <= constant.MAX_RETRY) {
                    retry = ++retry;
                    log.info('----- Retry  Deutsche apply', { _page, email });
                    this._apply(_id, _page, request, retry);
                } else {
                    recordFails([{ path: _page, title: _id || _page, company: constant.DEUTSCHE }]);
                }
            }, constant.RETRY_WAIT * 1000);
        }
    }
    /**
     * submit request
     */
    static async submit() {
        const deutsche = await this.search();
        const result = await searchHome(deutsche, constant.DEUTSCHE);
        await exec(constant.DEUTSCHE, result);
        await save(result, constant.DEUTSCHE);
    }
}

export default Deutsche;
