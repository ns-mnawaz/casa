import util from 'util';
import axios from 'axios';
import log from '../common/log.js';
import constant from '../common/constant.js';
import requests from '../common/requests.js';
import { submit } from '../common/houses.js';

const degewo = {
    ui: 'https://immosuche.degewo.de/de/search?size=10&page=1&property_type_id=1&categories%5B%5D=1&lat=&lon=&area=&address%5Bstreet%5D=&address%5Bcity%5D=&address%5Bzipcode%5D=&address%5Bdistrict%5D=&address%5Braw%5D=&district=&property_number=&price_switch=true&price_radio=%s-warm&price_from=&price_to=&qm_radio=null&qm_from=&qm_to=&rooms_radio=%s&rooms_from=&rooms_to=&wbs_required=0&order=rent_total_without_vat_asc',
    api: 'https://immosuche.degewo.de/de/search.json?utf8=%E2%9C%93&property_type_id=1&categories%5B%5D=1&property_number=&address%5Braw%5D=&address%5Bstreet%5D=&address%5Bcity%5D=&address%5Bzipcode%5D=&address%5Bdistrict%5D=&district=&price_switch=false&price_switch=on&price_from=&price_to=&price_from=&price_to=&price_radio=custom&price_from=&price_to=%s&qm_radio=null&qm_from=&qm_to=&rooms_radio=custom&rooms_from=%s&rooms_to=%s&features%5B%5D=&wbs_required=0&order=rent_total_without_vat_asc&',
    basePath: 'https://immosuche.degewo.de'
};
class Degewo {
    /**
     * search degewo
     *
     * @returns houses
     */
    static async search() {
        try {
            const { price, rooms, showUI, maxRooms } = constant;
            const ui = util.format(degewo.ui, price, rooms);
            if (showUI) {
                console.log('Degewo -----> ', ui);
            }
            let config = { method: 'get', url: util.format(degewo.api, price, rooms, maxRooms) };
            const response = await axios.request(config);
            const data = response.data.immos || [];
            const houses = data.map((house) => {
                return {
                    title: house.headline,
                    rent: house.price + ' warm',
                    area: String(house.living_space),
                    address: house.street + ' ' + house.street_number + ' ' + house.zipcode + ' ' + house.city,
                    path: degewo.basePath + house.property_path,
                    company: constant.DEGEWO,
                    rooms: house.number_of_rooms,
                    id: house.original_external_id
                }
            });
            return houses;
        } catch (error) {
            log.error({message: '---- Degewo search error' });
            process.stdout.write('---- Degewo search error ----');
            return [];
        }
    }
    /**
     * apply Degewo
     * @param {string} id 
     * @param {string} page 
     */
    static async apply(id, page) {
        log.info('Apply Degewo Start', { id, page });
        const requestUrl = 'https://app.wohnungshelden.de/api/applicationFormEndpoint/3.0/form/create-application/6e18d067-8058-4485-99a4-5b659bd8ad01/';
        const url = requestUrl + id;
        let failure = false;
        for(const person of requests) {
            const data = {
                publicApplicationCreationTO: {
                    applicantMessage: person.message,
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
                    formData: { numberPersonsTotal: '3' },
                    files: []
                }
            };
            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url,
                headers: { 'content-type': 'application/json' },
                data
            };
            try {
                log.info('Degewo submit request', { id, page, email: person.email });
                const response = await axios.request(config);
                log.info('---- Degewo applied success', { response: response.data, email: person.email });
            } catch(error) {
                failure = true;
                log.error('---- Degewo applied error APPLY_ERROR', { response: error?.response?.data, email: person.email, stack: error?.stack});
            }
        }
        log.info('Apply Degewo APPLY_DONE', { page, id, failure });
        return failure;
    }
    /**
     * submit request
     */
    static async submit() {
        const houses = await this.search();
        await submit(houses, constant.DEGEWO);
    }
}

export default Degewo;
