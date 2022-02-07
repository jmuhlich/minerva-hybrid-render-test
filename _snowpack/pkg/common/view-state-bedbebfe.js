import { b as assert, V as Viewport, T as Transition, e as equals, l as lerp } from './transition-e4288157.js';

function deepEqual(a, b) {
  if (a === b) {
    return true;
  }

  if (!a || !b) {
    return false;
  }

  for (const key in a) {
    const aValue = a[key];
    const bValue = b[key];
    const equals = aValue === bValue || Array.isArray(aValue) && Array.isArray(bValue) && deepEqual(aValue, bValue);

    if (!equals) {
      return false;
    }
  }

  return true;
}

const PERCENT_OR_PIXELS_REGEX = /([0-9]+\.?[0-9]*)(%|px)/;
function parsePosition(value) {
  switch (typeof value) {
    case 'number':
      return {
        position: value,
        relative: false
      };

    case 'string':
      const match = value.match(PERCENT_OR_PIXELS_REGEX);

      if (match && match.length >= 3) {
        const relative = match[2] === '%';
        const position = parseFloat(match[1]);
        return {
          position: relative ? position / 100 : position,
          relative
        };
      }

    default:
      throw new Error("Could not parse position string ".concat(value));
  }
}
function getPosition(position, extent) {
  return position.relative ? Math.round(position.position * extent) : position.position;
}

class View {
  constructor() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const {
      id = null,
      x = 0,
      y = 0,
      width = '100%',
      height = '100%',
      viewportInstance,
      type = Viewport
    } = props;
    assert(!viewportInstance || viewportInstance instanceof Viewport);
    this.viewportInstance = viewportInstance;
    this.id = id || this.constructor.displayName || 'view';
    this.type = type;
    this.props = { ...props,
      id: this.id
    };

    this._parseDimensions({
      x,
      y,
      width,
      height
    });

    this.equals = this.equals.bind(this);
    Object.seal(this);
  }

  equals(view) {
    if (this === view) {
      return true;
    }

    if (this.viewportInstance) {
      return view.viewportInstance && this.viewportInstance.equals(view.viewportInstance);
    }

    const viewChanged = deepEqual(this.props, view.props);
    return viewChanged;
  }

  makeViewport(_ref) {
    let {
      width,
      height,
      viewState
    } = _ref;

    if (this.viewportInstance) {
      return this.viewportInstance;
    }

    viewState = this.filterViewState(viewState);
    const viewportDimensions = this.getDimensions({
      width,
      height
    });
    return this._getViewport(viewState, viewportDimensions);
  }

  getViewStateId() {
    switch (typeof this.props.viewState) {
      case 'string':
        return this.props.viewState;

      case 'object':
        return this.props.viewState && this.props.viewState.id;

      default:
        return this.id;
    }
  }

  filterViewState(viewState) {
    if (this.props.viewState && typeof this.props.viewState === 'object') {
      if (!this.props.viewState.id) {
        return this.props.viewState;
      }

      const newViewState = { ...viewState
      };

      for (const key in this.props.viewState) {
        if (key !== 'id') {
          newViewState[key] = this.props.viewState[key];
        }
      }

      return newViewState;
    }

    return viewState;
  }

  getDimensions(_ref2) {
    let {
      width,
      height
    } = _ref2;
    return {
      x: getPosition(this._x, width),
      y: getPosition(this._y, height),
      width: getPosition(this._width, width),
      height: getPosition(this._height, height)
    };
  }

  _getControllerProps(defaultOpts) {
    let opts = this.props.controller;

    if (!opts) {
      return null;
    }

    if (opts === true) {
      return defaultOpts;
    }

    if (typeof opts === 'function') {
      opts = {
        type: opts
      };
    }

    return { ...defaultOpts,
      ...opts
    };
  }

  _getViewport(viewState, viewportDimensions) {
    const {
      type: ViewportType
    } = this;
    return new ViewportType({ ...viewState,
      ...this.props,
      ...viewportDimensions
    });
  }

  _parseDimensions(_ref3) {
    let {
      x,
      y,
      width,
      height
    } = _ref3;
    this._x = parsePosition(x);
    this._y = parsePosition(y);
    this._width = parsePosition(width);
    this._height = parsePosition(height);
  }

}

