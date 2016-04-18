import fs from 'fs';
import program from 'commander';
import request from 'request';

class ImportCommand {
  constructor() {
    program
    .version(require('./package.json').version)
    .usage('import path/to/data.json --endpoint http://wordpress.com/wp-json/wp/v2/')
    .arguments('<data>')
    .option('-e, --endpoint <n>',
      'Set your wordpress installation endpoint base url')
    .option('-L, --login <n>', 'Wordpress login')
    .option('-P, --password <n>', 'Wordpress password')
    .action(data => {
      this.endpoint = program.endpoint;
      this.login = program.login;
      this.password = program.password;
      this.parseData(data)
      .then(data => this.importData(data))
      .catch(err => console.error(err));
    })
    .parse(process.argv);
  }

  parseData(data) {
    return new Promise((resolve, reject) => {
      fs.readFile(data, (error, data) => {
        if (error) {
          return reject(error);
        }

        try {
          resolve(JSON.parse(data.toString()));
        } catch (e) {
          reject('data is not a valid json');
        }
      });
    });
  }

  importData(data) {
    return Promise.all(data.map(post => this.sendPostToWordpress(post)));
  }

  sendPostToWordpress(post) {
    return new Promise((resolve, reject) => {
      request
      .post(`${this.endpoint}pages`)
      .auth(this.login, this.password, true)
      .form({
        date: post.published_at,
        modified: post.published_at,
        slug: post.slug,
        title: post.title,
        content: post.content,
        status: 'publish'
      })
      .on('response', res => {
        console.log(res.statusCode);
        resolve(res);
      })
      .on('error', err => {
        console.error('ERROR', err);
        reject(err);
      });
    });
  }
}

new ImportCommand();
