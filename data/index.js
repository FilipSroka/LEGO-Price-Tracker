const puppeteer = require('puppeteer');
const fs = require('fs')

var links = [];
var items = [];

async function scrape() {
    const browser = await puppeteer.launch({"headless": true, "defaultViewport": null});
    const page = await browser.newPage();
    await page.goto('https://www.lego.com/en-gb/categories/all-sets', { waitUntil: 'domcontentloaded' });
    let tmp = await page.evaluate(() => {
        let limit = document.querySelectorAll('.Paginationstyles__PageLink-npbsev-7');
        limit = limit[limit.length-1].textContent;
        let results = Array.from(document.querySelectorAll('.dwJQhm'));
        let info = [];
        for (let i = 0; i < results.length; i++) {
            info.push(results[i].href);
        }
        return [limit, info]
    });
    //console.log(tmp)
    let limit = parseInt(tmp[0]);
    console.log('1' + "/" + limit.toString() + " " + (1*100/limit).toString() + '%');
    links = links.concat(tmp[1]);


    for (let i = 2; i <= limit; i++) {
        await page.goto('https://www.lego.com/en-gb/categories/all-sets?page='+i.toString(), { waitUntil: 'domcontentloaded' });
        let tmp = await page.evaluate(() => {
            let results = Array.from(document.querySelectorAll('.dwJQhm'));
            let info = [];
            for (let i = 0; i < results.length; i++) {
                if (results[i].href.split('-').pop().length == 5) {
                    info.push(results[i].href);
                }
            }
            return info;
        });
        //console.log(tmp)
        links = links.concat(tmp);
        console.log((i).toString() + "/" + limit.toString() + " " + (i*100/limit).toString() + '%');
    }

    for (let i = 0; i < links.length; i++) {
        try {
            await page.goto(links[i], { waitUntil: 'domcontentloaded' });
        }
        catch {
            console.log(links[i] + " - not loading");
            continue;
        }
        let tmp;
        try {
            tmp = await page.evaluate(() => {
                let name = document.querySelector('.ProductOverviewstyles__NameText-sc-1a1az6h-7').textContent;
                let theme;
                try {
                    theme = document.querySelector('#main-content > div > ol > li:nth-child(2) > a > span > span').textContent;
                }
                catch {
                    theme = 'unavailable';
                }

                let price = document.querySelector('[data-test=product-price]').textContent.slice(5);
                let tag;
                try {
                    tag = document.querySelector('[data-test=product-flag]').textContent;
                }
                catch {
                    tag = 'unavailable';
                }
                let rating, reviews;
                try {
                    rating = document.querySelector('#main-content > div > div.ProductDetailsPagestyles__ProductOverviewContainer-sc-1waehzg-1.dgDnXa > div > div.ProductOverviewstyles__Container-sc-1a1az6h-2.hHubKC > div.ProductOverviewstyles__ProductBadgesRow-sc-1a1az6h-0.fHCGdB > div.Reviewsstyles__Container-bzbdaf-1.ixayPt.ProductOverviewstyles__Reviews-sc-1a1az6h-8.iEOWrn > div > div').title;
                    reviews = document.querySelector('[data-test=product-overview-reviews]').textContent;
                }
                catch {
                    rating = 'unavailable';
                    reviews = '0';
                }

                let details = document.querySelectorAll('.ProductAttributesstyles__Value-sc-1sfk910-6');
                let age = details[0].textContent;
                let pieces = details[1].textContent;
                let id = details[3].textContent
                let minifigures, height, width, depth;
                try {
                    if (details.length >= 7 && details[4].textContent.length < 3) {
                        minifigures = details[4].textContent;
                        height = details[5].textContent.split(' ').pop().slice(1, -3);
                        width = details[6].textContent.split(' ').pop().slice(1, -3);
                        depth = details[7].textContent.split(' ').pop().slice(1, -3);
                    }
                    else if (details.length >= 6) {
                        minifigures = '0';
                        height = details[4].textContent.split(' ').pop().slice(1, -3);
                        width = details[5].textContent.split(' ').pop().slice(1, -3);
                        depth = details[6].textContent.split(' ').pop().slice(1, -3);
                    }
                    else {
                        document.querySelector('button[data-test=pdp-specifications-accordion-title]').click();
                        minifigures = 'unavailable';
                        let specification = document.querySelector('.ProductFeaturesstyles__FeaturesText-sc-8zwtdh-2.KbNSx').textContent;
                        let d = specification.match(/[0-9]+\s?cm/g);
                        if (d.length == 1) {
                            height = width = d[0].replace(/\s/g, '').slice(0, -2);
                            depth = 'unavailable'
                        }
                        else if (d.length == 2) {
                            height = d[0].replace(/\s/g, '').slice(0, -2);
                            width = d[1].replace(/\s/g, '').slice(0, -2);
                            depth = 'unavailable'
                        }
                        else {
                            height = d[0].replace(/\s/g, '').slice(0, -2);
                            width = d[1].replace(/\s/g, '').slice(0, -2)
                            depth = d[2].replace(/\s/g, '').slice(0, -2)
                        }
                    }
                }
                catch {
                    minifigures = height = width = depth = 'unavailable';
                }

                let image = document.querySelector('[srcset]').srcset.split(',')[0];

                return {'id': id, 'name': name, 'theme': theme, 'price': price, 'age': age, 'pieces': pieces, 'tag': tag, 'rating': rating, 'reviews': reviews, 'minifigures': minifigures, 'height': height, 'width': width, 'depth': depth, 'image': image}
            });
        }
        catch {
            console.log(links[i] + " - element not found")
        }
        //console.log(tmp);
        try {
            tmp['link'] = links[i];
            //console.log(tmp);
            console.log((i+1).toString() + "/" + links.length.toString() + " " + ((i+1)*100/links.length).toString() + '%');
            items.push(tmp);
        }
        catch {}
    }
    await browser.close();

    var file = fs.createWriteStream('data.txt')
    items.forEach(function(v) { file.write(v['id'] + ';' + v['name'] + ';' + v['theme'] + ';' + v['price'] + ";" + v['age'] + ';' + v['pieces'] + ';' + v['tag'] + ';' + v['rating'] + ';' + v['reviews'] + ';' + v['minifigures'] + ';' + v['height'] + ';' + v['width'] + ';' + v['depth'] + ';' + v['image'] + ";" + v['link'] + '\n'); });
    file.end();
}

async function main() {
    Promise.all([
        scrape(),
    ]).then(() => {
      console.log(items);
    });
}

main();
