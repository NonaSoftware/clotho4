'use strict';

const Boom = require('boom');
const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {

  const Module = server.plugins['hapi-mongo-models'].Module;

  server.route({
    method: 'GET',
    path: '/module',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        query: {
          sort: Joi.string().default('_id'),
          limit: Joi.number().default(20),
          page: Joi.number().default(1)
        }
      }
    },
    handler: function (request, reply) {

      const query = {};
      const fields = request.query.fields;
      const sort = request.query.sort;
      const limit = request.query.limit;
      const page = request.query.page;

      Module.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/module/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Module.findById(request.params.id, (err, module) => {

        if (err) {
          return reply(err);
        }

        if (!module) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(module);
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/module',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          description: Joi.string().optional(),
          role: Joi.string().valid('TRANSCRIPTION', 'TRANSLATION', 'EXPRESSION', 'COMPARTMENTALIZATION', 'LOCALIZATION', 'SENSOR', 'REPORTER', 'ACTIVATION', 'REPRESSION').required(),
          influenceIds: Joi.array().items(Joi.string()),
          parentModuleId: Joi.string(),
          submoduleIds: Joi.array().items(Joi.string()),
          // features: Joi.array().items(Feature.schema) // Need to implement either a separate route or just fetch Ids
        }
      }
    },
    handler: function (request, reply) {

      Module.create(
        request.payload.name,
        request.payload.description,
        request.payload.role,
        request.auth.credentials.user._id.toString(),
        request.payload.influenceIds,
        request.payload.parentModuleId,
        request.payload.submoduleIds,

        (err, module) => {

          if (err) {
            return reply(err);
          }
          return reply(module);
        });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/module/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Module.findByIdAndDelete(request.params.id, (err, module) => {

        if (err) {
          return reply(err);
        }

        if (!module) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply({message: 'Success.'});
      });
    }
  });
};


exports.register = function (server, options, next) {

  server.dependency(['auth', 'hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'module'
};
