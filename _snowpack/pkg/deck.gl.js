import { c as createCommonjsModule, r as react } from './common/index-ae389540.js';
import { d as deepEqual, C as Controller, V as ViewState, a as View } from './common/view-state-bedbebfe.js';
import { i as env, r as register, R as Resource$1, j as isWebGL2, h as hasFeatures, F as FEATURES, e as assert, k as createGLContext, l as lumaStats, m as log$1, n as instrumentGLContext, o as isWebGL, q as resetParameters, s as resizeGLContext, t as Framebuffer, p as project, v as memoize, P as ProgramManager, w as setParameters, x as withParameters, y as clear, z as cssToDeviceRatio, T as Texture2D, A as Renderbuffer, S as Stats, d as debug, f as flatten, C as LIFECYCLE, W as WebMercatorViewport, D as cssToDevicePixels, E as readPixelsToArray, L as Layer } from './common/layer-edaf1562.js';
import { I as log, a7 as mod, X as worldToLngLat, Y as log2, K as Vector3, J as COORDINATE_SYSTEM, P as PROJECTION_MODE, M as Matrix4, p as pixelsToWorld, V as Viewport, b as assert$1, c as clamp, H as defaultTypedArrayManager, a8 as EVENTS } from './common/transition-e4288157.js';
import { r as registerLoaders, l as load } from './common/load-4b03c340.js';
import { I as ImageLoader } from './common/image-loader-08ad3e29.js';
import './common/log-2130d917.js';
import './common/process-2545f00a.js';
import './common/globals-76d38a77.js';

function isJSON(text) {
  const firstChar = text[0];
  const lastChar = text[text.length - 1];
  return firstChar === '{' && lastChar === '}' || firstChar === '[' && lastChar === ']';
}

var jsonLoader = {
  name: 'JSON',
  extensions: ['json', 'geojson'],
  mimeTypes: ['application/json', 'application/geo+json'],
  testText: isJSON,
  parseTextSync: JSON.parse
};

const version = "8.6.8" ;
const existingVersion = env.global.deck && env.global.deck.VERSION;

if (existingVersion && existingVersion !== version) {
  throw new Error("deck.gl - multiple versions detected: ".concat(existingVersion, " vs ").concat(version));
}

if (!existingVersion) {
  log.log(1, "deck.gl ".concat(version))();
  env.global.deck = Object.assign(env.global.deck || {}, {
    VERSION: version,
    version,
    log,
    _registerLoggers: register
  });
  registerLoaders([jsonLoader, [ImageLoader, {
    imagebitmap: {
      premultiplyAlpha: 'none'
    }
  }]]);
}

var deckGlobal = env.global.deck;

function requestAnimationFrame$1(callback) {
  return typeof window !== 'undefined' && window.requestAnimationFrame ? window.requestAnimationFrame(callback) : setTimeout(callback, 1000 / 60);
}
function cancelAnimationFrame(timerId) {
  return typeof window !== 'undefined' && window.cancelAnimationFrame ? window.cancelAnimationFrame(timerId) : clearTimeout(timerId);
}

const GL_QUERY_RESULT = 0x8866;
const GL_QUERY_RESULT_AVAILABLE = 0x8867;
const GL_TIME_ELAPSED_EXT = 0x88bf;
const GL_GPU_DISJOINT_EXT = 0x8fbb;
const GL_TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN = 0x8c88;
const GL_ANY_SAMPLES_PASSED = 0x8c2f;
const GL_ANY_SAMPLES_PASSED_CONSERVATIVE = 0x8d6a;
class Query extends Resource$1 {
  static isSupported(gl, opts = []) {
    const webgl2 = isWebGL2(gl);
    const hasTimerQuery = hasFeatures(gl, FEATURES.TIMER_QUERY);
    let supported = webgl2 || hasTimerQuery;

    for (const key of opts) {
      switch (key) {
        case 'queries':
          supported = supported && webgl2;
          break;

        case 'timers':
          supported = supported && hasTimerQuery;
          break;

        default:
          assert(false);
      }
    }

    return supported;
  }

  constructor(gl, opts = {}) {
    super(gl, opts);
    this.target = null;
    this._queryPending = false;
    this._pollingPromise = null;
    Object.seal(this);
  }

  beginTimeElapsedQuery() {
    return this.begin(GL_TIME_ELAPSED_EXT);
  }

  beginOcclusionQuery({
    conservative = false
  } = {}) {
    return this.begin(conservative ? GL_ANY_SAMPLES_PASSED_CONSERVATIVE : GL_ANY_SAMPLES_PASSED);
  }

  beginTransformFeedbackQuery() {
    return this.begin(GL_TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN);
  }

  begin(target) {
    if (this._queryPending) {
      return this;
    }

    this.target = target;
    this.gl2.beginQuery(this.target, this.handle);
    return this;
  }

  end() {
    if (this._queryPending) {
      return this;
    }

    if (this.target) {
      this.gl2.endQuery(this.target);
      this.target = null;
      this._queryPending = true;
    }

    return this;
  }

  isResultAvailable() {
    if (!this._queryPending) {
      return false;
    }

    const resultAvailable = this.gl2.getQueryParameter(this.handle, GL_QUERY_RESULT_AVAILABLE);

    if (resultAvailable) {
      this._queryPending = false;
    }

    return resultAvailable;
  }

  isTimerDisjoint() {
    return this.gl2.getParameter(GL_GPU_DISJOINT_EXT);
  }

  getResult() {
    return this.gl2.getQueryParameter(this.handle, GL_QUERY_RESULT);
  }

  getTimerMilliseconds() {
    return this.getResult() / 1e6;
  }

  createPoll(limit = Number.POSITIVE_INFINITY) {
    if (this._pollingPromise) {
      return this._pollingPromise;
    }

    let counter = 0;
    this._pollingPromise = new Promise((resolve, reject) => {
      const poll = () => {
        if (this.isResultAvailable()) {
          resolve(this.getResult());
          this._pollingPromise = null;
        } else if (counter++ > limit) {
          reject('Timed out');
          this._pollingPromise = null;
        } else {
          requestAnimationFrame(poll);
        }
      };

      requestAnimationFrame(poll);
    });
    return this._pollingPromise;
  }

  _createHandle() {
    return Query.isSupported(this.gl) ? this.gl2.createQuery() : null;
  }

  _deleteHandle() {
    this.gl2.deleteQuery(this.handle);
  }

}

const isPage = env.isBrowser() && typeof document !== 'undefined';
let statIdCounter = 0;
class AnimationLoop {
  constructor(props = {}) {
    const {
      onCreateContext = opts => createGLContext(opts),
      onAddHTML = null,
      onInitialize = () => {},
      onRender = () => {},
      onFinalize = () => {},
      onError,
      gl = null,
      glOptions = {},
      debug = false,
      createFramebuffer = false,
      autoResizeViewport = true,
      autoResizeDrawingBuffer = true,
      stats = lumaStats.get(`animation-loop-${statIdCounter++}`)
    } = props;
    let {
      useDevicePixels = true
    } = props;

    if ('useDevicePixelRatio' in props) {
      log$1.deprecated('useDevicePixelRatio', 'useDevicePixels')();
      useDevicePixels = props.useDevicePixelRatio;
    }

    this.props = {
      onCreateContext,
      onAddHTML,
      onInitialize,
      onRender,
      onFinalize,
      onError,
      gl,
      glOptions,
      debug,
      createFramebuffer
    };
    this.gl = gl;
    this.needsRedraw = null;
    this.timeline = null;
    this.stats = stats;
    this.cpuTime = this.stats.get('CPU Time');
    this.gpuTime = this.stats.get('GPU Time');
    this.frameRate = this.stats.get('Frame Rate');
    this._initialized = false;
    this._running = false;
    this._animationFrameId = null;
    this._nextFramePromise = null;
    this._resolveNextFrame = null;
    this._cpuStartTime = 0;
    this.setProps({
      autoResizeViewport,
      autoResizeDrawingBuffer,
      useDevicePixels
    });
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this._pageLoadPromise = null;
    this._onMousemove = this._onMousemove.bind(this);
    this._onMouseleave = this._onMouseleave.bind(this);
  }

  delete() {
    this.stop();

    this._setDisplay(null);
  }

  setNeedsRedraw(reason) {
    assert(typeof reason === 'string');
    this.needsRedraw = this.needsRedraw || reason;
    return this;
  }

  setProps(props) {
    if ('autoResizeViewport' in props) {
      this.autoResizeViewport = props.autoResizeViewport;
    }

    if ('autoResizeDrawingBuffer' in props) {
      this.autoResizeDrawingBuffer = props.autoResizeDrawingBuffer;
    }

    if ('useDevicePixels' in props) {
      this.useDevicePixels = props.useDevicePixels;
    }

    return this;
  }

  start(opts = {}) {
    if (this._running) {
      return this;
    }

    this._running = true;

    const startPromise = this._getPageLoadPromise().then(() => {
      if (!this._running || this._initialized) {
        return null;
      }

      this._createWebGLContext(opts);

      this._createFramebuffer();

      this._startEventHandling();

      this._initializeCallbackData();

      this._updateCallbackData();

      this._resizeCanvasDrawingBuffer();

      this._resizeViewport();

      this._gpuTimeQuery = Query.isSupported(this.gl, ['timers']) ? new Query(this.gl) : null;
      this._initialized = true;
      return this.onInitialize(this.animationProps);
    }).then(appContext => {
      if (this._running) {
        this._addCallbackData(appContext || {});

        if (appContext !== false) {
          this._startLoop();
        }
      }
    });

    if (this.props.onError) {
      startPromise.catch(this.props.onError);
    }

    return this;
  }

  redraw() {
    if (this.isContextLost()) {
      return this;
    }

    this._beginTimers();

    this._setupFrame();

    this._updateCallbackData();

    this._renderFrame(this.animationProps);

    this._clearNeedsRedraw();

    if (this.offScreen && this.gl.commit) {
      this.gl.commit();
    }

    if (this._resolveNextFrame) {
      this._resolveNextFrame(this);

      this._nextFramePromise = null;
      this._resolveNextFrame = null;
    }

    this._endTimers();

    return this;
  }

  stop() {
    if (this._running) {
      this._finalizeCallbackData();

      this._cancelAnimationFrame(this._animationFrameId);

      this._nextFramePromise = null;
      this._resolveNextFrame = null;
      this._animationFrameId = null;
      this._running = false;
    }

    return this;
  }

  attachTimeline(timeline) {
    this.timeline = timeline;
    return this.timeline;
  }

  detachTimeline() {
    this.timeline = null;
  }

  waitForRender() {
    this.setNeedsRedraw('waitForRender');

    if (!this._nextFramePromise) {
      this._nextFramePromise = new Promise(resolve => {
        this._resolveNextFrame = resolve;
      });
    }

    return this._nextFramePromise;
  }

  async toDataURL() {
    this.setNeedsRedraw('toDataURL');
    await this.waitForRender();
    return this.gl.canvas.toDataURL();
  }

  isContextLost() {
    return this.gl.isContextLost();
  }

  onCreateContext(...args) {
    return this.props.onCreateContext(...args);
  }

  onInitialize(...args) {
    return this.props.onInitialize(...args);
  }

  onRender(...args) {
    return this.props.onRender(...args);
  }

  onFinalize(...args) {
    return this.props.onFinalize(...args);
  }

  getHTMLControlValue(id, defaultValue = 1) {
    const element = document.getElementById(id);
    return element ? Number(element.value) : defaultValue;
  }

  setViewParameters() {
    log$1.removed('AnimationLoop.setViewParameters', 'AnimationLoop.setProps')();
    return this;
  }

  _startLoop() {
    const renderFrame = () => {
      if (!this._running) {
        return;
      }

      this.redraw();
      this._animationFrameId = this._requestAnimationFrame(renderFrame);
    };

    this._cancelAnimationFrame(this._animationFrameId);

    this._animationFrameId = this._requestAnimationFrame(renderFrame);
  }

  _getPageLoadPromise() {
    if (!this._pageLoadPromise) {
      this._pageLoadPromise = isPage ? new Promise((resolve, reject) => {
        if (isPage && document.readyState === 'complete') {
          resolve(document);
          return;
        }

        window.addEventListener('load', () => {
          resolve(document);
        });
      }) : Promise.resolve({});
    }

    return this._pageLoadPromise;
  }

  _setDisplay(display) {
    if (this.display) {
      this.display.delete();
      this.display.animationLoop = null;
    }

    if (display) {
      display.animationLoop = this;
    }

    this.display = display;
  }

  _cancelAnimationFrame(animationFrameId) {
    if (this.display && this.display.cancelAnimationFrame) {
      return this.display.cancelAnimationFrame(animationFrameId);
    }

    return cancelAnimationFrame(animationFrameId);
  }

  _requestAnimationFrame(renderFrameCallback) {
    if (this._running) {
      if (this.display && this.display.requestAnimationFrame) {
        return this.display.requestAnimationFrame(renderFrameCallback);
      }

      return requestAnimationFrame$1(renderFrameCallback);
    }

    return undefined;
  }

  _renderFrame(...args) {
    if (this.display) {
      this.display._renderFrame(...args);

      return;
    }

    this.onRender(...args);
  }

  _clearNeedsRedraw() {
    this.needsRedraw = null;
  }

  _setupFrame() {
    this._resizeCanvasDrawingBuffer();

    this._resizeViewport();

    this._resizeFramebuffer();
  }

  _initializeCallbackData() {
    this.animationProps = {
      gl: this.gl,
      stop: this.stop,
      canvas: this.gl.canvas,
      framebuffer: this.framebuffer,
      useDevicePixels: this.useDevicePixels,
      needsRedraw: null,
      startTime: Date.now(),
      engineTime: 0,
      tick: 0,
      tock: 0,
      time: 0,
      _timeline: this.timeline,
      _loop: this,
      _animationLoop: this,
      _mousePosition: null
    };
  }

  _updateCallbackData() {
    const {
      width,
      height,
      aspect
    } = this._getSizeAndAspect();

    if (width !== this.animationProps.width || height !== this.animationProps.height) {
      this.setNeedsRedraw('drawing buffer resized');
    }

    if (aspect !== this.animationProps.aspect) {
      this.setNeedsRedraw('drawing buffer aspect changed');
    }

    this.animationProps.width = width;
    this.animationProps.height = height;
    this.animationProps.aspect = aspect;
    this.animationProps.needsRedraw = this.needsRedraw;
    this.animationProps.engineTime = Date.now() - this.animationProps.startTime;

    if (this.timeline) {
      this.timeline.update(this.animationProps.engineTime);
    }

    this.animationProps.tick = Math.floor(this.animationProps.time / 1000 * 60);
    this.animationProps.tock++;
    this.animationProps.time = this.timeline ? this.timeline.getTime() : this.animationProps.engineTime;
    this.animationProps._offScreen = this.offScreen;
  }

  _finalizeCallbackData() {
    this.onFinalize(this.animationProps);
  }

  _addCallbackData(appContext) {
    if (typeof appContext === 'object' && appContext !== null) {
      this.animationProps = Object.assign({}, this.animationProps, appContext);
    }
  }

  _createWebGLContext(opts) {
    this.offScreen = opts.canvas && typeof OffscreenCanvas !== 'undefined' && opts.canvas instanceof OffscreenCanvas;
    opts = Object.assign({}, opts, this.props.glOptions);
    this.gl = this.props.gl ? instrumentGLContext(this.props.gl, opts) : this.onCreateContext(opts);

    if (!isWebGL(this.gl)) {
      throw new Error('AnimationLoop.onCreateContext - illegal context returned');
    }

    resetParameters(this.gl);

    this._createInfoDiv();
  }

  _createInfoDiv() {
    if (this.gl.canvas && this.props.onAddHTML) {
      const wrapperDiv = document.createElement('div');
      document.body.appendChild(wrapperDiv);
      wrapperDiv.style.position = 'relative';
      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.left = '10px';
      div.style.bottom = '10px';
      div.style.width = '300px';
      div.style.background = 'white';
      wrapperDiv.appendChild(this.gl.canvas);
      wrapperDiv.appendChild(div);
      const html = this.props.onAddHTML(div);

      if (html) {
        div.innerHTML = html;
      }
    }
  }

  _getSizeAndAspect() {
    const width = this.gl.drawingBufferWidth;
    const height = this.gl.drawingBufferHeight;
    let aspect = 1;
    const {
      canvas
    } = this.gl;

    if (canvas && canvas.clientHeight) {
      aspect = canvas.clientWidth / canvas.clientHeight;
    } else if (width > 0 && height > 0) {
      aspect = width / height;
    }

    return {
      width,
      height,
      aspect
    };
  }

  _resizeViewport() {
    if (this.autoResizeViewport) {
      this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    }
  }

  _resizeCanvasDrawingBuffer() {
    if (this.autoResizeDrawingBuffer) {
      resizeGLContext(this.gl, {
        useDevicePixels: this.useDevicePixels
      });
    }
  }

  _createFramebuffer() {
    if (this.props.createFramebuffer) {
      this.framebuffer = new Framebuffer(this.gl);
    }
  }

  _resizeFramebuffer() {
    if (this.framebuffer) {
      this.framebuffer.resize({
        width: this.gl.drawingBufferWidth,
        height: this.gl.drawingBufferHeight
      });
    }
  }

  _beginTimers() {
    this.frameRate.timeEnd();
    this.frameRate.timeStart();

    if (this._gpuTimeQuery && this._gpuTimeQuery.isResultAvailable() && !this._gpuTimeQuery.isTimerDisjoint()) {
      this.stats.get('GPU Time').addTime(this._gpuTimeQuery.getTimerMilliseconds());
    }

    if (this._gpuTimeQuery) {
      this._gpuTimeQuery.beginTimeElapsedQuery();
    }

    this.cpuTime.timeStart();
  }

  _endTimers() {
    this.cpuTime.timeEnd();

    if (this._gpuTimeQuery) {
      this._gpuTimeQuery.end();
    }
  }

  _startEventHandling() {
    const {
      canvas
    } = this.gl;

    if (canvas) {
      canvas.addEventListener('mousemove', this._onMousemove);
      canvas.addEventListener('mouseleave', this._onMouseleave);
    }
  }

  _onMousemove(e) {
    this.animationProps._mousePosition = [e.offsetX, e.offsetY];
  }

  _onMouseleave(e) {
    this.animationProps._mousePosition = null;
  }

}

let channelHandles = 1;
let animationHandles = 1;
class Timeline {
  constructor() {
    this.time = 0;
    this.channels = new Map();
    this.animations = new Map();
    this.playing = false;
    this.lastEngineTime = -1;
  }

  addChannel(props) {
    const {
      delay = 0,
      duration = Number.POSITIVE_INFINITY,
      rate = 1,
      repeat = 1
    } = props;
    const handle = channelHandles++;
    const channel = {
      time: 0,
      delay,
      duration,
      rate,
      repeat
    };

    this._setChannelTime(channel, this.time);

    this.channels.set(handle, channel);
    return handle;
  }

  removeChannel(handle) {
    this.channels.delete(handle);

    for (const [animationHandle, animation] of this.animations) {
      if (animation.channel === handle) {
        this.detachAnimation(animationHandle);
      }
    }
  }

  isFinished(handle) {
    const channel = this.channels.get(handle);

    if (channel === undefined) {
      return false;
    }

    return this.time >= channel.delay + channel.duration * channel.repeat;
  }

  getTime(handle) {
    if (handle === undefined) {
      return this.time;
    }

    const channel = this.channels.get(handle);

    if (channel === undefined) {
      return -1;
    }

    return channel.time;
  }

  setTime(time) {
    this.time = Math.max(0, time);
    const channels = this.channels.values();

    for (const channel of channels) {
      this._setChannelTime(channel, this.time);
    }

    const animations = this.animations.values();

    for (const animationData of animations) {
      const {
        animation,
        channel
      } = animationData;
      animation.setTime(this.getTime(channel));
    }
  }

  play() {
    this.playing = true;
  }

  pause() {
    this.playing = false;
    this.lastEngineTime = -1;
  }

  reset() {
    this.setTime(0);
  }

  attachAnimation(animation, channelHandle) {
    const animationHandle = animationHandles++;
    this.animations.set(animationHandle, {
      animation,
      channel: channelHandle
    });
    animation.setTime(this.getTime(channelHandle));
    return animationHandle;
  }

  detachAnimation(handle) {
    this.animations.delete(handle);
  }

  update(engineTime) {
    if (this.playing) {
      if (this.lastEngineTime === -1) {
        this.lastEngineTime = engineTime;
      }

      this.setTime(this.time + (engineTime - this.lastEngineTime));
      this.lastEngineTime = engineTime;
    }
  }

  _setChannelTime(channel, time) {
    const offsetTime = time - channel.delay;
    const totalDuration = channel.duration * channel.repeat;

    if (offsetTime >= totalDuration) {
      channel.time = channel.duration * channel.rate;
    } else {
      channel.time = Math.max(0, offsetTime) % channel.duration;
      channel.time *= channel.rate;
    }
  }

}

const TILE_SIZE = 512;
function normalizeViewportProps({
  width,
  height,
  longitude,
  latitude,
  zoom,
  pitch = 0,
  bearing = 0
}) {
  if (longitude < -180 || longitude > 180) {
    longitude = mod(longitude + 180, 360) - 180;
  }

  if (bearing < -180 || bearing > 180) {
    bearing = mod(bearing + 180, 360) - 180;
  }

  const minZoom = log2(height / TILE_SIZE);

  if (zoom <= minZoom) {
    zoom = minZoom;
    latitude = 0;
  } else {
    const halfHeightPixels = height / 2 / Math.pow(2, zoom);
    const minLatitude = worldToLngLat([0, halfHeightPixels])[1];

    if (latitude < minLatitude) {
      latitude = minLatitude;
    } else {
      const maxLatitude = worldToLngLat([0, TILE_SIZE - halfHeightPixels])[1];

      if (latitude > maxLatitude) {
        latitude = maxLatitude;
      }
    }
  }

  return {
    width,
    height,
    longitude,
    latitude,
    zoom,
    pitch,
    bearing
  };
}

const vs = "\nconst int max_lights = 2;\nuniform mat4 shadow_uViewProjectionMatrices[max_lights];\nuniform vec4 shadow_uProjectCenters[max_lights];\nuniform bool shadow_uDrawShadowMap;\nuniform bool shadow_uUseShadowMap;\nuniform int shadow_uLightId;\nuniform float shadow_uLightCount;\n\nvarying vec3 shadow_vPosition[max_lights];\n\nvec4 shadow_setVertexPosition(vec4 position_commonspace) {\n  if (shadow_uDrawShadowMap) {\n    return project_common_position_to_clipspace(position_commonspace, shadow_uViewProjectionMatrices[shadow_uLightId], shadow_uProjectCenters[shadow_uLightId]);\n  }\n  if (shadow_uUseShadowMap) {\n    for (int i = 0; i < max_lights; i++) {\n      if(i < int(shadow_uLightCount)) {\n        vec4 shadowMap_position = project_common_position_to_clipspace(position_commonspace, shadow_uViewProjectionMatrices[i], shadow_uProjectCenters[i]);\n        shadow_vPosition[i] = (shadowMap_position.xyz / shadowMap_position.w + 1.0) / 2.0;\n      }\n    }\n  }\n  return gl_Position;\n}\n";
const fs = "\nconst int max_lights = 2;\nuniform bool shadow_uDrawShadowMap;\nuniform bool shadow_uUseShadowMap;\nuniform sampler2D shadow_uShadowMap0;\nuniform sampler2D shadow_uShadowMap1;\nuniform vec4 shadow_uColor;\nuniform float shadow_uLightCount;\n\nvarying vec3 shadow_vPosition[max_lights];\n\nconst vec4 bitPackShift = vec4(1.0, 255.0, 65025.0, 16581375.0);\nconst vec4 bitUnpackShift = 1.0 / bitPackShift;\nconst vec4 bitMask = vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0,  0.0);\n\nfloat shadow_getShadowWeight(vec3 position, sampler2D shadowMap) {\n  vec4 rgbaDepth = texture2D(shadowMap, position.xy);\n\n  float z = dot(rgbaDepth, bitUnpackShift);\n  return smoothstep(0.001, 0.01, position.z - z);\n}\n\nvec4 shadow_filterShadowColor(vec4 color) {\n  if (shadow_uDrawShadowMap) {\n    vec4 rgbaDepth = fract(gl_FragCoord.z * bitPackShift);\n    rgbaDepth -= rgbaDepth.gbaa * bitMask;\n    return rgbaDepth;\n  }\n  if (shadow_uUseShadowMap) {\n    float shadowAlpha = 0.0;\n    shadowAlpha += shadow_getShadowWeight(shadow_vPosition[0], shadow_uShadowMap0);\n    if(shadow_uLightCount > 1.0) {\n      shadowAlpha += shadow_getShadowWeight(shadow_vPosition[1], shadow_uShadowMap1);\n    }\n    shadowAlpha *= shadow_uColor.a / shadow_uLightCount;\n    float blendedAlpha = shadowAlpha + color.a * (1.0 - shadowAlpha);\n\n    return vec4(\n      mix(color.rgb, shadow_uColor.rgb, shadowAlpha / blendedAlpha),\n      blendedAlpha\n    );\n  }\n  return color;\n}\n";
const getMemoizedViewportCenterPosition = memoize(getViewportCenterPosition);
const getMemoizedViewProjectionMatrices = memoize(getViewProjectionMatrices);
const DEFAULT_SHADOW_COLOR$1 = [0, 0, 0, 1.0];
const VECTOR_TO_POINT_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0];

function screenToCommonSpace(xyz, pixelUnprojectionMatrix) {
  const [x, y, z] = xyz;
  const coord = pixelsToWorld([x, y, z], pixelUnprojectionMatrix);

  if (Number.isFinite(z)) {
    return coord;
  }

  return [coord[0], coord[1], 0];
}

function getViewportCenterPosition(_ref) {
  let {
    viewport,
    center
  } = _ref;
  return new Matrix4(viewport.viewProjectionMatrix).invert().transform(center);
}

function getViewProjectionMatrices(_ref2) {
  let {
    viewport,
    shadowMatrices
  } = _ref2;
  const projectionMatrices = [];
  const pixelUnprojectionMatrix = viewport.pixelUnprojectionMatrix;
  const farZ = viewport.isGeospatial ? undefined : 1;
  const corners = [[0, 0, farZ], [viewport.width, 0, farZ], [0, viewport.height, farZ], [viewport.width, viewport.height, farZ], [0, 0, -1], [viewport.width, 0, -1], [0, viewport.height, -1], [viewport.width, viewport.height, -1]].map(pixel => screenToCommonSpace(pixel, pixelUnprojectionMatrix));

  for (const shadowMatrix of shadowMatrices) {
    const viewMatrix = shadowMatrix.clone().translate(new Vector3(viewport.center).negate());
    const positions = corners.map(corner => viewMatrix.transform(corner));
    const projectionMatrix = new Matrix4().ortho({
      left: Math.min(...positions.map(position => position[0])),
      right: Math.max(...positions.map(position => position[0])),
      bottom: Math.min(...positions.map(position => position[1])),
      top: Math.max(...positions.map(position => position[1])),
      near: Math.min(...positions.map(position => -position[2])),
      far: Math.max(...positions.map(position => -position[2]))
    });
    projectionMatrices.push(projectionMatrix.multiplyRight(shadowMatrix));
  }

  return projectionMatrices;
}

