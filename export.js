'use strict';

const fs = require('fs');
const https = require('https');
const program = require('commander');

var nbSlug;
var nbToken;
var outputFile;

program
  .version(require('./package.json').version)
  .arguments('<nationbuilderslug> <nationbuildertoken> <outputfile>')
  .action((nationbuilderurl, nbtoken, outputfile) => {
    nbSlug = nationbuilderurl;
    nbToken = nbtoken;
    outputFile = outputfile;
  }).parse(process.argv);

var results = [];

var handleRes = res => {
  var data = '';

  res.on('data', chunk => {
    data += chunk;
  });

  res.on('end', () => {
    var json = JSON.parse(data);

    if (json.next) {
      https.get(json.next, handleRes);
    }

    results = results.concat(json.results);

    if (!json.next) {
      fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    }
  });
};

https.get({
  host: nbSlug + '.nationbuilder.com',
  path: '/api/v1/sites/' + nbSlug + '/pages/basic_pages?limit=100&access_token=' + nbToken,
  headers: {
    Accept: 'application/json'
  }
}, handleRes).on('error', err => {
  console.log(err);
});
