import axios from 'axios';
import cron from'node-cron';
import { load } from 'cheerio';
import util from 'util';
import fs from 'fs/promises';
import notifier from 'node-notifier';
import qs from 'qs';
import FormData from 'form-data';

const showUI = false;
const roomsFrom = '1';

const deutsche = {
    ui: 'https://www.deutsche-wohnen.com/en/rent/renting-property/rent-an-apartment#page=1&locale=en&commercializationType=rent&utilizationType=flat,retirement&location=Berlin&city=Berlin&price=%s&rooms=%s',
    api: 'https://immo-api.deutsche-wohnen.com/estate/findByFilter',
    apiData: '{"infrastructure":{},"flatTypes":{},"other":{"requiresQualificationCertificate":false},"page":"1","locale":"en","commercializationType":"rent","utilizationType":"flat,retirement","location":"Berlin","city":"Berlin","price":"%s","rooms":"%s"}',
    basePath: 'https://www.deutsche-wohnen.com/en/expose/object/'
};
const degewo = {
    ui: 'https://immosuche.degewo.de/de/search?size=10&page=1&property_type_id=1&categories%5B%5D=1&lat=&lon=&area=&address%5Bstreet%5D=&address%5Bcity%5D=&address%5Bzipcode%5D=&address%5Bdistrict%5D=&address%5Braw%5D=&district=&property_number=&price_switch=true&price_radio=%s-warm&price_from=&price_to=&qm_radio=null&qm_from=&qm_to=&rooms_radio=%s&rooms_from=&rooms_to=&wbs_required=0&order=rent_total_without_vat_asc',
    api: 'https://immosuche.degewo.de/de/search.json?utf8=%E2%9C%93&property_type_id=1&categories%5B%5D=1&property_number=&address%5Braw%5D=&address%5Bstreet%5D=&address%5Bcity%5D=&address%5Bzipcode%5D=&address%5Bdistrict%5D=&district=&price_switch=false&price_switch=on&price_from=&price_to=&price_from=&price_to=&price_radio=%s-warm&price_from=&price_to=&qm_radio=null&qm_from=&qm_to=&rooms_radio=%s&rooms_from=&rooms_to=&features%5B%5D=&wbs_required=0&order=rent_total_without_vat_asc&',
    basePath: 'https://immosuche.degewo.de'
};
const gesobau = {
    ui: 'https://www.gesobau.de/mieten/wohnungssuche/?tx_solr[filter][]=zimmer:%27%s-1%27&tx_solr[filter][]=warmmiete:%270-%s%27',
    api: 'https://www.gesobau.de/mieten/wohnungssuche/?tx_solr%5Bfilter%5D%5B0%5D=zimmer%3A%27%s-1%27&tx_solr%5Bfilter%5D%5B1%5D=warmmiete%3A%270-%s%27&resultsPerPage=10000&resultsPage=0&resultAsJSON=1&befilter%5B0%5D=kanal_stringM%3A%22Mietwohnungen%22',
    basePath: 'https://www.gesobau.de'
}
const stadtundland = {
    ui: `https://www.stadtundland.de/immobiliensuche.php?form=stadtundland-expose-search-1.form&sp%3Acategories%5B3352%5D%5B%5D=-&sp%3Acategories%5B3352%5D%5B%5D=__last__&sp%3AroomsFrom%5B%5D=${roomsFrom}&sp%3AroomsTo%5B%5D=%s&sp%3ArentPriceFrom%5B%5D=&sp%3ArentPriceTo%5B%5D=%s&sp%3AareaFrom%5B%5D=&sp%3AareaTo%5B%5D=&sp%3Afeature%5B%5D=__last__&action=submit`,
    basePath: 'https://www.stadtundland.de'
}
const vonovia = {
    ui: 'https://www.vonovia.de/de-de/immobiliensuche/?rentType=miete&immoType=wohnung&city=Berlin,%20Deutschland&perimeter=0&priceMaxRenting=%s&priceMinRenting=0&sizeMin=0&sizeMax=0&minRooms=%s&dachgeschoss=0&erdgeschoss=0&lift=0&balcony=0&sofortfrei=0&disabilityAccess=0&subsidizedHousingPermit=0',
    api: 'https://www.wohnraumkarte.de/Api/getImmoList?offset=0&limit=25&orderBy=distance&city=Berlin,+Deutschland&perimeter=0&rentType=miete&immoType=wohnung&priceMax=%s&sizeMin=0&sizeMax=0&minRooms=%s&dachgeschoss=0&erdgeschoss=0&sofortfrei=egal&lift=0&balcony=egal&disabilityAccess=egal&subsidizedHousingPermit=egal&geoLocation=1',
    basePath: 'https://www.vonovia.de/de-de/immobiliensuche/'
}
const berlinovo = {
    ui: 'https://www.berlinovo.de/en/housing/search?w%5B0%5D=warmmiete%3A%28min%3A660%2Cmax%3A860%2Call_min%3A660%2Call_max%3A855%29&w%5B1%5D=wohnungen_zimmer%3A%28min%3A2%2Cmax%3A5%2Call_min%3A1%2Call_max%3A4%29',
    basePath: 'https://www.berlinovo.de'
}
const inBerlinWohnen = {
    ui: 'https://inberlinwohnen.de/wohnungsfinder/',
    basePath: 'https://inberlinwohnen.de'
}
const gewobag = {
    ui: 'https://www.gewobag.de/fuer-mieter-und-mietinteressenten/mietangebote/?bezirke_all=1&bezirke%5B%5D=charlottenburg-wilmersdorf&bezirke%5B%5D=charlottenburg-wilmersdorf-charlottenburg&bezirke%5B%5D=friedrichshain-kreuzberg&bezirke%5B%5D=friedrichshain-kreuzberg-friedrichshain&bezirke%5B%5D=friedrichshain-kreuzberg-kreuzberg&bezirke%5B%5D=lichtenberg&bezirke%5B%5D=lichtenberg-alt-hohenschoenhausen&bezirke%5B%5D=lichtenberg-falkenberg&bezirke%5B%5D=lichtenberg-fennpfuhl&bezirke%5B%5D=lichtenberg-friedrichsfelde&bezirke%5B%5D=marzahn-hellersdorf&bezirke%5B%5D=marzahn-hellersdorf-marzahn&bezirke%5B%5D=mitte&bezirke%5B%5D=mitte-gesundbrunnen&bezirke%5B%5D=neukoelln&bezirke%5B%5D=neukoelln-buckow&bezirke%5B%5D=neukoelln-rudow&bezirke%5B%5D=pankow&bezirke%5B%5D=pankow-prenzlauer-berg&bezirke%5B%5D=pankow-weissensee&bezirke%5B%5D=reinickendorf&bezirke%5B%5D=reinickendorf-hermsdorf&bezirke%5B%5D=reinickendorf-tegel&bezirke%5B%5D=reinickendorf-waidmannslust&bezirke%5B%5D=spandau&bezirke%5B%5D=spandau-falkenhagener-feld&bezirke%5B%5D=spandau-hakenfelde&bezirke%5B%5D=spandau-haselhorst&bezirke%5B%5D=spandau-staaken&bezirke%5B%5D=spandau-wilhelmstadt&bezirke%5B%5D=steglitz-zehlendorf&bezirke%5B%5D=steglitz-zehlendorf-lichterfelde&bezirke%5B%5D=steglitz-zehlendorf-zehlendorf&bezirke%5B%5D=tempelhof-schoeneberg&bezirke%5B%5D=tempelhof-schoeneberg-lichtenrade&bezirke%5B%5D=tempelhof-schoeneberg-mariendorf&bezirke%5B%5D=tempelhof-schoeneberg-marienfelde&bezirke%5B%5D=tempelhof-schoeneberg-schoeneberg&bezirke%5B%5D=treptow-koepenick&bezirke%5B%5D=treptow-koepenick-alt-treptow&bezirke%5B%5D=treptow-koepenick-niederschoeneweide&bezirke%5B%5D=treptow-koepenick-oberschoeneweide&objekttyp%5B%5D=wohnung&gesamtmiete_von=&gesamtmiete_bis=%s&gesamtflaeche_von=&gesamtflaeche_bis=&zimmer_von=2&zimmer_bis=%s&keinwbs=1&sort-by=recent'
}
const adlerGroup = {
    api: 'https://www.adler-group.com/index.php?tx_immoscoutgrabber_pi2%5B__referrer%5D%5B%40extension%5D=ImmoscoutGrabber&tx_immoscoutgrabber_pi2%5B__referrer%5D%5B%40controller%5D=ShowObjects&tx_immoscoutgrabber_pi2%5B__referrer%5D%5B%40action%5D=filterBig&tx_immoscoutgrabber_pi2%5B__referrer%5D%5Barguments%5D=YTowOnt9a8c432c5d610f7a127b9ad7b9927210c644a29e4&tx_immoscoutgrabber_pi2%5B__referrer%5D%5B%40request%5D=%7B%22%40extension%22%3A%22ImmoscoutGrabber%22%2C%22%40controller%22%3A%22ShowObjects%22%2C%22%40action%22%3A%22filterBig%22%7D4ebf6e4e8b6f5c9c62bef7783cc087171a7e8e77&tx_immoscoutgrabber_pi2%5B__trustedProperties%5D=%7B%22rent-costs-fallback%22%3A1%2C%22surface-fallback%22%3A1%2C%22rooms%22%3A1%2C%22search-for%22%3A1%2C%22page%22%3A1%2C%22geoscope%22%3A1%2C%22garage-type%22%3A1%2C%22action%22%3A1%2C%22sortby%22%3A1%7Db403267721ee804df832a2a65bb5a4486491af42&tx_immoscoutgrabber_pi2%5Brent-costs-fallback%5D=%s&tx_immoscoutgrabber_pi2%5Bsurface-fallback%5D=0&tx_immoscoutgrabber_pi2%5Brooms%5D=%s&tx_immoscoutgrabber_pi2%5Bsearch-for%5D=apartmentrent&district=1276003001&type=4276906&L=0&tx_immoscoutgrabber_pi2%5Bpage%5D=1&tx_immoscoutgrabber_pi2%5Bgeoscope%5D=1276003001&tx_immoscoutgrabber_pi2%5Bgarage-type%5D=garage%2Cstreetparking&tx_immoscoutgrabber_pi2%5Baction%5D=searchForObjects&tx_immoscoutgrabber_pi2%5Bsearch-for%5D=apartmentrent&tx_immoscoutgrabber_pi2%5Bsortby%5D=firstactivation&search-page=&search-url-apartmentrent=https%3A%2F%2Fwww.adler-group.com%2Fsuche%2Fwohnung&search-url-office=https%3A%2F%2Fwww.adler-group.com%2Fsuche%2Fgewerbe&search-url-garagerent=https%3A%2F%2Fwww.adler-group.com%2Fsuche%2Fgarage-und-stellplatz',
    ui: 'https://www.adler-group.com/suche/wohnung?geocodes=1276003001&livingspace=0&numberofrooms=%s&page=1&price=%s&sortby=firstactivation'
}
const howoge = {
    api: 'https://www.howoge.de/?type=999&tx_howsite_json_list[action]=immoList',
    ui: 'https://www.howoge.de/wohnungen-gewerbe/wohnungssuche.html?tx_howsite_json_list%5Bpage%5D=1&tx_howsite_json_list%5Blimit%5D=12&tx_howsite_json_list%5Blang%5D=&tx_howsite_json_list%5Brooms%5D=%s',
    basePath: 'https://www.howoge.de',
    ui: 'https://www.howoge.de/wohnungen-gewerbe/wohnungssuche.html?tx_howsite_json_list%5Bpage%5D=1&tx_howsite_json_list%5Blimit%5D=12&tx_howsite_json_list%5Blang%5D=&tx_howsite_json_list%5Brooms%5D=%s'
}

