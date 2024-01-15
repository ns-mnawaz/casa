

import util from 'util';
import axios from 'axios';
import { load } from 'cheerio';
import puppeteer from 'puppeteer';
import log from '../common/log.js';
import constant from '../common/constant.js';
import requests from '../common/requests.js';
import { recordFails, save, searchHome } from '../common/houses.js';
import exec from '../common/exec.js';
import { get } from '../common/message.js';

const stadtundland = {
    ui: `https://www.stadtundland.de/immobiliensuche.php?form=stadtundland-expose-search-1.form&sp%3Acategories%5B3352%5D%5B%5D=-&sp%3Acategories%5B3352%5D%5B%5D=__last__&sp%3AroomsFrom%5B%5D=${constant.roomsFrom}&sp%3AroomsTo%5B%5D=%s&sp%3ArentPriceFrom%5B%5D=&sp%3ArentPriceTo%5B%5D=%s&sp%3AareaFrom%5B%5D=&sp%3AareaTo%5B%5D=&sp%3Afeature%5B%5D=__last__&action=submit`,
    basePath: 'https://www.stadtundland.de'
}

class Stadtundland {
    /**
     * search Stadtundland
     *
     * @returns houses
     */
    static async search() {
        const houses = [];
        try {
            const { price, rooms, showUI } = constant;
            const ui = util.format(stadtundland.ui, rooms, price);
            if (showUI) {
                console.log('Stadtundland -----> ', ui);
            }
            const response = await axios.get(ui);
            const $ = load(response.data);
            const data = $("li.SP-TeaserList__item");
            data.each(function() {
                const company = 'Stadtundland';
                const title = $(this).find(".SP-Teaser.SP-Teaser--expose article header").text();
                const address = $(this).find(".SP-Teaser.SP-Teaser--expose article tbody > tr:nth-child(2) > td").text();
                const rooms = $(this).find(".SP-Teaser.SP-Teaser--expose article tbody > tr:nth-child(3) > td").text();
                const rent = $(this).find(".SP-Teaser.SP-Teaser--expose article tbody > tr:nth-child(8) > td").text(); // warmmiete
                const area = $(this).find(".SP-Teaser.SP-Teaser--expose article tbody > tr:nth-child(4) > td").text();
                const path = stadtundland.basePath + $(this).find(".SP-Teaser.SP-Teaser--expose article .SP-Teaser__links.SP-LinkList--inline > ul:nth-child(2) > li:nth-child(2) > a").attr('href');
                const wbs = title.toLowerCase().includes('mit') && title.toLowerCase().includes('wbs');
                const date = new Date().toISOString();
                if (!wbs) {
                    houses.push({ title, address, rent, area, path, company, rooms, date });
                }
            });
            const _houses = houses.filter((item) => (Number(item.rooms) >= Number(rooms)));
            return _houses;
        } catch (error) {
            log.error({message: '---- Stadtundland search error'});
            process.stdout.write('---- Stadtundland search error ----');
            return houses;
        }
    }
    /**
     * apply Stadtundland
     *
     * @param {string} path page path 
     */
    static async apply(id, path, house) {
        log.info({ message: 'Apply Stadtundland Start', path });
        for(const person of requests){
            try {
                const msg = await get(house.company, house.rooms, house.rent, house.address, person.lastName, person.job);
                const message = msg || person.message;
                person.message = message;
                this._apply(id, path, person)
            } catch(error) {
                log.info('---- Stadtundland applied error ', error);
            }
        }
        return Promise.resolve(false);
    }
    /**
     * apply for persion
     * @param {string} _page 
     * @param {object} request 
     */
    static async _apply(_id, _page, request, retry=0) {
        const {firstName, lastName, email, phoneNumber, street, salutation_1, zipCode, city} = request;
        const delay = 100;

        const browser = await puppeteer.launch({ headless: true });
        try {
            const page = await browser.newPage();
            const ele = {
                cookie: 'body > div.SP-CookieUsageNotification > button > span',
                firstName: '#field-text-gen-1-input',
                lastName: '#field-text-gen-2-input',
                email: '#field-text-gen-7-input',
                phoneNumber: '#field-text-gen-6-input',
                submit: '#button-submit-gen-1 > span',
                salutation: '#field-select-gen-1-input',
                street: '#field-text-gen-3-input',
                city: '#field-text-gen-5-input',
                zipCode: '#field-text-gen-4-input',
                submitDone: '#registrierung-erfolgreich'
            }
            await page.goto(_page, { waitUntil: 'networkidle2' });
            await page.waitForSelector(ele.cookie);
            await page.click(ele.cookie);

            const wbsDiv1 = await page.$("#SP-Content > div > div.SP-Text.SP-Paragraph > div > div.SP-Table__scroller > table.SP-Table--expose.SP-Table--hasColumnData.SP-Table--orig > tbody > tr:nth-child(4) > th")
            const wbsText1 = await (await wbsDiv1.getProperty('textContent')).jsonValue()

            const wbsDiv = await page.$("#SP-Content > div > div.SP-Text.SP-Paragraph > div > div.SP-Table__scroller > table.SP-Table--expose.SP-Table--hasColumnData.SP-Table--orig > tbody > tr:nth-child(4) > td")
            const wbsText = await (await wbsDiv.getProperty('textContent')).jsonValue()
            const wbs = wbsText.toLocaleLowerCase() === 'ja';

            console.log('-----' + wbsText1 + ' --- ' + wbsText);
            log.info('-----' + wbsText1 + ' --- ' + wbsText);

            if (wbs) {
                log.info('----- WBS ignored path: ' + _page);
                await browser.close();
            } else {

                await page.waitForSelector(ele.salutation);
                await page.select(ele.salutation, salutation_1);

                await page.waitForSelector(ele.firstName);
                await page.click(ele.firstName)
                await page.type(ele.firstName, firstName, {delay});

                await page.waitForSelector(ele.lastName);
                await page.click(ele.lastName)
                await page.type(ele.lastName, lastName, {delay});

                await page.waitForSelector(ele.email);
                await page.click(ele.email)
                await page.type(ele.email, email, {delay});

                await page.waitForSelector(ele.phoneNumber);
                await page.click(ele.phoneNumber)
                await page.type(ele.phoneNumber, phoneNumber, {delay});

                await page.waitForSelector(ele.street);
                await page.click(ele.street)
                await page.type(ele.street, street, {delay});

                await page.waitForSelector(ele.city);
                await page.click(ele.city)
                await page.type(ele.city, city, {delay});

                await page.waitForSelector(ele.zipCode);
                await page.click(ele.zipCode)
                await page.type(ele.zipCode, zipCode, {delay});

                await page.waitForSelector('#field-radio-gen-2 > label');
                await page.click('#field-radio-gen-2 > label');

                await page.waitForSelector('#field-checkbox-gen-1 > label');
                await page.click('#field-checkbox-gen-1 > label');

                await page.waitForSelector(ele.submit);
                await page.click(ele.submit);
                const element = await page.waitForSelector(ele.submitDone);
                const info = await page.evaluate(name => name.innerText, element);
                console.log(info);
                log.info(info);
                if(info === 'Registrierung erfolgreich!') {
                    log.info('---- Stadtundland applied success APPLY_DONE', { email, firstName, lastName, _page });
                } else {
                    log.error('---- Stadtundland applied error APPLY_ERROR', { email, firstName, lastName, _page });
                    throw new Error('---- Stadtundland applied error APPLY_ERROR');
                }
                await browser.close();
            }
        } catch(error) {
            log.error('---- Stadtundland applied error APPLY_ERROR', { error });
            await browser.close();
            setTimeout(() => {
                if (retry <= constant.MAX_RETRY) {
                    retry = ++retry;
                    log.info('----- Retry  Stadtundland apply', { _page, email });
                    this._apply(_id, _page, request, retry);
                } else {
                    recordFails([{ path: _page, title: _id || _page, company: constant.STADT_UND_LAND }]);
                }
            }, constant.RETRY_WAIT * 1000);
        }
    }
    /**
     * submit request
     */
    static async submit() {
        const houses = await this.search();
        const result = await searchHome(houses, constant.STADT_UND_LAND);
        await exec(constant.STADT_UND_LAND, result);
        await save(result, constant.STADT_UND_LAND);
    }
}

export default Stadtundland