const noop = () => {};

const TRANSITION_EVENTS = {
  BREAK: 1,
  SNAP_TO_END: 2,
  IGNORE: 3
};
const DEFAULT_PROPS$1 = {
  transitionEasing: t => t,
  transitionInterruption: TRANSITION_EVENTS.BREAK,
  onTransitionStart: noop,
  onTransitionInterrupt: noop,
  onTransitionEnd: noop
};
class TransitionManager {
  constructor(ControllerState) {
    let props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    this.ControllerState = ControllerState;
    this.props = { ...DEFAULT_PROPS$1,
      ...props
    };
    this.propsInTransition = null;
    this.transition = new Transition(props.timeline);
    this.onViewStateChange = props.onViewStateChange || noop;
    this.onStateChange = props.onStateChange || noop;
    this._onTransitionUpdate = this._onTransitionUpdate.bind(this);
  }

  finalize() {
    this.transition.cancel();
  }

  getViewportInTransition() {
    return this.propsInTransition;
  }

  processViewStateChange(nextProps) {
    let transitionTriggered = false;
    const currentProps = this.props;
    nextProps = { ...DEFAULT_PROPS$1,
      ...nextProps
    };
    this.props = nextProps;

    if (this._shouldIgnoreViewportChange(currentProps, nextProps)) {
      return transitionTriggered;
    }

    if (this._isTransitionEnabled(nextProps)) {
      const {
        interruption,
        endProps
      } = this.transition.settings;
      const startProps = { ...currentProps,
        ...(interruption === TRANSITION_EVENTS.SNAP_TO_END ? endProps : this.propsInTransition || currentProps)
      };

      this._triggerTransition(startProps, nextProps);

      transitionTriggered = true;
    } else {
      this.transition.cancel();
    }

    return transitionTriggered;
  }

  updateTransition() {
    this.transition.update();
  }

  _isTransitionEnabled(props) {
    const {
      transitionDuration,
      transitionInterpolator
    } = props;
    return (transitionDuration > 0 || transitionDuration === 'auto') && Boolean(transitionInterpolator);
  }

  _isUpdateDueToCurrentTransition(props) {
    if (this.transition.inProgress) {
      return this.transition.settings.interpolator.arePropsEqual(props, this.propsInTransition);
    }

    return false;
  }

  _shouldIgnoreViewportChange(currentProps, nextProps) {
    if (this.transition.inProgress) {
      return this.transition.settings.interruption === TRANSITION_EVENTS.IGNORE || this._isUpdateDueToCurrentTransition(nextProps);
    } else if (this._isTransitionEnabled(nextProps)) {
      return nextProps.transitionInterpolator.arePropsEqual(currentProps, nextProps);
    }

    return true;
  }

  _triggerTransition(startProps, endProps) {
    const startViewstate = new this.ControllerState(startProps);
    const endViewStateProps = new this.ControllerState(endProps).shortestPathFrom(startViewstate);
    const {
      transitionInterpolator
    } = endProps;
    const duration = transitionInterpolator.getDuration ? transitionInterpolator.getDuration(startProps, endProps) : endProps.transitionDuration;

    if (duration === 0) {
      return;
    }

    const initialProps = endProps.transitionInterpolator.initializeProps(startProps, endViewStateProps);
    this.propsInTransition = {};
    this.duration = duration;
    this.transition.start({
      duration,
      easing: endProps.transitionEasing,
      interpolator: endProps.transitionInterpolator,
      interruption: endProps.transitionInterruption,
      startProps: initialProps.start,
      endProps: initialProps.end,
      onStart: endProps.onTransitionStart,
      onUpdate: this._onTransitionUpdate,
      onInterrupt: this._onTransitionEnd(endProps.onTransitionInterrupt),
      onEnd: this._onTransitionEnd(endProps.onTransitionEnd)
    });
    this.onStateChange({
      inTransition: true
    });
    this.updateTransition();
  }

