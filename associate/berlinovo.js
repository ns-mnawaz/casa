import axios from 'axios';
import { load } from 'cheerio';
import FormData from 'form-data';
import log from '../common/log.js';
import requests from '../common/requests.js';
import constant from '../common/constant.js';
import { submit } from '../common/houses.js';

const berlinovo = {
    ui: 'https://www.berlinovo.de/en/housing/search?w%5B0%5D=warmmiete%3A%28min%3A660%2Cmax%3A860%2Call_min%3A660%2Call_max%3A855%29&w%5B1%5D=wohnungen_zimmer%3A%28min%3A2%2Cmax%3A5%2Call_min%3A1%2Call_max%3A4%29',
    basePath: 'https://www.berlinovo.de'
};

class Berlinovo {
    /**
     * search berlinovo
     *
     * @returns houses
     */
    static async search() {
        try {
            const response = await axios.get(berlinovo.ui);
            const $ = load(response.data);
            const houses = [];
            const data = $(".view-content .views-row");
            data.each(function() {
                const company = constant.BERLINOVO;
                const title = $(this).find(".node__content .title .content a").text();
                const path = berlinovo.basePath + $(this).find(".node__content .title .content a").attr('href');
                const address = $(this).find(".node__content .features .address").text();
                const rent = $(this).find(".node__content .features .block-field-blocknodeapartmentfield-total-rent .content .field__item").text() + ' warm';
                const rooms = $(this).find(".node__content .features .block-field-blocknodeapartmentfield-rooms .content .field__item").text();
                const wbs = $(this).find(".node__content .right .category .block-field-blocknodeapartmentfield-wbs .content .field--name-field-wbs").text();
                const id = $(this).find("article").attr('data-history-node-id');
                if (wbs === '0') {
                    houses.push({ title, address, rent, path, company, rooms, id });
                }
            });
            return houses;
        }
        catch(error) {
            log.error({message: '---- Berlinovo search error'});
            process.stdout.write('---- Berlinovo search error ----');
            return [];
        }
    }
    /**
     * apply berlinovo
     *
     * @param {string} id
     * @param {string} page
     */
    static async apply(id, page) {
        log.info('Apply Berlinovo Start', {id, page});
        let failure = false;
        for(const person of requests) {
            let data = new FormData();
            data.append('anrede', person.salutation_2);
            data.append('name', person.lastName);
            data.append('e_mail_adresse', person.email);
            data.append('telefonnummer', person.phoneNumber);
            data.append('anmerkungen', person.message);
            data.append('form_id', `webform_submission_kontaktanfrage_node_${id}_add_form`);
            data.append('op', 'Submit');

            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: page,
                headers: { 'origin': 'https://www.berlinovo.de', ...data.getHeaders() },
                data
            };
            try {
                const res = await axios.request(config);
                log.info('---- Berlinovo applied success', { page, email: person.email, response: res.statusText });
            } catch(error) {
                failure = true;
                log.error('---- Berlinovo applied error APPLY_ERROR', {error, page, email: person.email});
            }
        }
        log.info('Apply Berlinovo APPLY_DONE', { page, id, failure });
        return failure;
    }
    /**
     * submit request
     */
    static async submit() {
        const houses = await this.search();
        await submit(houses, constant.BERLINOVO);
    }
}

export default Berlinovo
