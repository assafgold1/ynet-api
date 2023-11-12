import express from 'express';
import axios from 'axios';
import { parseString } from 'xml2js';
import fs from 'fs';
import chalk from 'chalk';

const apiPassword = 'tanin';
const app = express();
const port = 3000;
const refreshInterval = 30 * 1000; // 30 seconds
//newssites
const ynet = "https://www.ynet.co.il/Integration/StoryRss2.xml";
// Helper function to convert parseString to promise
const parseStringPromise = (xmlText) => {
  return new Promise((resolve, reject) => {
    parseString(xmlText, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

// Function to check password
const checkPassword = (req, res, next) => {
  const providedPassword = req.query.password;

  if (providedPassword === apiPassword) {
    next();
  } else {
    // Password is incorrect, send a 401 Unauthorized response
    res.status(401).json({ error: 'Unauthorized. Invalid password.' });
  }
};

// Function to parse pubDate
function parsePubDate(pubDate) {
  try {
    if (!pubDate) {
      // Handle empty pubDate
      console.error(chalk.redBright("[Erorr]"),chalk.red("Error parsing pubDate:"), "pubDate is empty");
      return null;
    }

    // Attempt to parse the pubDate using different formats
    const pubDateISO = new Date(pubDate).toISOString();
    return pubDateISO;
  } catch (error) {
    console.error(chalk.redBright("[LOG]"),chalk.red("Error parsing pubDate:"), error.message);
    return null;
  }
}

// Function to fetch data
async function fetchData() {
  app.get (ynet)

  try {
    const response = await axios.get(ynet);

    if (response.status !== 200) {
      throw new Error(`Failed to fetch RSS feed. Status code: ${response.status}`);
    }

    const xmlText = response.data;
    const xmlObject = await parseStringPromise(xmlText);

    const items = xmlObject.rss.channel[0].item.map((item) => {
      const title = item.title[0];
      const description = item.description[0];
      const link = item.link[0];
      const pubDate = parsePubDate(item.pubDate[0]);

      const shortDescription = item.shortDescription ? item.shortDescription[0] : null;
      const image139X80 = item.image139X80 ? item.image139X80[0] : null;
      const image624X383 = item.image624X383 ? item.image624X383[0] : null;
      const photographer = item.photographer ? item.photographer[0] : null;
      const guid = item.guid ? item.guid[0] : null;
      const UpdateDate = item.UpdateDate ? item.UpdateDate[0] : null;
      const itemID = item.itemID ? item.itemID[0] : null;
      const isVideo = item.isVideo ? item.isVideo[0] : null;
      const Author = item.Author ? item.Author[0] : null;
      const Sponsored = item.Sponsored ? item.Sponsored[0] : null;
      const Tags = item.Tags ? item.Tags[0] : null;
      const CategoryID = item.CategoryID ? item.CategoryID[0] : null;
      const Gallery1ID = item.Gallery1ID ? item.Gallery1ID[0] : null;
      const isPremium = item.isPremium ? item.isPremium[0] : null;
      //walla
      const docs = item.isPremium ? item.isPremium[0] : null;
      const copyright = item.isPremium ? item.isPremium[0] : null;
      const image = item.isPremium ? item.isPremium[0] : null;
      const language = item.isPremium ? item.isPremium[0] : null;
      const generator = item.isPremium ? item.isPremium[0] : null;
      //geek
      const enclosure = item.enclosure ? item.enclosure[0] : null;
      const channel = item.channel ? item.channel[0] : null;
      const data = item.data ? item.data[0] : null;
      //tjs
      const RelatedItemID3 = item.RelatedItemID3 ? item.RelatedItemID3[0] : null;
      const channelName = item.channelName ? item.channelName[0] : null;
      const SocialTitle = item.SocialTitle ? item.SocialTitle[0] : null;
      const SubCategoryID = item.SubCategoryID ? item.SubCategoryID[0] : null;
      const lastBuildDate = item.data ? item.channel[0] : null;
      const RelatedItemID1 = item.RelatedItemID1 ? item.RelatedItemID1[0] : null;
      const RelatedItemID2 = item.RelatedItemID2 ? item.RelatedItemID2[0] : null;

      return {
        title,
        description,
        link,
        pubDate,
        shortDescription,
        image139X80,
        image624X383,
        photographer,
        guid,
        UpdateDate,
        itemID,
        isVideo,
        Author,
        Sponsored,
        Tags,
        CategoryID,
        Gallery1ID,
        isPremium,
        //walla
        lastBuildDate,
        generator,
        language,
        image,
        copyright,
        docs,
        enclosure,
        channel,
        //tjs
        channelName,
        RelatedItemID1,
        RelatedItemID2,
        RelatedItemID3,
        CategoryID,
        SubCategoryID,
        SocialTitle,
        //main
        data,
      };
    });

    const data = { items };

    // Write data to a JSON file
    writeJsonToFile(data, 'rss_data.json');

    console.log(chalk.red("[LOG]"), chalk.green("Data refreshed successfully"));

    return data;
  } catch (error) {
    console.error(chalk.red("Error fetching or parsing RSS feed:"), error.message);
    return { error: "Failed to fetch or parse RSS feed." };
  }
}

// Function to write JSON data to a file
const writeJsonToFile = (data, filePath) => {
  const jsonData = JSON.stringify(data, null, 2);

  fs.writeFileSync(filePath, jsonData, 'utf8');

  console.log(chalk.red("[LOG]"), chalk.green(`Data written to ${filePath}`));
};

// Serve the JSON data
app.get('/ynet', async (req, res) => {
  console.log(chalk.red("[LOG]"), chalk.cyan("Received API request. Refreshing data..."));
  const data = await fetchData();
  res.json(data);
});

// Protected route with password
app.get('/ynet-pass', checkPassword, async (req, res) => {
  console.log(chalk.red("[LOG]"), chalk.cyan("Received API request with password. Refreshing data..."));
  const data = await fetchData();
  res.json(data);
});

// Root path
app.get('/', (req, res) => {
  res.send('Hello, this is the root path!');
});

//whare the rss
app.get(ynet) 
  console.log(chalk.red("[LOG]"), chalk.magenta(`Fetch from ${ynet}`));

// Start the server
app.listen(port, () => {
  console.log(chalk.red("[LOG]"), chalk.blue(`Server is running at http://localhost:${port}`));
});

// Set up periodic data refresh
setInterval(async () => {
  console.log(chalk.red("[LOG]"), chalk.cyan("Periodic data refresh..."));
  await fetchData();
}, refreshInterval);