  _onTransitionEnd(callback) {
    return transition => {
      this.propsInTransition = null;
      this.onStateChange({
        inTransition: false,
        isZooming: false,
        isPanning: false,
        isRotating: false
      });
      callback(transition);
    };
  }

  _onTransitionUpdate(transition) {
    const {
      time,
      settings: {
        interpolator,
        startProps,
        endProps,
        duration,
        easing
      }
    } = transition;
    const t = easing(time / duration);
    const viewport = interpolator.interpolateProps(startProps, endProps, t);
    this.propsInTransition = new this.ControllerState({ ...this.props,
      ...viewport
    }).getViewportProps();
    this.onViewStateChange({
      viewState: this.propsInTransition,
      oldViewState: this.props
    });
  }

}

class TransitionInterpolator {
  constructor() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (Array.isArray(opts)) {
      opts = {
        compare: opts,
        extract: opts,
        required: opts
      };
    }

    const {
      compare,
      extract,
      required
    } = opts;
    this._propsToCompare = compare;
    this._propsToExtract = extract;
    this._requiredProps = required;
  }

  arePropsEqual(currentProps, nextProps) {
    for (const key of this._propsToCompare || Object.keys(nextProps)) {
      if (!(key in currentProps) || !(key in nextProps) || !equals(currentProps[key], nextProps[key])) {
        return false;
      }
    }

    return true;
  }

  initializeProps(startProps, endProps) {
    let result;

    if (this._propsToExtract) {
      const startViewStateProps = {};
      const endViewStateProps = {};

      for (const key of this._propsToExtract) {
        startViewStateProps[key] = startProps[key];
        endViewStateProps[key] = endProps[key];
      }

      result = {
        start: startViewStateProps,
        end: endViewStateProps
      };
    } else {
      result = {
        start: startProps,
        end: endProps
      };
    }

    this._checkRequiredProps(result.start);

    this._checkRequiredProps(result.end);

    return result;
  }

  interpolateProps(startProps, endProps, t) {
    return endProps;
  }

  getDuration(startProps, endProps) {
    return endProps.transitionDuration;
  }

  _checkRequiredProps(props) {
    if (!this._requiredProps) {
      return;
    }

    this._requiredProps.forEach(propName => {
      const value = props[propName];
      assert(Number.isFinite(value) || Array.isArray(value), "".concat(propName, " is required for transition"));
    });
  }

}

const DEFAULT_PROPS = ['longitude', 'latitude', 'zoom', 'bearing', 'pitch'];
const DEFAULT_REQUIRED_PROPS = ['longitude', 'latitude', 'zoom'];
class LinearInterpolator extends TransitionInterpolator {
  constructor() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const transitionProps = Array.isArray(opts) ? opts : opts.transitionProps;
    super(transitionProps || {
      compare: DEFAULT_PROPS,
      extract: DEFAULT_PROPS,
      required: DEFAULT_REQUIRED_PROPS
    });
    this.opts = opts;
  }

  initializeProps(startProps, endProps) {
    const result = super.initializeProps(startProps, endProps);
    const {
      makeViewport,
      around
    } = this.opts;

    if (makeViewport && around) {
      const startViewport = makeViewport(startProps);
      const endViewport = makeViewport(endProps);
      const aroundPosition = startViewport.unproject(around);
      result.start.around = around;
      Object.assign(result.end, {
        around: endViewport.project(aroundPosition),
        aroundPosition,
        width: endProps.width,
        height: endProps.height
      });
    }

    return result;
  }

  interpolateProps(startProps, endProps, t) {
    const propsInTransition = {};

    for (const key of this._propsToExtract) {
      propsInTransition[key] = lerp(startProps[key] || 0, endProps[key] || 0, t);
    }

    if (endProps.aroundPosition) {
      const viewport = this.opts.makeViewport({ ...endProps,
        ...propsInTransition
      });
      Object.assign(propsInTransition, viewport.panByPosition(endProps.aroundPosition, lerp(startProps.around, endProps.around, t)));
    }

    return propsInTransition;
  }

}