function createShadowUniforms() {
  let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  let context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const uniforms = {
    shadow_uDrawShadowMap: Boolean(opts.drawToShadowMap),
    shadow_uUseShadowMap: opts.shadowMaps ? opts.shadowMaps.length > 0 : false,
    shadow_uColor: opts.shadowColor || DEFAULT_SHADOW_COLOR$1,
    shadow_uLightId: opts.shadowLightId || 0,
    shadow_uLightCount: opts.shadowMatrices.length
  };
  const center = getMemoizedViewportCenterPosition({
    viewport: opts.viewport,
    center: context.project_uCenter
  });
  const projectCenters = [];
  const viewProjectionMatrices = getMemoizedViewProjectionMatrices({
    shadowMatrices: opts.shadowMatrices,
    viewport: opts.viewport
  }).slice();

  for (let i = 0; i < opts.shadowMatrices.length; i++) {
    const viewProjectionMatrix = viewProjectionMatrices[i];
    const viewProjectionMatrixCentered = viewProjectionMatrix.clone().translate(new Vector3(opts.viewport.center).negate());

    if (context.project_uCoordinateSystem === COORDINATE_SYSTEM.LNGLAT && context.project_uProjectionMode === PROJECTION_MODE.WEB_MERCATOR) {
      viewProjectionMatrices[i] = viewProjectionMatrixCentered;
      projectCenters[i] = center;
    } else {
      viewProjectionMatrices[i] = viewProjectionMatrix.clone().multiplyRight(VECTOR_TO_POINT_MATRIX);
      projectCenters[i] = viewProjectionMatrixCentered.transform(center);
    }
  }

  for (let i = 0; i < viewProjectionMatrices.length; i++) {
    uniforms["shadow_uViewProjectionMatrices[".concat(i, "]")] = viewProjectionMatrices[i];
    uniforms["shadow_uProjectCenters[".concat(i, "]")] = projectCenters[i];

    if (opts.shadowMaps && opts.shadowMaps.length > 0) {
      uniforms["shadow_uShadowMap".concat(i)] = opts.shadowMaps[i];
    } else {
      uniforms["shadow_uShadowMap".concat(i)] = opts.dummyShadowMap;
    }
  }

  return uniforms;
}

var shadow = {
  name: 'shadow',
  dependencies: [project],
  vs,
  fs,
  inject: {
    'vs:DECKGL_FILTER_GL_POSITION': "\n    position = shadow_setVertexPosition(geometry.position);\n    ",
    'fs:DECKGL_FILTER_COLOR': "\n    color = shadow_filterShadowColor(color);\n    "
  },
  getUniforms: function () {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    let context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (opts.drawToShadowMap || opts.shadowMaps && opts.shadowMaps.length > 0) {
      const {
        shadowEnabled = true
      } = opts;
      return shadowEnabled && opts.shadowMatrices && opts.shadowMatrices.length > 0 ? createShadowUniforms(opts, context) : {
        shadow_uDrawShadowMap: false,
        shadow_uUseShadowMap: false
      };
    }

    return {};
  }
};

const DEFAULT_MODULES = [project];
const SHADER_HOOKS = ['vs:DECKGL_FILTER_SIZE(inout vec3 size, VertexGeometry geometry)', 'vs:DECKGL_FILTER_GL_POSITION(inout vec4 position, VertexGeometry geometry)', 'vs:DECKGL_FILTER_COLOR(inout vec4 color, VertexGeometry geometry)', 'fs:DECKGL_FILTER_COLOR(inout vec4 color, FragmentGeometry geometry)'];
function createProgramManager(gl) {
  const programManager = ProgramManager.getDefaultProgramManager(gl);

  for (const shaderModule of DEFAULT_MODULES) {
    programManager.addDefaultModule(shaderModule);
  }

  for (const shaderHook of SHADER_HOOKS) {
    programManager.addShaderHook(shaderHook);
  }

  return programManager;
}

const DEFAULT_LIGHT_COLOR$1 = [255, 255, 255];
const DEFAULT_LIGHT_INTENSITY$1 = 1.0;
let idCount$1 = 0;
class AmbientLight {
  constructor() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const {
      color = DEFAULT_LIGHT_COLOR$1
    } = props;
    const {
      intensity = DEFAULT_LIGHT_INTENSITY$1
    } = props;
    this.id = props.id || "ambient-".concat(idCount$1++);
    this.color = color;
    this.intensity = intensity;
    this.type = 'ambient';
  }

}

const DEFAULT_LIGHT_COLOR = [255, 255, 255];
const DEFAULT_LIGHT_INTENSITY = 1.0;
const DEFAULT_LIGHT_DIRECTION = [0.0, 0.0, -1.0];
let idCount = 0;
class DirectionalLight {
  constructor() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const {
      color = DEFAULT_LIGHT_COLOR
    } = props;
    const {
      intensity = DEFAULT_LIGHT_INTENSITY
    } = props;
    const {
      direction = DEFAULT_LIGHT_DIRECTION
    } = props;
    const {
      _shadow = false
    } = props;
    this.id = props.id || "directional-".concat(idCount++);
    this.color = color;
    this.intensity = intensity;
    this.type = 'directional';
    this.direction = new Vector3(direction).normalize().toArray();
    this.shadow = _shadow;
  }

  getProjectedLight() {
    return this;
  }

}

class Effect {
  constructor() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const {
      id = 'effect'
    } = props;
    this.id = id;
    this.props = { ...props
    };
  }

  preRender() {}

  getModuleParameters() {}

  cleanup() {}

}

class Pass {
  constructor(gl) {
    let props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    const {
      id = 'pass'
    } = props;
    this.id = id;
    this.gl = gl;
    this.props = { ...props
    };
  }

  setProps(props) {
    Object.assign(this.props, props);
  }

  render() {}

  cleanup() {}

}

class LayersPass extends Pass {
  render(props) {
    const gl = this.gl;
    setParameters(gl, {
      framebuffer: props.target
    });
    return this._drawLayers(props);
  }

  _drawLayers(props) {
    const {
      viewports,
      views,
      onViewportActive,
      clearCanvas = true
    } = props;
    props.pass = props.pass || 'unknown';
    const gl = this.gl;

    if (clearCanvas) {
      clearGLCanvas(gl);
    }

    const renderStats = [];

    for (const viewportOrDescriptor of viewports) {
      const viewport = viewportOrDescriptor.viewport || viewportOrDescriptor;
      const view = views && views[viewport.id];
      onViewportActive(viewport);

      const drawLayerParams = this._getDrawLayerParams(viewport, props);

      props.view = view;
      const subViewports = viewport.subViewports || [viewport];

      for (const subViewport of subViewports) {
        props.viewport = subViewport;

        const stats = this._drawLayersInViewport(gl, props, drawLayerParams);

        renderStats.push(stats);
      }
    }

    return renderStats;
  }

  _getDrawLayerParams(viewport, _ref) {
    let {
      layers,
      pass,
      layerFilter,
      effects,
      moduleParameters
    } = _ref;
    const drawLayerParams = [];
    const indexResolver = layerIndexResolver();
    const drawContext = {
      viewport,
      isPicking: pass.startsWith('picking'),
      renderPass: pass
    };
    const layerFilterCache = {};

    for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
      const layer = layers[layerIndex];

      const shouldDrawLayer = this._shouldDrawLayer(layer, drawContext, layerFilter, layerFilterCache);

      const layerRenderIndex = indexResolver(layer, shouldDrawLayer);
      const layerParam = {
        shouldDrawLayer,
        layerRenderIndex
      };

      if (shouldDrawLayer) {
        layerParam.moduleParameters = this._getModuleParameters(layer, effects, pass, moduleParameters);
        layerParam.layerParameters = this.getLayerParameters(layer, layerIndex, viewport);
      }

      drawLayerParams[layerIndex] = layerParam;
    }

    return drawLayerParams;
  }

  _drawLayersInViewport(gl, _ref2, drawLayerParams) {
    let {
      layers,
      pass,
      viewport,
      view
    } = _ref2;
    const glViewport = getGLViewport(gl, {
      viewport
    });

    if (view && view.props.clear) {
      const clearOpts = view.props.clear === true ? {
        color: true,
        depth: true
      } : view.props.clear;
      withParameters(gl, {
        scissorTest: true,
        scissor: glViewport
      }, () => clear(gl, clearOpts));
    }

    const renderStatus = {
      totalCount: layers.length,
      visibleCount: 0,
      compositeCount: 0,
      pickableCount: 0
    };
    setParameters(gl, {
      viewport: glViewport
    });

    for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
      const layer = layers[layerIndex];
      const {
        shouldDrawLayer,
        layerRenderIndex,
        moduleParameters,
        layerParameters
      } = drawLayerParams[layerIndex];

      if (shouldDrawLayer && layer.props.pickable) {
        renderStatus.pickableCount++;
      }

      if (layer.isComposite) {
        renderStatus.compositeCount++;
      } else if (shouldDrawLayer) {
        renderStatus.visibleCount++;
        moduleParameters.viewport = viewport;

        try {
          layer.drawLayer({
            moduleParameters,
            uniforms: {
              layerIndex: layerRenderIndex
            },
            parameters: layerParameters
          });
        } catch (err) {
          layer.raiseError(err, "drawing ".concat(layer, " to ").concat(pass));
        }
      }
    }

    return renderStatus;
  }

  shouldDrawLayer(layer) {
    return true;
  }

  getModuleParameters(layer, effects) {
    return null;
  }

  getLayerParameters(layer, layerIndex) {
    return layer.props.parameters;
  }

  _shouldDrawLayer(layer, drawContext, layerFilter, layerFilterCache) {
    const shouldDrawLayer = this.shouldDrawLayer(layer) && layer.props.visible;

    if (!shouldDrawLayer) {
      return false;
    }

    drawContext.layer = layer;
    let parent = layer.parent;

    while (parent) {
      if (!parent.props.visible || !parent.filterSubLayer(drawContext)) {
        return false;
      }

      drawContext.layer = parent;
      parent = parent.parent;
    }

    if (layerFilter) {
      const rootLayerId = drawContext.layer.id;

      if (!(rootLayerId in layerFilterCache)) {
        layerFilterCache[rootLayerId] = layerFilter(drawContext);
      }

      if (!layerFilterCache[rootLayerId]) {
        return false;
      }
    }

    layer.activateViewport(drawContext.viewport);
    return true;
  }

  _getModuleParameters(layer, effects, pass, overrides) {
    const moduleParameters = Object.assign(Object.create(layer.props), {
      autoWrapLongitude: layer.wrapLongitude,
      viewport: layer.context.viewport,
      mousePosition: layer.context.mousePosition,
      pickingActive: 0,
      devicePixelRatio: cssToDeviceRatio(this.gl)
    });

    if (effects) {
      for (const effect of effects) {
        Object.assign(moduleParameters, effect.getModuleParameters(layer));
      }
    }

    return Object.assign(moduleParameters, this.getModuleParameters(layer, effects), overrides);
  }

}
function layerIndexResolver() {
  let startIndex = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  let layerIndices = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const resolvers = {};

  const resolveLayerIndex = (layer, isDrawn) => {
    const indexOverride = layer.props._offset;
    const layerId = layer.id;
    const parentId = layer.parent && layer.parent.id;
    let index;

    if (parentId && !(parentId in layerIndices)) {
      resolveLayerIndex(layer.parent, false);
    }

    if (parentId in resolvers) {
      const resolver = resolvers[parentId] = resolvers[parentId] || layerIndexResolver(layerIndices[parentId], layerIndices);
      index = resolver(layer, isDrawn);
      resolvers[layerId] = resolver;
    } else if (Number.isFinite(indexOverride)) {
      index = indexOverride + (layerIndices[parentId] || 0);
      resolvers[layerId] = null;
    } else {
      index = startIndex;
    }

    if (isDrawn && index >= startIndex) {
      startIndex = index + 1;
    }

    layerIndices[layerId] = index;
    return index;
  };

  return resolveLayerIndex;
}

function getGLViewport(gl, _ref3) {
  let {
    viewport
  } = _ref3;
  const height = gl.canvas ? gl.canvas.clientHeight || gl.canvas.height : 100;
  const dimensions = viewport;
  const pixelRatio = cssToDeviceRatio(gl);
  return [dimensions.x * pixelRatio, (height - dimensions.y - dimensions.height) * pixelRatio, dimensions.width * pixelRatio, dimensions.height * pixelRatio];
}

function clearGLCanvas(gl) {
  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  setParameters(gl, {
    viewport: [0, 0, width, height]
  });
  gl.clear(16384 | 256);
}

class ShadowPass extends LayersPass {
  constructor(gl, props) {
    super(gl, props);
    this.shadowMap = new Texture2D(gl, {
      width: 1,
      height: 1,
      parameters: {
        [10241]: 9729,
        [10240]: 9729,
        [10242]: 33071,
        [10243]: 33071
      }
    });
    this.depthBuffer = new Renderbuffer(gl, {
      format: 33189,
      width: 1,
      height: 1
    });
    this.fbo = new Framebuffer(gl, {
      id: 'shadowmap',
      width: 1,
      height: 1,
      attachments: {
        [36064]: this.shadowMap,
        [36096]: this.depthBuffer
      }
    });
  }

  render(params) {
    const target = this.fbo;
    withParameters(this.gl, {
      depthRange: [0, 1],
      depthTest: true,
      blend: false,
      clearColor: [1, 1, 1, 1]
    }, () => {
      const viewport = params.viewports[0];
      const pixelRatio = cssToDeviceRatio(this.gl);
      const width = viewport.width * pixelRatio;
      const height = viewport.height * pixelRatio;

      if (width !== target.width || height !== target.height) {
        target.resize({
          width,
          height
        });
      }

      super.render({ ...params,
        target,
        pass: 'shadow'
      });
    });
  }

  shouldDrawLayer(layer) {
    return layer.props.shadowEnabled !== false;
  }

  getModuleParameters() {
    return {
      drawToShadowMap: true
    };
  }

  delete() {
    if (this.fbo) {
      this.fbo.delete();
      this.fbo = null;
    }

    if (this.shadowMap) {
      this.shadowMap.delete();
      this.shadowMap = null;
    }

    if (this.depthBuffer) {
      this.depthBuffer.delete();
      this.depthBuffer = null;
    }
  }

}

const DEFAULT_AMBIENT_LIGHT_PROPS = {
  color: [255, 255, 255],
  intensity: 1.0
};
const DEFAULT_DIRECTIONAL_LIGHT_PROPS = [{
  color: [255, 255, 255],
  intensity: 1.0,
  direction: [-1, 3, -1]
}, {
  color: [255, 255, 255],
  intensity: 0.9,
  direction: [1, -8, -2.5]
}];
const DEFAULT_SHADOW_COLOR = [0, 0, 0, 200 / 255];
class LightingEffect extends Effect {
  constructor(props) {
    super(props);
    this.ambientLight = null;
    this.directionalLights = [];
    this.pointLights = [];
    this.shadowColor = DEFAULT_SHADOW_COLOR;
    this.shadowPasses = [];
    this.shadowMaps = [];
    this.dummyShadowMap = null;
    this.shadow = false;
    this.programManager = null;

    for (const key in props) {
      const lightSource = props[key];

      switch (lightSource.type) {
        case 'ambient':
          this.ambientLight = lightSource;
          break;

        case 'directional':
          this.directionalLights.push(lightSource);
          break;

        case 'point':
          this.pointLights.push(lightSource);
          break;
      }
    }

    this._applyDefaultLights();

    this.shadow = this.directionalLights.some(light => light.shadow);
  }

  preRender(gl, _ref) {
    let {
      layers,
      layerFilter,
      viewports,
      onViewportActive,
      views
    } = _ref;
    if (!this.shadow) return;
    this.shadowMatrices = this._createLightMatrix();

    if (this.shadowPasses.length === 0) {
      this._createShadowPasses(gl);
    }

    if (!this.programManager) {
      this.programManager = ProgramManager.getDefaultProgramManager(gl);

      if (shadow) {
        this.programManager.addDefaultModule(shadow);
      }
    }

    if (!this.dummyShadowMap) {
      this.dummyShadowMap = new Texture2D(gl, {
        width: 1,
        height: 1
      });
    }

    for (let i = 0; i < this.shadowPasses.length; i++) {
      const shadowPass = this.shadowPasses[i];
      shadowPass.render({
        layers,
        layerFilter,
        viewports,
        onViewportActive,
        views,
        moduleParameters: {
          shadowLightId: i,
          dummyShadowMap: this.dummyShadowMap,
          shadowMatrices: this.shadowMatrices
        }
      });
    }
  }

  getModuleParameters(layer) {
    const parameters = this.shadow ? {
      shadowMaps: this.shadowMaps,
      dummyShadowMap: this.dummyShadowMap,
      shadowColor: this.shadowColor,
      shadowMatrices: this.shadowMatrices
    } : {};
    parameters.lightSources = {
      ambientLight: this.ambientLight,
      directionalLights: this.directionalLights.map(directionalLight => directionalLight.getProjectedLight({
        layer
      })),
      pointLights: this.pointLights.map(pointLight => pointLight.getProjectedLight({
        layer
      }))
    };
    return parameters;
  }

  cleanup() {
    for (const shadowPass of this.shadowPasses) {
      shadowPass.delete();
    }

    this.shadowPasses.length = 0;
    this.shadowMaps.length = 0;

    if (this.dummyShadowMap) {
      this.dummyShadowMap.delete();
      this.dummyShadowMap = null;
    }

    if (this.shadow && this.programManager) {
      this.programManager.removeDefaultModule(shadow);
      this.programManager = null;
    }
  }

  _createLightMatrix() {
    const lightMatrices = [];

    for (const light of this.directionalLights) {
      const viewMatrix = new Matrix4().lookAt({
        eye: new Vector3(light.direction).negate()
      });
      lightMatrices.push(viewMatrix);
    }

    return lightMatrices;
  }

  _createShadowPasses(gl) {
    for (let i = 0; i < this.directionalLights.length; i++) {
      const shadowPass = new ShadowPass(gl);
      this.shadowPasses[i] = shadowPass;
      this.shadowMaps[i] = shadowPass.shadowMap;
    }
  }

  _applyDefaultLights() {
    const {
      ambientLight,
      pointLights,
      directionalLights
    } = this;

    if (!ambientLight && pointLights.length === 0 && directionalLights.length === 0) {
      this.ambientLight = new AmbientLight(DEFAULT_AMBIENT_LIGHT_PROPS);
      this.directionalLights.push(new DirectionalLight(DEFAULT_DIRECTIONAL_LIGHT_PROPS[0]), new DirectionalLight(DEFAULT_DIRECTIONAL_LIGHT_PROPS[1]));
    }
  }

}

class Resource {
  constructor(id, data, context) {
    this.id = id;
    this.context = context;
    this._loadCount = 0;
    this._subscribers = new Set();
    this.setData(data);
  }

  subscribe(consumer) {
    this._subscribers.add(consumer);
  }

  unsubscribe(consumer) {
    this._subscribers.delete(consumer);
  }

  inUse() {
    return this._subscribers.size > 0;
  }

  delete() {}

  getData() {
    return this.isLoaded ? this._error ? Promise.reject(this._error) : this._content : this._loader.then(() => this.getData());
  }

  setData(data, forceUpdate) {
    if (data === this._data && !forceUpdate) {
      return;
    }

    this._data = data;
    const loadCount = ++this._loadCount;
    let loader = data;

    if (typeof data === 'string') {
      loader = load(data);
    }

    if (loader instanceof Promise) {
      this.isLoaded = false;
      this._loader = loader.then(result => {
        if (this._loadCount === loadCount) {
          this.isLoaded = true;
          this._error = null;
          this._content = result;
        }
      }).catch(error => {
        if (this._loadCount === loadCount) {
          this.isLoaded = true;
          this._error = error || true;
        }
      });
    } else {
      this.isLoaded = true;
      this._error = null;
      this._content = data;
    }

    for (const subscriber of this._subscribers) {
      subscriber.onChange(this.getData());
    }
  }

}

class ResourceManager {
  constructor(_ref) {
    let {
      gl,
      protocol
    } = _ref;
    this.protocol = protocol || 'resource://';
    this._context = {
      gl,
      resourceManager: this
    };
    this._resources = {};
    this._consumers = {};
    this._pruneRequest = null;
  }

  contains(resourceId) {
    if (resourceId.startsWith(this.protocol)) {
      return true;
    }

    return resourceId in this._resources;
  }

  add(_ref2) {
    let {
      resourceId,
      data,
      forceUpdate = false,
      persistent = true
    } = _ref2;
    let res = this._resources[resourceId];

    if (res) {
      res.setData(data, forceUpdate);
    } else {
      res = new Resource(resourceId, data, this._context);
      this._resources[resourceId] = res;
    }

    res.persistent = persistent;
  }

  remove(resourceId) {
    const res = this._resources[resourceId];

    if (res) {
      res.delete();
      delete this._resources[resourceId];
    }
  }

  unsubscribe(_ref3) {
    let {
      consumerId
    } = _ref3;
    const consumer = this._consumers[consumerId];

    if (consumer) {
      for (const requestId in consumer) {
        const request = consumer[requestId];

        if (request.resource) {
          request.resource.unsubscribe(request);
        }
      }

      delete this._consumers[consumerId];
      this.prune();
    }
  }

  subscribe(_ref4) {
    let {
      resourceId,
      onChange,
      consumerId,
      requestId = 'default'
    } = _ref4;
    const {
      _resources: resources,
      protocol
    } = this;

    if (resourceId.startsWith(protocol)) {
      resourceId = resourceId.replace(protocol, '');

      if (!resources[resourceId]) {
        this.add({
          resourceId,
          data: null,
          persistent: false
        });
      }
    }

    const res = resources[resourceId];

    this._track(consumerId, requestId, res, onChange);

    if (res) {
      return res.getData();
    }

    return undefined;
  }

  prune() {
    if (!this._pruneRequest) {
      this._pruneRequest = setTimeout(() => this._prune(), 0);
    }
  }

  finalize() {
    for (const key in this._resources) {
      this._resources[key].delete();
    }
  }

  _track(consumerId, requestId, resource, onChange) {
    const consumers = this._consumers;
    const consumer = consumers[consumerId] = consumers[consumerId] || {};
    const request = consumer[requestId] || {};

    if (request.resource) {
      request.resource.unsubscribe(request);
      request.resource = null;
      this.prune();
    }

    if (resource) {
      consumer[requestId] = request;
      request.onChange = onChange;
      request.resource = resource;
      resource.subscribe(request);
    }
  }

  _prune() {
    this._pruneRequest = null;

    for (const key of Object.keys(this._resources)) {
      const res = this._resources[key];

      if (!res.persistent && !res.inUse()) {
        res.delete();
        delete this._resources[key];
      }
    }
  }

}

const TRACE_SET_LAYERS = 'layerManager.setLayers';
const TRACE_ACTIVATE_VIEWPORT = 'layerManager.activateViewport';
const INITIAL_CONTEXT = Object.seal({
  layerManager: null,
  resourceManager: null,
  deck: null,
  gl: null,
  stats: null,
  shaderCache: null,
  pickingFBO: null,
  mousePosition: null,
  userData: {}
});
class LayerManager {
  constructor(gl) {
    let {
      deck,
      stats,
      viewport,
      timeline
    } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    this.lastRenderedLayers = [];
    this.layers = [];
    this.resourceManager = new ResourceManager({
      gl,
      protocol: 'deck://'
    });
    this.context = { ...INITIAL_CONTEXT,
      layerManager: this,
      gl,
      deck,
      programManager: gl && createProgramManager(gl),
      stats: stats || new Stats({
        id: 'deck.gl'
      }),
      viewport: viewport || new Viewport({
        id: 'DEFAULT-INITIAL-VIEWPORT'
      }),
      timeline: timeline || new Timeline(),
      resourceManager: this.resourceManager
    };
    this._nextLayers = null;
    this._needsRedraw = 'Initial render';
    this._needsUpdate = false;
    this._debug = false;
    this.activateViewport = this.activateViewport.bind(this);
    Object.seal(this);
  }

  finalize() {
    this.resourceManager.finalize();

    for (const layer of this.layers) {
      this._finalizeLayer(layer);
    }
  }

  needsRedraw() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      clearRedrawFlags: false
    };
    let redraw = this._needsRedraw;

    if (opts.clearRedrawFlags) {
      this._needsRedraw = false;
    }

    for (const layer of this.layers) {
      const layerNeedsRedraw = layer.getNeedsRedraw(opts);
      redraw = redraw || layerNeedsRedraw;
    }

    return redraw;
  }

  needsUpdate() {
    if (this._nextLayers && this._nextLayers !== this.lastRenderedLayers) {
      return 'layers changed';
    }

    return this._needsUpdate;
  }

  setNeedsRedraw(reason) {
    this._needsRedraw = this._needsRedraw || reason;
  }

  setNeedsUpdate(reason) {
    this._needsUpdate = this._needsUpdate || reason;
  }

  getLayers() {
    let {
      layerIds = null
    } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return layerIds ? this.layers.filter(layer => layerIds.find(layerId => layer.id.indexOf(layerId) === 0)) : this.layers;
  }

  setProps(props) {
    if ('debug' in props) {
      this._debug = props.debug;
    }

    if ('userData' in props) {
      this.context.userData = props.userData;
    }

    if ('layers' in props) {
      this._nextLayers = props.layers;
    }

    if ('onError' in props) {
      this.context.onError = props.onError;
    }
  }

  setLayers(newLayers, reason) {
    debug(TRACE_SET_LAYERS, this, reason, newLayers);
    this.lastRenderedLayers = newLayers;
    newLayers = flatten(newLayers, Boolean);

    for (const layer of newLayers) {
      layer.context = this.context;
    }

    this._updateLayers(this.layers, newLayers);

    return this;
  }

  updateLayers() {
    const reason = this.needsUpdate();

    if (reason) {
      this.setNeedsRedraw("updating layers: ".concat(reason));
      this.setLayers(this._nextLayers || this.lastRenderedLayers, reason);
    }

    this._nextLayers = null;
  }

  activateViewport(viewport) {
    debug(TRACE_ACTIVATE_VIEWPORT, this, viewport);

    if (viewport) {
      this.context.viewport = viewport;
    }

    return this;
  }

  _handleError(stage, error, layer) {
    layer.raiseError(error, "".concat(stage, " of ").concat(layer));
  }

  _updateLayers(oldLayers, newLayers) {
    const oldLayerMap = {};

    for (const oldLayer of oldLayers) {
      if (oldLayerMap[oldLayer.id]) {
        log.warn("Multiple old layers with same id ".concat(oldLayer.id))();
      } else {
        oldLayerMap[oldLayer.id] = oldLayer;
      }
    }

    const generatedLayers = [];

    this._updateSublayersRecursively(newLayers, oldLayerMap, generatedLayers);

    this._finalizeOldLayers(oldLayerMap);

    let needsUpdate = false;

    for (const layer of generatedLayers) {
      if (layer.hasUniformTransition()) {
        needsUpdate = true;
        break;
      }
    }

    this._needsUpdate = needsUpdate;
    this.layers = generatedLayers;
  }

  _updateSublayersRecursively(newLayers, oldLayerMap, generatedLayers) {
    for (const newLayer of newLayers) {
      newLayer.context = this.context;
      const oldLayer = oldLayerMap[newLayer.id];

      if (oldLayer === null) {
        log.warn("Multiple new layers with same id ".concat(newLayer.id))();
      }

      oldLayerMap[newLayer.id] = null;
      let sublayers = null;

      try {
        if (this._debug && oldLayer !== newLayer) {
          newLayer.validateProps();
        }

        if (!oldLayer) {
          this._initializeLayer(newLayer);
        } else {
          this._transferLayerState(oldLayer, newLayer);

          this._updateLayer(newLayer);
        }

        generatedLayers.push(newLayer);
        sublayers = newLayer.isComposite && newLayer.getSubLayers();
      } catch (err) {
        this._handleError('matching', err, newLayer);
      }

      if (sublayers) {
        this._updateSublayersRecursively(sublayers, oldLayerMap, generatedLayers);
      }
    }
  }

  _finalizeOldLayers(oldLayerMap) {
    for (const layerId in oldLayerMap) {
      const layer = oldLayerMap[layerId];

      if (layer) {
        this._finalizeLayer(layer);
      }
    }
  }

  _initializeLayer(layer) {
    try {
      layer._initialize();

      layer.lifecycle = LIFECYCLE.INITIALIZED;
    } catch (err) {
      this._handleError('initialization', err, layer);
    }
  }

  _transferLayerState(oldLayer, newLayer) {
    newLayer._transferState(oldLayer);

    newLayer.lifecycle = LIFECYCLE.MATCHED;

    if (newLayer !== oldLayer) {
      oldLayer.lifecycle = LIFECYCLE.AWAITING_GC;
    }
  }

  _updateLayer(layer) {
    try {
      layer._update();
    } catch (err) {
      this._handleError('update', err, layer);
    }
  }

  _finalizeLayer(layer) {
    this._needsRedraw = this._needsRedraw || "finalized ".concat(layer);
    layer.lifecycle = LIFECYCLE.AWAITING_FINALIZATION;

    try {
      layer._finalize();

      layer.lifecycle = LIFECYCLE.FINALIZED;
    } catch (err) {
      this._handleError('finalization', err, layer);
    }
  }

}

