const fs = require('fs');
const path = require('path');
const { parse } = require('node-html-parser');

// Define a function to handle the scraping process
const scrapeWikiLinks = async (startUrl, n) => {
  let visitedLinks = new Set(); // To store visited links
  let queue = [startUrl]; // Queue to manage links to be processed
  let result = new Set(); // Data structure to store unique wiki links

  // Recursive function to scrape links
  const recursiveScrape = async (url, depth) => {
    if (depth > n) return; // Terminate recursion after n cycles

    visitedLinks.add(url); // Mark the current URL as visited

    // Use Cypress to visit the URL and retrieve page content
    const response = await cy.request({
      url: url,
      followRedirect: true,
    });

    const body = response.body;

    // Parse HTML content using node-html-parser
    const root = parse(body);

    // Extract links from the page
    root.querySelectorAll('a[href^="/wiki/"]').forEach((link) => {
      const href = link.getAttribute('href');
      if (href && !visitedLinks.has(href)) {
        visitedLinks.add(href);
        result.add(`https://en.wikipedia.org${href}`);
        if (result.size < 10) {
          queue.push(`https://en.wikipedia.org${href}`);
        }
      }
    });

    // Continue scraping for newly found links
    const nextUrl = queue.shift();
    if (nextUrl) {
      await recursiveScrape(nextUrl, depth + 1);
    }
  };

  // Validate and start scraping
  if (!startUrl.startsWith('https://en.wikipedia.org')) {
    throw new Error('Invalid Wikipedia link. Please provide a valid link.');
  }

  await recursiveScrape(startUrl, 1); // Start scraping recursively from the initial link

  // Convert Set to array for JSON/CSV output
  const linksArray = [...result];

  // Write results to JSON file
  const outputDir = './output';
  const outputFile = path.join(outputDir, 'wiki-links.json');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  fs.writeFileSync(outputFile, JSON.stringify(linksArray, null, 2));

  return {
    totalLinks: linksArray.length,
    uniqueLinks: result.size,
    linksArray: linksArray,
  };
};

// Example usage:
const startUrl = 'https://en.wikipedia.org/wiki/Main_Page'; // Replace with your desired Wikipedia link
const n = 3; // Replace with the number of cycles

// Call the function and handle any errors
try {
  scrapeWikiLinks(startUrl, n).then((result) => {
    console.log('Total Links:', result.totalLinks);
    console.log('Unique Links:', result.uniqueLinks);
    console.log('Links Array:', result.linksArray);
    console.log('Results saved to ./output/wiki-links.json');
  });
} catch (error) {
  console.error('Error:', error.message);
}
