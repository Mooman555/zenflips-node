require('dotenv').config();
const axios = require('axios');
const express = require('express');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const app = express();
const PORT = process.env.PORT;
const API_BASE_URL = process.env.API_BASE_URL;

async function getCraigListing(user) {
  
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
      // executablePath: 'google-chrome-stable'
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
      // executablePath: 'google-chrome-stable'
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

// async function sendScrapeData (){
//   let getData;
//   let userData = await getUserData()
//     userData?.forEach(async user => {
//       getData =  await getCraigListing(user);
//       console.log(getData,"getData")
//       const postScrapeDataUrl = `${API_BASE_URL}/scrapped-data`;
//     axios.post(postScrapeDataUrl,{email:user?.email,body:JSON.stringify(getData)})
//         .then(response => {
//            console.log('Response:', response);
//         })
//         .catch(error => {
//            console.error('Error:', error);
//        });
//      })
// }

async function getAuthFacebook() {
  const url = 'https://www.facebook.com';
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
      ],
    });
    const page = await browser.newPage();
    await page.goto(url);

    const isLoggedIn = await page.evaluate(() => {
      const findFriendsLink = document.querySelector('a[aria-label="Friends"]');
      return findFriendsLink
    });
    await browser.close();
    return isLoggedIn;
  } catch (error) {
    console.log(error);
  }
}

async function loginFacebook(user,{email,pass}) {
  let scrapeFacebook;
  const url = 'https://www.facebook.com';
  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
      ],
    });
         const page = await browser.newPage();
         await page.goto(url);

        console.log(email,"email"); 
        console.log(pass,"pass");
        
       await page.evaluate(() => {
        document.getElementById('email').value = "mooman@karigar.pk";
        document.getElementById('pass').value = "karigar123";
        setTimeout(() => {
          const loginButton = document.querySelector('button[name="login"]');
          loginButton.click();
        }, 2500);
     });

      await page.waitForNavigation();
      const currentUrl = page.url();
      if(currentUrl === "https://www.facebook.com/?sk=welcome"){
        scrapeFacebook = await scrapeMarketPlaceData(browser,user)
    }
    await browser.close();
    return scrapeFacebook;
  } catch (error) {
    console.log(error);
  }
}