class ViewManager {
  constructor() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    this.views = [];
    this.width = 100;
    this.height = 100;
    this.viewState = {};
    this.controllers = {};
    this.timeline = props.timeline;
    this._viewports = [];
    this._viewportMap = {};
    this._isUpdating = false;
    this._needsRedraw = 'Initial render';
    this._needsUpdate = true;
    this._eventManager = props.eventManager;
    this._eventCallbacks = {
      onViewStateChange: props.onViewStateChange,
      onInteractionStateChange: props.onInteractionStateChange
    };
    Object.seal(this);
    this.setProps(props);
  }

  finalize() {
    for (const key in this.controllers) {
      if (this.controllers[key]) {
        this.controllers[key].finalize();
      }
    }

    this.controllers = {};
  }

  needsRedraw() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      clearRedrawFlags: false
    };
    const redraw = this._needsRedraw;

    if (opts.clearRedrawFlags) {
      this._needsRedraw = false;
    }

    return redraw;
  }

  setNeedsUpdate(reason) {
    this._needsUpdate = this._needsUpdate || reason;
    this._needsRedraw = this._needsRedraw || reason;
  }

  updateViewStates() {
    for (const viewId in this.controllers) {
      const controller = this.controllers[viewId];

      if (controller) {
        controller.updateTransition();
      }
    }
  }

  getViewports(rect) {
    if (rect) {
      return this._viewports.filter(viewport => viewport.containsPixel(rect));
    }

    return this._viewports;
  }

  getViews() {
    const viewMap = {};
    this.views.forEach(view => {
      viewMap[view.id] = view;
    });
    return viewMap;
  }

  getView(viewOrViewId) {
    return typeof viewOrViewId === 'string' ? this.views.find(view => view.id === viewOrViewId) : viewOrViewId;
  }

  getViewState(viewId) {
    const view = this.getView(viewId);
    const viewState = view && this.viewState[view.getViewStateId()] || this.viewState;
    return view ? view.filterViewState(viewState) : viewState;
  }

  getViewport(viewId) {
    return this._viewportMap[viewId];
  }

  unproject(xyz, opts) {
    const viewports = this.getViewports();
    const pixel = {
      x: xyz[0],
      y: xyz[1]
    };

    for (let i = viewports.length - 1; i >= 0; --i) {
      const viewport = viewports[i];

      if (viewport.containsPixel(pixel)) {
        const p = xyz.slice();
        p[0] -= viewport.x;
        p[1] -= viewport.y;
        return viewport.unproject(p, opts);
      }
    }

    return null;
  }

  setProps(props) {
    if ('views' in props) {
      this._setViews(props.views);
    }

    if ('viewState' in props) {
      this._setViewState(props.viewState);
    }

    if ('width' in props || 'height' in props) {
      this._setSize(props.width, props.height);
    }

    if (!this._isUpdating) {
      this._update();
    }
  }

  _update() {
    this._isUpdating = true;

    if (this._needsUpdate) {
      this._needsUpdate = false;

      this._rebuildViewports();
    }

    if (this._needsUpdate) {
      this._needsUpdate = false;

      this._rebuildViewports();
    }

    this._isUpdating = false;
  }

  _setSize(width, height) {
    if (width !== this.width || height !== this.height) {
      this.width = width;
      this.height = height;
      this.setNeedsUpdate('Size changed');
    }
  }

  _setViews(views) {
    views = flatten(views, Boolean);

    const viewsChanged = this._diffViews(views, this.views);

    if (viewsChanged) {
      this.setNeedsUpdate('views changed');
    }

    this.views = views;
  }

  _setViewState(viewState) {
    if (viewState) {
      const viewStateChanged = !deepEqual(viewState, this.viewState);

      if (viewStateChanged) {
        this.setNeedsUpdate('viewState changed');
      }

      this.viewState = viewState;
    } else {
      log.warn('missing `viewState` or `initialViewState`')();
    }
  }

  _onViewStateChange(viewId, event) {
    event.viewId = viewId;

    if (this._eventCallbacks.onViewStateChange) {
      this._eventCallbacks.onViewStateChange(event);
    }
  }

  _createController(view, props) {
    const Controller = props.type;
    const controller = new Controller({
      timeline: this.timeline,
      eventManager: this._eventManager,
      onViewStateChange: this._onViewStateChange.bind(this, props.id),
      onStateChange: this._eventCallbacks.onInteractionStateChange,
      makeViewport: viewState => view._getViewport(viewState, {
        width: viewState.width,
        height: viewState.height
      }),
      ...props
    });
    return controller;
  }

  _updateController(view, viewState, viewport, controller) {
    let controllerProps = view.controller;

    if (controllerProps) {
      controllerProps = { ...viewState,
        ...view.props,
        ...controllerProps,
        id: view.id,
        x: viewport.x,
        y: viewport.y,
        width: viewport.width,
        height: viewport.height
      };

      if (controller) {
        controller.setProps(controllerProps);
      } else {
        controller = this._createController(view, controllerProps);
      }

      return controller;
    }

    return null;
  }

  _rebuildViewports() {
    const {
      width,
      height,
      views
    } = this;
    const oldControllers = this.controllers;
    this._viewports = [];
    this.controllers = {};
    let invalidateControllers = false;

    for (let i = views.length; i--;) {
      const view = views[i];
      const viewState = this.getViewState(view);
      const viewport = view.makeViewport({
        width,
        height,
        viewState
      });
      let oldController = oldControllers[view.id];

      if (view.controller && !oldController) {
        invalidateControllers = true;
      }

      if ((invalidateControllers || !view.controller) && oldController) {
        oldController.finalize();
        oldController = null;
      }

      this.controllers[view.id] = this._updateController(view, viewState, viewport, oldController);

      this._viewports.unshift(viewport);
    }

    for (const id in oldControllers) {
      if (oldControllers[id] && !this.controllers[id]) {
        oldControllers[id].finalize();
      }
    }

    this._buildViewportMap();
  }

  _buildViewportMap() {
    this._viewportMap = {};

    this._viewports.forEach(viewport => {
      if (viewport.id) {
        this._viewportMap[viewport.id] = this._viewportMap[viewport.id] || viewport;
      }
    });
  }

  _diffViews(newViews, oldViews) {
    if (newViews.length !== oldViews.length) {
      return true;
    }

    return newViews.some((_, i) => !newViews[i].equals(oldViews[i]));
  }

}

const PITCH_MOUSE_THRESHOLD = 5;
const PITCH_ACCEL = 1.2;
const DEFAULT_STATE = {
  pitch: 0,
  bearing: 0,
  altitude: 1.5,
  minZoom: 0,
  maxZoom: 20,
  minPitch: 0,
  maxPitch: 60
};
class MapState extends ViewState {
  constructor() {
    let {
      makeViewport,
      width,
      height,
      latitude,
      longitude,
      zoom,
      bearing = DEFAULT_STATE.bearing,
      pitch = DEFAULT_STATE.pitch,
      altitude = DEFAULT_STATE.altitude,
      maxZoom = DEFAULT_STATE.maxZoom,
      minZoom = DEFAULT_STATE.minZoom,
      maxPitch = DEFAULT_STATE.maxPitch,
      minPitch = DEFAULT_STATE.minPitch,
      startPanLngLat,
      startZoomLngLat,
      startRotatePos,
      startBearing,
      startPitch,
      startZoom,
      normalize
    } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    assert$1(Number.isFinite(longitude));
    assert$1(Number.isFinite(latitude));
    assert$1(Number.isFinite(zoom));
    super({
      width,
      height,
      latitude,
      longitude,
      zoom,
      bearing,
      pitch,
      altitude,
      maxZoom,
      minZoom,
      maxPitch,
      minPitch,
      normalize
    });
    this._state = {
      startPanLngLat,
      startZoomLngLat,
      startRotatePos,
      startBearing,
      startPitch,
      startZoom
    };
    this.makeViewport = makeViewport;
  }

  panStart(_ref) {
    let {
      pos
    } = _ref;
    return this._getUpdatedState({
      startPanLngLat: this._unproject(pos)
    });
  }

  pan(_ref2) {
    let {
      pos,
      startPos
    } = _ref2;

    const startPanLngLat = this._state.startPanLngLat || this._unproject(startPos);

    if (!startPanLngLat) {
      return this;
    }

    const viewport = this.makeViewport(this._viewportProps);
    const newProps = viewport.panByPosition(startPanLngLat, pos);
    return this._getUpdatedState(newProps);
  }

  panEnd() {
    return this._getUpdatedState({
      startPanLngLat: null
    });
  }

  rotateStart(_ref3) {
    let {
      pos
    } = _ref3;
    return this._getUpdatedState({
      startRotatePos: pos,
      startBearing: this._viewportProps.bearing,
      startPitch: this._viewportProps.pitch
    });
  }

  rotate(_ref4) {
    let {
      pos,
      deltaAngleX = 0,
      deltaAngleY = 0
    } = _ref4;
    const {
      startRotatePos,
      startBearing,
      startPitch
    } = this._state;

    if (!startRotatePos || !Number.isFinite(startBearing) || !Number.isFinite(startPitch)) {
      return this;
    }

    let newRotation;

    if (pos) {
      newRotation = this._calculateNewPitchAndBearing({ ...this._getRotationParams(pos, startRotatePos),
        startBearing,
        startPitch
      });
    } else {
      newRotation = {
        bearing: startBearing + deltaAngleX,
        pitch: startPitch + deltaAngleY
      };
    }

    return this._getUpdatedState(newRotation);
  }

  rotateEnd() {
    return this._getUpdatedState({
      startBearing: null,
      startPitch: null
    });
  }

  zoomStart(_ref5) {
    let {
      pos
    } = _ref5;
    return this._getUpdatedState({
      startZoomLngLat: this._unproject(pos),
      startZoom: this._viewportProps.zoom
    });
  }

  zoom(_ref6) {
    let {
      pos,
      startPos,
      scale
    } = _ref6;
    let {
      startZoom,
      startZoomLngLat
    } = this._state;

    if (!Number.isFinite(startZoom)) {
      startZoom = this._viewportProps.zoom;
      startZoomLngLat = this._unproject(startPos) || this._unproject(pos);
    }

    const zoom = this._calculateNewZoom({
      scale,
      startZoom
    });

    const zoomedViewport = this.makeViewport({ ...this._viewportProps,
      zoom
    });
    return this._getUpdatedState({
      zoom,
      ...zoomedViewport.panByPosition(startZoomLngLat, pos)
    });
  }

  zoomEnd() {
    return this._getUpdatedState({
      startZoomLngLat: null,
      startZoom: null
    });
  }

  zoomIn() {
    let speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 2;
    return this._zoomFromCenter(speed);
  }

  zoomOut() {
    let speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 2;
    return this._zoomFromCenter(1 / speed);
  }

  moveLeft() {
    let speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 100;
    return this._panFromCenter([speed, 0]);
  }

  moveRight() {
    let speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 100;
    return this._panFromCenter([-speed, 0]);
  }

  moveUp() {
    let speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 100;
    return this._panFromCenter([0, speed]);
  }

  moveDown() {
    let speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 100;
    return this._panFromCenter([0, -speed]);
  }

  rotateLeft() {
    let speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 15;
    return this._getUpdatedState({
      bearing: this._viewportProps.bearing - speed
    });
  }

  rotateRight() {
    let speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 15;
    return this._getUpdatedState({
      bearing: this._viewportProps.bearing + speed
    });
  }

  rotateUp() {
    let speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 10;
    return this._getUpdatedState({
      pitch: this._viewportProps.pitch + speed
    });
  }

  rotateDown() {
    let speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 10;
    return this._getUpdatedState({
      pitch: this._viewportProps.pitch - speed
    });
  }

  shortestPathFrom(viewState) {
    const fromProps = viewState.getViewportProps();
    const props = { ...this._viewportProps
    };
    const {
      bearing,
      longitude
    } = props;

    if (Math.abs(bearing - fromProps.bearing) > 180) {
      props.bearing = bearing < 0 ? bearing + 360 : bearing - 360;
    }

    if (Math.abs(longitude - fromProps.longitude) > 180) {
      props.longitude = longitude < 0 ? longitude + 360 : longitude - 360;
    }

    return props;
  }

  _zoomFromCenter(scale) {
    const {
      width,
      height
    } = this._viewportProps;
    return this.zoom({
      pos: [width / 2, height / 2],
      scale
    });
  }

  _panFromCenter(offset) {
    const {
      width,
      height
    } = this._viewportProps;
    return this.pan({
      startPos: [width / 2, height / 2],
      pos: [width / 2 + offset[0], height / 2 + offset[1]]
    });
  }

  _getUpdatedState(newProps) {
    return new this.constructor({
      makeViewport: this.makeViewport,
      ...this._viewportProps,
      ...this._state,
      ...newProps
    });
  }

  _applyConstraints(props) {
    const {
      maxZoom,
      minZoom,
      zoom
    } = props;
    props.zoom = clamp(zoom, minZoom, maxZoom);
    const {
      maxPitch,
      minPitch,
      pitch
    } = props;
    props.pitch = clamp(pitch, minPitch, maxPitch);
    const {
      normalize = true
    } = props;

    if (normalize) {
      Object.assign(props, normalizeViewportProps(props));
    }

    return props;
  }

  _unproject(pos) {
    const viewport = this.makeViewport(this._viewportProps);
    return pos && viewport.unproject(pos);
  }

  _calculateNewZoom(_ref7) {
    let {
      scale,
      startZoom
    } = _ref7;
    const {
      maxZoom,
      minZoom
    } = this._viewportProps;
    const zoom = startZoom + Math.log2(scale);
    return clamp(zoom, minZoom, maxZoom);
  }

  _calculateNewPitchAndBearing(_ref8) {
    let {
      deltaScaleX,
      deltaScaleY,
      startBearing,
      startPitch
    } = _ref8;
    deltaScaleY = clamp(deltaScaleY, -1, 1);
    const {
      minPitch,
      maxPitch
    } = this._viewportProps;
    const bearing = startBearing + 180 * deltaScaleX;
    let pitch = startPitch;

    if (deltaScaleY > 0) {
      pitch = startPitch + deltaScaleY * (maxPitch - startPitch);
    } else if (deltaScaleY < 0) {
      pitch = startPitch - deltaScaleY * (minPitch - startPitch);
    }

    return {
      pitch,
      bearing
    };
  }

  _getRotationParams(pos, startPos) {
    const deltaX = pos[0] - startPos[0];
    const deltaY = pos[1] - startPos[1];
    const centerY = pos[1];
    const startY = startPos[1];
    const {
      width,
      height
    } = this._viewportProps;
    const deltaScaleX = deltaX / width;
    let deltaScaleY = 0;

    if (deltaY > 0) {
      if (Math.abs(height - startY) > PITCH_MOUSE_THRESHOLD) {
        deltaScaleY = deltaY / (startY - height) * PITCH_ACCEL;
      }
    } else if (deltaY < 0) {
      if (startY > PITCH_MOUSE_THRESHOLD) {
        deltaScaleY = 1 - centerY / startY;
      }
    }

    deltaScaleY = Math.min(1, Math.max(-1, deltaScaleY));
    return {
      deltaScaleX,
      deltaScaleY
    };
  }

}
class MapController extends Controller {
  constructor(props) {
    props.dragMode = props.dragMode || 'pan';
    super(MapState, props);
  }

  setProps(props) {
    const oldProps = this.controllerStateProps;
    super.setProps(props);
    const dimensionChanged = !oldProps || oldProps.height !== props.height;

    if (dimensionChanged) {
      this.updateViewport(new this.ControllerState({
        makeViewport: this.makeViewport,
        ...this.controllerStateProps,
        ...this._state
      }));
    }
  }

  get linearTransitionProps() {
    return ['longitude', 'latitude', 'zoom', 'bearing', 'pitch'];
  }

}

class MapView extends View {
  constructor(props) {
    super({ ...props,
      type: WebMercatorViewport
    });
  }

  get controller() {
    return this._getControllerProps({
      type: MapController
    });
  }

}
MapView.displayName = 'MapView';

const DEFAULT_LIGHTING_EFFECT = new LightingEffect();
class EffectManager {
  constructor() {
    this.effects = [];
    this._internalEffects = [];
    this._needsRedraw = 'Initial render';
    this.setEffects();
  }

  setProps(props) {
    if ('effects' in props) {
      if (props.effects.length !== this.effects.length || !deepEqual(props.effects, this.effects)) {
        this.setEffects(props.effects);
        this._needsRedraw = 'effects changed';
      }
    }
  }

  needsRedraw() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      clearRedrawFlags: false
    };
    const redraw = this._needsRedraw;

    if (opts.clearRedrawFlags) {
      this._needsRedraw = false;
    }

    return redraw;
  }

  getEffects() {
    return this._internalEffects;
  }

  finalize() {
    this.cleanup();
  }

  setEffects() {
    let effects = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    this.cleanup();
    this.effects = effects;

    this._createInternalEffects();
  }

  cleanup() {
    for (const effect of this.effects) {
      effect.cleanup();
    }

    for (const effect of this._internalEffects) {
      effect.cleanup();
    }

    this.effects.length = 0;
    this._internalEffects.length = 0;
  }

  _createInternalEffects() {
    this._internalEffects = this.effects.slice();

    if (!this.effects.some(effect => effect instanceof LightingEffect)) {
      this._internalEffects.push(DEFAULT_LIGHTING_EFFECT);
    }
  }

}

class DrawLayersPass extends LayersPass {}

const PICKING_PARAMETERS = {
  blendFunc: [1, 0, 32771, 0],
  blendEquation: 32774
};
class PickLayersPass extends LayersPass {
  render(props) {
    if (props.pickingFBO) {
      return this._drawPickingBuffer(props);
    }

    return super.render(props);
  }

  _drawPickingBuffer(_ref) {
    let {
      layers,
      layerFilter,
      views,
      viewports,
      onViewportActive,
      pickingFBO,
      deviceRect: {
        x,
        y,
        width,
        height
      },
      pass = 'picking',
      redrawReason,
      pickZ
    } = _ref;
    const gl = this.gl;
    this.pickZ = pickZ;
    const encodedColors = !pickZ && {
      byLayer: new Map(),
      byAlpha: []
    };
    this._colors = encodedColors;
    const renderStatus = withParameters(gl, {
      scissorTest: true,
      scissor: [x, y, width, height],
      clearColor: [0, 0, 0, 0],
      depthMask: true,
      depthTest: true,
      depthRange: [0, 1],
      colorMask: [true, true, true, true],
      ...PICKING_PARAMETERS,
      blend: !pickZ
    }, () => super.render({
      target: pickingFBO,
      layers,
      layerFilter,
      views,
      viewports,
      onViewportActive,
      pass,
      redrawReason
    }));
    this._colors = null;
    const decodePickingColor = encodedColors && decodeColor.bind(null, encodedColors);
    return {
      decodePickingColor,
      stats: renderStatus
    };
  }

  shouldDrawLayer(layer) {
    return layer.props.pickable;
  }

  getModuleParameters() {
    return {
      pickingActive: 1,
      pickingAttribute: this.pickZ,
      lightSources: {}
    };
  }

  getLayerParameters(layer, layerIndex, viewport) {
    const pickParameters = { ...layer.props.parameters
    };

    if (this.pickZ) {
      pickParameters.blend = false;
    } else {
      Object.assign(pickParameters, PICKING_PARAMETERS);
      pickParameters.blend = true;
      pickParameters.blendColor = encodeColor(this._colors, layer, viewport);
    }

    return pickParameters;
  }

}

function encodeColor(encoded, layer, viewport) {
  const {
    byLayer,
    byAlpha
  } = encoded;
  let a;

  if (byLayer.has(layer)) {
    const entry = byLayer.get(layer);
    entry.viewports.push(viewport);
    a = entry.a;
  } else {
    a = byLayer.size + 1;

    if (a <= 255) {
      const entry = {
        a,
        layer,
        viewports: [viewport]
      };
      byLayer.set(layer, entry);
      byAlpha[a] = entry;
    } else {
      log.warn('Too many pickable layers, only picking the first 255')();
      a = 0;
    }
  }

  return [0, 0, 0, a / 255];
}

function decodeColor(encoded, pickedColor) {
  const entry = encoded.byAlpha[pickedColor[3]];
  return entry && {
    pickedLayer: entry.layer,
    pickedViewports: entry.viewports,
    pickedObjectIndex: entry.layer.decodePickingColor(pickedColor)
  };
}

const TRACE_RENDER_LAYERS = 'deckRenderer.renderLayers';
class DeckRenderer {
  constructor(gl) {
    this.gl = gl;
    this.layerFilter = null;
    this.drawPickingColors = false;
    this.drawLayersPass = new DrawLayersPass(gl);
    this.pickLayersPass = new PickLayersPass(gl);
    this.renderCount = 0;
    this._needsRedraw = 'Initial render';
    this.renderBuffers = [];
    this.lastPostProcessEffect = null;
  }

  setProps(props) {
    if ('layerFilter' in props && this.layerFilter !== props.layerFilter) {
      this.layerFilter = props.layerFilter;
      this._needsRedraw = 'layerFilter changed';
    }

    if ('drawPickingColors' in props && this.drawPickingColors !== props.drawPickingColors) {
      this.drawPickingColors = props.drawPickingColors;
      this._needsRedraw = 'drawPickingColors changed';
    }
  }

  renderLayers(opts) {
    const layerPass = this.drawPickingColors ? this.pickLayersPass : this.drawLayersPass;
    opts.layerFilter = opts.layerFilter || this.layerFilter;
    opts.effects = opts.effects || [];
    opts.target = opts.target || Framebuffer.getDefaultFramebuffer(this.gl);

    this._preRender(opts.effects, opts);

    const outputBuffer = this.lastPostProcessEffect ? this.renderBuffers[0] : opts.target;
    const renderStats = layerPass.render({ ...opts,
      target: outputBuffer
    });

    this._postRender(opts.effects, opts);

    this.renderCount++;
    debug(TRACE_RENDER_LAYERS, this, renderStats, opts);
  }

  needsRedraw() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      clearRedrawFlags: false
    };
    const redraw = this._needsRedraw;

    if (opts.clearRedrawFlags) {
      this._needsRedraw = false;
    }

    return redraw;
  }

  finalize() {
    const {
      renderBuffers
    } = this;

    for (const buffer of renderBuffers) {
      buffer.delete();
    }

    renderBuffers.length = 0;
  }

  _preRender(effects, opts) {
    let lastPostProcessEffect = null;

    for (const effect of effects) {
      effect.preRender(this.gl, opts);

      if (effect.postRender) {
        lastPostProcessEffect = effect;
      }
    }

    if (lastPostProcessEffect) {
      this._resizeRenderBuffers();
    }

    this.lastPostProcessEffect = lastPostProcessEffect;
  }

  _resizeRenderBuffers() {
    const {
      renderBuffers
    } = this;

    if (renderBuffers.length === 0) {
      renderBuffers.push(new Framebuffer(this.gl), new Framebuffer(this.gl));
    }

    for (const buffer of renderBuffers) {
      buffer.resize();
    }
  }

  _postRender(effects, opts) {
    const {
      renderBuffers
    } = this;
    const params = {
      inputBuffer: renderBuffers[0],
      swapBuffer: renderBuffers[1],
      target: null
    };

    for (const effect of effects) {
      if (effect.postRender) {
        if (effect === this.lastPostProcessEffect) {
          params.target = opts.target;
          effect.postRender(this.gl, params);
          break;
        }

        const buffer = effect.postRender(this.gl, params);
        params.inputBuffer = buffer;
        params.swapBuffer = buffer === renderBuffers[0] ? renderBuffers[1] : renderBuffers[0];
      }
    }
  }

}

const NO_PICKED_OBJECT = {
  pickedColor: null,
  pickedLayer: null,
  pickedObjectIndex: -1
};
function getClosestObject(_ref) {
  let {
    pickedColors,
    decodePickingColor,
    deviceX,
    deviceY,
    deviceRadius,
    deviceRect
  } = _ref;

  if (pickedColors) {
    const {
      x,
      y,
      width,
      height
    } = deviceRect;
    let minSquareDistanceToCenter = deviceRadius * deviceRadius;
    let closestPixelIndex = -1;
    let i = 0;

    for (let row = 0; row < height; row++) {
      const dy = row + y - deviceY;
      const dy2 = dy * dy;

      if (dy2 > minSquareDistanceToCenter) {
        i += 4 * width;
      } else {
        for (let col = 0; col < width; col++) {
          const pickedLayerIndex = pickedColors[i + 3] - 1;

          if (pickedLayerIndex >= 0) {
            const dx = col + x - deviceX;
            const d2 = dx * dx + dy2;

            if (d2 <= minSquareDistanceToCenter) {
              minSquareDistanceToCenter = d2;
              closestPixelIndex = i;
            }
          }

          i += 4;
        }
      }
    }

    if (closestPixelIndex >= 0) {
      const pickedColor = pickedColors.slice(closestPixelIndex, closestPixelIndex + 4);
      const pickedObject = decodePickingColor(pickedColor);

      if (pickedObject) {
        const dy = Math.floor(closestPixelIndex / 4 / width);
        const dx = closestPixelIndex / 4 - dy * width;
        return { ...pickedObject,
          pickedColor,
          pickedX: x + dx,
          pickedY: y + dy
        };
      }

      log.error('Picked non-existent layer. Is picking buffer corrupt?')();
    }
  }

  return NO_PICKED_OBJECT;
}
function getUniqueObjects(_ref2) {
  let {
    pickedColors,
    decodePickingColor
  } = _ref2;
  const uniqueColors = new Map();

  if (pickedColors) {
    for (let i = 0; i < pickedColors.length; i += 4) {
      const pickedLayerIndex = pickedColors[i + 3] - 1;

      if (pickedLayerIndex >= 0) {
        const pickedColor = pickedColors.slice(i, i + 4);
        const colorKey = pickedColor.join(',');

        if (!uniqueColors.has(colorKey)) {
          const pickedObject = decodePickingColor(pickedColor);

          if (pickedObject) {
            uniqueColors.set(colorKey, { ...pickedObject,
              pickedColor
            });
          } else {
            log.error('Picked non-existent layer. Is picking buffer corrupt?')();
          }
        }
      }
    }
  }

  return Array.from(uniqueColors.values());
}

