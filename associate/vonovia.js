import qs from 'qs';
import util from 'util';
import axios from 'axios';
import log from '../common/log.js';
import constant from '../common/constant.js';
import requests from '../common/requests.js';
import { submit } from '../common/houses.js';
import { get } from '../common/message.js';

const vonovia = {
    ui: 'https://www.vonovia.de/de-de/immobiliensuche/?rentType=miete&immoType=wohnung&city=Berlin,%20Deutschland&perimeter=0&priceMaxRenting=%s&priceMinRenting=0&sizeMin=0&sizeMax=0&minRooms=%s&dachgeschoss=0&erdgeschoss=0&lift=0&balcony=0&sofortfrei=0&disabilityAccess=0&subsidizedHousingPermit=0',
    api: 'https://www.wohnraumkarte.de/Api/getImmoList?offset=0&limit=25&orderBy=distance&city=Berlin,+Deutschland&perimeter=0&rentType=miete&immoType=wohnung&priceMax=%s&sizeMin=0&sizeMax=0&minRooms=%s&dachgeschoss=0&erdgeschoss=0&sofortfrei=egal&lift=0&balcony=egal&disabilityAccess=egal&subsidizedHousingPermit=%s&geoLocation=1',
    basePath: 'https://www.vonovia.de/zuhause-finden/immobilien/'
};
class Vonovia {
    /**
     * search Vonovia
     * @returns houses
     */
    static async search() {
        try {
            const { price, rooms, showUI } = constant;
            const ui = util.format(vonovia.ui, price, rooms);
            if (showUI) {
                console.log('Vonovia -----> ', ui);
            }

            const config = { method: 'get', url: util.format(vonovia.api, price, rooms, 'egal') };
            const wbsConfig = { method: 'get', url: util.format(vonovia.api, price, rooms, 'erforderlich') };

            const [response, wbsResponse]  = await Promise.all([
                axios.request(config),
                axios.request(wbsConfig),
            ]);
            const wbsTitles = wbsResponse.data.results.map(item => item.titel);
            const data = response.data.results || [];
            let houses = [];
            data.forEach((house) => {
                if(wbsTitles.indexOf(house.titel) === -1) {
                    houses.push({
                        title: house.titel,
                        rent: String(house.preis)+ ' €', // kaltmiete
                        area: String(house.groesse),
                        address: house.strasse + ' ' + house.plz + ' ' + house.ort + ' ' + house.land,
                        path: vonovia.basePath + house.slug + '-' + house.wrk_id,
                        company: constant.VONOVIA,
                        rooms: house.anzahl_zimmer,
                        id: house.wrk_id,
                        date: new Date().toISOString(),
                        contact_link: house.contact_link
                    })
                }
            });
            return houses;
        } catch (error) {
            log.error({message: '---- Vonovia search error'});
            process.stdout.write('---- Vonovia search error ----');
            return [];
        }
    }
    /**
     * apply Vonovia
     * @param {string} id
     * @param string page
     */
    static async apply(id, page, house) {
        log.info('Apply Vonovia Start', {id, page});
        let failure = false;
        for(const person of requests) {
            const msg = await get(house.company, house.rooms, house.rent, house.address, person.lastName, person.job);
            const message = msg || person.message;
            const url = 'https://www.wohnraumkarte.de/Api/sendMailRequest';
            const data = qs.stringify({
                wrkID: id,
                name: person.firstName,
                prename: person.lastName,
                phone: person.phoneNumber,
                email: person.email,
                emailText: message,
                currentEmployment: 'angestellte',
                incomeType: '1',
                monthlyNetIncome: 'M_3',
                referrer: 'null' 
            });
            const config = {
                method: 'post',
                maxBodyLength: Infinity,
                url,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data
            };
            try {
                const response = await axios.request(config);
                log.info('---- Vonovia applied success', {response: response.data, email: person.email});
            } catch (error) {
                failure = true;
                log.error('---- Vonovia applied error APPLY_ERROR', {error, email: person.email});
            }
        }
        log.info('Apply Vonovia APPLY_DONE', {id, page, failure});
        return failure;
    }/**
     * submit request
     */
    static async submit() {
        const houses = await this.search();
        await submit(houses, constant.VONOVIA);
    }
}

export default Vonovia;
