import * as _ from 'lodash';

import { Response } from './swaggerJSON';
import { deepOmit, handleResponseRequired } from './utils';
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

const _params = (type: string, parameters: any) => (target, name, descriptor) => {
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
        required: Object.entries(parameters as any[]).reduce((acc: string[], [key, value]) => {
          if (value.required) {
            acc.push(key);
          }
          return acc;
        }, []),
        // parameters 移除 required 属性
        properties: deepOmit(parameters, ['required'])
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
    request: { method, path }
    // TODO: 不符合 swagger 规范
    // security: [{ ApiKeyAuth: [] }]
  });
  return descriptor;
};

const middlewares = (val) => (target, name, descriptor) => {
  if (!target || !name) { throw new Error(); }
  descriptor.value.middlewares = val;
  return descriptor;
};

const responses = (res: Response = { 200: { description: 'success' } }) => (target, name, descriptor) => {
  const response = Object.entries(res).reduce((acc: { [key: string]: any }, [key, value]) => {
    acc[key] = handleResponseRequired(value);
    return acc;
  }, {});
  descriptor.value.responses = response;
  _addToApiObject(target, name, apiObjects, { responses: response });
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