const WBM = {
    ui: 'https://www.wbm.de/wohnungen-berlin/angebote/#openimmo-search-result', 
    basePath: 'https://www.wbm.de/'
}
/**
 * house object format
 *
 * @param string title
 * @param string rent
 * @param string area
 * @param string address
 * @param string path
 * @param string rooms
 * @param string date
 */

/**
 * find uniq from array
 *
 * @param {Array<string>} keys object keys
 * @returns 
 */
Array.prototype.uniq = function(keys) {
    return this.filter(
        (valueSet => item =>
            (value =>  !valueSet.has(value) && valueSet.add(value))
            (keys.map(key => item[key]).join('|'))
        )
        (new Set)
    );
};
/**
 * find difference between 2 arrays on keys
 *
 * @param {Array<object>} a array of objects
 * @param {Array<string>} keys objects keys 
 * @returns 
 */
Array.prototype.diff = function(a, keys) {
    function compare(left, right) {
        let condition = 0;
        keys.forEach(key => {
            if(left[key] === right[key] && typeof left[key] !== 'undefined' && right[key] !== 'undefined') {
                condition++;
            }
        });
        return condition === keys.length && condition > 0;
    }
    return this.filter(leftValue =>
        !a.some(rightValue => compare(leftValue, rightValue, keys))
    );
}
/**
 * Format Date to YY.MM.DD
 *
 * @param {Date} date Date
 * @returns 
 */
