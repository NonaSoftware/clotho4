'use strict';
const internals = {};

internals.applyRoutes = function (server, next) {

  const Function = server.plugins['hapi-mongo-models'].Function;

  server.route({
    method: 'GET',
    path: '/function',
    config: {
      auth: {
        strategy: 'session'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: '/login',
        }
      }
    },
    handler: function (request, reply) {

      Function.find({}, (err, response) => {

        return reply.view('function',{
          functions: response,
          user: request.auth.credentials.user
        });
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/function/{name}',
    config: {
      auth: {
        strategies: ['simple', 'session']
      }
    },
    handler: function (request, reply) {

      var query = request.params.name.toLowerCase();

      Function.find({name: { $regex: query}}, (err, result) => {

        return reply.view('function', {
          functions: result,
          user: request.auth.credentials.user,
          query: request.params.name
        });
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/function/create',
    config: {
      auth: {
        strategy: 'session'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: '/login',
        }
      }
    },
    handler: function (request, reply) {

      const languageRequest = {
        method: 'GET',
        url: '/api/function/language',
        credentials: request.auth.credentials
      };

      server.inject(languageRequest, (result) => {

        return reply.view('functionCreate',{
          languages: JSON.parse(result.payload),
          user: request.auth.credentials.user
        });
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/function/view/{id}',
    config: {
      auth: {
        strategy: 'session'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: '/login',
        }
      }
    },
    handler: function (request, reply) {

      const languageRequest = {
        method: 'GET',
        url: '/api/function/language',
        credentials: request.auth.credentials
      };

      server.inject(languageRequest, (languages) => {

        Function.findById(request.params.id, (err, response) => {

          return reply.view('functionView',{
            functions: response,
            languages: languages.result,
            user: request.auth.credentials.user
          });
        });
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/function/edit/{id}',
    config: {
      auth: {
        strategy: 'session'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: '/login',
        }
      }
    },
    handler: function (request, reply) {

      const languageRequest = {
        method: 'GET',
        url: '/api/function/language',
        credentials: request.auth.credentials
      };

      server.inject(languageRequest, (languages) => {

        Function.findById(request.params.id, (err, response) => {

          return reply.view('functionEdit',{
            functions: response,
            languages: languages.result,
            user: request.auth.credentials.user
          });
        });
      });
    }
  });

  next();
};

exports.register = function (server, options, next) {

  server.dependency(['auth'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'function',
  dependencies: 'visionary'
};
