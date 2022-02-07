import { I as log$2, J as COORDINATE_SYSTEM, P as PROJECTION_MODE, U as UNIT, O as transformMat4, Q as multiply, R as assert$4, N as lngLatToWorld, S as clamp, W as MAX_LATITUDE, X as worldToLngLat, Y as log2, Z as transformVector, _ as lerp, V as Viewport, $ as getViewMatrix, M as Matrix4, a0 as addMetersToLngLat, p as pixelsToWorld, a as add$1, n as negate, a1 as altitudeToFovy, a2 as fovyToAltitude, a3 as getProjectionParameters, a4 as sub, H as defaultTypedArrayManager, a5 as toDoublePrecisionArray, b as assert$5, T as Transition, l as lerp$1, a6 as worldToPixels } from './transition-e4288157.js';
import { _ as _defineProperty, i as isBrowser$1, a as isElectron, V as VERSION$1, s as self_, w as window_, g as global_$1, d as document_, p as process_, c as console_, b as isBrowserMainThread, L as Log } from './log-2130d917.js';
import { p as process } from './process-2545f00a.js';
import { l as load } from './load-4b03c340.js';

function getHiResTimestamp() {
  let timestamp;

  if (typeof window !== 'undefined' && window.performance) {
    timestamp = window.performance.now();
  } else if (typeof process !== 'undefined' && process.hrtime) {
    const timeParts = process.hrtime();
    timestamp = timeParts[0] * 1000 + timeParts[1] / 1e6;
  } else {
    timestamp = Date.now();
  }

  return timestamp;
}

class Stat {
  constructor(name, type) {
    _defineProperty(this, "name", void 0);

    _defineProperty(this, "type", void 0);

    _defineProperty(this, "sampleSize", 1);

    _defineProperty(this, "time", void 0);

    _defineProperty(this, "count", void 0);

    _defineProperty(this, "samples", void 0);

    _defineProperty(this, "lastTiming", void 0);

    _defineProperty(this, "lastSampleTime", void 0);

    _defineProperty(this, "lastSampleCount", void 0);

    _defineProperty(this, "_count", 0);

    _defineProperty(this, "_time", 0);

    _defineProperty(this, "_samples", 0);

    _defineProperty(this, "_startTime", 0);

    _defineProperty(this, "_timerPending", false);

    this.name = name;
    this.type = type;
    this.reset();
  }

  setSampleSize(samples) {
    this.sampleSize = samples;
    return this;
  }

  incrementCount() {
    this.addCount(1);
    return this;
  }

  decrementCount() {
    this.subtractCount(1);
    return this;
  }

  addCount(value) {
    this._count += value;
    this._samples++;

    this._checkSampling();

    return this;
  }

  subtractCount(value) {
    this._count -= value;
    this._samples++;

    this._checkSampling();

    return this;
  }

  addTime(time) {
    this._time += time;
    this.lastTiming = time;
    this._samples++;

    this._checkSampling();

    return this;
  }

  timeStart() {
    this._startTime = getHiResTimestamp();
    this._timerPending = true;
    return this;
  }

  timeEnd() {
    if (!this._timerPending) {
      return this;
    }

    this.addTime(getHiResTimestamp() - this._startTime);
    this._timerPending = false;

    this._checkSampling();

    return this;
  }

  getSampleAverageCount() {
    return this.sampleSize > 0 ? this.lastSampleCount / this.sampleSize : 0;
  }

  getSampleAverageTime() {
    return this.sampleSize > 0 ? this.lastSampleTime / this.sampleSize : 0;
  }

  getSampleHz() {
    return this.lastSampleTime > 0 ? this.sampleSize / (this.lastSampleTime / 1000) : 0;
  }

  getAverageCount() {
    return this.samples > 0 ? this.count / this.samples : 0;
  }

  getAverageTime() {
    return this.samples > 0 ? this.time / this.samples : 0;
  }

  getHz() {
    return this.time > 0 ? this.samples / (this.time / 1000) : 0;
  }

  reset() {
    this.time = 0;
    this.count = 0;
    this.samples = 0;
    this.lastTiming = 0;
    this.lastSampleTime = 0;
    this.lastSampleCount = 0;
    this._count = 0;
    this._time = 0;
    this._samples = 0;
    this._startTime = 0;
    this._timerPending = false;
    return this;
  }

  _checkSampling() {
    if (this._samples === this.sampleSize) {
      this.lastSampleTime = this._time;
      this.lastSampleCount = this._count;
      this.count += this._count;
      this.time += this._time;
      this.samples += this._samples;
      this._time = 0;
      this._count = 0;
      this._samples = 0;
    }
  }

}

class Stats {
  constructor(options) {
    _defineProperty(this, "id", void 0);

    _defineProperty(this, "stats", {});

    this.id = options.id;
    this.stats = {};

    this._initializeStats(options.stats);

    Object.seal(this);
  }

  get(name) {
    let type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'count';
    return this._getOrCreate({
      name,
      type
    });
  }

  get size() {
    return Object.keys(this.stats).length;
  }

  reset() {
    for (const key in this.stats) {
      this.stats[key].reset();
    }

    return this;
  }

  forEach(fn) {
    for (const key in this.stats) {
      fn(this.stats[key]);
    }
  }

  getTable() {
    const table = {};
    this.forEach(stat => {
      table[stat.name] = {
        time: stat.time || 0,
        count: stat.count || 0,
        average: stat.getAverageTime() || 0,
        hz: stat.getHz() || 0
      };
    });
    return table;
  }

  _initializeStats() {
    let stats = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    stats.forEach(stat => this._getOrCreate(stat));
  }

  _getOrCreate(stat) {
    if (!stat || !stat.name) {
      return null;
    }

    const {
      name,
      type
    } = stat;

    if (!this.stats[name]) {
      if (stat instanceof Stat) {
        this.stats[name] = stat;
      } else {
        this.stats[name] = new Stat(name, type);
      }
    }

    return this.stats[name];
  }

}

const window$1 = globalThis;
function isMobile() {
  return typeof window$1.orientation !== 'undefined';
}
function getBrowser(mockUserAgent) {
  if (!mockUserAgent && !isBrowser$1()) {
    return 'Node';
  }

  if (isElectron(mockUserAgent)) {
    return 'Electron';
  }

  const navigator_ = typeof navigator !== 'undefined' ? navigator : {};
  const userAgent = mockUserAgent || navigator_.userAgent || '';

  if (userAgent.indexOf('Edge') > -1) {
    return 'Edge';
  }

  const isMSIE = userAgent.indexOf('MSIE ') !== -1;
  const isTrident = userAgent.indexOf('Trident/') !== -1;

  if (isMSIE || isTrident) {
    return 'IE';
  }

  if (window$1.chrome) {
    return 'Chrome';
  }

  if (window$1.safari) {
    return 'Safari';
  }

  if (window$1.mozInnerScreenX) {
    return 'Firefox';
  }

  return 'Unknown';
}

function assert$3(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

var esm = /*#__PURE__*/Object.freeze({
  __proto__: null,
  VERSION: VERSION$1,
  self: self_,
  window: window_,
  global: global_$1,
  document: document_,
  process: process_,
  console: console_,
  isBrowser: isBrowser$1,
  isBrowserMainThread: isBrowserMainThread,
  getBrowser: getBrowser,
  isMobile: isMobile,
  isElectron: isElectron,
  assert: assert$3
});

// This file enables: import 'probe.gl/bench'.
// Note: Must be published using package.json "files" field
var env = esm;

let loggers = {};

function register(handlers) {
  loggers = handlers;
}
function debug(eventType) {
  if (log$2.level > 0 && loggers[eventType]) {
    loggers[eventType].call(...arguments);
  }
}

const log$1 = new Log({
  id: 'luma.gl'
});

function assert$2(condition, message) {
  if (!condition) {
    throw new Error(message || 'luma.gl: assertion failed.');
  }
}

const ERR_CONTEXT = 'Invalid WebGLRenderingContext';
const ERR_WEBGL2 = 'Requires WebGL2';
function isWebGL(gl) {
  if (typeof WebGLRenderingContext !== 'undefined' && gl instanceof WebGLRenderingContext) {
    return true;
  }

  if (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) {
    return true;
  }

  return Boolean(gl && Number.isFinite(gl._version));
}
function isWebGL2$1(gl) {
  if (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) {
    return true;
  }

  return Boolean(gl && gl._version === 2);
}
function getWebGL2Context(gl) {
  return isWebGL2$1(gl) ? gl : null;
}
function assertWebGLContext(gl) {
  assert$2(isWebGL(gl), ERR_CONTEXT);
  return gl;
}
function assertWebGL2Context(gl) {
  assert$2(isWebGL2$1(gl), ERR_WEBGL2);
  return gl;
}

const glErrorShadow = {};

function error(msg) {
  if (env.global.console && env.global.console.error) {
    env.global.console.error(msg);
  }
}

function log(msg) {
  if (env.global.console && env.global.console.log) {
    env.global.console.log(msg);
  }
}

function synthesizeGLError(err, opt_msg) {
  glErrorShadow[err] = true;

  if (opt_msg !== undefined) {
    error(opt_msg);
  }
}

function wrapGLError(gl) {
  const f = gl.getError;

  gl.getError = function getError() {
    let err;

    do {
      err = f.apply(gl);

      if (err !== 0) {
        glErrorShadow[err] = true;
      }
    } while (err !== 0);

    for (err in glErrorShadow) {
      if (glErrorShadow[err]) {
        delete glErrorShadow[err];
        return parseInt(err, 10);
      }
    }

    return 0;
  };
}

const WebGLVertexArrayObjectOES = function WebGLVertexArrayObjectOES(ext) {
  const gl = ext.gl;
  this.ext = ext;
  this.isAlive = true;
  this.hasBeenBound = false;
  this.elementArrayBuffer = null;
  this.attribs = new Array(ext.maxVertexAttribs);

  for (let n = 0; n < this.attribs.length; n++) {
    const attrib = new WebGLVertexArrayObjectOES.VertexAttrib(gl);
    this.attribs[n] = attrib;
  }

  this.maxAttrib = 0;
};

WebGLVertexArrayObjectOES.VertexAttrib = function VertexAttrib(gl) {
  this.enabled = false;
  this.buffer = null;
  this.size = 4;
  this.type = 5126;
  this.normalized = false;
  this.stride = 16;
  this.offset = 0;
  this.cached = '';
  this.recache();
};

WebGLVertexArrayObjectOES.VertexAttrib.prototype.recache = function recache() {
  this.cached = [this.size, this.type, this.normalized, this.stride, this.offset].join(':');
};

const OESVertexArrayObject = function OESVertexArrayObject(gl) {
  const self = this;
  this.gl = gl;
  wrapGLError(gl);
  const original = this.original = {
    getParameter: gl.getParameter,
    enableVertexAttribArray: gl.enableVertexAttribArray,
    disableVertexAttribArray: gl.disableVertexAttribArray,
    bindBuffer: gl.bindBuffer,
    getVertexAttrib: gl.getVertexAttrib,
    vertexAttribPointer: gl.vertexAttribPointer
  };

  gl.getParameter = function getParameter(pname) {
    if (pname === self.VERTEX_ARRAY_BINDING_OES) {
      if (self.currentVertexArrayObject === self.defaultVertexArrayObject) {
        return null;
      }

      return self.currentVertexArrayObject;
    }

    return original.getParameter.apply(this, arguments);
  };

  gl.enableVertexAttribArray = function enableVertexAttribArray(index) {
    const vao = self.currentVertexArrayObject;
    vao.maxAttrib = Math.max(vao.maxAttrib, index);
    const attrib = vao.attribs[index];
    attrib.enabled = true;
    return original.enableVertexAttribArray.apply(this, arguments);
  };

  gl.disableVertexAttribArray = function disableVertexAttribArray(index) {
    const vao = self.currentVertexArrayObject;
    vao.maxAttrib = Math.max(vao.maxAttrib, index);
    const attrib = vao.attribs[index];
    attrib.enabled = false;
    return original.disableVertexAttribArray.apply(this, arguments);
  };

  gl.bindBuffer = function bindBuffer(target, buffer) {
    switch (target) {
      case 34962:
        self.currentArrayBuffer = buffer;
        break;

      case 34963:
        self.currentVertexArrayObject.elementArrayBuffer = buffer;
        break;
    }

    return original.bindBuffer.apply(this, arguments);
  };

  gl.getVertexAttrib = function getVertexAttrib(index, pname) {
    const vao = self.currentVertexArrayObject;
    const attrib = vao.attribs[index];

    switch (pname) {
      case 34975:
        return attrib.buffer;

      case 34338:
        return attrib.enabled;

      case 34339:
        return attrib.size;

      case 34340:
        return attrib.stride;

      case 34341:
        return attrib.type;

      case 34922:
        return attrib.normalized;

      default:
        return original.getVertexAttrib.apply(this, arguments);
    }
  };

  gl.vertexAttribPointer = function vertexAttribPointer(indx, size, type, normalized, stride, offset) {
    const vao = self.currentVertexArrayObject;
    vao.maxAttrib = Math.max(vao.maxAttrib, indx);
    const attrib = vao.attribs[indx];
    attrib.buffer = self.currentArrayBuffer;
    attrib.size = size;
    attrib.type = type;
    attrib.normalized = normalized;
    attrib.stride = stride;
    attrib.offset = offset;
    attrib.recache();
    return original.vertexAttribPointer.apply(this, arguments);
  };

  if (gl.instrumentExtension) {
    gl.instrumentExtension(this, 'OES_vertex_array_object');
  }

  if (gl.canvas) {
    gl.canvas.addEventListener('webglcontextrestored', () => {
      log('OESVertexArrayObject emulation library context restored');
      self.reset_();
    }, true);
  }

  this.reset_();
};

OESVertexArrayObject.prototype.VERTEX_ARRAY_BINDING_OES = 0x85b5;

OESVertexArrayObject.prototype.reset_ = function reset_() {
  const contextWasLost = this.vertexArrayObjects !== undefined;

  if (contextWasLost) {
    for (let ii = 0; ii < this.vertexArrayObjects.length; ++ii) {
      this.vertexArrayObjects.isAlive = false;
    }
  }

  const gl = this.gl;
  this.maxVertexAttribs = gl.getParameter(34921);
  this.defaultVertexArrayObject = new WebGLVertexArrayObjectOES(this);
  this.currentVertexArrayObject = null;
  this.currentArrayBuffer = null;
  this.vertexArrayObjects = [this.defaultVertexArrayObject];
  this.bindVertexArrayOES(null);
};

OESVertexArrayObject.prototype.createVertexArrayOES = function createVertexArrayOES() {
  const arrayObject = new WebGLVertexArrayObjectOES(this);
  this.vertexArrayObjects.push(arrayObject);
  return arrayObject;
};

OESVertexArrayObject.prototype.deleteVertexArrayOES = function deleteVertexArrayOES(arrayObject) {
  arrayObject.isAlive = false;
  this.vertexArrayObjects.splice(this.vertexArrayObjects.indexOf(arrayObject), 1);

  if (this.currentVertexArrayObject === arrayObject) {
    this.bindVertexArrayOES(null);
  }
};

OESVertexArrayObject.prototype.isVertexArrayOES = function isVertexArrayOES(arrayObject) {
  if (arrayObject && arrayObject instanceof WebGLVertexArrayObjectOES) {
    if (arrayObject.hasBeenBound && arrayObject.ext === this) {
      return true;
    }
  }

  return false;
};

OESVertexArrayObject.prototype.bindVertexArrayOES = function bindVertexArrayOES(arrayObject) {
  const gl = this.gl;

  if (arrayObject && !arrayObject.isAlive) {
    synthesizeGLError(1282, 'bindVertexArrayOES: attempt to bind deleted arrayObject');
    return;
  }

  const original = this.original;
  const oldVAO = this.currentVertexArrayObject;
  this.currentVertexArrayObject = arrayObject || this.defaultVertexArrayObject;
  this.currentVertexArrayObject.hasBeenBound = true;
  const newVAO = this.currentVertexArrayObject;

  if (oldVAO === newVAO) {
    return;
  }

  if (!oldVAO || newVAO.elementArrayBuffer !== oldVAO.elementArrayBuffer) {
    original.bindBuffer.call(gl, 34963, newVAO.elementArrayBuffer);
  }

  let currentBinding = this.currentArrayBuffer;
  const maxAttrib = Math.max(oldVAO ? oldVAO.maxAttrib : 0, newVAO.maxAttrib);

  for (let n = 0; n <= maxAttrib; n++) {
    const attrib = newVAO.attribs[n];
    const oldAttrib = oldVAO ? oldVAO.attribs[n] : null;

    if (!oldVAO || attrib.enabled !== oldAttrib.enabled) {
      if (attrib.enabled) {
        original.enableVertexAttribArray.call(gl, n);
      } else {
        original.disableVertexAttribArray.call(gl, n);
      }
    }

    if (attrib.enabled) {
      let bufferChanged = false;

      if (!oldVAO || attrib.buffer !== oldAttrib.buffer) {
        if (currentBinding !== attrib.buffer) {
          original.bindBuffer.call(gl, 34962, attrib.buffer);
          currentBinding = attrib.buffer;
        }

        bufferChanged = true;
      }

      if (bufferChanged || attrib.cached !== oldAttrib.cached) {
        original.vertexAttribPointer.call(gl, n, attrib.size, attrib.type, attrib.normalized, attrib.stride, attrib.offset);
      }
    }
  }

  if (this.currentArrayBuffer !== currentBinding) {
    original.bindBuffer.call(gl, 34962, this.currentArrayBuffer);
  }
};

function polyfillVertexArrayObject(gl) {
  if (typeof gl.createVertexArray === 'function') {
    return;
  }

  const original_getSupportedExtensions = gl.getSupportedExtensions;

  gl.getSupportedExtensions = function getSupportedExtensions() {
    const list = original_getSupportedExtensions.call(this) || [];

    if (list.indexOf('OES_vertex_array_object') < 0) {
      list.push('OES_vertex_array_object');
    }

    return list;
  };

  const original_getExtension = gl.getExtension;

  gl.getExtension = function getExtension(name) {
    const ext = original_getExtension.call(this, name);

    if (ext) {
      return ext;
    }

    if (name !== 'OES_vertex_array_object') {
      return null;
    }

    if (!gl.__OESVertexArrayObject) {
      this.__OESVertexArrayObject = new OESVertexArrayObject(this);
    }

    return this.__OESVertexArrayObject;
  };
}

const OES_element_index = 'OES_element_index';
const WEBGL_draw_buffers$1 = 'WEBGL_draw_buffers';
const EXT_disjoint_timer_query$1 = 'EXT_disjoint_timer_query';
const EXT_disjoint_timer_query_webgl2 = 'EXT_disjoint_timer_query_webgl2';
const EXT_texture_filter_anisotropic$1 = 'EXT_texture_filter_anisotropic';
const WEBGL_debug_renderer_info = 'WEBGL_debug_renderer_info';
const GL_FRAGMENT_SHADER_DERIVATIVE_HINT = 0x8b8b;
const GL_DONT_CARE = 0x1100;
const GL_GPU_DISJOINT_EXT = 0x8fbb;
const GL_MAX_TEXTURE_MAX_ANISOTROPY_EXT = 0x84ff;
const GL_UNMASKED_VENDOR_WEBGL = 0x9245;
const GL_UNMASKED_RENDERER_WEBGL = 0x9246;

const getWebGL2ValueOrZero = gl => !isWebGL2$1(gl) ? 0 : undefined;

const WEBGL_PARAMETERS = {
  [3074]: gl => !isWebGL2$1(gl) ? 36064 : undefined,
  [GL_FRAGMENT_SHADER_DERIVATIVE_HINT]: gl => !isWebGL2$1(gl) ? GL_DONT_CARE : undefined,
  [35977]: getWebGL2ValueOrZero,
  [32937]: getWebGL2ValueOrZero,
  [GL_GPU_DISJOINT_EXT]: (gl, getParameter) => {
    const ext = isWebGL2$1(gl) ? gl.getExtension(EXT_disjoint_timer_query_webgl2) : gl.getExtension(EXT_disjoint_timer_query$1);
    return ext && ext.GPU_DISJOINT_EXT ? getParameter(ext.GPU_DISJOINT_EXT) : 0;
  },
  [GL_UNMASKED_VENDOR_WEBGL]: (gl, getParameter) => {
    const ext = gl.getExtension(WEBGL_debug_renderer_info);
    return getParameter(ext && ext.UNMASKED_VENDOR_WEBGL || 7936);
  },
  [GL_UNMASKED_RENDERER_WEBGL]: (gl, getParameter) => {
    const ext = gl.getExtension(WEBGL_debug_renderer_info);
    return getParameter(ext && ext.UNMASKED_RENDERER_WEBGL || 7937);
  },
  [GL_MAX_TEXTURE_MAX_ANISOTROPY_EXT]: (gl, getParameter) => {
    const ext = gl.luma.extensions[EXT_texture_filter_anisotropic$1];
    return ext ? getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 1.0;
  },
  [32883]: getWebGL2ValueOrZero,
  [35071]: getWebGL2ValueOrZero,
  [37447]: getWebGL2ValueOrZero,
  [36063]: (gl, getParameter) => {
    if (!isWebGL2$1(gl)) {
      const ext = gl.getExtension(WEBGL_draw_buffers$1);
      return ext ? getParameter(ext.MAX_COLOR_ATTACHMENTS_WEBGL) : 0;
    }

    return undefined;
  },
  [35379]: getWebGL2ValueOrZero,
  [35374]: getWebGL2ValueOrZero,
  [35377]: getWebGL2ValueOrZero,
  [34852]: gl => {
    if (!isWebGL2$1(gl)) {
      const ext = gl.getExtension(WEBGL_draw_buffers$1);
      return ext ? ext.MAX_DRAW_BUFFERS_WEBGL : 0;
    }

    return undefined;
  },
  [36203]: gl => gl.getExtension(OES_element_index) ? 2147483647 : 65535,
  [33001]: gl => gl.getExtension(OES_element_index) ? 16777216 : 65535,
  [33000]: gl => 16777216,
  [37157]: getWebGL2ValueOrZero,
  [35373]: getWebGL2ValueOrZero,
  [35657]: getWebGL2ValueOrZero,
  [36183]: getWebGL2ValueOrZero,
  [37137]: getWebGL2ValueOrZero,
  [34045]: getWebGL2ValueOrZero,
  [35978]: getWebGL2ValueOrZero,
  [35979]: getWebGL2ValueOrZero,
  [35968]: getWebGL2ValueOrZero,
  [35376]: getWebGL2ValueOrZero,
  [35375]: getWebGL2ValueOrZero,
  [35659]: getWebGL2ValueOrZero,
  [37154]: getWebGL2ValueOrZero,
  [35371]: getWebGL2ValueOrZero,
  [35658]: getWebGL2ValueOrZero,
  [35076]: getWebGL2ValueOrZero,
  [35077]: getWebGL2ValueOrZero,
  [35380]: getWebGL2ValueOrZero
};
function getParameterPolyfill(gl, originalGetParameter, pname) {
  const limit = WEBGL_PARAMETERS[pname];
  const value = typeof limit === 'function' ? limit(gl, originalGetParameter, pname) : limit;
  const result = value !== undefined ? value : originalGetParameter(pname);
  return result;
}

const OES_vertex_array_object = 'OES_vertex_array_object';
const ANGLE_instanced_arrays = 'ANGLE_instanced_arrays';
const WEBGL_draw_buffers = 'WEBGL_draw_buffers';
const EXT_disjoint_timer_query = 'EXT_disjoint_timer_query';
const EXT_texture_filter_anisotropic = 'EXT_texture_filter_anisotropic';
const ERR_VAO_NOT_SUPPORTED = 'VertexArray requires WebGL2 or OES_vertex_array_object extension';

function getExtensionData(gl, extension) {
  return {
    webgl2: isWebGL2$1(gl),
    ext: gl.getExtension(extension)
  };
}

const WEBGL2_CONTEXT_POLYFILLS = {
  [OES_vertex_array_object]: {
    meta: {
      suffix: 'OES'
    },
    createVertexArray: () => {
      assert$2(false, ERR_VAO_NOT_SUPPORTED);
    },
    deleteVertexArray: () => {},
    bindVertexArray: () => {},
    isVertexArray: () => false
  },
  [ANGLE_instanced_arrays]: {
    meta: {
      suffix: 'ANGLE'
    },

    vertexAttribDivisor(location, divisor) {
      assert$2(divisor === 0, 'WebGL instanced rendering not supported');
    },

    drawElementsInstanced: () => {},
    drawArraysInstanced: () => {}
  },
  [WEBGL_draw_buffers]: {
    meta: {
      suffix: 'WEBGL'
    },
    drawBuffers: () => {
      assert$2(false);
    }
  },
  [EXT_disjoint_timer_query]: {
    meta: {
      suffix: 'EXT'
    },
    createQuery: () => {
      assert$2(false);
    },
    deleteQuery: () => {
      assert$2(false);
    },
    beginQuery: () => {
      assert$2(false);
    },
    endQuery: () => {},

    getQuery(handle, pname) {
      return this.getQueryObject(handle, pname);
    },

    getQueryParameter(handle, pname) {
      return this.getQueryObject(handle, pname);
    },

    getQueryObject: () => {}
  }
};
const WEBGL2_CONTEXT_OVERRIDES = {
  readBuffer: (gl, originalFunc, attachment) => {
    if (isWebGL2$1(gl)) {
      originalFunc(attachment);
    }
  },
  getVertexAttrib: (gl, originalFunc, location, pname) => {
    const {
      webgl2,
      ext
    } = getExtensionData(gl, ANGLE_instanced_arrays);
    let result;

    switch (pname) {
      case 35069:
        result = !webgl2 ? false : undefined;
        break;

      case 35070:
        result = !webgl2 && !ext ? 0 : undefined;
        break;
    }

    return result !== undefined ? result : originalFunc(location, pname);
  },
  getProgramParameter: (gl, originalFunc, program, pname) => {
    if (!isWebGL2$1(gl)) {
      switch (pname) {
        case 35967:
          return 35981;

        case 35971:
          return 0;

        case 35382:
          return 0;
      }
    }

    return originalFunc(program, pname);
  },
  getInternalformatParameter: (gl, originalFunc, target, format, pname) => {
    if (!isWebGL2$1(gl)) {
      switch (pname) {
        case 32937:
          return new Int32Array([0]);
      }
    }

    return gl.getInternalformatParameter(target, format, pname);
  },

  getTexParameter(gl, originalFunc, target, pname) {
    switch (pname) {
      case 34046:
        const {
          extensions
        } = gl.luma;
        const ext = extensions[EXT_texture_filter_anisotropic];
        pname = ext && ext.TEXTURE_MAX_ANISOTROPY_EXT || 34046;
        break;
    }

    return originalFunc(target, pname);
  },

  getParameter: getParameterPolyfill,

  hint(gl, originalFunc, pname, value) {
    return originalFunc(pname, value);
  }

};

function polyfillContext(gl) {
  gl.luma = gl.luma || {};
  const {
    luma
  } = gl;

  if (!luma.polyfilled) {
    polyfillVertexArrayObject(gl);
    initializeExtensions(gl);
    installPolyfills(gl, WEBGL2_CONTEXT_POLYFILLS);
    installOverrides(gl, {
      target: luma,
      target2: gl
    });
    luma.polyfilled = true;
  }

  return gl;
}
const global_ = typeof global !== 'undefined' ? global : window;
global_.polyfillContext = polyfillContext;

function initializeExtensions(gl) {
  gl.luma.extensions = {};
  const EXTENSIONS = gl.getSupportedExtensions() || [];

  for (const extension of EXTENSIONS) {
    gl.luma[extension] = gl.getExtension(extension);
  }
}

function installOverrides(gl, {
  target,
  target2
}) {
  Object.keys(WEBGL2_CONTEXT_OVERRIDES).forEach(key => {
    if (typeof WEBGL2_CONTEXT_OVERRIDES[key] === 'function') {
      const originalFunc = gl[key] ? gl[key].bind(gl) : () => {};
      const polyfill = WEBGL2_CONTEXT_OVERRIDES[key].bind(null, gl, originalFunc);
      target[key] = polyfill;
      target2[key] = polyfill;
    }
  });
}

function installPolyfills(gl, polyfills) {
  for (const extension of Object.getOwnPropertyNames(polyfills)) {
    if (extension !== 'overrides') {
      polyfillExtension(gl, {
        extension,
        target: gl.luma,
        target2: gl
      });
    }
  }
}

function polyfillExtension(gl, {
  extension,
  target,
  target2
}) {
  const defaults = WEBGL2_CONTEXT_POLYFILLS[extension];
  assert$2(defaults);
  const {
    meta = {}
  } = defaults;
  const {
    suffix = ''
  } = meta;
  const ext = gl.getExtension(extension);

  for (const key of Object.keys(defaults)) {
    const extKey = `${key}${suffix}`;
    let polyfill = null;

    if (key === 'meta') ; else if (typeof gl[key] === 'function') ; else if (ext && typeof ext[extKey] === 'function') {
      polyfill = (...args) => ext[extKey](...args);
    } else if (typeof defaults[key] === 'function') {
      polyfill = defaults[key].bind(target);
    }

    if (polyfill) {
      target[key] = polyfill;
      target2[key] = polyfill;
    }
  }
}

const GL_PARAMETER_DEFAULTS = {
  [3042]: false,
  [32773]: new Float32Array([0, 0, 0, 0]),
  [32777]: 32774,
  [34877]: 32774,
  [32969]: 1,
  [32968]: 0,
  [32971]: 1,
  [32970]: 0,
  [3106]: new Float32Array([0, 0, 0, 0]),
  [3107]: [true, true, true, true],
  [2884]: false,
  [2885]: 1029,
  [2929]: false,
  [2931]: 1,
  [2932]: 513,
  [2928]: new Float32Array([0, 1]),
  [2930]: true,
  [3024]: true,
  [36006]: null,
  [2886]: 2305,
  [33170]: 4352,
  [2849]: 1,
  [32823]: false,
  [32824]: 0,
  [10752]: 0,
  [32938]: 1.0,
  [32939]: false,
  [3089]: false,
  [3088]: new Int32Array([0, 0, 1024, 1024]),
  [2960]: false,
  [2961]: 0,
  [2968]: 0xffffffff,
  [36005]: 0xffffffff,
  [2962]: 519,
  [2967]: 0,
  [2963]: 0xffffffff,
  [34816]: 519,
  [36003]: 0,
  [36004]: 0xffffffff,
  [2964]: 7680,
  [2965]: 7680,
  [2966]: 7680,
  [34817]: 7680,
  [34818]: 7680,
  [34819]: 7680,
  [2978]: [0, 0, 1024, 1024],
  [3333]: 4,
  [3317]: 4,
  [37440]: false,
  [37441]: false,
  [37443]: 37444,
  [35723]: 4352,
  [36010]: null,
  [35977]: false,
  [3330]: 0,
  [3332]: 0,
  [3331]: 0,
  [3314]: 0,
  [32878]: 0,
  [3316]: 0,
  [3315]: 0,
  [32877]: 0
};

const enable = (gl, value, key) => value ? gl.enable(key) : gl.disable(key);

const hint = (gl, value, key) => gl.hint(key, value);

const pixelStorei = (gl, value, key) => gl.pixelStorei(key, value);

const drawFramebuffer = (gl, value) => {
  const target = isWebGL2$1(gl) ? 36009 : 36160;
  return gl.bindFramebuffer(target, value);
};

const readFramebuffer = (gl, value) => {
  return gl.bindFramebuffer(36008, value);
};

function isArray$1(array) {
  return Array.isArray(array) || ArrayBuffer.isView(array);
}

const GL_PARAMETER_SETTERS = {
  [3042]: enable,
  [32773]: (gl, value) => gl.blendColor(...value),
  [32777]: 'blendEquation',
  [34877]: 'blendEquation',
  [32969]: 'blendFunc',
  [32968]: 'blendFunc',
  [32971]: 'blendFunc',
  [32970]: 'blendFunc',
  [3106]: (gl, value) => gl.clearColor(...value),
  [3107]: (gl, value) => gl.colorMask(...value),
  [2884]: enable,
  [2885]: (gl, value) => gl.cullFace(value),
  [2929]: enable,
  [2931]: (gl, value) => gl.clearDepth(value),
  [2932]: (gl, value) => gl.depthFunc(value),
  [2928]: (gl, value) => gl.depthRange(...value),
  [2930]: (gl, value) => gl.depthMask(value),
  [3024]: enable,
  [35723]: hint,
  [36006]: drawFramebuffer,
  [2886]: (gl, value) => gl.frontFace(value),
  [33170]: hint,
  [2849]: (gl, value) => gl.lineWidth(value),
  [32823]: enable,
  [32824]: 'polygonOffset',
  [10752]: 'polygonOffset',
  [35977]: enable,
  [32938]: 'sampleCoverage',
  [32939]: 'sampleCoverage',
  [3089]: enable,
  [3088]: (gl, value) => gl.scissor(...value),
  [2960]: enable,
  [2961]: (gl, value) => gl.clearStencil(value),
  [2968]: (gl, value) => gl.stencilMaskSeparate(1028, value),
  [36005]: (gl, value) => gl.stencilMaskSeparate(1029, value),
  [2962]: 'stencilFuncFront',
  [2967]: 'stencilFuncFront',
  [2963]: 'stencilFuncFront',
  [34816]: 'stencilFuncBack',
  [36003]: 'stencilFuncBack',
  [36004]: 'stencilFuncBack',
  [2964]: 'stencilOpFront',
  [2965]: 'stencilOpFront',
  [2966]: 'stencilOpFront',
  [34817]: 'stencilOpBack',
  [34818]: 'stencilOpBack',
  [34819]: 'stencilOpBack',
  [2978]: (gl, value) => gl.viewport(...value),
  [3333]: pixelStorei,
  [3317]: pixelStorei,
  [37440]: pixelStorei,
  [37441]: pixelStorei,
  [37443]: pixelStorei,
  [3330]: pixelStorei,
  [3332]: pixelStorei,
  [3331]: pixelStorei,
  [36010]: readFramebuffer,
  [3314]: pixelStorei,
  [32878]: pixelStorei,
  [3316]: pixelStorei,
  [3315]: pixelStorei,
  [32877]: pixelStorei,
  framebuffer: (gl, framebuffer) => {
    const handle = framebuffer && 'handle' in framebuffer ? framebuffer.handle : framebuffer;
    return gl.bindFramebuffer(36160, handle);
  },
  blend: (gl, value) => value ? gl.enable(3042) : gl.disable(3042),
  blendColor: (gl, value) => gl.blendColor(...value),
  blendEquation: (gl, args) => {
    args = isArray$1(args) ? args : [args, args];
    gl.blendEquationSeparate(...args);
  },
  blendFunc: (gl, args) => {
    args = isArray$1(args) && args.length === 2 ? [...args, ...args] : args;
    gl.blendFuncSeparate(...args);
  },
  clearColor: (gl, value) => gl.clearColor(...value),
  clearDepth: (gl, value) => gl.clearDepth(value),
  clearStencil: (gl, value) => gl.clearStencil(value),
  colorMask: (gl, value) => gl.colorMask(...value),
  cull: (gl, value) => value ? gl.enable(2884) : gl.disable(2884),
  cullFace: (gl, value) => gl.cullFace(value),
  depthTest: (gl, value) => value ? gl.enable(2929) : gl.disable(2929),
  depthFunc: (gl, value) => gl.depthFunc(value),
  depthMask: (gl, value) => gl.depthMask(value),
  depthRange: (gl, value) => gl.depthRange(...value),
  dither: (gl, value) => value ? gl.enable(3024) : gl.disable(3024),
  derivativeHint: (gl, value) => {
    gl.hint(35723, value);
  },
  frontFace: (gl, value) => gl.frontFace(value),
  mipmapHint: (gl, value) => gl.hint(33170, value),
  lineWidth: (gl, value) => gl.lineWidth(value),
  polygonOffsetFill: (gl, value) => value ? gl.enable(32823) : gl.disable(32823),
  polygonOffset: (gl, value) => gl.polygonOffset(...value),
  sampleCoverage: (gl, value) => gl.sampleCoverage(...value),
  scissorTest: (gl, value) => value ? gl.enable(3089) : gl.disable(3089),
  scissor: (gl, value) => gl.scissor(...value),
  stencilTest: (gl, value) => value ? gl.enable(2960) : gl.disable(2960),
  stencilMask: (gl, value) => {
    value = isArray$1(value) ? value : [value, value];
    const [mask, backMask] = value;
    gl.stencilMaskSeparate(1028, mask);
    gl.stencilMaskSeparate(1029, backMask);
  },
  stencilFunc: (gl, args) => {
    args = isArray$1(args) && args.length === 3 ? [...args, ...args] : args;
    const [func, ref, mask, backFunc, backRef, backMask] = args;
    gl.stencilFuncSeparate(1028, func, ref, mask);
    gl.stencilFuncSeparate(1029, backFunc, backRef, backMask);
  },
  stencilOp: (gl, args) => {
    args = isArray$1(args) && args.length === 3 ? [...args, ...args] : args;
    const [sfail, dpfail, dppass, backSfail, backDpfail, backDppass] = args;
    gl.stencilOpSeparate(1028, sfail, dpfail, dppass);
    gl.stencilOpSeparate(1029, backSfail, backDpfail, backDppass);
  },
  viewport: (gl, value) => gl.viewport(...value)
};

function getValue(glEnum, values, cache) {
  return values[glEnum] !== undefined ? values[glEnum] : cache[glEnum];
}

const GL_COMPOSITE_PARAMETER_SETTERS = {
  blendEquation: (gl, values, cache) => gl.blendEquationSeparate(getValue(32777, values, cache), getValue(34877, values, cache)),
  blendFunc: (gl, values, cache) => gl.blendFuncSeparate(getValue(32969, values, cache), getValue(32968, values, cache), getValue(32971, values, cache), getValue(32970, values, cache)),
  polygonOffset: (gl, values, cache) => gl.polygonOffset(getValue(32824, values, cache), getValue(10752, values, cache)),
  sampleCoverage: (gl, values, cache) => gl.sampleCoverage(getValue(32938, values, cache), getValue(32939, values, cache)),
  stencilFuncFront: (gl, values, cache) => gl.stencilFuncSeparate(1028, getValue(2962, values, cache), getValue(2967, values, cache), getValue(2963, values, cache)),
  stencilFuncBack: (gl, values, cache) => gl.stencilFuncSeparate(1029, getValue(34816, values, cache), getValue(36003, values, cache), getValue(36004, values, cache)),
  stencilOpFront: (gl, values, cache) => gl.stencilOpSeparate(1028, getValue(2964, values, cache), getValue(2965, values, cache), getValue(2966, values, cache)),
  stencilOpBack: (gl, values, cache) => gl.stencilOpSeparate(1029, getValue(34817, values, cache), getValue(34818, values, cache), getValue(34819, values, cache))
};
const GL_HOOKED_SETTERS = {
  enable: (update, capability) => update({
    [capability]: true
  }),
  disable: (update, capability) => update({
    [capability]: false
  }),
  pixelStorei: (update, pname, value) => update({
    [pname]: value
  }),
  hint: (update, pname, hint) => update({
    [pname]: hint
  }),
  bindFramebuffer: (update, target, framebuffer) => {
    switch (target) {
      case 36160:
        return update({
          [36006]: framebuffer,
          [36010]: framebuffer
        });

      case 36009:
        return update({
          [36006]: framebuffer
        });

      case 36008:
        return update({
          [36010]: framebuffer
        });

      default:
        return null;
    }
  },
  blendColor: (update, r, g, b, a) => update({
    [32773]: new Float32Array([r, g, b, a])
  }),
  blendEquation: (update, mode) => update({
    [32777]: mode,
    [34877]: mode
  }),
  blendEquationSeparate: (update, modeRGB, modeAlpha) => update({
    [32777]: modeRGB,
    [34877]: modeAlpha
  }),
  blendFunc: (update, src, dst) => update({
    [32969]: src,
    [32968]: dst,
    [32971]: src,
    [32970]: dst
  }),
  blendFuncSeparate: (update, srcRGB, dstRGB, srcAlpha, dstAlpha) => update({
    [32969]: srcRGB,
    [32968]: dstRGB,
    [32971]: srcAlpha,
    [32970]: dstAlpha
  }),
  clearColor: (update, r, g, b, a) => update({
    [3106]: new Float32Array([r, g, b, a])
  }),
  clearDepth: (update, depth) => update({
    [2931]: depth
  }),
  clearStencil: (update, s) => update({
    [2961]: s
  }),
  colorMask: (update, r, g, b, a) => update({
    [3107]: [r, g, b, a]
  }),
  cullFace: (update, mode) => update({
    [2885]: mode
  }),
  depthFunc: (update, func) => update({
    [2932]: func
  }),
  depthRange: (update, zNear, zFar) => update({
    [2928]: new Float32Array([zNear, zFar])
  }),
  depthMask: (update, mask) => update({
    [2930]: mask
  }),
  frontFace: (update, face) => update({
    [2886]: face
  }),
  lineWidth: (update, width) => update({
    [2849]: width
  }),
  polygonOffset: (update, factor, units) => update({
    [32824]: factor,
    [10752]: units
  }),
  sampleCoverage: (update, value, invert) => update({
    [32938]: value,
    [32939]: invert
  }),
  scissor: (update, x, y, width, height) => update({
    [3088]: new Int32Array([x, y, width, height])
  }),
  stencilMask: (update, mask) => update({
    [2968]: mask,
    [36005]: mask
  }),
  stencilMaskSeparate: (update, face, mask) => update({
    [face === 1028 ? 2968 : 36005]: mask
  }),
  stencilFunc: (update, func, ref, mask) => update({
    [2962]: func,
    [2967]: ref,
    [2963]: mask,
    [34816]: func,
    [36003]: ref,
    [36004]: mask
  }),
  stencilFuncSeparate: (update, face, func, ref, mask) => update({
    [face === 1028 ? 2962 : 34816]: func,
    [face === 1028 ? 2967 : 36003]: ref,
    [face === 1028 ? 2963 : 36004]: mask
  }),
  stencilOp: (update, fail, zfail, zpass) => update({
    [2964]: fail,
    [2965]: zfail,
    [2966]: zpass,
    [34817]: fail,
    [34818]: zfail,
    [34819]: zpass
  }),
  stencilOpSeparate: (update, face, fail, zfail, zpass) => update({
    [face === 1028 ? 2964 : 34817]: fail,
    [face === 1028 ? 2965 : 34818]: zfail,
    [face === 1028 ? 2966 : 34819]: zpass
  }),
  viewport: (update, x, y, width, height) => update({
    [2978]: [x, y, width, height]
  })
};

const isEnabled = (gl, key) => gl.isEnabled(key);

const GL_PARAMETER_GETTERS = {
  [3042]: isEnabled,
  [2884]: isEnabled,
  [2929]: isEnabled,
  [3024]: isEnabled,
  [32823]: isEnabled,
  [32926]: isEnabled,
  [32928]: isEnabled,
  [3089]: isEnabled,
  [2960]: isEnabled,
  [35977]: isEnabled
};

function isObjectEmpty$1(object) {
  for (const key in object) {
    return false;
  }

  return true;
}
function deepArrayEqual(x, y) {
  if (x === y) {
    return true;
  }

  const isArrayX = Array.isArray(x) || ArrayBuffer.isView(x);
  const isArrayY = Array.isArray(y) || ArrayBuffer.isView(y);

  if (isArrayX && isArrayY && x.length === y.length) {
    for (let i = 0; i < x.length; ++i) {
      if (x[i] !== y[i]) {
        return false;
      }
    }

    return true;
  }

  return false;
}

function installGetterOverride(gl, functionName) {
  const originalGetterFunc = gl[functionName].bind(gl);

  gl[functionName] = function get(...params) {
    const pname = params[0];

    if (!(pname in gl.state.cache)) {
      return originalGetterFunc(...params);
    }

    return gl.state.enable ? gl.state.cache[pname] : originalGetterFunc(...params);
  };

  Object.defineProperty(gl[functionName], 'name', {
    value: `${functionName}-from-cache`,
    configurable: false
  });
}

function installSetterSpy(gl, functionName, setter) {
  const originalSetterFunc = gl[functionName].bind(gl);

  gl[functionName] = function set(...params) {
    const {
      valueChanged,
      oldValue
    } = setter(gl.state._updateCache, ...params);

    if (valueChanged) {
      originalSetterFunc(...params);
    }

    return oldValue;
  };

  Object.defineProperty(gl[functionName], 'name', {
    value: `${functionName}-to-cache`,
    configurable: false
  });
}

function installProgramSpy(gl) {
  const originalUseProgram = gl.useProgram.bind(gl);

  gl.useProgram = function useProgramLuma(handle) {
    if (gl.state.program !== handle) {
      originalUseProgram(handle);
      gl.state.program = handle;
    }
  };
}

class GLState {
  constructor(gl, {
    copyState = false,
    log = () => {}
  } = {}) {
    this.gl = gl;
    this.program = null;
    this.stateStack = [];
    this.enable = true;
    this.cache = copyState ? getParameters(gl) : Object.assign({}, GL_PARAMETER_DEFAULTS);
    this.log = log;
    this._updateCache = this._updateCache.bind(this);
    Object.seal(this);
  }

  push(values = {}) {
    this.stateStack.push({});
  }

  pop() {
    assert$2(this.stateStack.length > 0);
    const oldValues = this.stateStack[this.stateStack.length - 1];
    setParameters(this.gl, oldValues);
    this.stateStack.pop();
  }

  _updateCache(values) {
    let valueChanged = false;
    let oldValue;
    const oldValues = this.stateStack.length > 0 && this.stateStack[this.stateStack.length - 1];

    for (const key in values) {
      assert$2(key !== undefined);
      const value = values[key];
      const cached = this.cache[key];

      if (!deepArrayEqual(value, cached)) {
        valueChanged = true;
        oldValue = cached;

        if (oldValues && !(key in oldValues)) {
          oldValues[key] = cached;
        }

        this.cache[key] = value;
      }
    }

    return {
      valueChanged,
      oldValue
    };
  }

}

function trackContextState(gl, options = {}) {
  const {
    enable = true,
    copyState
  } = options;
  assert$2(copyState !== undefined);

  if (!gl.state) {
    const global_ = typeof global !== 'undefined' ? global : window;
    const {
      polyfillContext
    } = global_;

    if (polyfillContext) {
      polyfillContext(gl);
    }

    gl.state = new GLState(gl, {
      copyState
    });
    installProgramSpy(gl);

    for (const key in GL_HOOKED_SETTERS) {
      const setter = GL_HOOKED_SETTERS[key];
      installSetterSpy(gl, key, setter);
    }

    installGetterOverride(gl, 'getParameter');
    installGetterOverride(gl, 'isEnabled');
  }

  gl.state.enable = enable;
  return gl;
}
function pushContextState(gl) {
  if (!gl.state) {
    trackContextState(gl, {
      copyState: false
    });
  }

  gl.state.push();
}
function popContextState(gl) {
  assert$2(gl.state);
  gl.state.pop();
}

function setParameters(gl, values) {
  assert$2(isWebGL(gl), 'setParameters requires a WebGL context');

  if (isObjectEmpty$1(values)) {
    return;
  }

  const compositeSetters = {};

  for (const key in values) {
    const glConstant = Number(key);
    const setter = GL_PARAMETER_SETTERS[key];

    if (setter) {
      if (typeof setter === 'string') {
        compositeSetters[setter] = true;
      } else {
        setter(gl, values[key], glConstant);
      }
    }
  }

  const cache = gl.state && gl.state.cache;

  if (cache) {
    for (const key in compositeSetters) {
      const compositeSetter = GL_COMPOSITE_PARAMETER_SETTERS[key];
      compositeSetter(gl, values, cache);
    }
  }
}
function getParameters(gl, parameters) {
  parameters = parameters || GL_PARAMETER_DEFAULTS;

  if (typeof parameters === 'number') {
    const key = parameters;
    const getter = GL_PARAMETER_GETTERS[key];
    return getter ? getter(gl, key) : gl.getParameter(key);
  }

  const parameterKeys = Array.isArray(parameters) ? parameters : Object.keys(parameters);
  const state = {};

  for (const key of parameterKeys) {
    const getter = GL_PARAMETER_GETTERS[key];
    state[key] = getter ? getter(gl, Number(key)) : gl.getParameter(Number(key));
  }

  return state;
}
function resetParameters(gl) {
  setParameters(gl, GL_PARAMETER_DEFAULTS);
}
function withParameters(gl, parameters, func) {
  if (isObjectEmpty$1(parameters)) {
    return func(gl);
  }

  const {
    nocatch = true
  } = parameters;
  pushContextState(gl);
  setParameters(gl, parameters);
  let value;

  if (nocatch) {
    value = func(gl);
    popContextState(gl);
  } else {
    try {
      value = func(gl);
    } finally {
      popContextState(gl);
    }
  }

  return value;
}

function cssToDeviceRatio(gl) {
  const {
    luma
  } = gl;

  if (gl.canvas && luma) {
    const {
      clientWidth
    } = luma.canvasSizeInfo;
    return clientWidth ? gl.drawingBufferWidth / clientWidth : 1;
  }

  return 1;
}
function cssToDevicePixels(gl, cssPixel, yInvert = true) {
  const ratio = cssToDeviceRatio(gl);
  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  return scalePixels$1(cssPixel, ratio, width, height, yInvert);
}
function getDevicePixelRatio(useDevicePixels) {
  const windowRatio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;

  if (Number.isFinite(useDevicePixels)) {
    return useDevicePixels <= 0 ? 1 : useDevicePixels;
  }

  return useDevicePixels ? windowRatio : 1;
}

function scalePixels$1(pixel, ratio, width, height, yInvert) {
  const x = scaleX(pixel[0], ratio, width);
  let y = scaleY(pixel[1], ratio, height, yInvert);
  let t = scaleX(pixel[0] + 1, ratio, width);
  const xHigh = t === width - 1 ? t : t - 1;
  t = scaleY(pixel[1] + 1, ratio, height, yInvert);
  let yHigh;

  if (yInvert) {
    t = t === 0 ? t : t + 1;
    yHigh = y;
    y = t;
  } else {
    yHigh = t === height - 1 ? t : t - 1;
  }

  return {
    x,
    y,
    width: Math.max(xHigh - x + 1, 1),
    height: Math.max(yHigh - y + 1, 1)
  };
}

function scaleX(x, ratio, width) {
  const r = Math.min(Math.round(x * ratio), width - 1);
  return r;
}

function scaleY(y, ratio, height, yInvert) {
  return yInvert ? Math.max(0, height - 1 - Math.round(y * ratio)) : Math.min(Math.round(y * ratio), height - 1);
}

const isBrowser = env.isBrowser();
const isPage = isBrowser && typeof document !== 'undefined';
const CONTEXT_DEFAULTS = {
  webgl2: true,
  webgl1: true,
  throwOnError: true,
  manageState: true,
  canvas: null,
  debug: false,
  width: 800,
  height: 600
};
function createGLContext(options = {}) {
  assert$2(isBrowser, "createGLContext only available in the browser.\nCreate your own headless context or use 'createHeadlessContext' from @luma.gl/test-utils");
  options = Object.assign({}, CONTEXT_DEFAULTS, options);
  const {
    width,
    height
  } = options;

  function onError(message) {
    if (options.throwOnError) {
      throw new Error(message);
    }

    console.error(message);
    return null;
  }

  options.onError = onError;
  let gl;
  const {
    canvas
  } = options;
  const targetCanvas = getCanvas({
    canvas,
    width,
    height,
    onError
  });
  gl = createBrowserContext(targetCanvas, options);

  if (!gl) {
    return null;
  }

  gl = instrumentGLContext(gl, options);
  logInfo(gl);
  return gl;
}
function instrumentGLContext(gl, options = {}) {
  if (!gl || gl._instrumented) {
    return gl;
  }

  gl._version = gl._version || getVersion(gl);
  gl.luma = gl.luma || {};
  gl.luma.canvasSizeInfo = gl.luma.canvasSizeInfo || {};
  options = Object.assign({}, CONTEXT_DEFAULTS, options);
  const {
    manageState,
    debug
  } = options;

  if (manageState) {
    trackContextState(gl, {
      copyState: false,
      log: (...args) => log$1.log(1, ...args)()
    });
  }

  if (isBrowser && debug) {
    if (!env.global.makeDebugContext) {
      log$1.warn('WebGL debug mode not activated. import "@luma.gl/debug" to enable.')();
    } else {
      gl = env.global.makeDebugContext(gl, options);
      log$1.level = Math.max(log$1.level, 1);
    }
  }

  gl._instrumented = true;
  return gl;
}
function getContextDebugInfo(gl) {
  const vendorMasked = gl.getParameter(7936);
  const rendererMasked = gl.getParameter(7937);
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const vendorUnmasked = ext && gl.getParameter(ext.UNMASKED_VENDOR_WEBGL || 7936);
  const rendererUnmasked = ext && gl.getParameter(ext.UNMASKED_RENDERER_WEBGL || 7937);
  return {
    vendor: vendorUnmasked || vendorMasked,
    renderer: rendererUnmasked || rendererMasked,
    vendorMasked,
    rendererMasked,
    version: gl.getParameter(7938),
    shadingLanguageVersion: gl.getParameter(35724)
  };
}
function resizeGLContext(gl, options = {}) {
  if (gl.canvas) {
    const devicePixelRatio = getDevicePixelRatio(options.useDevicePixels);
    setDevicePixelRatio(gl, devicePixelRatio, options);
    return;
  }

  const ext = gl.getExtension('STACKGL_resize_drawingbuffer');

  if (ext && `width` in options && `height` in options) {
    ext.resize(options.width, options.height);
  }
}

function createBrowserContext(canvas, options) {
  const {
    onError
  } = options;
  let errorMessage = null;

  const onCreateError = error => errorMessage = error.statusMessage || errorMessage;

  canvas.addEventListener('webglcontextcreationerror', onCreateError, false);
  const {
    webgl1 = true,
    webgl2 = true
  } = options;
  let gl = null;

  if (webgl2) {
    gl = gl || canvas.getContext('webgl2', options);
    gl = gl || canvas.getContext('experimental-webgl2', options);
  }

  if (webgl1) {
    gl = gl || canvas.getContext('webgl', options);
    gl = gl || canvas.getContext('experimental-webgl', options);
  }

  canvas.removeEventListener('webglcontextcreationerror', onCreateError, false);

  if (!gl) {
    return onError(`Failed to create ${webgl2 && !webgl1 ? 'WebGL2' : 'WebGL'} context: ${errorMessage || 'Unknown error'}`);
  }

  if (options.onContextLost) {
    canvas.addEventListener('webglcontextlost', options.onContextLost, false);
  }

  if (options.onContextRestored) {
    canvas.addEventListener('webglcontextrestored', options.onContextRestored, false);
  }

  return gl;
}

function getCanvas({
  canvas,
  width = 800,
  height = 600,
  onError
}) {
  let targetCanvas;

  if (typeof canvas === 'string') {
    const isPageLoaded = isPage && document.readyState === 'complete';

    if (!isPageLoaded) {
      onError(`createGLContext called on canvas '${canvas}' before page was loaded`);
    }

    targetCanvas = document.getElementById(canvas);
  } else if (canvas) {
    targetCanvas = canvas;
  } else {
    targetCanvas = document.createElement('canvas');
    targetCanvas.id = 'lumagl-canvas';
    targetCanvas.style.width = Number.isFinite(width) ? `${width}px` : '100%';
    targetCanvas.style.height = Number.isFinite(height) ? `${height}px` : '100%';
    document.body.insertBefore(targetCanvas, document.body.firstChild);
  }

  return targetCanvas;
}

function logInfo(gl) {
  const webGL = isWebGL2$1(gl) ? 'WebGL2' : 'WebGL1';
  const info = getContextDebugInfo(gl);
  const driver = info ? `(${info.vendor},${info.renderer})` : '';
  const debug = gl.debug ? ' debug' : '';
  log$1.info(1, `${webGL}${debug} context ${driver}`)();
}

function getVersion(gl) {
  if (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) {
    return 2;
  }

  return 1;
}

function setDevicePixelRatio(gl, devicePixelRatio, options) {
  let clientWidth = 'width' in options ? options.width : gl.canvas.clientWidth;
  let clientHeight = 'height' in options ? options.height : gl.canvas.clientHeight;

  if (!clientWidth || !clientHeight) {
    log$1.log(1, 'Canvas clientWidth/clientHeight is 0')();
    devicePixelRatio = 1;
    clientWidth = gl.canvas.width || 1;
    clientHeight = gl.canvas.height || 1;
  }

  gl.luma = gl.luma || {};
  gl.luma.canvasSizeInfo = gl.luma.canvasSizeInfo || {};
  const cachedSize = gl.luma.canvasSizeInfo;

  if (cachedSize.clientWidth !== clientWidth || cachedSize.clientHeight !== clientHeight || cachedSize.devicePixelRatio !== devicePixelRatio) {
    let clampedPixelRatio = devicePixelRatio;
    const canvasWidth = Math.floor(clientWidth * clampedPixelRatio);
    const canvasHeight = Math.floor(clientHeight * clampedPixelRatio);
    gl.canvas.width = canvasWidth;
    gl.canvas.height = canvasHeight;

    if (gl.drawingBufferWidth !== canvasWidth || gl.drawingBufferHeight !== canvasHeight) {
      log$1.warn(`Device pixel ratio clamped`)();
      clampedPixelRatio = Math.min(gl.drawingBufferWidth / clientWidth, gl.drawingBufferHeight / clientHeight);
      gl.canvas.width = Math.floor(clientWidth * clampedPixelRatio);
      gl.canvas.height = Math.floor(clientHeight * clampedPixelRatio);
    }

    Object.assign(gl.luma.canvasSizeInfo, {
      clientWidth,
      clientHeight,
      devicePixelRatio
    });
  }
}

const VERSION = "8.5.10" ;
const STARTUP_MESSAGE = 'set luma.log.level=1 (or higher) to trace rendering';

class StatsManager {
  constructor() {
    this.stats = new Map();
  }

  get(name) {
    if (!this.stats.has(name)) {
      this.stats.set(name, new Stats({
        id: name
      }));
    }

    return this.stats.get(name);
  }

}

const lumaStats = new StatsManager();

if (env.global.luma && env.global.luma.VERSION !== VERSION) {
  throw new Error(`luma.gl - multiple VERSIONs detected: ${env.global.luma.VERSION} vs ${VERSION}`);
}

if (!env.global.luma) {
  if (env.isBrowser()) {
    log$1.log(1, `luma.gl ${VERSION} - ${STARTUP_MESSAGE}`)();
  }

  env.global.luma = env.global.luma || {
    VERSION,
    version: VERSION,
    log: log$1,
    stats: lumaStats,
    globals: {
      modules: {},
      nodeIO: {}
    }
  };
}
env.global.luma;

function assert$1(condition, message) {
  if (!condition) {
    throw new Error(message || 'luma.gl: assertion failed.');
  }
}

function getKeyValue(gl, name) {
  if (typeof name !== 'string') {
    return name;
  }

  const number = Number(name);

  if (!isNaN(number)) {
    return number;
  }

  name = name.replace(/^.*\./, '');
  const value = gl[name];
  assert$1(value !== undefined, `Accessing undefined constant GL.${name}`);
  return value;
}
function getKey(gl, value) {
  value = Number(value);

  for (const key in gl) {
    if (gl[key] === value) {
      return `GL.${key}`;
    }
  }

  return String(value);
}

const uidCounters = {};
function uid(id = 'id') {
  uidCounters[id] = uidCounters[id] || 1;
  const count = uidCounters[id]++;
  return `${id}-${count}`;
}
function isPowerOfTwo(n) {
  assert$1(typeof n === 'number', 'Input must be a number');
  return n && (n & n - 1) === 0;
}
function isObjectEmpty(obj) {
  let isEmpty = true;

  for (const key in obj) {
    isEmpty = false;
    break;
  }

  return isEmpty;
}

function stubRemovedMethods(instance, className, version, methodNames) {
  const upgradeMessage = `See luma.gl ${version} Upgrade Guide at \
https://luma.gl/docs/upgrade-guide`;
  const prototype = Object.getPrototypeOf(instance);
  methodNames.forEach(methodName => {
    if (prototype.methodName) {
      return;
    }

    prototype[methodName] = () => {
      log$1.removed(`Calling removed method ${className}.${methodName}: `, upgradeMessage)();
      throw new Error(methodName);
    };
  });
}

const ERR_RESOURCE_METHOD_UNDEFINED = 'Resource subclass must define virtual methods';
class Resource {
  constructor(gl, opts = {}) {
    assertWebGLContext(gl);
    const {
      id,
      userData = {}
    } = opts;
    this.gl = gl;
    this.gl2 = gl;
    this.id = id || uid(this.constructor.name);
    this.userData = userData;
    this._bound = false;
    this._handle = opts.handle;

    if (this._handle === undefined) {
      this._handle = this._createHandle();
    }

    this.byteLength = 0;

    this._addStats();
  }

  toString() {
    return `${this.constructor.name}(${this.id})`;
  }

  get handle() {
    return this._handle;
  }

  delete({
    deleteChildren = false
  } = {}) {
    const children = this._handle && this._deleteHandle(this._handle);

    if (this._handle) {
      this._removeStats();
    }

    this._handle = null;

    if (children && deleteChildren) {
      children.filter(Boolean).forEach(child => child.delete());
    }

    return this;
  }

  bind(funcOrHandle = this.handle) {
    if (typeof funcOrHandle !== 'function') {
      this._bindHandle(funcOrHandle);

      return this;
    }

    let value;

    if (!this._bound) {
      this._bindHandle(this.handle);

      this._bound = true;
      value = funcOrHandle();
      this._bound = false;

      this._bindHandle(null);
    } else {
      value = funcOrHandle();
    }

    return value;
  }

  unbind() {
    this.bind(null);
  }

  getParameter(pname, opts = {}) {
    pname = getKeyValue(this.gl, pname);
    assert$1(pname);
    const parameters = this.constructor.PARAMETERS || {};
    const parameter = parameters[pname];

    if (parameter) {
      const isWebgl2 = isWebGL2$1(this.gl);
      const parameterAvailable = (!('webgl2' in parameter) || isWebgl2) && (!('extension' in parameter) || this.gl.getExtension(parameter.extension));

      if (!parameterAvailable) {
        const webgl1Default = parameter.webgl1;
        const webgl2Default = 'webgl2' in parameter ? parameter.webgl2 : parameter.webgl1;
        const defaultValue = isWebgl2 ? webgl2Default : webgl1Default;
        return defaultValue;
      }
    }

    return this._getParameter(pname, opts);
  }

  getParameters(options = {}) {
    const {
      parameters,
      keys
    } = options;
    const PARAMETERS = this.constructor.PARAMETERS || {};
    const isWebgl2 = isWebGL2$1(this.gl);
    const values = {};
    const parameterKeys = parameters || Object.keys(PARAMETERS);

    for (const pname of parameterKeys) {
      const parameter = PARAMETERS[pname];
      const parameterAvailable = parameter && (!('webgl2' in parameter) || isWebgl2) && (!('extension' in parameter) || this.gl.getExtension(parameter.extension));

      if (parameterAvailable) {
        const key = keys ? getKey(this.gl, pname) : pname;
        values[key] = this.getParameter(pname, options);

        if (keys && parameter.type === 'GLenum') {
          values[key] = getKey(this.gl, values[key]);
        }
      }
    }

    return values;
  }

  setParameter(pname, value) {
    pname = getKeyValue(this.gl, pname);
    assert$1(pname);
    const parameters = this.constructor.PARAMETERS || {};
    const parameter = parameters[pname];

    if (parameter) {
      const isWebgl2 = isWebGL2$1(this.gl);
      const parameterAvailable = (!('webgl2' in parameter) || isWebgl2) && (!('extension' in parameter) || this.gl.getExtension(parameter.extension));

      if (!parameterAvailable) {
        throw new Error('Parameter not available on this platform');
      }

      if (parameter.type === 'GLenum') {
        value = getKeyValue(value);
      }
    }

    this._setParameter(pname, value);

    return this;
  }

  setParameters(parameters) {
    for (const pname in parameters) {
      this.setParameter(pname, parameters[pname]);
    }

    return this;
  }

  stubRemovedMethods(className, version, methodNames) {
    return stubRemovedMethods(this, className, version, methodNames);
  }

  initialize(opts) {}

  _createHandle() {
    throw new Error(ERR_RESOURCE_METHOD_UNDEFINED);
  }

  _deleteHandle() {
    throw new Error(ERR_RESOURCE_METHOD_UNDEFINED);
  }

  _bindHandle(handle) {
    throw new Error(ERR_RESOURCE_METHOD_UNDEFINED);
  }

  _getOptsFromHandle() {
    throw new Error(ERR_RESOURCE_METHOD_UNDEFINED);
  }

  _getParameter(pname, opts) {
    throw new Error(ERR_RESOURCE_METHOD_UNDEFINED);
  }

  _setParameter(pname, value) {
    throw new Error(ERR_RESOURCE_METHOD_UNDEFINED);
  }

  _context() {
    this.gl.luma = this.gl.luma || {};
    return this.gl.luma;
  }

  _addStats() {
    const name = this.constructor.name;
    const stats = lumaStats.get('Resource Counts');
    stats.get('Resources Created').incrementCount();
    stats.get(`${name}s Created`).incrementCount();
    stats.get(`${name}s Active`).incrementCount();
  }

  _removeStats() {
    const name = this.constructor.name;
    const stats = lumaStats.get('Resource Counts');
    stats.get(`${name}s Active`).decrementCount();
  }

  _trackAllocatedMemory(bytes, name = this.constructor.name) {
    const stats = lumaStats.get('Memory Usage');
    stats.get('GPU Memory').addCount(bytes);
    stats.get(`${name} Memory`).addCount(bytes);
    this.byteLength = bytes;
  }

  _trackDeallocatedMemory(name = this.constructor.name) {
    const stats = lumaStats.get('Memory Usage');
    stats.get('GPU Memory').subtractCount(this.byteLength);
    stats.get(`${name} Memory`).subtractCount(this.byteLength);
    this.byteLength = 0;
  }

}

const ERR_TYPE_DEDUCTION = 'Failed to deduce GL constant from typed array';
function getGLTypeFromTypedArray(arrayOrType) {
  const type = ArrayBuffer.isView(arrayOrType) ? arrayOrType.constructor : arrayOrType;

  switch (type) {
    case Float32Array:
      return 5126;

    case Uint16Array:
      return 5123;

    case Uint32Array:
      return 5125;

    case Uint8Array:
      return 5121;

    case Uint8ClampedArray:
      return 5121;

    case Int8Array:
      return 5120;

    case Int16Array:
      return 5122;

    case Int32Array:
      return 5124;

    default:
      throw new Error(ERR_TYPE_DEDUCTION);
  }
}
function getTypedArrayFromGLType(glType, {
  clamped = true
} = {}) {
  switch (glType) {
    case 5126:
      return Float32Array;

    case 5123:
    case 33635:
    case 32819:
    case 32820:
      return Uint16Array;

    case 5125:
      return Uint32Array;

    case 5121:
      return clamped ? Uint8ClampedArray : Uint8Array;

    case 5120:
      return Int8Array;

    case 5122:
      return Int16Array;

    case 5124:
      return Int32Array;

    default:
      throw new Error('Failed to deduce typed array type from GL constant');
  }
}
function flipRows({
  data,
  width,
  height,
  bytesPerPixel = 4,
  temp
}) {
  const bytesPerRow = width * bytesPerPixel;
  temp = temp || new Uint8Array(bytesPerRow);

  for (let y = 0; y < height / 2; ++y) {
    const topOffset = y * bytesPerRow;
    const bottomOffset = (height - y - 1) * bytesPerRow;
    temp.set(data.subarray(topOffset, topOffset + bytesPerRow));
    data.copyWithin(topOffset, bottomOffset, bottomOffset + bytesPerRow);
    data.set(temp, bottomOffset);
  }
}
function scalePixels({
  data,
  width,
  height
}) {
  const newWidth = Math.round(width / 2);
  const newHeight = Math.round(height / 2);
  const newData = new Uint8Array(newWidth * newHeight * 4);

  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      for (let c = 0; c < 4; c++) {
        newData[(y * newWidth + x) * 4 + c] = data[(y * 2 * width + x * 2) * 4 + c];
      }
    }
  }

  return {
    data: newData,
    width: newWidth,
    height: newHeight
  };
}

function checkProps(className, props, propChecks) {
  const {
    removedProps = {},
    deprecatedProps = {},
    replacedProps = {}
  } = propChecks;

  for (const propName in removedProps) {
    if (propName in props) {
      const replacementProp = removedProps[propName];
      const replacement = replacementProp ? `${className}.${removedProps[propName]}` : 'N/A';
      log$1.removed(`${className}.${propName}`, replacement)();
    }
  }

  for (const propName in deprecatedProps) {
    if (propName in props) {
      const replacementProp = deprecatedProps[propName];
      log$1.deprecated(`${className}.${propName}`, `${className}.${replacementProp}`)();
    }
  }

  let newProps = null;

  for (const propName in replacedProps) {
    if (propName in props) {
      const replacementProp = replacedProps[propName];
      log$1.deprecated(`${className}.${propName}`, `${className}.${replacementProp}`)();
      newProps = newProps || Object.assign({}, props);
      newProps[replacementProp] = props[propName];
      delete newProps[propName];
    }
  }

  return newProps || props;
}

const DEFAULT_ACCESSOR_VALUES = {
  offset: 0,
  stride: 0,
  type: 5126,
  size: 1,
  divisor: 0,
  normalized: false,
  integer: false
};
const PROP_CHECKS = {
  deprecatedProps: {
    instanced: 'divisor',
    isInstanced: 'divisor'
  }
};
class Accessor {
  static getBytesPerElement(accessor) {
    const ArrayType = getTypedArrayFromGLType(accessor.type || 5126);
    return ArrayType.BYTES_PER_ELEMENT;
  }

  static getBytesPerVertex(accessor) {
    assert$1(accessor.size);
    const ArrayType = getTypedArrayFromGLType(accessor.type || 5126);
    return ArrayType.BYTES_PER_ELEMENT * accessor.size;
  }

  static resolve(...accessors) {
    return new Accessor(...[DEFAULT_ACCESSOR_VALUES, ...accessors]);
  }

  constructor(...accessors) {
    accessors.forEach(accessor => this._assign(accessor));
    Object.freeze(this);
  }

  toString() {
    return JSON.stringify(this);
  }

  get BYTES_PER_ELEMENT() {
    return Accessor.getBytesPerElement(this);
  }

  get BYTES_PER_VERTEX() {
    return Accessor.getBytesPerVertex(this);
  }

  _assign(props = {}) {
    props = checkProps('Accessor', props, PROP_CHECKS);

    if (props.type !== undefined) {
      this.type = props.type;

      if (props.type === 5124 || props.type === 5125) {
        this.integer = true;
      }
    }

    if (props.size !== undefined) {
      this.size = props.size;
    }

    if (props.offset !== undefined) {
      this.offset = props.offset;
    }

    if (props.stride !== undefined) {
      this.stride = props.stride;
    }

    if (props.normalized !== undefined) {
      this.normalized = props.normalized;
    }

    if (props.integer !== undefined) {
      this.integer = props.integer;
    }

    if (props.divisor !== undefined) {
      this.divisor = props.divisor;
    }

    if (props.buffer !== undefined) {
      this.buffer = props.buffer;
    }

    if (props.index !== undefined) {
      if (typeof props.index === 'boolean') {
        this.index = props.index ? 1 : 0;
      } else {
        this.index = props.index;
      }
    }

    if (props.instanced !== undefined) {
      this.divisor = props.instanced ? 1 : 0;
    }

    if (props.isInstanced !== undefined) {
      this.divisor = props.isInstanced ? 1 : 0;
    }

    return this;
  }

}

const DEBUG_DATA_LENGTH = 10;
const DEPRECATED_PROPS = {
  offset: 'accessor.offset',
  stride: 'accessor.stride',
  type: 'accessor.type',
  size: 'accessor.size',
  divisor: 'accessor.divisor',
  normalized: 'accessor.normalized',
  integer: 'accessor.integer',
  instanced: 'accessor.divisor',
  isInstanced: 'accessor.divisor'
};
const PROP_CHECKS_INITIALIZE = {
  removedProps: {},
  replacedProps: {
    bytes: 'byteLength'
  },
  deprecatedProps: DEPRECATED_PROPS
};
const PROP_CHECKS_SET_PROPS = {
  removedProps: DEPRECATED_PROPS
};
class Buffer extends Resource {
  constructor(gl, props = {}) {
    super(gl, props);
    this.stubRemovedMethods('Buffer', 'v6.0', ['layout', 'setLayout', 'getIndexedParameter']);
    this.target = props.target || (this.gl.webgl2 ? 36662 : 34962);
    this.initialize(props);
    Object.seal(this);
  }

  getElementCount(accessor = this.accessor) {
    return Math.round(this.byteLength / Accessor.getBytesPerElement(accessor));
  }

  getVertexCount(accessor = this.accessor) {
    return Math.round(this.byteLength / Accessor.getBytesPerVertex(accessor));
  }

  initialize(props = {}) {
    if (ArrayBuffer.isView(props)) {
      props = {
        data: props
      };
    }

    if (Number.isFinite(props)) {
      props = {
        byteLength: props
      };
    }

    props = checkProps('Buffer', props, PROP_CHECKS_INITIALIZE);
    this.usage = props.usage || 35044;
    this.debugData = null;
    this.setAccessor(Object.assign({}, props, props.accessor));

    if (props.data) {
      this._setData(props.data, props.offset, props.byteLength);
    } else {
      this._setByteLength(props.byteLength || 0);
    }

    return this;
  }

  setProps(props) {
    props = checkProps('Buffer', props, PROP_CHECKS_SET_PROPS);

    if ('accessor' in props) {
      this.setAccessor(props.accessor);
    }

    return this;
  }

  setAccessor(accessor) {
    accessor = Object.assign({}, accessor);
    delete accessor.buffer;
    this.accessor = new Accessor(accessor);
    return this;
  }

  reallocate(byteLength) {
    if (byteLength > this.byteLength) {
      this._setByteLength(byteLength);

      return true;
    }

    this.bytesUsed = byteLength;
    return false;
  }

  setData(props) {
    return this.initialize(props);
  }

  subData(props) {
    if (ArrayBuffer.isView(props)) {
      props = {
        data: props
      };
    }

    const {
      data,
      offset = 0,
      srcOffset = 0
    } = props;
    const byteLength = props.byteLength || props.length;
    assert$1(data);
    const target = this.gl.webgl2 ? 36663 : this.target;
    this.gl.bindBuffer(target, this.handle);

    if (srcOffset !== 0 || byteLength !== undefined) {
      assertWebGL2Context(this.gl);
      this.gl.bufferSubData(this.target, offset, data, srcOffset, byteLength);
    } else {
      this.gl.bufferSubData(target, offset, data);
    }

    this.gl.bindBuffer(target, null);
    this.debugData = null;

    this._inferType(data);

    return this;
  }

  copyData({
    sourceBuffer,
    readOffset = 0,
    writeOffset = 0,
    size
  }) {
    const {
      gl
    } = this;
    assertWebGL2Context(gl);
    gl.bindBuffer(36662, sourceBuffer.handle);
    gl.bindBuffer(36663, this.handle);
    gl.copyBufferSubData(36662, 36663, readOffset, writeOffset, size);
    gl.bindBuffer(36662, null);
    gl.bindBuffer(36663, null);
    this.debugData = null;
    return this;
  }

  getData({
    dstData = null,
    srcByteOffset = 0,
    dstOffset = 0,
    length = 0
  } = {}) {
    assertWebGL2Context(this.gl);
    const ArrayType = getTypedArrayFromGLType(this.accessor.type || 5126, {
      clamped: false
    });

    const sourceAvailableElementCount = this._getAvailableElementCount(srcByteOffset);

    const dstElementOffset = dstOffset;
    let dstAvailableElementCount;
    let dstElementCount;

    if (dstData) {
      dstElementCount = dstData.length;
      dstAvailableElementCount = dstElementCount - dstElementOffset;
    } else {
      dstAvailableElementCount = Math.min(sourceAvailableElementCount, length || sourceAvailableElementCount);
      dstElementCount = dstElementOffset + dstAvailableElementCount;
    }

    const copyElementCount = Math.min(sourceAvailableElementCount, dstAvailableElementCount);
    length = length || copyElementCount;
    assert$1(length <= copyElementCount);
    dstData = dstData || new ArrayType(dstElementCount);
    this.gl.bindBuffer(36662, this.handle);
    this.gl.getBufferSubData(36662, srcByteOffset, dstData, dstOffset, length);
    this.gl.bindBuffer(36662, null);
    return dstData;
  }

  bind({
    target = this.target,
    index = this.accessor && this.accessor.index,
    offset = 0,
    size
  } = {}) {
    if (target === 35345 || target === 35982) {
      if (size !== undefined) {
        this.gl.bindBufferRange(target, index, this.handle, offset, size);
      } else {
        assert$1(offset === 0);
        this.gl.bindBufferBase(target, index, this.handle);
      }
    } else {
      this.gl.bindBuffer(target, this.handle);
    }

    return this;
  }

  unbind({
    target = this.target,
    index = this.accessor && this.accessor.index
  } = {}) {
    const isIndexedBuffer = target === 35345 || target === 35982;

    if (isIndexedBuffer) {
      this.gl.bindBufferBase(target, index, null);
    } else {
      this.gl.bindBuffer(target, null);
    }

    return this;
  }

  getDebugData() {
    if (!this.debugData) {
      this.debugData = this.getData({
        length: Math.min(DEBUG_DATA_LENGTH, this.byteLength)
      });
      return {
        data: this.debugData,
        changed: true
      };
    }

    return {
      data: this.debugData,
      changed: false
    };
  }

  invalidateDebugData() {
    this.debugData = null;
  }

  _setData(data, offset = 0, byteLength = data.byteLength + offset) {
    assert$1(ArrayBuffer.isView(data));

    this._trackDeallocatedMemory();

    const target = this._getTarget();

    this.gl.bindBuffer(target, this.handle);
    this.gl.bufferData(target, byteLength, this.usage);
    this.gl.bufferSubData(target, offset, data);
    this.gl.bindBuffer(target, null);
    this.debugData = data.slice(0, DEBUG_DATA_LENGTH);
    this.bytesUsed = byteLength;

    this._trackAllocatedMemory(byteLength);

    const type = getGLTypeFromTypedArray(data);
    assert$1(type);
    this.setAccessor(new Accessor(this.accessor, {
      type
    }));
    return this;
  }

  _setByteLength(byteLength, usage = this.usage) {
    assert$1(byteLength >= 0);

    this._trackDeallocatedMemory();

    let data = byteLength;

    if (byteLength === 0) {
      data = new Float32Array(0);
    }

    const target = this._getTarget();

    this.gl.bindBuffer(target, this.handle);
    this.gl.bufferData(target, data, usage);
    this.gl.bindBuffer(target, null);
    this.usage = usage;
    this.debugData = null;
    this.bytesUsed = byteLength;

    this._trackAllocatedMemory(byteLength);

    return this;
  }

  _getTarget() {
    return this.gl.webgl2 ? 36663 : this.target;
  }

  _getAvailableElementCount(srcByteOffset) {
    const ArrayType = getTypedArrayFromGLType(this.accessor.type || 5126, {
      clamped: false
    });
    const sourceElementOffset = srcByteOffset / ArrayType.BYTES_PER_ELEMENT;
    return this.getElementCount() - sourceElementOffset;
  }

  _inferType(data) {
    if (!this.accessor.type) {
      this.setAccessor(new Accessor(this.accessor, {
        type: getGLTypeFromTypedArray(data)
      }));
    }
  }

  _createHandle() {
    return this.gl.createBuffer();
  }

  _deleteHandle() {
    this.gl.deleteBuffer(this.handle);

    this._trackDeallocatedMemory();
  }

  _getParameter(pname) {
    this.gl.bindBuffer(this.target, this.handle);
    const value = this.gl.getBufferParameter(this.target, pname);
    this.gl.bindBuffer(this.target, null);
    return value;
  }

  get type() {
    log$1.deprecated('Buffer.type', 'Buffer.accessor.type')();
    return this.accessor.type;
  }

  get bytes() {
    log$1.deprecated('Buffer.bytes', 'Buffer.byteLength')();
    return this.byteLength;
  }

  setByteLength(byteLength) {
    log$1.deprecated('setByteLength', 'reallocate')();
    return this.reallocate(byteLength);
  }

  updateAccessor(opts) {
    log$1.deprecated('updateAccessor(...)', 'setAccessor(new Accessor(buffer.accessor, ...)')();
    this.accessor = new Accessor(this.accessor, opts);
    return this;
  }

}

const TEXTURE_FORMATS = {
  [6407]: {
    dataFormat: 6407,
    types: [5121, 33635]
  },
  [6408]: {
    dataFormat: 6408,
    types: [5121, 32819, 32820]
  },
  [6406]: {
    dataFormat: 6406,
    types: [5121]
  },
  [6409]: {
    dataFormat: 6409,
    types: [5121]
  },
  [6410]: {
    dataFormat: 6410,
    types: [5121]
  },
  [33326]: {
    dataFormat: 6403,
    types: [5126],
    gl2: true
  },
  [33328]: {
    dataFormat: 33319,
    types: [5126],
    gl2: true
  },
  [34837]: {
    dataFormat: 6407,
    types: [5126],
    gl2: true
  },
  [34836]: {
    dataFormat: 6408,
    types: [5126],
    gl2: true
  }
};
const DATA_FORMAT_CHANNELS = {
  [6403]: 1,
  [36244]: 1,
  [33319]: 2,
  [33320]: 2,
  [6407]: 3,
  [36248]: 3,
  [6408]: 4,
  [36249]: 4,
  [6402]: 1,
  [34041]: 1,
  [6406]: 1,
  [6409]: 1,
  [6410]: 2
};
const TYPE_SIZES = {
  [5126]: 4,
  [5125]: 4,
  [5124]: 4,
  [5123]: 2,
  [5122]: 2,
  [5131]: 2,
  [5120]: 1,
  [5121]: 1
};
function isFormatSupported$1(gl, format) {
  const info = TEXTURE_FORMATS[format];

  if (!info) {
    return false;
  }

  if (info.gl1 === undefined && info.gl2 === undefined) {
    return true;
  }

  const value = isWebGL2$1(gl) ? info.gl2 || info.gl1 : info.gl1;
  return typeof value === 'string' ? gl.getExtension(value) : value;
}
function isLinearFilteringSupported(gl, format) {
  const info = TEXTURE_FORMATS[format];

  switch (info && info.types[0]) {
    case 5126:
      return gl.getExtension('OES_texture_float_linear');

    case 5131:
      return gl.getExtension('OES_texture_half_float_linear');

    default:
      return true;
  }
}

const NPOT_MIN_FILTERS = [9729, 9728];

const WebGLBuffer = env.global.WebGLBuffer || function WebGLBuffer() {};

class Texture extends Resource {
  static isSupported(gl, opts = {}) {
    const {
      format,
      linearFiltering
    } = opts;
    let supported = true;

    if (format) {
      supported = supported && isFormatSupported$1(gl, format);
      supported = supported && (!linearFiltering || isLinearFilteringSupported(gl, format));
    }

    return supported;
  }

  constructor(gl, props) {
    const {
      id = uid('texture'),
      handle,
      target
    } = props;
    super(gl, {
      id,
      handle
    });
    this.target = target;
    this.textureUnit = undefined;
    this.loaded = false;
    this.width = undefined;
    this.height = undefined;
    this.depth = undefined;
    this.format = undefined;
    this.type = undefined;
    this.dataFormat = undefined;
    this.border = undefined;
    this.textureUnit = undefined;
    this.mipmaps = undefined;
  }

  toString() {
    return `Texture(${this.id},${this.width}x${this.height})`;
  }

  initialize(props = {}) {
    let data = props.data;

    if (data instanceof Promise) {
      data.then(resolvedImageData => this.initialize(Object.assign({}, props, {
        pixels: resolvedImageData,
        data: resolvedImageData
      })));
      return this;
    }

    const isVideo = typeof HTMLVideoElement !== 'undefined' && data instanceof HTMLVideoElement;

    if (isVideo && data.readyState < HTMLVideoElement.HAVE_METADATA) {
      this._video = null;
      data.addEventListener('loadeddata', () => this.initialize(props));
      return this;
    }

    const {
      pixels = null,
      format = 6408,
      border = 0,
      recreate = false,
      parameters = {},
      pixelStore = {},
      textureUnit = undefined
    } = props;

    if (!data) {
      data = pixels;
    }

    let {
      width,
      height,
      dataFormat,
      type,
      compressed = false,
      mipmaps = true
    } = props;
    const {
      depth = 0
    } = props;
    ({
      width,
      height,
      compressed,
      dataFormat,
      type
    } = this._deduceParameters({
      format,
      type,
      dataFormat,
      compressed,
      data,
      width,
      height
    }));
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.format = format;
    this.type = type;
    this.dataFormat = dataFormat;
    this.border = border;
    this.textureUnit = textureUnit;

    if (Number.isFinite(this.textureUnit)) {
      this.gl.activeTexture(33984 + this.textureUnit);
      this.gl.bindTexture(this.target, this.handle);
    }

    if (mipmaps && this._isNPOT()) {
      log$1.warn(`texture: ${this} is Non-Power-Of-Two, disabling mipmaping`)();
      mipmaps = false;

      this._updateForNPOT(parameters);
    }

    this.mipmaps = mipmaps;
    this.setImageData({
      data,
      width,
      height,
      depth,
      format,
      type,
      dataFormat,
      border,
      mipmaps,
      parameters: pixelStore,
      compressed
    });

    if (mipmaps) {
      this.generateMipmap();
    }

    this.setParameters(parameters);

    if (recreate) {
      this.data = data;
    }

    if (isVideo) {
      this._video = {
        video: data,
        parameters,
        lastTime: data.readyState >= HTMLVideoElement.HAVE_CURRENT_DATA ? data.currentTime : -1
      };
    }

    return this;
  }

  update() {
    if (this._video) {
      const {
        video,
        parameters,
        lastTime
      } = this._video;

      if (lastTime === video.currentTime || video.readyState < HTMLVideoElement.HAVE_CURRENT_DATA) {
        return;
      }

      this.setSubImageData({
        data: video,
        parameters
      });

      if (this.mipmaps) {
        this.generateMipmap();
      }

      this._video.lastTime = video.currentTime;
    }
  }

  resize({
    height,
    width,
    mipmaps = false
  }) {
    if (width !== this.width || height !== this.height) {
      return this.initialize({
        width,
        height,
        format: this.format,
        type: this.type,
        dataFormat: this.dataFormat,
        border: this.border,
        mipmaps
      });
    }

    return this;
  }

  generateMipmap(params = {}) {
    if (this._isNPOT()) {
      log$1.warn(`texture: ${this} is Non-Power-Of-Two, disabling mipmaping`)();
      return this;
    }

    this.mipmaps = true;
    this.gl.bindTexture(this.target, this.handle);
    withParameters(this.gl, params, () => {
      this.gl.generateMipmap(this.target);
    });
    this.gl.bindTexture(this.target, null);
    return this;
  }

  setImageData(options) {
    this._trackDeallocatedMemory('Texture');

    const {
      target = this.target,
      pixels = null,
      level = 0,
      format = this.format,
      border = this.border,
      offset = 0,
      parameters = {}
    } = options;
    let {
      data = null,
      type = this.type,
      width = this.width,
      height = this.height,
      dataFormat = this.dataFormat,
      compressed = false
    } = options;

    if (!data) {
      data = pixels;
    }

    ({
      type,
      dataFormat,
      compressed,
      width,
      height
    } = this._deduceParameters({
      format,
      type,
      dataFormat,
      compressed,
      data,
      width,
      height
    }));
    const {
      gl
    } = this;
    gl.bindTexture(this.target, this.handle);
    let dataType = null;
    ({
      data,
      dataType
    } = this._getDataType({
      data,
      compressed
    }));
    let gl2;
    withParameters(this.gl, parameters, () => {
      switch (dataType) {
        case 'null':
          gl.texImage2D(target, level, format, width, height, border, dataFormat, type, data);
          break;

        case 'typed-array':
          gl.texImage2D(target, level, format, width, height, border, dataFormat, type, data, offset);
          break;

        case 'buffer':
          gl2 = assertWebGL2Context(gl);
          gl2.bindBuffer(35052, data.handle || data);
          gl2.texImage2D(target, level, format, width, height, border, dataFormat, type, offset);
          gl2.bindBuffer(35052, null);
          break;

        case 'browser-object':
          if (isWebGL2$1(gl)) {
            gl.texImage2D(target, level, format, width, height, border, dataFormat, type, data);
          } else {
            gl.texImage2D(target, level, format, dataFormat, type, data);
          }

          break;

        case 'compressed':
          for (const [levelIndex, levelData] of data.entries()) {
            gl.compressedTexImage2D(target, levelIndex, levelData.format, levelData.width, levelData.height, border, levelData.data);
          }

          break;

        default:
          assert$1(false, 'Unknown image data type');
      }
    });

    if (data && data.byteLength) {
      this._trackAllocatedMemory(data.byteLength, 'Texture');
    } else {
      const channels = DATA_FORMAT_CHANNELS[this.dataFormat] || 4;
      const channelSize = TYPE_SIZES[this.type] || 1;

      this._trackAllocatedMemory(this.width * this.height * channels * channelSize, 'Texture');
    }

    this.loaded = true;
    return this;
  }

  setSubImageData({
    target = this.target,
    pixels = null,
    data = null,
    x = 0,
    y = 0,
    width = this.width,
    height = this.height,
    level = 0,
    format = this.format,
    type = this.type,
    dataFormat = this.dataFormat,
    compressed = false,
    offset = 0,
    border = this.border,
    parameters = {}
  }) {
    ({
      type,
      dataFormat,
      compressed,
      width,
      height
    } = this._deduceParameters({
      format,
      type,
      dataFormat,
      compressed,
      data,
      width,
      height
    }));
    assert$1(this.depth === 0, 'texSubImage not supported for 3D textures');

    if (!data) {
      data = pixels;
    }

    if (data && data.data) {
      const ndarray = data;
      data = ndarray.data;
      width = ndarray.shape[0];
      height = ndarray.shape[1];
    }

    if (data instanceof Buffer) {
      data = data.handle;
    }

    this.gl.bindTexture(this.target, this.handle);
    withParameters(this.gl, parameters, () => {
      if (compressed) {
        this.gl.compressedTexSubImage2D(target, level, x, y, width, height, format, data);
      } else if (data === null) {
        this.gl.texSubImage2D(target, level, x, y, width, height, dataFormat, type, null);
      } else if (ArrayBuffer.isView(data)) {
        this.gl.texSubImage2D(target, level, x, y, width, height, dataFormat, type, data, offset);
      } else if (data instanceof WebGLBuffer) {
        const gl2 = assertWebGL2Context(this.gl);
        gl2.bindBuffer(35052, data);
        gl2.texSubImage2D(target, level, x, y, width, height, dataFormat, type, offset);
        gl2.bindBuffer(35052, null);
      } else if (isWebGL2$1(this.gl)) {
        const gl2 = assertWebGL2Context(this.gl);
        gl2.texSubImage2D(target, level, x, y, width, height, dataFormat, type, data);
      } else {
        this.gl.texSubImage2D(target, level, x, y, dataFormat, type, data);
      }
    });
    this.gl.bindTexture(this.target, null);
  }

  copyFramebuffer(opts = {}) {
    log$1.error('Texture.copyFramebuffer({...}) is no logner supported, use copyToTexture(source, target, opts})')();
    return null;
  }

  getActiveUnit() {
    return this.gl.getParameter(34016) - 33984;
  }

  bind(textureUnit = this.textureUnit) {
    const {
      gl
    } = this;

    if (textureUnit !== undefined) {
      this.textureUnit = textureUnit;
      gl.activeTexture(33984 + textureUnit);
    }

    gl.bindTexture(this.target, this.handle);
    return textureUnit;
  }

  unbind(textureUnit = this.textureUnit) {
    const {
      gl
    } = this;

    if (textureUnit !== undefined) {
      this.textureUnit = textureUnit;
      gl.activeTexture(33984 + textureUnit);
    }

    gl.bindTexture(this.target, null);
    return textureUnit;
  }

  _getDataType({
    data,
    compressed = false
  }) {
    if (compressed) {
      return {
        data,
        dataType: 'compressed'
      };
    }

    if (data === null) {
      return {
        data,
        dataType: 'null'
      };
    }

    if (ArrayBuffer.isView(data)) {
      return {
        data,
        dataType: 'typed-array'
      };
    }

    if (data instanceof Buffer) {
      return {
        data: data.handle,
        dataType: 'buffer'
      };
    }

    if (data instanceof WebGLBuffer) {
      return {
        data,
        dataType: 'buffer'
      };
    }

    return {
      data,
      dataType: 'browser-object'
    };
  }

  _deduceParameters(opts) {
    const {
      format,
      data
    } = opts;
    let {
      width,
      height,
      dataFormat,
      type,
      compressed
    } = opts;
    const textureFormat = TEXTURE_FORMATS[format];
    dataFormat = dataFormat || textureFormat && textureFormat.dataFormat;
    type = type || textureFormat && textureFormat.types[0];
    compressed = compressed || textureFormat && textureFormat.compressed;
    ({
      width,
      height
    } = this._deduceImageSize(data, width, height));
    return {
      dataFormat,
      type,
      compressed,
      width,
      height,
      format,
      data
    };
  }

  _deduceImageSize(data, width, height) {
    let size;

    if (typeof ImageData !== 'undefined' && data instanceof ImageData) {
      size = {
        width: data.width,
        height: data.height
      };
    } else if (typeof HTMLImageElement !== 'undefined' && data instanceof HTMLImageElement) {
      size = {
        width: data.naturalWidth,
        height: data.naturalHeight
      };
    } else if (typeof HTMLCanvasElement !== 'undefined' && data instanceof HTMLCanvasElement) {
      size = {
        width: data.width,
        height: data.height
      };
    } else if (typeof ImageBitmap !== 'undefined' && data instanceof ImageBitmap) {
      size = {
        width: data.width,
        height: data.height
      };
    } else if (typeof HTMLVideoElement !== 'undefined' && data instanceof HTMLVideoElement) {
      size = {
        width: data.videoWidth,
        height: data.videoHeight
      };
    } else if (!data) {
      size = {
        width: width >= 0 ? width : 1,
        height: height >= 0 ? height : 1
      };
    } else {
      size = {
        width,
        height
      };
    }

    assert$1(size, 'Could not deduced texture size');
    assert$1(width === undefined || size.width === width, 'Deduced texture width does not match supplied width');
    assert$1(height === undefined || size.height === height, 'Deduced texture height does not match supplied height');
    return size;
  }

  _createHandle() {
    return this.gl.createTexture();
  }

  _deleteHandle() {
    this.gl.deleteTexture(this.handle);

    this._trackDeallocatedMemory('Texture');
  }

  _getParameter(pname) {
    switch (pname) {
      case 4096:
        return this.width;

      case 4097:
        return this.height;

      default:
        this.gl.bindTexture(this.target, this.handle);
        const value = this.gl.getTexParameter(this.target, pname);
        this.gl.bindTexture(this.target, null);
        return value;
    }
  }

  _setParameter(pname, param) {
    this.gl.bindTexture(this.target, this.handle);
    param = this._getNPOTParam(pname, param);

    switch (pname) {
      case 33082:
      case 33083:
        this.gl.texParameterf(this.handle, pname, param);
        break;

      case 4096:
      case 4097:
        assert$1(false);
        break;

      default:
        this.gl.texParameteri(this.target, pname, param);
        break;
    }

    this.gl.bindTexture(this.target, null);
    return this;
  }

  _isNPOT() {
    if (isWebGL2$1(this.gl)) {
      return false;
    }

    if (!this.width || !this.height) {
      return false;
    }

    return !isPowerOfTwo(this.width) || !isPowerOfTwo(this.height);
  }

  _updateForNPOT(parameters) {
    if (parameters[this.gl.TEXTURE_MIN_FILTER] === undefined) {
      parameters[this.gl.TEXTURE_MIN_FILTER] = this.gl.LINEAR;
    }

    if (parameters[this.gl.TEXTURE_WRAP_S] === undefined) {
      parameters[this.gl.TEXTURE_WRAP_S] = this.gl.CLAMP_TO_EDGE;
    }

    if (parameters[this.gl.TEXTURE_WRAP_T] === undefined) {
      parameters[this.gl.TEXTURE_WRAP_T] = this.gl.CLAMP_TO_EDGE;
    }
  }

  _getNPOTParam(pname, param) {
    if (this._isNPOT()) {
      switch (pname) {
        case 10241:
          if (NPOT_MIN_FILTERS.indexOf(param) === -1) {
            param = 9729;
          }

          break;

        case 10242:
        case 10243:
          if (param !== 33071) {
            param = 33071;
          }

          break;
      }
    }

    return param;
  }

}

let pathPrefix = '';
function loadImage(url, opts) {
  assert$1(typeof url === 'string');
  url = pathPrefix + url;
  return new Promise((resolve, reject) => {
    try {
      const image = new Image();

      image.onload = () => resolve(image);

      image.onerror = () => reject(new Error(`Could not load image ${url}.`));

      image.crossOrigin = opts && opts.crossOrigin || 'anonymous';
      image.src = url;
    } catch (error) {
      reject(error);
    }
  });
}

class Texture2D extends Texture {
  static isSupported(gl, opts) {
    return Texture.isSupported(gl, opts);
  }

  constructor(gl, props = {}) {
    assertWebGLContext(gl);

    if (props instanceof Promise || typeof props === 'string') {
      props = {
        data: props
      };
    }

    if (typeof props.data === 'string') {
      props = Object.assign({}, props, {
        data: loadImage(props.data)
      });
    }

    super(gl, Object.assign({}, props, {
      target: 3553
    }));
    this.initialize(props);
    Object.seal(this);
  }

}

const FACES = [34069, 34070, 34071, 34072, 34073, 34074];
class TextureCube extends Texture {
  constructor(gl, props = {}) {
    assertWebGLContext(gl);
    super(gl, Object.assign({}, props, {
      target: 34067
    }));
    this.initialize(props);
    Object.seal(this);
  }

  initialize(props = {}) {
    const {
      mipmaps = true,
      parameters = {}
    } = props;
    this.opts = props;
    this.setCubeMapImageData(props).then(() => {
      this.loaded = true;

      if (mipmaps) {
        this.generateMipmap(props);
      }

      this.setParameters(parameters);
    });
    return this;
  }

  subImage({
    face,
    data,
    x = 0,
    y = 0,
    mipmapLevel = 0
  }) {
    return this._subImage({
      target: face,
      data,
      x,
      y,
      mipmapLevel
    });
  }

  async setCubeMapImageData({
    width,
    height,
    pixels,
    data,
    border = 0,
    format = 6408,
    type = 5121
  }) {
    const {
      gl
    } = this;
    const imageDataMap = pixels || data;
    const resolvedFaces = await Promise.all(FACES.map(face => {
      const facePixels = imageDataMap[face];
      return Promise.all(Array.isArray(facePixels) ? facePixels : [facePixels]);
    }));
    this.bind();
    FACES.forEach((face, index) => {
      if (resolvedFaces[index].length > 1 && this.opts.mipmaps !== false) {
        log$1.warn(`${this.id} has mipmap and multiple LODs.`)();
      }

      resolvedFaces[index].forEach((image, lodLevel) => {
        if (width && height) {
          gl.texImage2D(face, lodLevel, format, width, height, border, format, type, image);
        } else {
          gl.texImage2D(face, lodLevel, format, format, type, image);
        }
      });
    });
    this.unbind();
  }

  setImageDataForFace(options) {
    const {
      face,
      width,
      height,
      pixels,
      data,
      border = 0,
      format = 6408,
      type = 5121
    } = options;
    const {
      gl
    } = this;
    const imageData = pixels || data;
    this.bind();

    if (imageData instanceof Promise) {
      imageData.then(resolvedImageData => this.setImageDataForFace(Object.assign({}, options, {
        face,
        data: resolvedImageData,
        pixels: resolvedImageData
      })));
    } else if (this.width || this.height) {
      gl.texImage2D(face, 0, format, width, height, border, format, type, imageData);
    } else {
      gl.texImage2D(face, 0, format, format, type, imageData);
    }

    return this;
  }

}
TextureCube.FACES = FACES;

class Texture3D extends Texture {
  static isSupported(gl) {
    return isWebGL2$1(gl);
  }

  constructor(gl, props = {}) {
    assertWebGL2Context(gl);
    props = Object.assign({
      depth: 1
    }, props, {
      target: 32879,
      unpackFlipY: false
    });
    super(gl, props);
    this.initialize(props);
    Object.seal(this);
  }

  setImageData({
    level = 0,
    dataFormat = 6408,
    width,
    height,
    depth = 1,
    border = 0,
    format,
    type = 5121,
    offset = 0,
    data,
    parameters = {}
  }) {
    this._trackDeallocatedMemory('Texture');

    this.gl.bindTexture(this.target, this.handle);
    withParameters(this.gl, parameters, () => {
      if (ArrayBuffer.isView(data)) {
        this.gl.texImage3D(this.target, level, dataFormat, width, height, depth, border, format, type, data);
      }

      if (data instanceof Buffer) {
        this.gl.bindBuffer(35052, data.handle);
        this.gl.texImage3D(this.target, level, dataFormat, width, height, depth, border, format, type, offset);
      }
    });

    if (data && data.byteLength) {
      this._trackAllocatedMemory(data.byteLength, 'Texture');
    } else {
      const channels = DATA_FORMAT_CHANNELS[this.dataFormat] || 4;
      const channelSize = TYPE_SIZES[this.type] || 1;

      this._trackAllocatedMemory(this.width * this.height * this.depth * channels * channelSize, 'Texture');
    }

    this.loaded = true;
    return this;
  }

}

const EXT_FLOAT_WEBGL2 = 'EXT_color_buffer_float';
var RENDERBUFFER_FORMATS = {
  [33189]: {
    bpp: 2
  },
  [33190]: {
    gl2: true,
    bpp: 3
  },
  [36012]: {
    gl2: true,
    bpp: 4
  },
  [36168]: {
    bpp: 1
  },
  [34041]: {
    bpp: 4
  },
  [35056]: {
    gl2: true,
    bpp: 4
  },
  [36013]: {
    gl2: true,
    bpp: 5
  },
  [32854]: {
    bpp: 2
  },
  [36194]: {
    bpp: 2
  },
  [32855]: {
    bpp: 2
  },
  [33321]: {
    gl2: true,
    bpp: 1
  },
  [33330]: {
    gl2: true,
    bpp: 1
  },
  [33329]: {
    gl2: true,
    bpp: 1
  },
  [33332]: {
    gl2: true,
    bpp: 2
  },
  [33331]: {
    gl2: true,
    bpp: 2
  },
  [33334]: {
    gl2: true,
    bpp: 4
  },
  [33333]: {
    gl2: true,
    bpp: 4
  },
  [33323]: {
    gl2: true,
    bpp: 2
  },
  [33336]: {
    gl2: true,
    bpp: 2
  },
  [33335]: {
    gl2: true,
    bpp: 2
  },
  [33338]: {
    gl2: true,
    bpp: 4
  },
  [33337]: {
    gl2: true,
    bpp: 4
  },
  [33340]: {
    gl2: true,
    bpp: 8
  },
  [33339]: {
    gl2: true,
    bpp: 8
  },
  [32849]: {
    gl2: true,
    bpp: 3
  },
  [32856]: {
    gl2: true,
    bpp: 4
  },
  [32857]: {
    gl2: true,
    bpp: 4
  },
  [36220]: {
    gl2: true,
    bpp: 4
  },
  [36238]: {
    gl2: true,
    bpp: 4
  },
  [36975]: {
    gl2: true,
    bpp: 4
  },
  [36214]: {
    gl2: true,
    bpp: 8
  },
  [36232]: {
    gl2: true,
    bpp: 8
  },
  [36226]: {
    gl2: true,
    bpp: 16
  },
  [36208]: {
    gl2: true,
    bpp: 16
  },
  [33325]: {
    gl2: EXT_FLOAT_WEBGL2,
    bpp: 2
  },
  [33327]: {
    gl2: EXT_FLOAT_WEBGL2,
    bpp: 4
  },
  [34842]: {
    gl2: EXT_FLOAT_WEBGL2,
    bpp: 8
  },
  [33326]: {
    gl2: EXT_FLOAT_WEBGL2,
    bpp: 4
  },
  [33328]: {
    gl2: EXT_FLOAT_WEBGL2,
    bpp: 8
  },
  [34836]: {
    gl2: EXT_FLOAT_WEBGL2,
    bpp: 16
  },
  [35898]: {
    gl2: EXT_FLOAT_WEBGL2,
    bpp: 4
  }
};

function isFormatSupported(gl, format, formats) {
  const info = formats[format];

  if (!info) {
    return false;
  }

  const value = isWebGL2$1(gl) ? info.gl2 || info.gl1 : info.gl1;

  if (typeof value === 'string') {
    return gl.getExtension(value);
  }

  return value;
}

class Renderbuffer extends Resource {
  static isSupported(gl, {
    format
  } = {
    format: null
  }) {
    return !format || isFormatSupported(gl, format, RENDERBUFFER_FORMATS);
  }

  static getSamplesForFormat(gl, {
    format
  }) {
    return gl.getInternalformatParameter(36161, format, 32937);
  }

  constructor(gl, opts = {}) {
    super(gl, opts);
    this.initialize(opts);
    Object.seal(this);
  }

  initialize({
    format,
    width = 1,
    height = 1,
    samples = 0
  }) {
    assert$1(format, 'Needs format');

    this._trackDeallocatedMemory();

    this.gl.bindRenderbuffer(36161, this.handle);

    if (samples !== 0 && isWebGL2$1(this.gl)) {
      this.gl.renderbufferStorageMultisample(36161, samples, format, width, height);
    } else {
      this.gl.renderbufferStorage(36161, format, width, height);
    }

    this.format = format;
    this.width = width;
    this.height = height;
    this.samples = samples;

    this._trackAllocatedMemory(this.width * this.height * (this.samples || 1) * RENDERBUFFER_FORMATS[this.format].bpp);

    return this;
  }

  resize({
    width,
    height
  }) {
    if (width !== this.width || height !== this.height) {
      return this.initialize({
        width,
        height,
        format: this.format,
        samples: this.samples
      });
    }

    return this;
  }

  _createHandle() {
    return this.gl.createRenderbuffer();
  }

  _deleteHandle() {
    this.gl.deleteRenderbuffer(this.handle);

    this._trackDeallocatedMemory();
  }

  _bindHandle(handle) {
    this.gl.bindRenderbuffer(36161, handle);
  }

  _syncHandle(handle) {
    this.format = this.getParameter(36164);
    this.width = this.getParameter(36162);
    this.height = this.getParameter(36163);
    this.samples = this.getParameter(36011);
  }

  _getParameter(pname) {
    this.gl.bindRenderbuffer(36161, this.handle);
    const value = this.gl.getRenderbufferParameter(36161, pname);
    return value;
  }

}

const GL_DEPTH_BUFFER_BIT = 0x00000100;
const GL_STENCIL_BUFFER_BIT = 0x00000400;
const GL_COLOR_BUFFER_BIT = 0x00004000;
const GL_COLOR = 0x1800;
const GL_DEPTH = 0x1801;
const GL_STENCIL = 0x1802;
const GL_DEPTH_STENCIL = 0x84f9;
const ERR_ARGUMENTS = 'clear: bad arguments';
function clear(gl, {
  framebuffer = null,
  color = null,
  depth = null,
  stencil = null
} = {}) {
  const parameters = {};

  if (framebuffer) {
    parameters.framebuffer = framebuffer;
  }

  let clearFlags = 0;

  if (color) {
    clearFlags |= GL_COLOR_BUFFER_BIT;

    if (color !== true) {
      parameters.clearColor = color;
    }
  }

  if (depth) {
    clearFlags |= GL_DEPTH_BUFFER_BIT;

    if (depth !== true) {
      parameters.clearDepth = depth;
    }
  }

  if (stencil) {
    clearFlags |= GL_STENCIL_BUFFER_BIT;

    if (depth !== true) {
      parameters.clearStencil = depth;
    }
  }

  assert$1(clearFlags !== 0, ERR_ARGUMENTS);
  withParameters(gl, parameters, () => {
    gl.clear(clearFlags);
  });
}
function clearBuffer(gl, {
  framebuffer = null,
  buffer = GL_COLOR,
  drawBuffer = 0,
  value = [0, 0, 0, 0]
} = {}) {
  assertWebGL2Context(gl);
  withParameters(gl, {
    framebuffer
  }, () => {
    switch (buffer) {
      case GL_COLOR:
        switch (value.constructor) {
          case Int32Array:
            gl.clearBufferiv(buffer, drawBuffer, value);
            break;

          case Uint32Array:
            gl.clearBufferuiv(buffer, drawBuffer, value);
            break;

          case Float32Array:
          default:
            gl.clearBufferfv(buffer, drawBuffer, value);
        }

        break;

      case GL_DEPTH:
        gl.clearBufferfv(GL_DEPTH, 0, [value]);
        break;

      case GL_STENCIL:
        gl.clearBufferiv(GL_STENCIL, 0, [value]);
        break;

      case GL_DEPTH_STENCIL:
        const [depth, stencil] = value;
        gl.clearBufferfi(GL_DEPTH_STENCIL, 0, depth, stencil);
        break;

      default:
        assert$1(false, ERR_ARGUMENTS);
    }
  });
}

function glFormatToComponents(format) {
  switch (format) {
    case 6406:
    case 33326:
    case 6403:
      return 1;

    case 33328:
    case 33319:
      return 2;

    case 6407:
    case 34837:
      return 3;

    case 6408:
    case 34836:
      return 4;

    default:
      assert$1(false);
      return 0;
  }
}

function readPixelsToArray(source, options = {}) {
  const {
    sourceX = 0,
    sourceY = 0,
    sourceFormat = 6408
  } = options;
  let {
    sourceAttachment = 36064,
    target = null,
    sourceWidth,
    sourceHeight,
    sourceType
  } = options;
  const {
    framebuffer,
    deleteFramebuffer
  } = getFramebuffer$1(source);
  assert$1(framebuffer);
  const {
    gl,
    handle,
    attachments
  } = framebuffer;
  sourceWidth = sourceWidth || framebuffer.width;
  sourceHeight = sourceHeight || framebuffer.height;

  if (sourceAttachment === 36064 && handle === null) {
    sourceAttachment = 1028;
  }

  assert$1(attachments[sourceAttachment]);
  sourceType = sourceType || attachments[sourceAttachment].type;
  target = getPixelArray(target, sourceType, sourceFormat, sourceWidth, sourceHeight);
  sourceType = sourceType || getGLTypeFromTypedArray(target);
  const prevHandle = gl.bindFramebuffer(36160, handle);
  gl.readPixels(sourceX, sourceY, sourceWidth, sourceHeight, sourceFormat, sourceType, target);
  gl.bindFramebuffer(36160, prevHandle || null);

  if (deleteFramebuffer) {
    framebuffer.delete();
  }

  return target;
}
function copyToDataUrl(source, {
  sourceAttachment = 36064,
  targetMaxHeight = Number.MAX_SAFE_INTEGER
} = {}) {
  let data = readPixelsToArray(source, {
    sourceAttachment
  });
  let {
    width,
    height
  } = source;

  while (height > targetMaxHeight) {
    ({
      data,
      width,
      height
    } = scalePixels({
      data,
      width,
      height
    }));
  }

  flipRows({
    data,
    width,
    height
  });
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  const imageData = context.createImageData(width, height);
  imageData.data.set(data);
  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}
function copyToTexture(source, target, options = {}) {
  const {
    sourceX = 0,
    sourceY = 0,
    targetMipmaplevel = 0,
    targetInternalFormat = 6408
  } = options;
  let {
    targetX,
    targetY,
    targetZ,
    width,
    height
  } = options;
  const {
    framebuffer,
    deleteFramebuffer
  } = getFramebuffer$1(source);
  assert$1(framebuffer);
  const {
    gl,
    handle
  } = framebuffer;
  const isSubCopy = typeof targetX !== 'undefined' || typeof targetY !== 'undefined' || typeof targetZ !== 'undefined';
  targetX = targetX || 0;
  targetY = targetY || 0;
  targetZ = targetZ || 0;
  const prevHandle = gl.bindFramebuffer(36160, handle);
  assert$1(target);
  let texture = null;

  if (target instanceof Texture) {
    texture = target;
    width = Number.isFinite(width) ? width : texture.width;
    height = Number.isFinite(height) ? height : texture.height;
    texture.bind(0);
    target = texture.target;
  }

  if (!isSubCopy) {
    gl.copyTexImage2D(target, targetMipmaplevel, targetInternalFormat, sourceX, sourceY, width, height, 0);
  } else {
    switch (target) {
      case 3553:
      case 34067:
        gl.copyTexSubImage2D(target, targetMipmaplevel, targetX, targetY, sourceX, sourceY, width, height);
        break;

      case 35866:
      case 32879:
        const gl2 = assertWebGL2Context(gl);
        gl2.copyTexSubImage3D(target, targetMipmaplevel, targetX, targetY, targetZ, sourceX, sourceY, width, height);
        break;
    }
  }

  if (texture) {
    texture.unbind();
  }

  gl.bindFramebuffer(36160, prevHandle || null);

  if (deleteFramebuffer) {
    framebuffer.delete();
  }

  return texture;
}

function getFramebuffer$1(source) {
  if (!(source instanceof Framebuffer)) {
    return {
      framebuffer: toFramebuffer(source),
      deleteFramebuffer: true
    };
  }

  return {
    framebuffer: source,
    deleteFramebuffer: false
  };
}

function getPixelArray(pixelArray, type, format, width, height) {
  if (pixelArray) {
    return pixelArray;
  }

  type = type || 5121;
  const ArrayType = getTypedArrayFromGLType(type, {
    clamped: false
  });
  const components = glFormatToComponents(format);
  return new ArrayType(width * height * components);
}

const FEATURES$1 = {
  WEBGL2: 'WEBGL2',
  VERTEX_ARRAY_OBJECT: 'VERTEX_ARRAY_OBJECT',
  TIMER_QUERY: 'TIMER_QUERY',
  INSTANCED_RENDERING: 'INSTANCED_RENDERING',
  MULTIPLE_RENDER_TARGETS: 'MULTIPLE_RENDER_TARGETS',
  ELEMENT_INDEX_UINT32: 'ELEMENT_INDEX_UINT32',
  BLEND_EQUATION_MINMAX: 'BLEND_EQUATION_MINMAX',
  FLOAT_BLEND: 'FLOAT_BLEND',
  COLOR_ENCODING_SRGB: 'COLOR_ENCODING_SRGB',
  TEXTURE_DEPTH: 'TEXTURE_DEPTH',
  TEXTURE_FLOAT: 'TEXTURE_FLOAT',
  TEXTURE_HALF_FLOAT: 'TEXTURE_HALF_FLOAT',
  TEXTURE_FILTER_LINEAR_FLOAT: 'TEXTURE_FILTER_LINEAR_FLOAT',
  TEXTURE_FILTER_LINEAR_HALF_FLOAT: 'TEXTURE_FILTER_LINEAR_HALF_FLOAT',
  TEXTURE_FILTER_ANISOTROPIC: 'TEXTURE_FILTER_ANISOTROPIC',
  COLOR_ATTACHMENT_RGBA32F: 'COLOR_ATTACHMENT_RGBA32F',
  COLOR_ATTACHMENT_FLOAT: 'COLOR_ATTACHMENT_FLOAT',
  COLOR_ATTACHMENT_HALF_FLOAT: 'COLOR_ATTACHMENT_HALF_FLOAT',
  GLSL_FRAG_DATA: 'GLSL_FRAG_DATA',
  GLSL_FRAG_DEPTH: 'GLSL_FRAG_DEPTH',
  GLSL_DERIVATIVES: 'GLSL_DERIVATIVES',
  GLSL_TEXTURE_LOD: 'GLSL_TEXTURE_LOD'
};

function checkFloat32ColorAttachment(gl) {
  const testTexture = new Texture2D(gl, {
    format: 6408,
    type: 5126,
    dataFormat: 6408
  });
  const testFb = new Framebuffer(gl, {
    id: `test-framebuffer`,
    check: false,
    attachments: {
      [36064]: testTexture
    }
  });
  const status = testFb.getStatus();
  testTexture.delete();
  testFb.delete();
  return status === 36053;
}

var WEBGL_FEATURES$1 = {
  [FEATURES$1.WEBGL2]: [false, true],
  [FEATURES$1.VERTEX_ARRAY_OBJECT]: ['OES_vertex_array_object', true],
  [FEATURES$1.TIMER_QUERY]: ['EXT_disjoint_timer_query', 'EXT_disjoint_timer_query_webgl2'],
  [FEATURES$1.INSTANCED_RENDERING]: ['ANGLE_instanced_arrays', true],
  [FEATURES$1.MULTIPLE_RENDER_TARGETS]: ['WEBGL_draw_buffers', true],
  [FEATURES$1.ELEMENT_INDEX_UINT32]: ['OES_element_index_uint', true],
  [FEATURES$1.BLEND_EQUATION_MINMAX]: ['EXT_blend_minmax', true],
  [FEATURES$1.FLOAT_BLEND]: ['EXT_float_blend'],
  [FEATURES$1.COLOR_ENCODING_SRGB]: ['EXT_sRGB', true],
  [FEATURES$1.TEXTURE_DEPTH]: ['WEBGL_depth_texture', true],
  [FEATURES$1.TEXTURE_FLOAT]: ['OES_texture_float', true],
  [FEATURES$1.TEXTURE_HALF_FLOAT]: ['OES_texture_half_float', true],
  [FEATURES$1.TEXTURE_FILTER_LINEAR_FLOAT]: ['OES_texture_float_linear'],
  [FEATURES$1.TEXTURE_FILTER_LINEAR_HALF_FLOAT]: ['OES_texture_half_float_linear'],
  [FEATURES$1.TEXTURE_FILTER_ANISOTROPIC]: ['EXT_texture_filter_anisotropic'],
  [FEATURES$1.COLOR_ATTACHMENT_RGBA32F]: [checkFloat32ColorAttachment, 'EXT_color_buffer_float'],
  [FEATURES$1.COLOR_ATTACHMENT_FLOAT]: [false, 'EXT_color_buffer_float'],
  [FEATURES$1.COLOR_ATTACHMENT_HALF_FLOAT]: ['EXT_color_buffer_half_float'],
  [FEATURES$1.GLSL_FRAG_DATA]: ['WEBGL_draw_buffers', true],
  [FEATURES$1.GLSL_FRAG_DEPTH]: ['EXT_frag_depth', true],
  [FEATURES$1.GLSL_DERIVATIVES]: ['OES_standard_derivatives', true],
  [FEATURES$1.GLSL_TEXTURE_LOD]: ['EXT_shader_texture_lod', true]
};

const LOG_UNSUPPORTED_FEATURE = 2;
function hasFeature(gl, feature) {
  return hasFeatures$1(gl, feature);
}
function hasFeatures$1(gl, features) {
  features = Array.isArray(features) ? features : [features];
  return features.every(feature => {
    return isFeatureSupported(gl, feature);
  });
}
function getFeatures(gl) {
  gl.luma = gl.luma || {};
  gl.luma.caps = gl.luma.caps || {};

  for (const cap in WEBGL_FEATURES$1) {
    if (gl.luma.caps[cap] === undefined) {
      gl.luma.caps[cap] = isFeatureSupported(gl, cap);
    }
  }

  return gl.luma.caps;
}

function isFeatureSupported(gl, cap) {
  gl.luma = gl.luma || {};
  gl.luma.caps = gl.luma.caps || {};

  if (gl.luma.caps[cap] === undefined) {
    gl.luma.caps[cap] = queryFeature(gl, cap);
  }

  if (!gl.luma.caps[cap]) {
    log$1.log(LOG_UNSUPPORTED_FEATURE, `Feature: ${cap} not supported`)();
  }

  return gl.luma.caps[cap];
}

function queryFeature(gl, cap) {
  const feature = WEBGL_FEATURES$1[cap];
  assert$1(feature, cap);
  let isSupported;
  const featureDefinition = isWebGL2$1(gl) ? feature[1] || feature[0] : feature[0];

  if (typeof featureDefinition === 'function') {
    isSupported = featureDefinition(gl);
  } else if (Array.isArray(featureDefinition)) {
    isSupported = true;

    for (const extension of featureDefinition) {
      isSupported = isSupported && Boolean(gl.getExtension(extension));
    }
  } else if (typeof featureDefinition === 'string') {
    isSupported = Boolean(gl.getExtension(featureDefinition));
  } else if (typeof featureDefinition === 'boolean') {
    isSupported = featureDefinition;
  } else {
    assert$1(false);
  }

  return isSupported;
}

const ERR_MULTIPLE_RENDERTARGETS = 'Multiple render targets not supported';
class Framebuffer extends Resource {
  static isSupported(gl, options = {}) {
    const {
      colorBufferFloat,
      colorBufferHalfFloat
    } = options;
    let supported = true;

    if (colorBufferFloat) {
      supported = Boolean(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('WEBGL_color_buffer_float') || gl.getExtension('OES_texture_float'));
    }

    if (colorBufferHalfFloat) {
      supported = supported && Boolean(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));
    }

    return supported;
  }

  static getDefaultFramebuffer(gl) {
    gl.luma = gl.luma || {};
    gl.luma.defaultFramebuffer = gl.luma.defaultFramebuffer || new Framebuffer(gl, {
      id: 'default-framebuffer',
      handle: null,
      attachments: {}
    });
    return gl.luma.defaultFramebuffer;
  }

  get MAX_COLOR_ATTACHMENTS() {
    const gl2 = assertWebGL2Context(this.gl);
    return gl2.getParameter(gl2.MAX_COLOR_ATTACHMENTS);
  }

  get MAX_DRAW_BUFFERS() {
    const gl2 = assertWebGL2Context(this.gl);
    return gl2.getParameter(gl2.MAX_DRAW_BUFFERS);
  }

  constructor(gl, opts = {}) {
    super(gl, opts);
    this.width = null;
    this.height = null;
    this.attachments = {};
    this.readBuffer = 36064;
    this.drawBuffers = [36064];
    this.ownResources = [];
    this.initialize(opts);
    Object.seal(this);
  }

  get color() {
    return this.attachments[36064] || null;
  }

  get texture() {
    return this.attachments[36064] || null;
  }

  get depth() {
    return this.attachments[36096] || this.attachments[33306] || null;
  }

  get stencil() {
    return this.attachments[36128] || this.attachments[33306] || null;
  }

  initialize({
    width = 1,
    height = 1,
    attachments = null,
    color = true,
    depth = true,
    stencil = false,
    check = true,
    readBuffer = undefined,
    drawBuffers = undefined
  }) {
    assert$1(width >= 0 && height >= 0, 'Width and height need to be integers');
    this.width = width;
    this.height = height;

    if (attachments) {
      for (const attachment in attachments) {
        const target = attachments[attachment];
        const object = Array.isArray(target) ? target[0] : target;
        object.resize({
          width,
          height
        });
      }
    } else {
      attachments = this._createDefaultAttachments(color, depth, stencil, width, height);
    }

    this.update({
      clearAttachments: true,
      attachments,
      readBuffer,
      drawBuffers
    });

    if (attachments && check) {
      this.checkStatus();
    }
  }

  delete() {
    for (const resource of this.ownResources) {
      resource.delete();
    }

    super.delete();
    return this;
  }

  update({
    attachments = {},
    readBuffer,
    drawBuffers,
    clearAttachments = false,
    resizeAttachments = true
  }) {
    this.attach(attachments, {
      clearAttachments,
      resizeAttachments
    });
    const {
      gl
    } = this;
    const prevHandle = gl.bindFramebuffer(36160, this.handle);

    if (readBuffer) {
      this._setReadBuffer(readBuffer);
    }

    if (drawBuffers) {
      this._setDrawBuffers(drawBuffers);
    }

    gl.bindFramebuffer(36160, prevHandle || null);
    return this;
  }

  resize(options = {}) {
    let {
      width,
      height
    } = options;

    if (this.handle === null) {
      assert$1(width === undefined && height === undefined);
      this.width = this.gl.drawingBufferWidth;
      this.height = this.gl.drawingBufferHeight;
      return this;
    }

    if (width === undefined) {
      width = this.gl.drawingBufferWidth;
    }

    if (height === undefined) {
      height = this.gl.drawingBufferHeight;
    }

    if (width !== this.width && height !== this.height) {
      log$1.log(2, `Resizing framebuffer ${this.id} to ${width}x${height}`)();
    }

    for (const attachmentPoint in this.attachments) {
      this.attachments[attachmentPoint].resize({
        width,
        height
      });
    }

    this.width = width;
    this.height = height;
    return this;
  }

  attach(attachments, {
    clearAttachments = false,
    resizeAttachments = true
  } = {}) {
    const newAttachments = {};

    if (clearAttachments) {
      Object.keys(this.attachments).forEach(key => {
        newAttachments[key] = null;
      });
    }

    Object.assign(newAttachments, attachments);
    const prevHandle = this.gl.bindFramebuffer(36160, this.handle);

    for (const key in newAttachments) {
      assert$1(key !== undefined, 'Misspelled framebuffer binding point?');
      const attachment = Number(key);
      const descriptor = newAttachments[attachment];
      let object = descriptor;

      if (!object) {
        this._unattach(attachment);
      } else if (object instanceof Renderbuffer) {
        this._attachRenderbuffer({
          attachment,
          renderbuffer: object
        });
      } else if (Array.isArray(descriptor)) {
        const [texture, layer = 0, level = 0] = descriptor;
        object = texture;

        this._attachTexture({
          attachment,
          texture,
          layer,
          level
        });
      } else {
        this._attachTexture({
          attachment,
          texture: object,
          layer: 0,
          level: 0
        });
      }

      if (resizeAttachments && object) {
        object.resize({
          width: this.width,
          height: this.height
        });
      }
    }

    this.gl.bindFramebuffer(36160, prevHandle || null);
    Object.assign(this.attachments, attachments);
    Object.keys(this.attachments).filter(key => !this.attachments[key]).forEach(key => {
      delete this.attachments[key];
    });
  }

  checkStatus() {
    const status = this.getStatus();

    if (status !== 36053) {
      throw new Error(_getFrameBufferStatus(status));
    }

    return this;
  }

  getStatus() {
    const {
      gl
    } = this;
    const prevHandle = gl.bindFramebuffer(36160, this.handle);
    const status = gl.checkFramebufferStatus(36160);
    gl.bindFramebuffer(36160, prevHandle || null);
    return status;
  }

  clear(options = {}) {
    const {
      color,
      depth,
      stencil,
      drawBuffers = []
    } = options;
    const prevHandle = this.gl.bindFramebuffer(36160, this.handle);

    if (color || depth || stencil) {
      clear(this.gl, {
        color,
        depth,
        stencil
      });
    }

    drawBuffers.forEach((value, drawBuffer) => {
      clearBuffer(this.gl, {
        drawBuffer,
        value
      });
    });
    this.gl.bindFramebuffer(36160, prevHandle || null);
    return this;
  }

  readPixels(opts = {}) {
    log$1.error('Framebuffer.readPixels() is no logner supported, use readPixelsToArray(framebuffer)')();
    return null;
  }

  readPixelsToBuffer(opts = {}) {
    log$1.error('Framebuffer.readPixelsToBuffer()is no logner supported, use readPixelsToBuffer(framebuffer)')();
    return null;
  }

  copyToDataUrl(opts = {}) {
    log$1.error('Framebuffer.copyToDataUrl() is no logner supported, use copyToDataUrl(framebuffer)')();
    return null;
  }

  copyToImage(opts = {}) {
    log$1.error('Framebuffer.copyToImage() is no logner supported, use copyToImage(framebuffer)')();
    return null;
  }

  copyToTexture(opts = {}) {
    log$1.error('Framebuffer.copyToTexture({...}) is no logner supported, use copyToTexture(source, target, opts})')();
    return null;
  }

  blit(opts = {}) {
    log$1.error('Framebuffer.blit({...}) is no logner supported, use blit(source, target, opts)')();
    return null;
  }

  invalidate({
    attachments = [],
    x = 0,
    y = 0,
    width,
    height
  }) {
    const gl2 = assertWebGL2Context(this.gl);
    const prevHandle = gl2.bindFramebuffer(36008, this.handle);
    const invalidateAll = x === 0 && y === 0 && width === undefined && height === undefined;

    if (invalidateAll) {
      gl2.invalidateFramebuffer(36008, attachments);
    } else {
      gl2.invalidateFramebuffer(36008, attachments, x, y, width, height);
    }

    gl2.bindFramebuffer(36008, prevHandle);
    return this;
  }

  getAttachmentParameter(attachment, pname, keys) {
    let value = this._getAttachmentParameterFallback(pname);

    if (value === null) {
      this.gl.bindFramebuffer(36160, this.handle);
      value = this.gl.getFramebufferAttachmentParameter(36160, attachment, pname);
      this.gl.bindFramebuffer(36160, null);
    }

    if (keys && value > 1000) {
      value = getKey(this.gl, value);
    }

    return value;
  }

  getAttachmentParameters(attachment = 36064, keys, parameters = this.constructor.ATTACHMENT_PARAMETERS || []) {
    const values = {};

    for (const pname of parameters) {
      const key = keys ? getKey(this.gl, pname) : pname;
      values[key] = this.getAttachmentParameter(attachment, pname, keys);
    }

    return values;
  }

  getParameters(keys = true) {
    const attachments = Object.keys(this.attachments);
    const parameters = {};

    for (const attachmentName of attachments) {
      const attachment = Number(attachmentName);
      const key = keys ? getKey(this.gl, attachment) : attachment;
      parameters[key] = this.getAttachmentParameters(attachment, keys);
    }

    return parameters;
  }

  show() {
    if (typeof window !== 'undefined') {
      window.open(copyToDataUrl(this), 'luma-debug-texture');
    }

    return this;
  }

  log(logLevel = 0, message = '') {
    if (logLevel > log$1.level || typeof window === 'undefined') {
      return this;
    }

    message = message || `Framebuffer ${this.id}`;
    const image = copyToDataUrl(this, {
      targetMaxHeight: 100
    });
    log$1.image({
      logLevel,
      message,
      image
    }, message)();
    return this;
  }

  bind({
    target = 36160
  } = {}) {
    this.gl.bindFramebuffer(target, this.handle);
    return this;
  }

  unbind({
    target = 36160
  } = {}) {
    this.gl.bindFramebuffer(target, null);
    return this;
  }

  _createDefaultAttachments(color, depth, stencil, width, height) {
    let defaultAttachments = null;

    if (color) {
      defaultAttachments = defaultAttachments || {};
      defaultAttachments[36064] = new Texture2D(this.gl, {
        id: `${this.id}-color0`,
        pixels: null,
        format: 6408,
        type: 5121,
        width,
        height,
        mipmaps: false,
        parameters: {
          [10241]: 9729,
          [10240]: 9729,
          [10242]: 33071,
          [10243]: 33071
        }
      });
      this.ownResources.push(defaultAttachments[36064]);
    }

    if (depth && stencil) {
      defaultAttachments = defaultAttachments || {};
      defaultAttachments[33306] = new Renderbuffer(this.gl, {
        id: `${this.id}-depth-stencil`,
        format: 35056,
        width,
        height: 111
      });
      this.ownResources.push(defaultAttachments[33306]);
    } else if (depth) {
      defaultAttachments = defaultAttachments || {};
      defaultAttachments[36096] = new Renderbuffer(this.gl, {
        id: `${this.id}-depth`,
        format: 33189,
        width,
        height
      });
      this.ownResources.push(defaultAttachments[36096]);
    } else if (stencil) {
      assert$1(false);
    }

    return defaultAttachments;
  }

  _unattach(attachment) {
    const oldAttachment = this.attachments[attachment];

    if (!oldAttachment) {
      return;
    }

    if (oldAttachment instanceof Renderbuffer) {
      this.gl.framebufferRenderbuffer(36160, attachment, 36161, null);
    } else {
      this.gl.framebufferTexture2D(36160, attachment, 3553, null, 0);
    }

    delete this.attachments[attachment];
  }

  _attachRenderbuffer({
    attachment = 36064,
    renderbuffer
  }) {
    const {
      gl
    } = this;
    gl.framebufferRenderbuffer(36160, attachment, 36161, renderbuffer.handle);
    this.attachments[attachment] = renderbuffer;
  }

  _attachTexture({
    attachment = 36064,
    texture,
    layer,
    level
  }) {
    const {
      gl
    } = this;
    gl.bindTexture(texture.target, texture.handle);

    switch (texture.target) {
      case 35866:
      case 32879:
        const gl2 = assertWebGL2Context(gl);
        gl2.framebufferTextureLayer(36160, attachment, texture.target, level, layer);
        break;

      case 34067:
        const face = mapIndexToCubeMapFace(layer);
        gl.framebufferTexture2D(36160, attachment, face, texture.handle, level);
        break;

      case 3553:
        gl.framebufferTexture2D(36160, attachment, 3553, texture.handle, level);
        break;

      default:
        assert$1(false, 'Illegal texture type');
    }

    gl.bindTexture(texture.target, null);
    this.attachments[attachment] = texture;
  }

  _setReadBuffer(readBuffer) {
    const gl2 = getWebGL2Context(this.gl);

    if (gl2) {
      gl2.readBuffer(readBuffer);
    } else {
      assert$1(readBuffer === 36064 || readBuffer === 1029, ERR_MULTIPLE_RENDERTARGETS);
    }

    this.readBuffer = readBuffer;
  }

  _setDrawBuffers(drawBuffers) {
    const {
      gl
    } = this;
    const gl2 = assertWebGL2Context(gl);

    if (gl2) {
      gl2.drawBuffers(drawBuffers);
    } else {
      const ext = gl.getExtension('WEBGL_draw_buffers');

      if (ext) {
        ext.drawBuffersWEBGL(drawBuffers);
      } else {
        assert$1(drawBuffers.length === 1 && (drawBuffers[0] === 36064 || drawBuffers[0] === 1029), ERR_MULTIPLE_RENDERTARGETS);
      }
    }

    this.drawBuffers = drawBuffers;
  }

  _getAttachmentParameterFallback(pname) {
    const caps = getFeatures(this.gl);

    switch (pname) {
      case 36052:
        return !caps.WEBGL2 ? 0 : null;

      case 33298:
      case 33299:
      case 33300:
      case 33301:
      case 33302:
      case 33303:
        return !caps.WEBGL2 ? 8 : null;

      case 33297:
        return !caps.WEBGL2 ? 5125 : null;

      case 33296:
        return !caps.WEBGL2 && !caps.EXT_sRGB ? 9729 : null;

      default:
        return null;
    }
  }

  _createHandle() {
    return this.gl.createFramebuffer();
  }

  _deleteHandle() {
    this.gl.deleteFramebuffer(this.handle);
  }

  _bindHandle(handle) {
    return this.gl.bindFramebuffer(36160, handle);
  }

}

function mapIndexToCubeMapFace(layer) {
  return layer < 34069 ? layer + 34069 : layer;
}

function _getFrameBufferStatus(status) {
  const STATUS = Framebuffer.STATUS || {};
  return STATUS[status] || `Framebuffer error ${status}`;
}

const FRAMEBUFFER_ATTACHMENT_PARAMETERS = [36049, 36048, 33296, 33298, 33299, 33300, 33301, 33302, 33303];
Framebuffer.ATTACHMENT_PARAMETERS = FRAMEBUFFER_ATTACHMENT_PARAMETERS;

function cloneTextureFrom(refTexture, overrides) {
  assert$1(refTexture instanceof Texture2D || refTexture instanceof TextureCube || refTexture instanceof Texture3D);
  const TextureType = refTexture.constructor;
  const {
    gl,
    width,
    height,
    format,
    type,
    dataFormat,
    border,
    mipmaps
  } = refTexture;
  const textureOptions = Object.assign({
    width,
    height,
    format,
    type,
    dataFormat,
    border,
    mipmaps
  }, overrides);
  return new TextureType(gl, textureOptions);
}
function toFramebuffer(texture, opts) {
  const {
    gl,
    width,
    height,
    id
  } = texture;
  const framebuffer = new Framebuffer(gl, Object.assign({}, opts, {
    id: `framebuffer-for-${id}`,
    width,
    height,
    attachments: {
      [36064]: texture
    }
  }));
  return framebuffer;
}

function getShaderName$1(shader, defaultName = 'unnamed') {
  const SHADER_NAME_REGEXP = /#define[\s*]SHADER_NAME[\s*]([A-Za-z0-9_-]+)[\s*]/;
  const match = shader.match(SHADER_NAME_REGEXP);
  return match ? match[1] : defaultName;
}

const GL_FRAGMENT_SHADER = 0x8b30;
const GL_VERTEX_SHADER = 0x8b31;
function getShaderTypeName(type) {
  switch (type) {
    case GL_FRAGMENT_SHADER:
      return 'fragment';

    case GL_VERTEX_SHADER:
      return 'vertex';

    default:
      return 'unknown type';
  }
}

function parseGLSLCompilerError(errLog, src, shaderType, shaderName) {
  const errorStrings = errLog.split(/\r?\n/);
  const errors = {};
  const warnings = {};
  const name = shaderName || getShaderName$1(src) || '(unnamed)';
  const shaderDescription = `${getShaderTypeName(shaderType)} shader ${name}`;

  for (let i = 0; i < errorStrings.length; i++) {
    const errorString = errorStrings[i];

    if (errorString.length <= 1) {
      continue;
    }

    const segments = errorString.split(':');
    const type = segments[0];
    const line = parseInt(segments[2], 10);

    if (isNaN(line)) {
      throw new Error(`GLSL compilation error in ${shaderDescription}: ${errLog}`);
    }

    if (type !== 'WARNING') {
      errors[line] = errorString;
    } else {
      warnings[line] = errorString;
    }
  }

  const lines = addLineNumbers(src);
  return {
    shaderName: shaderDescription,
    errors: formatErrors(errors, lines),
    warnings: formatErrors(warnings, lines)
  };
}

function formatErrors(errors, lines) {
  let message = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!errors[i + 3] && !errors[i + 2] && !errors[i + 1]) {
      continue;
    }

    message += `${line}\n`;

    if (errors[i + 1]) {
      const error = errors[i + 1];
      const segments = error.split(':', 3);
      const type = segments[0];
      const column = parseInt(segments[1], 10) || 0;
      const err = error.substring(segments.join(':').length + 1).trim();
      message += padLeft(`^^^ ${type}: ${err}\n\n`, column);
    }
  }

  return message;
}

function addLineNumbers(string, start = 1, delim = ': ') {
  const lines = string.split(/\r?\n/);
  const maxDigits = String(lines.length + start - 1).length;
  return lines.map((line, i) => {
    const lineNumber = String(i + start);
    const digits = lineNumber.length;
    const prefix = padLeft(lineNumber, maxDigits - digits);
    return prefix + delim + line;
  });
}

function padLeft(string, digits) {
  let result = '';

  for (let i = 0; i < digits; ++i) {
    result += ' ';
  }

  return `${result}${string}`;
}

function getShaderVersion(source) {
  let version = 100;
  const words = source.match(/[^\s]+/g);

  if (words.length >= 2 && words[0] === '#version') {
    const v = parseInt(words[1], 10);

    if (Number.isFinite(v)) {
      version = v;
    }
  }

  return version;
}

const ERR_SOURCE = 'Shader: GLSL source code must be a JavaScript string';
class Shader extends Resource {
  static getTypeName(shaderType) {
    switch (shaderType) {
      case 35633:
        return 'vertex-shader';

      case 35632:
        return 'fragment-shader';

      default:
        assert$1(false);
        return 'unknown';
    }
  }

  constructor(gl, props) {
    assertWebGLContext(gl);
    assert$1(typeof props.source === 'string', ERR_SOURCE);
    const id = getShaderName$1(props.source, null) || props.id || uid(`unnamed ${Shader.getTypeName(props.shaderType)}`);
    super(gl, {
      id
    });
    this.shaderType = props.shaderType;
    this.source = props.source;
    this.initialize(props);
  }

  initialize({
    source
  }) {
    const shaderName = getShaderName$1(source, null);

    if (shaderName) {
      this.id = uid(shaderName);
    }

    this._compile(source);
  }

  getParameter(pname) {
    return this.gl.getShaderParameter(this.handle, pname);
  }

  toString() {
    return `${Shader.getTypeName(this.shaderType)}:${this.id}`;
  }

  getName() {
    return getShaderName$1(this.source) || 'unnamed-shader';
  }

  getSource() {
    return this.gl.getShaderSource(this.handle);
  }

  getTranslatedSource() {
    const extension = this.gl.getExtension('WEBGL_debug_shaders');
    return extension ? extension.getTranslatedShaderSource(this.handle) : 'No translated source available. WEBGL_debug_shaders not implemented';
  }

  _compile(source = this.source) {
    if (!source.startsWith('#version ')) {
      source = `#version 100\n${source}`;
    }

    this.source = source;
    this.gl.shaderSource(this.handle, this.source);
    this.gl.compileShader(this.handle);
    const compileStatus = this.getParameter(35713);

    if (!compileStatus) {
      const infoLog = this.gl.getShaderInfoLog(this.handle);
      const {
        shaderName,
        errors,
        warnings
      } = parseGLSLCompilerError(infoLog, this.source, this.shaderType, this.id);
      log$1.error(`GLSL compilation errors in ${shaderName}\n${errors}`)();
      log$1.warn(`GLSL compilation warnings in ${shaderName}\n${warnings}`)();
      throw new Error(`GLSL compilation errors in ${shaderName}`);
    }
  }

  _deleteHandle() {
    this.gl.deleteShader(this.handle);
  }

  _getOptsFromHandle() {
    return {
      type: this.getParameter(35663),
      source: this.getSource()
    };
  }

}
class VertexShader extends Shader {
  constructor(gl, props) {
    if (typeof props === 'string') {
      props = {
        source: props
      };
    }

    super(gl, Object.assign({}, props, {
      shaderType: 35633
    }));
  }

  _createHandle() {
    return this.gl.createShader(35633);
  }

}
class FragmentShader extends Shader {
  constructor(gl, props) {
    if (typeof props === 'string') {
      props = {
        source: props
      };
    }

    super(gl, Object.assign({}, props, {
      shaderType: 35632
    }));
  }

  _createHandle() {
    return this.gl.createShader(35632);
  }

}

const UNIFORM_SETTERS = {
  [5126]: getArraySetter.bind(null, 'uniform1fv', toFloatArray, 1, setVectorUniform),
  [35664]: getArraySetter.bind(null, 'uniform2fv', toFloatArray, 2, setVectorUniform),
  [35665]: getArraySetter.bind(null, 'uniform3fv', toFloatArray, 3, setVectorUniform),
  [35666]: getArraySetter.bind(null, 'uniform4fv', toFloatArray, 4, setVectorUniform),
  [5124]: getArraySetter.bind(null, 'uniform1iv', toIntArray, 1, setVectorUniform),
  [35667]: getArraySetter.bind(null, 'uniform2iv', toIntArray, 2, setVectorUniform),
  [35668]: getArraySetter.bind(null, 'uniform3iv', toIntArray, 3, setVectorUniform),
  [35669]: getArraySetter.bind(null, 'uniform4iv', toIntArray, 4, setVectorUniform),
  [35670]: getArraySetter.bind(null, 'uniform1iv', toIntArray, 1, setVectorUniform),
  [35671]: getArraySetter.bind(null, 'uniform2iv', toIntArray, 2, setVectorUniform),
  [35672]: getArraySetter.bind(null, 'uniform3iv', toIntArray, 3, setVectorUniform),
  [35673]: getArraySetter.bind(null, 'uniform4iv', toIntArray, 4, setVectorUniform),
  [35674]: getArraySetter.bind(null, 'uniformMatrix2fv', toFloatArray, 4, setMatrixUniform),
  [35675]: getArraySetter.bind(null, 'uniformMatrix3fv', toFloatArray, 9, setMatrixUniform),
  [35676]: getArraySetter.bind(null, 'uniformMatrix4fv', toFloatArray, 16, setMatrixUniform),
  [35678]: getSamplerSetter,
  [35680]: getSamplerSetter,
  [5125]: getArraySetter.bind(null, 'uniform1uiv', toUIntArray, 1, setVectorUniform),
  [36294]: getArraySetter.bind(null, 'uniform2uiv', toUIntArray, 2, setVectorUniform),
  [36295]: getArraySetter.bind(null, 'uniform3uiv', toUIntArray, 3, setVectorUniform),
  [36296]: getArraySetter.bind(null, 'uniform4uiv', toUIntArray, 4, setVectorUniform),
  [35685]: getArraySetter.bind(null, 'uniformMatrix2x3fv', toFloatArray, 6, setMatrixUniform),
  [35686]: getArraySetter.bind(null, 'uniformMatrix2x4fv', toFloatArray, 8, setMatrixUniform),
  [35687]: getArraySetter.bind(null, 'uniformMatrix3x2fv', toFloatArray, 6, setMatrixUniform),
  [35688]: getArraySetter.bind(null, 'uniformMatrix3x4fv', toFloatArray, 12, setMatrixUniform),
  [35689]: getArraySetter.bind(null, 'uniformMatrix4x2fv', toFloatArray, 8, setMatrixUniform),
  [35690]: getArraySetter.bind(null, 'uniformMatrix4x3fv', toFloatArray, 12, setMatrixUniform),
  [35678]: getSamplerSetter,
  [35680]: getSamplerSetter,
  [35679]: getSamplerSetter,
  [35682]: getSamplerSetter,
  [36289]: getSamplerSetter,
  [36292]: getSamplerSetter,
  [36293]: getSamplerSetter,
  [36298]: getSamplerSetter,
  [36299]: getSamplerSetter,
  [36300]: getSamplerSetter,
  [36303]: getSamplerSetter,
  [36306]: getSamplerSetter,
  [36307]: getSamplerSetter,
  [36308]: getSamplerSetter,
  [36311]: getSamplerSetter
};
const FLOAT_ARRAY = {};
const INT_ARRAY = {};
const UINT_ARRAY = {};
const array1 = [0];

function toTypedArray(value, uniformLength, Type, cache) {
  if (uniformLength === 1 && typeof value === 'boolean') {
    value = value ? 1 : 0;
  }

  if (Number.isFinite(value)) {
    array1[0] = value;
    value = array1;
  }

  const length = value.length;

  if (length % uniformLength) {
    log$1.warn(`Uniform size should be multiples of ${uniformLength}`, value)();
  }

  if (value instanceof Type) {
    return value;
  }

  let result = cache[length];

  if (!result) {
    result = new Type(length);
    cache[length] = result;
  }

  for (let i = 0; i < length; i++) {
    result[i] = value[i];
  }

  return result;
}

function toFloatArray(value, uniformLength) {
  return toTypedArray(value, uniformLength, Float32Array, FLOAT_ARRAY);
}

function toIntArray(value, uniformLength) {
  return toTypedArray(value, uniformLength, Int32Array, INT_ARRAY);
}

function toUIntArray(value, uniformLength) {
  return toTypedArray(value, uniformLength, Uint32Array, UINT_ARRAY);
}

function getUniformSetter(gl, location, info) {
  const setter = UNIFORM_SETTERS[info.type];

  if (!setter) {
    throw new Error(`Unknown GLSL uniform type ${info.type}`);
  }

  return setter().bind(null, gl, location);
}
function parseUniformName(name) {
  if (name[name.length - 1] !== ']') {
    return {
      name,
      length: 1,
      isArray: false
    };
  }

  const UNIFORM_NAME_REGEXP = /([^[]*)(\[[0-9]+\])?/;
  const matches = name.match(UNIFORM_NAME_REGEXP);

  if (!matches || matches.length < 2) {
    throw new Error(`Failed to parse GLSL uniform name ${name}`);
  }

  return {
    name: matches[1],
    length: matches[2] || 1,
    isArray: Boolean(matches[2])
  };
}
function checkUniformValues(uniforms, source, uniformMap) {
  for (const uniformName in uniforms) {
    const value = uniforms[uniformName];
    const shouldCheck = !uniformMap || Boolean(uniformMap[uniformName]);

    if (shouldCheck && !checkUniformValue(value)) {
      source = source ? `${source} ` : '';
      console.error(`${source} Bad uniform ${uniformName}`, value);
      throw new Error(`${source} Bad uniform ${uniformName}`);
    }
  }

  return true;
}

function checkUniformValue(value) {
  if (Array.isArray(value) || ArrayBuffer.isView(value)) {
    return checkUniformArray(value);
  }

  if (isFinite(value)) {
    return true;
  } else if (value === true || value === false) {
    return true;
  } else if (value instanceof Texture) {
    return true;
  } else if (value instanceof Renderbuffer) {
    return true;
  } else if (value instanceof Framebuffer) {
    return Boolean(value.texture);
  }

  return false;
}

function copyUniform(uniforms, key, value) {
  if (Array.isArray(value) || ArrayBuffer.isView(value)) {
    if (uniforms[key]) {
      const dest = uniforms[key];

      for (let i = 0, len = value.length; i < len; ++i) {
        dest[i] = value[i];
      }
    } else {
      uniforms[key] = value.slice();
    }
  } else {
    uniforms[key] = value;
  }
}

function checkUniformArray(value) {
  if (value.length === 0) {
    return false;
  }

  const checkLength = Math.min(value.length, 16);

  for (let i = 0; i < checkLength; ++i) {
    if (!Number.isFinite(value[i])) {
      return false;
    }
  }

  return true;
}

function getSamplerSetter() {
  let cache = null;
  return (gl, location, value) => {
    const update = cache !== value;

    if (update) {
      gl.uniform1i(location, value);
      cache = value;
    }

    return update;
  };
}

function getArraySetter(functionName, toArray, size, uniformSetter) {
  let cache = null;
  let cacheLength = null;
  return (gl, location, value) => {
    const arrayValue = toArray(value, size);
    const length = arrayValue.length;
    let update = false;

    if (cache === null) {
      cache = new Float32Array(length);
      cacheLength = length;
      update = true;
    } else {
      assert$1(cacheLength === length, 'Uniform length cannot change.');

      for (let i = 0; i < length; ++i) {
        if (arrayValue[i] !== cache[i]) {
          update = true;
          break;
        }
      }
    }

    if (update) {
      uniformSetter(gl, functionName, location, arrayValue);
      cache.set(arrayValue);
    }

    return update;
  };
}

function setVectorUniform(gl, functionName, location, value) {
  gl[functionName](location, value);
}

function setMatrixUniform(gl, functionName, location, value) {
  gl[functionName](location, false, value);
}

const GL_BYTE = 0x1400;
const GL_UNSIGNED_BYTE = 0x1401;
const GL_SHORT = 0x1402;
const GL_UNSIGNED_SHORT = 0x1403;
const GL_POINTS = 0x0;
const GL_LINES = 0x1;
const GL_LINE_LOOP = 0x2;
const GL_LINE_STRIP = 0x3;
const GL_TRIANGLES = 0x4;
const GL_TRIANGLE_STRIP = 0x5;
const GL_TRIANGLE_FAN = 0x6;
const GL_FLOAT = 0x1406;
const GL_FLOAT_VEC2 = 0x8b50;
const GL_FLOAT_VEC3 = 0x8b51;
const GL_FLOAT_VEC4 = 0x8b52;
const GL_INT = 0x1404;
const GL_INT_VEC2 = 0x8b53;
const GL_INT_VEC3 = 0x8b54;
const GL_INT_VEC4 = 0x8b55;
const GL_UNSIGNED_INT = 0x1405;
const GL_UNSIGNED_INT_VEC2 = 0x8dc6;
const GL_UNSIGNED_INT_VEC3 = 0x8dc7;
const GL_UNSIGNED_INT_VEC4 = 0x8dc8;
const GL_BOOL = 0x8b56;
const GL_BOOL_VEC2 = 0x8b57;
const GL_BOOL_VEC3 = 0x8b58;
const GL_BOOL_VEC4 = 0x8b59;
const GL_FLOAT_MAT2 = 0x8b5a;
const GL_FLOAT_MAT3 = 0x8b5b;
const GL_FLOAT_MAT4 = 0x8b5c;
const GL_FLOAT_MAT2x3 = 0x8b65;
const GL_FLOAT_MAT2x4 = 0x8b66;
const GL_FLOAT_MAT3x2 = 0x8b67;
const GL_FLOAT_MAT3x4 = 0x8b68;
const GL_FLOAT_MAT4x2 = 0x8b69;
const GL_FLOAT_MAT4x3 = 0x8b6a;
const COMPOSITE_GL_TYPES = {
  [GL_FLOAT]: [GL_FLOAT, 1, 'float'],
  [GL_FLOAT_VEC2]: [GL_FLOAT, 2, 'vec2'],
  [GL_FLOAT_VEC3]: [GL_FLOAT, 3, 'vec3'],
  [GL_FLOAT_VEC4]: [GL_FLOAT, 4, 'vec4'],
  [GL_INT]: [GL_INT, 1, 'int'],
  [GL_INT_VEC2]: [GL_INT, 2, 'ivec2'],
  [GL_INT_VEC3]: [GL_INT, 3, 'ivec3'],
  [GL_INT_VEC4]: [GL_INT, 4, 'ivec4'],
  [GL_UNSIGNED_INT]: [GL_UNSIGNED_INT, 1, 'uint'],
  [GL_UNSIGNED_INT_VEC2]: [GL_UNSIGNED_INT, 2, 'uvec2'],
  [GL_UNSIGNED_INT_VEC3]: [GL_UNSIGNED_INT, 3, 'uvec3'],
  [GL_UNSIGNED_INT_VEC4]: [GL_UNSIGNED_INT, 4, 'uvec4'],
  [GL_BOOL]: [GL_FLOAT, 1, 'bool'],
  [GL_BOOL_VEC2]: [GL_FLOAT, 2, 'bvec2'],
  [GL_BOOL_VEC3]: [GL_FLOAT, 3, 'bvec3'],
  [GL_BOOL_VEC4]: [GL_FLOAT, 4, 'bvec4'],
  [GL_FLOAT_MAT2]: [GL_FLOAT, 8, 'mat2'],
  [GL_FLOAT_MAT2x3]: [GL_FLOAT, 8, 'mat2x3'],
  [GL_FLOAT_MAT2x4]: [GL_FLOAT, 8, 'mat2x4'],
  [GL_FLOAT_MAT3]: [GL_FLOAT, 12, 'mat3'],
  [GL_FLOAT_MAT3x2]: [GL_FLOAT, 12, 'mat3x2'],
  [GL_FLOAT_MAT3x4]: [GL_FLOAT, 12, 'mat3x4'],
  [GL_FLOAT_MAT4]: [GL_FLOAT, 16, 'mat4'],
  [GL_FLOAT_MAT4x2]: [GL_FLOAT, 16, 'mat4x2'],
  [GL_FLOAT_MAT4x3]: [GL_FLOAT, 16, 'mat4x3']
};
function getPrimitiveDrawMode(drawMode) {
  switch (drawMode) {
    case GL_POINTS:
      return GL_POINTS;

    case GL_LINES:
      return GL_LINES;

    case GL_LINE_STRIP:
      return GL_LINES;

    case GL_LINE_LOOP:
      return GL_LINES;

    case GL_TRIANGLES:
      return GL_TRIANGLES;

    case GL_TRIANGLE_STRIP:
      return GL_TRIANGLES;

    case GL_TRIANGLE_FAN:
      return GL_TRIANGLES;

    default:
      assert$1(false);
      return 0;
  }
}
function decomposeCompositeGLType(compositeGLType) {
  const typeAndSize = COMPOSITE_GL_TYPES[compositeGLType];

  if (!typeAndSize) {
    return null;
  }

  const [type, components] = typeAndSize;
  return {
    type,
    components
  };
}
function getCompositeGLType(type, components) {
  switch (type) {
    case GL_BYTE:
    case GL_UNSIGNED_BYTE:
    case GL_SHORT:
    case GL_UNSIGNED_SHORT:
      type = GL_FLOAT;
      break;
  }

  for (const glType in COMPOSITE_GL_TYPES) {
    const [compType, compComponents, name] = COMPOSITE_GL_TYPES[glType];

    if (compType === type && compComponents === components) {
      return {
        glType,
        name
      };
    }
  }

  return null;
}

class ProgramConfiguration {
  constructor(program) {
    this.id = program.id;
    this.attributeInfos = [];
    this.attributeInfosByName = {};
    this.attributeInfosByLocation = [];
    this.varyingInfos = [];
    this.varyingInfosByName = {};
    Object.seal(this);

    this._readAttributesFromProgram(program);

    this._readVaryingsFromProgram(program);
  }

  getAttributeInfo(locationOrName) {
    const location = Number(locationOrName);

    if (Number.isFinite(location)) {
      return this.attributeInfosByLocation[location];
    }

    return this.attributeInfosByName[locationOrName] || null;
  }

  getAttributeLocation(locationOrName) {
    const attributeInfo = this.getAttributeInfo(locationOrName);
    return attributeInfo ? attributeInfo.location : -1;
  }

  getAttributeAccessor(locationOrName) {
    const attributeInfo = this.getAttributeInfo(locationOrName);
    return attributeInfo ? attributeInfo.accessor : null;
  }

  getVaryingInfo(locationOrName) {
    const location = Number(locationOrName);

    if (Number.isFinite(location)) {
      return this.varyingInfos[location];
    }

    return this.varyingInfosByName[locationOrName] || null;
  }

  getVaryingIndex(locationOrName) {
    const varying = this.getVaryingInfo();
    return varying ? varying.location : -1;
  }

  getVaryingAccessor(locationOrName) {
    const varying = this.getVaryingInfo();
    return varying ? varying.accessor : null;
  }

  _readAttributesFromProgram(program) {
    const {
      gl
    } = program;
    const count = gl.getProgramParameter(program.handle, 35721);

    for (let index = 0; index < count; index++) {
      const {
        name,
        type,
        size
      } = gl.getActiveAttrib(program.handle, index);
      const location = gl.getAttribLocation(program.handle, name);

      if (location >= 0) {
        this._addAttribute(location, name, type, size);
      }
    }

    this.attributeInfos.sort((a, b) => a.location - b.location);
  }

  _readVaryingsFromProgram(program) {
    const {
      gl
    } = program;

    if (!isWebGL2$1(gl)) {
      return;
    }

    const count = gl.getProgramParameter(program.handle, 35971);

    for (let location = 0; location < count; location++) {
      const {
        name,
        type,
        size
      } = gl.getTransformFeedbackVarying(program.handle, location);

      this._addVarying(location, name, type, size);
    }

    this.varyingInfos.sort((a, b) => a.location - b.location);
  }

  _addAttribute(location, name, compositeType, size) {
    const {
      type,
      components
    } = decomposeCompositeGLType(compositeType);
    const accessor = {
      type,
      size: size * components
    };

    this._inferProperties(location, name, accessor);

    const attributeInfo = {
      location,
      name,
      accessor: new Accessor(accessor)
    };
    this.attributeInfos.push(attributeInfo);
    this.attributeInfosByLocation[location] = attributeInfo;
    this.attributeInfosByName[attributeInfo.name] = attributeInfo;
  }

  _inferProperties(location, name, accessor) {
    if (/instance/i.test(name)) {
      accessor.divisor = 1;
    }
  }

  _addVarying(location, name, compositeType, size) {
    const {
      type,
      components
    } = decomposeCompositeGLType(compositeType);
    const accessor = new Accessor({
      type,
      size: size * components
    });
    const varying = {
      location,
      name,
      accessor
    };
    this.varyingInfos.push(varying);
    this.varyingInfosByName[varying.name] = varying;
  }

}

const LOG_PROGRAM_PERF_PRIORITY = 4;
const GL_SEPARATE_ATTRIBS = 0x8c8d;
const V6_DEPRECATED_METHODS = ['setVertexArray', 'setAttributes', 'setBuffers', 'unsetBuffers', 'use', 'getUniformCount', 'getUniformInfo', 'getUniformLocation', 'getUniformValue', 'getVarying', 'getFragDataLocation', 'getAttachedShaders', 'getAttributeCount', 'getAttributeLocation', 'getAttributeInfo'];
class Program extends Resource {
  constructor(gl, props = {}) {
    super(gl, props);
    this.stubRemovedMethods('Program', 'v6.0', V6_DEPRECATED_METHODS);
    this._isCached = false;
    this.initialize(props);
    Object.seal(this);

    this._setId(props.id);
  }

  initialize(props = {}) {
    const {
      hash,
      vs,
      fs,
      varyings,
      bufferMode = GL_SEPARATE_ATTRIBS
    } = props;
    this.hash = hash || '';
    this.vs = typeof vs === 'string' ? new VertexShader(this.gl, {
      id: `${props.id}-vs`,
      source: vs
    }) : vs;
    this.fs = typeof fs === 'string' ? new FragmentShader(this.gl, {
      id: `${props.id}-fs`,
      source: fs
    }) : fs;
    assert$1(this.vs instanceof VertexShader);
    assert$1(this.fs instanceof FragmentShader);
    this.uniforms = {};
    this._textureUniforms = {};

    if (varyings && varyings.length > 0) {
      assertWebGL2Context(this.gl);
      this.varyings = varyings;
      this.gl2.transformFeedbackVaryings(this.handle, varyings, bufferMode);
    }

    this._compileAndLink();

    this._readUniformLocationsFromLinkedProgram();

    this.configuration = new ProgramConfiguration(this);
    return this.setProps(props);
  }

  delete(options = {}) {
    if (this._isCached) {
      return this;
    }

    return super.delete(options);
  }

  setProps(props) {
    if ('uniforms' in props) {
      this.setUniforms(props.uniforms);
    }

    return this;
  }

  draw({
    logPriority,
    drawMode = 4,
    vertexCount,
    offset = 0,
    start,
    end,
    isIndexed = false,
    indexType = 5123,
    instanceCount = 0,
    isInstanced = instanceCount > 0,
    vertexArray = null,
    transformFeedback,
    framebuffer,
    parameters = {},
    uniforms,
    samplers
  }) {
    if (uniforms || samplers) {
      log$1.deprecated('Program.draw({uniforms})', 'Program.setUniforms(uniforms)')();
      this.setUniforms(uniforms || {});
    }

    if (log$1.priority >= logPriority) {
      const fb = framebuffer ? framebuffer.id : 'default';
      const message = `mode=${getKey(this.gl, drawMode)} verts=${vertexCount} ` + `instances=${instanceCount} indexType=${getKey(this.gl, indexType)} ` + `isInstanced=${isInstanced} isIndexed=${isIndexed} ` + `Framebuffer=${fb}`;
      log$1.log(logPriority, message)();
    }

    assert$1(vertexArray);
    this.gl.useProgram(this.handle);

    if (!this._areTexturesRenderable() || vertexCount === 0 || isInstanced && instanceCount === 0) {
      return false;
    }

    vertexArray.bindForDraw(vertexCount, instanceCount, () => {
      if (framebuffer !== undefined) {
        parameters = Object.assign({}, parameters, {
          framebuffer
        });
      }

      if (transformFeedback) {
        const primitiveMode = getPrimitiveDrawMode(drawMode);
        transformFeedback.begin(primitiveMode);
      }

      this._bindTextures();

      withParameters(this.gl, parameters, () => {
        if (isIndexed && isInstanced) {
          this.gl2.drawElementsInstanced(drawMode, vertexCount, indexType, offset, instanceCount);
        } else if (isIndexed && isWebGL2$1(this.gl) && !isNaN(start) && !isNaN(end)) {
          this.gl2.drawRangeElements(drawMode, start, end, vertexCount, indexType, offset);
        } else if (isIndexed) {
          this.gl.drawElements(drawMode, vertexCount, indexType, offset);
        } else if (isInstanced) {
          this.gl2.drawArraysInstanced(drawMode, offset, vertexCount, instanceCount);
        } else {
          this.gl.drawArrays(drawMode, offset, vertexCount);
        }
      });

      if (transformFeedback) {
        transformFeedback.end();
      }
    });
    return true;
  }

  setUniforms(uniforms = {}) {
    if (log$1.priority >= 2) {
      checkUniformValues(uniforms, this.id, this._uniformSetters);
    }

    this.gl.useProgram(this.handle);

    for (const uniformName in uniforms) {
      const uniform = uniforms[uniformName];
      const uniformSetter = this._uniformSetters[uniformName];

      if (uniformSetter) {
        let value = uniform;
        let textureUpdate = false;

        if (value instanceof Framebuffer) {
          value = value.texture;
        }

        if (value instanceof Texture) {
          textureUpdate = this.uniforms[uniformName] !== uniform;

          if (textureUpdate) {
            if (uniformSetter.textureIndex === undefined) {
              uniformSetter.textureIndex = this._textureIndexCounter++;
            }

            const texture = value;
            const {
              textureIndex
            } = uniformSetter;
            texture.bind(textureIndex);
            value = textureIndex;
            this._textureUniforms[uniformName] = texture;
          } else {
            value = uniformSetter.textureIndex;
          }
        } else if (this._textureUniforms[uniformName]) {
          delete this._textureUniforms[uniformName];
        }

        if (uniformSetter(value) || textureUpdate) {
          copyUniform(this.uniforms, uniformName, uniform);
        }
      }
    }

    return this;
  }

  _areTexturesRenderable() {
    let texturesRenderable = true;

    for (const uniformName in this._textureUniforms) {
      const texture = this._textureUniforms[uniformName];
      texture.update();
      texturesRenderable = texturesRenderable && texture.loaded;
    }

    return texturesRenderable;
  }

  _bindTextures() {
    for (const uniformName in this._textureUniforms) {
      const textureIndex = this._uniformSetters[uniformName].textureIndex;

      this._textureUniforms[uniformName].bind(textureIndex);
    }
  }

  _createHandle() {
    return this.gl.createProgram();
  }

  _deleteHandle() {
    this.gl.deleteProgram(this.handle);
  }

  _getOptionsFromHandle(handle) {
    const shaderHandles = this.gl.getAttachedShaders(handle);
    const opts = {};

    for (const shaderHandle of shaderHandles) {
      const type = this.gl.getShaderParameter(this.handle, 35663);

      switch (type) {
        case 35633:
          opts.vs = new VertexShader({
            handle: shaderHandle
          });
          break;

        case 35632:
          opts.fs = new FragmentShader({
            handle: shaderHandle
          });
          break;
      }
    }

    return opts;
  }

  _getParameter(pname) {
    return this.gl.getProgramParameter(this.handle, pname);
  }

  _setId(id) {
    if (!id) {
      const programName = this._getName();

      this.id = uid(programName);
    }
  }

  _getName() {
    let programName = this.vs.getName() || this.fs.getName();
    programName = programName.replace(/shader/i, '');
    programName = programName ? `${programName}-program` : 'program';
    return programName;
  }

  _compileAndLink() {
    const {
      gl
    } = this;
    gl.attachShader(this.handle, this.vs.handle);
    gl.attachShader(this.handle, this.fs.handle);
    log$1.time(LOG_PROGRAM_PERF_PRIORITY, `linkProgram for ${this._getName()}`)();
    gl.linkProgram(this.handle);
    log$1.timeEnd(LOG_PROGRAM_PERF_PRIORITY, `linkProgram for ${this._getName()}`)();

    if (gl.debug || log$1.level > 0) {
      const linked = gl.getProgramParameter(this.handle, 35714);

      if (!linked) {
        throw new Error(`Error linking: ${gl.getProgramInfoLog(this.handle)}`);
      }

      gl.validateProgram(this.handle);
      const validated = gl.getProgramParameter(this.handle, 35715);

      if (!validated) {
        throw new Error(`Error validating: ${gl.getProgramInfoLog(this.handle)}`);
      }
    }
  }

  _readUniformLocationsFromLinkedProgram() {
    const {
      gl
    } = this;
    this._uniformSetters = {};
    this._uniformCount = this._getParameter(35718);

    for (let i = 0; i < this._uniformCount; i++) {
      const info = this.gl.getActiveUniform(this.handle, i);
      const {
        name
      } = parseUniformName(info.name);
      let location = gl.getUniformLocation(this.handle, name);
      this._uniformSetters[name] = getUniformSetter(gl, location, info);

      if (info.size > 1) {
        for (let l = 0; l < info.size; l++) {
          location = gl.getUniformLocation(this.handle, `${name}[${l}]`);
          this._uniformSetters[`${name}[${l}]`] = getUniformSetter(gl, location, info);
        }
      }
    }

    this._textureIndexCounter = 0;
  }

  getActiveUniforms(uniformIndices, pname) {
    return this.gl2.getActiveUniforms(this.handle, uniformIndices, pname);
  }

  getUniformBlockIndex(blockName) {
    return this.gl2.getUniformBlockIndex(this.handle, blockName);
  }

  getActiveUniformBlockParameter(blockIndex, pname) {
    return this.gl2.getActiveUniformBlockParameter(this.handle, blockIndex, pname);
  }

  uniformBlockBinding(blockIndex, blockBinding) {
    this.gl2.uniformBlockBinding(this.handle, blockIndex, blockBinding);
  }

}

class TransformFeedback extends Resource {
  static isSupported(gl) {
    return isWebGL2$1(gl);
  }

  constructor(gl, props = {}) {
    assertWebGL2Context(gl);
    super(gl, props);
    this.initialize(props);
    this.stubRemovedMethods('TransformFeedback', 'v6.0', ['pause', 'resume']);
    Object.seal(this);
  }

  initialize(props = {}) {
    this.buffers = {};
    this.unused = {};
    this.configuration = null;
    this.bindOnUse = true;

    if (!isObjectEmpty(this.buffers)) {
      this.bind(() => this._unbindBuffers());
    }

    this.setProps(props);
    return this;
  }

  setProps(props) {
    if ('program' in props) {
      this.configuration = props.program && props.program.configuration;
    }

    if ('configuration' in props) {
      this.configuration = props.configuration;
    }

    if ('bindOnUse' in props) {
      props = props.bindOnUse;
    }

    if ('buffers' in props) {
      this.setBuffers(props.buffers);
    }
  }

  setBuffers(buffers = {}) {
    this.bind(() => {
      for (const bufferName in buffers) {
        this.setBuffer(bufferName, buffers[bufferName]);
      }
    });
    return this;
  }

  setBuffer(locationOrName, bufferOrParams) {
    const location = this._getVaryingIndex(locationOrName);

    const {
      buffer,
      byteSize,
      byteOffset
    } = this._getBufferParams(bufferOrParams);

    if (location < 0) {
      this.unused[locationOrName] = buffer;
      log$1.warn(() => `${this.id} unused varying buffer ${locationOrName}`)();
      return this;
    }

    this.buffers[location] = bufferOrParams;

    if (!this.bindOnUse) {
      this._bindBuffer(location, buffer, byteOffset, byteSize);
    }

    return this;
  }

  begin(primitiveMode = 0) {
    this.gl.bindTransformFeedback(36386, this.handle);

    this._bindBuffers();

    this.gl.beginTransformFeedback(primitiveMode);
    return this;
  }

  end() {
    this.gl.endTransformFeedback();

    this._unbindBuffers();

    this.gl.bindTransformFeedback(36386, null);
    return this;
  }

  _getBufferParams(bufferOrParams) {
    let byteOffset;
    let byteSize;
    let buffer;

    if (bufferOrParams instanceof Buffer === false) {
      buffer = bufferOrParams.buffer;
      byteSize = bufferOrParams.byteSize;
      byteOffset = bufferOrParams.byteOffset;
    } else {
      buffer = bufferOrParams;
    }

    if (byteOffset !== undefined || byteSize !== undefined) {
      byteOffset = byteOffset || 0;
      byteSize = byteSize || buffer.byteLength - byteOffset;
    }

    return {
      buffer,
      byteOffset,
      byteSize
    };
  }

  _getVaryingInfo(locationOrName) {
    return this.configuration && this.configuration.getVaryingInfo(locationOrName);
  }

  _getVaryingIndex(locationOrName) {
    if (this.configuration) {
      return this.configuration.getVaryingInfo(locationOrName).location;
    }

    const location = Number(locationOrName);
    return Number.isFinite(location) ? location : -1;
  }

  _bindBuffers() {
    if (this.bindOnUse) {
      for (const bufferIndex in this.buffers) {
        const {
          buffer,
          byteSize,
          byteOffset
        } = this._getBufferParams(this.buffers[bufferIndex]);

        this._bindBuffer(bufferIndex, buffer, byteOffset, byteSize);
      }
    }
  }

  _unbindBuffers() {
    if (this.bindOnUse) {
      for (const bufferIndex in this.buffers) {
        this._bindBuffer(bufferIndex, null);
      }
    }
  }

  _bindBuffer(index, buffer, byteOffset = 0, byteSize) {
    const handle = buffer && buffer.handle;

    if (!handle || byteSize === undefined) {
      this.gl.bindBufferBase(35982, index, handle);
    } else {
      this.gl.bindBufferRange(35982, index, handle, byteOffset, byteSize);
    }

    return this;
  }

  _createHandle() {
    return this.gl.createTransformFeedback();
  }

  _deleteHandle() {
    this.gl.deleteTransformFeedback(this.handle);
  }

  _bindHandle(handle) {
    this.gl.bindTransformFeedback(36386, this.handle);
  }

}

let arrayBuffer = null;
function getScratchArrayBuffer(byteLength) {
  if (!arrayBuffer || arrayBuffer.byteLength < byteLength) {
    arrayBuffer = new ArrayBuffer(byteLength);
  }

  return arrayBuffer;
}
function getScratchArray(Type, length) {
  const scratchArrayBuffer = getScratchArrayBuffer(Type.BYTES_PER_ELEMENT * length);
  return new Type(scratchArrayBuffer, 0, length);
}
function fillArray$1({
  target,
  source,
  start = 0,
  count = 1
}) {
  const length = source.length;
  const total = count * length;
  let copied = 0;

  for (let i = start; copied < length; copied++) {
    target[i++] = source[copied];
  }

  while (copied < total) {
    if (copied < total - copied) {
      target.copyWithin(start + copied, start, start + copied);
      copied *= 2;
    } else {
      target.copyWithin(start + copied, start, start + total - copied);
      copied = total;
    }
  }

  return target;
}

const ERR_ELEMENTS = 'elements must be GL.ELEMENT_ARRAY_BUFFER';
class VertexArrayObject extends Resource {
  static isSupported(gl, options = {}) {
    if (options.constantAttributeZero) {
      return isWebGL2$1(gl) || getBrowser() === 'Chrome';
    }

    return true;
  }

  static getDefaultArray(gl) {
    gl.luma = gl.luma || {};

    if (!gl.luma.defaultVertexArray) {
      gl.luma.defaultVertexArray = new VertexArrayObject(gl, {
        handle: null,
        isDefaultArray: true
      });
    }

    return gl.luma.defaultVertexArray;
  }

  static getMaxAttributes(gl) {
    VertexArrayObject.MAX_ATTRIBUTES = VertexArrayObject.MAX_ATTRIBUTES || gl.getParameter(34921);
    return VertexArrayObject.MAX_ATTRIBUTES;
  }

  static setConstant(gl, location, array) {
    switch (array.constructor) {
      case Float32Array:
        VertexArrayObject._setConstantFloatArray(gl, location, array);

        break;

      case Int32Array:
        VertexArrayObject._setConstantIntArray(gl, location, array);

        break;

      case Uint32Array:
        VertexArrayObject._setConstantUintArray(gl, location, array);

        break;

      default:
        assert$1(false);
    }
  }

  constructor(gl, opts = {}) {
    const id = opts.id || opts.program && opts.program.id;
    super(gl, Object.assign({}, opts, {
      id
    }));
    this.buffer = null;
    this.bufferValue = null;
    this.isDefaultArray = opts.isDefaultArray || false;
    this.gl2 = gl;
    this.initialize(opts);
    Object.seal(this);
  }

  delete() {
    super.delete();

    if (this.buffer) {
      this.buffer.delete();
    }

    return this;
  }

  get MAX_ATTRIBUTES() {
    return VertexArrayObject.getMaxAttributes(this.gl);
  }

  initialize(props = {}) {
    return this.setProps(props);
  }

  setProps(props) {
    return this;
  }

  setElementBuffer(elementBuffer = null, opts = {}) {
    assert$1(!elementBuffer || elementBuffer.target === 34963, ERR_ELEMENTS);
    this.bind(() => {
      this.gl.bindBuffer(34963, elementBuffer ? elementBuffer.handle : null);
    });
    return this;
  }

  setBuffer(location, buffer, accessor) {
    if (buffer.target === 34963) {
      return this.setElementBuffer(buffer, accessor);
    }

    const {
      size,
      type,
      stride,
      offset,
      normalized,
      integer,
      divisor
    } = accessor;
    const {
      gl,
      gl2
    } = this;
    location = Number(location);
    this.bind(() => {
      gl.bindBuffer(34962, buffer.handle);

      if (integer) {
        assert$1(isWebGL2$1(gl));
        gl2.vertexAttribIPointer(location, size, type, stride, offset);
      } else {
        gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
      }

      gl.enableVertexAttribArray(location);
      gl2.vertexAttribDivisor(location, divisor || 0);
    });
    return this;
  }

  enable(location, enable = true) {
    const disablingAttributeZero = !enable && location === 0 && !VertexArrayObject.isSupported(this.gl, {
      constantAttributeZero: true
    });

    if (!disablingAttributeZero) {
      location = Number(location);
      this.bind(() => enable ? this.gl.enableVertexAttribArray(location) : this.gl.disableVertexAttribArray(location));
    }

    return this;
  }

  getConstantBuffer(elementCount, value) {
    const constantValue = this._normalizeConstantArrayValue(value);

    const byteLength = constantValue.byteLength * elementCount;
    const length = constantValue.length * elementCount;
    let updateNeeded = !this.buffer;
    this.buffer = this.buffer || new Buffer(this.gl, byteLength);
    updateNeeded = updateNeeded || this.buffer.reallocate(byteLength);
    updateNeeded = updateNeeded || !this._compareConstantArrayValues(constantValue, this.bufferValue);

    if (updateNeeded) {
      const typedArray = getScratchArray(value.constructor, length);
      fillArray$1({
        target: typedArray,
        source: constantValue,
        start: 0,
        count: length
      });
      this.buffer.subData(typedArray);
      this.bufferValue = value;
    }

    return this.buffer;
  }

  _normalizeConstantArrayValue(arrayValue) {
    if (Array.isArray(arrayValue)) {
      return new Float32Array(arrayValue);
    }

    return arrayValue;
  }

  _compareConstantArrayValues(v1, v2) {
    if (!v1 || !v2 || v1.length !== v2.length || v1.constructor !== v2.constructor) {
      return false;
    }

    for (let i = 0; i < v1.length; ++i) {
      if (v1[i] !== v2[i]) {
        return false;
      }
    }

    return true;
  }

  static _setConstantFloatArray(gl, location, array) {
    switch (array.length) {
      case 1:
        gl.vertexAttrib1fv(location, array);
        break;

      case 2:
        gl.vertexAttrib2fv(location, array);
        break;

      case 3:
        gl.vertexAttrib3fv(location, array);
        break;

      case 4:
        gl.vertexAttrib4fv(location, array);
        break;

      default:
        assert$1(false);
    }
  }

  static _setConstantIntArray(gl, location, array) {
    assert$1(isWebGL2$1(gl));

    switch (array.length) {
      case 1:
        gl.vertexAttribI1iv(location, array);
        break;

      case 2:
        gl.vertexAttribI2iv(location, array);
        break;

      case 3:
        gl.vertexAttribI3iv(location, array);
        break;

      case 4:
        gl.vertexAttribI4iv(location, array);
        break;

      default:
        assert$1(false);
    }
  }

  static _setConstantUintArray(gl, location, array) {
    assert$1(isWebGL2$1(gl));

    switch (array.length) {
      case 1:
        gl.vertexAttribI1uiv(location, array);
        break;

      case 2:
        gl.vertexAttribI2uiv(location, array);
        break;

      case 3:
        gl.vertexAttribI3uiv(location, array);
        break;

      case 4:
        gl.vertexAttribI4uiv(location, array);
        break;

      default:
        assert$1(false);
    }
  }

  _createHandle() {
    const gl2 = this.gl;
    return gl2.createVertexArray();
  }

  _deleteHandle(handle) {
    this.gl2.deleteVertexArray(handle);
    return [this.elements];
  }

  _bindHandle(handle) {
    this.gl2.bindVertexArray(handle);
  }

  _getParameter(pname, {
    location
  }) {
    assert$1(Number.isFinite(location));
    return this.bind(() => {
      switch (pname) {
        case 34373:
          return this.gl.getVertexAttribOffset(location, pname);

        default:
          return this.gl.getVertexAttrib(location, pname);
      }
    });
  }

}

const ERR_ATTRIBUTE_TYPE = 'VertexArray: attributes must be Buffers or constants (i.e. typed array)';
const MULTI_LOCATION_ATTRIBUTE_REGEXP = /^(.+)__LOCATION_([0-9]+)$/;
const DEPRECATIONS_V6 = ['setBuffers', 'setGeneric', 'clearBindings', 'setLocations', 'setGenericValues', 'setDivisor', 'enable', 'disable'];
class VertexArray {
  constructor(gl, opts = {}) {
    const id = opts.id || opts.program && opts.program.id;
    this.id = id;
    this.gl = gl;
    this.configuration = null;
    this.elements = null;
    this.elementsAccessor = null;
    this.values = null;
    this.accessors = null;
    this.unused = null;
    this.drawParams = null;
    this.buffer = null;
    this.attributes = {};
    this.vertexArrayObject = new VertexArrayObject(gl);
    stubRemovedMethods(this, 'VertexArray', 'v6.0', DEPRECATIONS_V6);
    this.initialize(opts);
    Object.seal(this);
  }

  delete() {
    if (this.buffer) {
      this.buffer.delete();
    }

    this.vertexArrayObject.delete();
  }

  initialize(props = {}) {
    this.reset();
    this.configuration = null;
    this.bindOnUse = false;
    return this.setProps(props);
  }

  reset() {
    this.elements = null;
    this.elementsAccessor = null;
    const {
      MAX_ATTRIBUTES
    } = this.vertexArrayObject;
    this.values = new Array(MAX_ATTRIBUTES).fill(null);
    this.accessors = new Array(MAX_ATTRIBUTES).fill(null);
    this.unused = {};
    this.drawParams = null;
    return this;
  }

  setProps(props) {
    if ('program' in props) {
      this.configuration = props.program && props.program.configuration;
    }

    if ('configuration' in props) {
      this.configuration = props.configuration;
    }

    if ('attributes' in props) {
      this.setAttributes(props.attributes);
    }

    if ('elements' in props) {
      this.setElementBuffer(props.elements);
    }

    if ('bindOnUse' in props) {
      props = props.bindOnUse;
    }

    return this;
  }

  clearDrawParams() {
    this.drawParams = null;
  }

  getDrawParams() {
    this.drawParams = this.drawParams || this._updateDrawParams();
    return this.drawParams;
  }

  setAttributes(attributes) {
    Object.assign(this.attributes, attributes);
    this.vertexArrayObject.bind(() => {
      for (const locationOrName in attributes) {
        const value = attributes[locationOrName];

        this._setAttribute(locationOrName, value);
      }

      this.gl.bindBuffer(34962, null);
    });
    return this;
  }

  setElementBuffer(elementBuffer = null, accessor = {}) {
    this.elements = elementBuffer;
    this.elementsAccessor = accessor;
    this.clearDrawParams();
    this.vertexArrayObject.setElementBuffer(elementBuffer, accessor);
    return this;
  }

  setBuffer(locationOrName, buffer, appAccessor = {}) {
    if (buffer.target === 34963) {
      return this.setElementBuffer(buffer, appAccessor);
    }

    const {
      location,
      accessor
    } = this._resolveLocationAndAccessor(locationOrName, buffer, buffer.accessor, appAccessor);

    if (location >= 0) {
      this.values[location] = buffer;
      this.accessors[location] = accessor;
      this.clearDrawParams();
      this.vertexArrayObject.setBuffer(location, buffer, accessor);
    }

    return this;
  }

  setConstant(locationOrName, arrayValue, appAccessor = {}) {
    const {
      location,
      accessor
    } = this._resolveLocationAndAccessor(locationOrName, arrayValue, Object.assign({
      size: arrayValue.length
    }, appAccessor));

    if (location >= 0) {
      arrayValue = this.vertexArrayObject._normalizeConstantArrayValue(arrayValue);
      this.values[location] = arrayValue;
      this.accessors[location] = accessor;
      this.clearDrawParams();
      this.vertexArrayObject.enable(location, false);
    }

    return this;
  }

  unbindBuffers() {
    this.vertexArrayObject.bind(() => {
      if (this.elements) {
        this.vertexArrayObject.setElementBuffer(null);
      }

      this.buffer = this.buffer || new Buffer(this.gl, {
        accessor: {
          size: 4
        }
      });

      for (let location = 0; location < this.vertexArrayObject.MAX_ATTRIBUTES; location++) {
        if (this.values[location] instanceof Buffer) {
          this.gl.disableVertexAttribArray(location);
          this.gl.bindBuffer(34962, this.buffer.handle);
          this.gl.vertexAttribPointer(location, 1, 5126, false, 0, 0);
        }
      }
    });
    return this;
  }

  bindBuffers() {
    this.vertexArrayObject.bind(() => {
      if (this.elements) {
        this.setElementBuffer(this.elements);
      }

      for (let location = 0; location < this.vertexArrayObject.MAX_ATTRIBUTES; location++) {
        const buffer = this.values[location];

        if (buffer instanceof Buffer) {
          this.setBuffer(location, buffer);
        }
      }
    });
    return this;
  }

  bindForDraw(vertexCount, instanceCount, func) {
    let value;
    this.vertexArrayObject.bind(() => {
      this._setConstantAttributes(vertexCount, instanceCount);

      value = func();
    });
    return value;
  }

  _resolveLocationAndAccessor(locationOrName, value, valueAccessor, appAccessor) {
    const INVALID_RESULT = {
      location: -1,
      accessor: null
    };

    const {
      location,
      name
    } = this._getAttributeIndex(locationOrName);

    if (!Number.isFinite(location) || location < 0) {
      this.unused[locationOrName] = value;
      log$1.once(3, () => `unused value ${locationOrName} in ${this.id}`)();
      return INVALID_RESULT;
    }

    const accessInfo = this._getAttributeInfo(name || location);

    if (!accessInfo) {
      return INVALID_RESULT;
    }

    const currentAccessor = this.accessors[location] || {};
    const accessor = Accessor.resolve(accessInfo.accessor, currentAccessor, valueAccessor, appAccessor);
    const {
      size,
      type
    } = accessor;
    assert$1(Number.isFinite(size) && Number.isFinite(type));
    return {
      location,
      accessor
    };
  }

  _getAttributeInfo(attributeName) {
    return this.configuration && this.configuration.getAttributeInfo(attributeName);
  }

  _getAttributeIndex(locationOrName) {
    const location = Number(locationOrName);

    if (Number.isFinite(location)) {
      return {
        location
      };
    }

    const multiLocation = MULTI_LOCATION_ATTRIBUTE_REGEXP.exec(locationOrName);
    const name = multiLocation ? multiLocation[1] : locationOrName;
    const locationOffset = multiLocation ? Number(multiLocation[2]) : 0;

    if (this.configuration) {
      return {
        location: this.configuration.getAttributeLocation(name) + locationOffset,
        name
      };
    }

    return {
      location: -1
    };
  }

  _setAttribute(locationOrName, value) {
    if (value instanceof Buffer) {
      this.setBuffer(locationOrName, value);
    } else if (Array.isArray(value) && value.length && value[0] instanceof Buffer) {
      const buffer = value[0];
      const accessor = value[1];
      this.setBuffer(locationOrName, buffer, accessor);
    } else if (ArrayBuffer.isView(value) || Array.isArray(value)) {
      const constant = value;
      this.setConstant(locationOrName, constant);
    } else if (value.buffer instanceof Buffer) {
      const accessor = value;
      this.setBuffer(locationOrName, accessor.buffer, accessor);
    } else {
      throw new Error(ERR_ATTRIBUTE_TYPE);
    }
  }

  _setConstantAttributes(vertexCount, instanceCount) {
    const elementCount = Math.max(vertexCount | 0, instanceCount | 0);
    let constant = this.values[0];

    if (ArrayBuffer.isView(constant)) {
      this._setConstantAttributeZero(constant, elementCount);
    }

    for (let location = 1; location < this.vertexArrayObject.MAX_ATTRIBUTES; location++) {
      constant = this.values[location];

      if (ArrayBuffer.isView(constant)) {
        this._setConstantAttribute(location, constant);
      }
    }
  }

  _setConstantAttributeZero(constant, elementCount) {
    if (VertexArrayObject.isSupported(this.gl, {
      constantAttributeZero: true
    })) {
      this._setConstantAttribute(0, constant);

      return;
    }

    const buffer = this.vertexArrayObject.getConstantBuffer(elementCount, constant);
    this.vertexArrayObject.setBuffer(0, buffer, this.accessors[0]);
  }

  _setConstantAttribute(location, constant) {
    VertexArrayObject.setConstant(this.gl, location, constant);
  }

  _updateDrawParams() {
    const drawParams = {
      isIndexed: false,
      isInstanced: false,
      indexCount: Infinity,
      vertexCount: Infinity,
      instanceCount: Infinity
    };

    for (let location = 0; location < this.vertexArrayObject.MAX_ATTRIBUTES; location++) {
      this._updateDrawParamsForLocation(drawParams, location);
    }

    if (this.elements) {
      drawParams.elementCount = this.elements.getElementCount(this.elements.accessor);
      drawParams.isIndexed = true;
      drawParams.indexType = this.elementsAccessor.type || this.elements.accessor.type;
      drawParams.indexOffset = this.elementsAccessor.offset || 0;
    }

    if (drawParams.indexCount === Infinity) {
      drawParams.indexCount = 0;
    }

    if (drawParams.vertexCount === Infinity) {
      drawParams.vertexCount = 0;
    }

    if (drawParams.instanceCount === Infinity) {
      drawParams.instanceCount = 0;
    }

    return drawParams;
  }

  _updateDrawParamsForLocation(drawParams, location) {
    const value = this.values[location];
    const accessor = this.accessors[location];

    if (!value) {
      return;
    }

    const {
      divisor
    } = accessor;
    const isInstanced = divisor > 0;
    drawParams.isInstanced = drawParams.isInstanced || isInstanced;

    if (value instanceof Buffer) {
      const buffer = value;

      if (isInstanced) {
        const instanceCount = buffer.getVertexCount(accessor);
        drawParams.instanceCount = Math.min(drawParams.instanceCount, instanceCount);
      } else {
        const vertexCount = buffer.getVertexCount(accessor);
        drawParams.vertexCount = Math.min(drawParams.vertexCount, vertexCount);
      }
    }
  }

  setElements(elementBuffer = null, accessor = {}) {
    log$1.deprecated('setElements', 'setElementBuffer')();
    return this.setElementBuffer(elementBuffer, accessor);
  }

}

function formatArrayValue(v, opts) {
  const {
    maxElts = 16,
    size = 1
  } = opts;
  let string = '[';

  for (let i = 0; i < v.length && i < maxElts; ++i) {
    if (i > 0) {
      string += `,${i % size === 0 ? ' ' : ''}`;
    }

    string += formatValue(v[i], opts);
  }

  const terminator = v.length > maxElts ? '...' : ']';
  return `${string}${terminator}`;
}

function formatValue(v, opts = {}) {
  const EPSILON = 1e-16;
  const {
    isInteger = false
  } = opts;

  if (Array.isArray(v) || ArrayBuffer.isView(v)) {
    return formatArrayValue(v, opts);
  }

  if (!Number.isFinite(v)) {
    return String(v);
  }

  if (Math.abs(v) < EPSILON) {
    return isInteger ? '0' : '0.';
  }

  if (isInteger) {
    return v.toFixed(0);
  }

  if (Math.abs(v) > 100 && Math.abs(v) < 10000) {
    return v.toFixed(0);
  }

  const string = v.toPrecision(2);
  const decimal = string.indexOf('.0');
  return decimal === string.length - 2 ? string.slice(0, -1) : string;
}

function getDebugTableForUniforms({
  header = 'Uniforms',
  program,
  uniforms,
  undefinedOnly = false
}) {
  assert$1(program);
  const SHADER_MODULE_UNIFORM_REGEXP = '.*_.*';
  const PROJECT_MODULE_UNIFORM_REGEXP = '.*Matrix';
  const uniformLocations = program._uniformSetters;
  const table = {};
  const uniformNames = Object.keys(uniformLocations).sort();
  let count = 0;

  for (const uniformName of uniformNames) {
    if (!uniformName.match(SHADER_MODULE_UNIFORM_REGEXP) && !uniformName.match(PROJECT_MODULE_UNIFORM_REGEXP)) {
      if (addUniformToTable({
        table,
        header,
        uniforms,
        uniformName,
        undefinedOnly
      })) {
        count++;
      }
    }
  }

  for (const uniformName of uniformNames) {
    if (uniformName.match(PROJECT_MODULE_UNIFORM_REGEXP)) {
      if (addUniformToTable({
        table,
        header,
        uniforms,
        uniformName,
        undefinedOnly
      })) {
        count++;
      }
    }
  }

  for (const uniformName of uniformNames) {
    if (!table[uniformName]) {
      if (addUniformToTable({
        table,
        header,
        uniforms,
        uniformName,
        undefinedOnly
      })) {
        count++;
      }
    }
  }

  let unusedCount = 0;
  const unusedTable = {};

  if (!undefinedOnly) {
    for (const uniformName in uniforms) {
      const uniform = uniforms[uniformName];

      if (!table[uniformName]) {
        unusedCount++;
        unusedTable[uniformName] = {
          Type: `NOT USED: ${uniform}`,
          [header]: formatValue(uniform)
        };
      }
    }
  }

  return {
    table,
    count,
    unusedTable,
    unusedCount
  };
}

function addUniformToTable({
  table,
  header,
  uniforms,
  uniformName,
  undefinedOnly
}) {
  const value = uniforms[uniformName];
  const isDefined = isUniformDefined(value);

  if (!undefinedOnly || !isDefined) {
    table[uniformName] = {
      [header]: isDefined ? formatValue(value) : 'N/A',
      'Uniform Type': isDefined ? value : 'NOT PROVIDED'
    };
    return true;
  }

  return false;
}

function isUniformDefined(value) {
  return value !== undefined && value !== null;
}

function getDebugTableForVertexArray({
  vertexArray,
  header = 'Attributes'
}) {
  if (!vertexArray.configuration) {
    return {};
  }

  const table = {};

  if (vertexArray.elements) {
    table.ELEMENT_ARRAY_BUFFER = getDebugTableRow(vertexArray, vertexArray.elements, null, header);
  }

  const attributes = vertexArray.values;

  for (const attributeLocation in attributes) {
    const info = vertexArray._getAttributeInfo(attributeLocation);

    if (info) {
      let rowHeader = `${attributeLocation}: ${info.name}`;
      const accessor = vertexArray.accessors[info.location];

      if (accessor) {
        rowHeader = `${attributeLocation}: ${getGLSLDeclaration$1(info.name, accessor)}`;
      }

      table[rowHeader] = getDebugTableRow(vertexArray, attributes[attributeLocation], accessor, header);
    }
  }

  return table;
}

function getDebugTableRow(vertexArray, attribute, accessor, header) {
  const {
    gl
  } = vertexArray;

  if (!attribute) {
    return {
      [header]: 'null',
      'Format ': 'N/A'
    };
  }

  let type = 'NOT PROVIDED';
  let size = 1;
  let verts = 0;
  let bytes = 0;
  let isInteger;
  let marker;
  let value;

  if (accessor) {
    type = accessor.type;
    size = accessor.size;
    type = String(type).replace('Array', '');
    isInteger = type.indexOf('nt') !== -1;
  }

  if (attribute instanceof Buffer) {
    const buffer = attribute;
    const {
      data,
      changed
    } = buffer.getDebugData();
    marker = changed ? '*' : '';
    value = data;
    bytes = buffer.byteLength;
    verts = bytes / data.BYTES_PER_ELEMENT / size;
    let format;

    if (accessor) {
      const instanced = accessor.divisor > 0;
      format = `${instanced ? 'I ' : 'P '} ${verts} (x${size}=${bytes} bytes ${getKey(gl, type)})`;
    } else {
      isInteger = true;
      format = `${bytes} bytes`;
    }

    return {
      [header]: `${marker}${formatValue(value, {
        size,
        isInteger
      })}`,
      'Format ': format
    };
  }

  value = attribute;
  size = attribute.length;
  type = String(attribute.constructor.name).replace('Array', '');
  isInteger = type.indexOf('nt') !== -1;
  return {
    [header]: `${formatValue(value, {
      size,
      isInteger
    })} (constant)`,
    'Format ': `${size}x${type} (constant)`
  };
}

function getGLSLDeclaration$1(name, accessor) {
  const {
    type,
    size
  } = accessor;
  const typeAndName = getCompositeGLType(type, size);
  return typeAndName ? `${name} (${typeAndName.name})` : name;
}

function getDebugTableForProgramConfiguration(config) {
  const table = {};
  const header = `Accessors for ${config.id}`;

  for (const attributeInfo of config.attributeInfos) {
    if (attributeInfo) {
      const glslDeclaration = getGLSLDeclaration(attributeInfo);
      table[`in ${glslDeclaration}`] = {
        [header]: JSON.stringify(attributeInfo.accessor)
      };
    }
  }

  for (const varyingInfo of config.varyingInfos) {
    if (varyingInfo) {
      const glslDeclaration = getGLSLDeclaration(varyingInfo);
      table[`out ${glslDeclaration}`] = {
        [header]: JSON.stringify(varyingInfo.accessor)
      };
    }
  }

  return table;
}

function getGLSLDeclaration(attributeInfo) {
  const {
    type,
    size
  } = attributeInfo.accessor;
  const typeAndName = getCompositeGLType(type, size);

  if (typeAndName) {
    return `${typeAndName.name} ${attributeInfo.name}`;
  }

  return attributeInfo.name;
}

const VERTEX_SHADER$1 = 'vs';
const FRAGMENT_SHADER$1 = 'fs';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'shadertools: assertion failed.');
  }
}

const TYPE_DEFINITIONS$1 = {
  number: {
    validate(value, propType) {
      return Number.isFinite(value) && (!('max' in propType) || value <= propType.max) && (!('min' in propType) || value >= propType.min);
    }

  },
  array: {
    validate(value, propType) {
      return Array.isArray(value) || ArrayBuffer.isView(value);
    }

  }
};
function parsePropTypes$1(propDefs) {
  const propTypes = {};

  for (const propName in propDefs) {
    const propDef = propDefs[propName];
    const propType = parsePropType$1(propDef);
    propTypes[propName] = propType;
  }

  return propTypes;
}

function parsePropType$1(propDef) {
  let type = getTypeOf$1(propDef);

  if (type === 'object') {
    if (!propDef) {
      return {
        type: 'object',
        value: null
      };
    }

    if ('type' in propDef) {
      return Object.assign({}, propDef, TYPE_DEFINITIONS$1[propDef.type]);
    }

    if (!('value' in propDef)) {
      return {
        type: 'object',
        value: propDef
      };
    }

    type = getTypeOf$1(propDef.value);
    return Object.assign({
      type
    }, propDef, TYPE_DEFINITIONS$1[type]);
  }

  return Object.assign({
    type,
    value: propDef
  }, TYPE_DEFINITIONS$1[type]);
}

function getTypeOf$1(value) {
  if (Array.isArray(value) || ArrayBuffer.isView(value)) {
    return 'array';
  }

  return typeof value;
}

const VERTEX_SHADER = 'vs';
const FRAGMENT_SHADER = 'fs';
class ShaderModule {
  constructor({
    name,
    vs,
    fs,
    dependencies = [],
    uniforms,
    getUniforms,
    deprecations = [],
    defines = {},
    inject = {},
    vertexShader,
    fragmentShader
  }) {
    assert(typeof name === 'string');
    this.name = name;
    this.vs = vs || vertexShader;
    this.fs = fs || fragmentShader;
    this.getModuleUniforms = getUniforms;
    this.dependencies = dependencies;
    this.deprecations = this._parseDeprecationDefinitions(deprecations);
    this.defines = defines;
    this.injections = normalizeInjections(inject);

    if (uniforms) {
      this.uniforms = parsePropTypes$1(uniforms);
    }
  }

  getModuleSource(type) {
    let moduleSource;

    switch (type) {
      case VERTEX_SHADER:
        moduleSource = this.vs || '';
        break;

      case FRAGMENT_SHADER:
        moduleSource = this.fs || '';
        break;

      default:
        assert(false);
    }

    return `\
#define MODULE_${this.name.toUpperCase().replace(/[^0-9a-z]/gi, '_')}
${moduleSource}\
// END MODULE_${this.name}

`;
  }

  getUniforms(opts, uniforms) {
    if (this.getModuleUniforms) {
      return this.getModuleUniforms(opts, uniforms);
    }

    if (this.uniforms) {
      return this._defaultGetUniforms(opts);
    }

    return {};
  }

  getDefines() {
    return this.defines;
  }

  checkDeprecations(shaderSource, log) {
    this.deprecations.forEach(def => {
      if (def.regex.test(shaderSource)) {
        if (def.deprecated) {
          log.deprecated(def.old, def.new)();
        } else {
          log.removed(def.old, def.new)();
        }
      }
    });
  }

  _parseDeprecationDefinitions(deprecations) {
    deprecations.forEach(def => {
      switch (def.type) {
        case 'function':
          def.regex = new RegExp(`\\b${def.old}\\(`);
          break;

        default:
          def.regex = new RegExp(`${def.type} ${def.old};`);
      }
    });
    return deprecations;
  }

  _defaultGetUniforms(opts = {}) {
    const uniforms = {};
    const propTypes = this.uniforms;

    for (const key in propTypes) {
      const propDef = propTypes[key];

      if (key in opts && !propDef.private) {
        if (propDef.validate) {
          assert(propDef.validate(opts[key], propDef), `${this.name}: invalid ${key}`);
        }

        uniforms[key] = opts[key];
      } else {
        uniforms[key] = propDef.value;
      }
    }

    return uniforms;
  }

}

function normalizeInjections(injections) {
  const result = {
    vs: {},
    fs: {}
  };

  for (const hook in injections) {
    let injection = injections[hook];
    const stage = hook.slice(0, 2);

    if (typeof injection === 'string') {
      injection = {
        order: 0,
        injection
      };
    }

    result[stage][hook] = injection;
  }

  return result;
}

function resolveModules(modules) {
  return getShaderDependencies(instantiateModules(modules));
}

function getShaderDependencies(modules) {
  const moduleMap = {};
  const moduleDepth = {};
  getDependencyGraph({
    modules,
    level: 0,
    moduleMap,
    moduleDepth
  });
  return Object.keys(moduleDepth).sort((a, b) => moduleDepth[b] - moduleDepth[a]).map(name => moduleMap[name]);
}

function getDependencyGraph({
  modules,
  level,
  moduleMap,
  moduleDepth
}) {
  if (level >= 5) {
    throw new Error('Possible loop in shader dependency graph');
  }

  for (const module of modules) {
    moduleMap[module.name] = module;

    if (moduleDepth[module.name] === undefined || moduleDepth[module.name] < level) {
      moduleDepth[module.name] = level;
    }
  }

  for (const module of modules) {
    if (module.dependencies) {
      getDependencyGraph({
        modules: module.dependencies,
        level: level + 1,
        moduleMap,
        moduleDepth
      });
    }
  }
}

function instantiateModules(modules, seen) {
  return modules.map(module => {
    if (module instanceof ShaderModule) {
      return module;
    }

    assert(typeof module !== 'string', `Shader module use by name is deprecated. Import shader module '${module}' and use it directly.`);
    assert(module.name, 'shader module has no name');
    module = new ShaderModule(module);
    module.dependencies = instantiateModules(module.dependencies);
    return module;
  });
}

function isOldIE(opts = {}) {
  const navigator = typeof window !== 'undefined' ? window.navigator || {} : {};
  const userAgent = opts.userAgent || navigator.userAgent || '';
  const isMSIE = userAgent.indexOf('MSIE ') !== -1;
  const isTrident = userAgent.indexOf('Trident/') !== -1;
  return isMSIE || isTrident;
}

const GL_VENDOR = 0x1f00;
const GL_RENDERER = 0x1f01;
const GL_VERSION = 0x1f02;
const GL_SHADING_LANGUAGE_VERSION = 0x8b8c;
const WEBGL_FEATURES = {
  GLSL_FRAG_DATA: ['WEBGL_draw_buffers', true],
  GLSL_FRAG_DEPTH: ['EXT_frag_depth', true],
  GLSL_DERIVATIVES: ['OES_standard_derivatives', true],
  GLSL_TEXTURE_LOD: ['EXT_shader_texture_lod', true]
};
const FEATURES = {};
Object.keys(WEBGL_FEATURES).forEach(key => {
  FEATURES[key] = key;
});

function isWebGL2(gl) {
  if (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) {
    return true;
  }

  return Boolean(gl && gl._version === 2);
}

function getContextInfo(gl) {
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const vendor = gl.getParameter(info && info.UNMASKED_VENDOR_WEBGL || GL_VENDOR);
  const renderer = gl.getParameter(info && info.UNMASKED_RENDERER_WEBGL || GL_RENDERER);
  const gpuVendor = identifyGPUVendor(vendor, renderer);
  const gpuInfo = {
    gpuVendor,
    vendor,
    renderer,
    version: gl.getParameter(GL_VERSION),
    shadingLanguageVersion: gl.getParameter(GL_SHADING_LANGUAGE_VERSION)
  };
  return gpuInfo;
}

function identifyGPUVendor(vendor, renderer) {
  if (vendor.match(/NVIDIA/i) || renderer.match(/NVIDIA/i)) {
    return 'NVIDIA';
  }

  if (vendor.match(/INTEL/i) || renderer.match(/INTEL/i)) {
    return 'INTEL';
  }

  if (vendor.match(/AMD/i) || renderer.match(/AMD/i) || vendor.match(/ATI/i) || renderer.match(/ATI/i)) {
    return 'AMD';
  }

  return 'UNKNOWN GPU';
}

const compiledGlslExtensions = {};
function canCompileGLGSExtension(gl, cap, opts = {}) {
  const feature = WEBGL_FEATURES[cap];
  assert(feature, cap);

  if (!isOldIE(opts)) {
    return true;
  }

  if (cap in compiledGlslExtensions) {
    return compiledGlslExtensions[cap];
  }

  const extensionName = feature[0];
  const behavior = opts.behavior || 'enable';
  const source = `#extension GL_${extensionName} : ${behavior}\nvoid main(void) {}`;
  const shader = gl.createShader(35633);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const canCompile = gl.getShaderParameter(shader, 35713);
  gl.deleteShader(shader);
  compiledGlslExtensions[cap] = canCompile;
  return canCompile;
}

function getFeature(gl, cap) {
  const feature = WEBGL_FEATURES[cap];
  assert(feature, cap);
  const extensionName = isWebGL2(gl) ? feature[1] || feature[0] : feature[0];
  const value = typeof extensionName === 'string' ? Boolean(gl.getExtension(extensionName)) : extensionName;
  assert(value === false || value === true);
  return value;
}

function hasFeatures(gl, features) {
  features = Array.isArray(features) ? features : [features];
  return features.every(feature => getFeature(gl, feature));
}

function getPlatformShaderDefines(gl) {
  const debugInfo = getContextInfo(gl);

  switch (debugInfo.gpuVendor.toLowerCase()) {
    case 'nvidia':
      return `\
#define NVIDIA_GPU
// Nvidia optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
`;

    case 'intel':
      return `\
#define INTEL_GPU
// Intel optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
// Intel's built-in 'tan' function doesn't have acceptable precision
#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1
// Intel GPU doesn't have full 32 bits precision in same cases, causes overflow
#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1
`;

    case 'amd':
      return `\
#define AMD_GPU
`;

    default:
      return `\
#define DEFAULT_GPU
// Prevent driver from optimizing away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
// Intel's built-in 'tan' function doesn't have acceptable precision
#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1
// Intel GPU doesn't have full 32 bits precision in same cases, causes overflow
#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1
`;
  }
}
function getVersionDefines(gl, glslVersion, isFragment) {
  let versionDefines = `\
#if (__VERSION__ > 120)

# define FEATURE_GLSL_DERIVATIVES
# define FEATURE_GLSL_DRAW_BUFFERS
# define FEATURE_GLSL_FRAG_DEPTH
# define FEATURE_GLSL_TEXTURE_LOD

// DEPRECATED FLAGS, remove in v9
# define FRAG_DEPTH
# define DERIVATIVES
# define DRAW_BUFFERS
# define TEXTURE_LOD

#endif // __VERSION
`;

  if (hasFeatures(gl, FEATURES.GLSL_FRAG_DEPTH)) {
    versionDefines += `\

// FRAG_DEPTH => gl_FragDepth is available
#ifdef GL_EXT_frag_depth
#extension GL_EXT_frag_depth : enable
# define FEATURE_GLSL_FRAG_DEPTH
# define FRAG_DEPTH
# define gl_FragDepth gl_FragDepthEXT
#endif
`;
  }

  if (hasFeatures(gl, FEATURES.GLSL_DERIVATIVES) && canCompileGLGSExtension(gl, FEATURES.GLSL_DERIVATIVES)) {
    versionDefines += `\

// DERIVATIVES => dxdF, dxdY and fwidth are available
#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
# define FEATURE_GLSL_DERIVATIVES
# define DERIVATIVES
#endif
`;
  }

  if (hasFeatures(gl, FEATURES.GLSL_FRAG_DATA) && canCompileGLGSExtension(gl, FEATURES.GLSL_FRAG_DATA, {
    behavior: 'require'
  })) {
    versionDefines += `\

// DRAW_BUFFERS => gl_FragData[] is available
#ifdef GL_EXT_draw_buffers
#extension GL_EXT_draw_buffers : require
#define FEATURE_GLSL_DRAW_BUFFERS
#define DRAW_BUFFERS
#endif
`;
  }

  if (hasFeatures(gl, FEATURES.GLSL_TEXTURE_LOD)) {
    versionDefines += `\
// TEXTURE_LOD => texture2DLod etc are available
#ifdef GL_EXT_shader_texture_lod
#extension GL_EXT_shader_texture_lod : enable

# define FEATURE_GLSL_TEXTURE_LOD
# define TEXTURE_LOD

#endif
`;
  }

  return versionDefines;
}

const MODULE_INJECTORS_VS = `\
#ifdef MODULE_LOGDEPTH
  logdepth_adjustPosition(gl_Position);
#endif
`;
const MODULE_INJECTORS_FS = `\
#ifdef MODULE_MATERIAL
  gl_FragColor = material_filterColor(gl_FragColor);
#endif

#ifdef MODULE_LIGHTING
  gl_FragColor = lighting_filterColor(gl_FragColor);
#endif

#ifdef MODULE_FOG
  gl_FragColor = fog_filterColor(gl_FragColor);
#endif

#ifdef MODULE_PICKING
  gl_FragColor = picking_filterHighlightColor(gl_FragColor);
  gl_FragColor = picking_filterPickingColor(gl_FragColor);
#endif

#ifdef MODULE_LOGDEPTH
  logdepth_setFragDepth();
#endif
`;

const MODULE_INJECTORS = {
  [VERTEX_SHADER$1]: MODULE_INJECTORS_VS,
  [FRAGMENT_SHADER$1]: MODULE_INJECTORS_FS
};
const DECLARATION_INJECT_MARKER = '__LUMA_INJECT_DECLARATIONS__';
const REGEX_START_OF_MAIN$1 = /void\s+main\s*\([^)]*\)\s*\{\n?/;
const REGEX_END_OF_MAIN = /}\n?[^{}]*$/;
const fragments = [];
function injectShader(source, type, inject, injectStandardStubs = false) {
  const isVertex = type === VERTEX_SHADER$1;

  for (const key in inject) {
    const fragmentData = inject[key];
    fragmentData.sort((a, b) => a.order - b.order);
    fragments.length = fragmentData.length;

    for (let i = 0, len = fragmentData.length; i < len; ++i) {
      fragments[i] = fragmentData[i].injection;
    }

    const fragmentString = `${fragments.join('\n')}\n`;

    switch (key) {
      case 'vs:#decl':
        if (isVertex) {
          source = source.replace(DECLARATION_INJECT_MARKER, fragmentString);
        }

        break;

      case 'vs:#main-start':
        if (isVertex) {
          source = source.replace(REGEX_START_OF_MAIN$1, match => match + fragmentString);
        }

        break;

      case 'vs:#main-end':
        if (isVertex) {
          source = source.replace(REGEX_END_OF_MAIN, match => fragmentString + match);
        }

        break;

      case 'fs:#decl':
        if (!isVertex) {
          source = source.replace(DECLARATION_INJECT_MARKER, fragmentString);
        }

        break;

      case 'fs:#main-start':
        if (!isVertex) {
          source = source.replace(REGEX_START_OF_MAIN$1, match => match + fragmentString);
        }

        break;

      case 'fs:#main-end':
        if (!isVertex) {
          source = source.replace(REGEX_END_OF_MAIN, match => fragmentString + match);
        }

        break;

      default:
        source = source.replace(key, match => match + fragmentString);
    }
  }

  source = source.replace(DECLARATION_INJECT_MARKER, '');

  if (injectStandardStubs) {
    source = source.replace(/\}\s*$/, match => match + MODULE_INJECTORS[type]);
  }

  return source;
}
function combineInjects(injects) {
  const result = {};
  assert(Array.isArray(injects) && injects.length > 1);
  injects.forEach(inject => {
    for (const key in inject) {
      result[key] = result[key] ? `${result[key]}\n${inject[key]}` : inject[key];
    }
  });
  return result;
}

function testVariable(qualifier) {
  return new RegExp(`\\b${qualifier}[ \\t]+(\\w+[ \\t]+\\w+(\\[\\w+\\])?;)`, 'g');
}

const ES300_REPLACEMENTS = [[/^(#version[ \t]+(100|300[ \t]+es))?[ \t]*\n/, '#version 300 es\n'], [/\btexture(2D|2DProj|Cube)Lod(EXT)?\(/g, 'textureLod('], [/\btexture(2D|2DProj|Cube)(EXT)?\(/g, 'texture(']];
const ES300_VERTEX_REPLACEMENTS = [...ES300_REPLACEMENTS, [testVariable('attribute'), 'in $1'], [testVariable('varying'), 'out $1']];
const ES300_FRAGMENT_REPLACEMENTS = [...ES300_REPLACEMENTS, [testVariable('varying'), 'in $1']];
const ES100_REPLACEMENTS = [[/^#version[ \t]+300[ \t]+es/, '#version 100'], [/\btexture(2D|2DProj|Cube)Lod\(/g, 'texture$1LodEXT('], [/\btexture\(/g, 'texture2D('], [/\btextureLod\(/g, 'texture2DLodEXT(']];
const ES100_VERTEX_REPLACEMENTS = [...ES100_REPLACEMENTS, [testVariable('in'), 'attribute $1'], [testVariable('out'), 'varying $1']];
const ES100_FRAGMENT_REPLACEMENTS = [...ES100_REPLACEMENTS, [testVariable('in'), 'varying $1']];
const ES100_FRAGMENT_OUTPUT_NAME = 'gl_FragColor';
const ES300_FRAGMENT_OUTPUT_REGEX = /\bout[ \t]+vec4[ \t]+(\w+)[ \t]*;\n?/;
const REGEX_START_OF_MAIN = /void\s+main\s*\([^)]*\)\s*\{\n?/;
function transpileShader(source, targetGLSLVersion, isVertex) {
  switch (targetGLSLVersion) {
    case 300:
      return isVertex ? convertShader(source, ES300_VERTEX_REPLACEMENTS) : convertFragmentShaderTo300(source);

    case 100:
      return isVertex ? convertShader(source, ES100_VERTEX_REPLACEMENTS) : convertFragmentShaderTo100(source);

    default:
      throw new Error(`unknown GLSL version ${targetGLSLVersion}`);
  }
}

function convertShader(source, replacements) {
  for (const [pattern, replacement] of replacements) {
    source = source.replace(pattern, replacement);
  }

  return source;
}

function convertFragmentShaderTo300(source) {
  source = convertShader(source, ES300_FRAGMENT_REPLACEMENTS);
  const outputMatch = source.match(ES300_FRAGMENT_OUTPUT_REGEX);

  if (outputMatch) {
    const outputName = outputMatch[1];
    source = source.replace(new RegExp(`\\b${ES100_FRAGMENT_OUTPUT_NAME}\\b`, 'g'), outputName);
  } else {
    const outputName = 'fragmentColor';
    source = source.replace(REGEX_START_OF_MAIN, match => `out vec4 ${outputName};\n${match}`).replace(new RegExp(`\\b${ES100_FRAGMENT_OUTPUT_NAME}\\b`, 'g'), outputName);
  }

  return source;
}

function convertFragmentShaderTo100(source) {
  source = convertShader(source, ES100_FRAGMENT_REPLACEMENTS);
  const outputMatch = source.match(ES300_FRAGMENT_OUTPUT_REGEX);

  if (outputMatch) {
    const outputName = outputMatch[1];
    source = source.replace(ES300_FRAGMENT_OUTPUT_REGEX, '').replace(new RegExp(`\\b${outputName}\\b`, 'g'), ES100_FRAGMENT_OUTPUT_NAME);
  }

  return source;
}

const INJECT_SHADER_DECLARATIONS = `\n\n${DECLARATION_INJECT_MARKER}\n\n`;
const SHADER_TYPE = {
  [VERTEX_SHADER$1]: 'vertex',
  [FRAGMENT_SHADER$1]: 'fragment'
};
const FRAGMENT_SHADER_PROLOGUE = `\
precision highp float;

`;
function assembleShaders(gl, opts) {
  const {
    vs,
    fs
  } = opts;
  const modules = resolveModules(opts.modules || []);
  return {
    gl,
    vs: assembleShader(gl, Object.assign({}, opts, {
      source: vs,
      type: VERTEX_SHADER$1,
      modules
    })),
    fs: assembleShader(gl, Object.assign({}, opts, {
      source: fs,
      type: FRAGMENT_SHADER$1,
      modules
    })),
    getUniforms: assembleGetUniforms(modules)
  };
}

function assembleShader(gl, {
  id,
  source,
  type,
  modules,
  defines = {},
  hookFunctions = [],
  inject = {},
  transpileToGLSL100 = false,
  prologue = true,
  log
}) {
  assert(typeof source === 'string', 'shader source must be a string');
  const isVertex = type === VERTEX_SHADER$1;
  const sourceLines = source.split('\n');
  let glslVersion = 100;
  let versionLine = '';
  let coreSource = source;

  if (sourceLines[0].indexOf('#version ') === 0) {
    glslVersion = 300;
    versionLine = sourceLines[0];
    coreSource = sourceLines.slice(1).join('\n');
  } else {
    versionLine = `#version ${glslVersion}`;
  }

  const allDefines = {};
  modules.forEach(module => {
    Object.assign(allDefines, module.getDefines());
  });
  Object.assign(allDefines, defines);
  let assembledSource = prologue ? `\
${versionLine}
${getShaderName({
    id,
    source,
    type
  })}
${getShaderType({
    type
  })}
${getPlatformShaderDefines(gl)}
${getVersionDefines(gl)}
${getApplicationDefines(allDefines)}
${isVertex ? '' : FRAGMENT_SHADER_PROLOGUE}
` : `${versionLine}
`;
  const hookFunctionMap = normalizeHookFunctions(hookFunctions);
  const hookInjections = {};
  const declInjections = {};
  const mainInjections = {};

  for (const key in inject) {
    const injection = typeof inject[key] === 'string' ? {
      injection: inject[key],
      order: 0
    } : inject[key];
    const match = key.match(/^(v|f)s:(#)?([\w-]+)$/);

    if (match) {
      const hash = match[2];
      const name = match[3];

      if (hash) {
        if (name === 'decl') {
          declInjections[key] = [injection];
        } else {
          mainInjections[key] = [injection];
        }
      } else {
        hookInjections[key] = [injection];
      }
    } else {
      mainInjections[key] = [injection];
    }
  }

  for (const module of modules) {
    if (log) {
      module.checkDeprecations(coreSource, log);
    }

    const moduleSource = module.getModuleSource(type, glslVersion);
    assembledSource += moduleSource;
    const injections = module.injections[type];

    for (const key in injections) {
      const match = key.match(/^(v|f)s:#([\w-]+)$/);

      if (match) {
        const name = match[2];
        const injectionType = name === 'decl' ? declInjections : mainInjections;
        injectionType[key] = injectionType[key] || [];
        injectionType[key].push(injections[key]);
      } else {
        hookInjections[key] = hookInjections[key] || [];
        hookInjections[key].push(injections[key]);
      }
    }
  }

  assembledSource += INJECT_SHADER_DECLARATIONS;
  assembledSource = injectShader(assembledSource, type, declInjections);
  assembledSource += getHookFunctions(hookFunctionMap[type], hookInjections);
  assembledSource += coreSource;
  assembledSource = injectShader(assembledSource, type, mainInjections);
  assembledSource = transpileShader(assembledSource, transpileToGLSL100 ? 100 : glslVersion, isVertex);
  return assembledSource;
}

function assembleGetUniforms(modules) {
  return function getUniforms(opts) {
    const uniforms = {};

    for (const module of modules) {
      const moduleUniforms = module.getUniforms(opts, uniforms);
      Object.assign(uniforms, moduleUniforms);
    }

    return uniforms;
  };
}

function getShaderType({
  type
}) {
  return `
#define SHADER_TYPE_${SHADER_TYPE[type].toUpperCase()}
`;
}

function getShaderName({
  id,
  source,
  type
}) {
  const injectShaderName = id && typeof id === 'string' && source.indexOf('SHADER_NAME') === -1;
  return injectShaderName ? `
#define SHADER_NAME ${id}_${SHADER_TYPE[type]}

` : '';
}

function getApplicationDefines(defines = {}) {
  let count = 0;
  let sourceText = '';

  for (const define in defines) {
    if (count === 0) {
      sourceText += '\n// APPLICATION DEFINES\n';
    }

    count++;
    const value = defines[define];

    if (value || Number.isFinite(value)) {
      sourceText += `#define ${define.toUpperCase()} ${defines[define]}\n`;
    }
  }

  if (count === 0) {
    sourceText += '\n';
  }

  return sourceText;
}

function getHookFunctions(hookFunctions, hookInjections) {
  let result = '';

  for (const hookName in hookFunctions) {
    const hookFunction = hookFunctions[hookName];
    result += `void ${hookFunction.signature} {\n`;

    if (hookFunction.header) {
      result += `  ${hookFunction.header}`;
    }

    if (hookInjections[hookName]) {
      const injections = hookInjections[hookName];
      injections.sort((a, b) => a.order - b.order);

      for (const injection of injections) {
        result += `  ${injection.injection}\n`;
      }
    }

    if (hookFunction.footer) {
      result += `  ${hookFunction.footer}`;
    }

    result += '}\n';
  }

  return result;
}

function normalizeHookFunctions(hookFunctions) {
  const result = {
    vs: {},
    fs: {}
  };
  hookFunctions.forEach(hook => {
    let opts;

    if (typeof hook !== 'string') {
      opts = hook;
      hook = opts.hook;
    } else {
      opts = {};
    }

    hook = hook.trim();
    const [stage, signature] = hook.split(':');
    const name = hook.replace(/\(.+/, '');
    result[stage][name] = Object.assign(opts, {
      signature
    });
  });
  return result;
}

const FS100 = `void main() {gl_FragColor = vec4(0);}`;
const FS_GLES = `\
out vec4 transform_output;
void main() {
  transform_output = vec4(0);
}`;
const FS300 = `#version 300 es\n${FS_GLES}`;
function getQualifierDetails(line, qualifiers) {
  qualifiers = Array.isArray(qualifiers) ? qualifiers : [qualifiers];
  const words = line.replace(/^\s+/, '').split(/\s+/);
  const [qualifier, type, definition] = words;

  if (!qualifiers.includes(qualifier) || !type || !definition) {
    return null;
  }

  const name = definition.split(';')[0];
  return {
    qualifier,
    type,
    name
  };
}
function getPassthroughFS(options = {}) {
  const {
    version = 100,
    input,
    inputType,
    output
  } = options;

  if (!input) {
    if (version === 300) {
      return FS300;
    } else if (version > 300) {
      return `#version ${version}\n${FS_GLES}`;
    }

    return FS100;
  }

  const outputValue = convertToVec4(input, inputType);

  if (version >= 300) {
    return `\
#version ${version} ${version === 300 ? 'es' : ''}
in ${inputType} ${input};
out vec4 ${output};
void main() {
  ${output} = ${outputValue};
}`;
  }

  return `\
varying ${inputType} ${input};
void main() {
  gl_FragColor = ${outputValue};
}`;
}
function typeToChannelSuffix(type) {
  switch (type) {
    case 'float':
      return 'x';

    case 'vec2':
      return 'xy';

    case 'vec3':
      return 'xyz';

    case 'vec4':
      return 'xyzw';

    default:
      assert(false);
      return null;
  }
}
function typeToChannelCount(type) {
  switch (type) {
    case 'float':
      return 1;

    case 'vec2':
      return 2;

    case 'vec3':
      return 3;

    case 'vec4':
      return 4;

    default:
      assert(false);
      return null;
  }
}
function convertToVec4(variable, type) {
  switch (type) {
    case 'float':
      return `vec4(${variable}, 0.0, 0.0, 1.0)`;

    case 'vec2':
      return `vec4(${variable}, 0.0, 1.0)`;

    case 'vec3':
      return `vec4(${variable}, 1.0)`;

    case 'vec4':
      return variable;

    default:
      assert(false);
      return null;
  }
}

const fp32shader = `\
#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND
const float TWO_PI = 6.2831854820251465;
const float PI_2 = 1.5707963705062866;
const float PI_16 = 0.1963495463132858;

const float SIN_TABLE_0 = 0.19509032368659973;
const float SIN_TABLE_1 = 0.3826834261417389;
const float SIN_TABLE_2 = 0.5555702447891235;
const float SIN_TABLE_3 = 0.7071067690849304;

const float COS_TABLE_0 = 0.9807852506637573;
const float COS_TABLE_1 = 0.9238795042037964;
const float COS_TABLE_2 = 0.8314695954322815;
const float COS_TABLE_3 = 0.7071067690849304;

const float INVERSE_FACTORIAL_3 = 1.666666716337204e-01;
const float INVERSE_FACTORIAL_5 = 8.333333767950535e-03;
const float INVERSE_FACTORIAL_7 = 1.9841270113829523e-04;
const float INVERSE_FACTORIAL_9 = 2.75573188446287533e-06;

float sin_taylor_fp32(float a) {
  float r, s, t, x;

  if (a == 0.0) {
    return 0.0;
  }

  x = -a * a;
  s = a;
  r = a;

  r = r * x;
  t = r * INVERSE_FACTORIAL_3;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_5;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_7;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_9;
  s = s + t;

  return s;
}

void sincos_taylor_fp32(float a, out float sin_t, out float cos_t) {
  if (a == 0.0) {
    sin_t = 0.0;
    cos_t = 1.0;
  }
  sin_t = sin_taylor_fp32(a);
  cos_t = sqrt(1.0 - sin_t * sin_t);
}

float tan_taylor_fp32(float a) {
    float sin_a;
    float cos_a;

    if (a == 0.0) {
        return 0.0;
    }
    float z = floor(a / TWO_PI);
    float r = a - TWO_PI * z;

    float t;
    float q = floor(r / PI_2 + 0.5);
    int j = int(q);

    if (j < -2 || j > 2) {
        return 1.0 / 0.0;
    }

    t = r - PI_2 * q;

    q = floor(t / PI_16 + 0.5);
    int k = int(q);
    int abs_k = int(abs(float(k)));

    if (abs_k > 4) {
        return 1.0 / 0.0;
    } else {
        t = t - PI_16 * q;
    }

    float u = 0.0;
    float v = 0.0;

    float sin_t, cos_t;
    float s, c;
    sincos_taylor_fp32(t, sin_t, cos_t);

    if (k == 0) {
        s = sin_t;
        c = cos_t;
    } else {
        if (abs(float(abs_k) - 1.0) < 0.5) {
            u = COS_TABLE_0;
            v = SIN_TABLE_0;
        } else if (abs(float(abs_k) - 2.0) < 0.5) {
            u = COS_TABLE_1;
            v = SIN_TABLE_1;
        } else if (abs(float(abs_k) - 3.0) < 0.5) {
            u = COS_TABLE_2;
            v = SIN_TABLE_2;
        } else if (abs(float(abs_k) - 4.0) < 0.5) {
            u = COS_TABLE_3;
            v = SIN_TABLE_3;
        }
        if (k > 0) {
            s = u * sin_t + v * cos_t;
            c = u * cos_t - v * sin_t;
        } else {
            s = u * sin_t - v * cos_t;
            c = u * cos_t + v * sin_t;
        }
    }

    if (j == 0) {
        sin_a = s;
        cos_a = c;
    } else if (j == 1) {
        sin_a = c;
        cos_a = -s;
    } else if (j == -1) {
        sin_a = -c;
        cos_a = s;
    } else {
        sin_a = -s;
        cos_a = -c;
    }
    return sin_a / cos_a;
}
#endif

float tan_fp32(float a) {
#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND
  return tan_taylor_fp32(a);
#else
  return tan(a);
#endif
}
`;
const fp32 = {
  name: 'fp32',
  vs: fp32shader,
  fs: null
};

const vs$2 = `\
attribute float transform_elementID;
vec2 transform_getPixelSizeHalf(vec2 size) {
  return vec2(1.) / (2. * size);
}

vec2 transform_getPixelIndices(vec2 texSize, vec2 pixelSizeHalf) {
  float yIndex = floor((transform_elementID / texSize[0]) + pixelSizeHalf[1]);
  float xIndex = transform_elementID - (yIndex * texSize[0]);
  return vec2(xIndex, yIndex);
}
vec2 transform_getTexCoord(vec2 size) {
  vec2 pixelSizeHalf = transform_getPixelSizeHalf(size);
  vec2 indices = transform_getPixelIndices(size, pixelSizeHalf);
  vec2 coord = indices / size + pixelSizeHalf;
  return coord;
}
vec2 transform_getPos(vec2 size) {
  vec2 texCoord = transform_getTexCoord(size);
  vec2 pos = (texCoord * (2.0, 2.0)) - (1., 1.);
  return pos;
}
vec4 transform_getInput(sampler2D texSampler, vec2 size) {
  vec2 texCoord = transform_getTexCoord(size);
  vec4 textureColor = texture2D(texSampler, texCoord);
  return textureColor;
}
`;
const transform = {
  name: 'transform',
  vs: vs$2,
  fs: null
};

class ProgramManager {
  static getDefaultProgramManager(gl) {
    gl.luma = gl.luma || {};
    gl.luma.defaultProgramManager = gl.luma.defaultProgramManager || new ProgramManager(gl);
    return gl.luma.defaultProgramManager;
  }

  constructor(gl) {
    this.gl = gl;
    this._programCache = {};
    this._getUniforms = {};
    this._registeredModules = {};
    this._hookFunctions = [];
    this._defaultModules = [];
    this._hashes = {};
    this._hashCounter = 0;
    this.stateHash = 0;
    this._useCounts = {};
  }

  addDefaultModule(module) {
    if (!this._defaultModules.find(m => m.name === module.name)) {
      this._defaultModules.push(module);
    }

    this.stateHash++;
  }

  removeDefaultModule(module) {
    const moduleName = typeof module === 'string' ? module : module.name;
    this._defaultModules = this._defaultModules.filter(m => m.name !== moduleName);
    this.stateHash++;
  }

  addShaderHook(hook, opts) {
    if (opts) {
      hook = Object.assign(opts, {
        hook
      });
    }

    this._hookFunctions.push(hook);

    this.stateHash++;
  }

  get(props = {}) {
    const {
      vs = '',
      fs = '',
      defines = {},
      inject = {},
      varyings = [],
      bufferMode = 0x8c8d,
      transpileToGLSL100 = false
    } = props;

    const modules = this._getModuleList(props.modules);

    const vsHash = this._getHash(vs);

    const fsHash = this._getHash(fs);

    const moduleHashes = modules.map(m => this._getHash(m.name)).sort();
    const varyingHashes = varyings.map(v => this._getHash(v));
    const defineKeys = Object.keys(defines).sort();
    const injectKeys = Object.keys(inject).sort();
    const defineHashes = [];
    const injectHashes = [];

    for (const key of defineKeys) {
      defineHashes.push(this._getHash(key));
      defineHashes.push(this._getHash(defines[key]));
    }

    for (const key of injectKeys) {
      injectHashes.push(this._getHash(key));
      injectHashes.push(this._getHash(inject[key]));
    }

    const hash = `${vsHash}/${fsHash}D${defineHashes.join('/')}M${moduleHashes.join('/')}I${injectHashes.join('/')}V${varyingHashes.join('/')}H${this.stateHash}B${bufferMode}${transpileToGLSL100 ? 'T' : ''}`;

    if (!this._programCache[hash]) {
      const assembled = assembleShaders(this.gl, {
        vs,
        fs,
        modules,
        inject,
        defines,
        hookFunctions: this._hookFunctions,
        transpileToGLSL100
      });
      this._programCache[hash] = new Program(this.gl, {
        hash,
        vs: assembled.vs,
        fs: assembled.fs,
        varyings,
        bufferMode
      });

      this._getUniforms[hash] = assembled.getUniforms || (x => {});

      this._useCounts[hash] = 0;
    }

    this._useCounts[hash]++;
    return this._programCache[hash];
  }

  getUniforms(program) {
    return this._getUniforms[program.hash] || null;
  }

  release(program) {
    const hash = program.hash;
    this._useCounts[hash]--;

    if (this._useCounts[hash] === 0) {
      this._programCache[hash].delete();

      delete this._programCache[hash];
      delete this._getUniforms[hash];
      delete this._useCounts[hash];
    }
  }

  _getHash(key) {
    if (this._hashes[key] === undefined) {
      this._hashes[key] = this._hashCounter++;
    }

    return this._hashes[key];
  }

  _getModuleList(appModules = []) {
    const modules = new Array(this._defaultModules.length + appModules.length);
    const seen = {};
    let count = 0;

    for (let i = 0, len = this._defaultModules.length; i < len; ++i) {
      const module = this._defaultModules[i];
      const name = module.name;
      modules[count++] = module;
      seen[name] = true;
    }

    for (let i = 0, len = appModules.length; i < len; ++i) {
      const module = appModules[i];
      const name = module.name;

      if (!seen[name]) {
        modules[count++] = module;
        seen[name] = true;
      }
    }

    modules.length = count;
    return modules;
  }

}

const GLTF_TO_LUMA_ATTRIBUTE_MAP = {
  POSITION: 'positions',
  NORMAL: 'normals',
  COLOR_0: 'colors',
  TEXCOORD_0: 'texCoords',
  TEXCOORD_1: 'texCoords1',
  TEXCOORD_2: 'texCoords2'
};
function getBuffersFromGeometry(gl, geometry, options) {
  const buffers = {};
  let indices = geometry.indices;

  for (const name in geometry.attributes) {
    const attribute = geometry.attributes[name];
    const remappedName = mapAttributeName(name, options);

    if (name === 'indices') {
      indices = attribute;
    } else if (attribute.constant) {
      buffers[remappedName] = attribute.value;
    } else {
      const typedArray = attribute.value;
      const accessor = { ...attribute
      };
      delete accessor.value;
      buffers[remappedName] = [new Buffer(gl, typedArray), accessor];
      inferAttributeAccessor(name, accessor);
    }
  }

  if (indices) {
    const data = indices.value || indices;
    assert$1(data instanceof Uint16Array || data instanceof Uint32Array, 'attribute array for "indices" must be of integer type');
    const accessor = {
      size: 1,
      isIndexed: indices.isIndexed === undefined ? true : indices.isIndexed
    };
    buffers.indices = [new Buffer(gl, {
      data,
      target: 34963
    }), accessor];
  }

  return buffers;
}

function mapAttributeName(name, options) {
  const {
    attributeMap = GLTF_TO_LUMA_ATTRIBUTE_MAP
  } = options || {};
  return attributeMap && attributeMap[name] || name;
}

function inferAttributeAccessor(attributeName, attribute) {
  let category;

  switch (attributeName) {
    case 'texCoords':
    case 'texCoord1':
    case 'texCoord2':
    case 'texCoord3':
      category = 'uvs';
      break;

    case 'vertices':
    case 'positions':
    case 'normals':
    case 'pickingColors':
      category = 'vectors';
      break;
  }

  switch (category) {
    case 'vectors':
      attribute.size = attribute.size || 3;
      break;

    case 'uvs':
      attribute.size = attribute.size || 2;
      break;
  }

  assert$1(Number.isFinite(attribute.size), `attribute ${attributeName} needs size`);
}

const LOG_DRAW_PRIORITY = 2;
const LOG_DRAW_TIMEOUT = 10000;
const ERR_MODEL_PARAMS = 'Model needs drawMode and vertexCount';

const NOOP = () => {};

const DRAW_PARAMS = {};
class Model {
  constructor(gl, props = {}) {
    const {
      id = uid('model')
    } = props;
    assert$1(isWebGL(gl));
    this.id = id;
    this.gl = gl;
    this.id = props.id || uid('Model');
    this.lastLogTime = 0;
    this.animated = false;
    this.initialize(props);
  }

  initialize(props) {
    this.props = {};
    this.programManager = props.programManager || ProgramManager.getDefaultProgramManager(this.gl);
    this._programManagerState = -1;
    this._managedProgram = false;
    const {
      program = null,
      vs,
      fs,
      modules,
      defines,
      inject,
      varyings,
      bufferMode,
      transpileToGLSL100
    } = props;
    this.programProps = {
      program,
      vs,
      fs,
      modules,
      defines,
      inject,
      varyings,
      bufferMode,
      transpileToGLSL100
    };
    this.program = null;
    this.vertexArray = null;
    this._programDirty = true;
    this.userData = {};
    this.needsRedraw = true;
    this._attributes = {};
    this.attributes = {};
    this.uniforms = {};
    this.pickable = true;

    this._checkProgram();

    this.setUniforms(Object.assign({}, this.getModuleUniforms(props.moduleSettings)));
    this.drawMode = props.drawMode !== undefined ? props.drawMode : 4;
    this.vertexCount = props.vertexCount || 0;
    this.geometryBuffers = {};
    this.isInstanced = props.isInstanced || props.instanced || props.instanceCount > 0;

    this._setModelProps(props);

    this.geometry = {};
    assert$1(this.drawMode !== undefined && Number.isFinite(this.vertexCount), ERR_MODEL_PARAMS);
  }

  setProps(props) {
    this._setModelProps(props);
  }

  delete() {
    for (const key in this._attributes) {
      if (this._attributes[key] !== this.attributes[key]) {
        this._attributes[key].delete();
      }
    }

    if (this._managedProgram) {
      this.programManager.release(this.program);
      this._managedProgram = false;
    }

    this.vertexArray.delete();

    this._deleteGeometryBuffers();
  }

  getDrawMode() {
    return this.drawMode;
  }

  getVertexCount() {
    return this.vertexCount;
  }

  getInstanceCount() {
    return this.instanceCount;
  }

  getAttributes() {
    return this.attributes;
  }

  getProgram() {
    return this.program;
  }

  setProgram(props) {
    const {
      program,
      vs,
      fs,
      modules,
      defines,
      inject,
      varyings,
      bufferMode,
      transpileToGLSL100
    } = props;
    this.programProps = {
      program,
      vs,
      fs,
      modules,
      defines,
      inject,
      varyings,
      bufferMode,
      transpileToGLSL100
    };
    this._programDirty = true;
  }

  getUniforms() {
    return this.uniforms;
  }

  setDrawMode(drawMode) {
    this.drawMode = drawMode;
    return this;
  }

  setVertexCount(vertexCount) {
    assert$1(Number.isFinite(vertexCount));
    this.vertexCount = vertexCount;
    return this;
  }

  setInstanceCount(instanceCount) {
    assert$1(Number.isFinite(instanceCount));
    this.instanceCount = instanceCount;
    return this;
  }

  setGeometry(geometry) {
    this.drawMode = geometry.drawMode;
    this.vertexCount = geometry.getVertexCount();

    this._deleteGeometryBuffers();

    this.geometryBuffers = getBuffersFromGeometry(this.gl, geometry);
    this.vertexArray.setAttributes(this.geometryBuffers);
    return this;
  }

  setAttributes(attributes = {}) {
    if (isObjectEmpty(attributes)) {
      return this;
    }

    const normalizedAttributes = {};

    for (const name in attributes) {
      const attribute = attributes[name];
      normalizedAttributes[name] = attribute.getValue ? attribute.getValue() : attribute;
    }

    this.vertexArray.setAttributes(normalizedAttributes);
    return this;
  }

  setUniforms(uniforms = {}) {
    Object.assign(this.uniforms, uniforms);
    return this;
  }

  getModuleUniforms(opts) {
    this._checkProgram();

    const getUniforms = this.programManager.getUniforms(this.program);

    if (getUniforms) {
      return getUniforms(opts);
    }

    return {};
  }

  updateModuleSettings(opts) {
    const uniforms = this.getModuleUniforms(opts || {});
    return this.setUniforms(uniforms);
  }

  clear(opts) {
    clear(this.program.gl, opts);
    return this;
  }

  draw(opts = {}) {
    this._checkProgram();

    const {
      moduleSettings = null,
      framebuffer,
      uniforms = {},
      attributes = {},
      transformFeedback = this.transformFeedback,
      parameters = {},
      vertexArray = this.vertexArray
    } = opts;
    this.setAttributes(attributes);
    this.updateModuleSettings(moduleSettings);
    this.setUniforms(uniforms);
    let logPriority;

    if (log$1.priority >= LOG_DRAW_PRIORITY) {
      logPriority = this._logDrawCallStart(LOG_DRAW_PRIORITY);
    }

    const drawParams = this.vertexArray.getDrawParams();
    const {
      isIndexed = drawParams.isIndexed,
      indexType = drawParams.indexType,
      indexOffset = drawParams.indexOffset,
      vertexArrayInstanced = drawParams.isInstanced
    } = this.props;

    if (vertexArrayInstanced && !this.isInstanced) {
      log$1.warn('Found instanced attributes on non-instanced model', this.id)();
    }

    const {
      isInstanced,
      instanceCount
    } = this;
    const {
      onBeforeRender = NOOP,
      onAfterRender = NOOP
    } = this.props;
    onBeforeRender();
    this.program.setUniforms(this.uniforms);
    const didDraw = this.program.draw(Object.assign(DRAW_PARAMS, opts, {
      logPriority,
      uniforms: null,
      framebuffer,
      parameters,
      drawMode: this.getDrawMode(),
      vertexCount: this.getVertexCount(),
      vertexArray,
      transformFeedback,
      isIndexed,
      indexType,
      isInstanced,
      instanceCount,
      offset: isIndexed ? indexOffset : 0
    }));
    onAfterRender();

    if (log$1.priority >= LOG_DRAW_PRIORITY) {
      this._logDrawCallEnd(logPriority, vertexArray, framebuffer);
    }

    return didDraw;
  }

  transform(opts = {}) {
    const {
      discard = true,
      feedbackBuffers,
      unbindModels = []
    } = opts;
    let {
      parameters
    } = opts;

    if (feedbackBuffers) {
      this._setFeedbackBuffers(feedbackBuffers);
    }

    if (discard) {
      parameters = Object.assign({}, parameters, {
        [35977]: discard
      });
    }

    unbindModels.forEach(model => model.vertexArray.unbindBuffers());

    try {
      this.draw(Object.assign({}, opts, {
        parameters
      }));
    } finally {
      unbindModels.forEach(model => model.vertexArray.bindBuffers());
    }

    return this;
  }

  render(uniforms = {}) {
    log$1.warn('Model.render() is deprecated. Use Model.setUniforms() and Model.draw()')();
    return this.setUniforms(uniforms).draw();
  }

  _setModelProps(props) {
    Object.assign(this.props, props);

    if ('uniforms' in props) {
      this.setUniforms(props.uniforms);
    }

    if ('pickable' in props) {
      this.pickable = props.pickable;
    }

    if ('instanceCount' in props) {
      this.instanceCount = props.instanceCount;
    }

    if ('geometry' in props) {
      this.setGeometry(props.geometry);
    }

    if ('attributes' in props) {
      this.setAttributes(props.attributes);
    }

    if ('_feedbackBuffers' in props) {
      this._setFeedbackBuffers(props._feedbackBuffers);
    }
  }

  _checkProgram() {
    const needsUpdate = this._programDirty || this.programManager.stateHash !== this._programManagerState;

    if (!needsUpdate) {
      return;
    }

    let {
      program
    } = this.programProps;

    if (program) {
      this._managedProgram = false;
    } else {
      const {
        vs,
        fs,
        modules,
        inject,
        defines,
        varyings,
        bufferMode,
        transpileToGLSL100
      } = this.programProps;
      program = this.programManager.get({
        vs,
        fs,
        modules,
        inject,
        defines,
        varyings,
        bufferMode,
        transpileToGLSL100
      });

      if (this.program && this._managedProgram) {
        this.programManager.release(this.program);
      }

      this._programManagerState = this.programManager.stateHash;
      this._managedProgram = true;
    }

    assert$1(program instanceof Program, 'Model needs a program');
    this._programDirty = false;

    if (program === this.program) {
      return;
    }

    this.program = program;

    if (this.vertexArray) {
      this.vertexArray.setProps({
        program: this.program,
        attributes: this.vertexArray.attributes
      });
    } else {
      this.vertexArray = new VertexArray(this.gl, {
        program: this.program
      });
    }

    this.setUniforms(Object.assign({}, this.getModuleUniforms()));
  }

  _deleteGeometryBuffers() {
    for (const name in this.geometryBuffers) {
      const buffer = this.geometryBuffers[name][0] || this.geometryBuffers[name];

      if (buffer instanceof Buffer) {
        buffer.delete();
      }
    }
  }

  _setAnimationProps(animationProps) {
    if (this.animated) {
      assert$1(animationProps, 'Model.draw(): animated uniforms but no animationProps');
    }
  }

  _setFeedbackBuffers(feedbackBuffers = {}) {
    if (isObjectEmpty(feedbackBuffers)) {
      return this;
    }

    const {
      gl
    } = this.program;
    this.transformFeedback = this.transformFeedback || new TransformFeedback(gl, {
      program: this.program
    });
    this.transformFeedback.setBuffers(feedbackBuffers);
    return this;
  }

  _logDrawCallStart(logLevel) {
    const logDrawTimeout = logLevel > 3 ? 0 : LOG_DRAW_TIMEOUT;

    if (Date.now() - this.lastLogTime < logDrawTimeout) {
      return undefined;
    }

    this.lastLogTime = Date.now();
    log$1.group(LOG_DRAW_PRIORITY, `>>> DRAWING MODEL ${this.id}`, {
      collapsed: log$1.level <= 2
    })();
    return logLevel;
  }

  _logDrawCallEnd(logLevel, vertexArray, uniforms, framebuffer) {
    if (logLevel === undefined) {
      return;
    }

    const attributeTable = getDebugTableForVertexArray({
      vertexArray,
      header: `${this.id} attributes`,
      attributes: this._attributes
    });
    const {
      table: uniformTable,
      unusedTable,
      unusedCount
    } = getDebugTableForUniforms({
      header: `${this.id} uniforms`,
      program: this.program,
      uniforms: Object.assign({}, this.program.uniforms, uniforms)
    });
    const {
      table: missingTable,
      count: missingCount
    } = getDebugTableForUniforms({
      header: `${this.id} uniforms`,
      program: this.program,
      uniforms: Object.assign({}, this.program.uniforms, uniforms),
      undefinedOnly: true
    });

    if (missingCount > 0) {
      log$1.log('MISSING UNIFORMS', Object.keys(missingTable))();
    }

    if (unusedCount > 0) {
      log$1.log('UNUSED UNIFORMS', Object.keys(unusedTable))();
    }

    const configTable = getDebugTableForProgramConfiguration(this.vertexArray.configuration);
    log$1.table(logLevel, attributeTable)();
    log$1.table(logLevel, uniformTable)();
    log$1.table(logLevel + 1, configTable)();

    if (framebuffer) {
      framebuffer.log({
        logLevel: LOG_DRAW_PRIORITY,
        message: `Rendered to ${framebuffer.id}`
      });
    }

    log$1.groupEnd(LOG_DRAW_PRIORITY, `>>> DRAWING MODEL ${this.id}`)();
  }

}

class BufferTransform {
  constructor(gl, props = {}) {
    this.gl = gl;
    this.currentIndex = 0;
    this.feedbackMap = {};
    this.varyings = null;
    this.bindings = [];
    this.resources = {};

    this._initialize(props);

    Object.seal(this);
  }

  setupResources(opts) {
    for (const binding of this.bindings) {
      this._setupTransformFeedback(binding, opts);
    }
  }

  updateModelProps(props = {}) {
    const {
      varyings
    } = this;

    if (varyings.length > 0) {
      props = Object.assign({}, props, {
        varyings
      });
    }

    return props;
  }

  getDrawOptions(opts = {}) {
    const binding = this.bindings[this.currentIndex];
    const {
      sourceBuffers,
      transformFeedback
    } = binding;
    const attributes = Object.assign({}, sourceBuffers, opts.attributes);
    return {
      attributes,
      transformFeedback
    };
  }

  swap() {
    if (this.feedbackMap) {
      this.currentIndex = this._getNextIndex();
      return true;
    }

    return false;
  }

  update(opts = {}) {
    this._setupBuffers(opts);
  }

  getBuffer(varyingName) {
    const {
      feedbackBuffers
    } = this.bindings[this.currentIndex];
    const bufferOrParams = varyingName ? feedbackBuffers[varyingName] : null;

    if (!bufferOrParams) {
      return null;
    }

    return bufferOrParams instanceof Buffer ? bufferOrParams : bufferOrParams.buffer;
  }

  getData(options = {}) {
    const {
      varyingName
    } = options;
    const buffer = this.getBuffer(varyingName);

    if (buffer) {
      return buffer.getData();
    }

    return null;
  }

  delete() {
    for (const name in this.resources) {
      this.resources[name].delete();
    }
  }

  _initialize(props = {}) {
    this._setupBuffers(props);

    this.varyings = props.varyings || Object.keys(this.bindings[this.currentIndex].feedbackBuffers);

    if (this.varyings.length > 0) {
      assert$1(isWebGL2$1(this.gl));
    }
  }

  _getFeedbackBuffers(props) {
    const {
      sourceBuffers = {}
    } = props;
    const feedbackBuffers = {};

    if (this.bindings[this.currentIndex]) {
      Object.assign(feedbackBuffers, this.bindings[this.currentIndex].feedbackBuffers);
    }

    if (this.feedbackMap) {
      for (const sourceName in this.feedbackMap) {
        const feedbackName = this.feedbackMap[sourceName];

        if (sourceName in sourceBuffers) {
          feedbackBuffers[feedbackName] = sourceName;
        }
      }
    }

    Object.assign(feedbackBuffers, props.feedbackBuffers);

    for (const bufferName in feedbackBuffers) {
      const bufferOrRef = feedbackBuffers[bufferName];

      if (typeof bufferOrRef === 'string') {
        const sourceBuffer = sourceBuffers[bufferOrRef];
        const {
          byteLength,
          usage,
          accessor
        } = sourceBuffer;
        feedbackBuffers[bufferName] = this._createNewBuffer(bufferName, {
          byteLength,
          usage,
          accessor
        });
      }
    }

    return feedbackBuffers;
  }

  _setupBuffers(props = {}) {
    const {
      sourceBuffers = null
    } = props;
    Object.assign(this.feedbackMap, props.feedbackMap);

    const feedbackBuffers = this._getFeedbackBuffers(props);

    this._updateBindings({
      sourceBuffers,
      feedbackBuffers
    });
  }

  _setupTransformFeedback(binding, {
    model
  }) {
    const {
      program
    } = model;
    binding.transformFeedback = new TransformFeedback(this.gl, {
      program,
      buffers: binding.feedbackBuffers
    });
  }

  _updateBindings(opts) {
    this.bindings[this.currentIndex] = this._updateBinding(this.bindings[this.currentIndex], opts);

    if (this.feedbackMap) {
      const {
        sourceBuffers,
        feedbackBuffers
      } = this._swapBuffers(this.bindings[this.currentIndex]);

      const nextIndex = this._getNextIndex();

      this.bindings[nextIndex] = this._updateBinding(this.bindings[nextIndex], {
        sourceBuffers,
        feedbackBuffers
      });
    }
  }

  _updateBinding(binding, opts) {
    if (!binding) {
      return {
        sourceBuffers: Object.assign({}, opts.sourceBuffers),
        feedbackBuffers: Object.assign({}, opts.feedbackBuffers)
      };
    }

    Object.assign(binding.sourceBuffers, opts.sourceBuffers);
    Object.assign(binding.feedbackBuffers, opts.feedbackBuffers);

    if (binding.transformFeedback) {
      binding.transformFeedback.setBuffers(binding.feedbackBuffers);
    }

    return binding;
  }

  _swapBuffers(opts) {
    if (!this.feedbackMap) {
      return null;
    }

    const sourceBuffers = Object.assign({}, opts.sourceBuffers);
    const feedbackBuffers = Object.assign({}, opts.feedbackBuffers);

    for (const srcName in this.feedbackMap) {
      const dstName = this.feedbackMap[srcName];
      sourceBuffers[srcName] = opts.feedbackBuffers[dstName];
      feedbackBuffers[dstName] = opts.sourceBuffers[srcName];
      assert$1(feedbackBuffers[dstName] instanceof Buffer);
    }

    return {
      sourceBuffers,
      feedbackBuffers
    };
  }

  _createNewBuffer(name, opts) {
    const buffer = new Buffer(this.gl, opts);

    if (this.resources[name]) {
      this.resources[name].delete();
    }

    this.resources[name] = buffer;
    return buffer;
  }

  _getNextIndex() {
    return (this.currentIndex + 1) % 2;
  }

}

const SAMPLER_UNIFORM_PREFIX = 'transform_uSampler_';
const SIZE_UNIFORM_PREFIX = 'transform_uSize_';
const VS_POS_VARIABLE = 'transform_position';
function updateForTextures({
  vs,
  sourceTextureMap,
  targetTextureVarying,
  targetTexture
}) {
  const texAttributeNames = Object.keys(sourceTextureMap);
  let sourceCount = texAttributeNames.length;
  let targetTextureType = null;
  const samplerTextureMap = {};
  let updatedVs = vs;
  let finalInject = {};

  if (sourceCount > 0 || targetTextureVarying) {
    const vsLines = updatedVs.split('\n');
    const updateVsLines = vsLines.slice();
    vsLines.forEach((line, index, lines) => {
      if (sourceCount > 0) {
        const updated = processAttributeDefinition(line, sourceTextureMap);

        if (updated) {
          const {
            updatedLine,
            inject
          } = updated;
          updateVsLines[index] = updatedLine;
          finalInject = combineInjects([finalInject, inject]);
          Object.assign(samplerTextureMap, updated.samplerTextureMap);
          sourceCount--;
        }
      }

      if (targetTextureVarying && !targetTextureType) {
        targetTextureType = getVaryingType(line, targetTextureVarying);
      }
    });

    if (targetTextureVarying) {
      assert$1(targetTexture);
      const sizeName = `${SIZE_UNIFORM_PREFIX}${targetTextureVarying}`;
      const uniformDeclaration = `uniform vec2 ${sizeName};\n`;
      const posInstructions = `\
     vec2 ${VS_POS_VARIABLE} = transform_getPos(${sizeName});
     gl_Position = vec4(${VS_POS_VARIABLE}, 0, 1.);\n`;
      const inject = {
        'vs:#decl': uniformDeclaration,
        'vs:#main-start': posInstructions
      };
      finalInject = combineInjects([finalInject, inject]);
    }

    updatedVs = updateVsLines.join('\n');
  }

  return {
    vs: updatedVs,
    targetTextureType,
    inject: finalInject,
    samplerTextureMap
  };
}
function getSizeUniforms({
  sourceTextureMap,
  targetTextureVarying,
  targetTexture
}) {
  const uniforms = {};
  let width;
  let height;

  if (targetTextureVarying) {
    ({
      width,
      height
    } = targetTexture);
    uniforms[`${SIZE_UNIFORM_PREFIX}${targetTextureVarying}`] = [width, height];
  }

  for (const textureName in sourceTextureMap) {
    ({
      width,
      height
    } = sourceTextureMap[textureName]);
    uniforms[`${SIZE_UNIFORM_PREFIX}${textureName}`] = [width, height];
  }

  return uniforms;
}

function getAttributeDefinition(line) {
  return getQualifierDetails(line, ['attribute', 'in']);
}

function getSamplerDeclerations(textureName) {
  const samplerName = `${SAMPLER_UNIFORM_PREFIX}${textureName}`;
  const sizeName = `${SIZE_UNIFORM_PREFIX}${textureName}`;
  const uniformDeclerations = `\
  uniform sampler2D ${samplerName};
  uniform vec2 ${sizeName};`;
  return {
    samplerName,
    sizeName,
    uniformDeclerations
  };
}

function getVaryingType(line, varying) {
  const qualaiferDetails = getQualifierDetails(line, ['varying', 'out']);

  if (!qualaiferDetails) {
    return null;
  }

  return qualaiferDetails.name === varying ? qualaiferDetails.type : null;
}
function processAttributeDefinition(line, textureMap) {
  const samplerTextureMap = {};
  const attributeData = getAttributeDefinition(line);

  if (!attributeData) {
    return null;
  }

  const {
    type,
    name
  } = attributeData;

  if (name && textureMap[name]) {
    const updatedLine = `\// ${line} => Replaced by Transform with a sampler`;
    const {
      samplerName,
      sizeName,
      uniformDeclerations
    } = getSamplerDeclerations(name);
    const channels = typeToChannelSuffix(type);
    const sampleInstruction = `  ${type} ${name} = transform_getInput(${samplerName}, ${sizeName}).${channels};\n`;
    samplerTextureMap[samplerName] = name;
    const inject = {
      'vs:#decl': uniformDeclerations,
      'vs:#main-start': sampleInstruction
    };
    return {
      updatedLine,
      inject,
      samplerTextureMap
    };
  }

  return null;
}

const SRC_TEX_PARAMETER_OVERRIDES = {
  [10241]: 9728,
  [10240]: 9728,
  [10242]: 33071,
  [10243]: 33071
};
const FS_OUTPUT_VARIABLE = 'transform_output';
class TextureTransform {
  constructor(gl, props = {}) {
    this.gl = gl;
    this.id = this.currentIndex = 0;
    this._swapTexture = null;
    this.targetTextureVarying = null;
    this.targetTextureType = null;
    this.samplerTextureMap = null;
    this.bindings = [];
    this.resources = {};

    this._initialize(props);

    Object.seal(this);
  }

  updateModelProps(props = {}) {
    const updatedModelProps = this._processVertexShader(props);

    return Object.assign({}, props, updatedModelProps);
  }

  getDrawOptions(opts = {}) {
    const {
      sourceBuffers,
      sourceTextures,
      framebuffer,
      targetTexture
    } = this.bindings[this.currentIndex];
    const attributes = Object.assign({}, sourceBuffers, opts.attributes);
    const uniforms = Object.assign({}, opts.uniforms);
    const parameters = Object.assign({}, opts.parameters);
    let discard = opts.discard;

    if (this.hasSourceTextures || this.hasTargetTexture) {
      attributes.transform_elementID = this.elementIDBuffer;

      for (const sampler in this.samplerTextureMap) {
        const textureName = this.samplerTextureMap[sampler];
        uniforms[sampler] = sourceTextures[textureName];
      }

      this._setSourceTextureParameters();

      const sizeUniforms = getSizeUniforms({
        sourceTextureMap: sourceTextures,
        targetTextureVarying: this.targetTextureVarying,
        targetTexture
      });
      Object.assign(uniforms, sizeUniforms);
    }

    if (this.hasTargetTexture) {
      discard = false;
      parameters.viewport = [0, 0, framebuffer.width, framebuffer.height];
    }

    return {
      attributes,
      framebuffer,
      uniforms,
      discard,
      parameters
    };
  }

  swap() {
    if (this._swapTexture) {
      this.currentIndex = this._getNextIndex();
      return true;
    }

    return false;
  }

  update(opts = {}) {
    this._setupTextures(opts);
  }

  getTargetTexture() {
    const {
      targetTexture
    } = this.bindings[this.currentIndex];
    return targetTexture;
  }

  getData({
    packed = false
  } = {}) {
    const {
      framebuffer
    } = this.bindings[this.currentIndex];
    const pixels = readPixelsToArray(framebuffer);

    if (!packed) {
      return pixels;
    }

    const ArrayType = pixels.constructor;
    const channelCount = typeToChannelCount(this.targetTextureType);
    const packedPixels = new ArrayType(pixels.length * channelCount / 4);
    let packCount = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      for (let j = 0; j < channelCount; j++) {
        packedPixels[packCount++] = pixels[i + j];
      }
    }

    return packedPixels;
  }

  getFramebuffer() {
    const currentResources = this.bindings[this.currentIndex];
    return currentResources.framebuffer;
  }

  delete() {
    if (this.ownTexture) {
      this.ownTexture.delete();
    }

    if (this.elementIDBuffer) {
      this.elementIDBuffer.delete();
    }
  }

  _initialize(props = {}) {
    const {
      _targetTextureVarying,
      _swapTexture
    } = props;
    this._swapTexture = _swapTexture;
    this.targetTextureVarying = _targetTextureVarying;
    this.hasTargetTexture = _targetTextureVarying;

    this._setupTextures(props);
  }

  _createTargetTexture(props) {
    const {
      sourceTextures,
      textureOrReference
    } = props;

    if (textureOrReference instanceof Texture2D) {
      return textureOrReference;
    }

    const refTexture = sourceTextures[textureOrReference];

    if (!refTexture) {
      return null;
    }

    this._targetRefTexName = textureOrReference;
    return this._createNewTexture(refTexture);
  }

  _setupTextures(props = {}) {
    const {
      sourceBuffers,
      _sourceTextures = {},
      _targetTexture
    } = props;

    const targetTexture = this._createTargetTexture({
      sourceTextures: _sourceTextures,
      textureOrReference: _targetTexture
    });

    this.hasSourceTextures = this.hasSourceTextures || _sourceTextures && Object.keys(_sourceTextures).length > 0;

    this._updateBindings({
      sourceBuffers,
      sourceTextures: _sourceTextures,
      targetTexture
    });

    if ('elementCount' in props) {
      this._updateElementIDBuffer(props.elementCount);
    }
  }

  _updateElementIDBuffer(elementCount) {
    if (typeof elementCount !== 'number' || this.elementCount >= elementCount) {
      return;
    }

    const elementIds = new Float32Array(elementCount);
    elementIds.forEach((_, index, array) => {
      array[index] = index;
    });

    if (!this.elementIDBuffer) {
      this.elementIDBuffer = new Buffer(this.gl, {
        data: elementIds,
        accessor: {
          size: 1
        }
      });
    } else {
      this.elementIDBuffer.setData({
        data: elementIds
      });
    }

    this.elementCount = elementCount;
  }

  _updateBindings(opts) {
    this.bindings[this.currentIndex] = this._updateBinding(this.bindings[this.currentIndex], opts);

    if (this._swapTexture) {
      const {
        sourceTextures,
        targetTexture
      } = this._swapTextures(this.bindings[this.currentIndex]);

      const nextIndex = this._getNextIndex();

      this.bindings[nextIndex] = this._updateBinding(this.bindings[nextIndex], {
        sourceTextures,
        targetTexture
      });
    }
  }

  _updateBinding(binding, opts) {
    const {
      sourceBuffers,
      sourceTextures,
      targetTexture
    } = opts;

    if (!binding) {
      binding = {
        sourceBuffers: {},
        sourceTextures: {},
        targetTexture: null
      };
    }

    Object.assign(binding.sourceTextures, sourceTextures);
    Object.assign(binding.sourceBuffers, sourceBuffers);

    if (targetTexture) {
      binding.targetTexture = targetTexture;
      const {
        width,
        height
      } = targetTexture;
      const {
        framebuffer
      } = binding;

      if (framebuffer) {
        framebuffer.update({
          attachments: {
            [36064]: targetTexture
          },
          resizeAttachments: false
        });
        framebuffer.resize({
          width,
          height
        });
      } else {
        binding.framebuffer = new Framebuffer(this.gl, {
          id: `transform-framebuffer`,
          width,
          height,
          attachments: {
            [36064]: targetTexture
          }
        });
      }
    }

    return binding;
  }

  _setSourceTextureParameters() {
    const index = this.currentIndex;
    const {
      sourceTextures
    } = this.bindings[index];

    for (const name in sourceTextures) {
      sourceTextures[name].setParameters(SRC_TEX_PARAMETER_OVERRIDES);
    }
  }

  _swapTextures(opts) {
    if (!this._swapTexture) {
      return null;
    }

    const sourceTextures = Object.assign({}, opts.sourceTextures);
    sourceTextures[this._swapTexture] = opts.targetTexture;
    const targetTexture = opts.sourceTextures[this._swapTexture];
    return {
      sourceTextures,
      targetTexture
    };
  }

  _createNewTexture(refTexture) {
    const texture = cloneTextureFrom(refTexture, {
      parameters: {
        [10241]: 9728,
        [10240]: 9728,
        [10242]: 33071,
        [10243]: 33071
      },
      pixelStore: {
        [37440]: false
      }
    });

    if (this.ownTexture) {
      this.ownTexture.delete();
    }

    this.ownTexture = texture;
    return texture;
  }

  _getNextIndex() {
    return (this.currentIndex + 1) % 2;
  }

  _processVertexShader(props = {}) {
    const {
      sourceTextures,
      targetTexture
    } = this.bindings[this.currentIndex];
    const {
      vs,
      uniforms,
      targetTextureType,
      inject,
      samplerTextureMap
    } = updateForTextures({
      vs: props.vs,
      sourceTextureMap: sourceTextures,
      targetTextureVarying: this.targetTextureVarying,
      targetTexture
    });
    const combinedInject = combineInjects([props.inject || {}, inject]);
    this.targetTextureType = targetTextureType;
    this.samplerTextureMap = samplerTextureMap;
    const fs = props._fs || getPassthroughFS({
      version: getShaderVersion(vs),
      input: this.targetTextureVarying,
      inputType: targetTextureType,
      output: FS_OUTPUT_VARIABLE
    });
    const modules = this.hasSourceTextures || this.targetTextureVarying ? [transform].concat(props.modules || []) : props.modules;
    return {
      vs,
      fs,
      modules,
      uniforms,
      inject: combinedInject
    };
  }

}

class Transform {
  static isSupported(gl) {
    return isWebGL2$1(gl);
  }

  constructor(gl, props = {}) {
    this.gl = gl;
    this.model = null;
    this.elementCount = 0;
    this.bufferTransform = null;
    this.textureTransform = null;
    this.elementIDBuffer = null;

    this._initialize(props);

    Object.seal(this);
  }

  delete() {
    const {
      model,
      bufferTransform,
      textureTransform
    } = this;

    if (model) {
      model.delete();
    }

    if (bufferTransform) {
      bufferTransform.delete();
    }

    if (textureTransform) {
      textureTransform.delete();
    }
  }

  run(opts = {}) {
    const {
      clearRenderTarget = true
    } = opts;

    const updatedOpts = this._updateDrawOptions(opts);

    if (clearRenderTarget && updatedOpts.framebuffer) {
      updatedOpts.framebuffer.clear({
        color: true
      });
    }

    this.model.transform(updatedOpts);
  }

  swap() {
    let swapped = false;
    const resourceTransforms = [this.bufferTransform, this.textureTransform].filter(Boolean);

    for (const resourceTransform of resourceTransforms) {
      swapped = swapped || resourceTransform.swap();
    }

    assert$1(swapped, 'Nothing to swap');
  }

  getBuffer(varyingName = null) {
    return this.bufferTransform && this.bufferTransform.getBuffer(varyingName);
  }

  getData(opts = {}) {
    const resourceTransforms = [this.bufferTransform, this.textureTransform].filter(Boolean);

    for (const resourceTransform of resourceTransforms) {
      const data = resourceTransform.getData(opts);

      if (data) {
        return data;
      }
    }

    return null;
  }

  getFramebuffer() {
    return this.textureTransform && this.textureTransform.getFramebuffer();
  }

  update(opts = {}) {
    if ('elementCount' in opts) {
      this.model.setVertexCount(opts.elementCount);
    }

    const resourceTransforms = [this.bufferTransform, this.textureTransform].filter(Boolean);

    for (const resourceTransform of resourceTransforms) {
      resourceTransform.update(opts);
    }
  }

  _initialize(props = {}) {
    const {
      gl
    } = this;

    this._buildResourceTransforms(gl, props);

    props = this._updateModelProps(props);
    this.model = new Model(gl, Object.assign({}, props, {
      fs: props.fs || getPassthroughFS({
        version: getShaderVersion(props.vs)
      }),
      id: props.id || 'transform-model',
      drawMode: props.drawMode || 0,
      vertexCount: props.elementCount
    }));
    this.bufferTransform && this.bufferTransform.setupResources({
      model: this.model
    });
  }

  _updateModelProps(props) {
    let updatedProps = Object.assign({}, props);
    const resourceTransforms = [this.bufferTransform, this.textureTransform].filter(Boolean);

    for (const resourceTransform of resourceTransforms) {
      updatedProps = resourceTransform.updateModelProps(updatedProps);
    }

    return updatedProps;
  }

  _buildResourceTransforms(gl, props) {
    if (canCreateBufferTransform(props)) {
      this.bufferTransform = new BufferTransform(gl, props);
    }

    if (canCreateTextureTransform(props)) {
      this.textureTransform = new TextureTransform(gl, props);
    }

    assert$1(this.bufferTransform || this.textureTransform, 'must provide source/feedback buffers or source/target textures');
  }

  _updateDrawOptions(opts) {
    let updatedOpts = Object.assign({}, opts);
    const resourceTransforms = [this.bufferTransform, this.textureTransform].filter(Boolean);

    for (const resourceTransform of resourceTransforms) {
      updatedOpts = Object.assign(updatedOpts, resourceTransform.getDrawOptions(updatedOpts));
    }

    return updatedOpts;
  }

}

function canCreateBufferTransform(props) {
  if (!isObjectEmpty(props.feedbackBuffers) || !isObjectEmpty(props.feedbackMap) || props.varyings && props.varyings.length > 0) {
    return true;
  }

  return false;
}

function canCreateTextureTransform(props) {
  if (!isObjectEmpty(props._sourceTextures) || props._targetTexture || props._targetTextureVarying) {
    return true;
  }

  return false;
}

const vs$1 = "\nstruct VertexGeometry {\n  vec4 position;\n  vec3 worldPosition;\n  vec3 worldPositionAlt;\n  vec3 normal;\n  vec2 uv;\n  vec3 pickingColor;\n} geometry = VertexGeometry(\n  vec4(0.0),\n  vec3(0.0),\n  vec3(0.0),\n  vec3(0.0),\n  vec2(0.0),\n  vec3(0.0)\n);\n";
const fs = "\n#define SMOOTH_EDGE_RADIUS 0.5\n\nstruct FragmentGeometry {\n  vec2 uv;\n} geometry;\n\nfloat smoothedge(float edge, float x) {\n  return smoothstep(edge - SMOOTH_EDGE_RADIUS, edge + SMOOTH_EDGE_RADIUS, x);\n}\n";
var geometry = {
  name: 'geometry',
  vs: vs$1,
  fs
};

const COORDINATE_SYSTEM_GLSL_CONSTANTS = Object.keys(COORDINATE_SYSTEM).map(key => "const int COORDINATE_SYSTEM_".concat(key, " = ").concat(COORDINATE_SYSTEM[key], ";")).join('');
const PROJECTION_MODE_GLSL_CONSTANTS = Object.keys(PROJECTION_MODE).map(key => "const int PROJECTION_MODE_".concat(key, " = ").concat(PROJECTION_MODE[key], ";")).join('');
const UNIT_GLSL_CONSTANTS = Object.keys(UNIT).map(key => "const int UNIT_".concat(key.toUpperCase(), " = ").concat(UNIT[key], ";")).join('');
var projectShader = "".concat(COORDINATE_SYSTEM_GLSL_CONSTANTS, "\n").concat(PROJECTION_MODE_GLSL_CONSTANTS, "\n").concat(UNIT_GLSL_CONSTANTS, "\n\nuniform int project_uCoordinateSystem;\nuniform int project_uProjectionMode;\nuniform float project_uScale;\nuniform bool project_uWrapLongitude;\nuniform vec3 project_uCommonUnitsPerMeter;\nuniform vec3 project_uCommonUnitsPerWorldUnit;\nuniform vec3 project_uCommonUnitsPerWorldUnit2;\nuniform vec4 project_uCenter;\nuniform mat4 project_uModelMatrix;\nuniform mat4 project_uViewProjectionMatrix;\nuniform vec2 project_uViewportSize;\nuniform float project_uDevicePixelRatio;\nuniform float project_uFocalDistance;\nuniform vec3 project_uCameraPosition;\nuniform vec3 project_uCoordinateOrigin;\nuniform vec3 project_uCommonOrigin;\nuniform bool project_uPseudoMeters;\n\nconst float TILE_SIZE = 512.0;\nconst float PI = 3.1415926536;\nconst float WORLD_SCALE = TILE_SIZE / (PI * 2.0);\nconst vec3 ZERO_64_LOW = vec3(0.0);\nconst float EARTH_RADIUS = 6370972.0;\nconst float GLOBE_RADIUS = 256.0;\nfloat project_size() {\n  if (project_uProjectionMode == PROJECTION_MODE_WEB_MERCATOR &&\n    project_uCoordinateSystem == COORDINATE_SYSTEM_LNGLAT &&\n    project_uPseudoMeters == false) {\n    \n    if (geometry.position.w == 0.0) {\n      float y = clamp(geometry.worldPosition.y, -89.9, 89.9);\n      return 1.0 / cos(radians(y));\n    }\n  \n    float y = geometry.position.y / TILE_SIZE * 2.0 - 1.0;\n    float y2 = y * y;\n    float y4 = y2 * y2;\n    float y6 = y4 * y2;\n    return 1.0 + 4.9348 * y2 + 4.0587 * y4 + 1.5642 * y6;\n  }\n  return 1.0;\n}\nfloat project_size(float meters) {\n  return meters * project_uCommonUnitsPerMeter.z * project_size();\n}\n\nvec2 project_size(vec2 meters) {\n  return meters * project_uCommonUnitsPerMeter.xy * project_size();\n}\n\nvec3 project_size(vec3 meters) {\n  return meters * project_uCommonUnitsPerMeter * project_size();\n}\n\nvec4 project_size(vec4 meters) {\n  return vec4(meters.xyz * project_uCommonUnitsPerMeter, meters.w);\n}\nvec3 project_normal(vec3 vector) {\n  vec4 normal_modelspace = project_uModelMatrix * vec4(vector, 0.0);\n  return normalize(normal_modelspace.xyz * project_uCommonUnitsPerMeter);\n}\n\nvec4 project_offset_(vec4 offset) {\n  float dy = offset.y;\n  vec3 commonUnitsPerWorldUnit = project_uCommonUnitsPerWorldUnit + project_uCommonUnitsPerWorldUnit2 * dy;\n  return vec4(offset.xyz * commonUnitsPerWorldUnit, offset.w);\n}\nvec2 project_mercator_(vec2 lnglat) {\n  float x = lnglat.x;\n  if (project_uWrapLongitude) {\n    x = mod(x + 180., 360.0) - 180.;\n  }\n  float y = clamp(lnglat.y, -89.9, 89.9);\n  return vec2(\n    radians(x) + PI,\n    PI + log(tan_fp32(PI * 0.25 + radians(y) * 0.5))\n  ) * WORLD_SCALE;\n}\n\nvec3 project_globe_(vec3 lnglatz) {\n  float lambda = radians(lnglatz.x);\n  float phi = radians(lnglatz.y);\n  float cosPhi = cos(phi);\n  float D = (lnglatz.z / EARTH_RADIUS + 1.0) * GLOBE_RADIUS;\n\n  return vec3(\n    sin(lambda) * cosPhi,\n    -cos(lambda) * cosPhi,\n    sin(phi)\n  ) * D;\n}\nvec4 project_position(vec4 position, vec3 position64Low) {\n  vec4 position_world = project_uModelMatrix * position;\n  if (project_uProjectionMode == PROJECTION_MODE_WEB_MERCATOR) {\n    if (project_uCoordinateSystem == COORDINATE_SYSTEM_LNGLAT) {\n      return vec4(\n        project_mercator_(position_world.xy),\n        project_size(position_world.z),\n        position_world.w\n      );\n    }\n    if (project_uCoordinateSystem == COORDINATE_SYSTEM_CARTESIAN) {\n      position_world.xyz += project_uCoordinateOrigin;\n    }\n  }\n  if (project_uProjectionMode == PROJECTION_MODE_GLOBE) {\n    if (project_uCoordinateSystem == COORDINATE_SYSTEM_LNGLAT) {\n      return vec4(\n        project_globe_(position_world.xyz),\n        position_world.w\n      );\n    }\n  }\n  if (project_uProjectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET) {\n    if (project_uCoordinateSystem == COORDINATE_SYSTEM_LNGLAT) {\n      if (abs(position_world.y - project_uCoordinateOrigin.y) > 0.25) {\n        return vec4(\n          project_mercator_(position_world.xy) - project_uCommonOrigin.xy,\n          project_size(position_world.z),\n          position_world.w\n        );\n      }\n    }\n  }\n  if (project_uProjectionMode == PROJECTION_MODE_IDENTITY ||\n    (project_uProjectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET &&\n    (project_uCoordinateSystem == COORDINATE_SYSTEM_LNGLAT ||\n     project_uCoordinateSystem == COORDINATE_SYSTEM_CARTESIAN))) {\n    position_world.xyz -= project_uCoordinateOrigin;\n  }\n  return project_offset_(position_world + project_uModelMatrix * vec4(position64Low, 0.0));\n}\n\nvec4 project_position(vec4 position) {\n  return project_position(position, ZERO_64_LOW);\n}\n\nvec3 project_position(vec3 position, vec3 position64Low) {\n  vec4 projected_position = project_position(vec4(position, 1.0), position64Low);\n  return projected_position.xyz;\n}\n\nvec3 project_position(vec3 position) {\n  vec4 projected_position = project_position(vec4(position, 1.0), ZERO_64_LOW);\n  return projected_position.xyz;\n}\n\nvec2 project_position(vec2 position) {\n  vec4 projected_position = project_position(vec4(position, 0.0, 1.0), ZERO_64_LOW);\n  return projected_position.xy;\n}\n\nvec4 project_common_position_to_clipspace(vec4 position, mat4 viewProjectionMatrix, vec4 center) {\n  return viewProjectionMatrix * position + center;\n}\nvec4 project_common_position_to_clipspace(vec4 position) {\n  return project_common_position_to_clipspace(position, project_uViewProjectionMatrix, project_uCenter);\n}\nvec2 project_pixel_size_to_clipspace(vec2 pixels) {\n  vec2 offset = pixels / project_uViewportSize * project_uDevicePixelRatio * 2.0;\n  return offset * project_uFocalDistance;\n}\n\nfloat project_size_to_pixel(float meters) {\n  return project_size(meters) * project_uScale;\n}\nfloat project_size_to_pixel(float size, int unit) {\n  if (unit == UNIT_METERS) return project_size_to_pixel(size);\n  if (unit == UNIT_COMMON) return size * project_uScale;\n  return size;\n}\nfloat project_pixel_size(float pixels) {\n  return pixels / project_uScale;\n}\nvec2 project_pixel_size(vec2 pixels) {\n  return pixels / project_uScale;\n}\nmat3 project_get_orientation_matrix(vec3 up) {\n  vec3 uz = normalize(up);\n  vec3 ux = abs(uz.z) == 1.0 ? vec3(1.0, 0.0, 0.0) : normalize(vec3(uz.y, -uz.x, 0));\n  vec3 uy = cross(uz, ux);\n  return mat3(ux, uy, uz);\n}\n\nbool project_needs_rotation(vec3 commonPosition, out mat3 transform) {\n  if (project_uProjectionMode == PROJECTION_MODE_GLOBE) {\n    transform = project_get_orientation_matrix(commonPosition);\n    return true;\n  }\n  return false;\n}\n");

function isEqual(a, b) {
  if (a === b) {
    return true;
  }

  if (Array.isArray(a)) {
    const len = a.length;

    if (!b || b.length !== len) {
      return false;
    }

    for (let i = 0; i < len; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }

    return true;
  }

  return false;
}

function memoize(compute) {
  let cachedArgs = {};
  let cachedResult;
  return args => {
    for (const key in args) {
      if (!isEqual(args[key], cachedArgs[key])) {
        cachedResult = compute(args);
        cachedArgs = args;
        break;
      }
    }

    return cachedResult;
  };
}

const ZERO_VECTOR = [0, 0, 0, 0];
const VECTOR_TO_POINT_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0];
const IDENTITY_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const DEFAULT_PIXELS_PER_UNIT2 = [0, 0, 0];
const DEFAULT_COORDINATE_ORIGIN = [0, 0, 0];
const getMemoizedViewportUniforms = memoize(calculateViewportUniforms);
function getOffsetOrigin(viewport, coordinateSystem) {
  let coordinateOrigin = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : DEFAULT_COORDINATE_ORIGIN;

  if (coordinateOrigin.length < 3) {
    coordinateOrigin = [coordinateOrigin[0], coordinateOrigin[1], 0];
  }

  let shaderCoordinateOrigin = coordinateOrigin;
  let geospatialOrigin;
  let offsetMode = true;

  if (coordinateSystem === COORDINATE_SYSTEM.LNGLAT_OFFSETS || coordinateSystem === COORDINATE_SYSTEM.METER_OFFSETS) {
    geospatialOrigin = coordinateOrigin;
  } else {
    geospatialOrigin = viewport.isGeospatial ? [Math.fround(viewport.longitude), Math.fround(viewport.latitude), 0] : null;
  }

  switch (viewport.projectionMode) {
    case PROJECTION_MODE.WEB_MERCATOR:
      if (coordinateSystem === COORDINATE_SYSTEM.LNGLAT || coordinateSystem === COORDINATE_SYSTEM.CARTESIAN) {
        geospatialOrigin = [0, 0, 0];
        offsetMode = false;
      }

      break;

    case PROJECTION_MODE.WEB_MERCATOR_AUTO_OFFSET:
      if (coordinateSystem === COORDINATE_SYSTEM.LNGLAT) {
        shaderCoordinateOrigin = geospatialOrigin;
      } else if (coordinateSystem === COORDINATE_SYSTEM.CARTESIAN) {
        shaderCoordinateOrigin = [Math.fround(viewport.center[0]), Math.fround(viewport.center[1]), 0];
        geospatialOrigin = viewport.unprojectPosition(shaderCoordinateOrigin);
        shaderCoordinateOrigin[0] -= coordinateOrigin[0];
        shaderCoordinateOrigin[1] -= coordinateOrigin[1];
        shaderCoordinateOrigin[2] -= coordinateOrigin[2];
      }

      break;

    case PROJECTION_MODE.IDENTITY:
      shaderCoordinateOrigin = viewport.position.map(Math.fround);
      shaderCoordinateOrigin[2] = shaderCoordinateOrigin[2] || 0;
      break;

    case PROJECTION_MODE.GLOBE:
      offsetMode = false;
      geospatialOrigin = null;
      break;

    default:
      offsetMode = false;
  }

  return {
    geospatialOrigin,
    shaderCoordinateOrigin,
    offsetMode
  };
}

function calculateMatrixAndOffset(viewport, coordinateSystem, coordinateOrigin) {
  const {
    viewMatrixUncentered,
    projectionMatrix
  } = viewport;
  let {
    viewMatrix,
    viewProjectionMatrix
  } = viewport;
  let projectionCenter = ZERO_VECTOR;
  let originCommon = ZERO_VECTOR;
  let cameraPosCommon = viewport.cameraPosition;
  const {
    geospatialOrigin,
    shaderCoordinateOrigin,
    offsetMode
  } = getOffsetOrigin(viewport, coordinateSystem, coordinateOrigin);

  if (offsetMode) {
    originCommon = viewport.projectPosition(geospatialOrigin || shaderCoordinateOrigin);
    cameraPosCommon = [cameraPosCommon[0] - originCommon[0], cameraPosCommon[1] - originCommon[1], cameraPosCommon[2] - originCommon[2]];
    originCommon[3] = 1;
    projectionCenter = transformMat4([], originCommon, viewProjectionMatrix);
    viewMatrix = viewMatrixUncentered || viewMatrix;
    viewProjectionMatrix = multiply([], projectionMatrix, viewMatrix);
    viewProjectionMatrix = multiply([], viewProjectionMatrix, VECTOR_TO_POINT_MATRIX);
  }

  return {
    viewMatrix,
    viewProjectionMatrix,
    projectionCenter,
    originCommon,
    cameraPosCommon,
    shaderCoordinateOrigin,
    geospatialOrigin
  };
}

function getUniformsFromViewport() {
  let {
    viewport,
    devicePixelRatio = 1,
    modelMatrix = null,
    coordinateSystem = COORDINATE_SYSTEM.DEFAULT,
    coordinateOrigin,
    autoWrapLongitude = false
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  if (coordinateSystem === COORDINATE_SYSTEM.DEFAULT) {
    coordinateSystem = viewport.isGeospatial ? COORDINATE_SYSTEM.LNGLAT : COORDINATE_SYSTEM.CARTESIAN;
  }

  const uniforms = getMemoizedViewportUniforms({
    viewport,
    devicePixelRatio,
    coordinateSystem,
    coordinateOrigin
  });
  uniforms.project_uWrapLongitude = autoWrapLongitude;
  uniforms.project_uModelMatrix = modelMatrix || IDENTITY_MATRIX;
  return uniforms;
}

function calculateViewportUniforms(_ref) {
  let {
    viewport,
    devicePixelRatio,
    coordinateSystem,
    coordinateOrigin
  } = _ref;
  const {
    projectionCenter,
    viewProjectionMatrix,
    originCommon,
    cameraPosCommon,
    shaderCoordinateOrigin,
    geospatialOrigin
  } = calculateMatrixAndOffset(viewport, coordinateSystem, coordinateOrigin);
  const distanceScales = viewport.getDistanceScales();
  const viewportSize = [viewport.width * devicePixelRatio, viewport.height * devicePixelRatio];
  const focalDistance = transformMat4([], [0, 0, -viewport.focalDistance, 1], viewport.projectionMatrix)[3] || 1;
  const uniforms = {
    project_uCoordinateSystem: coordinateSystem,
    project_uProjectionMode: viewport.projectionMode,
    project_uCoordinateOrigin: shaderCoordinateOrigin,
    project_uCommonOrigin: originCommon.slice(0, 3),
    project_uCenter: projectionCenter,
    project_uPseudoMeters: Boolean(viewport._pseudoMeters),
    project_uViewportSize: viewportSize,
    project_uDevicePixelRatio: devicePixelRatio,
    project_uFocalDistance: focalDistance,
    project_uCommonUnitsPerMeter: distanceScales.unitsPerMeter,
    project_uCommonUnitsPerWorldUnit: distanceScales.unitsPerMeter,
    project_uCommonUnitsPerWorldUnit2: DEFAULT_PIXELS_PER_UNIT2,
    project_uScale: viewport.scale,
    project_uViewProjectionMatrix: viewProjectionMatrix,
    project_uCameraPosition: cameraPosCommon
  };

  if (geospatialOrigin) {
    const distanceScalesAtOrigin = viewport.getDistanceScales(geospatialOrigin);

    switch (coordinateSystem) {
      case COORDINATE_SYSTEM.METER_OFFSETS:
        uniforms.project_uCommonUnitsPerWorldUnit = distanceScalesAtOrigin.unitsPerMeter;
        uniforms.project_uCommonUnitsPerWorldUnit2 = distanceScalesAtOrigin.unitsPerMeter2;
        break;

      case COORDINATE_SYSTEM.LNGLAT:
      case COORDINATE_SYSTEM.LNGLAT_OFFSETS:
        if (!viewport._pseudoMeters) {
          uniforms.project_uCommonUnitsPerMeter = distanceScalesAtOrigin.unitsPerMeter;
        }

        uniforms.project_uCommonUnitsPerWorldUnit = distanceScalesAtOrigin.unitsPerDegree;
        uniforms.project_uCommonUnitsPerWorldUnit2 = distanceScalesAtOrigin.unitsPerDegree2;
        break;

      case COORDINATE_SYSTEM.CARTESIAN:
        uniforms.project_uCommonUnitsPerWorldUnit = [1, 1, distanceScalesAtOrigin.unitsPerMeter[2]];
        uniforms.project_uCommonUnitsPerWorldUnit2 = [0, 0, distanceScalesAtOrigin.unitsPerMeter2[2]];
        break;
    }
  }

  return uniforms;
}

const INITIAL_MODULE_OPTIONS = {};

function getUniforms() {
  let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : INITIAL_MODULE_OPTIONS;

  if (opts.viewport) {
    return getUniformsFromViewport(opts);
  }

  return {};
}

var project = {
  name: 'project',
  dependencies: [fp32, geometry],
  vs: projectShader,
  getUniforms
};

function fitBounds({
  width,
  height,
  bounds,
  minExtent = 0,
  maxZoom = 24,
  padding = 0,
  offset = [0, 0]
}) {
  const [[west, south], [east, north]] = bounds;

  if (Number.isFinite(padding)) {
    const p = padding;
    padding = {
      top: p,
      bottom: p,
      left: p,
      right: p
    };
  } else {
    assert$4(Number.isFinite(padding.top) && Number.isFinite(padding.bottom) && Number.isFinite(padding.left) && Number.isFinite(padding.right));
  }

  const nw = lngLatToWorld([west, clamp(north, -MAX_LATITUDE, MAX_LATITUDE)]);
  const se = lngLatToWorld([east, clamp(south, -MAX_LATITUDE, MAX_LATITUDE)]);
  const size = [Math.max(Math.abs(se[0] - nw[0]), minExtent), Math.max(Math.abs(se[1] - nw[1]), minExtent)];
  const targetSize = [width - padding.left - padding.right - Math.abs(offset[0]) * 2, height - padding.top - padding.bottom - Math.abs(offset[1]) * 2];
  assert$4(targetSize[0] > 0 && targetSize[1] > 0);
  const scaleX = targetSize[0] / size[0];
  const scaleY = targetSize[1] / size[1];
  const offsetX = (padding.right - padding.left) / 2 / scaleX;
  const offsetY = (padding.bottom - padding.top) / 2 / scaleY;
  const center = [(se[0] + nw[0]) / 2 + offsetX, (se[1] + nw[1]) / 2 + offsetY];
  const centerLngLat = worldToLngLat(center);
  const zoom = Math.min(maxZoom, log2(Math.abs(Math.min(scaleX, scaleY))));
  assert$4(Number.isFinite(zoom));
  return {
    longitude: centerLngLat[0],
    latitude: centerLngLat[1],
    zoom
  };
}

const DEGREES_TO_RADIANS$1 = Math.PI / 180;
function getBounds(viewport, z = 0) {
  const {
    width,
    height,
    unproject
  } = viewport;
  const unprojectOps = {
    targetZ: z
  };
  const bottomLeft = unproject([0, height], unprojectOps);
  const bottomRight = unproject([width, height], unprojectOps);
  let topLeft;
  let topRight;
  const halfFov = viewport.fovy ? 0.5 * viewport.fovy * DEGREES_TO_RADIANS$1 : Math.atan(0.5 / viewport.altitude);
  const angleToGround = (90 - viewport.pitch) * DEGREES_TO_RADIANS$1;

  if (halfFov > angleToGround - 0.01) {
    topLeft = unprojectOnFarPlane(viewport, 0, z);
    topRight = unprojectOnFarPlane(viewport, width, z);
  } else {
    topLeft = unproject([0, 0], unprojectOps);
    topRight = unproject([width, 0], unprojectOps);
  }

  return [bottomLeft, bottomRight, topRight, topLeft];
}

function unprojectOnFarPlane(viewport, x, targetZ) {
  const {
    pixelUnprojectionMatrix
  } = viewport;
  const coord0 = transformVector(pixelUnprojectionMatrix, [x, 0, 1, 1]);
  const coord1 = transformVector(pixelUnprojectionMatrix, [x, viewport.height, 1, 1]);
  const z = targetZ * viewport.distanceScales.unitsPerMeter[2];
  const t = (z - coord0[2]) / (coord1[2] - coord0[2]);
  const coord = lerp([], coord0, coord1, t);
  const result = worldToLngLat(coord);
  result[2] = targetZ;
  return result;
}

const TILE_SIZE = 512;
const EARTH_CIRCUMFERENCE = 40.03e6;
const DEGREES_TO_RADIANS = Math.PI / 180;

function unitsPerMeter(latitude) {
  const latCosine = Math.cos(latitude * DEGREES_TO_RADIANS);
  return TILE_SIZE / EARTH_CIRCUMFERENCE / latCosine;
}

class WebMercatorViewport extends Viewport {
  constructor() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const {
      latitude = 0,
      longitude = 0,
      zoom = 11,
      pitch = 0,
      bearing = 0,
      nearZMultiplier = 0.1,
      farZMultiplier = 1.01,
      orthographic = false,
      projectionMatrix,
      repeat = false,
      worldOffset = 0,
      legacyMeterSizes = false
    } = opts;
    let {
      width,
      height,
      altitude = 1.5
    } = opts;
    const scale = Math.pow(2, zoom);
    width = width || 1;
    height = height || 1;
    let fovy;
    let projectionParameters = null;

    if (projectionMatrix) {
      altitude = projectionMatrix[5] / 2;
      fovy = altitudeToFovy(altitude);
    } else {
      if (opts.fovy) {
        fovy = opts.fovy;
        altitude = fovyToAltitude(fovy);
      } else {
        fovy = altitudeToFovy(altitude);
      }

      projectionParameters = getProjectionParameters({
        width,
        height,
        pitch,
        fovy,
        nearZMultiplier,
        farZMultiplier
      });
    }

    let viewMatrixUncentered = getViewMatrix({
      height,
      pitch,
      bearing,
      scale,
      altitude
    });

    if (worldOffset) {
      const viewOffset = new Matrix4().translate([512 * worldOffset, 0, 0]);
      viewMatrixUncentered = viewOffset.multiplyLeft(viewMatrixUncentered);
    }

    super({ ...opts,
      width,
      height,
      viewMatrix: viewMatrixUncentered,
      longitude,
      latitude,
      zoom,
      ...projectionParameters,
      fovy,
      focalDistance: altitude
    });
    this.latitude = latitude;
    this.longitude = longitude;
    this.zoom = zoom;
    this.pitch = pitch;
    this.bearing = bearing;
    this.altitude = altitude;
    this.fovy = fovy;
    this.orthographic = orthographic;
    this._subViewports = repeat ? [] : null;
    this._pseudoMeters = legacyMeterSizes;
    Object.freeze(this);
  }

  get subViewports() {
    if (this._subViewports && !this._subViewports.length) {
      const bounds = this.getBounds();
      const minOffset = Math.floor((bounds[0] + 180) / 360);
      const maxOffset = Math.ceil((bounds[2] - 180) / 360);

      for (let x = minOffset; x <= maxOffset; x++) {
        const offsetViewport = x ? new WebMercatorViewport({ ...this,
          worldOffset: x
        }) : this;

        this._subViewports.push(offsetViewport);
      }
    }

    return this._subViewports;
  }

  projectPosition(xyz) {
    if (this._pseudoMeters) {
      return super.projectPosition(xyz);
    }

    const [X, Y] = this.projectFlat(xyz);
    const Z = (xyz[2] || 0) * unitsPerMeter(xyz[1]);
    return [X, Y, Z];
  }

  unprojectPosition(xyz) {
    if (this._pseudoMeters) {
      return super.unprojectPosition(xyz);
    }

    const [X, Y] = this.unprojectFlat(xyz);
    const Z = (xyz[2] || 0) / unitsPerMeter(Y);
    return [X, Y, Z];
  }

  addMetersToLngLat(lngLatZ, xyz) {
    return addMetersToLngLat(lngLatZ, xyz);
  }

  panByPosition(coords, pixel) {
    const fromLocation = pixelsToWorld(pixel, this.pixelUnprojectionMatrix);
    const toLocation = this.projectFlat(coords);
    const translate = add$1([], toLocation, negate([], fromLocation));
    const newCenter = add$1([], this.center, translate);
    const [longitude, latitude] = this.unprojectFlat(newCenter);
    return {
      longitude,
      latitude
    };
  }

  getBounds() {
    let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const corners = getBounds(this, options.z || 0);
    return [Math.min(corners[0][0], corners[1][0], corners[2][0], corners[3][0]), Math.min(corners[0][1], corners[1][1], corners[2][1], corners[3][1]), Math.max(corners[0][0], corners[1][0], corners[2][0], corners[3][0]), Math.max(corners[0][1], corners[1][1], corners[2][1], corners[3][1])];
  }

  fitBounds(bounds) {
    let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    const {
      width,
      height
    } = this;
    const {
      longitude,
      latitude,
      zoom
    } = fitBounds({
      width,
      height,
      bounds,
      ...options
    });
    return new WebMercatorViewport({
      width,
      height,
      longitude,
      latitude,
      zoom
    });
  }

}
WebMercatorViewport.displayName = 'WebMercatorViewport';

function lngLatZToWorldPosition(lngLatZ, viewport) {
  let offsetMode = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  const p = viewport.projectPosition(lngLatZ);

  if (offsetMode && viewport instanceof WebMercatorViewport) {
    const [longitude, latitude, z = 0] = lngLatZ;
    const distanceScales = viewport.getDistanceScales([longitude, latitude]);
    p[2] = z * distanceScales.unitsPerMeter[2];
  }

  return p;
}

function normalizeParameters(opts) {
  const normalizedParams = { ...opts
  };
  let {
    coordinateSystem
  } = opts;
  const {
    viewport,
    coordinateOrigin,
    fromCoordinateSystem,
    fromCoordinateOrigin
  } = opts;

  if (coordinateSystem === COORDINATE_SYSTEM.DEFAULT) {
    coordinateSystem = viewport.isGeospatial ? COORDINATE_SYSTEM.LNGLAT : COORDINATE_SYSTEM.CARTESIAN;
  }

  if (fromCoordinateSystem === undefined) {
    normalizedParams.fromCoordinateSystem = coordinateSystem;
  }

  if (fromCoordinateOrigin === undefined) {
    normalizedParams.fromCoordinateOrigin = coordinateOrigin;
  }

  normalizedParams.coordinateSystem = coordinateSystem;
  return normalizedParams;
}

function getWorldPosition(position, _ref) {
  let {
    viewport,
    modelMatrix,
    coordinateSystem,
    coordinateOrigin,
    offsetMode
  } = _ref;
  let [x, y, z = 0] = position;

  if (modelMatrix) {
    [x, y, z] = transformMat4([], [x, y, z, 1.0], modelMatrix);
  }

  switch (coordinateSystem) {
    case COORDINATE_SYSTEM.LNGLAT:
      return lngLatZToWorldPosition([x, y, z], viewport, offsetMode);

    case COORDINATE_SYSTEM.LNGLAT_OFFSETS:
      return lngLatZToWorldPosition([x + coordinateOrigin[0], y + coordinateOrigin[1], z + (coordinateOrigin[2] || 0)], viewport, offsetMode);

    case COORDINATE_SYSTEM.METER_OFFSETS:
      return lngLatZToWorldPosition(addMetersToLngLat(coordinateOrigin, [x, y, z]), viewport, offsetMode);

    case COORDINATE_SYSTEM.CARTESIAN:
    default:
      return viewport.isGeospatial ? [x + coordinateOrigin[0], y + coordinateOrigin[1], z + coordinateOrigin[2]] : viewport.projectPosition([x, y, z]);
  }
}
function projectPosition(position, params) {
  const {
    viewport,
    coordinateSystem,
    coordinateOrigin,
    modelMatrix,
    fromCoordinateSystem,
    fromCoordinateOrigin
  } = normalizeParameters(params);
  const {
    geospatialOrigin,
    shaderCoordinateOrigin,
    offsetMode
  } = getOffsetOrigin(viewport, coordinateSystem, coordinateOrigin);
  const worldPosition = getWorldPosition(position, {
    viewport,
    modelMatrix,
    coordinateSystem: fromCoordinateSystem,
    coordinateOrigin: fromCoordinateOrigin,
    offsetMode
  });

  if (offsetMode) {
    const positionCommonSpace = viewport.projectPosition(geospatialOrigin || shaderCoordinateOrigin);
    sub(worldPosition, worldPosition, positionCommonSpace);
  }

  return worldPosition;
}

const LIFECYCLE = {
  NO_STATE: 'Awaiting state',
  MATCHED: 'Matched. State transferred from previous layer',
  INITIALIZED: 'Initialized',
  AWAITING_GC: 'Discarded. Awaiting garbage collection',
  AWAITING_FINALIZATION: 'No longer matched. Awaiting garbage collection',
  FINALIZED: 'Finalized! Awaiting garbage collection'
};
const PROP_SYMBOLS = {
  COMPONENT: Symbol.for('component'),
  ASYNC_DEFAULTS: Symbol.for('asyncPropDefaults'),
  ASYNC_ORIGINAL: Symbol.for('asyncPropOriginal'),
  ASYNC_RESOLVED: Symbol.for('asyncPropResolved')
};

function flatten(array) {
  let filter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : () => true;

  if (!Array.isArray(array)) {
    return filter(array) ? [array] : [];
  }

  return flattenArray(array, filter, []);
}

function flattenArray(array, filter, result) {
  let index = -1;

  while (++index < array.length) {
    const value = array[index];

    if (Array.isArray(value)) {
      flattenArray(value, filter, result);
    } else if (filter(value)) {
      result.push(value);
    }
  }

  return result;
}

function fillArray(_ref) {
  let {
    target,
    source,
    start = 0,
    count = 1
  } = _ref;
  const length = source.length;
  const total = count * length;
  let copied = 0;

  for (let i = start; copied < length; copied++) {
    target[i++] = source[copied];
  }

  while (copied < total) {
    if (copied < total - copied) {
      target.copyWithin(start + copied, start, start + copied);
      copied *= 2;
    } else {
      target.copyWithin(start + copied, start, start + total - copied);
      copied = total;
    }
  }

  return target;
}

class ShaderAttribute {
  constructor(dataColumn, opts) {
    this.opts = opts;
    this.source = dataColumn;
  }

  get value() {
    return this.source.value;
  }

  getValue() {
    const buffer = this.source.getBuffer();
    const accessor = this.getAccessor();

    if (buffer) {
      return [buffer, accessor];
    }

    const {
      value
    } = this.source;
    const {
      size
    } = accessor;
    let constantValue = value;

    if (value && value.length !== size) {
      constantValue = new Float32Array(size);
      const index = accessor.elementOffset || 0;

      for (let i = 0; i < size; ++i) {
        constantValue[i] = value[index + i];
      }
    }

    return constantValue;
  }

  getAccessor() {
    return { ...this.source.getAccessor(),
      ...this.opts
    };
  }

}

function glArrayFromType(glType) {
  switch (glType) {
    case 5126:
      return Float32Array;

    case 5130:
      return Float64Array;

    case 5123:
    case 33635:
    case 32819:
    case 32820:
      return Uint16Array;

    case 5125:
      return Uint32Array;

    case 5121:
      return Uint8ClampedArray;

    case 5120:
      return Int8Array;

    case 5122:
      return Int16Array;

    case 5124:
      return Int32Array;

    default:
      throw new Error('Unknown GL type');
  }
}

function getStride(accessor) {
  return accessor.stride || accessor.size * accessor.bytesPerElement;
}

function resolveShaderAttribute(baseAccessor, shaderAttributeOptions) {
  if (shaderAttributeOptions.offset) {
    log$2.removed('shaderAttribute.offset', 'vertexOffset, elementOffset')();
  }

  const stride = getStride(baseAccessor);
  const vertexOffset = 'vertexOffset' in shaderAttributeOptions ? shaderAttributeOptions.vertexOffset : baseAccessor.vertexOffset || 0;
  const elementOffset = shaderAttributeOptions.elementOffset || 0;
  const offset = vertexOffset * stride + elementOffset * baseAccessor.bytesPerElement + (baseAccessor.offset || 0);
  return { ...shaderAttributeOptions,
    offset,
    stride
  };
}

function resolveDoublePrecisionShaderAttributes(baseAccessor, shaderAttributeOptions) {
  const resolvedOptions = resolveShaderAttribute(baseAccessor, shaderAttributeOptions);
  return {
    high: resolvedOptions,
    low: { ...resolvedOptions,
      offset: resolvedOptions.offset + baseAccessor.size * 4
    }
  };
}

class DataColumn {
  constructor(gl, opts) {
    this.gl = gl;
    this.id = opts.id;
    this.size = opts.size;
    const logicalType = opts.logicalType || opts.type;
    const doublePrecision = logicalType === 5130;
    let {
      defaultValue
    } = opts;
    defaultValue = Number.isFinite(defaultValue) ? [defaultValue] : defaultValue || new Array(this.size).fill(0);
    opts.defaultValue = defaultValue;
    let bufferType = logicalType;

    if (doublePrecision) {
      bufferType = 5126;
    } else if (!bufferType && opts.isIndexed) {
      bufferType = gl && hasFeature(gl, FEATURES$1.ELEMENT_INDEX_UINT32) ? 5125 : 5123;
    } else if (!bufferType) {
      bufferType = 5126;
    }

    opts.logicalType = logicalType;
    opts.type = bufferType;
    let defaultType = glArrayFromType(logicalType || bufferType || 5126);
    this.shaderAttributes = {};
    this.doublePrecision = doublePrecision;

    if (doublePrecision && opts.fp64 === false) {
      defaultType = Float32Array;
    }

    opts.bytesPerElement = defaultType.BYTES_PER_ELEMENT;
    this.defaultType = defaultType;
    this.value = null;
    this.settings = opts;
    this.state = {
      externalBuffer: null,
      bufferAccessor: opts,
      allocatedValue: null,
      constant: false
    };
    this._buffer = null;
    this.setData(opts);
  }

  get buffer() {
    if (!this._buffer) {
      const {
        isIndexed,
        type
      } = this.settings;
      this._buffer = new Buffer(this.gl, {
        id: this.id,
        target: isIndexed ? 34963 : 34962,
        accessor: {
          type
        }
      });
    }

    return this._buffer;
  }

  get byteOffset() {
    const accessor = this.getAccessor();

    if (accessor.vertexOffset) {
      return accessor.vertexOffset * getStride(accessor);
    }

    return 0;
  }

  delete() {
    if (this._buffer) {
      this._buffer.delete();

      this._buffer = null;
    }

    defaultTypedArrayManager.release(this.state.allocatedValue);
  }

  getShaderAttributes(id, options) {
    if (this.doublePrecision) {
      const shaderAttributes = {};
      const isBuffer64Bit = this.value instanceof Float64Array;
      const doubleShaderAttributeDefs = resolveDoublePrecisionShaderAttributes(this.getAccessor(), options || {});
      shaderAttributes[id] = new ShaderAttribute(this, doubleShaderAttributeDefs.high);
      shaderAttributes["".concat(id, "64Low")] = isBuffer64Bit ? new ShaderAttribute(this, doubleShaderAttributeDefs.low) : new Float32Array(this.size);
      return shaderAttributes;
    }

    if (options) {
      const shaderAttributeDef = resolveShaderAttribute(this.getAccessor(), options);
      return {
        [id]: new ShaderAttribute(this, shaderAttributeDef)
      };
    }

    return {
      [id]: this
    };
  }

  getBuffer() {
    if (this.state.constant) {
      return null;
    }

    return this.state.externalBuffer || this._buffer;
  }

  getValue() {
    if (this.state.constant) {
      return this.value;
    }

    return [this.getBuffer(), this.getAccessor()];
  }

  getAccessor() {
    return this.state.bufferAccessor;
  }

  setData(opts) {
    const {
      state
    } = this;

    if (ArrayBuffer.isView(opts)) {
      opts = {
        value: opts
      };
    } else if (opts instanceof Buffer) {
      opts = {
        buffer: opts
      };
    }

    const accessor = { ...this.settings,
      ...opts
    };
    state.bufferAccessor = accessor;

    if (opts.constant) {
      let value = opts.value;
      value = this._normalizeValue(value, [], 0);

      if (this.settings.normalized) {
        value = this._normalizeConstant(value);
      }

      const hasChanged = !state.constant || !this._areValuesEqual(value, this.value);

      if (!hasChanged) {
        return false;
      }

      state.externalBuffer = null;
      state.constant = true;
      this.value = value;
    } else if (opts.buffer) {
      const buffer = opts.buffer;
      state.externalBuffer = buffer;
      state.constant = false;
      this.value = opts.value;
      const isBuffer64Bit = opts.value instanceof Float64Array;
      accessor.type = opts.type || buffer.accessor.type;
      accessor.bytesPerElement = buffer.accessor.BYTES_PER_ELEMENT * (isBuffer64Bit ? 2 : 1);
      accessor.stride = getStride(accessor);
    } else if (opts.value) {
      this._checkExternalBuffer(opts);

      let value = opts.value;
      state.externalBuffer = null;
      state.constant = false;
      this.value = value;
      accessor.bytesPerElement = value.BYTES_PER_ELEMENT;
      accessor.stride = getStride(accessor);
      const {
        buffer,
        byteOffset
      } = this;

      if (this.doublePrecision && value instanceof Float64Array) {
        value = toDoublePrecisionArray(value, accessor);
      }

      const requiredBufferSize = value.byteLength + byteOffset + accessor.stride * 2;

      if (buffer.byteLength < requiredBufferSize) {
        buffer.reallocate(requiredBufferSize);
      }

      buffer.setAccessor(null);
      buffer.subData({
        data: value,
        offset: byteOffset
      });
      accessor.type = opts.type || buffer.accessor.type;
    }

    return true;
  }

  updateSubBuffer() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const {
      value
    } = this;
    const {
      startOffset = 0,
      endOffset
    } = opts;
    this.buffer.subData({
      data: this.doublePrecision && value instanceof Float64Array ? toDoublePrecisionArray(value, {
        size: this.size,
        startIndex: startOffset,
        endIndex: endOffset
      }) : value.subarray(startOffset, endOffset),
      offset: startOffset * value.BYTES_PER_ELEMENT + this.byteOffset
    });
  }

  allocate(_ref) {
    let {
      numInstances,
      copy = false
    } = _ref;
    const {
      state
    } = this;
    const oldValue = state.allocatedValue;
    const value = defaultTypedArrayManager.allocate(oldValue, numInstances + 1, {
      size: this.size,
      type: this.defaultType,
      copy
    });
    this.value = value;
    const {
      buffer,
      byteOffset
    } = this;

    if (buffer.byteLength < value.byteLength + byteOffset) {
      buffer.reallocate(value.byteLength + byteOffset);

      if (copy && oldValue) {
        buffer.subData({
          data: oldValue instanceof Float64Array ? toDoublePrecisionArray(oldValue, this) : oldValue,
          offset: byteOffset
        });
      }
    }

    state.allocatedValue = value;
    state.constant = false;
    state.externalBuffer = null;
    state.bufferAccessor = this.settings;
    return true;
  }

  _checkExternalBuffer(opts) {
    const {
      value
    } = opts;

    if (!opts.constant && value) {
      const ArrayType = this.defaultType;
      let illegalArrayType = false;

      if (this.doublePrecision) {
        illegalArrayType = value.BYTES_PER_ELEMENT < 4;
      }

      if (illegalArrayType) {
        throw new Error("Attribute ".concat(this.id, " does not support ").concat(value.constructor.name));
      }

      if (!(value instanceof ArrayType) && this.settings.normalized && !('normalized' in opts)) {
        log$2.warn("Attribute ".concat(this.id, " is normalized"))();
      }
    }
  }

  _normalizeConstant(value) {
    switch (this.settings.type) {
      case 5120:
        return new Float32Array(value).map(x => (x + 128) / 255 * 2 - 1);

      case 5122:
        return new Float32Array(value).map(x => (x + 32768) / 65535 * 2 - 1);

      case 5121:
        return new Float32Array(value).map(x => x / 255);

      case 5123:
        return new Float32Array(value).map(x => x / 65535);

      default:
        return value;
    }
  }

  _normalizeValue(value, out, start) {
    const {
      defaultValue,
      size
    } = this.settings;

    if (Number.isFinite(value)) {
      out[start] = value;
      return out;
    }

    if (!value) {
      out[start] = defaultValue[0];
      return out;
    }

    switch (size) {
      case 4:
        out[start + 3] = Number.isFinite(value[3]) ? value[3] : defaultValue[3];

      case 3:
        out[start + 2] = Number.isFinite(value[2]) ? value[2] : defaultValue[2];

      case 2:
        out[start + 1] = Number.isFinite(value[1]) ? value[1] : defaultValue[1];

      case 1:
        out[start + 0] = Number.isFinite(value[0]) ? value[0] : defaultValue[0];
        break;

      default:
        let i = size;

        while (--i >= 0) {
          out[start + i] = Number.isFinite(value[i]) ? value[i] : defaultValue[i];
        }

    }

    return out;
  }

  _areValuesEqual(value1, value2) {
    if (!value1 || !value2) {
      return false;
    }

    const {
      size
    } = this;

    for (let i = 0; i < size; i++) {
      if (value1[i] !== value2[i]) {
        return false;
      }
    }

    return true;
  }

}

const EMPTY_ARRAY$1 = [];
const placeholderArray = [];
function createIterable(data) {
  let startRow = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  let endRow = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : Infinity;
  let iterable = EMPTY_ARRAY$1;
  const objectInfo = {
    index: -1,
    data,
    target: []
  };

  if (!data) {
    iterable = EMPTY_ARRAY$1;
  } else if (typeof data[Symbol.iterator] === 'function') {
    iterable = data;
  } else if (data.length > 0) {
    placeholderArray.length = data.length;
    iterable = placeholderArray;
  }

  if (startRow > 0 || Number.isFinite(endRow)) {
    iterable = (Array.isArray(iterable) ? iterable : Array.from(iterable)).slice(startRow, endRow);
    objectInfo.index = startRow - 1;
  }

  return {
    iterable,
    objectInfo
  };
}
function isAsyncIterable(data) {
  return data && data[Symbol.asyncIterator];
}
function getAccessorFromBuffer(typedArray, _ref) {
  let {
    size,
    stride,
    offset,
    startIndices,
    nested
  } = _ref;
  const bytesPerElement = typedArray.BYTES_PER_ELEMENT;
  const elementStride = stride ? stride / bytesPerElement : size;
  const elementOffset = offset ? offset / bytesPerElement : 0;
  const vertexCount = Math.floor((typedArray.length - elementOffset) / elementStride);
  return (_, _ref2) => {
    let {
      index,
      target
    } = _ref2;

    if (!startIndices) {
      const sourceIndex = index * elementStride + elementOffset;

      for (let j = 0; j < size; j++) {
        target[j] = typedArray[sourceIndex + j];
      }

      return target;
    }

    const startIndex = startIndices[index];
    const endIndex = startIndices[index + 1] || vertexCount;
    let result;

    if (nested) {
      result = new Array(endIndex - startIndex);

      for (let i = startIndex; i < endIndex; i++) {
        const sourceIndex = i * elementStride + elementOffset;
        target = new Array(size);

        for (let j = 0; j < size; j++) {
          target[j] = typedArray[sourceIndex + j];
        }

        result[i - startIndex] = target;
      }
    } else if (elementStride === size) {
      result = typedArray.subarray(startIndex * size + elementOffset, endIndex * size + elementOffset);
    } else {
      result = new typedArray.constructor((endIndex - startIndex) * size);
      let targetIndex = 0;

      for (let i = startIndex; i < endIndex; i++) {
        const sourceIndex = i * elementStride + elementOffset;

        for (let j = 0; j < size; j++) {
          result[targetIndex++] = typedArray[sourceIndex + j];
        }
      }
    }

    return result;
  };
}

const EMPTY = [];
const FULL = [[0, Infinity]];
function add(rangeList, range) {
  if (rangeList === FULL) {
    return rangeList;
  }

  if (range[0] < 0) {
    range[0] = 0;
  }

  if (range[0] >= range[1]) {
    return rangeList;
  }

  const newRangeList = [];
  const len = rangeList.length;
  let insertPosition = 0;

  for (let i = 0; i < len; i++) {
    const range0 = rangeList[i];

    if (range0[1] < range[0]) {
      newRangeList.push(range0);
      insertPosition = i + 1;
    } else if (range0[0] > range[1]) {
      newRangeList.push(range0);
    } else {
      range = [Math.min(range0[0], range[0]), Math.max(range0[1], range[1])];
    }
  }

  newRangeList.splice(insertPosition, 0, range);
  return newRangeList;
}

function padArrayChunk(_ref) {
  let {
    source,
    target,
    start = 0,
    end,
    size,
    getData
  } = _ref;
  end = end || target.length;
  const sourceLength = source.length;
  const targetLength = end - start;

  if (sourceLength > targetLength) {
    target.set(source.subarray(0, targetLength), start);
    return;
  }

  target.set(source, start);

  if (!getData) {
    return;
  }

  let i = sourceLength;

  while (i < targetLength) {
    const datum = getData(i, source);

    for (let j = 0; j < size; j++) {
      target[start + i] = datum[j] || 0;
      i++;
    }
  }
}

function padArray(_ref2) {
  let {
    source,
    target,
    size,
    getData,
    sourceStartIndices,
    targetStartIndices
  } = _ref2;

  if (!Array.isArray(targetStartIndices)) {
    padArrayChunk({
      source,
      target,
      size,
      getData
    });
    return target;
  }

  let sourceIndex = 0;
  let targetIndex = 0;

  const getChunkData = getData && ((i, chunk) => getData(i + targetIndex, chunk));

  const n = Math.min(sourceStartIndices.length, targetStartIndices.length);

  for (let i = 1; i < n; i++) {
    const nextSourceIndex = sourceStartIndices[i] * size;
    const nextTargetIndex = targetStartIndices[i] * size;
    padArrayChunk({
      source: source.subarray(sourceIndex, nextSourceIndex),
      target,
      start: targetIndex,
      end: nextTargetIndex,
      size,
      getData: getChunkData
    });
    sourceIndex = nextSourceIndex;
    targetIndex = nextTargetIndex;
  }

  if (targetIndex < target.length) {
    padArrayChunk({
      source: [],
      target,
      start: targetIndex,
      size,
      getData: getChunkData
    });
  }

  return target;
}

const DEFAULT_TRANSITION_SETTINGS = {
  interpolation: {
    duration: 0,
    easing: t => t
  },
  spring: {
    stiffness: 0.05,
    damping: 0.5
  }
};
function normalizeTransitionSettings(userSettings, layerSettings) {
  if (!userSettings) {
    return null;
  }

  if (Number.isFinite(userSettings)) {
    userSettings = {
      duration: userSettings
    };
  }

  userSettings.type = userSettings.type || 'interpolation';
  return { ...DEFAULT_TRANSITION_SETTINGS[userSettings.type],
    ...layerSettings,
    ...userSettings
  };
}
function getSourceBufferAttribute(gl, attribute) {
  const buffer = attribute.getBuffer();

  if (buffer) {
    return [attribute.getBuffer(), {
      divisor: 0,
      size: attribute.size,
      normalized: attribute.settings.normalized
    }];
  }

  return attribute.value;
}
function getAttributeTypeFromSize(size) {
  switch (size) {
    case 1:
      return 'float';

    case 2:
      return 'vec2';

    case 3:
      return 'vec3';

    case 4:
      return 'vec4';

    default:
      throw new Error("No defined attribute type for size \"".concat(size, "\""));
  }
}
function cycleBuffers(buffers) {
  buffers.push(buffers.shift());
}
function getAttributeBufferLength(attribute, numInstances) {
  const {
    doublePrecision,
    settings,
    value,
    size
  } = attribute;
  const multiplier = doublePrecision && value instanceof Float64Array ? 2 : 1;
  return (settings.noAlloc ? value.length : numInstances * size) * multiplier;
}
function padBuffer(_ref) {
  let {
    buffer,
    numInstances,
    attribute,
    fromLength,
    fromStartIndices,
    getData = x => x
  } = _ref;
  const precisionMultiplier = attribute.doublePrecision && attribute.value instanceof Float64Array ? 2 : 1;
  const size = attribute.size * precisionMultiplier;
  const byteOffset = attribute.byteOffset;
  const toStartIndices = attribute.startIndices;
  const hasStartIndices = fromStartIndices && toStartIndices;
  const toLength = getAttributeBufferLength(attribute, numInstances);
  const isConstant = attribute.state.constant;

  if (!hasStartIndices && fromLength >= toLength) {
    return;
  }

  const toData = isConstant ? attribute.value : attribute.getBuffer().getData({
    srcByteOffset: byteOffset
  });

  if (attribute.settings.normalized && !isConstant) {
    const getter = getData;

    getData = (value, chunk) => attribute._normalizeConstant(getter(value, chunk));
  }

  const getMissingData = isConstant ? (i, chunk) => getData(toData, chunk) : (i, chunk) => getData(toData.subarray(i, i + size), chunk);
  const source = buffer.getData({
    length: fromLength
  });
  const data = new Float32Array(toLength);
  padArray({
    source,
    target: data,
    sourceStartIndices: fromStartIndices,
    targetStartIndices: toStartIndices,
    size,
    getData: getMissingData
  });

  if (buffer.byteLength < data.byteLength + byteOffset) {
    buffer.reallocate(data.byteLength + byteOffset);
  }

  buffer.subData({
    data,
    offset: byteOffset
  });
}

class Attribute extends DataColumn {
  constructor(gl) {
    let opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    super(gl, opts);
    const {
      transition = false,
      noAlloc = false,
      update = null,
      accessor = null,
      transform = null,
      startIndices = null
    } = opts;
    Object.assign(this.settings, {
      transition,
      noAlloc,
      update: update || accessor && this._autoUpdater,
      accessor,
      transform
    });
    Object.assign(this.state, {
      lastExternalBuffer: null,
      binaryValue: null,
      binaryAccessor: null,
      needsUpdate: true,
      needsRedraw: false,
      updateRanges: FULL,
      startIndices
    });
    Object.seal(this.settings);
    Object.seal(this.state);

    this._validateAttributeUpdaters();
  }

  get startIndices() {
    return this.state.startIndices;
  }

  set startIndices(layout) {
    this.state.startIndices = layout;
  }

  needsUpdate() {
    return this.state.needsUpdate;
  }

  needsRedraw() {
    let {
      clearChangedFlags = false
    } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const needsRedraw = this.state.needsRedraw;
    this.state.needsRedraw = needsRedraw && !clearChangedFlags;
    return needsRedraw;
  }

  getUpdateTriggers() {
    const {
      accessor
    } = this.settings;
    return [this.id].concat(typeof accessor !== 'function' && accessor || []);
  }

  supportsTransition() {
    return Boolean(this.settings.transition);
  }

  getTransitionSetting(opts) {
    if (!opts || !this.supportsTransition()) {
      return null;
    }

    const {
      accessor
    } = this.settings;
    const layerSettings = this.settings.transition;
    const userSettings = Array.isArray(accessor) ? opts[accessor.find(a => opts[a])] : opts[accessor];
    return normalizeTransitionSettings(userSettings, layerSettings);
  }

  setNeedsUpdate() {
    let reason = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.id;
    let dataRange = arguments.length > 1 ? arguments[1] : undefined;
    this.state.needsUpdate = this.state.needsUpdate || reason;
    this.setNeedsRedraw(reason);

    if (dataRange) {
      const {
        startRow = 0,
        endRow = Infinity
      } = dataRange;
      this.state.updateRanges = add(this.state.updateRanges, [startRow, endRow]);
    } else {
      this.state.updateRanges = FULL;
    }
  }

  clearNeedsUpdate() {
    this.state.needsUpdate = false;
    this.state.updateRanges = EMPTY;
  }

  setNeedsRedraw() {
    let reason = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.id;
    this.state.needsRedraw = this.state.needsRedraw || reason;
  }

  update(opts) {
    this.setData(opts);
  }

  allocate(numInstances) {
    const {
      state,
      settings
    } = this;

    if (settings.noAlloc) {
      return false;
    }

    if (settings.update) {
      super.allocate({
        numInstances,
        copy: state.updateRanges !== FULL
      });
      return true;
    }

    return false;
  }

  updateBuffer(_ref) {
    let {
      numInstances,
      data,
      props,
      context
    } = _ref;

    if (!this.needsUpdate()) {
      return false;
    }

    const {
      state: {
        updateRanges
      },
      settings: {
        update,
        noAlloc
      }
    } = this;
    let updated = true;

    if (update) {
      for (const [startRow, endRow] of updateRanges) {
        update.call(context, this, {
          data,
          startRow,
          endRow,
          props,
          numInstances
        });
      }

      if (!this.value) ; else if (this.constant || this.buffer.byteLength < this.value.byteLength + this.byteOffset) {
        this.setData({
          value: this.value,
          constant: this.constant
        });
        this.constant = false;
      } else {
        for (const [startRow, endRow] of updateRanges) {
          const startOffset = Number.isFinite(startRow) ? this.getVertexOffset(startRow) : 0;
          const endOffset = Number.isFinite(endRow) ? this.getVertexOffset(endRow) : noAlloc || !Number.isFinite(numInstances) ? this.value.length : numInstances * this.size;
          super.updateSubBuffer({
            startOffset,
            endOffset
          });
        }
      }

      this._checkAttributeArray();
    } else {
      updated = false;
    }

    this.clearNeedsUpdate();
    this.setNeedsRedraw();
    return updated;
  }

  setConstantValue(value) {
    if (value === undefined || typeof value === 'function') {
      return false;
    }

    const hasChanged = this.setData({
      constant: true,
      value
    });

    if (hasChanged) {
      this.setNeedsRedraw();
    }

    this.clearNeedsUpdate();
    return true;
  }

  setExternalBuffer(buffer) {
    const {
      state
    } = this;

    if (!buffer) {
      state.lastExternalBuffer = null;
      return false;
    }

    this.clearNeedsUpdate();

    if (state.lastExternalBuffer === buffer) {
      return true;
    }

    state.lastExternalBuffer = buffer;
    this.setNeedsRedraw();
    this.setData(buffer);
    return true;
  }

  setBinaryValue(buffer) {
    let startIndices = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    const {
      state,
      settings
    } = this;

    if (!buffer) {
      state.binaryValue = null;
      state.binaryAccessor = null;
      return false;
    }

    if (settings.noAlloc) {
      return false;
    }

    if (state.binaryValue === buffer) {
      this.clearNeedsUpdate();
      return true;
    }

    state.binaryValue = buffer;
    this.setNeedsRedraw();

    if (ArrayBuffer.isView(buffer)) {
      buffer = {
        value: buffer
      };
    }

    const needsUpdate = settings.transform || startIndices !== this.startIndices;

    if (needsUpdate) {
      assert$5(ArrayBuffer.isView(buffer.value), "invalid ".concat(settings.accessor));
      const needsNormalize = buffer.size && buffer.size !== this.size;
      state.binaryAccessor = getAccessorFromBuffer(buffer.value, {
        size: buffer.size || this.size,
        stride: buffer.stride,
        offset: buffer.offset,
        startIndices,
        nested: needsNormalize
      });
      return false;
    }

    this.clearNeedsUpdate();
    this.setData(buffer);
    return true;
  }

  getVertexOffset(row) {
    const {
      startIndices
    } = this;
    const vertexIndex = startIndices ? startIndices[row] : row;
    return vertexIndex * this.size;
  }

  getShaderAttributes() {
    const shaderAttributeDefs = this.settings.shaderAttributes || {
      [this.id]: null
    };
    const shaderAttributes = {};

    for (const shaderAttributeName in shaderAttributeDefs) {
      Object.assign(shaderAttributes, super.getShaderAttributes(shaderAttributeName, shaderAttributeDefs[shaderAttributeName]));
    }

    return shaderAttributes;
  }

  _autoUpdater(attribute, _ref2) {
    let {
      data,
      startRow,
      endRow,
      props,
      numInstances
    } = _ref2;

    if (attribute.constant) {
      return;
    }

    const {
      settings,
      state,
      value,
      size,
      startIndices
    } = attribute;
    const {
      accessor,
      transform
    } = settings;
    const accessorFunc = state.binaryAccessor || (typeof accessor === 'function' ? accessor : props[accessor]);
    assert$5(typeof accessorFunc === 'function', "accessor \"".concat(accessor, "\" is not a function"));
    let i = attribute.getVertexOffset(startRow);
    const {
      iterable,
      objectInfo
    } = createIterable(data, startRow, endRow);

    for (const object of iterable) {
      objectInfo.index++;
      let objectValue = accessorFunc(object, objectInfo);

      if (transform) {
        objectValue = transform.call(this, objectValue);
      }

      if (startIndices) {
        const numVertices = (objectInfo.index < startIndices.length - 1 ? startIndices[objectInfo.index + 1] : numInstances) - startIndices[objectInfo.index];

        if (objectValue && Array.isArray(objectValue[0])) {
          let startIndex = i;

          for (const item of objectValue) {
            attribute._normalizeValue(item, value, startIndex);

            startIndex += size;
          }
        } else if (objectValue && objectValue.length > size) {
          value.set(objectValue, i);
        } else {
          attribute._normalizeValue(objectValue, objectInfo.target, 0);

          fillArray({
            target: value,
            source: objectInfo.target,
            start: i,
            count: numVertices
          });
        }

        i += numVertices * size;
      } else {
        attribute._normalizeValue(objectValue, value, i);

        i += size;
      }
    }
  }

  _validateAttributeUpdaters() {
    const {
      settings
    } = this;
    const hasUpdater = settings.noAlloc || typeof settings.update === 'function';

    if (!hasUpdater) {
      throw new Error("Attribute ".concat(this.id, " missing update or accessor"));
    }
  }

  _checkAttributeArray() {
    const {
      value
    } = this;
    const limit = Math.min(4, this.size);

    if (value && value.length >= limit) {
      let valid = true;

      switch (limit) {
        case 4:
          valid = valid && Number.isFinite(value[3]);

        case 3:
          valid = valid && Number.isFinite(value[2]);

        case 2:
          valid = valid && Number.isFinite(value[1]);

        case 1:
          valid = valid && Number.isFinite(value[0]);
          break;

        default:
          valid = false;
      }

      if (!valid) {
        throw new Error("Illegal attribute generated for ".concat(this.id));
      }
    }
  }

}

class GPUInterpolationTransition {
  constructor(_ref) {
    let {
      gl,
      attribute,
      timeline
    } = _ref;
    this.gl = gl;
    this.type = 'interpolation';
    this.transition = new Transition(timeline);
    this.attribute = attribute;
    this.attributeInTransition = new Attribute(gl, attribute.settings);
    this.currentStartIndices = attribute.startIndices;
    this.currentLength = 0;
    this.transform = getTransform$1(gl, attribute);
    const bufferOpts = {
      byteLength: 0,
      usage: 35050
    };
    this.buffers = [new Buffer(gl, bufferOpts), new Buffer(gl, bufferOpts)];
  }

  get inProgress() {
    return this.transition.inProgress;
  }

  start(transitionSettings, numInstances) {
    if (transitionSettings.duration <= 0) {
      this.transition.cancel();
      return;
    }

    const {
      gl,
      buffers,
      attribute
    } = this;
    cycleBuffers(buffers);
    const padBufferOpts = {
      numInstances,
      attribute,
      fromLength: this.currentLength,
      fromStartIndices: this.currentStartIndices,
      getData: transitionSettings.enter
    };

    for (const buffer of buffers) {
      padBuffer({
        buffer,
        ...padBufferOpts
      });
    }

    this.currentStartIndices = attribute.startIndices;
    this.currentLength = getAttributeBufferLength(attribute, numInstances);
    this.attributeInTransition.update({
      buffer: buffers[1],
      value: attribute.value
    });
    this.transition.start(transitionSettings);
    this.transform.update({
      elementCount: Math.floor(this.currentLength / attribute.size),
      sourceBuffers: {
        aFrom: buffers[0],
        aTo: getSourceBufferAttribute(gl, attribute)
      },
      feedbackBuffers: {
        vCurrent: buffers[1]
      }
    });
  }

  update() {
    const updated = this.transition.update();

    if (updated) {
      const {
        time,
        settings: {
          duration,
          easing
        }
      } = this.transition;
      const t = easing(time / duration);
      this.transform.run({
        uniforms: {
          time: t
        }
      });
    }

    return updated;
  }

  cancel() {
    this.transition.cancel();
    this.transform.delete();

    while (this.buffers.length) {
      this.buffers.pop().delete();
    }
  }

}
const vs = "\n#define SHADER_NAME interpolation-transition-vertex-shader\n\nuniform float time;\nattribute ATTRIBUTE_TYPE aFrom;\nattribute ATTRIBUTE_TYPE aTo;\nvarying ATTRIBUTE_TYPE vCurrent;\n\nvoid main(void) {\n  vCurrent = mix(aFrom, aTo, time);\n  gl_Position = vec4(0.0);\n}\n";

function getTransform$1(gl, attribute) {
  const attributeType = getAttributeTypeFromSize(attribute.size);
  return new Transform(gl, {
    vs,
    defines: {
      ATTRIBUTE_TYPE: attributeType
    },
    varyings: ['vCurrent']
  });
}

class GPUSpringTransition {
  constructor(_ref) {
    let {
      gl,
      attribute,
      timeline
    } = _ref;
    this.gl = gl;
    this.type = 'spring';
    this.transition = new Transition(timeline);
    this.attribute = attribute;
    this.attributeInTransition = new Attribute(gl, { ...attribute.settings,
      normalized: false
    });
    this.currentStartIndices = attribute.startIndices;
    this.currentLength = 0;
    this.texture = getTexture(gl);
    this.framebuffer = getFramebuffer(gl, this.texture);
    this.transform = getTransform(gl, attribute, this.framebuffer);
    const bufferOpts = {
      byteLength: 0,
      usage: 35050
    };
    this.buffers = [new Buffer(gl, bufferOpts), new Buffer(gl, bufferOpts), new Buffer(gl, bufferOpts)];
  }

  get inProgress() {
    return this.transition.inProgress;
  }

  start(transitionSettings, numInstances) {
    const {
      gl,
      buffers,
      attribute
    } = this;
    const padBufferOpts = {
      numInstances,
      attribute,
      fromLength: this.currentLength,
      fromStartIndices: this.currentStartIndices,
      getData: transitionSettings.enter
    };

    for (const buffer of buffers) {
      padBuffer({
        buffer,
        ...padBufferOpts
      });
    }

    this.currentStartIndices = attribute.startIndices;
    this.currentLength = getAttributeBufferLength(attribute, numInstances);
    this.attributeInTransition.update({
      buffer: buffers[1],
      value: attribute.value
    });
    this.transition.start(transitionSettings);
    this.transform.update({
      elementCount: Math.floor(this.currentLength / attribute.size),
      sourceBuffers: {
        aTo: getSourceBufferAttribute(gl, attribute)
      }
    });
  }

  update() {
    const {
      buffers,
      transform,
      framebuffer,
      transition
    } = this;
    const updated = transition.update();

    if (!updated) {
      return false;
    }

    transform.update({
      sourceBuffers: {
        aPrev: buffers[0],
        aCur: buffers[1]
      },
      feedbackBuffers: {
        vNext: buffers[2]
      }
    });
    transform.run({
      framebuffer,
      discard: false,
      clearRenderTarget: true,
      uniforms: {
        stiffness: transition.settings.stiffness,
        damping: transition.settings.damping
      },
      parameters: {
        depthTest: false,
        blend: true,
        viewport: [0, 0, 1, 1],
        blendFunc: [1, 1],
        blendEquation: [32776, 32776]
      }
    });
    cycleBuffers(buffers);
    this.attributeInTransition.update({
      buffer: buffers[1],
      value: this.attribute.value
    });
    const isTransitioning = readPixelsToArray(framebuffer)[0] > 0;

    if (!isTransitioning) {
      transition.end();
    }

    return true;
  }

  cancel() {
    this.transition.cancel();
    this.transform.delete();

    while (this.buffers.length) {
      this.buffers.pop().delete();
    }

    this.texture.delete();
    this.texture = null;
    this.framebuffer.delete();
    this.framebuffer = null;
  }

}

function getTransform(gl, attribute, framebuffer) {
  const attributeType = getAttributeTypeFromSize(attribute.size);
  return new Transform(gl, {
    framebuffer,
    vs: "\n#define SHADER_NAME spring-transition-vertex-shader\n\n#define EPSILON 0.00001\n\nuniform float stiffness;\nuniform float damping;\nattribute ATTRIBUTE_TYPE aPrev;\nattribute ATTRIBUTE_TYPE aCur;\nattribute ATTRIBUTE_TYPE aTo;\nvarying ATTRIBUTE_TYPE vNext;\nvarying float vIsTransitioningFlag;\n\nATTRIBUTE_TYPE getNextValue(ATTRIBUTE_TYPE cur, ATTRIBUTE_TYPE prev, ATTRIBUTE_TYPE dest) {\n  ATTRIBUTE_TYPE velocity = cur - prev;\n  ATTRIBUTE_TYPE delta = dest - cur;\n  ATTRIBUTE_TYPE spring = delta * stiffness;\n  ATTRIBUTE_TYPE damper = velocity * -1.0 * damping;\n  return spring + damper + velocity + cur;\n}\n\nvoid main(void) {\n  bool isTransitioning = length(aCur - aPrev) > EPSILON || length(aTo - aCur) > EPSILON;\n  vIsTransitioningFlag = isTransitioning ? 1.0 : 0.0;\n\n  vNext = getNextValue(aCur, aPrev, aTo);\n  gl_Position = vec4(0, 0, 0, 1);\n  gl_PointSize = 100.0;\n}\n",
    fs: "\n#define SHADER_NAME spring-transition-is-transitioning-fragment-shader\n\nvarying float vIsTransitioningFlag;\n\nvoid main(void) {\n  if (vIsTransitioningFlag == 0.0) {\n    discard;\n  }\n  gl_FragColor = vec4(1.0);\n}",
    defines: {
      ATTRIBUTE_TYPE: attributeType
    },
    varyings: ['vNext']
  });
}

function getTexture(gl) {
  return new Texture2D(gl, {
    data: new Uint8Array(4),
    format: 6408,
    type: 5121,
    border: 0,
    mipmaps: false,
    dataFormat: 6408,
    width: 1,
    height: 1
  });
}

function getFramebuffer(gl, texture) {
  return new Framebuffer(gl, {
    id: 'spring-transition-is-transitioning-framebuffer',
    width: 1,
    height: 1,
    attachments: {
      [36064]: texture
    }
  });
}

const TRANSITION_TYPES$1 = {
  interpolation: GPUInterpolationTransition,
  spring: GPUSpringTransition
};
class AttributeTransitionManager {
  constructor(gl, _ref) {
    let {
      id,
      timeline
    } = _ref;
    this.id = id;
    this.gl = gl;
    this.timeline = timeline;
    this.transitions = {};
    this.needsRedraw = false;
    this.numInstances = 1;
    this.isSupported = Transform.isSupported(gl);
  }

  finalize() {
    for (const attributeName in this.transitions) {
      this._removeTransition(attributeName);
    }
  }

  update(_ref2) {
    let {
      attributes,
      transitions,
      numInstances
    } = _ref2;
    this.numInstances = numInstances || 1;

    for (const attributeName in attributes) {
      const attribute = attributes[attributeName];
      const settings = attribute.getTransitionSetting(transitions);
      if (!settings) continue;

      this._updateAttribute(attributeName, attribute, settings);
    }

    for (const attributeName in this.transitions) {
      const attribute = attributes[attributeName];

      if (!attribute || !attribute.getTransitionSetting(transitions)) {
        this._removeTransition(attributeName);
      }
    }
  }

  hasAttribute(attributeName) {
    const transition = this.transitions[attributeName];
    return transition && transition.inProgress;
  }

  getAttributes() {
    const animatedAttributes = {};

    for (const attributeName in this.transitions) {
      const transition = this.transitions[attributeName];

      if (transition.inProgress) {
        animatedAttributes[attributeName] = transition.attributeInTransition;
      }
    }

    return animatedAttributes;
  }

  run() {
    if (!this.isSupported || this.numInstances === 0) {
      return false;
    }

    for (const attributeName in this.transitions) {
      const updated = this.transitions[attributeName].update();

      if (updated) {
        this.needsRedraw = true;
      }
    }

    const needsRedraw = this.needsRedraw;
    this.needsRedraw = false;
    return needsRedraw;
  }

  _removeTransition(attributeName) {
    this.transitions[attributeName].cancel();
    delete this.transitions[attributeName];
  }

  _updateAttribute(attributeName, attribute, settings) {
    const transition = this.transitions[attributeName];
    let isNew = !transition || transition.type !== settings.type;

    if (isNew) {
      if (!this.isSupported) {
        log$2.warn("WebGL2 not supported by this browser. Transition for ".concat(attributeName, " is disabled."))();
        return;
      }

      if (transition) {
        this._removeTransition(attributeName);
      }

      const TransitionType = TRANSITION_TYPES$1[settings.type];

      if (TransitionType) {
        this.transitions[attributeName] = new TransitionType({
          attribute,
          timeline: this.timeline,
          gl: this.gl
        });
      } else {
        log$2.error("unsupported transition type '".concat(settings.type, "'"))();
        isNew = false;
      }
    }

    if (isNew || attribute.needsRedraw()) {
      this.needsRedraw = true;
      this.transitions[attributeName].start(settings, this.numInstances);
    }
  }

}

const TRACE_INVALIDATE = 'attributeManager.invalidate';
const TRACE_UPDATE_START = 'attributeManager.updateStart';
const TRACE_UPDATE_END = 'attributeManager.updateEnd';
const TRACE_ATTRIBUTE_UPDATE_START = 'attribute.updateStart';
const TRACE_ATTRIBUTE_ALLOCATE = 'attribute.allocate';
const TRACE_ATTRIBUTE_UPDATE_END = 'attribute.updateEnd';
class AttributeManager {
  constructor(gl) {
    let {
      id = 'attribute-manager',
      stats,
      timeline
    } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    this.id = id;
    this.gl = gl;
    this.attributes = {};
    this.updateTriggers = {};
    this.accessors = {};
    this.needsRedraw = true;
    this.userData = {};
    this.stats = stats;
    this.attributeTransitionManager = new AttributeTransitionManager(gl, {
      id: "".concat(id, "-transitions"),
      timeline
    });
    Object.seal(this);
  }

  finalize() {
    for (const attributeName in this.attributes) {
      this.attributes[attributeName].delete();
    }

    this.attributeTransitionManager.finalize();
  }

  getNeedsRedraw() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      clearRedrawFlags: false
    };
    const redraw = this.needsRedraw;
    this.needsRedraw = this.needsRedraw && !opts.clearRedrawFlags;
    return redraw && this.id;
  }

  setNeedsRedraw() {
    this.needsRedraw = true;
    return this;
  }

  add(attributes, updaters) {
    this._add(attributes, updaters);
  }

  addInstanced(attributes, updaters) {
    this._add(attributes, updaters, {
      instanced: 1
    });
  }

  remove(attributeNameArray) {
    for (let i = 0; i < attributeNameArray.length; i++) {
      const name = attributeNameArray[i];

      if (this.attributes[name] !== undefined) {
        this.attributes[name].delete();
        delete this.attributes[name];
      }
    }
  }

  invalidate(triggerName, dataRange) {
    const invalidatedAttributes = this._invalidateTrigger(triggerName, dataRange);

    debug(TRACE_INVALIDATE, this, triggerName, invalidatedAttributes);
  }

  invalidateAll(dataRange) {
    for (const attributeName in this.attributes) {
      this.attributes[attributeName].setNeedsUpdate(attributeName, dataRange);
    }

    debug(TRACE_INVALIDATE, this, 'all');
  }

  update() {
    let {
      data,
      numInstances,
      startIndices = null,
      transitions,
      props = {},
      buffers = {},
      context = {}
    } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    let updated = false;
    debug(TRACE_UPDATE_START, this);

    if (this.stats) {
      this.stats.get('Update Attributes').timeStart();
    }

    for (const attributeName in this.attributes) {
      const attribute = this.attributes[attributeName];
      const accessorName = attribute.settings.accessor;
      attribute.startIndices = startIndices;

      if (props[attributeName]) {
        log$2.removed("props.".concat(attributeName), "data.attributes.".concat(attributeName))();
      }

      if (attribute.setExternalBuffer(buffers[attributeName])) ; else if (attribute.setBinaryValue(buffers[accessorName], data.startIndices)) ; else if (!buffers[accessorName] && attribute.setConstantValue(props[accessorName])) ; else if (attribute.needsUpdate()) {
        updated = true;

        this._updateAttribute({
          attribute,
          numInstances,
          data,
          props,
          context
        });
      }

      this.needsRedraw |= attribute.needsRedraw();
    }

    if (updated) {
      debug(TRACE_UPDATE_END, this, numInstances);
    }

    if (this.stats) {
      this.stats.get('Update Attributes').timeEnd();
    }

    this.attributeTransitionManager.update({
      attributes: this.attributes,
      numInstances,
      transitions
    });
  }

  updateTransition() {
    const {
      attributeTransitionManager
    } = this;
    const transitionUpdated = attributeTransitionManager.run();
    this.needsRedraw = this.needsRedraw || transitionUpdated;
    return transitionUpdated;
  }

  getAttributes() {
    return this.attributes;
  }

  getChangedAttributes() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      clearChangedFlags: false
    };
    const {
      attributes,
      attributeTransitionManager
    } = this;
    const changedAttributes = { ...attributeTransitionManager.getAttributes()
    };

    for (const attributeName in attributes) {
      const attribute = attributes[attributeName];

      if (attribute.needsRedraw(opts) && !attributeTransitionManager.hasAttribute(attributeName)) {
        changedAttributes[attributeName] = attribute;
      }
    }

    return changedAttributes;
  }

  getShaderAttributes(attributes) {
    let excludeAttributes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (!attributes) {
      attributes = this.getAttributes();
    }

    const shaderAttributes = {};

    for (const attributeName in attributes) {
      if (!excludeAttributes[attributeName]) {
        Object.assign(shaderAttributes, attributes[attributeName].getShaderAttributes());
      }
    }

    return shaderAttributes;
  }

  getAccessors() {
    return this.updateTriggers;
  }

  _add(attributes, updaters) {
    let extraProps = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    if (updaters) {
      log$2.warn('AttributeManager.add({updaters}) - updater map no longer supported')();
    }

    for (const attributeName in attributes) {
      const attribute = attributes[attributeName];
      this.attributes[attributeName] = this._createAttribute(attributeName, attribute, extraProps);
    }

    this._mapUpdateTriggersToAttributes();
  }

  _createAttribute(name, attribute, extraProps) {
    const props = { ...attribute,
      id: name,
      isIndexed: attribute.isIndexed || attribute.elements || false,
      constant: attribute.constant || false,
      size: attribute.elements && 1 || attribute.size || 1,
      value: attribute.value || null,
      divisor: attribute.instanced || extraProps.instanced ? 1 : attribute.divisor || 0
    };
    return new Attribute(this.gl, props);
  }

  _mapUpdateTriggersToAttributes() {
    const triggers = {};

    for (const attributeName in this.attributes) {
      const attribute = this.attributes[attributeName];
      attribute.getUpdateTriggers().forEach(triggerName => {
        if (!triggers[triggerName]) {
          triggers[triggerName] = [];
        }

        triggers[triggerName].push(attributeName);
      });
    }

    this.updateTriggers = triggers;
  }

  _invalidateTrigger(triggerName, dataRange) {
    const {
      attributes,
      updateTriggers
    } = this;
    const invalidatedAttributes = updateTriggers[triggerName];

    if (invalidatedAttributes) {
      invalidatedAttributes.forEach(name => {
        const attribute = attributes[name];

        if (attribute) {
          attribute.setNeedsUpdate(attribute.id, dataRange);
        }
      });
    }

    return invalidatedAttributes;
  }

  _updateAttribute(opts) {
    const {
      attribute,
      numInstances
    } = opts;
    debug(TRACE_ATTRIBUTE_UPDATE_START, attribute);

    if (attribute.constant) {
      attribute.setConstantValue(attribute.value);
      return;
    }

    if (attribute.allocate(numInstances)) {
      debug(TRACE_ATTRIBUTE_ALLOCATE, attribute, numInstances);
    }

    const updated = attribute.updateBuffer(opts);

    if (updated) {
      this.needsRedraw = true;
      debug(TRACE_ATTRIBUTE_UPDATE_END, attribute, numInstances);
    }
  }

}

class CPUInterpolationTransition extends Transition {
  get value() {
    return this._value;
  }

  _onUpdate() {
    const {
      time,
      settings: {
        fromValue,
        toValue,
        duration,
        easing
      }
    } = this;
    const t = easing(time / duration);
    this._value = lerp$1(fromValue, toValue, t);
  }

}

const EPSILON = 1e-5;

function updateSpringElement(prev, cur, dest, damping, stiffness) {
  const velocity = cur - prev;
  const delta = dest - cur;
  const spring = delta * stiffness;
  const damper = -velocity * damping;
  return spring + damper + velocity + cur;
}

function updateSpring(prev, cur, dest, damping, stiffness) {
  if (Array.isArray(dest)) {
    const next = [];

    for (let i = 0; i < dest.length; i++) {
      next[i] = updateSpringElement(prev[i], cur[i], dest[i], damping, stiffness);
    }

    return next;
  }

  return updateSpringElement(prev, cur, dest, damping, stiffness);
}

function distance(value1, value2) {
  if (Array.isArray(value1)) {
    let distanceSquare = 0;

    for (let i = 0; i < value1.length; i++) {
      const d = value1[i] - value2[i];
      distanceSquare += d * d;
    }

    return Math.sqrt(distanceSquare);
  }

  return Math.abs(value1 - value2);
}

class CPUSpringTransition extends Transition {
  get value() {
    return this._currValue;
  }

  _onUpdate() {
    const {
      fromValue,
      toValue,
      damping,
      stiffness
    } = this.settings;
    const {
      _prevValue = fromValue,
      _currValue = fromValue
    } = this;
    let nextValue = updateSpring(_prevValue, _currValue, toValue, damping, stiffness);
    const delta = distance(nextValue, toValue);
    const velocity = distance(nextValue, _currValue);

    if (delta < EPSILON && velocity < EPSILON) {
      nextValue = toValue;
      this.end();
    }

    this._prevValue = _currValue;
    this._currValue = nextValue;
  }

}

const TRANSITION_TYPES = {
  interpolation: CPUInterpolationTransition,
  spring: CPUSpringTransition
};
class UniformTransitionManager {
  constructor(timeline) {
    this.transitions = new Map();
    this.timeline = timeline;
  }

  get active() {
    return this.transitions.size > 0;
  }

  add(key, fromValue, toValue, settings) {
    const {
      transitions
    } = this;

    if (transitions.has(key)) {
      const transition = transitions.get(key);
      const {
        value = transition.settings.fromValue
      } = transition;
      fromValue = value;
      this.remove(key);
    }

    settings = normalizeTransitionSettings(settings);

    if (!settings) {
      return;
    }

    const TransitionType = TRANSITION_TYPES[settings.type];

    if (!TransitionType) {
      log$2.error("unsupported transition type '".concat(settings.type, "'"))();
      return;
    }

    const transition = new TransitionType(this.timeline);
    transition.start({ ...settings,
      fromValue,
      toValue
    });
    transitions.set(key, transition);
  }

  remove(key) {
    const {
      transitions
    } = this;

    if (transitions.has(key)) {
      transitions.get(key).cancel();
      transitions.delete(key);
    }
  }

  update() {
    const propsInTransition = {};

    for (const [key, transition] of this.transitions) {
      transition.update();
      propsInTransition[key] = transition.value;

      if (!transition.inProgress) {
        this.remove(key);
      }
    }

    return propsInTransition;
  }

  clear() {
    for (const key of this.transitions.keys()) {
      this.remove(key);
    }
  }

}

const {
  COMPONENT: COMPONENT$1
} = PROP_SYMBOLS;
function validateProps(props) {
  const propTypes = getPropTypes(props);

  for (const propName in propTypes) {
    const propType = propTypes[propName];
    const {
      validate
    } = propType;

    if (validate && !validate(props[propName], propType)) {
      throw new Error("Invalid prop ".concat(propName, ": ").concat(props[propName]));
    }
  }
}
function diffProps(props, oldProps) {
  const propsChangedReason = compareProps({
    newProps: props,
    oldProps,
    propTypes: getPropTypes(props),
    ignoreProps: {
      data: null,
      updateTriggers: null,
      extensions: null,
      transitions: null
    }
  });
  const dataChangedReason = diffDataProps(props, oldProps);
  let updateTriggersChangedReason = false;

  if (!dataChangedReason) {
    updateTriggersChangedReason = diffUpdateTriggers(props, oldProps);
  }

  return {
    dataChanged: dataChangedReason,
    propsChanged: propsChangedReason,
    updateTriggersChanged: updateTriggersChangedReason,
    extensionsChanged: diffExtensions(props, oldProps),
    transitionsChanged: diffTransitions(props, oldProps)
  };
}

function diffTransitions(props, oldProps) {
  if (!props.transitions) {
    return null;
  }

  const result = {};
  const propTypes = getPropTypes(props);

  for (const key in props.transitions) {
    const propType = propTypes[key];
    const type = propType && propType.type;
    const isTransitionable = type === 'number' || type === 'color' || type === 'array';

    if (isTransitionable && comparePropValues(props[key], oldProps[key], propType)) {
      result[key] = true;
    }
  }

  return result;
}

function compareProps() {
  let {
    newProps,
    oldProps,
    ignoreProps = {},
    propTypes = {},
    triggerName = 'props'
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  if (oldProps === newProps) {
    return null;
  }

  if (typeof newProps !== 'object' || newProps === null) {
    return "".concat(triggerName, " changed shallowly");
  }

  if (typeof oldProps !== 'object' || oldProps === null) {
    return "".concat(triggerName, " changed shallowly");
  }

  for (const key of Object.keys(newProps)) {
    if (!(key in ignoreProps)) {
      if (!(key in oldProps)) {
        return "".concat(triggerName, ".").concat(key, " added");
      }

      const changed = comparePropValues(newProps[key], oldProps[key], propTypes[key]);

      if (changed) {
        return "".concat(triggerName, ".").concat(key, " ").concat(changed);
      }
    }
  }

  for (const key of Object.keys(oldProps)) {
    if (!(key in ignoreProps)) {
      if (!(key in newProps)) {
        return "".concat(triggerName, ".").concat(key, " dropped");
      }

      if (!Object.hasOwnProperty.call(newProps, key)) {
        const changed = comparePropValues(newProps[key], oldProps[key], propTypes[key]);

        if (changed) {
          return "".concat(triggerName, ".").concat(key, " ").concat(changed);
        }
      }
    }
  }

  return null;
}

function comparePropValues(newProp, oldProp, propType) {
  let equal = propType && propType.equal;

  if (equal && !equal(newProp, oldProp, propType)) {
    return 'changed deeply';
  }

  if (!equal) {
    equal = newProp && oldProp && newProp.equals;

    if (equal && !equal.call(newProp, oldProp)) {
      return 'changed deeply';
    }
  }

  if (!equal && oldProp !== newProp) {
    return 'changed shallowly';
  }

  return null;
}

function diffDataProps(props, oldProps) {
  if (oldProps === null) {
    return 'oldProps is null, initial diff';
  }

  let dataChanged = null;
  const {
    dataComparator,
    _dataDiff
  } = props;

  if (dataComparator) {
    if (!dataComparator(props.data, oldProps.data)) {
      dataChanged = 'Data comparator detected a change';
    }
  } else if (props.data !== oldProps.data) {
    dataChanged = 'A new data container was supplied';
  }

  if (dataChanged && _dataDiff) {
    dataChanged = _dataDiff(props.data, oldProps.data) || dataChanged;
  }

  return dataChanged;
}

function diffUpdateTriggers(props, oldProps) {
  if (oldProps === null) {
    return 'oldProps is null, initial diff';
  }

  if ('all' in props.updateTriggers) {
    const diffReason = diffUpdateTrigger(props, oldProps, 'all');

    if (diffReason) {
      return {
        all: true
      };
    }
  }

  const triggerChanged = {};
  let reason = false;

  for (const triggerName in props.updateTriggers) {
    if (triggerName !== 'all') {
      const diffReason = diffUpdateTrigger(props, oldProps, triggerName);

      if (diffReason) {
        triggerChanged[triggerName] = true;
        reason = triggerChanged;
      }
    }
  }

  return reason;
}

function diffExtensions(props, oldProps) {
  if (oldProps === null) {
    return 'oldProps is null, initial diff';
  }

  const oldExtensions = oldProps.extensions;
  const {
    extensions
  } = props;

  if (extensions === oldExtensions) {
    return false;
  }

  if (!oldExtensions || !extensions) {
    return true;
  }

  if (extensions.length !== oldExtensions.length) {
    return true;
  }

  for (let i = 0; i < extensions.length; i++) {
    if (!extensions[i].equals(oldExtensions[i])) {
      return true;
    }
  }

  return false;
}

function diffUpdateTrigger(props, oldProps, triggerName) {
  let newTriggers = props.updateTriggers[triggerName];
  newTriggers = newTriggers === undefined || newTriggers === null ? {} : newTriggers;
  let oldTriggers = oldProps.updateTriggers[triggerName];
  oldTriggers = oldTriggers === undefined || oldTriggers === null ? {} : oldTriggers;
  const diffReason = compareProps({
    oldProps: oldTriggers,
    newProps: newTriggers,
    triggerName
  });
  return diffReason;
}

function getPropTypes(props) {
  const layer = props[COMPONENT$1];
  const LayerType = layer && layer.constructor;
  return LayerType ? LayerType._propTypes : {};
}

const ERR_NOT_OBJECT = 'count(): argument not an object';
const ERR_NOT_CONTAINER = 'count(): argument not a container';
function count(container) {
  if (!isObject(container)) {
    throw new Error(ERR_NOT_OBJECT);
  }

  if (typeof container.count === 'function') {
    return container.count();
  }

  if (Number.isFinite(container.size)) {
    return container.size;
  }

  if (Number.isFinite(container.length)) {
    return container.length;
  }

  if (isPlainObject(container)) {
    return Object.keys(container).length;
  }

  throw new Error(ERR_NOT_CONTAINER);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && value.constructor === Object;
}

function isObject(value) {
  return value !== null && typeof value === 'object';
}

function mergeShaders(target, source) {
  if (!source) {
    return target;
  }

  const result = { ...target,
    ...source
  };

  if ('defines' in source) {
    result.defines = { ...target.defines,
      ...source.defines
    };
  }

  if ('modules' in source) {
    result.modules = (target.modules || []).concat(source.modules);

    if (source.modules.some(module => module.name === 'project64')) {
      const index = result.modules.findIndex(module => module.name === 'project32');

      if (index >= 0) {
        result.modules.splice(index, 1);
      }
    }
  }

  if ('inject' in source) {
    if (!target.inject) {
      result.inject = source.inject;
    } else {
      const mergedInjection = { ...target.inject
      };

      for (const key in source.inject) {
        mergedInjection[key] = (mergedInjection[key] || '') + source.inject[key];
      }

      result.inject = mergedInjection;
    }
  }

  return result;
}

const DEFAULT_TEXTURE_PARAMETERS = {
  [10241]: 9987,
  [10240]: 9729,
  [10242]: 33071,
  [10243]: 33071
};
const internalTextures = {};
function createTexture(layer, image) {
  const gl = layer.context && layer.context.gl;

  if (!gl || !image) {
    return null;
  }

  if (image instanceof Texture2D) {
    return image;
  } else if (image.constructor && image.constructor.name !== 'Object') {
    image = {
      data: image
    };
  }

  let specialTextureParameters = null;

  if (image.compressed) {
    specialTextureParameters = {
      [10241]: image.data.length > 1 ? 9985 : 9729
    };
  }

  const texture = new Texture2D(gl, { ...image,
    parameters: { ...DEFAULT_TEXTURE_PARAMETERS,
      ...specialTextureParameters,
      ...layer.props.textureParameters
    }
  });
  internalTextures[texture.id] = true;
  return texture;
}
function destroyTexture(texture) {
  if (!texture || !(texture instanceof Texture2D)) {
    return;
  }

  if (internalTextures[texture.id]) {
    texture.delete();
    delete internalTextures[texture.id];
  }
}

const TYPE_DEFINITIONS = {
  boolean: {
    validate(value, propType) {
      return true;
    },

    equal(value1, value2, propType) {
      return Boolean(value1) === Boolean(value2);
    }

  },
  number: {
    validate(value, propType) {
      return Number.isFinite(value) && (!('max' in propType) || value <= propType.max) && (!('min' in propType) || value >= propType.min);
    }

  },
  color: {
    validate(value, propType) {
      return propType.optional && !value || isArray(value) && (value.length === 3 || value.length === 4);
    },

    equal(value1, value2, propType) {
      return arrayEqual(value1, value2);
    }

  },
  accessor: {
    validate(value, propType) {
      const valueType = getTypeOf(value);
      return valueType === 'function' || valueType === getTypeOf(propType.value);
    },

    equal(value1, value2, propType) {
      if (typeof value2 === 'function') {
        return true;
      }

      return arrayEqual(value1, value2);
    }

  },
  array: {
    validate(value, propType) {
      return propType.optional && !value || isArray(value);
    },

    equal(value1, value2, propType) {
      return propType.compare ? arrayEqual(value1, value2) : value1 === value2;
    }

  },
  function: {
    validate(value, propType) {
      return propType.optional && !value || typeof value === 'function';
    },

    equal(value1, value2, propType) {
      return !propType.compare || value1 === value2;
    }

  },
  data: {
    transform: (value, propType, component) => {
      const {
        dataTransform
      } = component ? component.props : {};
      return dataTransform && value ? dataTransform(value) : value;
    }
  },
  image: {
    transform: (value, propType, component) => {
      return createTexture(component, value);
    },
    release: value => {
      destroyTexture(value);
    }
  }
};

function arrayEqual(array1, array2) {
  if (array1 === array2) {
    return true;
  }

  if (!isArray(array1) || !isArray(array2)) {
    return false;
  }

  const len = array1.length;

  if (len !== array2.length) {
    return false;
  }

  for (let i = 0; i < len; i++) {
    if (array1[i] !== array2[i]) {
      return false;
    }
  }

  return true;
}

function parsePropTypes(propDefs) {
  const propTypes = {};
  const defaultProps = {};
  const deprecatedProps = {};

  for (const [propName, propDef] of Object.entries(propDefs)) {
    if (propDef && propDef.deprecatedFor) {
      deprecatedProps[propName] = Array.isArray(propDef.deprecatedFor) ? propDef.deprecatedFor : [propDef.deprecatedFor];
    } else {
      const propType = parsePropType(propName, propDef);
      propTypes[propName] = propType;
      defaultProps[propName] = propType.value;
    }
  }

  return {
    propTypes,
    defaultProps,
    deprecatedProps
  };
}

function parsePropType(name, propDef) {
  switch (getTypeOf(propDef)) {
    case 'object':
      return normalizePropDefinition(name, propDef);

    case 'array':
      return normalizePropDefinition(name, {
        type: 'array',
        value: propDef,
        compare: false
      });

    case 'boolean':
      return normalizePropDefinition(name, {
        type: 'boolean',
        value: propDef
      });

    case 'number':
      return normalizePropDefinition(name, {
        type: 'number',
        value: propDef
      });

    case 'function':
      return normalizePropDefinition(name, {
        type: 'function',
        value: propDef,
        compare: true
      });

    default:
      return {
        name,
        type: 'unknown',
        value: propDef
      };
  }
}

function normalizePropDefinition(name, propDef) {
  if (!('type' in propDef)) {
    if (!('value' in propDef)) {
      return {
        name,
        type: 'object',
        value: propDef
      };
    }

    return {
      name,
      type: getTypeOf(propDef.value),
      ...propDef
    };
  }

  return {
    name,
    ...TYPE_DEFINITIONS[propDef.type],
    ...propDef
  };
}

function isArray(value) {
  return Array.isArray(value) || ArrayBuffer.isView(value);
}

function getTypeOf(value) {
  if (isArray(value)) {
    return 'array';
  }

  if (value === null) {
    return 'null';
  }

  return typeof value;
}

const {
  COMPONENT,
  ASYNC_ORIGINAL: ASYNC_ORIGINAL$2,
  ASYNC_RESOLVED: ASYNC_RESOLVED$2,
  ASYNC_DEFAULTS: ASYNC_DEFAULTS$2
} = PROP_SYMBOLS;
function createProps() {
  const component = this;
  const propsPrototype = getPropsPrototype(component.constructor);
  const propsInstance = Object.create(propsPrototype);
  propsInstance[COMPONENT] = component;
  propsInstance[ASYNC_ORIGINAL$2] = {};
  propsInstance[ASYNC_RESOLVED$2] = {};

  for (let i = 0; i < arguments.length; ++i) {
    const props = arguments[i];

    for (const key in props) {
      propsInstance[key] = props[key];
    }
  }

  Object.freeze(propsInstance);
  return propsInstance;
}

function getPropsPrototype(componentClass) {
  const defaultProps = getOwnProperty(componentClass, '_mergedDefaultProps');

  if (!defaultProps) {
    createPropsPrototypeAndTypes(componentClass);
    return componentClass._mergedDefaultProps;
  }

  return defaultProps;
}

function createPropsPrototypeAndTypes(componentClass) {
  const parent = componentClass.prototype;

  if (!parent) {
    return;
  }

  const parentClass = Object.getPrototypeOf(componentClass);
  const parentDefaultProps = getPropsPrototype(parentClass);
  const componentDefaultProps = getOwnProperty(componentClass, 'defaultProps') || {};
  const componentPropDefs = parsePropTypes(componentDefaultProps);
  const defaultProps = createPropsPrototype(componentPropDefs.defaultProps, parentDefaultProps, componentClass);
  const propTypes = { ...parentClass._propTypes,
    ...componentPropDefs.propTypes
  };
  addAsyncPropsToPropPrototype(defaultProps, propTypes);
  const deprecatedProps = { ...parentClass._deprecatedProps,
    ...componentPropDefs.deprecatedProps
  };
  addDeprecatedPropsToPropPrototype(defaultProps, deprecatedProps);
  componentClass._mergedDefaultProps = defaultProps;
  componentClass._propTypes = propTypes;
  componentClass._deprecatedProps = deprecatedProps;
}

function createPropsPrototype(props, parentProps, componentClass) {
  const defaultProps = Object.create(null);
  Object.assign(defaultProps, parentProps, props);
  const id = getComponentName(componentClass);
  delete props.id;
  Object.defineProperties(defaultProps, {
    id: {
      writable: true,
      value: id
    }
  });
  return defaultProps;
}

function addDeprecatedPropsToPropPrototype(defaultProps, deprecatedProps) {
  for (const propName in deprecatedProps) {
    Object.defineProperty(defaultProps, propName, {
      enumerable: false,

      set(newValue) {
        const nameStr = "".concat(this.id, ": ").concat(propName);

        for (const newPropName of deprecatedProps[propName]) {
          if (!hasOwnProperty(this, newPropName)) {
            this[newPropName] = newValue;
          }
        }

        log$2.deprecated(nameStr, deprecatedProps[propName].join('/'))();
      }

    });
  }
}

function addAsyncPropsToPropPrototype(defaultProps, propTypes) {
  const defaultValues = {};
  const descriptors = {};

  for (const propName in propTypes) {
    const propType = propTypes[propName];
    const {
      name,
      value
    } = propType;

    if (propType.async) {
      defaultValues[name] = value;
      descriptors[name] = getDescriptorForAsyncProp(name);
    }
  }

  defaultProps[ASYNC_DEFAULTS$2] = defaultValues;
  defaultProps[ASYNC_ORIGINAL$2] = {};
  Object.defineProperties(defaultProps, descriptors);
}

function getDescriptorForAsyncProp(name) {
  return {
    enumerable: true,

    set(newValue) {
      if (typeof newValue === 'string' || newValue instanceof Promise || isAsyncIterable(newValue)) {
        this[ASYNC_ORIGINAL$2][name] = newValue;
      } else {
        this[ASYNC_RESOLVED$2][name] = newValue;
      }
    },

    get() {
      if (this[ASYNC_RESOLVED$2]) {
        if (name in this[ASYNC_RESOLVED$2]) {
          const value = this[ASYNC_RESOLVED$2][name];
          return value || this[ASYNC_DEFAULTS$2][name];
        }

        if (name in this[ASYNC_ORIGINAL$2]) {
          const state = this[COMPONENT] && this[COMPONENT].internalState;

          if (state && state.hasAsyncProp(name)) {
            return state.getAsyncProp(name) || this[ASYNC_DEFAULTS$2][name];
          }
        }
      }

      return this[ASYNC_DEFAULTS$2][name];
    }

  };
}

function hasOwnProperty(object, prop) {
  return Object.prototype.hasOwnProperty.call(object, prop);
}

function getOwnProperty(object, prop) {
  return hasOwnProperty(object, prop) && object[prop];
}

function getComponentName(componentClass) {
  const componentName = getOwnProperty(componentClass, 'layerName') || getOwnProperty(componentClass, 'componentName');

  if (!componentName) {
    log$2.once(0, "".concat(componentClass.name, ".componentName not specified"))();
  }

  return componentName || componentClass.name;
}

const {
  ASYNC_ORIGINAL: ASYNC_ORIGINAL$1,
  ASYNC_RESOLVED: ASYNC_RESOLVED$1,
  ASYNC_DEFAULTS: ASYNC_DEFAULTS$1
} = PROP_SYMBOLS;
const EMPTY_PROPS = Object.freeze({});
class ComponentState {
  constructor() {
    let component = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    this.component = component;
    this.asyncProps = {};

    this.onAsyncPropUpdated = () => {};

    this.oldProps = EMPTY_PROPS;
    this.oldAsyncProps = null;
  }

  finalize() {
    for (const propName in this.asyncProps) {
      const asyncProp = this.asyncProps[propName];

      if (asyncProp.type && asyncProp.type.release) {
        asyncProp.type.release(asyncProp.resolvedValue, asyncProp.type, this.component);
      }
    }
  }

  getOldProps() {
    return this.oldAsyncProps || this.oldProps;
  }

  resetOldProps() {
    this.oldAsyncProps = null;
    this.oldProps = this.component.props;
  }

  freezeAsyncOldProps() {
    if (!this.oldAsyncProps) {
      this.oldProps = this.oldProps || this.component.props;
      this.oldAsyncProps = Object.create(this.oldProps);

      for (const propName in this.asyncProps) {
        Object.defineProperty(this.oldAsyncProps, propName, {
          enumerable: true,
          value: this.oldProps[propName]
        });
      }
    }
  }

  hasAsyncProp(propName) {
    return propName in this.asyncProps;
  }

  getAsyncProp(propName) {
    const asyncProp = this.asyncProps[propName];
    return asyncProp && asyncProp.resolvedValue;
  }

  isAsyncPropLoading(propName) {
    if (propName) {
      const asyncProp = this.asyncProps[propName];
      return Boolean(asyncProp && asyncProp.pendingLoadCount > 0 && asyncProp.pendingLoadCount !== asyncProp.resolvedLoadCount);
    }

    for (const key in this.asyncProps) {
      if (this.isAsyncPropLoading(key)) {
        return true;
      }
    }

    return false;
  }

  reloadAsyncProp(propName, value) {
    this._watchPromise(propName, Promise.resolve(value));
  }

  setAsyncProps(props) {
    const resolvedValues = props[ASYNC_RESOLVED$1] || {};
    const originalValues = props[ASYNC_ORIGINAL$1] || props;
    const defaultValues = props[ASYNC_DEFAULTS$1] || {};

    for (const propName in resolvedValues) {
      const value = resolvedValues[propName];

      this._createAsyncPropData(propName, defaultValues[propName]);

      this._updateAsyncProp(propName, value);

      resolvedValues[propName] = this.getAsyncProp(propName);
    }

    for (const propName in originalValues) {
      const value = originalValues[propName];

      this._createAsyncPropData(propName, defaultValues[propName]);

      this._updateAsyncProp(propName, value);
    }
  }

  _updateAsyncProp(propName, value) {
    if (!this._didAsyncInputValueChange(propName, value)) {
      return;
    }

    if (typeof value === 'string') {
      var _this$layer;

      const fetch = (_this$layer = this.layer) === null || _this$layer === void 0 ? void 0 : _this$layer.props.fetch;
      const url = value;

      if (fetch) {
        value = fetch(url, {
          propName,
          layer: this.layer
        });
      }
    }

    if (value instanceof Promise) {
      this._watchPromise(propName, value);

      return;
    }

    if (isAsyncIterable(value)) {
      this._resolveAsyncIterable(propName, value);

      return;
    }

    this._setPropValue(propName, value);
  }

  _didAsyncInputValueChange(propName, value) {
    const asyncProp = this.asyncProps[propName];

    if (value === asyncProp.resolvedValue || value === asyncProp.lastValue) {
      return false;
    }

    asyncProp.lastValue = value;
    return true;
  }

  _setPropValue(propName, value) {
    this.freezeAsyncOldProps();
    const asyncProp = this.asyncProps[propName];
    value = this._postProcessValue(asyncProp, value);
    asyncProp.resolvedValue = value;
    asyncProp.pendingLoadCount++;
    asyncProp.resolvedLoadCount = asyncProp.pendingLoadCount;
  }

  _setAsyncPropValue(propName, value, loadCount) {
    const asyncProp = this.asyncProps[propName];

    if (asyncProp && loadCount >= asyncProp.resolvedLoadCount && value !== undefined) {
      this.freezeAsyncOldProps();
      asyncProp.resolvedValue = value;
      asyncProp.resolvedLoadCount = loadCount;
      this.onAsyncPropUpdated(propName, value);
    }
  }

  _watchPromise(propName, promise) {
    const asyncProp = this.asyncProps[propName];
    asyncProp.pendingLoadCount++;
    const loadCount = asyncProp.pendingLoadCount;
    promise.then(data => {
      var _this$layer2;

      data = this._postProcessValue(asyncProp, data);

      this._setAsyncPropValue(propName, data, loadCount);

      const onDataLoad = (_this$layer2 = this.layer) === null || _this$layer2 === void 0 ? void 0 : _this$layer2.props.onDataLoad;

      if (propName === 'data' && onDataLoad) {
        onDataLoad(data, {
          propName,
          layer: this.layer
        });
      }
    }).catch(error => {
      var _this$layer3;

      (_this$layer3 = this.layer) === null || _this$layer3 === void 0 ? void 0 : _this$layer3.raiseError(error, "loading ".concat(propName, " of ").concat(this.layer));
    });
  }

  async _resolveAsyncIterable(propName, iterable) {
    var _this$layer4;

    if (propName !== 'data') {
      this._setPropValue(propName, iterable);
    }

    const asyncProp = this.asyncProps[propName];
    asyncProp.pendingLoadCount++;
    const loadCount = asyncProp.pendingLoadCount;
    let data = [];
    let count = 0;

    for await (const chunk of iterable) {
      const {
        dataTransform
      } = this.component ? this.component.props : {};

      if (dataTransform) {
        data = dataTransform(chunk, data);
      } else {
        data = data.concat(chunk);
      }

      Object.defineProperty(data, '__diff', {
        enumerable: false,
        value: [{
          startRow: count,
          endRow: data.length
        }]
      });
      count = data.length;

      this._setAsyncPropValue(propName, data, loadCount);
    }

    const onDataLoad = (_this$layer4 = this.layer) === null || _this$layer4 === void 0 ? void 0 : _this$layer4.props.onDataLoad;

    if (onDataLoad) {
      onDataLoad(data, {
        propName,
        layer: this.layer
      });
    }
  }

  _postProcessValue(asyncProp, value) {
    const propType = asyncProp.type;

    if (propType) {
      if (propType.release) {
        propType.release(asyncProp.resolvedValue, propType, this.component);
      }

      if (propType.transform) {
        return propType.transform(value, propType, this.component);
      }
    }

    return value;
  }

  _createAsyncPropData(propName, defaultValue) {
    const asyncProp = this.asyncProps[propName];

    if (!asyncProp) {
      const propTypes = this.component && this.component.constructor._propTypes;
      this.asyncProps[propName] = {
        type: propTypes && propTypes[propName],
        lastValue: null,
        resolvedValue: defaultValue,
        pendingLoadCount: 0,
        resolvedLoadCount: 0
      };
    }
  }

}

const {
  ASYNC_ORIGINAL,
  ASYNC_RESOLVED,
  ASYNC_DEFAULTS
} = PROP_SYMBOLS;
const defaultProps$1 = {};
let counter = 0;
class Component {
  constructor() {
    this.props = createProps.apply(this, arguments);
    this.id = this.props.id;
    this.count = counter++;
    this.lifecycle = LIFECYCLE.NO_STATE;
    this.parent = null;
    this.context = null;
    this.state = null;
    this.internalState = null;
    Object.seal(this);
  }

  get root() {
    let component = this;

    while (component.parent) {
      component = component.parent;
    }

    return component;
  }

  clone(newProps) {
    const {
      props
    } = this;
    const asyncProps = {};

    for (const key in props[ASYNC_DEFAULTS]) {
      if (key in props[ASYNC_RESOLVED]) {
        asyncProps[key] = props[ASYNC_RESOLVED][key];
      } else if (key in props[ASYNC_ORIGINAL]) {
        asyncProps[key] = props[ASYNC_ORIGINAL][key];
      }
    }

    return new this.constructor({ ...props,
      ...asyncProps,
      ...newProps
    });
  }

  get stats() {
    return this.internalState.stats;
  }

  _initState() {
    this.internalState = new ComponentState({});
  }

}
Component.componentName = 'Component';
Component.defaultProps = defaultProps$1;

class LayerState extends ComponentState {
  constructor(_ref) {
    let {
      attributeManager,
      layer
    } = _ref;
    super(layer);
    this.attributeManager = attributeManager;
    this.model = null;
    this.needsRedraw = true;
    this.subLayers = null;
    this.usesPickingColorCache = false;
  }

  get layer() {
    return this.component;
  }

  set layer(layer) {
    this.component = layer;
  }

}

const TRACE_CHANGE_FLAG = 'layer.changeFlag';
const TRACE_INITIALIZE = 'layer.initialize';
const TRACE_UPDATE = 'layer.update';
const TRACE_FINALIZE = 'layer.finalize';
const TRACE_MATCHED = 'layer.matched';
const MAX_PICKING_COLOR_CACHE_SIZE = 2 ** 24 - 1;
const EMPTY_ARRAY = Object.freeze([]);
const areViewportsEqual = memoize(_ref => {
  let {
    oldViewport,
    viewport
  } = _ref;
  return oldViewport.equals(viewport);
});
let pickingColorCache = new Uint8ClampedArray(0);
const defaultProps = {
  data: {
    type: 'data',
    value: EMPTY_ARRAY,
    async: true
  },
  dataComparator: null,
  _dataDiff: {
    type: 'function',
    value: data => data && data.__diff,
    compare: false,
    optional: true
  },
  dataTransform: {
    type: 'function',
    value: null,
    compare: false,
    optional: true
  },
  onDataLoad: {
    type: 'function',
    value: null,
    compare: false,
    optional: true
  },
  onError: {
    type: 'function',
    value: null,
    compare: false,
    optional: true
  },
  fetch: {
    type: 'function',
    value: (url, _ref2) => {
      let {
        propName,
        layer,
        loaders,
        loadOptions,
        signal
      } = _ref2;
      const {
        resourceManager
      } = layer.context;
      loadOptions = loadOptions || layer.getLoadOptions();
      loaders = loaders || layer.props.loaders;

      if (signal) {
        var _loadOptions;

        loadOptions = { ...loadOptions,
          fetch: { ...((_loadOptions = loadOptions) === null || _loadOptions === void 0 ? void 0 : _loadOptions.fetch),
            signal
          }
        };
      }

      let inResourceManager = resourceManager.contains(url);

      if (!inResourceManager && !loadOptions) {
        resourceManager.add({
          resourceId: url,
          data: load(url, loaders),
          persistent: false
        });
        inResourceManager = true;
      }

      if (inResourceManager) {
        return resourceManager.subscribe({
          resourceId: url,
          onChange: data => layer.internalState.reloadAsyncProp(propName, data),
          consumerId: layer.id,
          requestId: propName
        });
      }

      return load(url, loaders, loadOptions);
    },
    compare: false
  },
  updateTriggers: {},
  visible: true,
  pickable: false,
  opacity: {
    type: 'number',
    min: 0,
    max: 1,
    value: 1
  },
  onHover: {
    type: 'function',
    value: null,
    compare: false,
    optional: true
  },
  onClick: {
    type: 'function',
    value: null,
    compare: false,
    optional: true
  },
  onDragStart: {
    type: 'function',
    value: null,
    compare: false,
    optional: true
  },
  onDrag: {
    type: 'function',
    value: null,
    compare: false,
    optional: true
  },
  onDragEnd: {
    type: 'function',
    value: null,
    compare: false,
    optional: true
  },
  coordinateSystem: COORDINATE_SYSTEM.DEFAULT,
  coordinateOrigin: {
    type: 'array',
    value: [0, 0, 0],
    compare: true
  },
  modelMatrix: {
    type: 'array',
    value: null,
    compare: true,
    optional: true
  },
  wrapLongitude: false,
  positionFormat: 'XYZ',
  colorFormat: 'RGBA',
  parameters: {},
  transitions: null,
  extensions: [],
  loaders: {
    type: 'array',
    value: [],
    optional: true,
    compare: true
  },
  getPolygonOffset: {
    type: 'function',
    value: _ref3 => {
      let {
        layerIndex
      } = _ref3;
      return [0, -layerIndex * 100];
    },
    compare: false
  },
  highlightedObjectIndex: -1,
  autoHighlight: false,
  highlightColor: {
    type: 'accessor',
    value: [0, 0, 128, 128]
  }
};
class Layer extends Component {
  toString() {
    const className = this.constructor.layerName || this.constructor.name;
    return "".concat(className, "({id: '").concat(this.props.id, "'})");
  }

  raiseError(error, message) {
    var _this$props$onError, _this$props;

    if (message) {
      error.message = "".concat(message, ": ").concat(error.message);
    }

    if (!((_this$props$onError = (_this$props = this.props).onError) !== null && _this$props$onError !== void 0 && _this$props$onError.call(_this$props, error))) {
      var _this$context, _this$context$onError;

      (_this$context = this.context) === null || _this$context === void 0 ? void 0 : (_this$context$onError = _this$context.onError) === null || _this$context$onError === void 0 ? void 0 : _this$context$onError.call(_this$context, error, this);
    }
  }

  setState(updateObject) {
    this.setChangeFlags({
      stateChanged: true
    });
    Object.assign(this.state, updateObject);
    this.setNeedsRedraw();
  }

  setNeedsRedraw() {
    let redraw = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

    if (this.internalState) {
      this.internalState.needsRedraw = redraw;
    }
  }

  setNeedsUpdate() {
    this.context.layerManager.setNeedsUpdate(String(this));
    this.internalState.needsUpdate = true;
  }

  getNeedsRedraw() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      clearRedrawFlags: false
    };
    return this._getNeedsRedraw(opts);
  }

  needsUpdate() {
    return this.internalState.needsUpdate || this.hasUniformTransition() || this.shouldUpdateState(this._getUpdateParams());
  }

  hasUniformTransition() {
    return this.internalState.uniformTransitions.active;
  }

  get isLoaded() {
    return this.internalState && !this.internalState.isAsyncPropLoading();
  }

  get wrapLongitude() {
    return this.props.wrapLongitude;
  }

  isPickable() {
    return this.props.pickable && this.props.visible;
  }

  getModels() {
    return this.state && (this.state.models || (this.state.model ? [this.state.model] : []));
  }

  getAttributeManager() {
    return this.internalState && this.internalState.attributeManager;
  }

  getCurrentLayer() {
    return this.internalState && this.internalState.layer;
  }

  getLoadOptions() {
    return this.props.loadOptions;
  }

  project(xyz) {
    const {
      viewport
    } = this.context;
    const worldPosition = getWorldPosition(xyz, {
      viewport,
      modelMatrix: this.props.modelMatrix,
      coordinateOrigin: this.props.coordinateOrigin,
      coordinateSystem: this.props.coordinateSystem
    });
    const [x, y, z] = worldToPixels(worldPosition, viewport.pixelProjectionMatrix);
    return xyz.length === 2 ? [x, y] : [x, y, z];
  }

  unproject(xy) {
    const {
      viewport
    } = this.context;
    return viewport.unproject(xy);
  }

  projectPosition(xyz) {
    return projectPosition(xyz, {
      viewport: this.context.viewport,
      modelMatrix: this.props.modelMatrix,
      coordinateOrigin: this.props.coordinateOrigin,
      coordinateSystem: this.props.coordinateSystem
    });
  }

  use64bitPositions() {
    const {
      coordinateSystem
    } = this.props;
    return coordinateSystem === COORDINATE_SYSTEM.DEFAULT || coordinateSystem === COORDINATE_SYSTEM.LNGLAT || coordinateSystem === COORDINATE_SYSTEM.CARTESIAN;
  }

  onHover(info, pickingEvent) {
    if (this.props.onHover) {
      return this.props.onHover(info, pickingEvent);
    }

    return false;
  }

  onClick(info, pickingEvent) {
    if (this.props.onClick) {
      return this.props.onClick(info, pickingEvent);
    }

    return false;
  }

  nullPickingColor() {
    return [0, 0, 0];
  }

  encodePickingColor(i) {
    let target = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    target[0] = i + 1 & 255;
    target[1] = i + 1 >> 8 & 255;
    target[2] = i + 1 >> 8 >> 8 & 255;
    return target;
  }

  decodePickingColor(color) {
    assert$5(color instanceof Uint8Array);
    const [i1, i2, i3] = color;
    const index = i1 + i2 * 256 + i3 * 65536 - 1;
    return index;
  }

  initializeState() {
    throw new Error("Layer ".concat(this, " has not defined initializeState"));
  }

  getShaders(shaders) {
    for (const extension of this.props.extensions) {
      shaders = mergeShaders(shaders, extension.getShaders.call(this, extension));
    }

    return shaders;
  }

  shouldUpdateState(_ref4) {
    let {
      oldProps,
      props,
      context,
      changeFlags
    } = _ref4;
    return changeFlags.propsOrDataChanged;
  }

  updateState(_ref5) {
    let {
      oldProps,
      props,
      context,
      changeFlags
    } = _ref5;
    const attributeManager = this.getAttributeManager();

    if (changeFlags.dataChanged && attributeManager) {
      const {
        dataChanged
      } = changeFlags;

      if (Array.isArray(dataChanged)) {
        for (const dataRange of dataChanged) {
          attributeManager.invalidateAll(dataRange);
        }
      } else {
        attributeManager.invalidateAll();
      }
    }

    const neededPickingBuffer = oldProps.highlightedObjectIndex >= 0 || oldProps.pickable;
    const needPickingBuffer = props.highlightedObjectIndex >= 0 || props.pickable;

    if (neededPickingBuffer !== needPickingBuffer && attributeManager) {
      const {
        pickingColors,
        instancePickingColors
      } = attributeManager.attributes;
      const pickingColorsAttribute = pickingColors || instancePickingColors;

      if (pickingColorsAttribute) {
        if (needPickingBuffer && pickingColorsAttribute.constant) {
          pickingColorsAttribute.constant = false;
          attributeManager.invalidate(pickingColorsAttribute.id);
        }

        if (!pickingColorsAttribute.value && !needPickingBuffer) {
          pickingColorsAttribute.constant = true;
          pickingColorsAttribute.value = [0, 0, 0];
        }
      }
    }
  }

  finalizeState() {
    for (const model of this.getModels()) {
      model.delete();
    }

    const attributeManager = this.getAttributeManager();

    if (attributeManager) {
      attributeManager.finalize();
    }

    this.context.resourceManager.unsubscribe({
      consumerId: this.id
    });
    this.internalState.uniformTransitions.clear();
    this.internalState.finalize();
  }

  draw(opts) {
    for (const model of this.getModels()) {
      model.draw(opts);
    }
  }

  getPickingInfo(_ref6) {
    let {
      info,
      mode
    } = _ref6;
    const {
      index
    } = info;

    if (index >= 0) {
      if (Array.isArray(this.props.data)) {
        info.object = this.props.data[index];
      }
    }

    return info;
  }

  activateViewport(viewport) {
    const oldViewport = this.internalState.viewport;
    this.internalState.viewport = viewport;

    if (!oldViewport || !areViewportsEqual({
      oldViewport,
      viewport
    })) {
      this.setChangeFlags({
        viewportChanged: true
      });

      if (this.isComposite) {
        if (this.needsUpdate()) {
          this.setNeedsUpdate();
        }
      } else {
        this._update();
      }
    }
  }

  invalidateAttribute() {
    let name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'all';
    const attributeManager = this.getAttributeManager();

    if (!attributeManager) {
      return;
    }

    if (name === 'all') {
      attributeManager.invalidateAll();
    } else {
      attributeManager.invalidate(name);
    }
  }

  updateAttributes(changedAttributes) {
    for (const model of this.getModels()) {
      this._setModelAttributes(model, changedAttributes);
    }
  }

  _updateAttributes(props) {
    const attributeManager = this.getAttributeManager();

    if (!attributeManager) {
      return;
    }

    const numInstances = this.getNumInstances(props);
    const startIndices = this.getStartIndices(props);
    attributeManager.update({
      data: props.data,
      numInstances,
      startIndices,
      props,
      transitions: props.transitions,
      buffers: props.data.attributes,
      context: this,
      ignoreUnknownAttributes: true
    });
    const changedAttributes = attributeManager.getChangedAttributes({
      clearChangedFlags: true
    });
    this.updateAttributes(changedAttributes);
  }

  _updateAttributeTransition() {
    const attributeManager = this.getAttributeManager();

    if (attributeManager) {
      attributeManager.updateTransition();
    }
  }

  _updateUniformTransition() {
    const {
      uniformTransitions
    } = this.internalState;

    if (uniformTransitions.active) {
      const propsInTransition = uniformTransitions.update();
      const props = Object.create(this.props);

      for (const key in propsInTransition) {
        Object.defineProperty(props, key, {
          value: propsInTransition[key]
        });
      }

      return props;
    }

    return this.props;
  }

  calculateInstancePickingColors(attribute, _ref7) {
    let {
      numInstances
    } = _ref7;

    if (attribute.constant) {
      return;
    }

    const cacheSize = Math.floor(pickingColorCache.length / 3);
    this.internalState.usesPickingColorCache = true;

    if (cacheSize < numInstances) {
      if (numInstances > MAX_PICKING_COLOR_CACHE_SIZE) {
        log$2.warn('Layer has too many data objects. Picking might not be able to distinguish all objects.')();
      }

      pickingColorCache = defaultTypedArrayManager.allocate(pickingColorCache, numInstances, {
        size: 3,
        copy: true,
        maxCount: Math.max(numInstances, MAX_PICKING_COLOR_CACHE_SIZE)
      });
      const newCacheSize = Math.floor(pickingColorCache.length / 3);
      const pickingColor = [];

      for (let i = cacheSize; i < newCacheSize; i++) {
        this.encodePickingColor(i, pickingColor);
        pickingColorCache[i * 3 + 0] = pickingColor[0];
        pickingColorCache[i * 3 + 1] = pickingColor[1];
        pickingColorCache[i * 3 + 2] = pickingColor[2];
      }
    }

    attribute.value = pickingColorCache.subarray(0, numInstances * 3);
  }

  _setModelAttributes(model, changedAttributes) {
    const attributeManager = this.getAttributeManager();
    const excludeAttributes = model.userData.excludeAttributes || {};
    const shaderAttributes = attributeManager.getShaderAttributes(changedAttributes, excludeAttributes);
    model.setAttributes(shaderAttributes);
  }

  disablePickingIndex(objectIndex) {
    this._disablePickingIndex(objectIndex);
  }

  _disablePickingIndex(objectIndex) {
    const {
      pickingColors,
      instancePickingColors
    } = this.getAttributeManager().attributes;
    const colors = pickingColors || instancePickingColors;
    const start = colors.getVertexOffset(objectIndex);
    const end = colors.getVertexOffset(objectIndex + 1);
    colors.buffer.subData({
      data: new Uint8Array(end - start),
      offset: start
    });
  }

  restorePickingColors() {
    const {
      pickingColors,
      instancePickingColors
    } = this.getAttributeManager().attributes;
    const colors = pickingColors || instancePickingColors;

    if (this.internalState.usesPickingColorCache && colors.value.buffer !== pickingColorCache.buffer) {
      colors.value = pickingColorCache.subarray(0, colors.value.length);
    }

    colors.updateSubBuffer({
      startOffset: 0
    });
  }

  getNumInstances(props) {
    props = props || this.props;

    if (props.numInstances !== undefined) {
      return props.numInstances;
    }

    if (this.state && this.state.numInstances !== undefined) {
      return this.state.numInstances;
    }

    return count(props.data);
  }

  getStartIndices(props) {
    props = props || this.props;

    if (props.startIndices !== undefined) {
      return props.startIndices;
    }

    if (this.state && this.state.startIndices) {
      return this.state.startIndices;
    }

    return null;
  }

  _initialize() {
    debug(TRACE_INITIALIZE, this);

    this._initState();

    this.initializeState(this.context);

    for (const extension of this.props.extensions) {
      extension.initializeState.call(this, this.context, extension);
    }

    this.setChangeFlags({
      dataChanged: true,
      propsChanged: true,
      viewportChanged: true,
      extensionsChanged: true
    });

    this._updateState();
  }

  _update() {
    const stateNeedsUpdate = this.needsUpdate();
    debug(TRACE_UPDATE, this, stateNeedsUpdate);

    if (stateNeedsUpdate) {
      this._updateState();
    }
  }

  _updateState() {
    const currentProps = this.props;
    const currentViewport = this.context.viewport;

    const propsInTransition = this._updateUniformTransition();

    this.internalState.propsInTransition = propsInTransition;
    this.context.viewport = this.internalState.viewport || currentViewport;
    this.props = propsInTransition;

    try {
      const updateParams = this._getUpdateParams();

      const oldModels = this.getModels();

      if (this.context.gl) {
        this.updateState(updateParams);
      } else {
        try {
          this.updateState(updateParams);
        } catch (error) {}
      }

      for (const extension of this.props.extensions) {
        extension.updateState.call(this, updateParams, extension);
      }

      const modelChanged = this.getModels()[0] !== oldModels[0];

      this._updateModules(updateParams, modelChanged);

      if (this.isComposite) {
        this._renderLayers(updateParams);
      } else {
        this.setNeedsRedraw();

        this._updateAttributes(this.props);

        if (this.state.model) {
          this.state.model.setInstanceCount(this.getNumInstances());
        }
      }
    } finally {
      this.context.viewport = currentViewport;
      this.props = currentProps;
      this.clearChangeFlags();
      this.internalState.needsUpdate = false;
      this.internalState.resetOldProps();
    }
  }

  _finalize() {
    debug(TRACE_FINALIZE, this);
    this.finalizeState(this.context);

    for (const extension of this.props.extensions) {
      extension.finalizeState.call(this, extension);
    }
  }

  drawLayer(_ref8) {
    let {
      moduleParameters = null,
      uniforms = {},
      parameters = {}
    } = _ref8;

    this._updateAttributeTransition();

    const currentProps = this.props;
    this.props = this.internalState.propsInTransition || currentProps;
    const {
      opacity
    } = this.props;
    uniforms.opacity = Math.pow(opacity, 1 / 2.2);

    try {
      if (moduleParameters) {
        this.setModuleParameters(moduleParameters);
      }

      const {
        getPolygonOffset
      } = this.props;
      const offsets = getPolygonOffset && getPolygonOffset(uniforms) || [0, 0];
      setParameters(this.context.gl, {
        polygonOffset: offsets
      });
      withParameters(this.context.gl, parameters, () => {
        const opts = {
          moduleParameters,
          uniforms,
          parameters,
          context: this.context
        };

        for (const extension of this.props.extensions) {
          extension.draw.call(this, opts, extension);
        }

        this.draw(opts);
      });
    } finally {
      this.props = currentProps;
    }
  }

  getChangeFlags() {
    return this.internalState.changeFlags;
  }

  setChangeFlags(flags) {
    const {
      changeFlags
    } = this.internalState;

    for (const key in flags) {
      if (flags[key]) {
        let flagChanged = false;

        switch (key) {
          case 'dataChanged':
            if (Array.isArray(changeFlags[key])) {
              changeFlags[key] = Array.isArray(flags[key]) ? changeFlags[key].concat(flags[key]) : flags[key];
              flagChanged = true;
            }

          default:
            if (!changeFlags[key]) {
              changeFlags[key] = flags[key];
              flagChanged = true;
            }

        }

        if (flagChanged) {
          debug(TRACE_CHANGE_FLAG, this, key, flags);
        }
      }
    }

    const propsOrDataChanged = changeFlags.dataChanged || changeFlags.updateTriggersChanged || changeFlags.propsChanged || changeFlags.extensionsChanged;
    changeFlags.propsOrDataChanged = propsOrDataChanged;
    changeFlags.somethingChanged = propsOrDataChanged || flags.viewportChanged || flags.stateChanged;
  }

  clearChangeFlags() {
    this.internalState.changeFlags = {
      dataChanged: false,
      propsChanged: false,
      updateTriggersChanged: false,
      viewportChanged: false,
      stateChanged: false,
      extensionsChanged: false,
      propsOrDataChanged: false,
      somethingChanged: false
    };
  }

  diffProps(newProps, oldProps) {
    const changeFlags = diffProps(newProps, oldProps);

    if (changeFlags.updateTriggersChanged) {
      for (const key in changeFlags.updateTriggersChanged) {
        if (changeFlags.updateTriggersChanged[key]) {
          this.invalidateAttribute(key);
        }
      }
    }

    if (changeFlags.transitionsChanged) {
      for (const key in changeFlags.transitionsChanged) {
        this.internalState.uniformTransitions.add(key, oldProps[key], newProps[key], newProps.transitions[key]);
      }
    }

    return this.setChangeFlags(changeFlags);
  }

  validateProps() {
    validateProps(this.props);
  }

  setModuleParameters(moduleParameters) {
    for (const model of this.getModels()) {
      model.updateModuleSettings(moduleParameters);
    }
  }

  updateAutoHighlight(info) {
    if (this.props.autoHighlight) {
      this._updateAutoHighlight(info);
    }
  }

  _updateAutoHighlight(info) {
    const pickingModuleParameters = {
      pickingSelectedColor: info.picked ? info.color : null
    };
    const {
      highlightColor
    } = this.props;

    if (info.picked && typeof highlightColor === 'function') {
      pickingModuleParameters.pickingHighlightColor = highlightColor(info);
    }

    this.setModuleParameters(pickingModuleParameters);
    this.setNeedsRedraw();
  }

  _updateModules(_ref9, forceUpdate) {
    let {
      props,
      oldProps
    } = _ref9;
    const {
      autoHighlight,
      highlightedObjectIndex,
      highlightColor
    } = props;

    if (forceUpdate || oldProps.autoHighlight !== autoHighlight || oldProps.highlightedObjectIndex !== highlightedObjectIndex || oldProps.highlightColor !== highlightColor) {
      const parameters = {};

      if (!autoHighlight) {
        parameters.pickingSelectedColor = null;
      }

      if (Array.isArray(highlightColor)) {
        parameters.pickingHighlightColor = highlightColor;
      }

      if (Number.isInteger(highlightedObjectIndex)) {
        parameters.pickingSelectedColor = highlightedObjectIndex >= 0 ? this.encodePickingColor(highlightedObjectIndex) : null;
      }

      this.setModuleParameters(parameters);
    }
  }

  _getUpdateParams() {
    return {
      props: this.props,
      oldProps: this.internalState.getOldProps(),
      context: this.context,
      changeFlags: this.internalState.changeFlags
    };
  }

  _getNeedsRedraw(opts) {
    if (!this.internalState) {
      return false;
    }

    let redraw = false;
    redraw = redraw || this.internalState.needsRedraw && this.id;
    this.internalState.needsRedraw = this.internalState.needsRedraw && !opts.clearRedrawFlags;
    const attributeManager = this.getAttributeManager();
    const attributeManagerNeedsRedraw = attributeManager && attributeManager.getNeedsRedraw(opts);
    redraw = redraw || attributeManagerNeedsRedraw;
    return redraw;
  }

  _getAttributeManager() {
    return new AttributeManager(this.context.gl, {
      id: this.props.id,
      stats: this.context.stats,
      timeline: this.context.timeline
    });
  }

  _initState() {
    assert$5(!this.internalState && !this.state);
    assert$5(isFinite(this.props.coordinateSystem));

    const attributeManager = this._getAttributeManager();

    if (attributeManager) {
      attributeManager.addInstanced({
        instancePickingColors: {
          type: 5121,
          size: 3,
          noAlloc: true,
          update: this.calculateInstancePickingColors
        }
      });
    }

    this.internalState = new LayerState({
      attributeManager,
      layer: this
    });
    this.clearChangeFlags();
    this.state = {};
    Object.defineProperty(this.state, 'attributeManager', {
      get: () => {
        log$2.deprecated('layer.state.attributeManager', 'layer.getAttributeManager()');
        return attributeManager;
      }
    });
    this.internalState.layer = this;
    this.internalState.uniformTransitions = new UniformTransitionManager(this.context.timeline);
    this.internalState.onAsyncPropUpdated = this._onAsyncPropUpdated.bind(this);
    this.internalState.setAsyncProps(this.props);
  }

  _transferState(oldLayer) {
    debug(TRACE_MATCHED, this, this === oldLayer);
    const {
      state,
      internalState
    } = oldLayer;

    if (this === oldLayer) {
      return;
    }

    this.internalState = internalState;
    this.internalState.layer = this;
    this.state = state;
    this.internalState.setAsyncProps(this.props);
    this.diffProps(this.props, this.internalState.getOldProps());
  }

  _onAsyncPropUpdated() {
    this.diffProps(this.props, this.internalState.getOldProps());
    this.setNeedsUpdate();
  }

}
Layer.layerName = 'Layer';
Layer.defaultProps = defaultProps;

export { Renderbuffer as A, Buffer as B, LIFECYCLE as C, cssToDevicePixels as D, readPixelsToArray as E, FEATURES$1 as F, Layer as L, Model as M, ProgramManager as P, Resource as R, Stats as S, Texture2D as T, WebMercatorViewport as W, cloneTextureFrom as a, copyToTexture as b, createIterable as c, debug as d, assert$1 as e, flatten as f, getAccessorFromBuffer as g, hasFeatures$1 as h, env as i, isWebGL2$1 as j, createGLContext as k, lumaStats as l, log$1 as m, instrumentGLContext as n, isWebGL as o, project as p, resetParameters as q, register as r, resizeGLContext as s, Framebuffer as t, uid as u, memoize as v, setParameters as w, withParameters as x, clear as y, cssToDeviceRatio as z };
