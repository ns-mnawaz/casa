import util from 'util';
import axios from 'axios';
import log from '../common/log.js';
import constant from '../common/constant.js';
import requests from '../common/requests.js';
import { submit } from '../common/houses.js';
import { get } from '../common/message.js';

const adlerGroup = {
    api: 'https://www.adler-group.com/index.php?tx_immoscoutgrabber_pi2%5B__referrer%5D%5B%40extension%5D=ImmoscoutGrabber&tx_immoscoutgrabber_pi2%5B__referrer%5D%5B%40controller%5D=ShowObjects&tx_immoscoutgrabber_pi2%5B__referrer%5D%5B%40action%5D=filterBig&tx_immoscoutgrabber_pi2%5B__referrer%5D%5Barguments%5D=YTowOnt9a8c432c5d610f7a127b9ad7b9927210c644a29e4&tx_immoscoutgrabber_pi2%5B__referrer%5D%5B%40request%5D=%7B%22%40extension%22%3A%22ImmoscoutGrabber%22%2C%22%40controller%22%3A%22ShowObjects%22%2C%22%40action%22%3A%22filterBig%22%7D4ebf6e4e8b6f5c9c62bef7783cc087171a7e8e77&tx_immoscoutgrabber_pi2%5B__trustedProperties%5D=%7B%22rent-costs-fallback%22%3A1%2C%22surface-fallback%22%3A1%2C%22rooms%22%3A1%2C%22search-for%22%3A1%2C%22page%22%3A1%2C%22geoscope%22%3A1%2C%22garage-type%22%3A1%2C%22action%22%3A1%2C%22sortby%22%3A1%7Db403267721ee804df832a2a65bb5a4486491af42&tx_immoscoutgrabber_pi2%5Brent-costs-fallback%5D=%s&tx_immoscoutgrabber_pi2%5Bsurface-fallback%5D=0&tx_immoscoutgrabber_pi2%5Brooms%5D=%s&tx_immoscoutgrabber_pi2%5Bsearch-for%5D=apartmentrent&district=1276003001&type=4276906&L=0&tx_immoscoutgrabber_pi2%5Bpage%5D=1&tx_immoscoutgrabber_pi2%5Bgeoscope%5D=1276003001&tx_immoscoutgrabber_pi2%5Bgarage-type%5D=garage%2Cstreetparking&tx_immoscoutgrabber_pi2%5Baction%5D=searchForObjects&tx_immoscoutgrabber_pi2%5Bsearch-for%5D=apartmentrent&tx_immoscoutgrabber_pi2%5Bsortby%5D=firstactivation&search-page=&search-url-apartmentrent=https%3A%2F%2Fwww.adler-group.com%2Fsuche%2Fwohnung&search-url-office=https%3A%2F%2Fwww.adler-group.com%2Fsuche%2Fgewerbe&search-url-garagerent=https%3A%2F%2Fwww.adler-group.com%2Fsuche%2Fgarage-und-stellplatz',
    ui: 'https://www.adler-group.com/suche/wohnung?geocodes=1276003001&livingspace=0&numberofrooms=%s&page=1&price=%s&sortby=firstactivation'
};

class AdlerGroup {
    /**
     * search Adler Group
     * @returns houses
     */
    static async search() {
        try {
            const { price, rooms, showUI } = constant;
            const ui = util.format(adlerGroup.ui, rooms, price);
            if (showUI) {
                console.log('AdlerGroup -----> ', ui);
            }
            let config = { method: 'get', url: util.format(adlerGroup.api, price, rooms) };
            const response = await axios.request(config);
            const data = response.data.geodata || [];
            const houses = data.map((house) => {
                return {
                    title: house.title,
                    rent: String(house.price) + ' €', // warmmiete
                    area: String(house.livingSpace),
                    address: house.address.street + ' ' + house.address.houseNumber + ' ' + house.address.postcode + ' ' + house.address.quarter + ' ' + house.address.city,
                    path: house.link,
                    company: constant.ADLER_GROUP,
                    rooms: house.rooms,
                    date: new Date().toISOString(),
                    id: house.isid
                }
            });
            const notWbs = houses.filter((item) => !(item.title.toLowerCase().includes('wbs') && item.title.toLowerCase().includes('mit')));
            return notWbs;
        }
        catch(error) {
            log.error({message: '---- AdlerGroup search error' });
            process.stdout.write('---- AdlerGroup search error ----');
            return [];
        }
    }
    /**
     * apply Adler Group
     * @param {string} id 
     * @param {string} page
     * @param {house} house
     */
    static async apply(id, page, house) {
        log.info('Apply Adler Group Start', { page, id });
        let failure = false;
        for(const person of requests) {
            try {
                
                const msg = await get(house.company, house.rooms, house.rent, house.address, person.lastName, person.job);
                const message = msg || person.message;
                const url = 'https://www.adler-group.com/index.php?tx_immoscoutgrabber_pi2[__referrer][@extension]=ImmoscoutGrabber&tx_immoscoutgrabber_pi2[__referrer][@controller]=ShowObjects&tx_immoscoutgrabber_pi2[__referrer][@action]=displaySingleExpose&tx_immoscoutgrabber_pi2[contact_salutation]='+person.salutation_1+'&tx_immoscoutgrabber_pi2[is_mandatory][]=contact_salutation&tx_immoscoutgrabber_pi2[contact_firstname]='+person.firstName+'&tx_immoscoutgrabber_pi2[is_mandatory][]=contact_firstname&tx_immoscoutgrabber_pi2[contact_lastname]='+person.lastName+'&tx_immoscoutgrabber_pi2[is_mandatory][]=contact_lastname&tx_immoscoutgrabber_pi2[contact_phone]='+person.phoneNumber+'&tx_immoscoutgrabber_pi2[contact_email]='+person.email+'&tx_immoscoutgrabber_pi2[is_mandatory][]=contact_email&tx_immoscoutgrabber_pi2[contact_message]='+message+'&tx_immoscoutgrabber_pi2[action]=submitForm&tx_immoscoutgrabber_pi2[exposeid]='+id+'&type=4276906';
                const config = {
                    method: 'get',
                    maxBodyLength: Infinity,
                    url,
                    headers: {}
                };
                const res = await axios.request(config);
                if(res?.data?.success) {
                    log.info('---- AdlerGroup applied success', { response: res.data, page, id, email: person.email });
                } else {
                    throw { error: res?.data?.errors, message: 'AdlerGroup applied fail' };
                }
            } catch(error) {
                failure = true;
                log.error('---- AdlerGroup applied error APPLY_ERROR', { page, id, error, email: person.email });
            }
        }
        log.info('Apply Adler Group APPLY_DONE', { page, id, failure });
        return failure;
    }
    /**
     * submit request
     */
    static async submit() {
        const houses = await this.search();
        await submit(houses, constant.ADLER_GROUP);
    }
}
export default AdlerGroup;
