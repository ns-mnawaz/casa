import axios from 'axios';
import { load } from 'cheerio';
import puppeteer from 'puppeteer';
import log from '../common/log.js';
import constant from '../common/constant.js';
import requests from '../common/requests.js';
import { recordFails } from '../common/houses.js';

const wbm = {
    ui: 'https://www.wbm.de/wohnungen-berlin/angebote/#openimmo-search-result', 
    basePath: 'https://www.wbm.de/'
};
class WBM {
    /**
     * search WBM
     * @returns houses
     */
    static async search() {
        const houses = [];
        try {
            const { price, rooms, showUI } = constant;
            const ui = wbm.ui;
            if (showUI) {
                console.log('WBM -----> ', ui);
            }
            const response = await axios.get(ui);
            const $ = load(response.data);
            const data = $(".immo-element");
            data.each(function() {
                const company = 'WBM';
                const address = $(this).find(".address").text();
                const title = $(this).find(".address").text() + $(this).find(".area").text();
                const area = $(this).find(".main-property-size").text();
                const path = wbm.basePath + $(this).find(".btn-holder a").attr('href');
                const _rooms = $(this).find(".main-property-rooms").text();
                const rent = $(this).find(".main-property-rent").text().trim(); //warmmiete
                const wbs = $(this).find(".check-property-list").text().trim().toLowerCase().includes('wbs');
                if(!wbs && title && +_rooms >= rooms) {
                    houses.push({ title, address, rent, path, company, rooms: _rooms, area });
                }
            });
            return houses;
        } catch (error) {
            log.error({message: '---- WBM search error'});
            process.stdout.write('---- WBM search error ----');
            return houses;
        }
    }
    /**
     * apply WBM
     * @param {string} id
     * @param {string} path
     */
    static async apply(id, path) {
        log.info('Apply WBM Start');
        requests.forEach((person) => {
            try {
                this._apply(id, path, person)
            } catch(error) {
                log.info('---- WBM applied error ', error);
            }
        });
    }
    /**
     * apply for person
     * @param {string} _page 
     * @param {object} request 
     */
    static async _apply(_id, _page, request) {
        const {firstName, lastName, city, email, phoneNumber, houseNumber, zipCode, street, salutation_2} = request;
        const delay = 100;

        const browser = await puppeteer.launch({ headless: 'new' });
        try {
            const page = await browser.newPage();
            await page.goto(_page, { waitUntil: 'networkidle2' });

            await page.waitForSelector('#klaro > div > div > div > div > div > button.cm-btn.cm-btn-success');
            await page.click('#klaro > div > div > div > div > div > button.cm-btn.cm-btn-success');

            await page.waitForSelector('#c722 > div > div > form > div.powermail_fieldset.powermail_fieldset_2.row');

            await page.waitForSelector('#powermail_field_anrede');
            await page.select('#powermail_field_anrede', salutation_2);

            await page.waitForSelector('#powermail_field_name');
            await page.click('#powermail_field_name')
            await page.type('#powermail_field_name', firstName, {delay});

            await page.waitForSelector('#powermail_field_vorname');
            await page.click('#powermail_field_vorname')
            await page.type('#powermail_field_vorname', firstName, {delay});

            await page.waitForSelector('#powermail_field_vorname');
            await page.click('#powermail_field_vorname')
            await page.type('#powermail_field_vorname', lastName, {delay});

            await page.waitForSelector('#powermail_field_strasse');
            await page.click('#powermail_field_strasse')
            await page.type('#powermail_field_strasse', street + ' ' + houseNumber, {delay});

            await page.waitForSelector('#powermail_field_plz');
            await page.click('#powermail_field_plz')
            await page.type('#powermail_field_plz', zipCode, {delay});

            await page.waitForSelector('#powermail_field_ort');
            await page.click('#powermail_field_ort')
            await page.type('#powermail_field_ort', city, {delay});


            await page.waitForSelector('#powermail_field_e_mail');
            await page.click('#powermail_field_e_mail')
            await page.type('#powermail_field_e_mail', email, {delay});

            await page.waitForSelector('#powermail_field_telefon');
            await page.click('#powermail_field_telefon')
            await page.type('#powermail_field_telefon', phoneNumber, {delay});

            await page.waitForSelector('#c722 > div > div > form > div.powermail_fieldset.powermail_fieldset_2.row > div.powermail_fieldwrap.powermail_fieldwrap_type_check.powermail_fieldwrap_datenschutzhinweis.form-.form-group.col-md-6 > div > div > div.checkbox > label');
            await page.click('#c722 > div > div > form > div.powermail_fieldset.powermail_fieldset_2.row > div.powermail_fieldwrap.powermail_fieldwrap_type_check.powermail_fieldwrap_datenschutzhinweis.form-.form-group.col-md-6 > div > div > div.checkbox > label');

            await page.waitForSelector('#c722 > div > div > form > div.powermail_fieldset.powermail_fieldset_2.row > div.powermail_fieldwrap.powermail_fieldwrap_type_submit.powermail_fieldwrap_absenden.form-.form-group.col-md-6 > div > div > button');
            await page.click('#c722 > div > div > form > div.powermail_fieldset.powermail_fieldset_2.row > div.powermail_fieldwrap.powermail_fieldwrap_type_submit.powermail_fieldwrap_absenden.form-.form-group.col-md-6 > div > div > button');
            const element = await page.waitForSelector('#content > div > div.col-7.stretch > article > div > h1');
            const info = await page.evaluate(name => name.innerText, element);
            console.log(info);
            if(info === 'VIELEN DANK') {
                console.log('---- WBM applied success');
                log.info('---- WBM applied success');
            } else {
                log.error('---- WBM applied error APPLY_ERROR', {_page, email});
                throw new Error('---- WBM applied error APPLY_ERROR');
            }
            await browser.close();
        } catch(error) {
            log.error('---- WBM applied error APPLY_ERROR', {error});
            await browser.close();
            setTimeout(() => {
                if (retry <= constant.MAX_RETRY) {
                    retry = ++retry;
                    log.info('----- Retry WBM apply APPLY_DONE', { _page, email });
                    this._apply(_page, request, retry);
                } else {
                    recordFails([{ path: _page, title: _id || _page }]);
                }
            }, constant.RETRY_WAIT * 1000);
        }
    }
}

export default WBM;