function getEmptyPickingInfo(_ref) {
  let {
    pickInfo,
    viewports,
    pixelRatio,
    x,
    y,
    z
  } = _ref;
  let pickedViewport = viewports[0];

  if (viewports.length > 1) {
    pickedViewport = getViewportFromCoordinates((pickInfo === null || pickInfo === void 0 ? void 0 : pickInfo.pickedViewports) || viewports, {
      x,
      y
    });
  }

  const coordinate = pickedViewport && pickedViewport.unproject([x - pickedViewport.x, y - pickedViewport.y, z]);
  return {
    color: null,
    layer: null,
    viewport: pickedViewport,
    index: -1,
    picked: false,
    x,
    y,
    pixel: [x, y],
    coordinate,
    devicePixel: pickInfo && 'pickedX' in pickInfo ? [pickInfo.pickedX, pickInfo.pickedY] : null,
    pixelRatio
  };
}
function processPickInfo(opts) {
  const {
    pickInfo,
    lastPickedInfo,
    mode,
    layers
  } = opts;
  const {
    pickedColor,
    pickedLayer,
    pickedObjectIndex
  } = pickInfo;
  const affectedLayers = pickedLayer ? [pickedLayer] : [];

  if (mode === 'hover') {
    const lastPickedObjectIndex = lastPickedInfo.index;
    const lastPickedLayerId = lastPickedInfo.layerId;
    const pickedLayerId = pickedLayer && pickedLayer.props.id;

    if (pickedLayerId !== lastPickedLayerId || pickedObjectIndex !== lastPickedObjectIndex) {
      if (pickedLayerId !== lastPickedLayerId) {
        const lastPickedLayer = layers.find(layer => layer.props.id === lastPickedLayerId);

        if (lastPickedLayer) {
          affectedLayers.unshift(lastPickedLayer);
        }
      }

      lastPickedInfo.layerId = pickedLayerId;
      lastPickedInfo.index = pickedObjectIndex;
      lastPickedInfo.info = null;
    }
  }

  const baseInfo = getEmptyPickingInfo(opts);
  const infos = new Map();
  infos.set(null, baseInfo);
  affectedLayers.forEach(layer => {
    let info = { ...baseInfo
    };

    if (layer === pickedLayer) {
      info.color = pickedColor;
      info.index = pickedObjectIndex;
      info.picked = true;
    }

    info = getLayerPickingInfo({
      layer,
      info,
      mode
    });

    if (layer === pickedLayer && mode === 'hover') {
      lastPickedInfo.info = info;
    }

    infos.set(info.layer.id, info);

    if (mode === 'hover') {
      info.layer.updateAutoHighlight(info);
    }
  });
  return infos;
}
function getLayerPickingInfo(_ref2) {
  let {
    layer,
    info,
    mode
  } = _ref2;

  while (layer && info) {
    const sourceLayer = info.layer || null;
    info.sourceLayer = sourceLayer;
    info.layer = layer;
    info = layer.getPickingInfo({
      info,
      mode,
      sourceLayer
    });
    layer = layer.parent;
  }

  return info;
}

function getViewportFromCoordinates(viewports, pixel) {
  for (let i = viewports.length - 1; i >= 0; i--) {
    const viewport = viewports[i];

    if (viewport.containsPixel(pixel)) {
      return viewport;
    }
  }

  return viewports[0];
}

class DeckPicker {
  constructor(gl) {
    this.gl = gl;
    this.pickingFBO = null;
    this.pickLayersPass = new PickLayersPass(gl);
    this.layerFilter = null;
    this.lastPickedInfo = {
      index: -1,
      layerId: null,
      info: null
    };
  }

  setProps(props) {
    if ('layerFilter' in props) {
      this.layerFilter = props.layerFilter;
    }

    if ('_pickable' in props) {
      this._pickable = props._pickable;
    }
  }

  finalize() {
    if (this.pickingFBO) {
      this.pickingFBO.delete();
    }

    if (this.depthFBO) {
      this.depthFBO.color.delete();
      this.depthFBO.delete();
    }
  }

  pickObject(opts) {
    return this._pickClosestObject(opts);
  }

  pickObjects(opts) {
    return this._pickVisibleObjects(opts);
  }

  getLastPickedObject(_ref) {
    let {
      x,
      y,
      layers,
      viewports
    } = _ref;
    let lastPickedInfo = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.lastPickedInfo.info;
    const lastPickedLayerId = lastPickedInfo && lastPickedInfo.layer && lastPickedInfo.layer.id;
    const lastPickedViewportId = lastPickedInfo && lastPickedInfo.viewport && lastPickedInfo.viewport.id;
    const layer = lastPickedLayerId ? layers.find(l => l.id === lastPickedLayerId) : null;
    const viewport = lastPickedViewportId && viewports.find(v => v.id === lastPickedViewportId) || viewports[0];
    const coordinate = viewport && viewport.unproject([x - viewport.x, y - viewport.y]);
    const info = {
      x,
      y,
      viewport,
      coordinate,
      layer
    };
    return { ...lastPickedInfo,
      ...info
    };
  }

  _resizeBuffer() {
    const {
      gl
    } = this;

    if (!this.pickingFBO) {
      this.pickingFBO = new Framebuffer(gl);

      if (Framebuffer.isSupported(gl, {
        colorBufferFloat: true
      })) {
        this.depthFBO = new Framebuffer(gl);
        this.depthFBO.attach({
          [36064]: new Texture2D(gl, {
            format: isWebGL2(gl) ? 34836 : 6408,
            type: 5126
          })
        });
      }
    }

    this.pickingFBO.resize({
      width: gl.canvas.width,
      height: gl.canvas.height
    });

    if (this.depthFBO) {
      this.depthFBO.resize({
        width: gl.canvas.width,
        height: gl.canvas.height
      });
    }

    return this.pickingFBO;
  }

  _getPickable(layers) {
    if (this._pickable === false) {
      return null;
    }

    const pickableLayers = layers.filter(layer => layer.isPickable() && !layer.isComposite);
    return pickableLayers.length ? pickableLayers : null;
  }

  _pickClosestObject(_ref2) {
    let {
      layers,
      views,
      viewports,
      x,
      y,
      radius = 0,
      depth = 1,
      mode = 'query',
      unproject3D,
      onViewportActive
    } = _ref2;
    layers = this._getPickable(layers);

    if (!layers) {
      return {
        result: [],
        emptyInfo: getEmptyPickingInfo({
          viewports,
          x,
          y
        })
      };
    }

    this._resizeBuffer();

    const pixelRatio = cssToDeviceRatio(this.gl);
    const devicePixelRange = cssToDevicePixels(this.gl, [x, y], true);
    const devicePixel = [devicePixelRange.x + Math.floor(devicePixelRange.width / 2), devicePixelRange.y + Math.floor(devicePixelRange.height / 2)];
    const deviceRadius = Math.round(radius * pixelRatio);
    const {
      width,
      height
    } = this.pickingFBO;

    const deviceRect = this._getPickingRect({
      deviceX: devicePixel[0],
      deviceY: devicePixel[1],
      deviceRadius,
      deviceWidth: width,
      deviceHeight: height
    });

    let infos;
    const result = [];
    const affectedLayers = new Set();

    for (let i = 0; i < depth; i++) {
      const pickedResult = deviceRect && this._drawAndSample({
        layers,
        views,
        viewports,
        onViewportActive,
        deviceRect,
        pass: "picking:".concat(mode),
        redrawReason: mode
      });

      const pickInfo = getClosestObject({ ...pickedResult,
        deviceX: devicePixel[0],
        deviceY: devicePixel[1],
        deviceRadius,
        deviceRect
      });
      let z;

      if (pickInfo.pickedLayer && unproject3D && this.depthFBO) {
        const pickedResultPass2 = this._drawAndSample({
          layers: [pickInfo.pickedLayer],
          views,
          viewports,
          onViewportActive,
          deviceRect: {
            x: pickInfo.pickedX,
            y: pickInfo.pickedY,
            width: 1,
            height: 1
          },
          pass: "picking:".concat(mode),
          redrawReason: 'pick-z',
          pickZ: true
        });

        z = pickedResultPass2.pickedColors[0];
      }

      if (pickInfo.pickedLayer && i + 1 < depth) {
        affectedLayers.add(pickInfo.pickedLayer);
        pickInfo.pickedLayer.disablePickingIndex(pickInfo.pickedObjectIndex);
      }

      infos = processPickInfo({
        pickInfo,
        lastPickedInfo: this.lastPickedInfo,
        mode,
        layers,
        viewports,
        x,
        y,
        z,
        pixelRatio
      });

      for (const info of infos.values()) {
        if (info.layer) {
          result.push(info);
        }
      }

      if (!pickInfo.pickedColor) {
        break;
      }
    }

    for (const layer of affectedLayers) {
      layer.restorePickingColors();
    }

    return {
      result,
      emptyInfo: infos && infos.get(null)
    };
  }

  _pickVisibleObjects(_ref3) {
    let {
      layers,
      views,
      viewports,
      x,
      y,
      width = 1,
      height = 1,
      mode = 'query',
      maxObjects = null,
      onViewportActive
    } = _ref3;
    layers = this._getPickable(layers);

    if (!layers) {
      return [];
    }

    this._resizeBuffer();

    const pixelRatio = cssToDeviceRatio(this.gl);
    const leftTop = cssToDevicePixels(this.gl, [x, y], true);
    const deviceLeft = leftTop.x;
    const deviceTop = leftTop.y + leftTop.height;
    const rightBottom = cssToDevicePixels(this.gl, [x + width, y + height], true);
    const deviceRight = rightBottom.x + rightBottom.width;
    const deviceBottom = rightBottom.y;
    const deviceRect = {
      x: deviceLeft,
      y: deviceBottom,
      width: deviceRight - deviceLeft,
      height: deviceTop - deviceBottom
    };

    const pickedResult = this._drawAndSample({
      layers,
      views,
      viewports,
      onViewportActive,
      deviceRect,
      pass: "picking:".concat(mode),
      redrawReason: mode
    });

    const pickInfos = getUniqueObjects(pickedResult);
    const uniqueInfos = new Map();
    const isMaxObjects = Number.isFinite(maxObjects);

    for (let i = 0; i < pickInfos.length; i++) {
      if (isMaxObjects && uniqueInfos.size >= maxObjects) {
        break;
      }

      const pickInfo = pickInfos[i];
      let info = {
        color: pickInfo.pickedColor,
        layer: null,
        index: pickInfo.pickedObjectIndex,
        picked: true,
        x,
        y,
        width,
        height,
        pixelRatio
      };
      info = getLayerPickingInfo({
        layer: pickInfo.pickedLayer,
        info,
        mode
      });

      if (!uniqueInfos.has(info.object)) {
        uniqueInfos.set(info.object, info);
      }
    }

    return Array.from(uniqueInfos.values());
  }

  _drawAndSample(_ref4) {
    let {
      layers,
      views,
      viewports,
      onViewportActive,
      deviceRect,
      pass,
      redrawReason,
      pickZ
    } = _ref4;
    const pickingFBO = pickZ ? this.depthFBO : this.pickingFBO;
    const {
      decodePickingColor
    } = this.pickLayersPass.render({
      layers,
      layerFilter: this.layerFilter,
      views,
      viewports,
      onViewportActive,
      pickingFBO,
      deviceRect,
      pass,
      redrawReason,
      pickZ
    });
    const {
      x,
      y,
      width,
      height
    } = deviceRect;
    const pickedColors = new (pickZ ? Float32Array : Uint8Array)(width * height * 4);
    readPixelsToArray(pickingFBO, {
      sourceX: x,
      sourceY: y,
      sourceWidth: width,
      sourceHeight: height,
      target: pickedColors
    });
    return {
      pickedColors,
      decodePickingColor
    };
  }

  _getPickingRect(_ref5) {
    let {
      deviceX,
      deviceY,
      deviceRadius,
      deviceWidth,
      deviceHeight
    } = _ref5;
    const x = Math.max(0, deviceX - deviceRadius);
    const y = Math.max(0, deviceY - deviceRadius);
    const width = Math.min(deviceWidth, deviceX + deviceRadius + 1) - x;
    const height = Math.min(deviceHeight, deviceY + deviceRadius + 1) - y;

    if (width <= 0 || height <= 0) {
      return null;
    }

    return {
      x,
      y,
      width,
      height
    };
  }

}

const defaultStyle = {
  zIndex: 1,
  position: 'absolute',
  pointerEvents: 'none',
  color: '#a0a7b4',
  backgroundColor: '#29323c',
  padding: '10px',
  top: 0,
  left: 0,
  display: 'none'
};
class Tooltip {
  constructor(canvas) {
    const canvasParent = canvas.parentElement;

    if (canvasParent) {
      this.el = document.createElement('div');
      this.el.className = 'deck-tooltip';
      Object.assign(this.el.style, defaultStyle);
      canvasParent.appendChild(this.el);
    }

    this.isVisible = false;
  }

  setTooltip(displayInfo, x, y) {
    const el = this.el;

    if (typeof displayInfo === 'string') {
      el.innerText = displayInfo;
    } else if (!displayInfo) {
      this.isVisible = false;
      el.style.display = 'none';
      return;
    } else {
      if ('text' in displayInfo) {
        el.innerText = displayInfo.text;
      }

      if ('html' in displayInfo) {
        el.innerHTML = displayInfo.html;
      }

      if ('className' in displayInfo) {
        el.className = displayInfo.className;
      }

      Object.assign(el.style, displayInfo.style);
    }

    this.isVisible = true;
    el.style.display = 'block';
    el.style.transform = "translate(".concat(x, "px, ").concat(y, "px)");
  }

  remove() {
    if (this.el) {
      this.el.remove();
    }
  }

}

