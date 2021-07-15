import { Application } from 'egg';
import * as _path from 'path';
import * as _ from 'lodash';
/**
 * eg. /api/{id} -> /api/:id
 * @param {String} path
 */
const convertPath = (path) => {
  // eslint-disable-next-line prefer-regex-literals
  const re = new RegExp('{(.*?)}', 'g');
  return path.replace(re, ':$1');
};

const getPath = (prefix : string, path : string) => `${prefix}${path}`.replace('//', '/');

function loadSwaggerClassesToContext (app: Application) {
  const opt = {
    call: false,
    caseStyle: 'lower',
    directory: _path.join(app.config.baseDir, 'app/controller'),
    typescript: true
  };
  app.loader.loadToApp(opt.directory, 'swaggerControllerClasses', opt);
}

function deepOmit (obj: { [key: string]: any }, targets: string[]) {
  return Object.entries(obj).reduce((acc: {[key: string]: any}, [key, value]) => {
    if (!targets.includes(key)) {
      if (Object.prototype.toString.call(value) === '[object Object]') {
        acc[key] = deepOmit(value, targets);
      } else {
        acc[key] = value;
      }
    }
    return acc;
  }, {});
}

/**
 * 移除 properties 的 required 到父级
 */
function handleResponseRequired (obj: { [key: string]: any }) {
  return Object.entries(obj).reduce((acc: { [key: string]: any }, [key, value]) => {
    if (key === 'properties') {
      acc.required = Object.entries(value).reduce((acc2: string[], [k2, v2]: [string, any]) => {
        if (v2.required) {
          acc2.push(k2);
        }
        return acc2;
      }, []);
      acc[key] = deepOmit(value, ['required', 'code', 'message']);
    } else if (_.isPlainObject(value)) {
      acc[key] = handleResponseRequired(value);
    } else {
      acc[key] = value;
    }
    return acc;
  }, {});
}

export { convertPath, getPath, loadSwaggerClassesToContext, deepOmit, handleResponseRequired };
