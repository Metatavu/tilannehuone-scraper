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
  const winston = require('winston');
  const _ = require('lodash');
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

  winston.level = 'debug';

  feeder.getFeed('http://www.tilannehuone.fi/rss.xml', (feed) => {
    const updated = moment(feed.updated, 'ddd, DD MMM YYYY HH:mm:ss ZZ', true);
    const outputFolder = options.getOption('output-folder');
    const outputFile = util.format('%s/tilannehuone.json', outputFolder);
    let existingData = {};
    
    if (fs.existsSync(outputFile)) {
      const data = fs.readFileSync(outputFile);
      if (data) {
        existingData = JSON.parse(data);
      }
    }
    
    const existingIds = _.map(existingData, 'id');
    const entries = feed.entrys;
    const scrapes = entries.map((entry) => {
      const id = entry.id;
      const existingIndex = _.indexOf(existingIds, id);
      const entryUpdated = moment(entry.updated, 'ddd, DD MMM YYYY HH:mm:ss ZZ', true);
      const existingEntry = existingIndex !== -1 ? existingData[existingIndex] : null;
      
      if (!existingEntry || moment(existingEntry.time).isBefore(entryUpdated)) {
        return new PageScraper().scapePage(id, updated);
      } else {
        return new Promise((resolve) => {
          resolve(existingEntry);
        });
      }
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