var hammer = createCommonjsModule(function (module) {
/*! Hammer.JS - v2.0.7 - 2016-04-22
 * http://hammerjs.github.io/
 *
 * Copyright (c) 2016 Jorik Tangelder;
 * Licensed under the MIT license */
(function(window, document, exportName, undefined$1) {

var VENDOR_PREFIXES = ['', 'webkit', 'Moz', 'MS', 'ms', 'o'];
var TEST_ELEMENT = document.createElement('div');

var TYPE_FUNCTION = 'function';

var round = Math.round;
var abs = Math.abs;
var now = Date.now;

/**
 * set a timeout with a given scope
 * @param {Function} fn
 * @param {Number} timeout
 * @param {Object} context
 * @returns {number}
 */
function setTimeoutContext(fn, timeout, context) {
    return setTimeout(bindFn(fn, context), timeout);
}

/**
 * if the argument is an array, we want to execute the fn on each entry
 * if it aint an array we don't want to do a thing.
 * this is used by all the methods that accept a single and array argument.
 * @param {*|Array} arg
 * @param {String} fn
 * @param {Object} [context]
 * @returns {Boolean}
 */
function invokeArrayArg(arg, fn, context) {
    if (Array.isArray(arg)) {
        each(arg, context[fn], context);
        return true;
    }
    return false;
}

/**
 * walk objects and arrays
 * @param {Object} obj
 * @param {Function} iterator
 * @param {Object} context
 */
function each(obj, iterator, context) {
    var i;

    if (!obj) {
        return;
    }

    if (obj.forEach) {
        obj.forEach(iterator, context);
    } else if (obj.length !== undefined$1) {
        i = 0;
        while (i < obj.length) {
            iterator.call(context, obj[i], i, obj);
            i++;
        }
    } else {
        for (i in obj) {
            obj.hasOwnProperty(i) && iterator.call(context, obj[i], i, obj);
        }
    }
}

/**
 * wrap a method with a deprecation warning and stack trace
 * @param {Function} method
 * @param {String} name
 * @param {String} message
 * @returns {Function} A new function wrapping the supplied method.
 */
function deprecate(method, name, message) {
    var deprecationMessage = 'DEPRECATED METHOD: ' + name + '\n' + message + ' AT \n';
    return function() {
        var e = new Error('get-stack-trace');
        var stack = e && e.stack ? e.stack.replace(/^[^\(]+?[\n$]/gm, '')
            .replace(/^\s+at\s+/gm, '')
            .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@') : 'Unknown Stack Trace';

        var log = window.console && (window.console.warn || window.console.log);
        if (log) {
            log.call(window.console, deprecationMessage, stack);
        }
        return method.apply(this, arguments);
    };
}

/**
 * extend object.
 * means that properties in dest will be overwritten by the ones in src.
 * @param {Object} target
 * @param {...Object} objects_to_assign
 * @returns {Object} target
 */
var assign;
if (typeof Object.assign !== 'function') {
    assign = function assign(target) {
        if (target === undefined$1 || target === null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }

        var output = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var source = arguments[index];
            if (source !== undefined$1 && source !== null) {
                for (var nextKey in source) {
                    if (source.hasOwnProperty(nextKey)) {
                        output[nextKey] = source[nextKey];
                    }
                }
            }
        }
        return output;
    };
} else {
    assign = Object.assign;
}

/**
 * extend object.
 * means that properties in dest will be overwritten by the ones in src.
 * @param {Object} dest
 * @param {Object} src
 * @param {Boolean} [merge=false]
 * @returns {Object} dest
 */
var extend = deprecate(function extend(dest, src, merge) {
    var keys = Object.keys(src);
    var i = 0;
    while (i < keys.length) {
        if (!merge || (merge && dest[keys[i]] === undefined$1)) {
            dest[keys[i]] = src[keys[i]];
        }
        i++;
    }
    return dest;
}, 'extend', 'Use `assign`.');

/**
 * merge the values from src in the dest.
 * means that properties that exist in dest will not be overwritten by src
 * @param {Object} dest
 * @param {Object} src
 * @returns {Object} dest
 */
var merge = deprecate(function merge(dest, src) {
    return extend(dest, src, true);
}, 'merge', 'Use `assign`.');

/**
 * simple class inheritance
 * @param {Function} child
 * @param {Function} base
 * @param {Object} [properties]
 */
function inherit(child, base, properties) {
    var baseP = base.prototype,
        childP;

    childP = child.prototype = Object.create(baseP);
    childP.constructor = child;
    childP._super = baseP;

    if (properties) {
        assign(childP, properties);
    }
}

/**
 * simple function bind
 * @param {Function} fn
 * @param {Object} context
 * @returns {Function}
 */
function bindFn(fn, context) {
    return function boundFn() {
        return fn.apply(context, arguments);
    };
}

/**
 * let a boolean value also be a function that must return a boolean
 * this first item in args will be used as the context
 * @param {Boolean|Function} val
 * @param {Array} [args]
 * @returns {Boolean}
 */
function boolOrFn(val, args) {
    if (typeof val == TYPE_FUNCTION) {
        return val.apply(args ? args[0] || undefined$1 : undefined$1, args);
    }
    return val;
}

/**
 * use the val2 when val1 is undefined
 * @param {*} val1
 * @param {*} val2
 * @returns {*}
 */
function ifUndefined(val1, val2) {
    return (val1 === undefined$1) ? val2 : val1;
}

/**
 * addEventListener with multiple events at once
 * @param {EventTarget} target
 * @param {String} types
 * @param {Function} handler
 */
function addEventListeners(target, types, handler) {
    each(splitStr(types), function(type) {
        target.addEventListener(type, handler, false);
    });
}

/**
 * removeEventListener with multiple events at once
 * @param {EventTarget} target
 * @param {String} types
 * @param {Function} handler
 */
function removeEventListeners(target, types, handler) {
    each(splitStr(types), function(type) {
        target.removeEventListener(type, handler, false);
    });
}

/**
 * find if a node is in the given parent
 * @method hasParent
 * @param {HTMLElement} node
 * @param {HTMLElement} parent
 * @return {Boolean} found
 */
function hasParent(node, parent) {
    while (node) {
        if (node == parent) {
            return true;
        }
        node = node.parentNode;
    }
    return false;
}

/**
 * small indexOf wrapper
 * @param {String} str
 * @param {String} find
 * @returns {Boolean} found
 */
function inStr(str, find) {
    return str.indexOf(find) > -1;
}

/**
 * split string on whitespace
 * @param {String} str
 * @returns {Array} words
 */
function splitStr(str) {
    return str.trim().split(/\s+/g);
}

/**
 * find if a array contains the object using indexOf or a simple polyFill
 * @param {Array} src
 * @param {String} find
 * @param {String} [findByKey]
 * @return {Boolean|Number} false when not found, or the index
 */
function inArray(src, find, findByKey) {
    if (src.indexOf && !findByKey) {
        return src.indexOf(find);
    } else {
        var i = 0;
        while (i < src.length) {
            if ((findByKey && src[i][findByKey] == find) || (!findByKey && src[i] === find)) {
                return i;
            }
            i++;
        }
        return -1;
    }
}

/**
 * convert array-like objects to real arrays
 * @param {Object} obj
 * @returns {Array}
 */
function toArray(obj) {
    return Array.prototype.slice.call(obj, 0);
}

/**
 * unique array with objects based on a key (like 'id') or just by the array's value
 * @param {Array} src [{id:1},{id:2},{id:1}]
 * @param {String} [key]
 * @param {Boolean} [sort=False]
 * @returns {Array} [{id:1},{id:2}]
 */
function uniqueArray(src, key, sort) {
    var results = [];
    var values = [];
    var i = 0;

    while (i < src.length) {
        var val = key ? src[i][key] : src[i];
        if (inArray(values, val) < 0) {
            results.push(src[i]);
        }
        values[i] = val;
        i++;
    }

    if (sort) {
        if (!key) {
            results = results.sort();
        } else {
            results = results.sort(function sortUniqueArray(a, b) {
                return a[key] > b[key];
            });
        }
    }

    return results;
}

/**
 * get the prefixed property
 * @param {Object} obj
 * @param {String} property
 * @returns {String|Undefined} prefixed
 */
function prefixed(obj, property) {
    var prefix, prop;
    var camelProp = property[0].toUpperCase() + property.slice(1);

    var i = 0;
    while (i < VENDOR_PREFIXES.length) {
        prefix = VENDOR_PREFIXES[i];
        prop = (prefix) ? prefix + camelProp : property;

        if (prop in obj) {
            return prop;
        }
        i++;
    }
    return undefined$1;
}

/**
 * get a unique id
 * @returns {number} uniqueId
 */
var _uniqueId = 1;
function uniqueId() {
    return _uniqueId++;
}

/**
 * get the window object of an element
 * @param {HTMLElement} element
 * @returns {DocumentView|Window}
 */
function getWindowForElement(element) {
    var doc = element.ownerDocument || element;
    return (doc.defaultView || doc.parentWindow || window);
}

var MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i;

var SUPPORT_TOUCH = ('ontouchstart' in window);
var SUPPORT_POINTER_EVENTS = prefixed(window, 'PointerEvent') !== undefined$1;
var SUPPORT_ONLY_TOUCH = SUPPORT_TOUCH && MOBILE_REGEX.test(navigator.userAgent);

var INPUT_TYPE_TOUCH = 'touch';
var INPUT_TYPE_PEN = 'pen';
var INPUT_TYPE_MOUSE = 'mouse';
var INPUT_TYPE_KINECT = 'kinect';

var COMPUTE_INTERVAL = 25;

var INPUT_START = 1;
var INPUT_MOVE = 2;
var INPUT_END = 4;
var INPUT_CANCEL = 8;

var DIRECTION_NONE = 1;
var DIRECTION_LEFT = 2;
var DIRECTION_RIGHT = 4;
var DIRECTION_UP = 8;
var DIRECTION_DOWN = 16;

var DIRECTION_HORIZONTAL = DIRECTION_LEFT | DIRECTION_RIGHT;
var DIRECTION_VERTICAL = DIRECTION_UP | DIRECTION_DOWN;
var DIRECTION_ALL = DIRECTION_HORIZONTAL | DIRECTION_VERTICAL;

var PROPS_XY = ['x', 'y'];
var PROPS_CLIENT_XY = ['clientX', 'clientY'];

/**
 * create new input type manager
 * @param {Manager} manager
 * @param {Function} callback
 * @returns {Input}
 * @constructor
 */
function Input(manager, callback) {
    var self = this;
    this.manager = manager;
    this.callback = callback;
    this.element = manager.element;
    this.target = manager.options.inputTarget;

    // smaller wrapper around the handler, for the scope and the enabled state of the manager,
    // so when disabled the input events are completely bypassed.
    this.domHandler = function(ev) {
        if (boolOrFn(manager.options.enable, [manager])) {
            self.handler(ev);
        }
    };

    this.init();

}

Input.prototype = {
    /**
     * should handle the inputEvent data and trigger the callback
     * @virtual
     */
    handler: function() { },

    /**
     * bind the events
     */
    init: function() {
        this.evEl && addEventListeners(this.element, this.evEl, this.domHandler);
        this.evTarget && addEventListeners(this.target, this.evTarget, this.domHandler);
        this.evWin && addEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
    },

    /**
     * unbind the events
     */
    destroy: function() {
        this.evEl && removeEventListeners(this.element, this.evEl, this.domHandler);
        this.evTarget && removeEventListeners(this.target, this.evTarget, this.domHandler);
        this.evWin && removeEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
    }
};

/**
 * create new input type manager
 * called by the Manager constructor
 * @param {Hammer} manager
 * @returns {Input}
 */
function createInputInstance(manager) {
    var Type;
    var inputClass = manager.options.inputClass;

    if (inputClass) {
        Type = inputClass;
    } else if (SUPPORT_POINTER_EVENTS) {
        Type = PointerEventInput;
    } else if (SUPPORT_ONLY_TOUCH) {
        Type = TouchInput;
    } else if (!SUPPORT_TOUCH) {
        Type = MouseInput;
    } else {
        Type = TouchMouseInput;
    }
    return new (Type)(manager, inputHandler);
}

/**
 * handle input events
 * @param {Manager} manager
 * @param {String} eventType
 * @param {Object} input
 */
function inputHandler(manager, eventType, input) {
    var pointersLen = input.pointers.length;
    var changedPointersLen = input.changedPointers.length;
    var isFirst = (eventType & INPUT_START && (pointersLen - changedPointersLen === 0));
    var isFinal = (eventType & (INPUT_END | INPUT_CANCEL) && (pointersLen - changedPointersLen === 0));

    input.isFirst = !!isFirst;
    input.isFinal = !!isFinal;

    if (isFirst) {
        manager.session = {};
    }

    // source event is the normalized value of the domEvents
    // like 'touchstart, mouseup, pointerdown'
    input.eventType = eventType;

    // compute scale, rotation etc
    computeInputData(manager, input);

    // emit secret event
    manager.emit('hammer.input', input);

    manager.recognize(input);
    manager.session.prevInput = input;
}

/**
 * extend the data with some usable properties like scale, rotate, velocity etc
 * @param {Object} manager
 * @param {Object} input
 */
function computeInputData(manager, input) {
    var session = manager.session;
    var pointers = input.pointers;
    var pointersLength = pointers.length;

    // store the first input to calculate the distance and direction
    if (!session.firstInput) {
        session.firstInput = simpleCloneInputData(input);
    }

    // to compute scale and rotation we need to store the multiple touches
    if (pointersLength > 1 && !session.firstMultiple) {
        session.firstMultiple = simpleCloneInputData(input);
    } else if (pointersLength === 1) {
        session.firstMultiple = false;
    }

    var firstInput = session.firstInput;
    var firstMultiple = session.firstMultiple;
    var offsetCenter = firstMultiple ? firstMultiple.center : firstInput.center;

    var center = input.center = getCenter(pointers);
    input.timeStamp = now();
    input.deltaTime = input.timeStamp - firstInput.timeStamp;

    input.angle = getAngle(offsetCenter, center);
    input.distance = getDistance(offsetCenter, center);

    computeDeltaXY(session, input);
    input.offsetDirection = getDirection(input.deltaX, input.deltaY);

    var overallVelocity = getVelocity(input.deltaTime, input.deltaX, input.deltaY);
    input.overallVelocityX = overallVelocity.x;
    input.overallVelocityY = overallVelocity.y;
    input.overallVelocity = (abs(overallVelocity.x) > abs(overallVelocity.y)) ? overallVelocity.x : overallVelocity.y;

    input.scale = firstMultiple ? getScale(firstMultiple.pointers, pointers) : 1;
    input.rotation = firstMultiple ? getRotation(firstMultiple.pointers, pointers) : 0;

    input.maxPointers = !session.prevInput ? input.pointers.length : ((input.pointers.length >
        session.prevInput.maxPointers) ? input.pointers.length : session.prevInput.maxPointers);

    computeIntervalInputData(session, input);

    // find the correct target
    var target = manager.element;
    if (hasParent(input.srcEvent.target, target)) {
        target = input.srcEvent.target;
    }
    input.target = target;
}

function computeDeltaXY(session, input) {
    var center = input.center;
    var offset = session.offsetDelta || {};
    var prevDelta = session.prevDelta || {};
    var prevInput = session.prevInput || {};

    if (input.eventType === INPUT_START || prevInput.eventType === INPUT_END) {
        prevDelta = session.prevDelta = {
            x: prevInput.deltaX || 0,
            y: prevInput.deltaY || 0
        };

        offset = session.offsetDelta = {
            x: center.x,
            y: center.y
        };
    }

    input.deltaX = prevDelta.x + (center.x - offset.x);
    input.deltaY = prevDelta.y + (center.y - offset.y);
}

/**
 * velocity is calculated every x ms
 * @param {Object} session
 * @param {Object} input
 */
function computeIntervalInputData(session, input) {
    var last = session.lastInterval || input,
        deltaTime = input.timeStamp - last.timeStamp,
        velocity, velocityX, velocityY, direction;

    if (input.eventType != INPUT_CANCEL && (deltaTime > COMPUTE_INTERVAL || last.velocity === undefined$1)) {
        var deltaX = input.deltaX - last.deltaX;
        var deltaY = input.deltaY - last.deltaY;

        var v = getVelocity(deltaTime, deltaX, deltaY);
        velocityX = v.x;
        velocityY = v.y;
        velocity = (abs(v.x) > abs(v.y)) ? v.x : v.y;
        direction = getDirection(deltaX, deltaY);

        session.lastInterval = input;
    } else {
        // use latest velocity info if it doesn't overtake a minimum period
        velocity = last.velocity;
        velocityX = last.velocityX;
        velocityY = last.velocityY;
        direction = last.direction;
    }

    input.velocity = velocity;
    input.velocityX = velocityX;
    input.velocityY = velocityY;
    input.direction = direction;
}

/**
 * create a simple clone from the input used for storage of firstInput and firstMultiple
 * @param {Object} input
 * @returns {Object} clonedInputData
 */
function simpleCloneInputData(input) {
    // make a simple copy of the pointers because we will get a reference if we don't
    // we only need clientXY for the calculations
    var pointers = [];
    var i = 0;
    while (i < input.pointers.length) {
        pointers[i] = {
            clientX: round(input.pointers[i].clientX),
            clientY: round(input.pointers[i].clientY)
        };
        i++;
    }

    return {
        timeStamp: now(),
        pointers: pointers,
        center: getCenter(pointers),
        deltaX: input.deltaX,
        deltaY: input.deltaY
    };
}

/**
 * get the center of all the pointers
 * @param {Array} pointers
 * @return {Object} center contains `x` and `y` properties
 */
function getCenter(pointers) {
    var pointersLength = pointers.length;

    // no need to loop when only one touch
    if (pointersLength === 1) {
        return {
            x: round(pointers[0].clientX),
            y: round(pointers[0].clientY)
        };
    }

    var x = 0, y = 0, i = 0;
    while (i < pointersLength) {
        x += pointers[i].clientX;
        y += pointers[i].clientY;
        i++;
    }

    return {
        x: round(x / pointersLength),
        y: round(y / pointersLength)
    };
}

/**
 * calculate the velocity between two points. unit is in px per ms.
 * @param {Number} deltaTime
 * @param {Number} x
 * @param {Number} y
 * @return {Object} velocity `x` and `y`
 */
function getVelocity(deltaTime, x, y) {
    return {
        x: x / deltaTime || 0,
        y: y / deltaTime || 0
    };
}

/**
 * get the direction between two points
 * @param {Number} x
 * @param {Number} y
 * @return {Number} direction
 */
function getDirection(x, y) {
    if (x === y) {
        return DIRECTION_NONE;
    }

    if (abs(x) >= abs(y)) {
        return x < 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
    }
    return y < 0 ? DIRECTION_UP : DIRECTION_DOWN;
}

/**
 * calculate the absolute distance between two points
 * @param {Object} p1 {x, y}
 * @param {Object} p2 {x, y}
 * @param {Array} [props] containing x and y keys
 * @return {Number} distance
 */
function getDistance(p1, p2, props) {
    if (!props) {
        props = PROPS_XY;
    }
    var x = p2[props[0]] - p1[props[0]],
        y = p2[props[1]] - p1[props[1]];

    return Math.sqrt((x * x) + (y * y));
}

/**
 * calculate the angle between two coordinates
 * @param {Object} p1
 * @param {Object} p2
 * @param {Array} [props] containing x and y keys
 * @return {Number} angle
 */
function getAngle(p1, p2, props) {
    if (!props) {
        props = PROPS_XY;
    }
    var x = p2[props[0]] - p1[props[0]],
        y = p2[props[1]] - p1[props[1]];
    return Math.atan2(y, x) * 180 / Math.PI;
}

/**
 * calculate the rotation degrees between two pointersets
 * @param {Array} start array of pointers
 * @param {Array} end array of pointers
 * @return {Number} rotation
 */
function getRotation(start, end) {
    return getAngle(end[1], end[0], PROPS_CLIENT_XY) + getAngle(start[1], start[0], PROPS_CLIENT_XY);
}

/**
 * calculate the scale factor between two pointersets
 * no scale is 1, and goes down to 0 when pinched together, and bigger when pinched out
 * @param {Array} start array of pointers
 * @param {Array} end array of pointers
 * @return {Number} scale
 */
function getScale(start, end) {
    return getDistance(end[0], end[1], PROPS_CLIENT_XY) / getDistance(start[0], start[1], PROPS_CLIENT_XY);
}

var MOUSE_INPUT_MAP = {
    mousedown: INPUT_START,
    mousemove: INPUT_MOVE,
    mouseup: INPUT_END
};

var MOUSE_ELEMENT_EVENTS = 'mousedown';
var MOUSE_WINDOW_EVENTS = 'mousemove mouseup';

/**
 * Mouse events input
 * @constructor
 * @extends Input
 */
function MouseInput() {
    this.evEl = MOUSE_ELEMENT_EVENTS;
    this.evWin = MOUSE_WINDOW_EVENTS;

    this.pressed = false; // mousedown state

    Input.apply(this, arguments);
}

inherit(MouseInput, Input, {
    /**
     * handle mouse events
     * @param {Object} ev
     */
    handler: function MEhandler(ev) {
        var eventType = MOUSE_INPUT_MAP[ev.type];

        // on start we want to have the left mouse button down
        if (eventType & INPUT_START && ev.button === 0) {
            this.pressed = true;
        }

        if (eventType & INPUT_MOVE && ev.which !== 1) {
            eventType = INPUT_END;
        }

        // mouse must be down
        if (!this.pressed) {
            return;
        }

        if (eventType & INPUT_END) {
            this.pressed = false;
        }

        this.callback(this.manager, eventType, {
            pointers: [ev],
            changedPointers: [ev],
            pointerType: INPUT_TYPE_MOUSE,
            srcEvent: ev
        });
    }
});

var POINTER_INPUT_MAP = {
    pointerdown: INPUT_START,
    pointermove: INPUT_MOVE,
    pointerup: INPUT_END,
    pointercancel: INPUT_CANCEL,
    pointerout: INPUT_CANCEL
};

// in IE10 the pointer types is defined as an enum
var IE10_POINTER_TYPE_ENUM = {
    2: INPUT_TYPE_TOUCH,
    3: INPUT_TYPE_PEN,
    4: INPUT_TYPE_MOUSE,
    5: INPUT_TYPE_KINECT // see https://twitter.com/jacobrossi/status/480596438489890816
};

var POINTER_ELEMENT_EVENTS = 'pointerdown';
var POINTER_WINDOW_EVENTS = 'pointermove pointerup pointercancel';

// IE10 has prefixed support, and case-sensitive
if (window.MSPointerEvent && !window.PointerEvent) {
    POINTER_ELEMENT_EVENTS = 'MSPointerDown';
    POINTER_WINDOW_EVENTS = 'MSPointerMove MSPointerUp MSPointerCancel';
}

/**
 * Pointer events input
 * @constructor
 * @extends Input
 */
function PointerEventInput() {
    this.evEl = POINTER_ELEMENT_EVENTS;
    this.evWin = POINTER_WINDOW_EVENTS;

    Input.apply(this, arguments);

    this.store = (this.manager.session.pointerEvents = []);
}

inherit(PointerEventInput, Input, {
    /**
     * handle mouse events
     * @param {Object} ev
     */
    handler: function PEhandler(ev) {
        var store = this.store;
        var removePointer = false;

        var eventTypeNormalized = ev.type.toLowerCase().replace('ms', '');
        var eventType = POINTER_INPUT_MAP[eventTypeNormalized];
        var pointerType = IE10_POINTER_TYPE_ENUM[ev.pointerType] || ev.pointerType;

        var isTouch = (pointerType == INPUT_TYPE_TOUCH);

        // get index of the event in the store
        var storeIndex = inArray(store, ev.pointerId, 'pointerId');

        // start and mouse must be down
        if (eventType & INPUT_START && (ev.button === 0 || isTouch)) {
            if (storeIndex < 0) {
                store.push(ev);
                storeIndex = store.length - 1;
            }
        } else if (eventType & (INPUT_END | INPUT_CANCEL)) {
            removePointer = true;
        }

        // it not found, so the pointer hasn't been down (so it's probably a hover)
        if (storeIndex < 0) {
            return;
        }

        // update the event in the store
        store[storeIndex] = ev;

        this.callback(this.manager, eventType, {
            pointers: store,
            changedPointers: [ev],
            pointerType: pointerType,
            srcEvent: ev
        });

        if (removePointer) {
            // remove from the store
            store.splice(storeIndex, 1);
        }
    }
});

var SINGLE_TOUCH_INPUT_MAP = {
    touchstart: INPUT_START,
    touchmove: INPUT_MOVE,
    touchend: INPUT_END,
    touchcancel: INPUT_CANCEL
};

var SINGLE_TOUCH_TARGET_EVENTS = 'touchstart';
var SINGLE_TOUCH_WINDOW_EVENTS = 'touchstart touchmove touchend touchcancel';

/**
 * Touch events input
 * @constructor
 * @extends Input
 */
function SingleTouchInput() {
    this.evTarget = SINGLE_TOUCH_TARGET_EVENTS;
    this.evWin = SINGLE_TOUCH_WINDOW_EVENTS;
    this.started = false;

    Input.apply(this, arguments);
}

inherit(SingleTouchInput, Input, {
    handler: function TEhandler(ev) {
        var type = SINGLE_TOUCH_INPUT_MAP[ev.type];

        // should we handle the touch events?
        if (type === INPUT_START) {
            this.started = true;
        }

        if (!this.started) {
            return;
        }

        var touches = normalizeSingleTouches.call(this, ev, type);

        // when done, reset the started state
        if (type & (INPUT_END | INPUT_CANCEL) && touches[0].length - touches[1].length === 0) {
            this.started = false;
        }

        this.callback(this.manager, type, {
            pointers: touches[0],
            changedPointers: touches[1],
            pointerType: INPUT_TYPE_TOUCH,
            srcEvent: ev
        });
    }
});

/**
 * @this {TouchInput}
 * @param {Object} ev
 * @param {Number} type flag
 * @returns {undefined|Array} [all, changed]
 */
function normalizeSingleTouches(ev, type) {
    var all = toArray(ev.touches);
    var changed = toArray(ev.changedTouches);

    if (type & (INPUT_END | INPUT_CANCEL)) {
        all = uniqueArray(all.concat(changed), 'identifier', true);
    }

    return [all, changed];
}

var TOUCH_INPUT_MAP = {
    touchstart: INPUT_START,
    touchmove: INPUT_MOVE,
    touchend: INPUT_END,
    touchcancel: INPUT_CANCEL
};

var TOUCH_TARGET_EVENTS = 'touchstart touchmove touchend touchcancel';

/**
 * Multi-user touch events input
 * @constructor
 * @extends Input
 */
function TouchInput() {
    this.evTarget = TOUCH_TARGET_EVENTS;
    this.targetIds = {};

    Input.apply(this, arguments);
}

inherit(TouchInput, Input, {
    handler: function MTEhandler(ev) {
        var type = TOUCH_INPUT_MAP[ev.type];
        var touches = getTouches.call(this, ev, type);
        if (!touches) {
            return;
        }

        this.callback(this.manager, type, {
            pointers: touches[0],
            changedPointers: touches[1],
            pointerType: INPUT_TYPE_TOUCH,
            srcEvent: ev
        });
    }
});

/**
 * @this {TouchInput}
 * @param {Object} ev
 * @param {Number} type flag
 * @returns {undefined|Array} [all, changed]
 */
function getTouches(ev, type) {
    var allTouches = toArray(ev.touches);
    var targetIds = this.targetIds;

    // when there is only one touch, the process can be simplified
    if (type & (INPUT_START | INPUT_MOVE) && allTouches.length === 1) {
        targetIds[allTouches[0].identifier] = true;
        return [allTouches, allTouches];
    }

    var i,
        targetTouches,
        changedTouches = toArray(ev.changedTouches),
        changedTargetTouches = [],
        target = this.target;

    // get target touches from touches
    targetTouches = allTouches.filter(function(touch) {
        return hasParent(touch.target, target);
    });

    // collect touches
    if (type === INPUT_START) {
        i = 0;
        while (i < targetTouches.length) {
            targetIds[targetTouches[i].identifier] = true;
            i++;
        }
    }

    // filter changed touches to only contain touches that exist in the collected target ids
    i = 0;
    while (i < changedTouches.length) {
        if (targetIds[changedTouches[i].identifier]) {
            changedTargetTouches.push(changedTouches[i]);
        }

        // cleanup removed touches
        if (type & (INPUT_END | INPUT_CANCEL)) {
            delete targetIds[changedTouches[i].identifier];
        }
        i++;
    }

    if (!changedTargetTouches.length) {
        return;
    }

    return [
        // merge targetTouches with changedTargetTouches so it contains ALL touches, including 'end' and 'cancel'
        uniqueArray(targetTouches.concat(changedTargetTouches), 'identifier', true),
        changedTargetTouches
    ];
}

/**
 * Combined touch and mouse input
 *
 * Touch has a higher priority then mouse, and while touching no mouse events are allowed.
 * This because touch devices also emit mouse events while doing a touch.
 *
 * @constructor
 * @extends Input
 */

var DEDUP_TIMEOUT = 2500;
var DEDUP_DISTANCE = 25;

function TouchMouseInput() {
    Input.apply(this, arguments);

    var handler = bindFn(this.handler, this);
    this.touch = new TouchInput(this.manager, handler);
    this.mouse = new MouseInput(this.manager, handler);

    this.primaryTouch = null;
    this.lastTouches = [];
}

inherit(TouchMouseInput, Input, {
    /**
     * handle mouse and touch events
     * @param {Hammer} manager
     * @param {String} inputEvent
     * @param {Object} inputData
     */
    handler: function TMEhandler(manager, inputEvent, inputData) {
        var isTouch = (inputData.pointerType == INPUT_TYPE_TOUCH),
            isMouse = (inputData.pointerType == INPUT_TYPE_MOUSE);

        if (isMouse && inputData.sourceCapabilities && inputData.sourceCapabilities.firesTouchEvents) {
            return;
        }

        // when we're in a touch event, record touches to  de-dupe synthetic mouse event
        if (isTouch) {
            recordTouches.call(this, inputEvent, inputData);
        } else if (isMouse && isSyntheticEvent.call(this, inputData)) {
            return;
        }

        this.callback(manager, inputEvent, inputData);
    },

    /**
     * remove the event listeners
     */
    destroy: function destroy() {
        this.touch.destroy();
        this.mouse.destroy();
    }
});

function recordTouches(eventType, eventData) {
    if (eventType & INPUT_START) {
        this.primaryTouch = eventData.changedPointers[0].identifier;
        setLastTouch.call(this, eventData);
    } else if (eventType & (INPUT_END | INPUT_CANCEL)) {
        setLastTouch.call(this, eventData);
    }
}

function setLastTouch(eventData) {
    var touch = eventData.changedPointers[0];

    if (touch.identifier === this.primaryTouch) {
        var lastTouch = {x: touch.clientX, y: touch.clientY};
        this.lastTouches.push(lastTouch);
        var lts = this.lastTouches;
        var removeLastTouch = function() {
            var i = lts.indexOf(lastTouch);
            if (i > -1) {
                lts.splice(i, 1);
            }
        };
        setTimeout(removeLastTouch, DEDUP_TIMEOUT);
    }
}

function isSyntheticEvent(eventData) {
    var x = eventData.srcEvent.clientX, y = eventData.srcEvent.clientY;
    for (var i = 0; i < this.lastTouches.length; i++) {
        var t = this.lastTouches[i];
        var dx = Math.abs(x - t.x), dy = Math.abs(y - t.y);
        if (dx <= DEDUP_DISTANCE && dy <= DEDUP_DISTANCE) {
            return true;
        }
    }
    return false;
}

var PREFIXED_TOUCH_ACTION = prefixed(TEST_ELEMENT.style, 'touchAction');
var NATIVE_TOUCH_ACTION = PREFIXED_TOUCH_ACTION !== undefined$1;

// magical touchAction value
var TOUCH_ACTION_COMPUTE = 'compute';
var TOUCH_ACTION_AUTO = 'auto';
var TOUCH_ACTION_MANIPULATION = 'manipulation'; // not implemented
var TOUCH_ACTION_NONE = 'none';
var TOUCH_ACTION_PAN_X = 'pan-x';
var TOUCH_ACTION_PAN_Y = 'pan-y';
var TOUCH_ACTION_MAP = getTouchActionProps();

/**
 * Touch Action
 * sets the touchAction property or uses the js alternative
 * @param {Manager} manager
 * @param {String} value
 * @constructor
 */
function TouchAction(manager, value) {
    this.manager = manager;
    this.set(value);
}

TouchAction.prototype = {
    /**
     * set the touchAction value on the element or enable the polyfill
     * @param {String} value
     */
    set: function(value) {
        // find out the touch-action by the event handlers
        if (value == TOUCH_ACTION_COMPUTE) {
            value = this.compute();
        }

        if (NATIVE_TOUCH_ACTION && this.manager.element.style && TOUCH_ACTION_MAP[value]) {
            this.manager.element.style[PREFIXED_TOUCH_ACTION] = value;
        }
        this.actions = value.toLowerCase().trim();
    },

    /**
     * just re-set the touchAction value
     */
    update: function() {
        this.set(this.manager.options.touchAction);
    },

    /**
     * compute the value for the touchAction property based on the recognizer's settings
     * @returns {String} value
     */
    compute: function() {
        var actions = [];
        each(this.manager.recognizers, function(recognizer) {
            if (boolOrFn(recognizer.options.enable, [recognizer])) {
                actions = actions.concat(recognizer.getTouchAction());
            }
        });
        return cleanTouchActions(actions.join(' '));
    },

    /**
     * this method is called on each input cycle and provides the preventing of the browser behavior
     * @param {Object} input
     */
    preventDefaults: function(input) {
        var srcEvent = input.srcEvent;
        var direction = input.offsetDirection;

        // if the touch action did prevented once this session
        if (this.manager.session.prevented) {
            srcEvent.preventDefault();
            return;
        }

        var actions = this.actions;
        var hasNone = inStr(actions, TOUCH_ACTION_NONE) && !TOUCH_ACTION_MAP[TOUCH_ACTION_NONE];
        var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y) && !TOUCH_ACTION_MAP[TOUCH_ACTION_PAN_Y];
        var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X) && !TOUCH_ACTION_MAP[TOUCH_ACTION_PAN_X];

        if (hasNone) {
            //do not prevent defaults if this is a tap gesture

            var isTapPointer = input.pointers.length === 1;
            var isTapMovement = input.distance < 2;
            var isTapTouchTime = input.deltaTime < 250;

            if (isTapPointer && isTapMovement && isTapTouchTime) {
                return;
            }
        }

        if (hasPanX && hasPanY) {
            // `pan-x pan-y` means browser handles all scrolling/panning, do not prevent
            return;
        }

        if (hasNone ||
            (hasPanY && direction & DIRECTION_HORIZONTAL) ||
            (hasPanX && direction & DIRECTION_VERTICAL)) {
            return this.preventSrc(srcEvent);
        }
    },

    /**
     * call preventDefault to prevent the browser's default behavior (scrolling in most cases)
     * @param {Object} srcEvent
     */
    preventSrc: function(srcEvent) {
        this.manager.session.prevented = true;
        srcEvent.preventDefault();
    }
};

/**
 * when the touchActions are collected they are not a valid value, so we need to clean things up. *
 * @param {String} actions
 * @returns {*}
 */
function cleanTouchActions(actions) {
    // none
    if (inStr(actions, TOUCH_ACTION_NONE)) {
        return TOUCH_ACTION_NONE;
    }

    var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X);
    var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y);

    // if both pan-x and pan-y are set (different recognizers
    // for different directions, e.g. horizontal pan but vertical swipe?)
    // we need none (as otherwise with pan-x pan-y combined none of these
    // recognizers will work, since the browser would handle all panning
    if (hasPanX && hasPanY) {
        return TOUCH_ACTION_NONE;
    }

    // pan-x OR pan-y
    if (hasPanX || hasPanY) {
        return hasPanX ? TOUCH_ACTION_PAN_X : TOUCH_ACTION_PAN_Y;
    }

    // manipulation
    if (inStr(actions, TOUCH_ACTION_MANIPULATION)) {
        return TOUCH_ACTION_MANIPULATION;
    }

    return TOUCH_ACTION_AUTO;
}

function getTouchActionProps() {
    if (!NATIVE_TOUCH_ACTION) {
        return false;
    }
    var touchMap = {};
    var cssSupports = window.CSS && window.CSS.supports;
    ['auto', 'manipulation', 'pan-y', 'pan-x', 'pan-x pan-y', 'none'].forEach(function(val) {

        // If css.supports is not supported but there is native touch-action assume it supports
        // all values. This is the case for IE 10 and 11.
        touchMap[val] = cssSupports ? window.CSS.supports('touch-action', val) : true;
    });
    return touchMap;
}

/**
 * Recognizer flow explained; *
 * All recognizers have the initial state of POSSIBLE when a input session starts.
 * The definition of a input session is from the first input until the last input, with all it's movement in it. *
 * Example session for mouse-input: mousedown -> mousemove -> mouseup
 *
 * On each recognizing cycle (see Manager.recognize) the .recognize() method is executed
 * which determines with state it should be.
 *
 * If the recognizer has the state FAILED, CANCELLED or RECOGNIZED (equals ENDED), it is reset to
 * POSSIBLE to give it another change on the next cycle.
 *
 *               Possible
 *                  |
 *            +-----+---------------+
 *            |                     |
 *      +-----+-----+               |
 *      |           |               |
 *   Failed      Cancelled          |
 *                          +-------+------+
 *                          |              |
 *                      Recognized       Began
 *                                         |
 *                                      Changed
 *                                         |
 *                                  Ended/Recognized
 */
var STATE_POSSIBLE = 1;
var STATE_BEGAN = 2;
var STATE_CHANGED = 4;
var STATE_ENDED = 8;
var STATE_RECOGNIZED = STATE_ENDED;
var STATE_CANCELLED = 16;
var STATE_FAILED = 32;

/**
 * Recognizer
 * Every recognizer needs to extend from this class.
 * @constructor
 * @param {Object} options
 */
function Recognizer(options) {
    this.options = assign({}, this.defaults, options || {});

    this.id = uniqueId();

    this.manager = null;

    // default is enable true
    this.options.enable = ifUndefined(this.options.enable, true);

    this.state = STATE_POSSIBLE;

    this.simultaneous = {};
    this.requireFail = [];
}

Recognizer.prototype = {
    /**
     * @virtual
     * @type {Object}
     */
    defaults: {},

    /**
     * set options
     * @param {Object} options
     * @return {Recognizer}
     */
    set: function(options) {
        assign(this.options, options);

        // also update the touchAction, in case something changed about the directions/enabled state
        this.manager && this.manager.touchAction.update();
        return this;
    },

    /**
     * recognize simultaneous with an other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    recognizeWith: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'recognizeWith', this)) {
            return this;
        }

        var simultaneous = this.simultaneous;
        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        if (!simultaneous[otherRecognizer.id]) {
            simultaneous[otherRecognizer.id] = otherRecognizer;
            otherRecognizer.recognizeWith(this);
        }
        return this;
    },

    /**
     * drop the simultaneous link. it doesnt remove the link on the other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    dropRecognizeWith: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'dropRecognizeWith', this)) {
            return this;
        }

        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        delete this.simultaneous[otherRecognizer.id];
        return this;
    },

    /**
     * recognizer can only run when an other is failing
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    requireFailure: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'requireFailure', this)) {
            return this;
        }

        var requireFail = this.requireFail;
        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        if (inArray(requireFail, otherRecognizer) === -1) {
            requireFail.push(otherRecognizer);
            otherRecognizer.requireFailure(this);
        }
        return this;
    },

    /**
     * drop the requireFailure link. it does not remove the link on the other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    dropRequireFailure: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'dropRequireFailure', this)) {
            return this;
        }

        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        var index = inArray(this.requireFail, otherRecognizer);
        if (index > -1) {
            this.requireFail.splice(index, 1);
        }
        return this;
    },

    /**
     * has require failures boolean
     * @returns {boolean}
     */
    hasRequireFailures: function() {
        return this.requireFail.length > 0;
    },

    /**
     * if the recognizer can recognize simultaneous with an other recognizer
     * @param {Recognizer} otherRecognizer
     * @returns {Boolean}
     */
    canRecognizeWith: function(otherRecognizer) {
        return !!this.simultaneous[otherRecognizer.id];
    },

    /**
     * You should use `tryEmit` instead of `emit` directly to check
     * that all the needed recognizers has failed before emitting.
     * @param {Object} input
     */
    emit: function(input) {
        var self = this;
        var state = this.state;

        function emit(event) {
            self.manager.emit(event, input);
        }

        // 'panstart' and 'panmove'
        if (state < STATE_ENDED) {
            emit(self.options.event + stateStr(state));
        }

        emit(self.options.event); // simple 'eventName' events

        if (input.additionalEvent) { // additional event(panleft, panright, pinchin, pinchout...)
            emit(input.additionalEvent);
        }

        // panend and pancancel
        if (state >= STATE_ENDED) {
            emit(self.options.event + stateStr(state));
        }
    },

    /**
     * Check that all the require failure recognizers has failed,
     * if true, it emits a gesture event,
     * otherwise, setup the state to FAILED.
     * @param {Object} input
     */
    tryEmit: function(input) {
        if (this.canEmit()) {
            return this.emit(input);
        }
        // it's failing anyway
        this.state = STATE_FAILED;
    },

    /**
     * can we emit?
     * @returns {boolean}
     */
    canEmit: function() {
        var i = 0;
        while (i < this.requireFail.length) {
            if (!(this.requireFail[i].state & (STATE_FAILED | STATE_POSSIBLE))) {
                return false;
            }
            i++;
        }
        return true;
    },

    /**
     * update the recognizer
     * @param {Object} inputData
     */
    recognize: function(inputData) {
        // make a new copy of the inputData
        // so we can change the inputData without messing up the other recognizers
        var inputDataClone = assign({}, inputData);

        // is is enabled and allow recognizing?
        if (!boolOrFn(this.options.enable, [this, inputDataClone])) {
            this.reset();
            this.state = STATE_FAILED;
            return;
        }

        // reset when we've reached the end
        if (this.state & (STATE_RECOGNIZED | STATE_CANCELLED | STATE_FAILED)) {
            this.state = STATE_POSSIBLE;
        }

        this.state = this.process(inputDataClone);

        // the recognizer has recognized a gesture
        // so trigger an event
        if (this.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED | STATE_CANCELLED)) {
            this.tryEmit(inputDataClone);
        }
    },

    /**
     * return the state of the recognizer
     * the actual recognizing happens in this method
     * @virtual
     * @param {Object} inputData
     * @returns {Const} STATE
     */
    process: function(inputData) { }, // jshint ignore:line

    /**
     * return the preferred touch-action
     * @virtual
     * @returns {Array}
     */
    getTouchAction: function() { },

    /**
     * called when the gesture isn't allowed to recognize
     * like when another is being recognized or it is disabled
     * @virtual
     */
    reset: function() { }
};

