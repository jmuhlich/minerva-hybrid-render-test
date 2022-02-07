import { V as ViewState, C as Controller, a as View } from '../common/view-state-bedbebfe.js';
import { c as clamp, m as mod, M as Matrix4, V as Viewport, p as pixelsToWorld, a as add, n as negate } from '../common/transition-e4288157.js';
import '../common/log-2130d917.js';
import '../common/process-2545f00a.js';

const DEFAULT_STATE = {
  rotationX: 0,
  rotationOrbit: 0,
  zoom: 0,
  target: [0, 0, 0],
  minRotationX: -90,
  maxRotationX: 90,
  minZoom: -Infinity,
  maxZoom: Infinity
};
class OrbitState extends ViewState {
  constructor(_ref) {
    let {
      makeViewport,
      width,
      height,
      rotationX = DEFAULT_STATE.rotationX,
      rotationOrbit = DEFAULT_STATE.rotationOrbit,
      target = DEFAULT_STATE.target,
      zoom = DEFAULT_STATE.zoom,
      minRotationX = DEFAULT_STATE.minRotationX,
      maxRotationX = DEFAULT_STATE.maxRotationX,
      minZoom = DEFAULT_STATE.minZoom,
      maxZoom = DEFAULT_STATE.maxZoom,
      startPanPosition,
      startRotatePos,
      startRotationX,
      startRotationOrbit,
      startZoomPosition,
      startZoom
    } = _ref;
    super({
      width,
      height,
      rotationX,
      rotationOrbit,
      target,
      zoom,
      minRotationX,
      maxRotationX,
      minZoom,
      maxZoom
    });
    this._state = {
      startPanPosition,
      startRotatePos,
      startRotationX,
      startRotationOrbit,
      startZoomPosition,
      startZoom
    };
    this.makeViewport = makeViewport;
  }

  panStart(_ref2) {
    let {
      pos
    } = _ref2;
    return this._getUpdatedState({
      startPanPosition: this._unproject(pos)
    });
  }

  pan(_ref3) {
    let {
      pos,
      startPosition
    } = _ref3;
    const startPanPosition = this._state.startPanPosition || startPosition;

    if (!startPanPosition) {
      return this;
    }

    const viewport = this.makeViewport(this._viewportProps);
    const newProps = viewport.panByPosition(startPanPosition, pos);
    return this._getUpdatedState(newProps);
  }

  panEnd() {
    return this._getUpdatedState({
      startPanPosition: null
    });
  }

  rotateStart(_ref4) {
    let {
      pos
    } = _ref4;
    return this._getUpdatedState({
      startRotatePos: pos,
      startRotationX: this._viewportProps.rotationX,
      startRotationOrbit: this._viewportProps.rotationOrbit
    });
  }

  rotate(_ref5) {
    let {
      pos,
      deltaAngleX = 0,
      deltaAngleY = 0
    } = _ref5;
    const {
      startRotatePos,
      startRotationX,
      startRotationOrbit
    } = this._state;
    const {
      width,
      height
    } = this._viewportProps;

    if (!startRotatePos || !Number.isFinite(startRotationX) || !Number.isFinite(startRotationOrbit)) {
      return this;
    }

    let newRotation;

    if (pos) {
      let deltaScaleX = (pos[0] - startRotatePos[0]) / width;
      const deltaScaleY = (pos[1] - startRotatePos[1]) / height;

      if (startRotationX < -90 || startRotationX > 90) {
        deltaScaleX *= -1;
      }

      newRotation = {
        rotationX: startRotationX + deltaScaleY * 180,
        rotationOrbit: startRotationOrbit + deltaScaleX * 180
      };
    } else {
      newRotation = {
        rotationX: startRotationX + deltaAngleY,
        rotationOrbit: startRotationOrbit + deltaAngleX
      };
    }

    return this._getUpdatedState(newRotation);
  }

  rotateEnd() {
    return this._getUpdatedState({
      startRotationX: null,
      startRotationOrbit: null
    });
  }

  shortestPathFrom(viewState) {
    const fromProps = viewState.getViewportProps();
    const props = { ...this._viewportProps
    };
    const {
      rotationOrbit
    } = props;

    if (Math.abs(rotationOrbit - fromProps.rotationOrbit) > 180) {
      props.rotationOrbit = rotationOrbit < 0 ? rotationOrbit + 360 : rotationOrbit - 360;
    }

    return props;
  }

