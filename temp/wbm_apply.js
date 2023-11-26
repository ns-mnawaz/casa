import puppeteer from 'puppeteer';

async function main(_page, request) {
    const {firstName, lastName, city, email, phoneNumber, houseNumber, zipCode, street, salutation_2} = request;
    const delay = 100;

    const browser = await puppeteer.launch({ headless: false });
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
    } else {
        console.log('---- WBM applied error', _page, email);
    }
    await browser.close();
}
main('https://www.wbm.de//wohnungen-berlin/angebote/details/3-zimmer-wohnung-in-friedrichshain/', {
    message: `Hallo,

Wir sind schon eine Weile auf der Suche nach einem Haus, hatten aber bisher kein Glück. Ich habe eine wirklich harte Zeit, mein Baby in einer kleinen Wohnung zu erhöhen.
    
Wir haben ein wirklich stabiles Einkommen von 4200 pro Monat.

Bitte berücksichtigen Sie meine Familie für den Mietvertrag. Wir werden Ihnen sehr dankbar sein.

Mit freundlichen Grüßen`,
    email: 'netskope.dev@gmail.com',
    firstName: 'temp',
    lastName: 'user',
    phoneNumber: '017646294111',
    salutation: 'MRS',
    salutation_1: 'ms',
    salutation_2: 'Frau',
    street: 'Gutschmidtstraße',
    houseNumber: '78',
    zipCode: '12359',
    city: 'Berlin',
    additionalAddressInformation: ''
});
