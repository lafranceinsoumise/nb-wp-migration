'use strict';

const fs = require('fs');
const inquirer = require('inquirer');
const program = require('commander');
const request = require('request');

var nbSlug;
var nbToken;
var outputFile;
var type;

program
  .version(require('./package.json').version)
  .arguments('<nationbuilderslug> <nationbuildertoken> <outputfile>')
  .option('-T, --type <value>', '"pages" or "posts"')
  .action((nationbuilderurl, nbtoken, outputfile) => {
    nbSlug = nationbuilderurl;
    nbToken = nbtoken;
    outputFile = outputfile;
    type = program.type;
    if (['pages', 'posts'].indexOf(type) === -1) {
      throw new Error('Type must be pages or articles');
    }
  }).parse(process.argv);

var results = [];

var handlePages = (error, res, data) => {
  if (error || res.statusCode !== 200) {
    console.log(error);

    return;
  }
  var json = JSON.parse(data);

  if (json.next) {
    request(json.next, handlePages);
  }

  results = results.concat(json.results);

  if (!json.next) {
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  }
};

if (type === 'pages') {
  request({
    url: 'https://' + nbSlug + '.nationbuilder.com/api/v1/sites/' + nbSlug + '/pages/basic_pages?limit=100&access_token=' + nbToken,
    headers: {
      Accept: 'application/json'
    }
  }, handlePages);
} else if (type === 'posts') {
  var handleBlogList = (error, res, data) => {
    console.log('Getting a page of blogs.');
    if (error || res.statusCode !== 200) {
      console.log(error);

      return;
    }

    var json = JSON.parse(data);

    if (json.next) {
      request(json.next, handleBlogList);
    }

    results = results.concat(json.results);

    if (!json.next) {
      inquirer.prompt([{
        type: 'list',
        name: 'blog',
        message: 'Which blog do you want to use ?',
        choices: results.map(e => ({name: e.name, value: e.id}))
      }])
      .then(answers => {
        results = [];
        request({
          url: 'https://' + nbSlug + '.nationbuilder.com/api/v1/sites/' + nbSlug + '/pages/blogs/' + answers.blog + '/posts?limit=100&access_token=' + nbToken,
          headers: {
            Accept: 'application/json'
          }
        }, handlePages);
      });
    }
  };

  request({
    url: 'https://' + nbSlug + '.nationbuilder.com/api/v1/sites/' + nbSlug + '/pages/blogs?limit=100&access_token=' + nbToken,
    headers: {
      Accept: 'application/json'
    }
  }, handleBlogList);
}