  zoomStart(_ref6) {
    let {
      pos
    } = _ref6;
    return this._getUpdatedState({
      startZoomPosition: this._unproject(pos),
      startZoom: this._viewportProps.zoom
    });
  }

  zoom(_ref7) {
    let {
      pos,
      startPos,
      scale
    } = _ref7;
    const {
      zoom
    } = this._viewportProps;
    let {
      startZoom,
      startZoomPosition
    } = this._state;

    if (!Number.isFinite(startZoom)) {
      startZoom = zoom;
      startZoomPosition = this._unproject(startPos) || this._unproject(pos);
    }

    const newZoom = this._calculateNewZoom({
      scale,
      startZoom
    });

    const zoomedViewport = this.makeViewport({ ...this._viewportProps,
      zoom: newZoom
    });
    return this._getUpdatedState({
      zoom: newZoom,
      ...zoomedViewport.panByPosition(startZoomPosition, pos)
    });
  }

  zoomEnd() {
    return this._getUpdatedState({
      startZoomPosition: null,
      startZoom: null
    });
  }

  zoomIn() {
    let speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 2;
    return this._getUpdatedState({
      zoom: this._calculateNewZoom({
        scale: speed
      })
    });
  }

  zoomOut() {
    let speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 2;
    return this._getUpdatedState({
      zoom: this._calculateNewZoom({
        scale: 1 / speed
      })
    });
  }

  moveLeft() {
    let speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 50;
    return this._panFromCenter([-speed, 0]);
  }

  moveRight() {
    let speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 50;
    return this._panFromCenter([speed, 0]);
  }

  moveUp() {
    let speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 50;
    return this._panFromCenter([0, -speed]);
  }

  moveDown() {
    let speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 50;
    return this._panFromCenter([0, speed]);
  }

  rotateLeft() {
    let speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 15;
    return this._getUpdatedState({
      rotationOrbit: this._viewportProps.rotationOrbit - speed
    });
  }

  rotateRight() {
    let speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 15;
    return this._getUpdatedState({
      rotationOrbit: this._viewportProps.rotationOrbit + speed
    });
  }

  rotateUp() {
    let speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 10;
    return this._getUpdatedState({
      rotationX: this._viewportProps.rotationX - speed
    });
  }

  rotateDown() {
    let speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 10;
    return this._getUpdatedState({
      rotationX: this._viewportProps.rotationX + speed
    });
  }

  _unproject(pos) {
    const viewport = this.makeViewport(this._viewportProps);
    return pos && viewport.unproject(pos);
  }

  _calculateNewZoom(_ref8) {
    let {
      scale,
      startZoom
    } = _ref8;
    const {
      maxZoom,
      minZoom
    } = this._viewportProps;

    if (!Number.isFinite(startZoom)) {
      startZoom = this._viewportProps.zoom;
    }

    const zoom = startZoom + Math.log2(scale);
    return clamp(zoom, minZoom, maxZoom);
  }

  _panFromCenter(offset) {
    const {
      width,
      height,
      target
    } = this._viewportProps;
    return this.pan({
      startPosition: target,
      pos: [width / 2 + offset[0], height / 2 + offset[1]]
    });
  }

  _getUpdatedState(newProps) {
    return new this.constructor({ ...this._viewportProps,
      ...this._state,
      ...newProps
    });
  }

  _applyConstraints(props) {
    const {
      maxZoom,
      minZoom,
      zoom,
      maxRotationX,
      minRotationX,
      rotationOrbit
    } = props;
    props.zoom = clamp(zoom, minZoom, maxZoom);
    props.rotationX = clamp(props.rotationX, minRotationX, maxRotationX);

    if (rotationOrbit < -180 || rotationOrbit > 180) {
      props.rotationOrbit = mod(rotationOrbit + 180, 360) - 180;
    }

    return props;
  }

}

class OrthographicState extends OrbitState {
  constructor(props) {
    super(props);
    this.zoomAxis = props.zoomAxis || 'all';
  }

  _applyConstraints(props) {
    const {
      maxZoom,
      minZoom,
      zoom
    } = props;
    props.zoom = Array.isArray(zoom) ? [clamp(zoom[0], minZoom, maxZoom), clamp(zoom[1], minZoom, maxZoom)] : clamp(zoom, minZoom, maxZoom);
    return props;
  }