/**
 * get a usable string, used as event postfix
 * @param {Const} state
 * @returns {String} state
 */
function stateStr(state) {
    if (state & STATE_CANCELLED) {
        return 'cancel';
    } else if (state & STATE_ENDED) {
        return 'end';
    } else if (state & STATE_CHANGED) {
        return 'move';
    } else if (state & STATE_BEGAN) {
        return 'start';
    }
    return '';
}

/**
 * direction cons to string
 * @param {Const} direction
 * @returns {String}
 */
function directionStr(direction) {
    if (direction == DIRECTION_DOWN) {
        return 'down';
    } else if (direction == DIRECTION_UP) {
        return 'up';
    } else if (direction == DIRECTION_LEFT) {
        return 'left';
    } else if (direction == DIRECTION_RIGHT) {
        return 'right';
    }
    return '';
}

/**
 * get a recognizer by name if it is bound to a manager
 * @param {Recognizer|String} otherRecognizer
 * @param {Recognizer} recognizer
 * @returns {Recognizer}
 */
function getRecognizerByNameIfManager(otherRecognizer, recognizer) {
    var manager = recognizer.manager;
    if (manager) {
        return manager.get(otherRecognizer);
    }
    return otherRecognizer;
}

/**
 * This recognizer is just used as a base for the simple attribute recognizers.
 * @constructor
 * @extends Recognizer
 */
function AttrRecognizer() {
    Recognizer.apply(this, arguments);
}

inherit(AttrRecognizer, Recognizer, {
    /**
     * @namespace
     * @memberof AttrRecognizer
     */
    defaults: {
        /**
         * @type {Number}
         * @default 1
         */
        pointers: 1
    },

    /**
     * Used to check if it the recognizer receives valid input, like input.distance > 10.
     * @memberof AttrRecognizer
     * @param {Object} input
     * @returns {Boolean} recognized
     */
    attrTest: function(input) {
        var optionPointers = this.options.pointers;
        return optionPointers === 0 || input.pointers.length === optionPointers;
    },

    /**
     * Process the input and return the state for the recognizer
     * @memberof AttrRecognizer
     * @param {Object} input
     * @returns {*} State
     */
    process: function(input) {
        var state = this.state;
        var eventType = input.eventType;

        var isRecognized = state & (STATE_BEGAN | STATE_CHANGED);
        var isValid = this.attrTest(input);

        // on cancel input and we've recognized before, return STATE_CANCELLED
        if (isRecognized && (eventType & INPUT_CANCEL || !isValid)) {
            return state | STATE_CANCELLED;
        } else if (isRecognized || isValid) {
            if (eventType & INPUT_END) {
                return state | STATE_ENDED;
            } else if (!(state & STATE_BEGAN)) {
                return STATE_BEGAN;
            }
            return state | STATE_CHANGED;
        }
        return STATE_FAILED;
    }
});

/**
 * Pan
 * Recognized when the pointer is down and moved in the allowed direction.
 * @constructor
 * @extends AttrRecognizer
 */
function PanRecognizer() {
    AttrRecognizer.apply(this, arguments);

    this.pX = null;
    this.pY = null;
}

inherit(PanRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof PanRecognizer
     */
    defaults: {
        event: 'pan',
        threshold: 10,
        pointers: 1,
        direction: DIRECTION_ALL
    },

    getTouchAction: function() {
        var direction = this.options.direction;
        var actions = [];
        if (direction & DIRECTION_HORIZONTAL) {
            actions.push(TOUCH_ACTION_PAN_Y);
        }
        if (direction & DIRECTION_VERTICAL) {
            actions.push(TOUCH_ACTION_PAN_X);
        }
        return actions;
    },

    directionTest: function(input) {
        var options = this.options;
        var hasMoved = true;
        var distance = input.distance;
        var direction = input.direction;
        var x = input.deltaX;
        var y = input.deltaY;

        // lock to axis?
        if (!(direction & options.direction)) {
            if (options.direction & DIRECTION_HORIZONTAL) {
                direction = (x === 0) ? DIRECTION_NONE : (x < 0) ? DIRECTION_LEFT : DIRECTION_RIGHT;
                hasMoved = x != this.pX;
                distance = Math.abs(input.deltaX);
            } else {
                direction = (y === 0) ? DIRECTION_NONE : (y < 0) ? DIRECTION_UP : DIRECTION_DOWN;
                hasMoved = y != this.pY;
                distance = Math.abs(input.deltaY);
            }
        }
        input.direction = direction;
        return hasMoved && distance > options.threshold && direction & options.direction;
    },

    attrTest: function(input) {
        return AttrRecognizer.prototype.attrTest.call(this, input) &&
            (this.state & STATE_BEGAN || (!(this.state & STATE_BEGAN) && this.directionTest(input)));
    },

    emit: function(input) {

        this.pX = input.deltaX;
        this.pY = input.deltaY;

        var direction = directionStr(input.direction);

        if (direction) {
            input.additionalEvent = this.options.event + direction;
        }
        this._super.emit.call(this, input);
    }
});

/**
 * Pinch
 * Recognized when two or more pointers are moving toward (zoom-in) or away from each other (zoom-out).
 * @constructor
 * @extends AttrRecognizer
 */
function PinchRecognizer() {
    AttrRecognizer.apply(this, arguments);
}

inherit(PinchRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof PinchRecognizer
     */
    defaults: {
        event: 'pinch',
        threshold: 0,
        pointers: 2
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_NONE];
    },

    attrTest: function(input) {
        return this._super.attrTest.call(this, input) &&
            (Math.abs(input.scale - 1) > this.options.threshold || this.state & STATE_BEGAN);
    },

    emit: function(input) {
        if (input.scale !== 1) {
            var inOut = input.scale < 1 ? 'in' : 'out';
            input.additionalEvent = this.options.event + inOut;
        }
        this._super.emit.call(this, input);
    }
});

/**
 * Press
 * Recognized when the pointer is down for x ms without any movement.
 * @constructor
 * @extends Recognizer
 */
function PressRecognizer() {
    Recognizer.apply(this, arguments);

    this._timer = null;
    this._input = null;
}

inherit(PressRecognizer, Recognizer, {
    /**
     * @namespace
     * @memberof PressRecognizer
     */
    defaults: {
        event: 'press',
        pointers: 1,
        time: 251, // minimal time of the pointer to be pressed
        threshold: 9 // a minimal movement is ok, but keep it low
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_AUTO];
    },

    process: function(input) {
        var options = this.options;
        var validPointers = input.pointers.length === options.pointers;
        var validMovement = input.distance < options.threshold;
        var validTime = input.deltaTime > options.time;

        this._input = input;

        // we only allow little movement
        // and we've reached an end event, so a tap is possible
        if (!validMovement || !validPointers || (input.eventType & (INPUT_END | INPUT_CANCEL) && !validTime)) {
            this.reset();
        } else if (input.eventType & INPUT_START) {
            this.reset();
            this._timer = setTimeoutContext(function() {
                this.state = STATE_RECOGNIZED;
                this.tryEmit();
            }, options.time, this);
        } else if (input.eventType & INPUT_END) {
            return STATE_RECOGNIZED;
        }
        return STATE_FAILED;
    },

    reset: function() {
        clearTimeout(this._timer);
    },

    emit: function(input) {
        if (this.state !== STATE_RECOGNIZED) {
            return;
        }

        if (input && (input.eventType & INPUT_END)) {
            this.manager.emit(this.options.event + 'up', input);
        } else {
            this._input.timeStamp = now();
            this.manager.emit(this.options.event, this._input);
        }
    }
});

/**
 * Rotate
 * Recognized when two or more pointer are moving in a circular motion.
 * @constructor
 * @extends AttrRecognizer
 */
function RotateRecognizer() {
    AttrRecognizer.apply(this, arguments);
}

inherit(RotateRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof RotateRecognizer
     */
    defaults: {
        event: 'rotate',
        threshold: 0,
        pointers: 2
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_NONE];
    },

    attrTest: function(input) {
        return this._super.attrTest.call(this, input) &&
            (Math.abs(input.rotation) > this.options.threshold || this.state & STATE_BEGAN);
    }
});

/**
 * Swipe
 * Recognized when the pointer is moving fast (velocity), with enough distance in the allowed direction.
 * @constructor
 * @extends AttrRecognizer
 */
function SwipeRecognizer() {
    AttrRecognizer.apply(this, arguments);
}

inherit(SwipeRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof SwipeRecognizer
     */
    defaults: {
        event: 'swipe',
        threshold: 10,
        velocity: 0.3,
        direction: DIRECTION_HORIZONTAL | DIRECTION_VERTICAL,
        pointers: 1
    },

    getTouchAction: function() {
        return PanRecognizer.prototype.getTouchAction.call(this);
    },

    attrTest: function(input) {
        var direction = this.options.direction;
        var velocity;

        if (direction & (DIRECTION_HORIZONTAL | DIRECTION_VERTICAL)) {
            velocity = input.overallVelocity;
        } else if (direction & DIRECTION_HORIZONTAL) {
            velocity = input.overallVelocityX;
        } else if (direction & DIRECTION_VERTICAL) {
            velocity = input.overallVelocityY;
        }

        return this._super.attrTest.call(this, input) &&
            direction & input.offsetDirection &&
            input.distance > this.options.threshold &&
            input.maxPointers == this.options.pointers &&
            abs(velocity) > this.options.velocity && input.eventType & INPUT_END;
    },

    emit: function(input) {
        var direction = directionStr(input.offsetDirection);
        if (direction) {
            this.manager.emit(this.options.event + direction, input);
        }

        this.manager.emit(this.options.event, input);
    }
});

/**
 * A tap is ecognized when the pointer is doing a small tap/click. Multiple taps are recognized if they occur
 * between the given interval and position. The delay option can be used to recognize multi-taps without firing
 * a single tap.
 *
 * The eventData from the emitted event contains the property `tapCount`, which contains the amount of
 * multi-taps being recognized.
 * @constructor
 * @extends Recognizer
 */
function TapRecognizer() {
    Recognizer.apply(this, arguments);

    // previous time and center,
    // used for tap counting
    this.pTime = false;
    this.pCenter = false;

    this._timer = null;
    this._input = null;
    this.count = 0;
}

inherit(TapRecognizer, Recognizer, {
    /**
     * @namespace
     * @memberof PinchRecognizer
     */
    defaults: {
        event: 'tap',
        pointers: 1,
        taps: 1,
        interval: 300, // max time between the multi-tap taps
        time: 250, // max time of the pointer to be down (like finger on the screen)
        threshold: 9, // a minimal movement is ok, but keep it low
        posThreshold: 10 // a multi-tap can be a bit off the initial position
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_MANIPULATION];
    },

    process: function(input) {
        var options = this.options;

        var validPointers = input.pointers.length === options.pointers;
        var validMovement = input.distance < options.threshold;
        var validTouchTime = input.deltaTime < options.time;

        this.reset();

        if ((input.eventType & INPUT_START) && (this.count === 0)) {
            return this.failTimeout();
        }

        // we only allow little movement
        // and we've reached an end event, so a tap is possible
        if (validMovement && validTouchTime && validPointers) {
            if (input.eventType != INPUT_END) {
                return this.failTimeout();
            }

            var validInterval = this.pTime ? (input.timeStamp - this.pTime < options.interval) : true;
            var validMultiTap = !this.pCenter || getDistance(this.pCenter, input.center) < options.posThreshold;

            this.pTime = input.timeStamp;
            this.pCenter = input.center;

            if (!validMultiTap || !validInterval) {
                this.count = 1;
            } else {
                this.count += 1;
            }

            this._input = input;

            // if tap count matches we have recognized it,
            // else it has began recognizing...
            var tapCount = this.count % options.taps;
            if (tapCount === 0) {
                // no failing requirements, immediately trigger the tap event
                // or wait as long as the multitap interval to trigger
                if (!this.hasRequireFailures()) {
                    return STATE_RECOGNIZED;
                } else {
                    this._timer = setTimeoutContext(function() {
                        this.state = STATE_RECOGNIZED;
                        this.tryEmit();
                    }, options.interval, this);
                    return STATE_BEGAN;
                }
            }
        }
        return STATE_FAILED;
    },

    failTimeout: function() {
        this._timer = setTimeoutContext(function() {
            this.state = STATE_FAILED;
        }, this.options.interval, this);
        return STATE_FAILED;
    },

    reset: function() {
        clearTimeout(this._timer);
    },

    emit: function() {
        if (this.state == STATE_RECOGNIZED) {
            this._input.tapCount = this.count;
            this.manager.emit(this.options.event, this._input);
        }
    }
});

/**
 * Simple way to create a manager with a default set of recognizers.
 * @param {HTMLElement} element
 * @param {Object} [options]
 * @constructor
 */
function Hammer(element, options) {
    options = options || {};
    options.recognizers = ifUndefined(options.recognizers, Hammer.defaults.preset);
    return new Manager(element, options);
}

/**
 * @const {string}
 */
Hammer.VERSION = '2.0.7';

/**
 * default settings
 * @namespace
 */
Hammer.defaults = {
    /**
     * set if DOM events are being triggered.
     * But this is slower and unused by simple implementations, so disabled by default.
     * @type {Boolean}
     * @default false
     */
    domEvents: false,

    /**
     * The value for the touchAction property/fallback.
     * When set to `compute` it will magically set the correct value based on the added recognizers.
     * @type {String}
     * @default compute
     */
    touchAction: TOUCH_ACTION_COMPUTE,

    /**
     * @type {Boolean}
     * @default true
     */
    enable: true,

    /**
     * EXPERIMENTAL FEATURE -- can be removed/changed
     * Change the parent input target element.
     * If Null, then it is being set the to main element.
     * @type {Null|EventTarget}
     * @default null
     */
    inputTarget: null,

    /**
     * force an input class
     * @type {Null|Function}
     * @default null
     */
    inputClass: null,

    /**
     * Default recognizer setup when calling `Hammer()`
     * When creating a new Manager these will be skipped.
     * @type {Array}
     */
    preset: [
        // RecognizerClass, options, [recognizeWith, ...], [requireFailure, ...]
        [RotateRecognizer, {enable: false}],
        [PinchRecognizer, {enable: false}, ['rotate']],
        [SwipeRecognizer, {direction: DIRECTION_HORIZONTAL}],
        [PanRecognizer, {direction: DIRECTION_HORIZONTAL}, ['swipe']],
        [TapRecognizer],
        [TapRecognizer, {event: 'doubletap', taps: 2}, ['tap']],
        [PressRecognizer]
    ],

    /**
     * Some CSS properties can be used to improve the working of Hammer.
     * Add them to this method and they will be set when creating a new Manager.
     * @namespace
     */
    cssProps: {
        /**
         * Disables text selection to improve the dragging gesture. Mainly for desktop browsers.
         * @type {String}
         * @default 'none'
         */
        userSelect: 'none',

        /**
         * Disable the Windows Phone grippers when pressing an element.
         * @type {String}
         * @default 'none'
         */
        touchSelect: 'none',

        /**
         * Disables the default callout shown when you touch and hold a touch target.
         * On iOS, when you touch and hold a touch target such as a link, Safari displays
         * a callout containing information about the link. This property allows you to disable that callout.
         * @type {String}
         * @default 'none'
         */
        touchCallout: 'none',

        /**
         * Specifies whether zooming is enabled. Used by IE10>
         * @type {String}
         * @default 'none'
         */
        contentZooming: 'none',

        /**
         * Specifies that an entire element should be draggable instead of its contents. Mainly for desktop browsers.
         * @type {String}
         * @default 'none'
         */
        userDrag: 'none',

        /**
         * Overrides the highlight color shown when the user taps a link or a JavaScript
         * clickable element in iOS. This property obeys the alpha value, if specified.
         * @type {String}
         * @default 'rgba(0,0,0,0)'
         */
        tapHighlightColor: 'rgba(0,0,0,0)'
    }
};

var STOP = 1;
var FORCED_STOP = 2;

/**
 * Manager
 * @param {HTMLElement} element
 * @param {Object} [options]
 * @constructor
 */
function Manager(element, options) {
    this.options = assign({}, Hammer.defaults, options || {});

    this.options.inputTarget = this.options.inputTarget || element;

    this.handlers = {};
    this.session = {};
    this.recognizers = [];
    this.oldCssProps = {};

    this.element = element;
    this.input = createInputInstance(this);
    this.touchAction = new TouchAction(this, this.options.touchAction);

    toggleCssProps(this, true);

    each(this.options.recognizers, function(item) {
        var recognizer = this.add(new (item[0])(item[1]));
        item[2] && recognizer.recognizeWith(item[2]);
        item[3] && recognizer.requireFailure(item[3]);
    }, this);
}

Manager.prototype = {
    /**
     * set options
     * @param {Object} options
     * @returns {Manager}
     */
    set: function(options) {
        assign(this.options, options);

        // Options that need a little more setup
        if (options.touchAction) {
            this.touchAction.update();
        }
        if (options.inputTarget) {
            // Clean up existing event listeners and reinitialize
            this.input.destroy();
            this.input.target = options.inputTarget;
            this.input.init();
        }
        return this;
    },

    /**
     * stop recognizing for this session.
     * This session will be discarded, when a new [input]start event is fired.
     * When forced, the recognizer cycle is stopped immediately.
     * @param {Boolean} [force]
     */
    stop: function(force) {
        this.session.stopped = force ? FORCED_STOP : STOP;
    },

    /**
     * run the recognizers!
     * called by the inputHandler function on every movement of the pointers (touches)
     * it walks through all the recognizers and tries to detect the gesture that is being made
     * @param {Object} inputData
     */
    recognize: function(inputData) {
        var session = this.session;
        if (session.stopped) {
            return;
        }

        // run the touch-action polyfill
        this.touchAction.preventDefaults(inputData);

        var recognizer;
        var recognizers = this.recognizers;

        // this holds the recognizer that is being recognized.
        // so the recognizer's state needs to be BEGAN, CHANGED, ENDED or RECOGNIZED
        // if no recognizer is detecting a thing, it is set to `null`
        var curRecognizer = session.curRecognizer;

        // reset when the last recognizer is recognized
        // or when we're in a new session
        if (!curRecognizer || (curRecognizer && curRecognizer.state & STATE_RECOGNIZED)) {
            curRecognizer = session.curRecognizer = null;
        }

        var i = 0;
        while (i < recognizers.length) {
            recognizer = recognizers[i];

            // find out if we are allowed try to recognize the input for this one.
            // 1.   allow if the session is NOT forced stopped (see the .stop() method)
            // 2.   allow if we still haven't recognized a gesture in this session, or the this recognizer is the one
            //      that is being recognized.
            // 3.   allow if the recognizer is allowed to run simultaneous with the current recognized recognizer.
            //      this can be setup with the `recognizeWith()` method on the recognizer.
            if (session.stopped !== FORCED_STOP && ( // 1
                    !curRecognizer || recognizer == curRecognizer || // 2
                    recognizer.canRecognizeWith(curRecognizer))) { // 3
                recognizer.recognize(inputData);
            } else {
                recognizer.reset();
            }

            // if the recognizer has been recognizing the input as a valid gesture, we want to store this one as the
            // current active recognizer. but only if we don't already have an active recognizer
            if (!curRecognizer && recognizer.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED)) {
                curRecognizer = session.curRecognizer = recognizer;
            }
            i++;
        }
    },

    /**
     * get a recognizer by its event name.
     * @param {Recognizer|String} recognizer
     * @returns {Recognizer|Null}
     */
    get: function(recognizer) {
        if (recognizer instanceof Recognizer) {
            return recognizer;
        }

        var recognizers = this.recognizers;
        for (var i = 0; i < recognizers.length; i++) {
            if (recognizers[i].options.event == recognizer) {
                return recognizers[i];
            }
        }
        return null;
    },

    /**
     * add a recognizer to the manager
     * existing recognizers with the same event name will be removed
     * @param {Recognizer} recognizer
     * @returns {Recognizer|Manager}
     */
    add: function(recognizer) {
        if (invokeArrayArg(recognizer, 'add', this)) {
            return this;
        }

        // remove existing
        var existing = this.get(recognizer.options.event);
        if (existing) {
            this.remove(existing);
        }

        this.recognizers.push(recognizer);
        recognizer.manager = this;

        this.touchAction.update();
        return recognizer;
    },

    /**
     * remove a recognizer by name or instance
     * @param {Recognizer|String} recognizer
     * @returns {Manager}
     */
    remove: function(recognizer) {
        if (invokeArrayArg(recognizer, 'remove', this)) {
            return this;
        }

        recognizer = this.get(recognizer);

        // let's make sure this recognizer exists
        if (recognizer) {
            var recognizers = this.recognizers;
            var index = inArray(recognizers, recognizer);

            if (index !== -1) {
                recognizers.splice(index, 1);
                this.touchAction.update();
            }
        }

        return this;
    },

    /**
     * bind event
     * @param {String} events
     * @param {Function} handler
     * @returns {EventEmitter} this
     */
    on: function(events, handler) {
        if (events === undefined$1) {
            return;
        }
        if (handler === undefined$1) {
            return;
        }

        var handlers = this.handlers;
        each(splitStr(events), function(event) {
            handlers[event] = handlers[event] || [];
            handlers[event].push(handler);
        });
        return this;
    },

    /**
     * unbind event, leave emit blank to remove all handlers
     * @param {String} events
     * @param {Function} [handler]
     * @returns {EventEmitter} this
     */
    off: function(events, handler) {
        if (events === undefined$1) {
            return;
        }

        var handlers = this.handlers;
        each(splitStr(events), function(event) {
            if (!handler) {
                delete handlers[event];
            } else {
                handlers[event] && handlers[event].splice(inArray(handlers[event], handler), 1);
            }
        });
        return this;
    },

    /**
     * emit event to the listeners
     * @param {String} event
     * @param {Object} data
     */
    emit: function(event, data) {
        // we also want to trigger dom events
        if (this.options.domEvents) {
            triggerDomEvent(event, data);
        }

        // no handlers, so skip it all
        var handlers = this.handlers[event] && this.handlers[event].slice();
        if (!handlers || !handlers.length) {
            return;
        }

        data.type = event;
        data.preventDefault = function() {
            data.srcEvent.preventDefault();
        };

        var i = 0;
        while (i < handlers.length) {
            handlers[i](data);
            i++;
        }
    },

    /**
     * destroy the manager and unbinds all events
     * it doesn't unbind dom events, that is the user own responsibility
     */
    destroy: function() {
        this.element && toggleCssProps(this, false);

        this.handlers = {};
        this.session = {};
        this.input.destroy();
        this.element = null;
    }
};

/**
 * add/remove the css properties as defined in manager.options.cssProps
 * @param {Manager} manager
 * @param {Boolean} add
 */
function toggleCssProps(manager, add) {
    var element = manager.element;
    if (!element.style) {
        return;
    }
    var prop;
    each(manager.options.cssProps, function(value, name) {
        prop = prefixed(element.style, name);
        if (add) {
            manager.oldCssProps[prop] = element.style[prop];
            element.style[prop] = value;
        } else {
            element.style[prop] = manager.oldCssProps[prop] || '';
        }
    });
    if (!add) {
        manager.oldCssProps = {};
    }
}

/**
 * trigger dom event
 * @param {String} event
 * @param {Object} data
 */
function triggerDomEvent(event, data) {
    var gestureEvent = document.createEvent('Event');
    gestureEvent.initEvent(event, true, true);
    gestureEvent.gesture = data;
    data.target.dispatchEvent(gestureEvent);
}

assign(Hammer, {
    INPUT_START: INPUT_START,
    INPUT_MOVE: INPUT_MOVE,
    INPUT_END: INPUT_END,
    INPUT_CANCEL: INPUT_CANCEL,

    STATE_POSSIBLE: STATE_POSSIBLE,
    STATE_BEGAN: STATE_BEGAN,
    STATE_CHANGED: STATE_CHANGED,
    STATE_ENDED: STATE_ENDED,
    STATE_RECOGNIZED: STATE_RECOGNIZED,
    STATE_CANCELLED: STATE_CANCELLED,
    STATE_FAILED: STATE_FAILED,

    DIRECTION_NONE: DIRECTION_NONE,
    DIRECTION_LEFT: DIRECTION_LEFT,
    DIRECTION_RIGHT: DIRECTION_RIGHT,
    DIRECTION_UP: DIRECTION_UP,
    DIRECTION_DOWN: DIRECTION_DOWN,
    DIRECTION_HORIZONTAL: DIRECTION_HORIZONTAL,
    DIRECTION_VERTICAL: DIRECTION_VERTICAL,
    DIRECTION_ALL: DIRECTION_ALL,

    Manager: Manager,
    Input: Input,
    TouchAction: TouchAction,

    TouchInput: TouchInput,
    MouseInput: MouseInput,
    PointerEventInput: PointerEventInput,
    TouchMouseInput: TouchMouseInput,
    SingleTouchInput: SingleTouchInput,

    Recognizer: Recognizer,
    AttrRecognizer: AttrRecognizer,
    Tap: TapRecognizer,
    Pan: PanRecognizer,
    Swipe: SwipeRecognizer,
    Pinch: PinchRecognizer,
    Rotate: RotateRecognizer,
    Press: PressRecognizer,

    on: addEventListeners,
    off: removeEventListeners,
    each: each,
    merge: merge,
    extend: extend,
    assign: assign,
    inherit: inherit,
    bindFn: bindFn,
    prefixed: prefixed
});

// this prevents errors when Hammer is loaded in the presence of an AMD
//  style loader but by script tag, not by the loader.
var freeGlobal = (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {})); // jshint ignore:line
freeGlobal.Hammer = Hammer;

if (typeof undefined$1 === 'function' && undefined$1.amd) {
    undefined$1(function() {
        return Hammer;
    });
} else if (module.exports) {
    module.exports = Hammer;
} else {
    window[exportName] = Hammer;
}

})(window, document, 'Hammer');
});

var hammerjs = hammer;

const INPUT_START = 1;
const INPUT_MOVE = 2;
const INPUT_END = 4;
const MOUSE_INPUT_MAP = {
  mousedown: INPUT_START,
  mousemove: INPUT_MOVE,
  mouseup: INPUT_END
};

function some(array, predict) {
  for (let i = 0; i < array.length; i++) {
    if (predict(array[i])) {
      return true;
    }
  }

  return false;
}

function enhancePointerEventInput(PointerEventInput) {
  const oldHandler = PointerEventInput.prototype.handler;

  PointerEventInput.prototype.handler = function handler(ev) {
    const store = this.store;

    if (ev.button > 0 && ev.type === 'pointerdown') {
      if (!some(store, e => e.pointerId === ev.pointerId)) {
        store.push(ev);
      }
    }

    oldHandler.call(this, ev);
  };
}
function enhanceMouseInput(MouseInput) {
  MouseInput.prototype.handler = function handler(ev) {
    let eventType = MOUSE_INPUT_MAP[ev.type];

    if (eventType & INPUT_START && ev.button >= 0) {
      this.pressed = true;
    }

    if (eventType & INPUT_MOVE && ev.which === 0) {
      eventType = INPUT_END;
    }

    if (!this.pressed) {
      return;
    }

    if (eventType & INPUT_END) {
      this.pressed = false;
    }

    this.callback(this.manager, eventType, {
      pointers: [ev],
      changedPointers: [ev],
      pointerType: 'mouse',
      srcEvent: ev
    });
  };
}

