import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import csv from 'csv-parser';

// Define the path to the CSV file
const csvFilePath = path.resolve('search.csv');

// Function to parse the CSV file
const parseCSV = async (filePath) => {
  const results = [];
  try {
    await pipeline(
      fs.createReadStream(filePath),
      csv({ separator: ',' }),
      async function* (source) {
        for await (const row of source) {
          results.push(row);
        }
      }
    );
    return results;
  } catch (error) {
    console.error(`Error reading the CSV file: ${error.message}`);
    throw error;
  }
};

// Call the function and log the results
(async () => {
  try {
    const data = await parseCSV(csvFilePath);
    console.log('Parsed CSV Data:', data);
  } catch (error) {
    console.error('Error:', error);
  }
})();