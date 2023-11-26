
import util from 'util';
import axios from 'axios';
import log from '../common/log.js';
import constant from '../common/constant.js';

const gesobau = {
    ui: `https://www.gesobau.de/mieten/wohnungssuche/?tx_solr[filter][]=zimmer:'%s-5'&tx_solr[filter][]=warmmiete:'0-%s'`,
    api: `https://www.gesobau.de/mieten/wohnungssuche/?tx_solr[filter][0]=zimmer:'%s-5'&tx_solr[filter][1]=warmmiete:'0-%s'&resultsPerPage=10000&resultsPage=0&resultAsJSON=1&befilter[0]=kanal_stringM:"Mietwohnungen"`,
    basePath: 'https://www.gesobau.de'
}

class Gesobau {
    /**
     * search Gesobau
     * @returns houses
     */
    static async search() {
        try {
            const { price, rooms, showUI } = constant;
            const ui = util.format(gesobau.ui, rooms, price);
            if (showUI) {
                console.log('Gesobau -----> ', ui);
            }
            const config = { method: 'get', url: util.format(gesobau.api, rooms, price) };
            const response = await axios.request(config);
            const data = response.data || [];
            const houses = data.map((house) => {
                return {
                    title: house.raw.title,
                    rent: String(house.raw.warmmiete_floatS)+ ' € warm',
                    area: String(house.raw.wohnflaeche_floatS),
                    address: house.raw.adresse_stringS,
                    path: gesobau.basePath + house.raw.url,
                    company: 'Gesobau',
                    rooms: house.raw.zimmer_intS,
                    date: new Date(house.raw.created),
                }
            });
            return houses;
        } catch (error) {
            log.error({message: '---- Gesobau search error'});
            process.stdout.write('---- Gesobau search error ----');
            return [];
        }
    }
    /**
     * apply Gesobau
     * @param {string} id
     * @param string page
     */
    static async apply(id, page) {
        console.log('Apply Gesobau Start');
    }
}

export default Gesobau;