  _calculateNewZoom(_ref) {
    let {
      scale,
      startZoom
    } = _ref;
    const {
      maxZoom,
      minZoom
    } = this._viewportProps;

    if (!startZoom && startZoom !== 0) {
      startZoom = this._viewportProps.zoom;
    }

    let deltaZoom = Math.log2(scale);

    if (Array.isArray(startZoom)) {
      let [newZoomX, newZoomY] = startZoom;

      switch (this.zoomAxis) {
        case 'X':
          newZoomX = clamp(newZoomX + deltaZoom, minZoom, maxZoom);
          break;

        case 'Y':
          newZoomY = clamp(newZoomY + deltaZoom, minZoom, maxZoom);
          break;

        default:
          let z = Math.min(newZoomX + deltaZoom, newZoomY + deltaZoom);

          if (z < minZoom) {
            deltaZoom += minZoom - z;
          }

          z = Math.max(newZoomX + deltaZoom, newZoomY + deltaZoom);

          if (z > maxZoom) {
            deltaZoom += maxZoom - z;
          }

          newZoomX += deltaZoom;
          newZoomY += deltaZoom;
      }

      return [newZoomX, newZoomY];
    }

    return clamp(startZoom + deltaZoom, minZoom, maxZoom);
  }

}

class OrthographicController extends Controller {
  constructor(props) {
    props.dragMode = props.dragMode || 'pan';
    super(OrthographicState, props);
  }

  _onPanRotate(event) {
    return false;
  }

  get linearTransitionProps() {
    return ['target', 'zoom'];
  }

}

const viewMatrix = new Matrix4().lookAt({
  eye: [0, 0, 1]
});

function getProjectionMatrix(_ref) {
  let {
    width,
    height,
    near,
    far
  } = _ref;
  width = width || 1;
  height = height || 1;
  return new Matrix4().ortho({
    left: -width / 2,
    right: width / 2,
    bottom: -height / 2,
    top: height / 2,
    near,
    far
  });
}

class OrthographicViewport extends Viewport {
  constructor(props) {
    const {
      width,
      height,
      near = 0.1,
      far = 1000,
      zoom = 0,
      target = [0, 0, 0],
      flipY = true
    } = props;
    const zoomX = Array.isArray(zoom) ? zoom[0] : zoom;
    const zoomY = Array.isArray(zoom) ? zoom[1] : zoom;
    const zoom_ = Math.min(zoomX, zoomY);
    const scale = Math.pow(2, zoom_);
    let distanceScales;

    if (zoomX !== zoomY) {
      const scaleX = Math.pow(2, zoomX);
      const scaleY = Math.pow(2, zoomY);
      distanceScales = {
        unitsPerMeter: [scaleX / scale, scaleY / scale, 1],
        metersPerUnit: [scale / scaleX, scale / scaleY, 1]
      };
    }

    super({ ...props,
      longitude: null,
      position: target,
      viewMatrix: viewMatrix.clone().scale([scale, scale * (flipY ? -1 : 1), scale]),
      projectionMatrix: getProjectionMatrix({
        width,
        height,
        near,
        far
      }),
      zoom: zoom_,
      distanceScales
    });
  }

  projectFlat(_ref2) {
    let [X, Y] = _ref2;
    const {
      unitsPerMeter
    } = this.distanceScales;
    return [X * unitsPerMeter[0], Y * unitsPerMeter[1]];
  }

  unprojectFlat(_ref3) {
    let [x, y] = _ref3;
    const {
      metersPerUnit
    } = this.distanceScales;
    return [x * metersPerUnit[0], y * metersPerUnit[1]];
  }

  panByPosition(coords, pixel) {
    const fromLocation = pixelsToWorld(pixel, this.pixelUnprojectionMatrix);
    const toLocation = this.projectFlat(coords);
    const translate = add([], toLocation, negate([], fromLocation));
    const newCenter = add([], this.center, translate);
    return {
      target: this.unprojectFlat(newCenter)
    };
  }

}

class OrthographicView extends View {
  constructor(props) {
    super({ ...props,
      type: OrthographicViewport
    });
  }

  get controller() {
    return this._getControllerProps({
      type: OrthographicController
    });
  }

}
OrthographicView.displayName = 'OrthographicView';

export { OrthographicView };