const NO_TRANSITION_PROPS = {
  transitionDuration: 0
};
const LINEAR_TRANSITION_PROPS = {
  transitionDuration: 300,
  transitionEasing: t => t,
  transitionInterruption: TRANSITION_EVENTS.BREAK
};
const DEFAULT_INERTIA = 300;

const INERTIA_EASING = t => 1 - (1 - t) * (1 - t);

const EVENT_TYPES = {
  WHEEL: ['wheel'],
  PAN: ['panstart', 'panmove', 'panend'],
  PINCH: ['pinchstart', 'pinchmove', 'pinchend'],
  TRIPLE_PAN: ['tripanstart', 'tripanmove', 'tripanend'],
  DOUBLE_TAP: ['doubletap'],
  KEYBOARD: ['keydown']
};
class Controller {
  constructor(ControllerState) {
    let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    this.ControllerState = ControllerState;
    this.controllerState = null;
    this.controllerStateProps = null;
    this.eventManager = null;
    this.transitionManager = new TransitionManager(ControllerState, { ...options,
      onViewStateChange: this._onTransition.bind(this),
      onStateChange: this._setInteractionState.bind(this)
    });
    const linearTransitionProps = this.linearTransitionProps;
    this._transition = linearTransitionProps && { ...LINEAR_TRANSITION_PROPS,
      transitionInterpolator: new LinearInterpolator({
        transitionProps: linearTransitionProps
      })
    };
    this._events = null;
    this._interactionState = {
      isDragging: false
    };
    this._customEvents = [];
    this.onViewStateChange = null;
    this.onStateChange = null;
    this.handleEvent = this.handleEvent.bind(this);
    this.setProps(options);
  }

  get linearTransitionProps() {
    return null;
  }

  set events(customEvents) {
    this.toggleEvents(this._customEvents, false);
    this.toggleEvents(customEvents, true);
    this._customEvents = customEvents;
    this.setProps(this.controllerStateProps);
  }

  finalize() {
    for (const eventName in this._events) {
      if (this._events[eventName]) {
        this.eventManager.off(eventName, this.handleEvent);
      }
    }

    this.transitionManager.finalize();
  }

  handleEvent(event) {
    const {
      ControllerState
    } = this;
    this.controllerState = new ControllerState({
      makeViewport: this.makeViewport,
      ...this.controllerStateProps,
      ...this._state
    });
    const eventStartBlocked = this._eventStartBlocked;

    switch (event.type) {
      case 'panstart':
        return eventStartBlocked ? false : this._onPanStart(event);

      case 'panmove':
        return this._onPan(event);

      case 'panend':
        return this._onPanEnd(event);

      case 'pinchstart':
        return eventStartBlocked ? false : this._onPinchStart(event);

      case 'pinchmove':
        return this._onPinch(event);

      case 'pinchend':
        return this._onPinchEnd(event);

      case 'tripanstart':
        return eventStartBlocked ? false : this._onTriplePanStart(event);

      case 'tripanmove':
        return this._onTriplePan(event);

      case 'tripanend':
        return this._onTriplePanEnd(event);

      case 'doubletap':
        return this._onDoubleTap(event);

      case 'wheel':
        return this._onWheel(event);

      case 'keydown':
        return this._onKeyDown(event);

      default:
        return false;
    }
  }

  getCenter(event) {
    const {
      x,
      y
    } = this.controllerStateProps;
    const {
      offsetCenter
    } = event;
    return [offsetCenter.x - x, offsetCenter.y - y];
  }

  isPointInBounds(pos, event) {
    const {
      width,
      height
    } = this.controllerStateProps;

    if (event && event.handled) {
      return false;
    }

    const inside = pos[0] >= 0 && pos[0] <= width && pos[1] >= 0 && pos[1] <= height;

    if (inside && event) {
      event.stopPropagation();
    }

    return inside;
  }

