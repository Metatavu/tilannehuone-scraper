/*jshint esversion: 6 */

(function() {
  'use strict';

  const fs = require('fs');
  const Promise = require('bluebird');
  const cheerio = require('cheerio');
  const request = require('request');
  const util = require('util');
  const _ = require('lodash');
  const normalize = require('normalize-space');
  const entities = new require('html-entities').XmlEntities;

  class PageScraper {
    
    scapePage(id, time) {
      return new Promise((resolve, reject) => {
        const url = util.format('http://www.tilannehuone.fi/tehtava.php?hash=%s', id);
        
        this.getParsedHtml({ url: url })
          .then(($) => {
            const location = $('.tehtavataulu h1').text();
            const details = $('.tehtavataulu h2').text();
            const extentIndex = details.lastIndexOf(':');
            const type = extentIndex !== -1 ? _.trim(details.substring(0, extentIndex)) : details;
            const extent = extentIndex !== -1 ? _.trim(details.substring(extentIndex + 1)) : null;
            const infoElement = $('.infotxt');
            
            let sources = [];
            let description = null;
            let latitude;
            let longitude;
            
            if (infoElement.text() !== 'Hälytyksestä ei ole tarkempaa tietoa.') {
              sources = _.map(infoElement.find('a'), (link) => {
               return {
                  url: $(link).attr('href'),
                  name: $(link).text()
                };
              });
              
              infoElement.find('a').remove();
              infoElement.find('span').remove();
              infoElement.find('br').each((index,  br) => {
                $(br).replaceWith('\n');
              });
              
              description = infoElement.text();
              
              if (description.indexOf('Tilannehuone.fi') > -1) {
                sources.push({
                  name: 'Tilannehuone.fi'
                });
                
                description = description.replace('Tilannehuone.fi', '');
              }
              
              description = normalize(description);
            }
            
            const scripts = $('script').text();
            const latLngMatch = /(point = new GLatLng\()([0-9.]*)[, ]{1,}([0-9.]*)/.exec(scripts);
            
            if (latLngMatch && latLngMatch.length === 3) {
              latitude = parseFloat(latLngMatch[1]);
              longitude = parseFloat(latLngMatch[2]);
            }
            
            resolve({
              id: id,
              url: url,
              location: location,
              time: time.toISOString(),
              description: description,
              extent: extent,
              type: type,
              latitude: latitude,
              longitude: longitude,
              sources: sources
            });
          })
          .catch(reject);
      });
      
    }
    
    getParsedHtml(options) {
      return new Promise((resolve, reject) => {
        this.doRequest(options)
          .then((body) => {
            resolve(cheerio.load(entities.decode(body)));   
          })
          .catch(reject);     
      });
    }
    
    doRequest(options) {
      return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
          if (error) {
            reject(error);
          } else {
            resolve(body);
          }
        }); 
      });
    }
  }
  
  module.exports = PageScraper;
           
}).call(this);