enhancePointerEventInput(hammerjs.PointerEventInput);
enhanceMouseInput(hammerjs.MouseInput);
const Manager = hammerjs.Manager;

const RECOGNIZERS = hammerjs ? [[hammerjs.Pan, {
  event: 'tripan',
  pointers: 3,
  threshold: 0,
  enable: false
}], [hammerjs.Rotate, {
  enable: false
}], [hammerjs.Pinch, {
  enable: false
}], [hammerjs.Swipe, {
  enable: false
}], [hammerjs.Pan, {
  threshold: 0,
  enable: false
}], [hammerjs.Press, {
  enable: false
}], [hammerjs.Tap, {
  event: 'doubletap',
  taps: 2,
  enable: false
}], [hammerjs.Tap, {
  event: 'anytap',
  enable: false
}], [hammerjs.Tap, {
  enable: false
}]] : null;
const RECOGNIZER_COMPATIBLE_MAP = {
  tripan: ['rotate', 'pinch', 'pan'],
  rotate: ['pinch'],
  pinch: ['pan'],
  pan: ['press', 'doubletap', 'anytap', 'tap'],
  doubletap: ['anytap'],
  anytap: ['tap']
};
const RECOGNIZER_FALLBACK_MAP = {
  doubletap: ['tap']
};
const BASIC_EVENT_ALIASES = {
  pointerdown: 'pointerdown',
  pointermove: 'pointermove',
  pointerup: 'pointerup',
  touchstart: 'pointerdown',
  touchmove: 'pointermove',
  touchend: 'pointerup',
  mousedown: 'pointerdown',
  mousemove: 'pointermove',
  mouseup: 'pointerup'
};
const INPUT_EVENT_TYPES = {
  KEY_EVENTS: ['keydown', 'keyup'],
  MOUSE_EVENTS: ['mousedown', 'mousemove', 'mouseup', 'mouseover', 'mouseout', 'mouseleave'],
  WHEEL_EVENTS: ['wheel', 'mousewheel']
};
const EVENT_RECOGNIZER_MAP = {
  tap: 'tap',
  anytap: 'anytap',
  doubletap: 'doubletap',
  press: 'press',
  pinch: 'pinch',
  pinchin: 'pinch',
  pinchout: 'pinch',
  pinchstart: 'pinch',
  pinchmove: 'pinch',
  pinchend: 'pinch',
  pinchcancel: 'pinch',
  rotate: 'rotate',
  rotatestart: 'rotate',
  rotatemove: 'rotate',
  rotateend: 'rotate',
  rotatecancel: 'rotate',
  tripan: 'tripan',
  tripanstart: 'tripan',
  tripanmove: 'tripan',
  tripanup: 'tripan',
  tripandown: 'tripan',
  tripanleft: 'tripan',
  tripanright: 'tripan',
  tripanend: 'tripan',
  tripancancel: 'tripan',
  pan: 'pan',
  panstart: 'pan',
  panmove: 'pan',
  panup: 'pan',
  pandown: 'pan',
  panleft: 'pan',
  panright: 'pan',
  panend: 'pan',
  pancancel: 'pan',
  swipe: 'swipe',
  swipeleft: 'swipe',
  swiperight: 'swipe',
  swipeup: 'swipe',
  swipedown: 'swipe'
};
const GESTURE_EVENT_ALIASES = {
  click: 'tap',
  anyclick: 'anytap',
  dblclick: 'doubletap',
  mousedown: 'pointerdown',
  mousemove: 'pointermove',
  mouseup: 'pointerup',
  mouseover: 'pointerover',
  mouseout: 'pointerout',
  mouseleave: 'pointerleave'
};

const userAgent = typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent.toLowerCase() : '';
const window_ = typeof window !== 'undefined' ? window : global;
let passiveSupported = false;

try {
  const options = {
    get passive() {
      passiveSupported = true;
      return true;
    }

  };
  window_.addEventListener('test', options, options);
  window_.removeEventListener('test', options, options);
} catch (err) {}

const firefox = userAgent.indexOf('firefox') !== -1;
const {
  WHEEL_EVENTS
} = INPUT_EVENT_TYPES;
const EVENT_TYPE$1 = 'wheel';
const WHEEL_DELTA_MAGIC_SCALER = 4.000244140625;
const WHEEL_DELTA_PER_LINE = 40;
const SHIFT_MULTIPLIER = 0.25;
class WheelInput {
  constructor(element, callback, options = {}) {
    this.element = element;
    this.callback = callback;
    this.options = Object.assign({
      enable: true
    }, options);
    this.events = WHEEL_EVENTS.concat(options.events || []);
    this.handleEvent = this.handleEvent.bind(this);
    this.events.forEach(event => element.addEventListener(event, this.handleEvent, passiveSupported ? {
      passive: false
    } : false));
  }

  destroy() {
    this.events.forEach(event => this.element.removeEventListener(event, this.handleEvent));
  }

  enableEventType(eventType, enabled) {
    if (eventType === EVENT_TYPE$1) {
      this.options.enable = enabled;
    }
  }

  handleEvent(event) {
    if (!this.options.enable) {
      return;
    }

    let value = event.deltaY;

    if (window_.WheelEvent) {
      if (firefox && event.deltaMode === window_.WheelEvent.DOM_DELTA_PIXEL) {
        value /= window_.devicePixelRatio;
      }

      if (event.deltaMode === window_.WheelEvent.DOM_DELTA_LINE) {
        value *= WHEEL_DELTA_PER_LINE;
      }
    }

    const wheelPosition = {
      x: event.clientX,
      y: event.clientY
    };

    if (value !== 0 && value % WHEEL_DELTA_MAGIC_SCALER === 0) {
      value = Math.floor(value / WHEEL_DELTA_MAGIC_SCALER);
    }

    if (event.shiftKey && value) {
      value = value * SHIFT_MULTIPLIER;
    }

    this._onWheel(event, -value, wheelPosition);
  }

  _onWheel(srcEvent, delta, position) {
    this.callback({
      type: EVENT_TYPE$1,
      center: position,
      delta,
      srcEvent,
      pointerType: 'mouse',
      target: srcEvent.target
    });
  }

}

const {
  MOUSE_EVENTS: MOUSE_EVENTS$1
} = INPUT_EVENT_TYPES;
const MOVE_EVENT_TYPE = 'pointermove';
const OVER_EVENT_TYPE = 'pointerover';
const OUT_EVENT_TYPE = 'pointerout';
const LEAVE_EVENT_TYPE = 'pointerleave';
class MoveInput {
  constructor(element, callback, options = {}) {
    this.element = element;
    this.callback = callback;
    this.pressed = false;
    this.options = Object.assign({
      enable: true
    }, options);
    this.enableMoveEvent = this.options.enable;
    this.enableLeaveEvent = this.options.enable;
    this.enableOutEvent = this.options.enable;
    this.enableOverEvent = this.options.enable;
    this.events = MOUSE_EVENTS$1.concat(options.events || []);
    this.handleEvent = this.handleEvent.bind(this);
    this.events.forEach(event => element.addEventListener(event, this.handleEvent));
  }

  destroy() {
    this.events.forEach(event => this.element.removeEventListener(event, this.handleEvent));
  }

  enableEventType(eventType, enabled) {
    if (eventType === MOVE_EVENT_TYPE) {
      this.enableMoveEvent = enabled;
    }

    if (eventType === OVER_EVENT_TYPE) {
      this.enableOverEvent = enabled;
    }

    if (eventType === OUT_EVENT_TYPE) {
      this.enableOutEvent = enabled;
    }

    if (eventType === LEAVE_EVENT_TYPE) {
      this.enableLeaveEvent = enabled;
    }
  }

  handleEvent(event) {
    this.handleOverEvent(event);
    this.handleOutEvent(event);
    this.handleLeaveEvent(event);
    this.handleMoveEvent(event);
  }

  handleOverEvent(event) {
    if (this.enableOverEvent) {
      if (event.type === 'mouseover') {
        this.callback({
          type: OVER_EVENT_TYPE,
          srcEvent: event,
          pointerType: 'mouse',
          target: event.target
        });
      }
    }
  }

  handleOutEvent(event) {
    if (this.enableOutEvent) {
      if (event.type === 'mouseout') {
        this.callback({
          type: OUT_EVENT_TYPE,
          srcEvent: event,
          pointerType: 'mouse',
          target: event.target
        });
      }
    }
  }

  handleLeaveEvent(event) {
    if (this.enableLeaveEvent) {
      if (event.type === 'mouseleave') {
        this.callback({
          type: LEAVE_EVENT_TYPE,
          srcEvent: event,
          pointerType: 'mouse',
          target: event.target
        });
      }
    }
  }

  handleMoveEvent(event) {
    if (this.enableMoveEvent) {
      switch (event.type) {
        case 'mousedown':
          if (event.button >= 0) {
            this.pressed = true;
          }

          break;

        case 'mousemove':
          if (event.which === 0) {
            this.pressed = false;
          }

          if (!this.pressed) {
            this.callback({
              type: MOVE_EVENT_TYPE,
              srcEvent: event,
              pointerType: 'mouse',
              target: event.target
            });
          }

          break;

        case 'mouseup':
          this.pressed = false;
          break;
      }
    }
  }

}

const {
  KEY_EVENTS
} = INPUT_EVENT_TYPES;
const DOWN_EVENT_TYPE = 'keydown';
const UP_EVENT_TYPE = 'keyup';
class KeyInput {
  constructor(element, callback, options = {}) {
    this.element = element;
    this.callback = callback;
    this.options = Object.assign({
      enable: true
    }, options);
    this.enableDownEvent = this.options.enable;
    this.enableUpEvent = this.options.enable;
    this.events = KEY_EVENTS.concat(options.events || []);
    this.handleEvent = this.handleEvent.bind(this);
    element.tabIndex = options.tabIndex || 0;
    element.style.outline = 'none';
    this.events.forEach(event => element.addEventListener(event, this.handleEvent));
  }

  destroy() {
    this.events.forEach(event => this.element.removeEventListener(event, this.handleEvent));
  }

  enableEventType(eventType, enabled) {
    if (eventType === DOWN_EVENT_TYPE) {
      this.enableDownEvent = enabled;
    }

    if (eventType === UP_EVENT_TYPE) {
      this.enableUpEvent = enabled;
    }
  }

  handleEvent(event) {
    const targetElement = event.target || event.srcElement;

    if (targetElement.tagName === 'INPUT' && targetElement.type === 'text' || targetElement.tagName === 'TEXTAREA') {
      return;
    }

    if (this.enableDownEvent && event.type === 'keydown') {
      this.callback({
        type: DOWN_EVENT_TYPE,
        srcEvent: event,
        key: event.key,
        target: event.target
      });
    }

    if (this.enableUpEvent && event.type === 'keyup') {
      this.callback({
        type: UP_EVENT_TYPE,
        srcEvent: event,
        key: event.key,
        target: event.target
      });
    }
  }

}

const EVENT_TYPE = 'contextmenu';
class ContextmenuInput {
  constructor(element, callback, options = {}) {
    this.element = element;
    this.callback = callback;
    this.options = Object.assign({
      enable: true
    }, options);
    this.handleEvent = this.handleEvent.bind(this);
    element.addEventListener('contextmenu', this.handleEvent);
  }

  destroy() {
    this.element.removeEventListener('contextmenu', this.handleEvent);
  }

  enableEventType(eventType, enabled) {
    if (eventType === EVENT_TYPE) {
      this.options.enable = enabled;
    }
  }

  handleEvent(event) {
    if (!this.options.enable) {
      return;
    }

    this.callback({
      type: EVENT_TYPE,
      center: {
        x: event.clientX,
        y: event.clientY
      },
      srcEvent: event,
      pointerType: 'mouse',
      target: event.target
    });
  }

}

const DOWN_EVENT = 1;
const MOVE_EVENT = 2;
const UP_EVENT = 4;
const MOUSE_EVENTS = {
  pointerdown: DOWN_EVENT,
  pointermove: MOVE_EVENT,
  pointerup: UP_EVENT,
  mousedown: DOWN_EVENT,
  mousemove: MOVE_EVENT,
  mouseup: UP_EVENT
};
const MOUSE_EVENT_WHICH_LEFT = 1;
const MOUSE_EVENT_WHICH_MIDDLE = 2;
const MOUSE_EVENT_WHICH_RIGHT = 3;
const MOUSE_EVENT_BUTTON_LEFT = 0;
const MOUSE_EVENT_BUTTON_MIDDLE = 1;
const MOUSE_EVENT_BUTTON_RIGHT = 2;
const MOUSE_EVENT_BUTTONS_LEFT_MASK = 1;
const MOUSE_EVENT_BUTTONS_RIGHT_MASK = 2;
const MOUSE_EVENT_BUTTONS_MIDDLE_MASK = 4;
function whichButtons(event) {
  const eventType = MOUSE_EVENTS[event.srcEvent.type];

  if (!eventType) {
    return null;
  }

  const {
    buttons,
    button,
    which
  } = event.srcEvent;
  let leftButton = false;
  let middleButton = false;
  let rightButton = false;

  if (eventType === UP_EVENT || eventType === MOVE_EVENT && !Number.isFinite(buttons)) {
    leftButton = which === MOUSE_EVENT_WHICH_LEFT;
    middleButton = which === MOUSE_EVENT_WHICH_MIDDLE;
    rightButton = which === MOUSE_EVENT_WHICH_RIGHT;
  } else if (eventType === MOVE_EVENT) {
    leftButton = Boolean(buttons & MOUSE_EVENT_BUTTONS_LEFT_MASK);
    middleButton = Boolean(buttons & MOUSE_EVENT_BUTTONS_MIDDLE_MASK);
    rightButton = Boolean(buttons & MOUSE_EVENT_BUTTONS_RIGHT_MASK);
  } else if (eventType === DOWN_EVENT) {
    leftButton = button === MOUSE_EVENT_BUTTON_LEFT;
    middleButton = button === MOUSE_EVENT_BUTTON_MIDDLE;
    rightButton = button === MOUSE_EVENT_BUTTON_RIGHT;
  }

  return {
    leftButton,
    middleButton,
    rightButton
  };
}
function getOffsetPosition(event, rootElement) {
  const {
    srcEvent
  } = event;

  if (!event.center && !Number.isFinite(srcEvent.clientX)) {
    return null;
  }

  const center = event.center || {
    x: srcEvent.clientX,
    y: srcEvent.clientY
  };
  const rect = rootElement.getBoundingClientRect();
  const scaleX = rect.width / rootElement.offsetWidth || 1;
  const scaleY = rect.height / rootElement.offsetHeight || 1;
  const offsetCenter = {
    x: (center.x - rect.left - rootElement.clientLeft) / scaleX,
    y: (center.y - rect.top - rootElement.clientTop) / scaleY
  };
  return {
    center,
    offsetCenter
  };
}

const DEFAULT_OPTIONS$1 = {
  srcElement: 'root',
  priority: 0
};
class EventRegistrar {
  constructor(eventManager) {
    this.eventManager = eventManager;
    this.handlers = [];
    this.handlersByElement = new Map();
    this.handleEvent = this.handleEvent.bind(this);
    this._active = false;
  }

  isEmpty() {
    return !this._active;
  }

  add(type, handler, opts, once = false, passive = false) {
    const {
      handlers,
      handlersByElement
    } = this;

    if (opts && (typeof opts !== 'object' || opts.addEventListener)) {
      opts = {
        srcElement: opts
      };
    }

    opts = opts ? Object.assign({}, DEFAULT_OPTIONS$1, opts) : DEFAULT_OPTIONS$1;
    let entries = handlersByElement.get(opts.srcElement);

    if (!entries) {
      entries = [];
      handlersByElement.set(opts.srcElement, entries);
    }

    const entry = {
      type,
      handler,
      srcElement: opts.srcElement,
      priority: opts.priority
    };

    if (once) {
      entry.once = true;
    }

    if (passive) {
      entry.passive = true;
    }

    handlers.push(entry);
    this._active = this._active || !entry.passive;
    let insertPosition = entries.length - 1;

    while (insertPosition >= 0) {
      if (entries[insertPosition].priority >= entry.priority) {
        break;
      }

      insertPosition--;
    }

    entries.splice(insertPosition + 1, 0, entry);
  }

  remove(type, handler) {
    const {
      handlers,
      handlersByElement
    } = this;

    for (let i = handlers.length - 1; i >= 0; i--) {
      const entry = handlers[i];

      if (entry.type === type && entry.handler === handler) {
        handlers.splice(i, 1);
        const entries = handlersByElement.get(entry.srcElement);
        entries.splice(entries.indexOf(entry), 1);

        if (entries.length === 0) {
          handlersByElement.delete(entry.srcElement);
        }
      }
    }

    this._active = handlers.some(entry => !entry.passive);
  }

  handleEvent(event) {
    if (this.isEmpty()) {
      return;
    }

    const mjolnirEvent = this._normalizeEvent(event);

    let target = event.srcEvent.target;

    while (target && target !== mjolnirEvent.rootElement) {
      this._emit(mjolnirEvent, target);

      if (mjolnirEvent.handled) {
        return;
      }

      target = target.parentNode;
    }

    this._emit(mjolnirEvent, 'root');
  }

  _emit(event, srcElement) {
    const entries = this.handlersByElement.get(srcElement);

    if (entries) {
      let immediatePropagationStopped = false;

      const stopPropagation = () => {
        event.handled = true;
      };

      const stopImmediatePropagation = () => {
        event.handled = true;
        immediatePropagationStopped = true;
      };

      const entriesToRemove = [];

      for (let i = 0; i < entries.length; i++) {
        const {
          type,
          handler,
          once
        } = entries[i];
        handler(Object.assign({}, event, {
          type,
          stopPropagation,
          stopImmediatePropagation
        }));

        if (once) {
          entriesToRemove.push(entries[i]);
        }

        if (immediatePropagationStopped) {
          break;
        }
      }

      for (let i = 0; i < entriesToRemove.length; i++) {
        const {
          type,
          handler
        } = entriesToRemove[i];
        this.remove(type, handler);
      }
    }
  }

  _normalizeEvent(event) {
    const rootElement = this.eventManager.element;
    return Object.assign({}, event, whichButtons(event), getOffsetPosition(event, rootElement), {
      handled: false,
      rootElement
    });
  }

}

const DEFAULT_OPTIONS = {
  events: null,
  recognizers: null,
  recognizerOptions: {},
  Manager,
  touchAction: 'none',
  tabIndex: 0
};
class EventManager {
  constructor(element = null, options = {}) {
    this.options = Object.assign({}, DEFAULT_OPTIONS, options);
    this.events = new Map();
    this._onBasicInput = this._onBasicInput.bind(this);
    this._onOtherEvent = this._onOtherEvent.bind(this);
    this.setElement(element);
    const {
      events
    } = options;

    if (events) {
      this.on(events);
    }
  }

  setElement(element) {
    if (this.element) {
      this.destroy();
    }

    this.element = element;

    if (!element) {
      return;
    }

    const {
      options
    } = this;
    const ManagerClass = options.Manager;
    this.manager = new ManagerClass(element, {
      touchAction: options.touchAction,
      recognizers: options.recognizers || RECOGNIZERS
    }).on('hammer.input', this._onBasicInput);

    if (!options.recognizers) {
      Object.keys(RECOGNIZER_COMPATIBLE_MAP).forEach(name => {
        const recognizer = this.manager.get(name);

        if (recognizer) {
          RECOGNIZER_COMPATIBLE_MAP[name].forEach(otherName => {
            recognizer.recognizeWith(otherName);
          });
        }
      });
    }

    for (const recognizerName in options.recognizerOptions) {
      const recognizer = this.manager.get(recognizerName);

      if (recognizer) {
        const recognizerOption = options.recognizerOptions[recognizerName];
        delete recognizerOption.enable;
        recognizer.set(recognizerOption);
      }
    }

    this.wheelInput = new WheelInput(element, this._onOtherEvent, {
      enable: false
    });
    this.moveInput = new MoveInput(element, this._onOtherEvent, {
      enable: false
    });
    this.keyInput = new KeyInput(element, this._onOtherEvent, {
      enable: false,
      tabIndex: options.tabIndex
    });
    this.contextmenuInput = new ContextmenuInput(element, this._onOtherEvent, {
      enable: false
    });

    for (const [eventAlias, eventRegistrar] of this.events) {
      if (!eventRegistrar.isEmpty()) {
        this._toggleRecognizer(eventRegistrar.recognizerName, true);

        this.manager.on(eventAlias, eventRegistrar.handleEvent);
      }
    }
  }

  destroy() {
    if (this.element) {
      this.wheelInput.destroy();
      this.moveInput.destroy();
      this.keyInput.destroy();
      this.contextmenuInput.destroy();
      this.manager.destroy();
      this.wheelInput = null;
      this.moveInput = null;
      this.keyInput = null;
      this.contextmenuInput = null;
      this.manager = null;
      this.element = null;
    }
  }

  on(event, handler, opts) {
    this._addEventHandler(event, handler, opts, false);
  }

  once(event, handler, opts) {
    this._addEventHandler(event, handler, opts, true);
  }

  watch(event, handler, opts) {
    this._addEventHandler(event, handler, opts, false, true);
  }

  off(event, handler) {
    this._removeEventHandler(event, handler);
  }

  _toggleRecognizer(name, enabled) {
    const {
      manager
    } = this;

    if (!manager) {
      return;
    }

    const recognizer = manager.get(name);

    if (recognizer && recognizer.options.enable !== enabled) {
      recognizer.set({
        enable: enabled
      });
      const fallbackRecognizers = RECOGNIZER_FALLBACK_MAP[name];

      if (fallbackRecognizers && !this.options.recognizers) {
        fallbackRecognizers.forEach(otherName => {
          const otherRecognizer = manager.get(otherName);

          if (enabled) {
            otherRecognizer.requireFailure(name);
            recognizer.dropRequireFailure(otherName);
          } else {
            otherRecognizer.dropRequireFailure(name);
          }
        });
      }
    }

    this.wheelInput.enableEventType(name, enabled);
    this.moveInput.enableEventType(name, enabled);
    this.keyInput.enableEventType(name, enabled);
    this.contextmenuInput.enableEventType(name, enabled);
  }

  _addEventHandler(event, handler, opts, once, passive) {
    if (typeof event !== 'string') {
      opts = handler;

      for (const eventName in event) {
        this._addEventHandler(eventName, event[eventName], opts, once, passive);
      }

      return;
    }

    const {
      manager,
      events
    } = this;
    const eventAlias = GESTURE_EVENT_ALIASES[event] || event;
    let eventRegistrar = events.get(eventAlias);

    if (!eventRegistrar) {
      eventRegistrar = new EventRegistrar(this);
      events.set(eventAlias, eventRegistrar);
      eventRegistrar.recognizerName = EVENT_RECOGNIZER_MAP[eventAlias] || eventAlias;

      if (manager) {
        manager.on(eventAlias, eventRegistrar.handleEvent);
      }
    }

    eventRegistrar.add(event, handler, opts, once, passive);

    if (!eventRegistrar.isEmpty()) {
      this._toggleRecognizer(eventRegistrar.recognizerName, true);
    }
  }

  _removeEventHandler(event, handler) {
    if (typeof event !== 'string') {
      for (const eventName in event) {
        this._removeEventHandler(eventName, event[eventName]);
      }

      return;
    }

    const {
      events
    } = this;
    const eventAlias = GESTURE_EVENT_ALIASES[event] || event;
    const eventRegistrar = events.get(eventAlias);

    if (!eventRegistrar) {
      return;
    }

    eventRegistrar.remove(event, handler);

    if (eventRegistrar.isEmpty()) {
      const {
        recognizerName
      } = eventRegistrar;
      let isRecognizerUsed = false;

      for (const eh of events.values()) {
        if (eh.recognizerName === recognizerName && !eh.isEmpty()) {
          isRecognizerUsed = true;
          break;
        }
      }

      if (!isRecognizerUsed) {
        this._toggleRecognizer(recognizerName, false);
      }
    }
  }

  _onBasicInput(event) {
    const {
      srcEvent
    } = event;
    const alias = BASIC_EVENT_ALIASES[srcEvent.type];

    if (alias) {
      this.manager.emit(alias, event);
    }
  }

  _onOtherEvent(event) {
    this.manager.emit(event.type, event);
  }

}

function noop() {}

const getCursor = _ref => {
  let {
    isDragging
  } = _ref;
  return isDragging ? 'grabbing' : 'grab';
};

function getPropTypes(PropTypes) {
  return {
    id: PropTypes.string,
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    layers: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    layerFilter: PropTypes.func,
    views: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    viewState: PropTypes.object,
    effects: PropTypes.arrayOf(PropTypes.instanceOf(Effect)),
    controller: PropTypes.oneOfType([PropTypes.func, PropTypes.bool, PropTypes.object]),
    gl: PropTypes.object,
    glOptions: PropTypes.object,
    parameters: PropTypes.object,
    pickingRadius: PropTypes.number,
    useDevicePixels: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
    touchAction: PropTypes.string,
    eventRecognizerOptions: PropTypes.object,
    onWebGLInitialized: PropTypes.func,
    onResize: PropTypes.func,
    onViewStateChange: PropTypes.func,
    onInteractionStateChange: PropTypes.func,
    onBeforeRender: PropTypes.func,
    onAfterRender: PropTypes.func,
    onLoad: PropTypes.func,
    onError: PropTypes.func,
    debug: PropTypes.bool,
    drawPickingColors: PropTypes.bool,
    _framebuffer: PropTypes.object,
    _animate: PropTypes.bool,
    _pickable: PropTypes.bool,
    _typedArrayManagerProps: PropTypes.object
  };
}

const defaultProps = {
  id: '',
  width: '100%',
  height: '100%',
  pickingRadius: 0,
  layerFilter: null,
  glOptions: {},
  gl: null,
  layers: [],
  effects: [],
  views: null,
  controller: null,
  useDevicePixels: true,
  touchAction: 'none',
  eventRecognizerOptions: {},
  _framebuffer: null,
  _animate: false,
  _pickable: true,
  _typedArrayManagerProps: {},
  onWebGLInitialized: noop,
  onResize: noop,
  onViewStateChange: noop,
  onInteractionStateChange: noop,
  onBeforeRender: noop,
  onAfterRender: noop,
  onLoad: noop,
  onError: (error, layer) => log.error(error)(),
  _onMetrics: null,
  getCursor,
  debug: false,
  drawPickingColors: false
};
class Deck {
  constructor(props) {
    props = { ...defaultProps,
      ...props
    };
    this.props = {};
    this.width = 0;
    this.height = 0;
    this.viewManager = null;
    this.layerManager = null;
    this.effectManager = null;
    this.deckRenderer = null;
    this.deckPicker = null;
    this._needsRedraw = true;
    this._pickRequest = {};
    this._lastPointerDownInfo = null;
    this.viewState = null;
    this.interactiveState = {
      isHovering: false,
      isDragging: false
    };
    this._onEvent = this._onEvent.bind(this);
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);

    if (props.viewState && props.initialViewState) {
      log.warn('View state tracking is disabled. Use either `initialViewState` for auto update or `viewState` for manual update.')();
    }

    if (env.getBrowser() === 'IE') {
      log.warn('IE 11 support will be deprecated in v8.0')();
    }

    if (!props.gl) {
      if (typeof document !== 'undefined') {
        this.canvas = this._createCanvas(props);
      }
    }