  isFunctionKeyPressed(event) {
    const {
      srcEvent
    } = event;
    return Boolean(srcEvent.metaKey || srcEvent.altKey || srcEvent.ctrlKey || srcEvent.shiftKey);
  }

  isDragging() {
    return this._interactionState.isDragging;
  }

  blockEvents(timeout) {
    const timer = setTimeout(() => {
      if (this._eventStartBlocked === timer) {
        this._eventStartBlocked = null;
      }
    }, timeout);
    this._eventStartBlocked = timer;
  }

  setProps(props) {
    if ('onViewStateChange' in props) {
      this.onViewStateChange = props.onViewStateChange;
    }

    if ('onStateChange' in props) {
      this.onStateChange = props.onStateChange;
    }

    if ('makeViewport' in props) {
      this.makeViewport = props.makeViewport;
    }

    if ('dragMode' in props) {
      this.dragMode = props.dragMode;
    }

    this.controllerStateProps = props;

    if ('eventManager' in props && this.eventManager !== props.eventManager) {
      this.eventManager = props.eventManager;
      this._events = {};
      this.toggleEvents(this._customEvents, true);
    }

    if (!('transitionInterpolator' in props)) {
      props.transitionInterpolator = this._getTransitionProps().transitionInterpolator;
    }

    this.transitionManager.processViewStateChange(props);
    let {
      inertia
    } = props;

    if (inertia === true) {
      inertia = DEFAULT_INERTIA;
    }

    this.inertia = inertia;
    const {
      scrollZoom = true,
      dragPan = true,
      dragRotate = true,
      doubleClickZoom = true,
      touchZoom = true,
      touchRotate = false,
      keyboard = true
    } = props;
    const isInteractive = Boolean(this.onViewStateChange);
    this.toggleEvents(EVENT_TYPES.WHEEL, isInteractive && scrollZoom);
    this.toggleEvents(EVENT_TYPES.PAN, isInteractive && (dragPan || dragRotate));
    this.toggleEvents(EVENT_TYPES.PINCH, isInteractive && (touchZoom || touchRotate));
    this.toggleEvents(EVENT_TYPES.TRIPLE_PAN, isInteractive && touchRotate);
    this.toggleEvents(EVENT_TYPES.DOUBLE_TAP, isInteractive && doubleClickZoom);
    this.toggleEvents(EVENT_TYPES.KEYBOARD, isInteractive && keyboard);
    this.scrollZoom = scrollZoom;
    this.dragPan = dragPan;
    this.dragRotate = dragRotate;
    this.doubleClickZoom = doubleClickZoom;
    this.touchZoom = touchZoom;
    this.touchRotate = touchRotate;
    this.keyboard = keyboard;
  }

  updateTransition() {
    this.transitionManager.updateTransition();
  }

  toggleEvents(eventNames, enabled) {
    if (this.eventManager) {
      eventNames.forEach(eventName => {
        if (this._events[eventName] !== enabled) {
          this._events[eventName] = enabled;

          if (enabled) {
            this.eventManager.on(eventName, this.handleEvent);
          } else {
            this.eventManager.off(eventName, this.handleEvent);
          }
        }
      });
    }
  }

  updateViewport(newControllerState) {
    let extraProps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    let interactionState = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    const viewState = { ...newControllerState.getViewportProps(),
      ...extraProps
    };
    const changed = this.controllerState !== newControllerState;
    this._state = newControllerState.getState();

    this._setInteractionState(interactionState);

    if (changed) {
      const oldViewState = this.controllerState ? this.controllerState.getViewportProps() : null;

      if (this.onViewStateChange) {
        this.onViewStateChange({
          viewState,
          interactionState: this._interactionState,
          oldViewState
        });
      }
    }
  }

  _onTransition(params) {
    if (this.onViewStateChange) {
      params.interactionState = this._interactionState;
      this.onViewStateChange(params);
    }
  }

  _setInteractionState(newStates) {
    Object.assign(this._interactionState, newStates);

    if (this.onStateChange) {
      this.onStateChange(this._interactionState);
    }
  }