async function scrapeMarketPlaceData(browserInstance,user) {
  try {
         let interest = user?.interests[0]
        //  console.log(interest?.radius,"radius")
         let facebookDataArr = [];
         const marketPage = await browserInstance.newPage();
         await marketPage.goto(`https://www.facebook.com/marketplace/111922808834701/search?minPrice=${interest?.min_price}&maxPrice=${interest?.max_price}&sortBy=best_match&itemCondition=new%2Cused_like_new&query=${interest?.keywords}`);


         let radiusSelector = await marketPage.waitForSelector('#seo_filters > div.x1i10hfl.x1qjc9v5.xjbqb8w.xjqpnuy.xa49m3k.xqeqjp1.x2hbi6w.x13fuv20.xu3j5b3.x1q0q8m5.x26u7qi.x972fbf.xcfux6l.x1qhh985.xm0m39n.x9f619.x1ypdohk.xdl72j9.x2lah0s.xe8uvvx.x11i5rnm.xat24cr.x1mh8g0r.x2lwn1j.xeuugli.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1n2onr6.x16tdsg8.x1hl2dhg.xggy1nq.x1ja2u2z.x1t137rt.x1o1ewxj.x3x9cwd.x1e5q0jg.x13rtm0m.x1q0g3np.x87ps6o.x1lku1pv.x78zum5.x1a2a7pz.x1xmf6yo');
           if(radiusSelector){
            await marketPage.evaluate(async () => {
              document.querySelector('#seo_filters > div.x1i10hfl.x1qjc9v5.xjbqb8w.xjqpnuy.xa49m3k.xqeqjp1.x2hbi6w.x13fuv20.xu3j5b3.x1q0q8m5.x26u7qi.x972fbf.xcfux6l.x1qhh985.xm0m39n.x9f619.x1ypdohk.xdl72j9.x2lah0s.xe8uvvx.x11i5rnm.xat24cr.x1mh8g0r.x2lwn1j.xeuugli.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1n2onr6.x16tdsg8.x1hl2dhg.xggy1nq.x1ja2u2z.x1t137rt.x1o1ewxj.x3x9cwd.x1e5q0jg.x13rtm0m.x1q0g3np.x87ps6o.x1lku1pv.x78zum5.x1a2a7pz.x1xmf6yo').click()
              });
            }
           let raduisDropDown =  await marketPage.waitForSelector('[aria-haspopup="listbox"][aria-label="Radius"]')
            if(raduisDropDown){
              // let list = marketPage.waitForSelector('[aria-haspopup="listbox"][aria-label="Radius"]')
              await marketPage.evaluate(async () => {
                   document.querySelector('[aria-haspopup="listbox"][aria-label="Radius"]').click();
              })
            }
            let drop =  await marketPage.waitForSelector('div.x1i10hfl.xjbqb8w.x6umtig.x1b1mbwd.xaqea5y.xav7gou.xe8uvvx.x1hl2dhg.xggy1nq.x1o1ewxj.x3x9cwd.x1e5q0jg.x13rtm0m.x87ps6o.x1lku1pv.x1a2a7pz.x6s0dn4.xjyslct.x9f619.x1ypdohk.x78zum5.x1q0g3np.x2lah0s.xnqzcj9.x1gh759c.xdj266r.xat24cr.x1344otq.x1de53dj.xz9dl7a.xsag5q8.x1n2onr6.x16tdsg8.x1ja2u2z')
            await marketPage.waitForTimeout(2000)
              if(drop){
                await marketPage.evaluate(async (interest) => {
                  const arr = Array.from(document.querySelectorAll('div.x1i10hfl.xjbqb8w.x6umtig.x1b1mbwd.xaqea5y.xav7gou.xe8uvvx.x1hl2dhg.xggy1nq.x1o1ewxj.x3x9cwd.x1e5q0jg.x13rtm0m.x87ps6o.x1lku1pv.x1a2a7pz.x6s0dn4.xjyslct.x9f619.x1ypdohk.x78zum5.x1q0g3np.x2lah0s.xnqzcj9.x1gh759c.xdj266r.xat24cr.x1344otq.x1de53dj.xz9dl7a.xsag5q8.x1n2onr6.x16tdsg8.x1ja2u2z'));
                  const value = Number(interest.radius);
                  let selectedValue;

                  if (value === 1) {
                    selectedValue = 0;
                  } else if (value === 2) {
                    selectedValue = 1;
                  } else if (value === 5) {
                    selectedValue = 2;
                  } else if (value === 10) {
                    selectedValue = 3;
                  } else if (value === 20) {
                    selectedValue = 4;
                  } else if (value === 40) {
                    selectedValue = 5;
                  } else if (value === 60) {
                    selectedValue = 6;
                  } else if (value === 80) {
                    selectedValue = 7;
                  } else if (value === 100) {
                    selectedValue = 8;
                  } else if (value === 250) {
                    selectedValue = 9;
                  } else if (value === 500) {
                    selectedValue = 10;
                  } else {
                    // Handle invalid value
                    selectedValue = null;
                  }
                 arr[Number(selectedValue)].click();
               },interest)
              }     
                await marketPage.evaluate(async (interest) => {
                    await document.querySelector('[aria-label="Apply"]')?.click();
                })
          
        await marketPage.waitForTimeout(4000)

          const marketResults = await marketPage.$$('div.x3ct3a4');
            for (const result of marketResults) {
              let price,title,link,imgSrc;
                  link = await result.$eval(':first-child',element => element.href);
                 const innerDiv = await result.$$('div.x78zum5.xdt5ytf.x1n2onr6');
               for (const innerResult of innerDiv) {
                 const mainCard = await innerResult.$('div.x1n2onr6 > div.x1n2onr6.xh8yej3 div:last-child');
                 const titleDescriptionDiv = await innerResult.$(':nth-child(2)');
                 const priceDiv = await titleDescriptionDiv.$('div:first-child');
                 const titleDiv = await titleDescriptionDiv.$('div:nth-child(2)');
                  title = await titleDiv.$eval('span:last-child',element => element?.textContent);
                 let checkPriceSpan =  await priceDiv.$('span:nth-last-child(2)');
                  price;
                 if(checkPriceSpan){
                    price = await priceDiv.$eval('span:nth-last-child(2)',element => element?.textContent);
                 }else{
                    price = await priceDiv.$eval('span:last-child',element => element?.textContent);
                 }
                if(mainCard){
                   imgSrc = await mainCard.$eval('img', element => element.src);
                }
            }
                 facebookDataArr.push({
                   title,
                   link,
                   price,
                   imgSrc
                 })
           }
           return facebookDataArr;

  } catch (error) {
    console.log(error);
  }
}

// async function sendFacebookScrapeData (){
//   let data,isLoggedIn;
//   let userData = await getUserData()
//     userData?.forEach( async user => {
//       isLoggedIn = await getAuthFacebook()
//       console.log(isLoggedIn,"User Status")
//       if(isLoggedIn === null){
//        data = await loginFacebook({email:"mooman@karigar.pk",pass:"admin123"})
//        console.log(data,"facebook data")
//       }
//     })
// }


app.get('/', async (req, res) => {
  let getFacebookData,isLoggedIn,getCraigListData;
  res.send('Scrapping is Running!!');
 
  let userData = await getUserData()
 
  userData?.forEach(async user => {

    // getCraigListData =  await getCraigListing(user);
    // console.log(getCraigListData,"CraigList")
    // getCraigListData =  await getCraigListing(user);

    isLoggedIn = await getAuthFacebook()
    if(isLoggedIn === null){
      getFacebookData = await loginFacebook(user,{email:"mooman@karigar.pk",pass:"admin123"})
     console.log(getFacebookData,"Facebook")
    }
    console.log("Hello There")

  const postScrapeDataUrl = `${API_BASE_URL}/scrapped-data`;
  axios.post(postScrapeDataUrl,{email:user?.email,body:JSON.stringify({facebook:getFacebookData})})
      .then(response => {
         console.log('Response:', response);
      })
      .catch(error => {
         console.error('Error:', error);
     });
   })
});

// app.get('/craiglist', async (req, res) => {
//   res.send('Craiglist Scrapping is Running!!');
//   sendScrapeData()
// });

// app.get('/facebook', async (req, res) => {
//   res.send('Facebook Scrapping is Running!!');
//   sendFacebookScrapeData()
// });


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

 // Extract the HTML content of the page
      //  const htmlContent = await page.content();

        // Load the HTML content into Cheerio
        // const $ = cheerio.load(htmlContent);
        // const emailField = $('#email');
        // const passField = $('#pass');