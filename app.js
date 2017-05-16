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
    let emergencies = [];
    
    if (fs.existsSync(outputFile)) {
      const data = fs.readFileSync(outputFile);
      if (data) {
        emergencies = JSON.parse(data);
      }
    }
    
    const existingIds = _.map(emergencies, 'id');
    const entries = feed.entrys;
    const scrapes = entries.map((entry) => {
      const id = entry.id;
      const existingIndex = _.indexOf(existingIds, id);
      const entryUpdated = moment(entry.updated, 'ddd, DD MMM YYYY HH:mm:ss ZZ', true);
      const existingEntry = existingIndex !== -1 ? emergencies[existingIndex] : null;
      
      if (!existingEntry || moment(existingEntry.time).isBefore(entryUpdated)) {
        return new PageScraper().scapePage(id, updated);
      } else {
        return new Promise((resolve) => {
          resolve(null);
        });
      }
    });
    
    asyncPromises.parallel(scrapes)
      .then((results) => {
        results.forEach((result) => {
          if (result) {
            emergencies.push(result);
          }
        });
        
        fs.writeFileSync(outputFile, JSON.stringify(emergencies));
      })
      .catch((err) => {
        console.error(err);
      });
  });
  
}).call(this);