    this.animationLoop = this._createAnimationLoop(props);
    this.stats = new Stats({
      id: 'deck.gl'
    });
    this.metrics = {
      fps: 0,
      setPropsTime: 0,
      updateAttributesTime: 0,
      framesRedrawn: 0,
      pickTime: 0,
      pickCount: 0,
      gpuTime: 0,
      gpuTimePerFrame: 0,
      cpuTime: 0,
      cpuTimePerFrame: 0,
      bufferMemory: 0,
      textureMemory: 0,
      renderbufferMemory: 0,
      gpuMemory: 0
    };
    this._metricsCounter = 0;
    this.setProps(props);

    if (props._typedArrayManagerProps) {
      defaultTypedArrayManager.setProps(props._typedArrayManagerProps);
    }

    this.animationLoop.start();
  }

  finalize() {
    this.animationLoop.stop();
    this.animationLoop = null;
    this._lastPointerDownInfo = null;

    if (this.layerManager) {
      this.layerManager.finalize();
      this.layerManager = null;
      this.viewManager.finalize();
      this.viewManager = null;
      this.effectManager.finalize();
      this.effectManager = null;
      this.deckRenderer.finalize();
      this.deckRenderer = null;
      this.deckPicker.finalize();
      this.deckPicker = null;
      this.eventManager.destroy();
      this.eventManager = null;
      this.tooltip.remove();
      this.tooltip = null;
    }

    if (!this.props.canvas && !this.props.gl && this.canvas) {
      this.canvas.parentElement.removeChild(this.canvas);
      this.canvas = null;
    }
  }

  setProps(props) {
    this.stats.get('setProps Time').timeStart();

    if ('onLayerHover' in props) {
      log.removed('onLayerHover', 'onHover')();
    }

    if ('onLayerClick' in props) {
      log.removed('onLayerClick', 'onClick')();
    }

    if (props.initialViewState && !deepEqual(this.props.initialViewState, props.initialViewState)) {
      this.viewState = props.initialViewState;
    }

    Object.assign(this.props, props);

    this._setCanvasSize(this.props);

    const resolvedProps = Object.create(this.props);
    Object.assign(resolvedProps, {
      views: this._getViews(),
      width: this.width,
      height: this.height,
      viewState: this._getViewState()
    });
    this.animationLoop.setProps(resolvedProps);

    if (this.layerManager) {
      this.viewManager.setProps(resolvedProps);
      this.layerManager.activateViewport(this.getViewports()[0]);
      this.layerManager.setProps(resolvedProps);
      this.effectManager.setProps(resolvedProps);
      this.deckRenderer.setProps(resolvedProps);
      this.deckPicker.setProps(resolvedProps);
    }

    this.stats.get('setProps Time').timeEnd();
  }

  needsRedraw() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      clearRedrawFlags: false
    };

    if (this.props._animate) {
      return 'Deck._animate';
    }

    let redraw = this._needsRedraw;

    if (opts.clearRedrawFlags) {
      this._needsRedraw = false;
    }

    const viewManagerNeedsRedraw = this.viewManager.needsRedraw(opts);
    const layerManagerNeedsRedraw = this.layerManager.needsRedraw(opts);
    const effectManagerNeedsRedraw = this.effectManager.needsRedraw(opts);
    const deckRendererNeedsRedraw = this.deckRenderer.needsRedraw(opts);
    redraw = redraw || viewManagerNeedsRedraw || layerManagerNeedsRedraw || effectManagerNeedsRedraw || deckRendererNeedsRedraw;
    return redraw;
  }

  redraw(force) {
    if (!this.layerManager) {
      return;
    }

    const redrawReason = force || this.needsRedraw({
      clearRedrawFlags: true
    });

    if (!redrawReason) {
      return;
    }

    this.stats.get('Redraw Count').incrementCount();

    if (this.props._customRender) {
      this.props._customRender(redrawReason);
    } else {
      this._drawLayers(redrawReason);
    }
  }

  getViews() {
    return this.viewManager.views;
  }

  getViewports(rect) {
    return this.viewManager.getViewports(rect);
  }

  pickObject(opts) {
    const infos = this._pick('pickObject', 'pickObject Time', opts).result;

    return infos.length ? infos[0] : null;
  }

  pickMultipleObjects(opts) {
    opts.depth = opts.depth || 10;
    return this._pick('pickObject', 'pickMultipleObjects Time', opts).result;
  }

  pickObjects(opts) {
    return this._pick('pickObjects', 'pickObjects Time', opts);
  }

  _addResources(resources) {
    let forceUpdate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    for (const id in resources) {
      this.layerManager.resourceManager.add({
        resourceId: id,
        data: resources[id],
        forceUpdate
      });
    }
  }

  _removeResources(resourceIds) {
    for (const id of resourceIds) {
      this.layerManager.resourceManager.remove(id);
    }
  }

  _pick(method, statKey, opts) {
    const {
      stats
    } = this;
    stats.get('Pick Count').incrementCount();
    stats.get(statKey).timeStart();
    const infos = this.deckPicker[method]({
      layers: this.layerManager.getLayers(opts),
      views: this.viewManager.getViews(),
      viewports: this.getViewports(opts),
      onViewportActive: this.layerManager.activateViewport,
      ...opts
    });
    stats.get(statKey).timeEnd();
    return infos;
  }

  _createCanvas(props) {
    let canvas = props.canvas;

    if (typeof canvas === 'string') {
      canvas = document.getElementById(canvas);
      assert$1(canvas);
    }

    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = props.id || 'deckgl-overlay';
      const parent = props.parent || document.body;
      parent.appendChild(canvas);
    }

    Object.assign(canvas.style, props.style);
    return canvas;
  }

  _setCanvasSize(props) {
    if (!this.canvas) {
      return;
    }

    let {
      width,
      height
    } = props;

    if (width || width === 0) {
      width = Number.isFinite(width) ? "".concat(width, "px") : width;
      this.canvas.style.width = width;
    }

    if (height || height === 0) {
      height = Number.isFinite(height) ? "".concat(height, "px") : height;
      this.canvas.style.position = 'absolute';
      this.canvas.style.height = height;
    }
  }

  _updateCanvasSize() {
    if (this._checkForCanvasSizeChange()) {
      const {
        width,
        height
      } = this;
      this.viewManager.setProps({
        width,
        height
      });
      this.props.onResize({
        width: this.width,
        height: this.height
      });
    }
  }

  _checkForCanvasSizeChange() {
    const {
      canvas
    } = this;

    if (!canvas) {
      return false;
    }

    const newWidth = canvas.clientWidth || canvas.width;
    const newHeight = canvas.clientHeight || canvas.height;

    if (newWidth !== this.width || newHeight !== this.height) {
      this.width = newWidth;
      this.height = newHeight;
      return true;
    }

    return false;
  }

  _createAnimationLoop(props) {
    const {
      width,
      height,
      gl,
      glOptions,
      debug,
      onError,
      onBeforeRender,
      onAfterRender,
      useDevicePixels,
      autoResizeDrawingBuffer
    } = props;
    return new AnimationLoop({
      width,
      height,
      useDevicePixels,
      autoResizeDrawingBuffer,
      autoResizeViewport: false,
      gl,
      onCreateContext: opts => createGLContext({ ...glOptions,
        ...opts,
        canvas: this.canvas,
        debug,
        onContextLost: () => this._onContextLost()
      }),
      onInitialize: context => this._setGLContext(context.gl),
      onRender: this._onRenderFrame.bind(this),
      onBeforeRender,
      onAfterRender,
      onError
    });
  }

  _getViewState() {
    return this.props.viewState || this.viewState;
  }

  _getViews() {
    let views = this.props.views || [new MapView({
      id: 'default-view'
    })];
    views = Array.isArray(views) ? views : [views];

    if (views.length && this.props.controller) {
      views[0].props.controller = this.props.controller;
    }

    return views;
  }

  _onContextLost() {
    const {
      onError
    } = this.props;

    if (this.animationLoop && onError) {
      onError(new Error("WebGL context is lost"));
    }
  }

  _onPointerMove(event) {
    const {
      _pickRequest
    } = this;

    if (event.type === 'pointerleave') {
      _pickRequest.x = -1;
      _pickRequest.y = -1;
      _pickRequest.radius = 0;
    } else if (event.leftButton || event.rightButton) {
      return;
    } else {
      const pos = event.offsetCenter;

      if (!pos) {
        return;
      }

      _pickRequest.x = pos.x;
      _pickRequest.y = pos.y;
      _pickRequest.radius = this.props.pickingRadius;
    }

    if (this.layerManager) {
      this.layerManager.context.mousePosition = {
        x: _pickRequest.x,
        y: _pickRequest.y
      };
    }

    _pickRequest.event = event;
    _pickRequest.mode = 'hover';
  }

  _pickAndCallback() {
    const {
      _pickRequest
    } = this;

    if (_pickRequest.event) {
      const {
        result,
        emptyInfo
      } = this._pick('pickObject', 'pickObject Time', _pickRequest);

      this.interactiveState.isHovering = result.length > 0;
      let pickedInfo = emptyInfo;
      let handled = false;

      for (const info of result) {
        pickedInfo = info;
        handled = info.layer.onHover(info, _pickRequest.event);
      }

      if (!handled && this.props.onHover) {
        this.props.onHover(pickedInfo, _pickRequest.event);
      }

      if (this.props.getTooltip) {
        const displayInfo = this.props.getTooltip(pickedInfo);
        this.tooltip.setTooltip(displayInfo, pickedInfo.x, pickedInfo.y);
      }

      _pickRequest.event = null;
    }
  }

  _updateCursor() {
    const container = this.props.parent || this.canvas;

    if (container) {
      container.style.cursor = this.props.getCursor(this.interactiveState);
    }
  }

  _setGLContext(gl) {
    if (this.layerManager) {
      return;
    }

    if (!this.canvas) {
      this.canvas = gl.canvas;
      instrumentGLContext(gl, {
        enable: true,
        copyState: true
      });
    }

    this.tooltip = new Tooltip(this.canvas);
    setParameters(gl, {
      blend: true,
      blendFunc: [770, 771, 1, 771],
      polygonOffsetFill: true,
      depthTest: true,
      depthFunc: 515
    });
    this.props.onWebGLInitialized(gl);
    const timeline = new Timeline();
    timeline.play();
    this.animationLoop.attachTimeline(timeline);
    this.eventManager = new EventManager(this.props.parent || gl.canvas, {
      touchAction: this.props.touchAction,
      recognizerOptions: this.props.eventRecognizerOptions,
      events: {
        pointerdown: this._onPointerDown,
        pointermove: this._onPointerMove,
        pointerleave: this._onPointerMove
      }
    });

    for (const eventType in EVENTS) {
      this.eventManager.on(eventType, this._onEvent);
    }

    this.viewManager = new ViewManager({
      timeline,
      eventManager: this.eventManager,
      onViewStateChange: this._onViewStateChange.bind(this),
      onInteractionStateChange: this._onInteractionStateChange.bind(this),
      views: this._getViews(),
      viewState: this._getViewState(),
      width: this.width,
      height: this.height
    });
    const viewport = this.viewManager.getViewports()[0];
    this.layerManager = new LayerManager(gl, {
      deck: this,
      stats: this.stats,
      viewport,
      timeline
    });
    this.effectManager = new EffectManager();
    this.deckRenderer = new DeckRenderer(gl);
    this.deckPicker = new DeckPicker(gl);
    this.setProps(this.props);

    this._updateCanvasSize();

    this.props.onLoad();
  }

  _drawLayers(redrawReason, renderOptions) {
    const {
      gl
    } = this.layerManager.context;
    setParameters(gl, this.props.parameters);
    this.props.onBeforeRender({
      gl
    });
    this.deckRenderer.renderLayers({
      target: this.props._framebuffer,
      layers: this.layerManager.getLayers(),
      viewports: this.viewManager.getViewports(),
      onViewportActive: this.layerManager.activateViewport,
      views: this.viewManager.getViews(),
      pass: 'screen',
      redrawReason,
      effects: this.effectManager.getEffects(),
      ...renderOptions
    });
    this.props.onAfterRender({
      gl
    });
  }

  _onRenderFrame(animationProps) {
    this._getFrameStats();

    if (this._metricsCounter++ % 60 === 0) {
      this._getMetrics();

      this.stats.reset();
      log.table(4, this.metrics)();

      if (this.props._onMetrics) {
        this.props._onMetrics(this.metrics);
      }
    }

    this._updateCanvasSize();

    this._updateCursor();

    if (this.tooltip.isVisible && this.viewManager.needsRedraw()) {
      this.tooltip.setTooltip(null);
    }

    this.layerManager.updateLayers();

    this._pickAndCallback();

    this.redraw(false);

    if (this.viewManager) {
      this.viewManager.updateViewStates();
    }
  }

  _onViewStateChange(params) {
    const viewState = this.props.onViewStateChange(params) || params.viewState;

    if (this.viewState) {
      this.viewState = { ...this.viewState,
        [params.viewId]: viewState
      };

      if (!this.props.viewState) {
        if (this.viewManager) {
          this.viewManager.setProps({
            viewState: this.viewState
          });
        }
      }
    }
  }

  _onInteractionStateChange(interactionState) {
    this.interactiveState.isDragging = interactionState.isDragging;
    this.props.onInteractionStateChange(interactionState);
  }

  _onEvent(event) {
    const eventOptions = EVENTS[event.type];
    const pos = event.offsetCenter;

    if (!eventOptions || !pos) {
      return;
    }

    const layers = this.layerManager.getLayers();
    const info = this.deckPicker.getLastPickedObject({
      x: pos.x,
      y: pos.y,
      layers,
      viewports: this.getViewports(pos)
    }, this._lastPointerDownInfo);
    const {
      layer
    } = info;
    const layerHandler = layer && (layer[eventOptions.handler] || layer.props[eventOptions.handler]);
    const rootHandler = this.props[eventOptions.handler];
    let handled = false;

    if (layerHandler) {
      handled = layerHandler.call(layer, info, event);
    }

    if (!handled && rootHandler) {
      rootHandler(info, event);
    }
  }

  _onPointerDown(event) {
    const pos = event.offsetCenter;

    const pickedInfo = this._pick('pickObject', 'pickObject Time', {
      x: pos.x,
      y: pos.y,
      radius: this.props.pickingRadius
    });

    this._lastPointerDownInfo = pickedInfo.result[0] || pickedInfo.emptyInfo;
  }

  _getFrameStats() {
    const {
      stats
    } = this;
    stats.get('frameRate').timeEnd();
    stats.get('frameRate').timeStart();
    const animationLoopStats = this.animationLoop.stats;
    stats.get('GPU Time').addTime(animationLoopStats.get('GPU Time').lastTiming);
    stats.get('CPU Time').addTime(animationLoopStats.get('CPU Time').lastTiming);
  }

  _getMetrics() {
    const {
      metrics,
      stats
    } = this;
    metrics.fps = stats.get('frameRate').getHz();
    metrics.setPropsTime = stats.get('setProps Time').time;
    metrics.updateAttributesTime = stats.get('Update Attributes').time;
    metrics.framesRedrawn = stats.get('Redraw Count').count;
    metrics.pickTime = stats.get('pickObject Time').time + stats.get('pickMultipleObjects Time').time + stats.get('pickObjects Time').time;
    metrics.pickCount = stats.get('Pick Count').count;
    metrics.gpuTime = stats.get('GPU Time').time;
    metrics.cpuTime = stats.get('CPU Time').time;
    metrics.gpuTimePerFrame = stats.get('GPU Time').getAverageTime();
    metrics.cpuTimePerFrame = stats.get('CPU Time').getAverageTime();
    const memoryStats = lumaStats.get('Memory Usage');
    metrics.bufferMemory = memoryStats.get('Buffer Memory').count;
    metrics.textureMemory = memoryStats.get('Texture Memory').count;
    metrics.renderbufferMemory = memoryStats.get('Renderbuffer Memory').count;
    metrics.gpuMemory = memoryStats.get('GPU Memory').count;
  }

}
Deck.getPropTypes = getPropTypes;
Deck.defaultProps = defaultProps;
Deck.VERSION = deckGlobal.VERSION;

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var ReactPropTypesSecret$1 = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';

var ReactPropTypesSecret_1 = ReactPropTypesSecret$1;

var ReactPropTypesSecret = ReactPropTypesSecret_1;

function emptyFunction() {}
function emptyFunctionWithReset() {}
emptyFunctionWithReset.resetWarningCache = emptyFunction;

var factoryWithThrowingShims = function() {
  function shim(props, propName, componentName, location, propFullName, secret) {
    if (secret === ReactPropTypesSecret) {
      // It is still safe when called from React.
      return;
    }
    var err = new Error(
      'Calling PropTypes validators directly is not supported by the `prop-types` package. ' +
      'Use PropTypes.checkPropTypes() to call them. ' +
      'Read more at http://fb.me/use-check-prop-types'
    );
    err.name = 'Invariant Violation';
    throw err;
  }  shim.isRequired = shim;
  function getShim() {
    return shim;
  }  // Important!
  // Keep this list in sync with production version in `./factoryWithTypeCheckers.js`.
  var ReactPropTypes = {
    array: shim,
    bigint: shim,
    bool: shim,
    func: shim,
    number: shim,
    object: shim,
    string: shim,
    symbol: shim,

    any: shim,
    arrayOf: getShim,
    element: shim,
    elementType: shim,
    instanceOf: getShim,
    node: shim,
    objectOf: getShim,
    oneOf: getShim,
    oneOfType: getShim,
    shape: getShim,
    exact: getShim,

    checkPropTypes: emptyFunctionWithReset,
    resetWarningCache: emptyFunction
  };

  ReactPropTypes.PropTypes = ReactPropTypes;

  return ReactPropTypes;
};

var require$$0 = factoryWithThrowingShims;

var propTypes = createCommonjsModule(function (module) {
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

{
  // By explicitly using `prop-types` you are opting into new production behavior.
  // http://fb.me/prop-types-in-prod
  module.exports = require$$0();
}
});

var PropTypes = propTypes;

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? react.useLayoutEffect : react.useEffect;
var useIsomorphicLayoutEffect$1 = useIsomorphicLayoutEffect;

function inheritsFrom(Type, ParentType) {
  while (Type) {
    if (Type === ParentType) {
      return true;
    }

    Type = Object.getPrototypeOf(Type);
  }

  return false;
}

function wrapInView(node) {
  if (!node) {
    return node;
  }

  if (typeof node === 'function') {
    return react.createElement(View, {}, node);
  }

  if (Array.isArray(node)) {
    return node.map(wrapInView);
  }

  if (node.type === react.Fragment) {
    return wrapInView(node.props.children);
  }

  if (inheritsFrom(node.type, View)) {
    return node;
  }

  return node;
}

function extractJSXLayers(_ref) {
  let {
    children,
    layers,
    views
  } = _ref;
  const reactChildren = [];
  const jsxLayers = [];
  const jsxViews = {};
  react.Children.forEach(wrapInView(children), reactElement => {
    if (reactElement) {
      const ElementType = reactElement.type;

      if (inheritsFrom(ElementType, Layer)) {
        const layer = createLayer(ElementType, reactElement.props);
        jsxLayers.push(layer);
      } else {
        reactChildren.push(reactElement);
      }

      if (ElementType !== View && inheritsFrom(ElementType, View) && reactElement.props.id) {
        const view = new ElementType(reactElement.props);
        jsxViews[view.id] = view;
      }
    }
  });

  if (Object.keys(jsxViews).length > 0) {
    if (Array.isArray(views)) {
      views.forEach(view => {
        jsxViews[view.id] = view;
      });
    } else if (views) {
      jsxViews[views.id] = views;
    }

    views = Object.values(jsxViews);
  }

  layers = jsxLayers.length > 0 ? [...jsxLayers, ...layers] : layers;
  return {
    layers,
    children: reactChildren,
    views
  };
}

function createLayer(LayerType, reactProps) {
  const props = {};
  const defaultProps = LayerType.defaultProps || {};

  for (const key in reactProps) {
    if (defaultProps[key] !== reactProps[key]) {
      props[key] = reactProps[key];
    }
  }

  return new LayerType(props);
}

const MAP_STYLE = {
  position: 'absolute',
  zIndex: -1
};
function evaluateChildren(children, childProps) {
  if (!children) {
    return children;
  }

  if (typeof children === 'function') {
    return children(childProps);
  }

  if (Array.isArray(children)) {
    return children.map(child => evaluateChildren(child, childProps));
  }

  if (isReactMap(children)) {
    childProps.style = MAP_STYLE;
    return react.cloneElement(children, childProps);
  }

  if (needsDeckGLViewProps(children)) {
    return react.cloneElement(children, childProps);
  }

  return children;
}

function isReactMap(child) {
  const componentClass = child && child.type;
  const componentProps = componentClass && componentClass.defaultProps;
  return componentProps && componentProps.mapStyle;
}

function needsDeckGLViewProps(child) {
  const componentClass = child && child.type;
  return componentClass && componentClass.deckGLViewProps;
}

function positionChildrenUnderViews(_ref) {
  let {
    children,
    deck,
    ContextProvider
  } = _ref;
  const {
    viewManager
  } = deck || {};

  if (!viewManager || !viewManager.views.length) {
    return [];
  }

  const views = {};
  const defaultViewId = viewManager.views[0].id;

  for (const child of children) {
    let viewId = defaultViewId;
    let viewChildren = child;

    if (inheritsFrom(child.type, View)) {
      viewId = child.props.id || defaultViewId;
      viewChildren = child.props.children;
    }

    const viewport = viewManager.getViewport(viewId);
    const viewState = viewManager.getViewState(viewId);

    if (viewport) {
      const {
        x,
        y,
        width,
        height
      } = viewport;
      viewChildren = evaluateChildren(viewChildren, {
        x,
        y,
        width,
        height,
        viewport,
        viewState
      });

      if (!views[viewId]) {
        views[viewId] = {
          viewport,
          children: []
        };
      }

      views[viewId].children.push(viewChildren);
    }
  }

  return Object.keys(views).map(viewId => {
    const {
      viewport,
      children: viewChildren
    } = views[viewId];
    const {
      x,
      y,
      width,
      height
    } = viewport;
    const style = {
      position: 'absolute',
      left: x,
      top: y,
      width,
      height
    };
    const key = "view-".concat(viewId);
    const viewElement = react.createElement('div', {
      key,
      id: key,
      style
    }, ...viewChildren);

    if (ContextProvider) {
      const contextValue = {
        viewport,
        container: deck.canvas.offsetParent,
        eventManager: deck.eventManager,
        onViewStateChange: params => {
          params.viewId = viewId;

          deck._onViewStateChange(params);
        }
      };
      return react.createElement(ContextProvider, {
        key,
        value: contextValue
      }, viewElement);
    }

    return viewElement;
  });
}

const CANVAS_ONLY_STYLES = {
  mixBlendMode: null
};
function extractStyles(_ref) {
  let {
    width,
    height,
    style
  } = _ref;
  const containerStyle = {
    position: 'absolute',
    zIndex: 0,
    left: 0,
    top: 0,
    width,
    height
  };
  const canvasStyle = {
    left: 0,
    top: 0
  };

  if (style) {
    for (const key in style) {
      if (key in CANVAS_ONLY_STYLES) {
        canvasStyle[key] = style[key];
      } else {
        containerStyle[key] = style[key];
      }
    }
  }

  return {
    containerStyle,
    canvasStyle
  };
}

function getRefHandles(thisRef) {
  const handles = {
    pickObject: opts => thisRef.deck.pickObject(opts),
    pickMultipleObjects: opts => thisRef.deck.pickMultipleObjects(opts),
    pickObjects: opts => thisRef.deck.pickObjects(opts)
  };
  Object.defineProperty(handles, 'deck', {
    get: () => thisRef.deck
  });
  return handles;
}

function redrawDeck(thisRef) {
  if (thisRef.redrawReason) {
    thisRef.deck._drawLayers(thisRef.redrawReason);

    thisRef.redrawReason = null;
  }
}

function createDeckInstance(thisRef, props) {
  const DeckClass = props.Deck || Deck;
  const deck = new DeckClass({ ...props,
    style: null,
    width: '100%',
    height: '100%',
    _customRender: redrawReason => {
      thisRef.redrawReason = redrawReason;
      const viewports = deck.viewManager.getViewports();

      if (thisRef.lastRenderedViewports !== viewports) {
        thisRef.forceUpdate(v => v + 1);
      } else {
        redrawDeck(thisRef);
      }
    }
  });
  return deck;
}

const DeckGL = react.forwardRef((props, ref) => {
  const _thisRef = react.useRef({});

  const thisRef = _thisRef.current;
  const [version, setVersion] = react.useState(0);
  thisRef.forceUpdate = setVersion;
  const containerRef = react.useRef(null);
  const canvasRef = react.useRef(null);
  const jsxProps = react.useMemo(() => extractJSXLayers(props), [props.layers, props.views, props.children]);
  let inRender = true;

  const handleViewStateChange = params => {
    if (inRender && props.viewState) {
      thisRef.viewStateUpdateRequested = params;
      return null;
    }

    thisRef.viewStateUpdateRequested = null;
    return props.onViewStateChange(params);
  };

  const handleInteractionStateChange = params => {
    if (inRender) {
      thisRef.interactionStateUpdateRequested = params;
    } else {
      thisRef.interactionStateUpdateRequested = null;
      props.onInteractionStateChange(params);
    }
  };

  const deckProps = react.useMemo(() => {
    const forwardProps = { ...props,
      style: null,
      width: '100%',
      height: '100%',
      layers: jsxProps.layers,
      views: jsxProps.views,
      onViewStateChange: handleViewStateChange,
      onInteractionStateChange: handleInteractionStateChange
    };

    if (thisRef.deck) {
      thisRef.deck.setProps(forwardProps);
    }

    return forwardProps;
  }, [props]);
  react.useEffect(() => {
    thisRef.deck = createDeckInstance(thisRef, { ...deckProps,
      parent: containerRef.current,
      canvas: canvasRef.current
    });
    return () => thisRef.deck.finalize();
  }, []);
  useIsomorphicLayoutEffect$1(() => {
    redrawDeck(thisRef);
    const {
      viewStateUpdateRequested,
      interactionStateUpdateRequested
    } = thisRef;

    if (viewStateUpdateRequested) {
      handleViewStateChange(viewStateUpdateRequested);
    }

    if (interactionStateUpdateRequested) {
      handleInteractionStateChange(interactionStateUpdateRequested);
    }
  });
  react.useImperativeHandle(ref, () => getRefHandles(thisRef), []);
  const {
    viewManager
  } = thisRef.deck || {};
  const currentViewports = viewManager && viewManager.getViewports();
  const {
    ContextProvider,
    width,
    height,
    id,
    style
  } = props;
  const {
    containerStyle,
    canvasStyle
  } = react.useMemo(() => extractStyles({
    width,
    height,
    style
  }), [width, height, style]);

  if (!thisRef.viewStateUpdateRequested && thisRef.lastRenderedViewports === currentViewports || thisRef.version !== version) {
    thisRef.lastRenderedViewports = currentViewports;
    thisRef.version = version;
    const childrenUnderViews = positionChildrenUnderViews({
      children: jsxProps.children,
      deck: thisRef.deck,
      ContextProvider
    });
    const canvas = react.createElement('canvas', {
      key: 'canvas',
      id: id || 'deckgl-overlay',
      ref: canvasRef,
      style: canvasStyle
    });
    thisRef.control = react.createElement('div', {
      id: "".concat(id || 'deckgl', "-wrapper"),
      ref: containerRef,
      style: containerStyle
    }, [canvas, childrenUnderViews]);
  }

  inRender = false;
  return thisRef.control;
});
DeckGL.propTypes = Deck.getPropTypes(PropTypes);
DeckGL.defaultProps = Deck.defaultProps;
var __pika_web_default_export_for_treeshaking__ = DeckGL;

export { __pika_web_default_export_for_treeshaking__ as default };
