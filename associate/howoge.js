import util from 'util';
import puppeteer from 'puppeteer';
import log from '../common/log.js';
import constant from '../common/constant.js';
import requests from '../common/requests.js';
import { recordFails, save, searchHome } from '../common/houses.js';
import exec from '../common/exec.js';

const howoge = {
    api: 'https://www.howoge.de/?type=999&tx_howsite_json_list[action]=immoList',
    ui: 'https://www.howoge.de/wohnungen-gewerbe/wohnungssuche.html?tx_howsite_json_list%5Bpage%5D=1&tx_howsite_json_list%5Blimit%5D=12&tx_howsite_json_list%5Blang%5D=&tx_howsite_json_list%5Brooms%5D=%s',
    basePath: 'https://www.howoge.de',
    ui: 'https://www.howoge.de/wohnungen-gewerbe/wohnungssuche.html?tx_howsite_json_list%5Bpage%5D=1&tx_howsite_json_list%5Blimit%5D=12&tx_howsite_json_list%5Blang%5D=&tx_howsite_json_list%5Brooms%5D=%s'
}

class Howoge {
    /**
     * search Gewobag
     *
     * @returns houses
     */
    static async search() {
        try {
            const { price, rooms, showUI } = constant;
            const ui = util.format(howoge.ui, rooms);
            if (showUI) {
                console.log('Howoge -----> ', ui);
            }
            const body = util.format('tx_howsite_json_list%5Bpage%5D=1&tx_howsite_json_list%5Blimit%5D=12&tx_howsite_json_list%5Blang%5D=&tx_howsite_json_list%5Brooms%5D=%s&tx_howsite_json_list%5Bwbs%5D=wbs-not-necessary', rooms);
            const method = 'POST';
            const headers = { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' };
            const res = await (await fetch(howoge.api, { headers, body, method })).json();
            let data = res.immoobjects || [];
            data = data.filter((item) => item.rent < Number(price) && item.wbs?.toLowerCase() !== 'ja');
            const houses = data.map((house) => {
                return {
                    title: house.notice,
                    rent: String(house.rent)+ ' € warm',
                    area: String(house.area),
                    address: house.title,
                    path: howoge.basePath + house.link,
                    company: 'Howoge',
                    rooms: house.rooms
                }
            });
            return houses;
        } catch (error) {
            log.error({message: '---- Howoge search error'});
            process.stdout.write('---- Howoge search error ----');
            return [];
        }
    }

    /**
     * apply Howoge
     *
     * @param {string} id page id
     * @param {string} path page path
     */
    static async apply(id, path) {
        log.info({message: 'Apply Howoge Start', path});
        requests.forEach((person) => {
            try {
                this._apply(id, path, person)
            } catch(error) {
                log.info('---- Howoge applied error ', error);
            }
        });
        return Promise.resolve(false);
    }
    /**
     * 
     * @param {string} _page 
     * @param {object} request 
     */
    static async _apply(_id, _page, request, retry=0) {
        const {firstName, lastName, email, phoneNumber} = request;
        const delay = 100;
        log.info({message: 'Apply Howoge Start', _page, email});
        const browser = await puppeteer.launch({ headless: 'new' });
        try {
            const page = await browser.newPage();
            await page.goto(_page, { waitUntil: 'networkidle2' });
            await page.waitForSelector('#cmpwrapper');

            await (
                await page.evaluateHandle(`document.querySelector("#cmpwrapper").shadowRoot.querySelector("#cmpbntyestxt")`)
            ).asElement().click();

            await page.waitForSelector('#gewerbe-form-wrapper > div > div > div > div > div:nth-child(1) > div.text-center > a');
            await page.click('#gewerbe-form-wrapper > div > div > div > div > div:nth-child(1) > div.text-center > a')

            await page.waitForSelector('#main > div:nth-child(7) > div > div > div.step-content.show > div.row.mb-4 > div > div > div:nth-child(4) > label > div > svg');
            await page.click('#main > div:nth-child(7) > div > div > div.step-content.show > div.row.mb-4 > div > div > div:nth-child(4) > label > div > svg')

            await page.waitForSelector('#main > div:nth-child(7) > div > div > div.step-content.show > div:nth-child(2) > div > div > div.col-sm-6.mb-2.mb-sm-0.order-0.order-sm-1 > button');
            await page.click('#main > div:nth-child(7) > div > div > div.step-content.show > div:nth-child(2) > div > div > div.col-sm-6.mb-2.mb-sm-0.order-0.order-sm-1 > button')

            await page.waitForSelector('#main > div:nth-child(7) > div > div > div.step-content.show > div.row.mb-4 > div > div:nth-child(3) > label > div > svg');
            await page.click('#main > div:nth-child(7) > div > div > div.step-content.show > div.row.mb-4 > div > div:nth-child(3) > label > div > svg')

            await page.waitForSelector('#main > div:nth-child(7) > div > div > div.step-content.show > div:nth-child(2) > div > div > div.col-sm-6.mb-2.mb-sm-0.order-0.order-sm-1 > button');
            await page.click('#main > div:nth-child(7) > div > div > div.step-content.show > div:nth-child(2) > div > div > div.col-sm-6.mb-2.mb-sm-0.order-0.order-sm-1 > button');

            await page.waitForSelector('#main > div:nth-child(7) > div > div > div.step-content.show > div:nth-child(2) > div > label > div > svg');
            await page.click('#main > div:nth-child(7) > div > div > div.step-content.show > div:nth-child(2) > div > label > div > svg');

            await page.waitForSelector('#main > div:nth-child(7) > div > div > div.step-content.show > div:nth-child(3) > div > div > div.col-sm-6.mb-2.mb-sm-0.order-0.order-sm-1 > button');
            await page.click('#main > div:nth-child(7) > div > div > div.step-content.show > div:nth-child(3) > div > div > div.col-sm-6.mb-2.mb-sm-0.order-0.order-sm-1 > button');

            await page.waitForSelector('#main > div:nth-child(7) > div > div > div.step-content.show > div:nth-child(1) > div > label > span');
            await page.click('#main > div:nth-child(7) > div > div > div.step-content.show > div:nth-child(1) > div > label > span');

            await page.waitForSelector('#main > div:nth-child(7) > div > div > div.step-content.show > div:nth-child(2) > div > div > div.col-sm-6.mb-2.mb-sm-0.order-0.order-sm-1 > button');
            await page.click('#main > div:nth-child(7) > div > div > div.step-content.show > div:nth-child(2) > div > div > div.col-sm-6.mb-2.mb-sm-0.order-0.order-sm-1 > button');

            const fname= '#show-visit-form > div:nth-child(2) > div.col-lg-6 > div:nth-child(3) > div.col-md-6.mb-3.mb-md-0 > div > input[type=text]';
            await page.waitForSelector(fname);
            await page.click(fname)
            await page.type(fname, firstName, {delay});
            
            const lname= '#show-visit-form > div:nth-child(2) > div.col-lg-6 > div:nth-child(3) > div:nth-child(2) > div > input[type=text]';
            await page.waitForSelector(lname);
            await page.click(lname)
            await page.type(lname, lastName, {delay});

            const emailEle= '#email';
            await page.waitForSelector(emailEle);
            await page.click(emailEle)
            await page.type(emailEle, email, {delay});

            const phoneEle= '#show-visit-form > div:nth-child(2) > div.col-lg-6 > div:nth-child(4) > div:nth-child(2) > div > input[type=tel]';
            await page.waitForSelector(phoneEle);
            await page.click(phoneEle)
            await page.type(phoneEle, phoneNumber, {delay});

            const submitEle = '#show-visit-form > div:nth-child(3) > div > div:nth-child(1) > div.col-sm-6.mb-2.mb-sm-0.order-0.order-sm-1 > button';
            await page.waitForSelector(submitEle);
            await page.click(submitEle);

            const infoEle = '#main > div:nth-child(7) > div > div > div.step-content.show > div > div > div.h3.color-primary';
            const element = await page.waitForSelector(infoEle);
            const info = await page.evaluate(name => name.innerText, element);
            console.log('Howoge ' + info);
            if(info === 'Vielen Dank.') {
                log.info('---- Howoge applied success APPLY_DONE', { _page, email });
            } else {
                log.error('---- Howoge applied error APPLY_ERROR', { email, firstName, lastName, _page });
                throw new Error('---- Howoge applied error APPLY_ERROR');
            }
            await browser.close();
        } catch(error) {
            log.error('---- Howoge applied error APPLY_ERROR', { error });
            await browser.close();
            setTimeout(() => {
                if (retry <= constant.MAX_RETRY) {
                    retry = ++retry;
                    log.info('----- Retry  Howoge apply', { _page, email });
                    this._apply(_id, _page, request, retry);
                } else {
                    recordFails([{ path: _page, title: _id || _page, company: constant.HOWOGE }]);
                }
            }, constant.RETRY_WAIT * 1000);
        }
    }
    /**
     * submit request
     */
    static async submit() {
        const houses = await this.search();
        const result = await searchHome(houses, constant.HOWOGE);
        await exec(constant.HOWOGE, result);
        await save(result, constant.HOWOGE);
    }
}

export default Howoge;
