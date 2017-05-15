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

  class PageScraper {
    
    scapePage(id, published) {
      return new Promise((resolve, reject) => {
        this.getParsedHtml({ url: util.format('http://www.tilannehuone.fi/tehtava.php?hash=%s', id) })
          .then(($) => {
            const location = $('.tehtavataulu h1').text();
            const details = $('.tehtavataulu h2').text();
            const detailsMatch = /([A-Za-z]*)(: ){0,1}(.*){0,1}/.exec(details);
            const type = detailsMatch.length ? detailsMatch[1] : null;
            const extent = detailsMatch.length === 4 ? detailsMatch[3] : null;
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
              location: location,
              published: published.toISOString(),
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
            resolve(cheerio.load(body));   
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