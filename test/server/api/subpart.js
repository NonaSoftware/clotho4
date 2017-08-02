'use strict';
const AuthPlugin = require('../../../server/auth');
const AuthenticatedUser = require('../fixtures/credentials-admin');
const Code = require('code');
const Config = require('../../../config');
const Hapi = require('hapi');
const HapiAuthBasic = require('hapi-auth-basic');
const HapiAuthCookie = require('hapi-auth-cookie');
const Lab = require('lab');
const MakeMockModel = require('../fixtures/make-mock-model');
const Manifest = require('../../../manifest');
const Path = require('path');
const Proxyquire = require('proxyquire');
const PartPlugin = require('../../../server/api/subparts');

const lab = exports.lab = Lab.script();
let request;
let server;
let stub;


lab.before((done) => {

  stub = {
    Part: MakeMockModel()
  };

  const proxy = {};
  proxy[Path.join(process.cwd(), './server/models/part')] = stub.Part;

  const ModelsPlugin = {
    register: Proxyquire('hapi-mongo-models', proxy),
    options: Manifest.get('/registrations').filter((reg) => {

      if (reg.plugin &&
        reg.plugin.register &&
        reg.plugin.register === 'hapi-mongo-models') {

        return true;
      }

      return false;
    })[0].plugin.options
  };

  const plugins = [HapiAuthBasic, HapiAuthCookie, ModelsPlugin, AuthPlugin, PartPlugin];
  server = new Hapi.Server();
  server.connection({port: Config.get('/port/web')});
  server.register(plugins, (err) => {

    if (err) {
      return done(err);
    }

    server.initialize(done);
  });
});


lab.after((done) => {

  server.plugins['hapi-mongo-models'].MongoModels.disconnect();

  done();
});


lab.experiment('Part Plugin Result List', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/subpart',
      credentials: AuthenticatedUser
    };

    done();
  });


  lab.test('it returns an error when paged find fails', (done) => {

    stub.Part.pagedFind = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('find failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns an array of documents successfully', (done) => {

    stub.Part.pagedFind = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(null, {data: [{}, {}, {}]});
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.data).to.be.an.array();
      Code.expect(response.result.data[0]).to.be.an.object();

      done();
    });
  });
});


lab.experiment('Part Plugin Read', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/subpart/93EP150D35',
      credentials: AuthenticatedUser
    };

    done();
  });


  lab.test('it returns an error when find by id fails', (done) => {

    stub.Part.findById = function (id, callback) {

      callback(Error('find by id failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns a not found when find by id misses', (done) => {

    stub.Part.findById = function (id, callback) {

      callback();
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(404);
      Code.expect(response.result.message).to.match(/document not found/i);

      done();
    });
  });


  lab.test('it returns a document successfully', (done) => {

    stub.Part.findById = function (id, callback) {

      callback(null, {_id: '93EP150D35'});
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result).to.be.an.object();

      done();
    });
  });
});


lab.experiment('Part Plugin Delete', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'DELETE',
      url: '/subpart/93EP150D35',
      credentials: AuthenticatedUser
    };

    done();
  });


  lab.test('it returns an error when delete by id fails', (done) => {

    stub.Part.findByIdAndDelete = function (id, callback) {

      callback(Error('delete by id failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns a not found when delete by id misses', (done) => {

    stub.Part.findByIdAndDelete = function (id, callback) {

      callback(null, undefined);
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(404);
      Code.expect(response.result.message).to.match(/document not found/i);

      done();
    });
  });


  lab.test('it deletes a document successfully', (done) => {

    stub.Part.findByIdAndDelete = function (id, callback) {

      callback(null, 1);
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.message).to.match(/success/i);

      done();
    });
  });
});

lab.experiment('Part Plugin Create', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/subpart',
      payload: {
        name: 'part1',
      },
      credentials: AuthenticatedUser
    };

    done();
  });

  lab.test('it returns an error when create fails', (done) => {

    stub.Part.findOne = function (conditions, callback) {

      callback();
    };

    stub.Part.create = function (name, description, userId, displayId, bioDesignId, callback) {

      callback(Error('create failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });

  lab.test('it creates a document successfully', (done) => {

    stub.Part.findOne = function (conditions, callback) {

      callback();
    };

    stub.Part.create = function (name, description, userId, displayId, bioDesignId, callback) {

      callback(null, {});
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result).to.be.an.object();

      done();
    });
  });
});


lab.experiment('Sub-Parts Plugin Update', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'PUT',
      url: '/subpart/420000000000000000000000',
      payload: {
        name: 'Test name',
        description: 'Test description',
        displayId: 'Test display id',
        bioDesignId: 'Test bio design id'
      },
      credentials: AuthenticatedUser
    };

    done();
  });

  lab.test('it updates the document successfully', (done) => {

    stub.Part.findByIdAndUpdate = function (id, update, callback) {

      callback(null, {});
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result).to.be.an.object();

      done();
    });
  });

  lab.test('it returns an error', (done) => {

    stub.Part.findByIdAndUpdate = function (id, update, callback) {

      callback(Error('error'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);
      done();
    });
  });

  lab.test('the sub part is not found', (done) => {

    stub.Part.findByIdAndUpdate = function (id, update, callback) {

      callback(null, null);
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(404);
      done();
    });
  });

});
