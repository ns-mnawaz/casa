import puppeteer from 'puppeteer';

async function main(_page, request) {
    const {firstName, lastName, email, phoneNumber} = request;
    const delay = 100;
    
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(_page, { waitUntil: 'networkidle2' });
    await page.waitForSelector('#cmpwrapper');

    await (
        await page.evaluateHandle(`document.querySelector("#cmpwrapper").shadowRoot.querySelector("#cmpbntyestxt")`)
    ).asElement().click();

    await page.waitForSelector('#gewerbe-form-wrapper > div > div > div > div > div:nth-child(1) > div.text-center > a');
    await page.click('#gewerbe-form-wrapper > div > div > div > div > div:nth-child(1) > div.text-center > a')

    await page.waitForSelector('#main > div:nth-child(7) > div > div > div.step-content.show > div.row.mb-4 > div > div > div:nth-child(4) > label > div > svg');
    await page.click('#main > div:nth-child(7) > div > div > div.step-content.show > div.row.mb-4 > div > div > div:nth-child(4) > label > div > svg')

    await page.waitForSelector('#main > div:nth-child(7) > div > div > div.step-content.show > div:nth-child(2) > div > div > div.col-sm-6.mb-2.mb-sm-0.order-0.order-sm-1 > button');
    await page.click('#main > div:nth-child(7) > div > div > div.step-content.show > div:nth-child(2) > div > div > div.col-sm-6.mb-2.mb-sm-0.order-0.order-sm-1 > button')

    await page.waitForSelector('#main > div:nth-child(7) > div > div > div.step-content.show > div.row.mb-4 > div > div:nth-child(3) > label > div > svg');
    await page.click('#main > div:nth-child(7) > div > div > div.step-content.show > div.row.mb-4 > div > div:nth-child(3) > label > div > svg')

    await page.waitForSelector('#main > div:nth-child(7) > div > div > div.step-content.show > div:nth-child(2) > div > div > div.col-sm-6.mb-2.mb-sm-0.order-0.order-sm-1 > button');
    await page.click('#main > div:nth-child(7) > div > div > div.step-content.show > div:nth-child(2) > div > div > div.col-sm-6.mb-2.mb-sm-0.order-0.order-sm-1 > button');

    await page.waitForSelector('#main > div:nth-child(7) > div > div > div.step-content.show > div:nth-child(2) > div > label > div > svg');
    await page.click('#main > div:nth-child(7) > div > div > div.step-content.show > div:nth-child(2) > div > label > div > svg');

    await page.waitForSelector('#main > div:nth-child(7) > div > div > div.step-content.show > div:nth-child(3) > div > div > div.col-sm-6.mb-2.mb-sm-0.order-0.order-sm-1 > button');
    await page.click('#main > div:nth-child(7) > div > div > div.step-content.show > div:nth-child(3) > div > div > div.col-sm-6.mb-2.mb-sm-0.order-0.order-sm-1 > button');

    await page.waitForSelector('#main > div:nth-child(7) > div > div > div.step-content.show > div:nth-child(1) > div > label > span');
    await page.click('#main > div:nth-child(7) > div > div > div.step-content.show > div:nth-child(1) > div > label > span');

    await page.waitForSelector('#main > div:nth-child(7) > div > div > div.step-content.show > div:nth-child(2) > div > div > div.col-sm-6.mb-2.mb-sm-0.order-0.order-sm-1 > button');
    await page.click('#main > div:nth-child(7) > div > div > div.step-content.show > div:nth-child(2) > div > div > div.col-sm-6.mb-2.mb-sm-0.order-0.order-sm-1 > button');

    const fname= '#show-visit-form > div:nth-child(2) > div.col-lg-6 > div:nth-child(3) > div.col-md-6.mb-3.mb-md-0 > div > input[type=text]';
    await page.waitForSelector(fname);
    await page.click(fname)
    await page.type(fname, firstName, {delay});
    
    const lname= '#show-visit-form > div:nth-child(2) > div.col-lg-6 > div:nth-child(3) > div:nth-child(2) > div > input[type=text]';
    await page.waitForSelector(lname);
    await page.click(lname)
    await page.type(lname, lastName, {delay});

    const emailEle= '#email';
    await page.waitForSelector(emailEle);
    await page.click(emailEle)
    await page.type(emailEle, email, {delay});

    const phoneEle= '#show-visit-form > div:nth-child(2) > div.col-lg-6 > div:nth-child(4) > div:nth-child(2) > div > input[type=tel]';
    await page.waitForSelector(phoneEle);
    await page.click(phoneEle)
    await page.type(phoneEle, phoneNumber, {delay});

    const submitEle = '#show-visit-form > div:nth-child(3) > div > div:nth-child(1) > div.col-sm-6.mb-2.mb-sm-0.order-0.order-sm-1 > button';
    await page.waitForSelector(submitEle);
    await page.click(submitEle);

    const infoEle = '#main > div:nth-child(7) > div > div > div.step-content.show > div > div > div.h3.color-primary';
    const element = await page.waitForSelector(infoEle);
    const info = await page.evaluate(name => name.innerText, element);
    console.log(info);
    if(info === 'Vielen Dank.') {
        console.log('---- Howoge applied success');
    } else {
        console.log('---- Howoge applied error', _page, email);
    }
    // await page.waitForTimeout(50000);
    await browser.close();
}
main('https://www.howoge.de/wohnungen-gewerbe/wohnungssuche/detail/1770-20548-121.html',  {
    message: `Hallo,

ich suche schon eine Weile nach einem Haus, hatte aber bisher kein Glück. Ich habe Schwierigkeiten, die Arbeit und die Zeit für mein Baby unter einen Hut zu bringen.

Ich bin Software-Ingenieur mit einem unbefristeten Arbeitsvertrag und einem Monatsgehalt von 4200 Euro.

Bitte berücksichtigen Sie meine Familie für den Mietvertrag. Wir werden Ihnen sehr dankbar sein.

Mit freundlichen Grüßen`,
    email: 'inbox.mirnawaz@gmail.com',
    firstName: 'Mir',
    lastName: 'Nawaz',
    phoneNumber: '015758237383',
    salutation: 'MR',
    salutation_1: 'mr',
    salutation_2: 'Herr',
    street: 'Gutschmidtstraße',
    houseNumber: '78',
    zipCode: '12359',
    city: 'Berlin',
    additionalAddressInformation: ''
});
