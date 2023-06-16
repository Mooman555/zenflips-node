require('dotenv').config();
const axios = require('axios');
const express = require('express');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const app = express();
const PORT = process.env.PORT;
const API_BASE_URL = process.env.API_BASE_URL;


async function getListing(user) {
  
  let interest = user?.interests[0]
  const url = `https://orlando.craigslist.org/search/sss?condition=10&max_price=${interest?.max_price}&min_price=${interest?.min_price}&query=${interest?.keywords}&search_distance=${interest?.radius}#search=1~gallery~0~0`;
  try {
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
      ],
      executablePath:
        process.env.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(), 
    });
    const page = await browser.newPage();
    await page.goto(url);
    const scrapeData = [];
    const searchResults = await page.$$('.cl-search-result');
    for (const result of searchResults) {
      const galleryCard = await result.$('div.gallery-card');
      if (galleryCard) {
        const title = await galleryCard.$eval('a.titlestring', element => element.textContent);
        const link = await galleryCard.$eval('a.titlestring', element => element.href);
        const price = await galleryCard.$eval('span.priceinfo', element => element.textContent);
        getImgSrcs =  await getImages(link);
            scrapeData.push({
              title,
              link,
              price,
              imgSrc:getImgSrcs || ''
            })
        }
      }
    await browser.close();
    return scrapeData;
  } catch (error) {
    console.log(error);
  }
}



async function getUserData() {
    const getURL = `${API_BASE_URL}/interest-data`;
    const usersArray = [];
    await axios.get(getURL)
      .then(response => {
        response.data.data.forEach(user => {   
          usersArray.push(user)
        })
      })
      .catch(error => {
        console.error('GET Error:', error);
      });
        return usersArray;
}

async function getImages(pageLink) {
  
  try {
    const browser = await puppeteer.launch({
       headless: 'new',
       args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
      ],
      executablePath:
        process.env.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
      });
    const page = await browser.newPage();
    await page.goto(pageLink);
    let scrapeImage ;
    const searchResults = await page.$$('.swipe-wrap');
    for (const result of searchResults) {
      const galleryCard = await result.$('div:nth-child(1)');
      if (galleryCard) {
        const imgSrc = await galleryCard.$eval('img', element => element.src);
        scrapeImage = imgSrc
      }
    }
    await browser.close();
    return scrapeImage;
  } catch (error) {
    console.log(error);
  }
}

async function sendScrapeData (){
  let getData;
  let userData = await getUserData()
    userData?.forEach(async user => {
      getData =  await getListing(user);
      console.log(getData,"getData")
      const postScrapeDataUrl = `${API_BASE_URL}/scrapped-data`;
    axios.post(postScrapeDataUrl,{email:user?.email,body:JSON.stringify(getData)})
        .then(response => {
           console.log('Response:', response);
        })
        .catch(error => {
           console.error('Error:', error);
       });
     })
}


app.get('/', async (req, res) => {
  res.send('Scrapping is Running!!');
});

sendScrapeData()

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
