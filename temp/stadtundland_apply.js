import puppeteer from 'puppeteer';

async function main(_page, request) {
    const {firstName, lastName, email, phoneNumber, street, salutation_1, zipCode, city} = request;
    const delay = 100;

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    const ele = {
        cookie: 'body > div.SP-CookieUsageNotification > button > span',
        firstName: '#field-text-gen-1-input',
        lastName: '#field-text-gen-2-input',
        email: '#field-text-gen-7-input',
        phoneNumber: '#field-text-gen-6-input',
        submit: '#button-submit-gen-1 > span',
        salutation: '#field-select-gen-1-input',
        street: '#field-text-gen-3-input',
        city: '#field-text-gen-5-input',
        zipCode: '#field-text-gen-4-input',
        submitDone: '#registrierung-erfolgreich'
    }
    await page.goto(_page, { waitUntil: 'networkidle2' });
    await page.waitForSelector(ele.cookie);
    await page.click(ele.cookie);

    const wbsDiv = await page.$("#SP-Content > div > div.SP-Text.SP-Paragraph > div > div.SP-Table__scroller > table.SP-Table--expose.SP-Table--hasColumnData.SP-Table--orig > tbody > tr:nth-child(4) > td")
    const wbsText = await (await wbsDiv.getProperty('textContent')).jsonValue()
    const wbs = wbsText.toLocaleLowerCase() === 'ja';
    if (wbs) {
        await browser.close();
    }
    await page.waitForSelector(ele.salutation);
    await page.select(ele.salutation, salutation_1);

    await page.waitForSelector(ele.firstName);
    await page.click(ele.firstName)
    await page.type(ele.firstName, firstName, {delay});

    await page.waitForSelector(ele.lastName);
    await page.click(ele.lastName)
    await page.type(ele.lastName, lastName, {delay});

    await page.waitForSelector(ele.email);
    await page.click(ele.email)
    await page.type(ele.email, email, {delay});

    await page.waitForSelector(ele.phoneNumber);
    await page.click(ele.phoneNumber)
    await page.type(ele.phoneNumber, phoneNumber, {delay});

    await page.waitForSelector(ele.street);
    await page.click(ele.street)
    await page.type(ele.street, street, {delay});

    await page.waitForSelector(ele.city);
    await page.click(ele.city)
    await page.type(ele.city, city, {delay});

    await page.waitForSelector(ele.zipCode);
    await page.click(ele.zipCode)
    await page.type(ele.zipCode, zipCode, {delay});

    await page.waitForSelector('#field-radio-gen-2 > label');
    await page.click('#field-radio-gen-2 > label');

    await page.waitForSelector('#field-checkbox-gen-1 > label');
    await page.click('#field-checkbox-gen-1 > label');

    await page.waitForSelector(ele.submit);
    await page.click(ele.submit);
    const element = await page.waitForSelector(ele.submitDone);
    const info = await page.evaluate(name => name.innerText, element);
    console.log(info);
    if(info === 'Registrierung erfolgreich!') {
        console.log('---- Stadtundland applied success');
    } else {
        console.log('---- Stadtundland applied error', _page, email);
    }
    // await page.waitForTimeout(500000);
    await browser.close();
}
main('https://www.stadtundland.de/exposes/immo.MO_1050_8201_272.php#Kontakt', {
    message: `Hallo,

Wir sind schon eine Weile auf der Suche nach einem Haus, hatten aber bisher kein Glück. Ich habe eine wirklich harte Zeit, mein Baby in einer kleinen Wohnung zu erhöhen.
    
Wir haben ein wirklich stabiles Einkommen von 4200 pro Monat.

Bitte berücksichtigen Sie meine Familie für den Mietvertrag. Wir werden Ihnen sehr dankbar sein.

Mit freundlichen Grüßen`,
    email: 'netskope.dev@gmail.com',
    firstName: 'Hina',
    lastName: 'Khan',
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
