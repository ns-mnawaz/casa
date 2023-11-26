

import axios from 'axios';
import { load } from 'cheerio';
import log from '../common/log.js';
import constant from '../common/constant.js';

const inBerlinWohnen = {
    ui: 'https://inberlinwohnen.de/wohnungsfinder/',
    basePath: 'https://inberlinwohnen.de'
}

class InBerlinWohnen {
    /**
     * search InBerlinWohnen
     *
     * @returns houses
     */
    static async search() {
        try{
            const { price, rooms } = constant;
            const response = await axios.get(inBerlinWohnen.ui);
            const $ = load(response.data);
            const data = $("#_tb_relevant_results .tb-merkflat");
            const houses = [];
            data.each(function() {
                const company = 'InBerlinWohnen';
                const title = $(this).find("._tb_left").text();
                const address = $(this).find(".tb-merkdetails > div > div:nth-child(2) > table > tbody > tr:nth-child(1) > td > a").text();
                const _rooms = $(this).find("._tb_left > strong:nth-child(1)").text();
                const rent = $(this).find("._tb_left > strong:nth-child(3)").text();
                const area = $(this).find("._tb_left > strong:nth-child(2)").text();
                const path = inBerlinWohnen.basePath + $(this).find(".tb-merkdetails > div > div.list_col.span_wflist_image > a").attr('href');
                const wbs = $(this).find(".tb-merkdetails > div > div:nth-child(2) > table > tbody > tr:nth-child(4) > td").text() === 'erforderlich';
                const rentInt = Number(rent.replace(',', '.'));
                if (!wbs && Number(rentInt) <= Number(price) && Number(rooms) <= Number(_rooms)) {
                    houses.push({ title, address, rent: rent + ' cold', area, path, company, rooms: _rooms });
                }
            });
            return houses;
        } catch (error) {
            log.error({message: '---- InBerlinWohnen search error'});
            process.stdout.write('---- InBerlinWohnen search error ----');
            return [];
        }
    }
    /**
     * apply InBerlinWohnen
     *
     * @param {string} path page path 
     */
    static async apply(id, path) {}
}

export default InBerlinWohnen
