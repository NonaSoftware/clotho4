'use strict';

const Boom = require('boom');
const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {

  const Parameter = server.plugins['hapi-mongo-models'].Parameter;

  server.route({
    method: 'GET',
    path: '/parameter',
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

      Parameter.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/parameter/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Parameter.findById(request.params.id, (err, parameter) => {

        if (err) {
          return reply(err);
        }

        if (!parameter) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(parameter);
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/parameter',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          bioDesignId: Joi.string().optional(),
          value: Joi.number().required(),
          variable: Joi.string().required(),
          units: Joi.string().required()
        }
      }
    },

    handler: function (request, reply) {

      Parameter.create(
        request.payload.name,
        request.auth.credentials.user._id.toString(),
        request.payload.bioDesignId,
        request.payload.value,
        request.payload.variable,
        request.payload.units,
        (err, parameter) => {

          if (err) {
            return reply(err);
          }
          return reply(parameter);
        });
    }
  });

  server.route({
    method: 'PUT',
    path: '/parameter/{id}',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          bioDesignId: Joi.string().optional(),
          value: Joi.number().required(),
          variable: Joi.string().required()
        }
      }
    },
    handler: function (request, reply) {

      const id = request.params.id;
      const update = {
        $set: {
          bioDesignId: request.payload.bioDesignId,
          value: request.payload.value,
          variable: request.payload.variable
        }
      };

      Parameter.findByIdAndUpdate(id, update, (err, parameter) => {

        if (err) {
          return reply(err);
        }

        if (!parameter) {
          return reply(Boom.notFound('Parameter not found.'));
        }

        reply(parameter);
      });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/parameter/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Parameter.findByIdAndDelete(request.params.id, (err, parameter) => {

        if (err) {
          return reply(err);
        }

        if (!parameter) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply({message: 'Success.'});
      });
    }
  });

  next();
};


exports.register = function (server, options, next) {

  server.dependency(['auth', 'hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'parameter'
};