function formatDate(date) {
    let d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();
    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;
    return [month, day, year].join('.');
}
/**
 * read houses from json file
 *
 * @param {string} file file name
 * @returns 
 */
async function readJson(file) {
    try {
        const file_name = file + '_search';
        const json = await fs.readFile('./history/'+file_name+'.json', { encoding: 'utf8' });
        return JSON.parse(json)
    }catch(err) {
        return [];
    }
}
/**
 * write houses to json file 
 *
 * @param {Array<house>} houses array of house
 * @param {string} file file name 
 */
async function writeJson(houses, file) {
    const file_name = file + '_search';
    const json = JSON.stringify(houses, null, 2);
    await fs.writeFile('./history/'+file_name + '.json', json);
}
/**
 * start main function
 *
 * @param {boolean} search 
 */
async function main () {
    try {
        const price = process.env.PRICE || '700';
        const rooms = process.env.ROOMS || '3';
        const deutscheHouses = await searchDeutsche(price, rooms);
        const degewoHouses = await searchDegewo(price, rooms);
        const degewoHousesPlus1 = await searchDegewo(price, String(+rooms+1));
        const degewoHousesPlus2 = await searchDegewo(price, String(+rooms+2));
        const gesobauHouses = await searchGesobau(price, rooms);
        const stadtundlandHouses = await searchStadtundland(price, rooms);
        const vonoviaHouses = await searchVonovia(price, rooms);
        const inBerlinWohnenHouses = await searchInBerlinWohnen(price, rooms);
        const berlinovoHouses = await searchBerlinovo(price, rooms);
        const gewobagHouses = await searchGewobag(price, rooms);
        const adlerGroupHouses = await searchAdlerGroup(price, rooms);
        const howogeHouses = await searchHowoge(rooms);
        const wbmHouses = await searchWBM(rooms);
        const houses = [].concat(deutscheHouses, degewoHouses, degewoHousesPlus1, degewoHousesPlus2,
            gesobauHouses, stadtundlandHouses, vonoviaHouses, inBerlinWohnenHouses,
            gewobagHouses, adlerGroupHouses, howogeHouses, berlinovoHouses, wbmHouses);
        await searchHome(houses);
        await save(houses);
    } catch(error) {
        console.log('Error Time  ----->', new Date());
        console.log('Error Stack ----->', JSON.stringify(error));
    }
}
/**
 * save houses
 *
 * @param {Array<house>} houses 
 */