  _onPanStart(event) {
    const pos = this.getCenter(event);

    if (!this.isPointInBounds(pos, event)) {
      return false;
    }

    let alternateMode = this.isFunctionKeyPressed(event) || event.rightButton;

    if (this.invertPan || this.dragMode === 'pan') {
      alternateMode = !alternateMode;
    }

    const newControllerState = this.controllerState[alternateMode ? 'panStart' : 'rotateStart']({
      pos
    });
    this._panMove = alternateMode;
    this.updateViewport(newControllerState, NO_TRANSITION_PROPS, {
      isDragging: true
    });
    return true;
  }

  _onPan(event) {
    if (!this.isDragging()) {
      return false;
    }

    return this._panMove ? this._onPanMove(event) : this._onPanRotate(event);
  }

  _onPanEnd(event) {
    if (!this.isDragging()) {
      return false;
    }

    return this._panMove ? this._onPanMoveEnd(event) : this._onPanRotateEnd(event);
  }

  _onPanMove(event) {
    if (!this.dragPan) {
      return false;
    }

    const pos = this.getCenter(event);
    const newControllerState = this.controllerState.pan({
      pos
    });
    this.updateViewport(newControllerState, NO_TRANSITION_PROPS, {
      isDragging: true,
      isPanning: true
    });
    return true;
  }

  _onPanMoveEnd(event) {
    const {
      inertia
    } = this;

    if (this.dragPan && inertia && event.velocity) {
      const pos = this.getCenter(event);
      const endPos = [pos[0] + event.velocityX * inertia / 2, pos[1] + event.velocityY * inertia / 2];
      const newControllerState = this.controllerState.pan({
        pos: endPos
      }).panEnd();
      this.updateViewport(newControllerState, { ...this._getTransitionProps(),
        transitionDuration: inertia,
        transitionEasing: INERTIA_EASING
      }, {
        isDragging: false,
        isPanning: true
      });
    } else {
      const newControllerState = this.controllerState.panEnd();
      this.updateViewport(newControllerState, null, {
        isDragging: false,
        isPanning: false
      });
    }

    return true;
  }

  _onPanRotate(event) {
    if (!this.dragRotate) {
      return false;
    }

    const pos = this.getCenter(event);
    const newControllerState = this.controllerState.rotate({
      pos
    });
    this.updateViewport(newControllerState, NO_TRANSITION_PROPS, {
      isDragging: true,
      isRotating: true
    });
    return true;
  }

  _onPanRotateEnd(event) {
    const {
      inertia
    } = this;

    if (this.dragRotate && inertia && event.velocity) {
      const pos = this.getCenter(event);
      const endPos = [pos[0] + event.velocityX * inertia / 2, pos[1] + event.velocityY * inertia / 2];
      const newControllerState = this.controllerState.rotate({
        pos: endPos
      }).rotateEnd();
      this.updateViewport(newControllerState, { ...this._getTransitionProps(),
        transitionDuration: inertia,
        transitionEasing: INERTIA_EASING
      }, {
        isDragging: false,
        isRotating: true
      });
    } else {
      const newControllerState = this.controllerState.rotateEnd();
      this.updateViewport(newControllerState, null, {
        isDragging: false,
        isRotating: false
      });
    }

    return true;
  }

  _onWheel(event) {
    if (!this.scrollZoom) {
      return false;
    }

    event.preventDefault();
    const pos = this.getCenter(event);

    if (!this.isPointInBounds(pos, event)) {
      return false;
    }

    const {
      speed = 0.01,
      smooth = false
    } = this.scrollZoom;
    const {
      delta
    } = event;
    let scale = 2 / (1 + Math.exp(-Math.abs(delta * speed)));

    if (delta < 0 && scale !== 0) {
      scale = 1 / scale;
    }

    const newControllerState = this.controllerState.zoom({
      pos,
      scale
    });
    this.updateViewport(newControllerState, { ...this._getTransitionProps({
        around: pos
      }),
      transitionDuration: smooth ? 250 : 1
    }, {
      isZooming: true,
      isPanning: true
    });
    return true;
  }

