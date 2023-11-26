import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'node:fs';
const EXT = '.json';
const BASE = './history/';
/**
 * read houses from json file
 *
 * @param {string} file_name file name
 * @returns 
 */
async function readJson(file_name) {
    try {
        const json = await fs.readFile(fullName(file_name), { encoding: 'utf8' });
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
async function writeJson(houses, file_name) {
    const json = JSON.stringify(houses, null, 2);
    await fs.writeFile(fullName(file_name), json);
}
/**
 * 
 * @returns boolean
 */
async function exists(file_name) {
    const exist = existsSync(fullName(file_name));
    if (exist) {
        return true;
    } else {
        const dirname = path.dirname(fullName(file_name));
        if(!existsSync(dirname))
            await fs.mkdir(dirname);
    }
    const json = JSON.stringify([], null, 2);
    await fs.writeFile(fullName(file_name), json);
    return true;
}

/**
 *
 * @param {string} file_name 
 * @returns string
 */
function fullName(file_name) {
    return BASE + file_name + EXT;
}

export default { readJson, writeJson, exists, fullName };