async function save(houses) {
    const file = formatDate(new Date());
    const history = await readJson(file);
    const allHouses = [].concat(history, houses).uniq(['title', 'path']);
    await writeJson(allHouses, file);
}
/**
 * search home
 *
 * @param {Array<house>} houses 
 */
async function searchHome(houses) {
    const history = await readJson(formatDate(new Date()));
    const found = houses.diff(history, ['title', 'path']);
    if (found.length) {
        console.log('\n');
        found.forEach(home => {
            console.log(new Date() + ' ------> ', home.path);
            // apply(home.company, home.id, home.path);
            notifier.notify({
                title: util.format('%s - %s', home.company, home.rent),
                message: util.format('Address : %s, Rooms: %s', home.address, home.rooms),
                sound: 'Glass',
                timeout: 1000,
                open: home.path
            });
        });
    }
}

async function apply(company, id, path) {
    try{
        switch(company) {
            case 'Degewo': 
                applyDegewo(id, path);
                break;
            case 'Vonovia': 
                applyVonovia(id, path);
                break;
            case 'AdlerGroup': 
                applyAdler(id, path);
                break;
            case 'Berlinovo': 
                applyBerlinovo(id, path);
                break;
            case 'Gewobag':
                applyGewobag(path);
                break;
            default: 
                console.log('Apply not implmeneted for ', company);
        }
    } catch(error) {
        console.log('---- error in apply', error);
        console.log('--- url', url);
    }
}

