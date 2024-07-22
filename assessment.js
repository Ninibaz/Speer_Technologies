// Define a function to handle the scraping process
const scrapeWikiLinks = (startUrl, n) => {
    let visitedLinks = new Set(); // To store visited links
    let queue = [startUrl]; // Queue to manage links to be processed
    let result = new Set(); // Data structure to store unique wiki links
  
    // Recursive function to scrape links
    const recursiveScrape = (url, depth) => {
      if (depth > n) return; // Terminate recursion after n cycles
  
      cy.visit(url); // Visit the URL using Cypress
  
      // Extract links from the page
      cy.get('a[href^="/wiki/"]').each(($link) => {
        const link = $link.attr('href');
        if (link && !visitedLinks.has(link)) {
          visitedLinks.add(link);
          result.add(link);
          if (result.size < 10) {
            queue.push(`https://en.wikipedia.org${link}`);
          }
        }
      });
  
      // Continue scraping for newly found links
      const nextUrl = queue.shift();
      if (nextUrl) {
        recursiveScrape(nextUrl, depth + 1);
      }
    };
  
    // Validate and start scraping
    if (!startUrl.startsWith('https://en.wikipedia.org')) {
      throw new Error('Invalid Wikipedia link. Please provide a valid link.');
    }
  
    recursiveScrape(startUrl, 1); // Start scraping recursively from the initial link
  
    return result; // Return the set of unique wiki links after n cycles
  };
  
  // Example usage:
  const startUrl = 'https://en.wikipedia.org/wiki/Main_Page'; // Replace with your desired Wikipedia link
  const n = 3; // Replace with the number of cycles
  
  // Call the function and handle any errors
  try {
    const scrapedLinks = scrapeWikiLinks(startUrl, n);
    console.log('Scraped Links:', scrapedLinks);
  } catch (error) {
    console.error('Error:', error.message);
  }