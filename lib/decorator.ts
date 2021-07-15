import * as _ from 'lodash';

import { Response } from './swaggerJSON';
/**
 * used for building swagger docs object
 */
const apiObjects = {};

const _addToApiObject = (target, name, apiObj, content) => {
  const key = `${target.constructor.name}-${name}`;
  if (!apiObj[key]) {
    apiObj[key] = {};
  }
  Object.assign(apiObj[key], content);
};

const _desc = (type, text) => (target, name, descriptor) => {
  descriptor.value[type] = text;
  _addToApiObject(target, name, apiObjects, { [type]: text });
  return descriptor;
};

const _params = (type, parameters) => (target, name, descriptor) => {
  if (!descriptor.value.parameters) {
    descriptor.value.parameters = {};
  }
  descriptor.value.parameters[type] = parameters;

  // additional wrapper for body
  let swaggerParameters = parameters;
  if (type === 'body') {
    swaggerParameters = [{
      name: 'data',
      description: 'request body',
      schema: {
        type: 'object',
        properties: parameters
      }
    }];
  } else {
    swaggerParameters = Object.keys(swaggerParameters).map((key) => {
      return Object.assign({ name: key }, swaggerParameters[key]);
    });
  }
  swaggerParameters.forEach((item) => {
    item.in = type;
  });

  _addToApiObject(target, name, apiObjects, { [type]: swaggerParameters });
  return descriptor;
};

const request = (method, path) => (target, name, descriptor) => {
  method = _.toLower(method);
  descriptor.value.method = method;
  descriptor.value.path = path;
  _addToApiObject(target, name, apiObjects, {
    request: { method, path },
    security: [{ ApiKeyAuth: [] }]
  });
  return descriptor;
};

const middlewares = (val) => (target, name, descriptor) => {
  if (!target || !name) { throw new Error(); }
  descriptor.value.middlewares = val;
  return descriptor;
};

const responses = (res: Response = { 200: { description: 'success' } }) => (target, name, descriptor) => {
  descriptor.value.responses = res;
  _addToApiObject(target, name, apiObjects, { responses: res });
  return descriptor;
};
const desc = _.curry(_desc);

// description and summary
const description = desc('description');

const summary = desc('summary');

const tags = desc('tags');

const params = _.curry(_params);

// below are [parameters]

// query params
const query = params('query');

// path params
const path = params('path');

// body params
const body = params('body');

// formData params
const formData = params('formData');

export {
  request, summary, params, desc, description, query, path, body, tags,
  apiObjects, middlewares, formData, responses
};