async function searchAdlerGroup(price, rooms) {
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
            rent: String(house.price) + ' € warm',
            area: String(house.livingSpace),
            address: house.address.street + ' ' + house.address.houseNumber + ' ' + house.address.postcode + ' ' + house.address.quarter + ' ' + house.address.city,
            path: house.link,
            company: 'AdlerGroup',
            rooms: house.rooms,
            id: house.isid
        }
    });
    return houses;
}

async function searchDeutsche(price, rooms) {
    const ui = util.format(deutsche.ui, price, rooms);
    if (showUI) {
        console.log('Deutsche -----> ', ui);
    }
    const config = {
        method: 'post',
        url: deutsche.api,
        headers: {'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'},
        data: util.format(deutsche.apiData, price, rooms)
    };
    const response = await axios.request(config);
    const data = response.data || [];
    const houses = data.map((house) => {
        return {
            title: house.title,
            rent: String(house.price) + ' €',
            area: String(house.area),
            address: house.address.street + ' ' + house.address.houseNumber + ' ' + house.address.zip + ' ' + house.address.district + ' ' + house.address.city,
            path: deutsche.basePath + house.id,
            company: 'Deutsche',
            rooms: house.rooms,
            date: new Date(house.date),
            id: house.id
        }
    });
    return houses;
}
async function searchDegewo(price, rooms) {
    const ui = util.format(degewo.ui, price, rooms);
    if (showUI) {
        console.log('Degewo -----> ', ui);
    }
    let config = { method: 'get', url: util.format(degewo.api, price, rooms) };
    const response = await axios.request(config);
    const data = response.data.immos || [];
    const houses = data.map((house) => {
        return {
            title: house.headline,
            rent: house.price + ' warm',
            area: String(house.living_space),
            address: house.street + ' ' + house.street_number + ' ' + house.zipcode + ' ' + house.city,
            path: degewo.basePath + house.property_path,
            company: 'Degewo',
            rooms: house.number_of_rooms,
            id: house.original_external_id
        }
    });
    return houses;
}
async function searchGesobau(price, rooms) {
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
}
async function searchVonovia(price, rooms) {
    const ui = util.format(vonovia.ui, price, rooms);
    if (showUI) {
        console.log('Vonovia -----> ', ui);
    }
    const config = { method: 'get', url: util.format(vonovia.api, price, rooms) };
    const response = await axios.request(config);
    const data = response.data.results || [];
    const houses = data.map((house) => {
        return {
            title: house.titel,
            rent: String(house.preis)+ ' € kalt',
            area: String(house.groesse),
            address: house.strasse + ' ' + house.plz + ' ' + house.ort + ' ' + house.land,
            path: vonovia.basePath + house.slug + '-' + house.wrk_id,
            company: 'Vonovia',
            rooms: house.anzahl_zimmer,
            id: house.wrk_id
        }
    });
    return houses;
}

async function searchStadtundland(price, rooms) {
    const ui = util.format(stadtundland.ui, rooms, price);
    if (showUI) {
        console.log('Stadtundland -----> ', ui);
    }
    const response = await axios.get(ui);
    const $ = load(response.data);
    const data = $("li.SP-TeaserList__item");
    const houses = [];
    data.each(function() {
        const company = 'Stadtundland';
        const title = $(this).find(".SP-Teaser.SP-Teaser--expose article header").text();
        const address = $(this).find(".SP-Teaser.SP-Teaser--expose article tbody > tr:nth-child(2) > td").text();
        const rooms = $(this).find(".SP-Teaser.SP-Teaser--expose article tbody > tr:nth-child(3) > td").text();
        const rent = $(this).find(".SP-Teaser.SP-Teaser--expose article tbody > tr:nth-child(8) > td").text() + ' warm';
        const area = $(this).find(".SP-Teaser.SP-Teaser--expose article tbody > tr:nth-child(4) > td").text();
        const path = stadtundland.basePath + $(this).find(".SP-Teaser.SP-Teaser--expose article .SP-Teaser__links.SP-LinkList--inline > ul:nth-child(2) > li:nth-child(2) > a").attr('href');
        houses.push({ title, address, rent, area, path, company, rooms });
    });
    return houses;
}

