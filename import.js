'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ImportCommand = function () {
  function ImportCommand() {
    var _this = this;

    _classCallCheck(this, ImportCommand);

    _commander2.default.version(require('./package.json').version).usage('import path/to/data.json --endpoint http://wordpress.com/wp-json/wp/v2/').arguments('<data>').option('-e, --endpoint <n>', 'Set your wordpress installation endpoint base url').option('-L, --login <n>', 'Wordpress login').option('-P, --password <n>', 'Wordpress password').action(function (data) {
      _this.endpoint = _commander2.default.endpoint;
      _this.login = _commander2.default.login;
      _this.password = _commander2.default.password;
      _this.parseData(data).then(function (data) {
        return _this.importData(data);
      }).catch(function (err) {
        return console.error(err);
      });
    }).parse(process.argv);
  }

  _createClass(ImportCommand, [{
    key: 'parseData',
    value: function parseData(data) {
      return new Promise(function (resolve, reject) {
        _fs2.default.readFile(data, function (error, data) {
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
  }, {
    key: 'importData',
    value: function importData(data) {
      var _this2 = this;

      return Promise.all(data.map(function (post) {
        return _this2.sendPostToWordpress(post);
      }));
    }
  }, {
    key: 'sendPostToWordpress',
    value: function sendPostToWordpress(post) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        _request2.default.post(_this3.endpoint + 'pages').auth(_this3.login, _this3.password, true).form({
          date: post.published_at,
          modified: post.published_at,
          slug: post.slug,
          title: post.title,
          content: post.content,
          status: 'publish'
        }).on('response', function (res) {
          console.log(res.statusCode);
          resolve(res);
        }).on('error', function (err) {
          console.error('ERROR', err);
          reject(err);
        });
      });
    }
  }]);

  return ImportCommand;
}();

new ImportCommand();