  _onTriplePanStart(event) {
    const pos = this.getCenter(event);

    if (!this.isPointInBounds(pos, event)) {
      return false;
    }

    const newControllerState = this.controllerState.rotateStart({
      pos
    });
    this.updateViewport(newControllerState, NO_TRANSITION_PROPS, {
      isDragging: true
    });
    return true;
  }

  _onTriplePan(event) {
    if (!this.touchRotate) {
      return false;
    }

    if (!this.isDragging()) {
      return false;
    }

    const pos = this.getCenter(event);
    pos[0] -= event.deltaX;
    const newControllerState = this.controllerState.rotate({
      pos
    });
    this.updateViewport(newControllerState, NO_TRANSITION_PROPS, {
      isDragging: true,
      isRotating: true
    });
    return true;
  }

  _onTriplePanEnd(event) {
    if (!this.isDragging()) {
      return false;
    }

    const {
      inertia
    } = this;

    if (this.touchRotate && inertia && event.velocityY) {
      const pos = this.getCenter(event);
      const endPos = [pos[0], pos[1] += event.velocityY * inertia / 2];
      const newControllerState = this.controllerState.rotate({
        pos: endPos
      });
      this.updateViewport(newControllerState, { ...this._getTransitionProps(),
        transitionDuration: inertia,
        transitionEasing: INERTIA_EASING
      }, {
        isDragging: false,
        isRotating: true
      });
      this.blockEvents(inertia);
    } else {
      const newControllerState = this.controllerState.rotateEnd();
      this.updateViewport(newControllerState, null, {
        isDragging: false,
        isRotating: false
      });
    }

    return true;
  }

  _onPinchStart(event) {
    const pos = this.getCenter(event);

    if (!this.isPointInBounds(pos, event)) {
      return false;
    }

    const newControllerState = this.controllerState.zoomStart({
      pos
    }).rotateStart({
      pos
    });
    this._startPinchRotation = event.rotation;
    this._lastPinchEvent = event;
    this.updateViewport(newControllerState, NO_TRANSITION_PROPS, {
      isDragging: true
    });
    return true;
  }

  _onPinch(event) {
    if (!this.touchZoom && !this.touchRotate) {
      return false;
    }

    if (!this.isDragging()) {
      return false;
    }

    let newControllerState = this.controllerState;

    if (this.touchZoom) {
      const {
        scale
      } = event;
      const pos = this.getCenter(event);
      newControllerState = newControllerState.zoom({
        pos,
        scale
      });
    }

    if (this.touchRotate) {
      const {
        rotation
      } = event;
      newControllerState = newControllerState.rotate({
        deltaAngleX: this._startPinchRotation - rotation
      });
    }

    this.updateViewport(newControllerState, NO_TRANSITION_PROPS, {
      isDragging: true,
      isPanning: this.touchZoom,
      isZooming: this.touchZoom,
      isRotating: this.touchRotate
    });
    this._lastPinchEvent = event;
    return true;
  }

  _onPinchEnd(event) {
    if (!this.isDragging()) {
      return false;
    }

    const {
      inertia,
      _lastPinchEvent
    } = this;

    if (this.touchZoom && inertia && _lastPinchEvent && event.scale !== _lastPinchEvent.scale) {
      const pos = this.getCenter(event);
      let newControllerState = this.controllerState.rotateEnd();
      const z = Math.log2(event.scale);

      const velocityZ = (z - Math.log2(_lastPinchEvent.scale)) / (event.deltaTime - _lastPinchEvent.deltaTime);

      const endScale = Math.pow(2, z + velocityZ * inertia / 2);
      newControllerState = newControllerState.zoom({
        pos,
        scale: endScale
      }).zoomEnd();
      this.updateViewport(newControllerState, { ...this._getTransitionProps({
          around: pos
        }),
        transitionDuration: inertia,
        transitionEasing: INERTIA_EASING
      }, {
        isDragging: false,
        isPanning: this.touchZoom,
        isZooming: this.touchZoom,
        isRotating: false
      });
      this.blockEvents(inertia);
    } else {
      const newControllerState = this.controllerState.zoomEnd().rotateEnd();
      this.updateViewport(newControllerState, null, {
        isDragging: false,
        isPanning: false,
        isZooming: false,
        isRotating: false
      });
    }

    this._startPinchRotation = null;
    this._lastPinchEvent = null;
    return true;
  }

