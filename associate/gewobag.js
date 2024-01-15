import util from 'util';
import axios from 'axios';
import { load } from 'cheerio';
import log from '../common/log.js';
import constant from '../common/constant.js';
import requests from '../common/requests.js';
import { submit } from '../common/houses.js';
import { get } from '../common/message.js';

const gewobag = {
    ui: 'https://www.gewobag.de/fuer-mieter-und-mietinteressenten/mietangebote/?bezirke_all=1&bezirke%5B%5D=charlottenburg-wilmersdorf&bezirke%5B%5D=charlottenburg-wilmersdorf-charlottenburg&bezirke%5B%5D=friedrichshain-kreuzberg&bezirke%5B%5D=friedrichshain-kreuzberg-friedrichshain&bezirke%5B%5D=friedrichshain-kreuzberg-kreuzberg&bezirke%5B%5D=lichtenberg&bezirke%5B%5D=lichtenberg-alt-hohenschoenhausen&bezirke%5B%5D=lichtenberg-falkenberg&bezirke%5B%5D=lichtenberg-fennpfuhl&bezirke%5B%5D=lichtenberg-friedrichsfelde&bezirke%5B%5D=marzahn-hellersdorf&bezirke%5B%5D=marzahn-hellersdorf-marzahn&bezirke%5B%5D=mitte&bezirke%5B%5D=mitte-gesundbrunnen&bezirke%5B%5D=neukoelln&bezirke%5B%5D=neukoelln-buckow&bezirke%5B%5D=neukoelln-rudow&bezirke%5B%5D=pankow&bezirke%5B%5D=pankow-prenzlauer-berg&bezirke%5B%5D=pankow-weissensee&bezirke%5B%5D=reinickendorf&bezirke%5B%5D=reinickendorf-hermsdorf&bezirke%5B%5D=reinickendorf-tegel&bezirke%5B%5D=reinickendorf-waidmannslust&bezirke%5B%5D=spandau&bezirke%5B%5D=spandau-falkenhagener-feld&bezirke%5B%5D=spandau-hakenfelde&bezirke%5B%5D=spandau-haselhorst&bezirke%5B%5D=spandau-staaken&bezirke%5B%5D=spandau-wilhelmstadt&bezirke%5B%5D=steglitz-zehlendorf&bezirke%5B%5D=steglitz-zehlendorf-lichterfelde&bezirke%5B%5D=steglitz-zehlendorf-zehlendorf&bezirke%5B%5D=tempelhof-schoeneberg&bezirke%5B%5D=tempelhof-schoeneberg-lichtenrade&bezirke%5B%5D=tempelhof-schoeneberg-mariendorf&bezirke%5B%5D=tempelhof-schoeneberg-marienfelde&bezirke%5B%5D=tempelhof-schoeneberg-schoeneberg&bezirke%5B%5D=treptow-koepenick&bezirke%5B%5D=treptow-koepenick-alt-treptow&bezirke%5B%5D=treptow-koepenick-niederschoeneweide&bezirke%5B%5D=treptow-koepenick-oberschoeneweide&objekttyp%5B%5D=wohnung&gesamtmiete_von=&gesamtmiete_bis=%s&gesamtflaeche_von=&gesamtflaeche_bis=&zimmer_von=%s&zimmer_bis=%s&keinwbs=1&sort-by=recent'
};
class Gewobag {
    /**
     * search Gewobag
     *
     * @returns houses
     */
    static async search() {
        try {
            const { price, rooms, showUI, maxRooms } = constant;
            const ui = util.format(gewobag.ui, price, rooms, maxRooms);
            if (showUI) {
                console.log('Gewobag -----> ', ui);
            }
            const response = await axios.get(ui);
            const $ = load(response.data);
            const houses = [];
            const data = $(".angebot-big-layout");
            data.each(function() {
                const company = constant.GEWOBAG;
                const address = $(this).find("table address").text();
                const title = $(this).find("table .angebot-title").text();
                const path = $(this).find(".angebot-footer a").attr('href');
                const rooms = $(this).find(".angebot-area td").text().trim().split('|')[0];
                const rent = $(this).find(".angebot-kosten td").text().trim(); // warmmiete
                const date = new Date().toISOString();
                houses.push({ title, address, rent, path, company, rooms, date });
            });
            return houses;
        } catch (error) {
            log.error({message: '---- Gewobag search error'});
            process.stdout.write('---- Gewobag search error ----');
            return [];
        }
    }
    /**
     * apply gewobag
     * @param {string} page
     * @param {string} id
     * @param {house} house
     */
    static async apply(_id, page, house){
        log.info('---- Gewobag apply start', { _id, page });
        const requestUrl = 'https://app.wohnungshelden.de/api/applicationFormEndpoint/3.0/form/create-application/78f041a8-0c9d-45ba-b290-e1e366cf2e27/';
        const pages = page.split('/');
        const id = pages[pages.length - 2].replaceAll('-', '%2F');
        const url = requestUrl + id;
        let failure = false;
        for(const person of requests) {
            const msg = await get(house.company, house.rooms, house.rent, house.address, person.lastName, person.job);
            const message = msg || person.message;
            const data = {
                publicApplicationCreationTO: {
                    applicantMessage: message,
                    email: person.email,
                    firstName: person.firstName,
                    lastName: person.lastName,
                    phoneNumber: person.phoneNumber,
                    salutation: person.salutation,
                    street: person.street,
                    houseNumber: person.houseNumber,
                    zipCode: person.zipCode,
                    city: person.city,
                    additionalAddressInformation: person.additionalAddressInformation
                },
                saveFormDataTO: {
                    formData: {
                        gewobag_gesamtzahl_der_einziehenden_personen_erwachsene_und_kinder: '3',
                        gewobag_fuer_wen_wird_die_wohnungsanfrage_gestellt: "Für mich selbst oder meine Angehörigen",
                        gewobag_datenschutzhinweis_bestaetigt: true
                    },
                    files: []
                }
            };
            const config = {
                method: 'post',
                maxBodyLength: Infinity,
                url,
                headers: { 'content-type': 'application/json' },
                data
            };
            try {
                const response = await axios.request(config);
                log.info('---- Gewobag applied success', { response: response.data, page, email: person.email });
            } catch(error) {
                failure = true;
                log.error('---- Gewobag applied error APPLY_ERROR', {response: error?.response?.data, page, email: person.email});
            }
        }
        log.info('Apply Gewobag APPLY_DONE', { page, id, failure });
        return failure;
    }
    /**
     * submit request
     */
    static async submit() {
        const houses = await this.search();
        await submit(houses, constant.GEWOBAG);
    }
}
export default Gewobag;
