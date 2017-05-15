/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const util = require('util');
  const commandLineArgs = require('command-line-args');
  const getUsage = require('command-line-usage');
  
  /**
   * Command line options
   */
  class Options {
    
    constructor() {
      this.definitions = [
        { name: 'output-folder', alias: 'o', type: String },
        { name: 'help', alias: 'h', type: Boolean }
      ];
      
      try {
        this.options = commandLineArgs(this.definitions);
      } catch (e) {
        this.parseException = e;
      }
    }
    
    getError() {
      if (this.parseException) {
        return this.parseException.message;
      }
      
      if (this.options['help']) {
        return 'help';
      }
      
      const required = ['output-folder'];
      
      for (let i = 0; i < required.length; i++) {
        let requiredOption = required[i];
        if (!this.options[requiredOption]) {
          return util.format("Missing required option: %s", requiredOption);
        }
      }
      
      return null;
    }
    
    isOk() {
      return !this.getError();
    }
    
    getOptions() {
      return this.options;
    }
    
    getOption(name, defaultValue) {
      return this.options[name] || defaultValue;
    }
    
    printUsage() {
      const sections = [];
      const error = this.getError();
      
      sections.push({
        header: 'Scraper',
        content: 'Scraper to scrape Tilannehuone.fi -data'
      });

      sections.push({      
        header: 'Options',
        optionList: [{
          name: 'output-folder',
          typeLabel: '[underline]{output}',
          description: 'Output folder'
        }]
      });
      
      if (error && error !== 'help') {
        sections.push({
          header: error
        });
      };
      
      console.log(getUsage(sections));
    }
    
  }
  
  module.exports = new Options();
           
}).call(this);