  _onDoubleTap(event) {
    if (!this.doubleClickZoom) {
      return false;
    }

    const pos = this.getCenter(event);

    if (!this.isPointInBounds(pos, event)) {
      return false;
    }

    const isZoomOut = this.isFunctionKeyPressed(event);
    const newControllerState = this.controllerState.zoom({
      pos,
      scale: isZoomOut ? 0.5 : 2
    });
    this.updateViewport(newControllerState, this._getTransitionProps({
      around: pos
    }), {
      isZooming: true,
      isPanning: true
    });
    this.blockEvents(100);
    return true;
  }

  _onKeyDown(event) {
    if (!this.keyboard) {
      return false;
    }

    const funcKey = this.isFunctionKeyPressed(event);
    const {
      zoomSpeed,
      moveSpeed,
      rotateSpeedX,
      rotateSpeedY
    } = this.keyboard;
    const {
      controllerState
    } = this;
    let newControllerState;
    const interactionState = {};

    switch (event.srcEvent.code) {
      case 'Minus':
        newControllerState = funcKey ? controllerState.zoomOut(zoomSpeed).zoomOut(zoomSpeed) : controllerState.zoomOut(zoomSpeed);
        interactionState.isZooming = true;
        break;

      case 'Equal':
        newControllerState = funcKey ? controllerState.zoomIn(zoomSpeed).zoomIn(zoomSpeed) : controllerState.zoomIn(zoomSpeed);
        interactionState.isZooming = true;
        break;

      case 'ArrowLeft':
        if (funcKey) {
          newControllerState = controllerState.rotateLeft(rotateSpeedX);
          interactionState.isRotating = true;
        } else {
          newControllerState = controllerState.moveLeft(moveSpeed);
          interactionState.isPanning = true;
        }

        break;

      case 'ArrowRight':
        if (funcKey) {
          newControllerState = controllerState.rotateRight(rotateSpeedX);
          interactionState.isRotating = true;
        } else {
          newControllerState = controllerState.moveRight(moveSpeed);
          interactionState.isPanning = true;
        }

        break;

      case 'ArrowUp':
        if (funcKey) {
          newControllerState = controllerState.rotateUp(rotateSpeedY);
          interactionState.isRotating = true;
        } else {
          newControllerState = controllerState.moveUp(moveSpeed);
          interactionState.isPanning = true;
        }

        break;

      case 'ArrowDown':
        if (funcKey) {
          newControllerState = controllerState.rotateDown(rotateSpeedY);
          interactionState.isRotating = true;
        } else {
          newControllerState = controllerState.moveDown(moveSpeed);
          interactionState.isPanning = true;
        }

        break;

      default:
        return false;
    }

    this.updateViewport(newControllerState, this._getTransitionProps(), interactionState);
    return true;
  }

  _getTransitionProps(opts) {
    const {
      _transition
    } = this;

    if (!_transition) {
      return NO_TRANSITION_PROPS;
    }

    return opts ? { ..._transition,
      transitionInterpolator: new LinearInterpolator({ ...opts,
        transitionProps: this.linearTransitionProps,
        makeViewport: this.controllerState.makeViewport
      })
    } : _transition;
  }

}

class ViewState {
  constructor(opts) {
    this._viewportProps = this._applyConstraints(opts);
  }

  getViewportProps() {
    return this._viewportProps;
  }

  getState() {
    return this._state;
  }

  shortestPathFrom(viewState) {
    return this._viewportProps;
  }

  _applyConstraints(props) {
    return props;
  }

}

export { Controller as C, ViewState as V, View as a, deepEqual as d };