async function searchInBerlinWohnen(price, _rooms) {
    const response = await axios.get(inBerlinWohnen.ui);
    const $ = load(response.data);
    const data = $("#_tb_relevant_results .tb-merkflat");
    const houses = [];
    data.each(function() {
        const company = 'InBerlinWohnen';
        const title = $(this).find("._tb_left").text();
        const address = $(this).find(".tb-merkdetails > div > div:nth-child(2) > table > tbody > tr:nth-child(1) > td > a").text();
        const rooms = $(this).find("._tb_left > strong:nth-child(1)").text();
        const rent = $(this).find("._tb_left > strong:nth-child(3)").text() + ' kalt';
        const area = $(this).find("._tb_left > strong:nth-child(2)").text();
        const path = inBerlinWohnen.basePath + $(this).find(".tb-merkdetails > div > div.list_col.span_wflist_image > a").attr('href');
        const wbs = $(this).find(".tb-merkdetails > div > div:nth-child(2) > table > tbody > tr:nth-child(4) > td").text() === 'erforderlich';
        const rentInt = Number(rent.replace(',', '.'));
        if (!wbs && Number(rentInt) <= Number(price) && Number(rooms) >= Number(_rooms)) {
            houses.push({ title, address, rent, area, path, company, rooms });
        }
    });
    return houses;
}

