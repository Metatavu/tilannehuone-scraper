/*jshint esversion: 6 */
/* global __dirname, process */

(function() {
  'use strict';
  
  const fs = require('fs');
  const util = require('util');
  const Promise = require('bluebird');
  const moment = require('moment');
  const cheerio = require('cheerio');
  const feeder = require('feederjs');
  const asyncPromises = require('async-promises');
  const options = require(__dirname + '/options');
  const PageScraper = require(__dirname + '/page-scraper');
  
  function createPageScrape(entry) {
    return new Promise((resolve, reject) => {
      
    });
  }
  
  if (!options.isOk()) {
    options.printUsage();
    process.exitCode = 1;
    return;
  }
  
  feeder.getFeed('http://www.tilannehuone.fi/rss.xml', (feed) => {
    const updated = moment(feed.updated, 'ddd, DD MMM YYYY HH:mm:ss ZZ', true);
    const outputFolder = options.getOption('output-folder');
    const outputFile = util.format('%s/%s.json', outputFolder, updated.toISOString());
    
    if (fs.existsSync(outputFile)) {
      return;
    }
    
    const entries = feed.entrys;
    const scrapes = entries.map((entry) => {
      const id = entry.id;
      const published = moment(entry.updated, 'ddd, DD MMM YYYY HH:mm:ss ZZ', true);
      return new PageScraper().scapePage(id, published);
    });
    
    asyncPromises.parallel(scrapes)
      .then((results) => {
        fs.writeFileSync(outputFile, JSON.stringify(results));
      })
      .catch((err) => {
        console.error(err);
      });
  });
  
}).call(this);