async function searchBerlinovo() {
    const response = await axios.get(berlinovo.ui);
    const $ = load(response.data);
    const houses = [];
    const data = $(".view-content .views-row");
    data.each(function() {
        const company = 'Berlinovo';
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

async function searchGewobag(price, rooms) {
    const ui = util.format(gewobag.ui, price, rooms);
    if (showUI) {
        console.log('Gewobag -----> ', ui);
    }
    const response = await axios.get(ui);
    const $ = load(response.data);
    const houses = [];
    const data = $(".angebot-big-layout");
    data.each(function() {
        const company = 'Gewobag';
        const address = $(this).find("table address").text();
        const title = $(this).find("table .angebot-title").text();
        const path = $(this).find(".angebot-footer a").attr('href');
        const rooms = $(this).find(".angebot-area td").text().trim().split('|')[0];
        const rent = $(this).find(".angebot-kosten td").text().trim() + ' warm';
        houses.push({ title, address, rent, path, company, rooms });
    });
    return houses;
}

async function searchHowoge(rooms) {
    const ui = util.format(howoge.ui, rooms);
    if (showUI) {
        console.log('Howoge -----> ', ui);
    }
    const body = util.format('tx_howsite_json_list%5Bpage%5D=1&tx_howsite_json_list%5Blimit%5D=12&tx_howsite_json_list%5Blang%5D=&tx_howsite_json_list%5Brooms%5D=%s&tx_howsite_json_list%5Bwbs%5D=wbs-not-necessary', rooms);
    const method = 'POST';
    const headers = { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' };
    const res = await (await fetch(howoge.api, { headers, body, method })).json();
    const data = res.immoobjects || [];
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
}

main();

console.log('Home Search Start', new Date());
cron.schedule('*/10 * * * * *', () => {
    main();
    process.stdout.write('.');
});

async function applyDegewo(id, page) {
    const requestUrl = 'https://app.wohnungshelden.de/api/applicationFormEndpoint/3.0/form/create-application/6e18d067-8058-4485-99a4-5b659bd8ad01/';
    const url = requestUrl + id;
    requests.forEach((person) => {
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
        axios.request(config)
        .then((response) => {
            console.log('---- Degewo applied success', response.data);
        })
        .catch((error) => {
            console.log('---- Degewo applied error', page, person.email);
        });
    });
}

async function applyAdler(id, page) {
    requests.forEach((person) => {
        const url = 'https://www.adler-group.com/index.php?tx_immoscoutgrabber_pi2[__referrer][@extension]=ImmoscoutGrabber&tx_immoscoutgrabber_pi2[__referrer][@controller]=ShowObjects&tx_immoscoutgrabber_pi2[__referrer][@action]=displaySingleExpose&tx_immoscoutgrabber_pi2[contact_salutation]='+person.salutation_1+'&tx_immoscoutgrabber_pi2[is_mandatory][]=contact_salutation&tx_immoscoutgrabber_pi2[contact_firstname]='+person.firstName+'&tx_immoscoutgrabber_pi2[is_mandatory][]=contact_firstname&tx_immoscoutgrabber_pi2[contact_lastname]='+person.lastName+'&tx_immoscoutgrabber_pi2[is_mandatory][]=contact_lastname&tx_immoscoutgrabber_pi2[contact_phone]='+person.phoneNumber+'&tx_immoscoutgrabber_pi2[contact_email]='+person.email+'&tx_immoscoutgrabber_pi2[is_mandatory][]=contact_email&tx_immoscoutgrabber_pi2[contact_message]='+person.message+'&tx_immoscoutgrabber_pi2[action]=submitForm&tx_immoscoutgrabber_pi2[exposeid]='+id+'&type=4276906';
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url,
            headers: {}
        };
        axios.request(config)
        .then((response) => {
            if(response.data.success) {
                console.log('---- AdlerGroup applied success');
            } else{
                console.log('---- AdlerGroup applied error', page, person.email);
            }
        })
        .catch((error) => {
            console.log('---- AdlerGroup applied error', page, person.email);
        });
    })
}

async function applyGewobag(page) {
    const requestUrl = 'https://app.wohnungshelden.de/api/applicationFormEndpoint/3.0/form/create-application/78f041a8-0c9d-45ba-b290-e1e366cf2e27/';
    const pages = page.split('/');
    const id = pages[pages.length - 2].replaceAll('-', '%2F');
    const url = requestUrl + id;
    requests.forEach((person) => {
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
                formData: {
                    gewobag_gesamtzahl_der_einziehenden_personen_erwachsene_und_kinder: '3',
                    gewobag_fuer_wen_wird_die_wohnungsanfrage_gestellt: "Für mich selbst oder meine Angehörigen",
                    gewobag_datenschutzhinweis_bestaetigt: true
                },
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
        axios.request(config)
        .then((response) => {
            console.log('---- Gewobag applied success', response.data);
        })
        .catch((error) => {
            console.log('---- Gewobag applied error', page, person.email);
        });
    });
}

async function applyVonovia(id, page) {
    requests.forEach((person) => {
        const url = 'https://www.wohnraumkarte.de/Api/sendMailRequest';
        const data = qs.stringify({
            wrkID: id,
            name: person.firstName,
            prename: person.lastName,
            phone: person.phoneNumber,
            email: person.email,
            emailText: person.message,
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

        axios.request(config)
        .then((response) => {
            console.log('---- Vonovia applied success', response.data);
        })
        .catch((error) => {
            console.log('---- Vonovia applied error', page);
        });
    });
}

async function applyBerlinovo(id, page) {
    requests.forEach((person) => {
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

        axios.request(config)
        .then((response) => {
            if(response.status === 200) {
                console.log('---- Berlinovo applied success');
            } else{
                console.log('---- Berlinovo applied error', page, person.email);
            }
        })
        .catch((error) => {
            console.log('---- Berlinovo applied error', page, person.email);
        });
    });
}

async function searchWBM(roomsFilter) {
    const ui = WBM.ui;
    if (showUI) {
        console.log('Gewobag -----> ', ui);
    }
    const response = await axios.get(ui);
    const $ = load(response.data);
    const houses = [];
    const data = $(".immo-element");
    data.each(function() {
        const company = 'WBM';
        const address = $(this).find(".address").text();
        const title = $(this).find(".address").text() + $(this).find(".area").text();
        const area = $(this).find(".main-property-size").text();
        const path = WBM.basePath + $(this).find(".btn-holder a").attr('href');
        const rooms = $(this).find(".main-property-rooms").text();
        const rent = $(this).find(".main-property-rent").text().trim() + ' warm';
        const wbs = $(this).find(".check-property-list").text().trim().toLowerCase().includes('wbs');
        if(!wbs && title && +rooms >= roomsFilter) {
            houses.push({ title, address, rent, path, company, rooms, area });
        }
    });
    return houses;
}
