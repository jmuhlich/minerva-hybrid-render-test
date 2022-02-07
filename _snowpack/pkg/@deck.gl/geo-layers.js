import { A as ARRAY_TYPE, d as Matrix, v as vec4_transformMat3, t as transformMat3, f as transformMat3$1, g as checkVector, h as deprecated, i as add$1, s as scale$2, j as dot$1, k as lerp$1, o as length$1, q as squaredLength$1, r as create$2, u as fromValues, w as dot$2, x as cross, y as len, z as normalize$2, E as EPSILON, B as normalize$3, C as MathArray, D as checkNumber, F as assert, G as transformQuat, H as defaultTypedArrayManager, b as assert$1, U as UNIT, I as log, J as COORDINATE_SYSTEM, K as Vector3, L as getScaling, e as equals$1, N as lngLatToWorld, M as Matrix4 } from '../common/transition-e4288157.js';
import { _ as _defineProperty } from '../common/log-2130d917.js';
import { S as Stats, L as Layer, f as flatten, d as debug, g as getAccessorFromBuffer, c as createIterable, B as Buffer, T as Texture2D, a as cloneTextureFrom, b as copyToTexture, M as Model, h as hasFeatures, F as FEATURES } from '../common/layer-edaf1562.js';
import { l as load } from '../common/load-4b03c340.js';
import { I as ImageLoader } from '../common/image-loader-08ad3e29.js';
import { p as project32, a as picking, G as Geometry } from '../common/picking-e2bc8da0.js';
import '../common/process-2545f00a.js';
import '../common/globals-76d38a77.js';

const STAT_QUEUED_REQUESTS = 'Queued Requests';
const STAT_ACTIVE_REQUESTS = 'Active Requests';
const STAT_CANCELLED_REQUESTS = 'Cancelled Requests';
const STAT_QUEUED_REQUESTS_EVER = 'Queued Requests Ever';
const STAT_ACTIVE_REQUESTS_EVER = 'Active Requests Ever';
const DEFAULT_PROPS = {
  id: 'request-scheduler',
  throttleRequests: true,
  maxRequests: 6
};
class RequestScheduler {
  constructor(props = {}) {
    _defineProperty(this, "props", void 0);

    _defineProperty(this, "stats", void 0);

    _defineProperty(this, "activeRequestCount", 0);

    _defineProperty(this, "requestQueue", []);

    _defineProperty(this, "requestMap", new Map());

    _defineProperty(this, "deferredUpdate", null);

    this.props = { ...DEFAULT_PROPS,
      ...props
    };
    this.stats = new Stats({
      id: this.props.id
    });
    this.stats.get(STAT_QUEUED_REQUESTS);
    this.stats.get(STAT_ACTIVE_REQUESTS);
    this.stats.get(STAT_CANCELLED_REQUESTS);
    this.stats.get(STAT_QUEUED_REQUESTS_EVER);
    this.stats.get(STAT_ACTIVE_REQUESTS_EVER);
  }

  scheduleRequest(handle, getPriority = () => 0) {
    if (!this.props.throttleRequests) {
      return Promise.resolve({
        done: () => {}
      });
    }

    if (this.requestMap.has(handle)) {
      return this.requestMap.get(handle);
    }

    const request = {
      handle,
      priority: 0,
      getPriority
    };
    const promise = new Promise(resolve => {
      request.resolve = resolve;
      return request;
    });
    this.requestQueue.push(request);
    this.requestMap.set(handle, promise);

    this._issueNewRequests();

    return promise;
  }

  _issueRequest(request) {
    const {
      handle,
      resolve
    } = request;
    let isDone = false;

    const done = () => {
      if (!isDone) {
        isDone = true;
        this.requestMap.delete(handle);
        this.activeRequestCount--;

        this._issueNewRequests();
      }
    };

    this.activeRequestCount++;
    return resolve ? resolve({
      done
    }) : Promise.resolve({
      done
    });
  }

  _issueNewRequests() {
    if (!this.deferredUpdate) {
      this.deferredUpdate = setTimeout(() => this._issueNewRequestsAsync(), 0);
    }
  }

  _issueNewRequestsAsync() {
    this.deferredUpdate = null;
    const freeSlots = Math.max(this.props.maxRequests - this.activeRequestCount, 0);

    if (freeSlots === 0) {
      return;
    }

    this._updateAllRequests();

    for (let i = 0; i < freeSlots; ++i) {
      const request = this.requestQueue.shift();

      if (request) {
        this._issueRequest(request);
      }
    }
  }

  _updateAllRequests() {
    const requestQueue = this.requestQueue;

    for (let i = 0; i < requestQueue.length; ++i) {
      const request = requestQueue[i];

      if (!this._updateRequest(request)) {
        requestQueue.splice(i, 1);
        this.requestMap.delete(request.handle);
        i--;
      }
    }

    requestQueue.sort((a, b) => a.priority - b.priority);
  }

  _updateRequest(request) {
    request.priority = request.getPriority(request.handle);

    if (request.priority < 0) {
      request.resolve(null);
      return false;
    }

    return true;
  }

}

/**
 * 3x3 Matrix
 * @module mat3
 */

/**
 * Creates a new identity mat3
 *
 * @returns {mat3} a new 3x3 matrix
 */

function create$1() {
  var out = new ARRAY_TYPE(9);

  if (ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
  }

  out[0] = 1;
  out[4] = 1;
  out[8] = 1;
  return out;
}
/**
 * Transpose the values of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the source matrix
 * @returns {mat3} out
 */

function transpose(out, a) {
  // If we are transposing ourselves we can skip a few steps but have to cache some values
  if (out === a) {
    var a01 = a[1],
        a02 = a[2],
        a12 = a[5];
    out[1] = a[3];
    out[2] = a[6];
    out[3] = a01;
    out[5] = a[7];
    out[6] = a02;
    out[7] = a12;
  } else {
    out[0] = a[0];
    out[1] = a[3];
    out[2] = a[6];
    out[3] = a[1];
    out[4] = a[4];
    out[5] = a[7];
    out[6] = a[2];
    out[7] = a[5];
    out[8] = a[8];
  }

  return out;
}
/**
 * Inverts a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the source matrix
 * @returns {mat3} out
 */

function invert$1(out, a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2];
  var a10 = a[3],
      a11 = a[4],
      a12 = a[5];
  var a20 = a[6],
      a21 = a[7],
      a22 = a[8];
  var b01 = a22 * a11 - a12 * a21;
  var b11 = -a22 * a10 + a12 * a20;
  var b21 = a21 * a10 - a11 * a20; // Calculate the determinant

  var det = a00 * b01 + a01 * b11 + a02 * b21;

  if (!det) {
    return null;
  }

  det = 1.0 / det;
  out[0] = b01 * det;
  out[1] = (-a22 * a01 + a02 * a21) * det;
  out[2] = (a12 * a01 - a02 * a11) * det;
  out[3] = b11 * det;
  out[4] = (a22 * a00 - a02 * a20) * det;
  out[5] = (-a12 * a00 + a02 * a10) * det;
  out[6] = b21 * det;
  out[7] = (-a21 * a00 + a01 * a20) * det;
  out[8] = (a11 * a00 - a01 * a10) * det;
  return out;
}
/**
 * Calculates the determinant of a mat3
 *
 * @param {ReadonlyMat3} a the source matrix
 * @returns {Number} determinant of a
 */

function determinant(a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2];
  var a10 = a[3],
      a11 = a[4],
      a12 = a[5];
  var a20 = a[6],
      a21 = a[7],
      a22 = a[8];
  return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
}
/**
 * Multiplies two mat3's
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the first operand
 * @param {ReadonlyMat3} b the second operand
 * @returns {mat3} out
 */

function multiply$1(out, a, b) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2];
  var a10 = a[3],
      a11 = a[4],
      a12 = a[5];
  var a20 = a[6],
      a21 = a[7],
      a22 = a[8];
  var b00 = b[0],
      b01 = b[1],
      b02 = b[2];
  var b10 = b[3],
      b11 = b[4],
      b12 = b[5];
  var b20 = b[6],
      b21 = b[7],
      b22 = b[8];
  out[0] = b00 * a00 + b01 * a10 + b02 * a20;
  out[1] = b00 * a01 + b01 * a11 + b02 * a21;
  out[2] = b00 * a02 + b01 * a12 + b02 * a22;
  out[3] = b10 * a00 + b11 * a10 + b12 * a20;
  out[4] = b10 * a01 + b11 * a11 + b12 * a21;
  out[5] = b10 * a02 + b11 * a12 + b12 * a22;
  out[6] = b20 * a00 + b21 * a10 + b22 * a20;
  out[7] = b20 * a01 + b21 * a11 + b22 * a21;
  out[8] = b20 * a02 + b21 * a12 + b22 * a22;
  return out;
}
/**
 * Translate a mat3 by the given vector
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the matrix to translate
 * @param {ReadonlyVec2} v vector to translate by
 * @returns {mat3} out
 */

function translate(out, a, v) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a10 = a[3],
      a11 = a[4],
      a12 = a[5],
      a20 = a[6],
      a21 = a[7],
      a22 = a[8],
      x = v[0],
      y = v[1];
  out[0] = a00;
  out[1] = a01;
  out[2] = a02;
  out[3] = a10;
  out[4] = a11;
  out[5] = a12;
  out[6] = x * a00 + y * a10 + a20;
  out[7] = x * a01 + y * a11 + a21;
  out[8] = x * a02 + y * a12 + a22;
  return out;
}
/**
 * Rotates a mat3 by the given angle
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat3} out
 */

function rotate(out, a, rad) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a10 = a[3],
      a11 = a[4],
      a12 = a[5],
      a20 = a[6],
      a21 = a[7],
      a22 = a[8],
      s = Math.sin(rad),
      c = Math.cos(rad);
  out[0] = c * a00 + s * a10;
  out[1] = c * a01 + s * a11;
  out[2] = c * a02 + s * a12;
  out[3] = c * a10 - s * a00;
  out[4] = c * a11 - s * a01;
  out[5] = c * a12 - s * a02;
  out[6] = a20;
  out[7] = a21;
  out[8] = a22;
  return out;
}
/**
 * Scales the mat3 by the dimensions in the given vec2
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the matrix to rotate
 * @param {ReadonlyVec2} v the vec2 to scale the matrix by
 * @returns {mat3} out
 **/

function scale$1(out, a, v) {
  var x = v[0],
      y = v[1];
  out[0] = x * a[0];
  out[1] = x * a[1];
  out[2] = x * a[2];
  out[3] = y * a[3];
  out[4] = y * a[4];
  out[5] = y * a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  return out;
}
/**
 * Calculates a 3x3 matrix from the given quaternion
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {ReadonlyQuat} q Quaternion to create matrix from
 *
 * @returns {mat3} out
 */

function fromQuat(out, q) {
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var yx = y * x2;
  var yy = y * y2;
  var zx = z * x2;
  var zy = z * y2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  out[0] = 1 - yy - zz;
  out[3] = yx - wz;
  out[6] = zx + wy;
  out[1] = yx + wz;
  out[4] = 1 - xx - zz;
  out[7] = zy - wx;
  out[2] = zx - wy;
  out[5] = zy + wx;
  out[8] = 1 - xx - yy;
  return out;
}

const IDENTITY = Object.freeze([1, 0, 0, 0, 1, 0, 0, 0, 1]);
const ZERO = Object.freeze([0, 0, 0, 0, 0, 0, 0, 0, 0]);
const INDICES = Object.freeze({
  COL0ROW0: 0,
  COL0ROW1: 1,
  COL0ROW2: 2,
  COL1ROW0: 3,
  COL1ROW1: 4,
  COL1ROW2: 5,
  COL2ROW0: 6,
  COL2ROW1: 7,
  COL2ROW2: 8
});
const constants = {};
class Matrix3 extends Matrix {
  static get IDENTITY() {
    constants.IDENTITY = constants.IDENTITY || Object.freeze(new Matrix3(IDENTITY));
    return constants.IDENTITY;
  }

  static get ZERO() {
    constants.ZERO = constants.ZERO || Object.freeze(new Matrix3(ZERO));
    return constants.ZERO;
  }

  get ELEMENTS() {
    return 9;
  }

  get RANK() {
    return 3;
  }

  get INDICES() {
    return INDICES;
  }

  constructor(array) {
    super(-0, -0, -0, -0, -0, -0, -0, -0, -0);

    if (arguments.length === 1 && Array.isArray(array)) {
      this.copy(array);
    } else {
      this.identity();
    }
  }

  copy(array) {
    this[0] = array[0];
    this[1] = array[1];
    this[2] = array[2];
    this[3] = array[3];
    this[4] = array[4];
    this[5] = array[5];
    this[6] = array[6];
    this[7] = array[7];
    this[8] = array[8];
    return this.check();
  }

  set(m00, m10, m20, m01, m11, m21, m02, m12, m22) {
    this[0] = m00;
    this[1] = m10;
    this[2] = m20;
    this[3] = m01;
    this[4] = m11;
    this[5] = m21;
    this[6] = m02;
    this[7] = m12;
    this[8] = m22;
    return this.check();
  }

  setRowMajor(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
    this[0] = m00;
    this[1] = m10;
    this[2] = m20;
    this[3] = m01;
    this[4] = m11;
    this[5] = m21;
    this[6] = m02;
    this[7] = m12;
    this[8] = m22;
    return this.check();
  }

  determinant() {
    return determinant(this);
  }

  identity() {
    return this.copy(IDENTITY);
  }

  fromQuaternion(q) {
    fromQuat(this, q);
    return this.check();
  }

  transpose() {
    transpose(this, this);
    return this.check();
  }

  invert() {
    invert$1(this, this);
    return this.check();
  }

  multiplyLeft(a) {
    multiply$1(this, a, this);
    return this.check();
  }

  multiplyRight(a) {
    multiply$1(this, this, a);
    return this.check();
  }

  rotate(radians) {
    rotate(this, this, radians);
    return this.check();
  }

  scale(factor) {
    if (Array.isArray(factor)) {
      scale$1(this, this, factor);
    } else {
      scale$1(this, this, [factor, factor, factor]);
    }

    return this.check();
  }

  translate(vec) {
    translate(this, this, vec);
    return this.check();
  }

  transform(vector, result) {
    switch (vector.length) {
      case 2:
        result = transformMat3$1(result || [-0, -0], vector, this);
        break;

      case 3:
        result = transformMat3(result || [-0, -0, -0], vector, this);
        break;

      case 4:
        result = vec4_transformMat3(result || [-0, -0, -0, -0], vector, this);
        break;

      default:
        throw new Error('Illegal vector');
    }

    checkVector(result, vector.length);
    return result;
  }

  transformVector(vector, result) {
    deprecated('Matrix3.transformVector');
    return this.transform(vector, result);
  }

  transformVector2(vector, result) {
    deprecated('Matrix3.transformVector');
    return this.transform(vector, result);
  }

  transformVector3(vector, result) {
    deprecated('Matrix3.transformVector');
    return this.transform(vector, result);
  }

}

/**
 * Quaternion
 * @module quat
 */

/**
 * Creates a new identity quat
 *
 * @returns {quat} a new quaternion
 */

function create() {
  var out = new ARRAY_TYPE(4);

  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }

  out[3] = 1;
  return out;
}
/**
 * Set a quat to the identity quaternion
 *
 * @param {quat} out the receiving quaternion
 * @returns {quat} out
 */

function identity(out) {
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  return out;
}
/**
 * Sets a quat from the given angle and rotation axis,
 * then returns it.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyVec3} axis the axis around which to rotate
 * @param {Number} rad the angle in radians
 * @returns {quat} out
 **/

function setAxisAngle(out, axis, rad) {
  rad = rad * 0.5;
  var s = Math.sin(rad);
  out[0] = s * axis[0];
  out[1] = s * axis[1];
  out[2] = s * axis[2];
  out[3] = Math.cos(rad);
  return out;
}
/**
 * Multiplies two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @returns {quat} out
 */

function multiply(out, a, b) {
  var ax = a[0],
      ay = a[1],
      az = a[2],
      aw = a[3];
  var bx = b[0],
      by = b[1],
      bz = b[2],
      bw = b[3];
  out[0] = ax * bw + aw * bx + ay * bz - az * by;
  out[1] = ay * bw + aw * by + az * bx - ax * bz;
  out[2] = az * bw + aw * bz + ax * by - ay * bx;
  out[3] = aw * bw - ax * bx - ay * by - az * bz;
  return out;
}
/**
 * Rotates a quaternion by the given angle about the X axis
 *
 * @param {quat} out quat receiving operation result
 * @param {ReadonlyQuat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */

function rotateX(out, a, rad) {
  rad *= 0.5;
  var ax = a[0],
      ay = a[1],
      az = a[2],
      aw = a[3];
  var bx = Math.sin(rad),
      bw = Math.cos(rad);
  out[0] = ax * bw + aw * bx;
  out[1] = ay * bw + az * bx;
  out[2] = az * bw - ay * bx;
  out[3] = aw * bw - ax * bx;
  return out;
}
/**
 * Rotates a quaternion by the given angle about the Y axis
 *
 * @param {quat} out quat receiving operation result
 * @param {ReadonlyQuat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */

function rotateY(out, a, rad) {
  rad *= 0.5;
  var ax = a[0],
      ay = a[1],
      az = a[2],
      aw = a[3];
  var by = Math.sin(rad),
      bw = Math.cos(rad);
  out[0] = ax * bw - az * by;
  out[1] = ay * bw + aw * by;
  out[2] = az * bw + ax * by;
  out[3] = aw * bw - ay * by;
  return out;
}
/**
 * Rotates a quaternion by the given angle about the Z axis
 *
 * @param {quat} out quat receiving operation result
 * @param {ReadonlyQuat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */

function rotateZ(out, a, rad) {
  rad *= 0.5;
  var ax = a[0],
      ay = a[1],
      az = a[2],
      aw = a[3];
  var bz = Math.sin(rad),
      bw = Math.cos(rad);
  out[0] = ax * bw + ay * bz;
  out[1] = ay * bw - ax * bz;
  out[2] = az * bw + aw * bz;
  out[3] = aw * bw - az * bz;
  return out;
}
/**
 * Calculates the W component of a quat from the X, Y, and Z components.
 * Assumes that quaternion is 1 unit in length.
 * Any existing W component will be ignored.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate W component of
 * @returns {quat} out
 */

function calculateW(out, a) {
  var x = a[0],
      y = a[1],
      z = a[2];
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
  return out;
}
/**
 * Performs a spherical linear interpolation between two quat
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat} out
 */

function slerp(out, a, b, t) {
  // benchmarks:
  //    http://jsperf.com/quaternion-slerp-implementations
  var ax = a[0],
      ay = a[1],
      az = a[2],
      aw = a[3];
  var bx = b[0],
      by = b[1],
      bz = b[2],
      bw = b[3];
  var omega, cosom, sinom, scale0, scale1; // calc cosine

  cosom = ax * bx + ay * by + az * bz + aw * bw; // adjust signs (if necessary)

  if (cosom < 0.0) {
    cosom = -cosom;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  } // calculate coefficients


  if (1.0 - cosom > EPSILON) {
    // standard case (slerp)
    omega = Math.acos(cosom);
    sinom = Math.sin(omega);
    scale0 = Math.sin((1.0 - t) * omega) / sinom;
    scale1 = Math.sin(t * omega) / sinom;
  } else {
    // "from" and "to" quaternions are very close
    //  ... so we can do a linear interpolation
    scale0 = 1.0 - t;
    scale1 = t;
  } // calculate final values


  out[0] = scale0 * ax + scale1 * bx;
  out[1] = scale0 * ay + scale1 * by;
  out[2] = scale0 * az + scale1 * bz;
  out[3] = scale0 * aw + scale1 * bw;
  return out;
}
/**
 * Calculates the inverse of a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate inverse of
 * @returns {quat} out
 */

function invert(out, a) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3];
  var dot = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3;
  var invDot = dot ? 1.0 / dot : 0; // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0

  out[0] = -a0 * invDot;
  out[1] = -a1 * invDot;
  out[2] = -a2 * invDot;
  out[3] = a3 * invDot;
  return out;
}
/**
 * Calculates the conjugate of a quat
 * If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate conjugate of
 * @returns {quat} out
 */

function conjugate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  out[3] = a[3];
  return out;
}
/**
 * Creates a quaternion from the given 3x3 rotation matrix.
 *
 * NOTE: The resultant quaternion is not normalized, so you should be sure
 * to renormalize the quaternion yourself where necessary.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyMat3} m rotation matrix
 * @returns {quat} out
 * @function
 */

function fromMat3(out, m) {
  // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
  // article "Quaternion Calculus and Fast Animation".
  var fTrace = m[0] + m[4] + m[8];
  var fRoot;

  if (fTrace > 0.0) {
    // |w| > 1/2, may as well choose w > 1/2
    fRoot = Math.sqrt(fTrace + 1.0); // 2w

    out[3] = 0.5 * fRoot;
    fRoot = 0.5 / fRoot; // 1/(4w)

    out[0] = (m[5] - m[7]) * fRoot;
    out[1] = (m[6] - m[2]) * fRoot;
    out[2] = (m[1] - m[3]) * fRoot;
  } else {
    // |w| <= 1/2
    var i = 0;
    if (m[4] > m[0]) i = 1;
    if (m[8] > m[i * 3 + i]) i = 2;
    var j = (i + 1) % 3;
    var k = (i + 2) % 3;
    fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1.0);
    out[i] = 0.5 * fRoot;
    fRoot = 0.5 / fRoot;
    out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
    out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
    out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
  }

  return out;
}
/**
 * Adds two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @returns {quat} out
 * @function
 */

var add = add$1;
/**
 * Scales a quat by a scalar number
 *
 * @param {quat} out the receiving vector
 * @param {ReadonlyQuat} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {quat} out
 * @function
 */

var scale = scale$2;
/**
 * Calculates the dot product of two quat's
 *
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @returns {Number} dot product of a and b
 * @function
 */

var dot = dot$1;
/**
 * Performs a linear interpolation between two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat} out
 * @function
 */

var lerp = lerp$1;
/**
 * Calculates the length of a quat
 *
 * @param {ReadonlyQuat} a vector to calculate length of
 * @returns {Number} length of a
 */

var length = length$1;
/**
 * Calculates the squared length of a quat
 *
 * @param {ReadonlyQuat} a vector to calculate squared length of
 * @returns {Number} squared length of a
 * @function
 */

var squaredLength = squaredLength$1;
/**
 * Normalize a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quaternion to normalize
 * @returns {quat} out
 * @function
 */

var normalize$1 = normalize$3;
/**
 * Sets a quaternion to represent the shortest rotation from one
 * vector to another.
 *
 * Both vectors are assumed to be unit length.
 *
 * @param {quat} out the receiving quaternion.
 * @param {ReadonlyVec3} a the initial vector
 * @param {ReadonlyVec3} b the destination vector
 * @returns {quat} out
 */

var rotationTo = function () {
  var tmpvec3 = create$2();
  var xUnitVec3 = fromValues(1, 0, 0);
  var yUnitVec3 = fromValues(0, 1, 0);
  return function (out, a, b) {
    var dot = dot$2(a, b);

    if (dot < -0.999999) {
      cross(tmpvec3, xUnitVec3, a);
      if (len(tmpvec3) < 0.000001) cross(tmpvec3, yUnitVec3, a);
      normalize$2(tmpvec3, tmpvec3);
      setAxisAngle(out, tmpvec3, Math.PI);
      return out;
    } else if (dot > 0.999999) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      out[3] = 1;
      return out;
    } else {
      cross(tmpvec3, a, b);
      out[0] = tmpvec3[0];
      out[1] = tmpvec3[1];
      out[2] = tmpvec3[2];
      out[3] = 1 + dot;
      return normalize$1(out, out);
    }
  };
}();
/**
 * Performs a spherical linear interpolation with two control points
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @param {ReadonlyQuat} c the third operand
 * @param {ReadonlyQuat} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat} out
 */

(function () {
  var temp1 = create();
  var temp2 = create();
  return function (out, a, b, c, d, t) {
    slerp(temp1, a, d, t);
    slerp(temp2, b, c, t);
    slerp(out, temp1, temp2, 2 * t * (1 - t));
    return out;
  };
})();
/**
 * Sets the specified quaternion with values corresponding to the given
 * axes. Each axis is a vec3 and is expected to be unit length and
 * perpendicular to all other specified axes.
 *
 * @param {ReadonlyVec3} view  the vector representing the viewing direction
 * @param {ReadonlyVec3} right the vector representing the local "right" direction
 * @param {ReadonlyVec3} up    the vector representing the local "up" direction
 * @returns {quat} out
 */

(function () {
  var matr = create$1();
  return function (out, view, right, up) {
    matr[0] = right[0];
    matr[3] = right[1];
    matr[6] = right[2];
    matr[1] = up[0];
    matr[4] = up[1];
    matr[7] = up[2];
    matr[2] = -view[0];
    matr[5] = -view[1];
    matr[8] = -view[2];
    return normalize$1(out, fromMat3(out, matr));
  };
})();

const IDENTITY_QUATERNION = [0, 0, 0, 1];
class Quaternion extends MathArray {
  constructor(x = 0, y = 0, z = 0, w = 1) {
    super(-0, -0, -0, -0);

    if (Array.isArray(x) && arguments.length === 1) {
      this.copy(x);
    } else {
      this.set(x, y, z, w);
    }
  }

  copy(array) {
    this[0] = array[0];
    this[1] = array[1];
    this[2] = array[2];
    this[3] = array[3];
    return this.check();
  }

  set(x, y, z, w) {
    this[0] = x;
    this[1] = y;
    this[2] = z;
    this[3] = w;
    return this.check();
  }

  fromMatrix3(m) {
    fromMat3(this, m);
    return this.check();
  }

  identity() {
    identity(this);
    return this.check();
  }

  fromAxisRotation(axis, rad) {
    setAxisAngle(this, axis, rad);
    return this.check();
  }

  setAxisAngle(axis, rad) {
    return this.fromAxisRotation(axis, rad);
  }

  get ELEMENTS() {
    return 4;
  }

  get x() {
    return this[0];
  }

  set x(value) {
    this[0] = checkNumber(value);
  }

  get y() {
    return this[1];
  }

  set y(value) {
    this[1] = checkNumber(value);
  }

  get z() {
    return this[2];
  }

  set z(value) {
    this[2] = checkNumber(value);
  }

  get w() {
    return this[3];
  }

  set w(value) {
    this[3] = checkNumber(value);
  }

  len() {
    return length(this);
  }

  lengthSquared() {
    return squaredLength(this);
  }

  dot(a, b) {
    if (b !== undefined) {
      throw new Error('Quaternion.dot only takes one argument');
    }

    return dot(this, a);
  }

  rotationTo(vectorA, vectorB) {
    rotationTo(this, vectorA, vectorB);
    return this.check();
  }

  add(a, b) {
    if (b !== undefined) {
      throw new Error('Quaternion.add only takes one argument');
    }

    add(this, this, a);
    return this.check();
  }

  calculateW() {
    calculateW(this, this);
    return this.check();
  }

  conjugate() {
    conjugate(this, this);
    return this.check();
  }

  invert() {
    invert(this, this);
    return this.check();
  }

  lerp(a, b, t) {
    lerp(this, a, b, t);
    return this.check();
  }

  multiplyRight(a, b) {
    assert(!b);
    multiply(this, this, a);
    return this.check();
  }

  multiplyLeft(a, b) {
    assert(!b);
    multiply(this, a, this);
    return this.check();
  }

  normalize() {
    const length = this.len();
    const l = length > 0 ? 1 / length : 0;
    this[0] = this[0] * l;
    this[1] = this[1] * l;
    this[2] = this[2] * l;
    this[3] = this[3] * l;

    if (length === 0) {
      this[3] = 1;
    }

    return this.check();
  }

  rotateX(rad) {
    rotateX(this, this, rad);
    return this.check();
  }

  rotateY(rad) {
    rotateY(this, this, rad);
    return this.check();
  }

  rotateZ(rad) {
    rotateZ(this, this, rad);
    return this.check();
  }

  scale(b) {
    scale(this, this, b);
    return this.check();
  }

  slerp(start, target, ratio) {
    switch (arguments.length) {
      case 1:
        ({
          start = IDENTITY_QUATERNION,
          target,
          ratio
        } = arguments[0]);
        break;

      case 2:
        [target, ratio] = arguments;
        start = this;
        break;
    }

    slerp(this, start, target, ratio);
    return this.check();
  }

  transformVector4(vector, result = vector) {
    transformQuat(result, vector, this);
    return checkVector(result, 4);
  }

  lengthSq() {
    return this.lengthSquared();
  }

  setFromAxisAngle(axis, rad) {
    return this.setAxisAngle(axis, rad);
  }

  premultiply(a, b) {
    return this.multiplyLeft(a, b);
  }

  multiply(a, b) {
    return this.multiplyRight(a, b);
  }

}

var _MathUtils = {
  EPSILON1: 1e-1,
  EPSILON2: 1e-2,
  EPSILON3: 1e-3,
  EPSILON4: 1e-4,
  EPSILON5: 1e-5,
  EPSILON6: 1e-6,
  EPSILON7: 1e-7,
  EPSILON8: 1e-8,
  EPSILON9: 1e-9,
  EPSILON10: 1e-10,
  EPSILON11: 1e-11,
  EPSILON12: 1e-12,
  EPSILON13: 1e-13,
  EPSILON14: 1e-14,
  EPSILON15: 1e-15,
  EPSILON16: 1e-16,
  EPSILON17: 1e-17,
  EPSILON18: 1e-18,
  EPSILON19: 1e-19,
  EPSILON20: 1e-20,
  PI_OVER_TWO: Math.PI / 2,
  PI_OVER_FOUR: Math.PI / 4,
  PI_OVER_SIX: Math.PI / 6,
  TWO_PI: Math.PI * 2
};

var lightingShader$1 = `\
#if (defined(SHADER_TYPE_FRAGMENT) && defined(LIGHTING_FRAGMENT)) || (defined(SHADER_TYPE_VERTEX) && defined(LIGHTING_VERTEX))

struct AmbientLight {
 vec3 color;
};

struct PointLight {
 vec3 color;
 vec3 position;
 vec3 attenuation;
};

struct DirectionalLight {
  vec3 color;
  vec3 direction;
};

uniform AmbientLight lighting_uAmbientLight;
uniform PointLight lighting_uPointLight[MAX_LIGHTS];
uniform DirectionalLight lighting_uDirectionalLight[MAX_LIGHTS];
uniform int lighting_uPointLightCount;
uniform int lighting_uDirectionalLightCount;

uniform bool lighting_uEnabled;

float getPointLightAttenuation(PointLight pointLight, float distance) {
  return pointLight.attenuation.x
       + pointLight.attenuation.y * distance
       + pointLight.attenuation.z * distance * distance;
}

#endif
`;

const INITIAL_MODULE_OPTIONS$1 = {
  lightSources: {}
};

function convertColor({
  color = [0, 0, 0],
  intensity = 1.0
} = {}) {
  return color.map(component => component * intensity / 255.0);
}

function getLightSourceUniforms({
  ambientLight,
  pointLights = [],
  directionalLights = []
}) {
  const lightSourceUniforms = {};

  if (ambientLight) {
    lightSourceUniforms['lighting_uAmbientLight.color'] = convertColor(ambientLight);
  } else {
    lightSourceUniforms['lighting_uAmbientLight.color'] = [0, 0, 0];
  }

  pointLights.forEach((pointLight, index) => {
    lightSourceUniforms[`lighting_uPointLight[${index}].color`] = convertColor(pointLight);
    lightSourceUniforms[`lighting_uPointLight[${index}].position`] = pointLight.position;
    lightSourceUniforms[`lighting_uPointLight[${index}].attenuation`] = pointLight.attenuation || [1, 0, 0];
  });
  lightSourceUniforms.lighting_uPointLightCount = pointLights.length;
  directionalLights.forEach((directionalLight, index) => {
    lightSourceUniforms[`lighting_uDirectionalLight[${index}].color`] = convertColor(directionalLight);
    lightSourceUniforms[`lighting_uDirectionalLight[${index}].direction`] = directionalLight.direction;
  });
  lightSourceUniforms.lighting_uDirectionalLightCount = directionalLights.length;
  return lightSourceUniforms;
}

function getUniforms$1(opts = INITIAL_MODULE_OPTIONS$1) {
  if ('lightSources' in opts) {
    const {
      ambientLight,
      pointLights,
      directionalLights
    } = opts.lightSources || {};
    const hasLights = ambientLight || pointLights && pointLights.length > 0 || directionalLights && directionalLights.length > 0;

    if (!hasLights) {
      return {
        lighting_uEnabled: false
      };
    }

    return Object.assign({}, getLightSourceUniforms({
      ambientLight,
      pointLights,
      directionalLights
    }), {
      lighting_uEnabled: true
    });
  }

  if ('lights' in opts) {
    const lightSources = {
      pointLights: [],
      directionalLights: []
    };

    for (const light of opts.lights || []) {
      switch (light.type) {
        case 'ambient':
          lightSources.ambientLight = light;
          break;

        case 'directional':
          lightSources.directionalLights.push(light);
          break;

        case 'point':
          lightSources.pointLights.push(light);
          break;
      }
    }

    return getUniforms$1({
      lightSources
    });
  }

  return {};
}

const lights = {
  name: 'lights',
  vs: lightingShader$1,
  fs: lightingShader$1,
  getUniforms: getUniforms$1,
  defines: {
    MAX_LIGHTS: 3
  }
};

var lightingShader = `\

uniform float lighting_uAmbient;
uniform float lighting_uDiffuse;
uniform float lighting_uShininess;
uniform vec3  lighting_uSpecularColor;

vec3 lighting_getLightColor(vec3 surfaceColor, vec3 light_direction, vec3 view_direction, vec3 normal_worldspace, vec3 color) {
    vec3 halfway_direction = normalize(light_direction + view_direction);
    float lambertian = dot(light_direction, normal_worldspace);
    float specular = 0.0;
    if (lambertian > 0.0) {
      float specular_angle = max(dot(normal_worldspace, halfway_direction), 0.0);
      specular = pow(specular_angle, lighting_uShininess);
    }
    lambertian = max(lambertian, 0.0);
    return (lambertian * lighting_uDiffuse * surfaceColor + specular * lighting_uSpecularColor) * color;
}

vec3 lighting_getLightColor(vec3 surfaceColor, vec3 cameraPosition, vec3 position_worldspace, vec3 normal_worldspace) {
  vec3 lightColor = surfaceColor;

  if (lighting_uEnabled) {
    vec3 view_direction = normalize(cameraPosition - position_worldspace);
    lightColor = lighting_uAmbient * surfaceColor * lighting_uAmbientLight.color;

    for (int i = 0; i < MAX_LIGHTS; i++) {
      if (i >= lighting_uPointLightCount) {
        break;
      }
      PointLight pointLight = lighting_uPointLight[i];
      vec3 light_position_worldspace = pointLight.position;
      vec3 light_direction = normalize(light_position_worldspace - position_worldspace);
      lightColor += lighting_getLightColor(surfaceColor, light_direction, view_direction, normal_worldspace, pointLight.color);
    }

    for (int i = 0; i < MAX_LIGHTS; i++) {
      if (i >= lighting_uDirectionalLightCount) {
        break;
      }
      DirectionalLight directionalLight = lighting_uDirectionalLight[i];
      lightColor += lighting_getLightColor(surfaceColor, -directionalLight.direction, view_direction, normal_worldspace, directionalLight.color);
    }
  }
  return lightColor;
}

vec3 lighting_getSpecularLightColor(vec3 cameraPosition, vec3 position_worldspace, vec3 normal_worldspace) {
  vec3 lightColor = vec3(0, 0, 0);
  vec3 surfaceColor = vec3(0, 0, 0);

  if (lighting_uEnabled) {
    vec3 view_direction = normalize(cameraPosition - position_worldspace);

    for (int i = 0; i < MAX_LIGHTS; i++) {
      if (i >= lighting_uPointLightCount) {
        break;
      }
      PointLight pointLight = lighting_uPointLight[i];
      vec3 light_position_worldspace = pointLight.position;
      vec3 light_direction = normalize(light_position_worldspace - position_worldspace);
      lightColor += lighting_getLightColor(surfaceColor, light_direction, view_direction, normal_worldspace, pointLight.color);
    }

    for (int i = 0; i < MAX_LIGHTS; i++) {
      if (i >= lighting_uDirectionalLightCount) {
        break;
      }
      DirectionalLight directionalLight = lighting_uDirectionalLight[i];
      lightColor += lighting_getLightColor(surfaceColor, -directionalLight.direction, view_direction, normal_worldspace, directionalLight.color);
    }
  }
  return lightColor;
}
`;

const INITIAL_MODULE_OPTIONS = {};

function getMaterialUniforms(material) {
  const {
    ambient = 0.35,
    diffuse = 0.6,
    shininess = 32,
    specularColor = [30, 30, 30]
  } = material;
  return {
    lighting_uAmbient: ambient,
    lighting_uDiffuse: diffuse,
    lighting_uShininess: shininess,
    lighting_uSpecularColor: specularColor.map(x => x / 255)
  };
}

function getUniforms(opts = INITIAL_MODULE_OPTIONS) {
  if (!('material' in opts)) {
    return {};
  }

  const {
    material
  } = opts;

  if (!material) {
    return {
      lighting_uEnabled: false
    };
  }

  return getMaterialUniforms(material);
}

const gouraudLighting = {
  name: 'gouraud-lighting',
  dependencies: [lights],
  vs: lightingShader,
  defines: {
    LIGHTING_VERTEX: 1
  },
  getUniforms
};
({
  name: 'phong-lighting',
  dependencies: [lights],
  fs: lightingShader,
  defines: {
    LIGHTING_FRAGMENT: 1
  },
  getUniforms
});

const TRACE_RENDER_LAYERS = 'compositeLayer.renderLayers';
class CompositeLayer extends Layer {
  get isComposite() {
    return true;
  }

  get isLoaded() {
    return super.isLoaded && this.getSubLayers().every(layer => layer.isLoaded);
  }

  getSubLayers() {
    return this.internalState && this.internalState.subLayers || [];
  }

  initializeState() {}

  setState(updateObject) {
    super.setState(updateObject);
    this.setNeedsUpdate();
  }

  getPickingInfo(_ref) {
    let {
      info
    } = _ref;
    const {
      object
    } = info;
    const isDataWrapped = object && object.__source && object.__source.parent && object.__source.parent.id === this.id;

    if (!isDataWrapped) {
      return info;
    }

    info.object = object.__source.object;
    info.index = object.__source.index;
    return info;
  }

  renderLayers() {
    return null;
  }

  filterSubLayer(context) {
    return true;
  }

  shouldRenderSubLayer(id, data) {
    return data && data.length;
  }

  getSubLayerClass(id, DefaultLayerClass) {
    const {
      _subLayerProps: overridingProps
    } = this.props;
    return overridingProps && overridingProps[id] && overridingProps[id].type || DefaultLayerClass;
  }

  getSubLayerRow(row, sourceObject, sourceObjectIndex) {
    row.__source = {
      parent: this,
      object: sourceObject,
      index: sourceObjectIndex
    };
    return row;
  }

  getSubLayerAccessor(accessor) {
    if (typeof accessor === 'function') {
      const objectInfo = {
        data: this.props.data,
        target: []
      };
      return (x, i) => {
        if (x && x.__source) {
          objectInfo.index = x.__source.index;
          return accessor(x.__source.object, objectInfo);
        }

        return accessor(x, i);
      };
    }

    return accessor;
  }

  getSubLayerProps() {
    let sublayerProps = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const {
      opacity,
      pickable,
      visible,
      parameters,
      getPolygonOffset,
      highlightedObjectIndex,
      autoHighlight,
      highlightColor,
      coordinateSystem,
      coordinateOrigin,
      wrapLongitude,
      positionFormat,
      modelMatrix,
      extensions,
      fetch,
      _subLayerProps: overridingProps
    } = this.props;
    const newProps = {
      opacity,
      pickable,
      visible,
      parameters,
      getPolygonOffset,
      highlightedObjectIndex,
      autoHighlight,
      highlightColor,
      coordinateSystem,
      coordinateOrigin,
      wrapLongitude,
      positionFormat,
      modelMatrix,
      extensions,
      fetch
    };
    const overridingSublayerProps = overridingProps && overridingProps[sublayerProps.id];
    const overridingSublayerTriggers = overridingSublayerProps && overridingSublayerProps.updateTriggers;
    const sublayerId = sublayerProps.id || 'sublayer';

    if (overridingSublayerProps) {
      const propTypes = this.constructor._propTypes;
      const subLayerPropTypes = sublayerProps.type ? sublayerProps.type._propTypes : {};

      for (const key in overridingSublayerProps) {
        const propType = subLayerPropTypes[key] || propTypes[key];

        if (propType && propType.type === 'accessor') {
          overridingSublayerProps[key] = this.getSubLayerAccessor(overridingSublayerProps[key]);
        }
      }
    }

    Object.assign(newProps, sublayerProps, overridingSublayerProps);
    newProps.id = "".concat(this.props.id, "-").concat(sublayerId);
    newProps.updateTriggers = {
      all: this.props.updateTriggers.all,
      ...sublayerProps.updateTriggers,
      ...overridingSublayerTriggers
    };

    for (const extension of extensions) {
      const passThroughProps = extension.getSubLayerProps.call(this, extension);

      if (passThroughProps) {
        Object.assign(newProps, passThroughProps, {
          updateTriggers: Object.assign(newProps.updateTriggers, passThroughProps.updateTriggers)
        });
      }
    }

    return newProps;
  }

  _updateAutoHighlight(info) {
    for (const layer of this.getSubLayers()) {
      layer.updateAutoHighlight(info);
    }
  }

  _getAttributeManager() {
    return null;
  }

  _renderLayers() {
    let {
      subLayers
    } = this.internalState;
    const shouldUpdate = !subLayers || this.needsUpdate();

    if (shouldUpdate) {
      subLayers = this.renderLayers();
      subLayers = flatten(subLayers, Boolean);
      this.internalState.subLayers = subLayers;
    }

    debug(TRACE_RENDER_LAYERS, this, shouldUpdate, subLayers);

    for (const layer of subLayers) {
      layer.parent = this;
    }
  }

}
CompositeLayer.layerName = 'CompositeLayer';

class Tesselator {
  constructor() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const {
      attributes = {}
    } = opts;
    this.typedArrayManager = defaultTypedArrayManager;
    this.indexStarts = null;
    this.vertexStarts = null;
    this.vertexCount = 0;
    this.instanceCount = 0;
    this.attributes = {};
    this._attributeDefs = attributes;
    this.opts = opts;
    this.updateGeometry(opts);
    Object.seal(this);
  }

  updateGeometry(opts) {
    Object.assign(this.opts, opts);
    const {
      data,
      buffers = {},
      getGeometry,
      geometryBuffer,
      positionFormat,
      dataChanged,
      normalize = true
    } = this.opts;
    this.data = data;
    this.getGeometry = getGeometry;
    this.positionSize = geometryBuffer && geometryBuffer.size || (positionFormat === 'XY' ? 2 : 3);
    this.buffers = buffers;
    this.normalize = normalize;

    if (geometryBuffer) {
      assert$1(data.startIndices);
      this.getGeometry = this.getGeometryFromBuffer(geometryBuffer);

      if (!normalize) {
        buffers.positions = geometryBuffer;
      }
    }

    this.geometryBuffer = buffers.positions;

    if (Array.isArray(dataChanged)) {
      for (const dataRange of dataChanged) {
        this._rebuildGeometry(dataRange);
      }
    } else {
      this._rebuildGeometry();
    }
  }

  updatePartialGeometry(_ref) {
    let {
      startRow,
      endRow
    } = _ref;

    this._rebuildGeometry({
      startRow,
      endRow
    });
  }

  normalizeGeometry(geometry) {
    return geometry;
  }

  updateGeometryAttributes(geometry, startIndex, size) {
    throw new Error('Not implemented');
  }

  getGeometrySize(geometry) {
    throw new Error('Not implemented');
  }

  getGeometryFromBuffer(geometryBuffer) {
    const value = geometryBuffer.value || geometryBuffer;
    assert$1(ArrayBuffer.isView(value));
    return getAccessorFromBuffer(value, {
      size: this.positionSize,
      offset: geometryBuffer.offset,
      stride: geometryBuffer.stride,
      startIndices: this.data.startIndices
    });
  }

  _allocate(instanceCount, copy) {
    const {
      attributes,
      buffers,
      _attributeDefs,
      typedArrayManager
    } = this;

    for (const name in _attributeDefs) {
      if (name in buffers) {
        typedArrayManager.release(attributes[name]);
        attributes[name] = null;
      } else {
        const def = _attributeDefs[name];
        def.copy = copy;
        attributes[name] = typedArrayManager.allocate(attributes[name], instanceCount, def);
      }
    }
  }

  _forEachGeometry(visitor, startRow, endRow) {
    const {
      data,
      getGeometry
    } = this;
    const {
      iterable,
      objectInfo
    } = createIterable(data, startRow, endRow);

    for (const object of iterable) {
      objectInfo.index++;
      const geometry = getGeometry(object, objectInfo);
      visitor(geometry, objectInfo.index);
    }
  }

  _rebuildGeometry(dataRange) {
    if (!this.data || !this.getGeometry) {
      return;
    }

    let {
      indexStarts,
      vertexStarts,
      instanceCount
    } = this;
    const {
      data,
      geometryBuffer
    } = this;
    const {
      startRow = 0,
      endRow = Infinity
    } = dataRange || {};
    const normalizedData = {};

    if (!dataRange) {
      indexStarts = [0];
      vertexStarts = [0];
    }

    if (this.normalize || !geometryBuffer) {
      this._forEachGeometry((geometry, dataIndex) => {
        geometry = this.normalizeGeometry(geometry);
        normalizedData[dataIndex] = geometry;
        vertexStarts[dataIndex + 1] = vertexStarts[dataIndex] + this.getGeometrySize(geometry);
      }, startRow, endRow);

      instanceCount = vertexStarts[vertexStarts.length - 1];
    } else if (geometryBuffer.buffer instanceof Buffer) {
      const byteStride = geometryBuffer.stride || this.positionSize * 4;
      vertexStarts = data.startIndices;
      instanceCount = vertexStarts[data.length] || geometryBuffer.buffer.byteLength / byteStride;
    } else {
      const bufferValue = geometryBuffer.value || geometryBuffer;
      const elementStride = geometryBuffer.stride / bufferValue.BYTES_PER_ELEMENT || this.positionSize;
      vertexStarts = data.startIndices;
      instanceCount = vertexStarts[data.length] || bufferValue.length / elementStride;
    }

    this._allocate(instanceCount, Boolean(dataRange));

    this.indexStarts = indexStarts;
    this.vertexStarts = vertexStarts;
    this.instanceCount = instanceCount;
    const context = {};

    this._forEachGeometry((geometry, dataIndex) => {
      geometry = normalizedData[dataIndex] || geometry;
      context.vertexStart = vertexStarts[dataIndex];
      context.indexStart = indexStarts[dataIndex];
      const vertexEnd = dataIndex < vertexStarts.length - 1 ? vertexStarts[dataIndex + 1] : instanceCount;
      context.geometrySize = vertexEnd - vertexStarts[dataIndex];
      context.geometryIndex = dataIndex;
      this.updateGeometryAttributes(geometry, context);
    }, startRow, endRow);

    this.vertexCount = indexStarts[indexStarts.length - 1];
  }

}

var vs$3 = "#define SHADER_NAME icon-layer-vertex-shader\n\nattribute vec2 positions;\n\nattribute vec3 instancePositions;\nattribute vec3 instancePositions64Low;\nattribute float instanceSizes;\nattribute float instanceAngles;\nattribute vec4 instanceColors;\nattribute vec3 instancePickingColors;\nattribute vec4 instanceIconFrames;\nattribute float instanceColorModes;\nattribute vec2 instanceOffsets;\nattribute vec2 instancePixelOffset;\n\nuniform float sizeScale;\nuniform vec2 iconsTextureDim;\nuniform float sizeMinPixels;\nuniform float sizeMaxPixels;\nuniform bool billboard;\nuniform int sizeUnits;\n\nvarying float vColorMode;\nvarying vec4 vColor;\nvarying vec2 vTextureCoords;\nvarying vec2 uv;\n\nvec2 rotate_by_angle(vec2 vertex, float angle) {\n  float angle_radian = angle * PI / 180.0;\n  float cos_angle = cos(angle_radian);\n  float sin_angle = sin(angle_radian);\n  mat2 rotationMatrix = mat2(cos_angle, -sin_angle, sin_angle, cos_angle);\n  return rotationMatrix * vertex;\n}\n\nvoid main(void) {\n  geometry.worldPosition = instancePositions;\n  geometry.uv = positions;\n  geometry.pickingColor = instancePickingColors;\n  uv = positions;\n\n  vec2 iconSize = instanceIconFrames.zw;\n  float sizePixels = clamp(\n    project_size_to_pixel(instanceSizes * sizeScale, sizeUnits), \n    sizeMinPixels, sizeMaxPixels\n  );\n  float instanceScale = iconSize.y == 0.0 ? 0.0 : sizePixels / iconSize.y;\n  vec2 pixelOffset = positions / 2.0 * iconSize + instanceOffsets;\n  pixelOffset = rotate_by_angle(pixelOffset, instanceAngles) * instanceScale;\n  pixelOffset += instancePixelOffset;\n  pixelOffset.y *= -1.0;\n\n  if (billboard)  {\n    gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);\n    vec3 offset = vec3(pixelOffset, 0.0);\n    DECKGL_FILTER_SIZE(offset, geometry);\n    gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);\n\n  } else {\n    vec3 offset_common = vec3(project_pixel_size(pixelOffset), 0.0);\n    DECKGL_FILTER_SIZE(offset_common, geometry);\n    gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset_common, geometry.position); \n  }\n  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);\n\n  vTextureCoords = mix(\n    instanceIconFrames.xy,\n    instanceIconFrames.xy + iconSize,\n    (positions.xy + 1.0) / 2.0\n  ) / iconsTextureDim;\n\n  vColor = instanceColors;\n  DECKGL_FILTER_COLOR(vColor, geometry);\n\n  vColorMode = instanceColorModes;\n}\n";

var fs$5 = "#define SHADER_NAME icon-layer-fragment-shader\n\nprecision highp float;\n\nuniform float opacity;\nuniform sampler2D iconsTexture;\nuniform float alphaCutoff;\n\nvarying float vColorMode;\nvarying vec4 vColor;\nvarying vec2 vTextureCoords;\nvarying vec2 uv;\n\nvoid main(void) {\n  geometry.uv = uv;\n\n  vec4 texColor = texture2D(iconsTexture, vTextureCoords);\n  vec3 color = mix(texColor.rgb, vColor.rgb, vColorMode);\n  float a = texColor.a * opacity * vColor.a;\n\n  if (a < alphaCutoff) {\n    discard;\n  }\n\n  gl_FragColor = vec4(color, a);\n  DECKGL_FILTER_COLOR(gl_FragColor, geometry);\n}\n";

const DEFAULT_CANVAS_WIDTH = 1024;
const DEFAULT_BUFFER$2 = 4;

const noop = () => {};

const DEFAULT_TEXTURE_PARAMETERS = {
  [10241]: 9987,
  [10240]: 9729,
  [10242]: 33071,
  [10243]: 33071
};

function nextPowOfTwo$1(number) {
  return Math.pow(2, Math.ceil(Math.log2(number)));
}

function resizeImage(ctx, imageData, width, height) {
  if (width === imageData.width && height === imageData.height) {
    return imageData;
  }

  ctx.canvas.height = height;
  ctx.canvas.width = width;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(imageData, 0, 0, imageData.width, imageData.height, 0, 0, width, height);
  return ctx.canvas;
}

function getIconId(icon) {
  return icon && (icon.id || icon.url);
}

function resizeTexture(gl, texture, width, height) {
  const oldWidth = texture.width;
  const oldHeight = texture.height;
  const newTexture = cloneTextureFrom(texture, {
    width,
    height
  });
  copyToTexture(texture, newTexture, {
    targetY: 0,
    width: oldWidth,
    height: oldHeight
  });
  texture.delete();
  return newTexture;
}

function buildRowMapping(mapping, columns, yOffset) {
  for (let i = 0; i < columns.length; i++) {
    const {
      icon,
      xOffset
    } = columns[i];
    const id = getIconId(icon);
    mapping[id] = { ...icon,
      x: xOffset,
      y: yOffset
    };
  }
}

function buildMapping$1(_ref) {
  let {
    icons,
    buffer,
    mapping = {},
    xOffset = 0,
    yOffset = 0,
    rowHeight = 0,
    canvasWidth
  } = _ref;
  let columns = [];

  for (let i = 0; i < icons.length; i++) {
    const icon = icons[i];
    const id = getIconId(icon);

    if (!mapping[id]) {
      const {
        height,
        width
      } = icon;

      if (xOffset + width + buffer > canvasWidth) {
        buildRowMapping(mapping, columns, yOffset);
        xOffset = 0;
        yOffset = rowHeight + yOffset + buffer;
        rowHeight = 0;
        columns = [];
      }

      columns.push({
        icon,
        xOffset
      });
      xOffset = xOffset + width + buffer;
      rowHeight = Math.max(rowHeight, height);
    }
  }

  if (columns.length > 0) {
    buildRowMapping(mapping, columns, yOffset);
  }

  return {
    mapping,
    rowHeight,
    xOffset,
    yOffset,
    canvasWidth,
    canvasHeight: nextPowOfTwo$1(rowHeight + yOffset + buffer)
  };
}
function getDiffIcons(data, getIcon, cachedIcons) {
  if (!data || !getIcon) {
    return null;
  }

  cachedIcons = cachedIcons || {};
  const icons = {};
  const {
    iterable,
    objectInfo
  } = createIterable(data);

  for (const object of iterable) {
    objectInfo.index++;
    const icon = getIcon(object, objectInfo);
    const id = getIconId(icon);

    if (!icon) {
      throw new Error('Icon is missing.');
    }

    if (!icon.url) {
      throw new Error('Icon url is missing.');
    }

    if (!icons[id] && (!cachedIcons[id] || icon.url !== cachedIcons[id].url)) {
      icons[id] = { ...icon,
        source: object,
        sourceIndex: objectInfo.index
      };
    }
  }

  return icons;
}
class IconManager {
  constructor(gl, _ref2) {
    let {
      onUpdate = noop,
      onError = noop
    } = _ref2;
    this.gl = gl;
    this.onUpdate = onUpdate;
    this.onError = onError;
    this._loadOptions = null;
    this._getIcon = null;
    this._texture = null;
    this._externalTexture = null;
    this._mapping = {};
    this._pendingCount = 0;
    this._autoPacking = false;
    this._xOffset = 0;
    this._yOffset = 0;
    this._rowHeight = 0;
    this._buffer = DEFAULT_BUFFER$2;
    this._canvasWidth = DEFAULT_CANVAS_WIDTH;
    this._canvasHeight = 0;
    this._canvas = null;
  }

  finalize() {
    var _this$_texture;

    (_this$_texture = this._texture) === null || _this$_texture === void 0 ? void 0 : _this$_texture.delete();
  }

  getTexture() {
    return this._texture || this._externalTexture;
  }

  getIconMapping(icon) {
    const id = this._autoPacking ? getIconId(icon) : icon;
    return this._mapping[id] || {};
  }

  setProps(_ref3) {
    let {
      loadOptions,
      autoPacking,
      iconAtlas,
      iconMapping,
      data,
      getIcon
    } = _ref3;

    if (loadOptions) {
      this._loadOptions = loadOptions;
    }

    if (autoPacking !== undefined) {
      this._autoPacking = autoPacking;
    }

    if (getIcon) {
      this._getIcon = getIcon;
    }

    if (iconMapping) {
      this._mapping = iconMapping;
    }

    if (iconAtlas) {
      this._updateIconAtlas(iconAtlas);
    }

    if (this._autoPacking && (data || getIcon) && typeof document !== 'undefined') {
      this._canvas = this._canvas || document.createElement('canvas');

      this._updateAutoPacking(data);
    }
  }

  get isLoaded() {
    return this._pendingCount === 0;
  }

  _updateIconAtlas(iconAtlas) {
    var _this$_texture2;

    (_this$_texture2 = this._texture) === null || _this$_texture2 === void 0 ? void 0 : _this$_texture2.delete();
    this._texture = null;
    this._externalTexture = iconAtlas;
    this.onUpdate();
  }

  _updateAutoPacking(data) {
    const icons = Object.values(getDiffIcons(data, this._getIcon, this._mapping) || {});

    if (icons.length > 0) {
      const {
        mapping,
        xOffset,
        yOffset,
        rowHeight,
        canvasHeight
      } = buildMapping$1({
        icons,
        buffer: this._buffer,
        canvasWidth: this._canvasWidth,
        mapping: this._mapping,
        rowHeight: this._rowHeight,
        xOffset: this._xOffset,
        yOffset: this._yOffset
      });
      this._rowHeight = rowHeight;
      this._mapping = mapping;
      this._xOffset = xOffset;
      this._yOffset = yOffset;
      this._canvasHeight = canvasHeight;

      if (!this._texture) {
        this._texture = new Texture2D(this.gl, {
          width: this._canvasWidth,
          height: this._canvasHeight,
          parameters: DEFAULT_TEXTURE_PARAMETERS
        });
      }

      if (this._texture.height !== this._canvasHeight) {
        this._texture = resizeTexture(this.gl, this._texture, this._canvasWidth, this._canvasHeight);
      }

      this.onUpdate();

      this._loadIcons(icons);
    }
  }

  _loadIcons(icons) {
    const ctx = this._canvas.getContext('2d');

    for (const icon of icons) {
      this._pendingCount++;
      load(icon.url, ImageLoader, this._loadOptions).then(imageData => {
        const id = getIconId(icon);
        const {
          x,
          y,
          width,
          height
        } = this._mapping[id];
        const data = resizeImage(ctx, imageData, width, height);

        this._texture.setSubImageData({
          data,
          x,
          y,
          width,
          height
        });

        this._texture.generateMipmap();

        this.onUpdate();
      }).catch(error => {
        this.onError({
          url: icon.url,
          source: icon.source,
          sourceIndex: icon.sourceIndex,
          loadOptions: this._loadOptions,
          error
        });
      }).finally(() => {
        this._pendingCount--;
      });
    }
  }

}

const DEFAULT_COLOR$4 = [0, 0, 0, 255];
const defaultProps$8 = {
  iconAtlas: {
    type: 'image',
    value: null,
    async: true
  },
  iconMapping: {
    type: 'object',
    value: {},
    async: true
  },
  sizeScale: {
    type: 'number',
    value: 1,
    min: 0
  },
  billboard: true,
  sizeUnits: 'pixels',
  sizeMinPixels: {
    type: 'number',
    min: 0,
    value: 0
  },
  sizeMaxPixels: {
    type: 'number',
    min: 0,
    value: Number.MAX_SAFE_INTEGER
  },
  alphaCutoff: {
    type: 'number',
    value: 0.05,
    min: 0,
    max: 1
  },
  getPosition: {
    type: 'accessor',
    value: x => x.position
  },
  getIcon: {
    type: 'accessor',
    value: x => x.icon
  },
  getColor: {
    type: 'accessor',
    value: DEFAULT_COLOR$4
  },
  getSize: {
    type: 'accessor',
    value: 1
  },
  getAngle: {
    type: 'accessor',
    value: 0
  },
  getPixelOffset: {
    type: 'accessor',
    value: [0, 0]
  },
  onIconError: {
    type: 'function',
    value: null,
    compare: false,
    optional: true
  }
};
class IconLayer extends Layer {
  getShaders() {
    return super.getShaders({
      vs: vs$3,
      fs: fs$5,
      modules: [project32, picking]
    });
  }

  initializeState() {
    this.state = {
      iconManager: new IconManager(this.context.gl, {
        onUpdate: this._onUpdate.bind(this),
        onError: this._onError.bind(this)
      })
    };
    const attributeManager = this.getAttributeManager();
    attributeManager.addInstanced({
      instancePositions: {
        size: 3,
        type: 5130,
        fp64: this.use64bitPositions(),
        transition: true,
        accessor: 'getPosition'
      },
      instanceSizes: {
        size: 1,
        transition: true,
        accessor: 'getSize',
        defaultValue: 1
      },
      instanceOffsets: {
        size: 2,
        accessor: 'getIcon',
        transform: this.getInstanceOffset
      },
      instanceIconFrames: {
        size: 4,
        accessor: 'getIcon',
        transform: this.getInstanceIconFrame
      },
      instanceColorModes: {
        size: 1,
        type: 5121,
        accessor: 'getIcon',
        transform: this.getInstanceColorMode
      },
      instanceColors: {
        size: this.props.colorFormat.length,
        type: 5121,
        normalized: true,
        transition: true,
        accessor: 'getColor',
        defaultValue: DEFAULT_COLOR$4
      },
      instanceAngles: {
        size: 1,
        transition: true,
        accessor: 'getAngle'
      },
      instancePixelOffset: {
        size: 2,
        transition: true,
        accessor: 'getPixelOffset'
      }
    });
  }

  updateState(_ref) {
    let {
      oldProps,
      props,
      changeFlags
    } = _ref;
    super.updateState({
      props,
      oldProps,
      changeFlags
    });
    const attributeManager = this.getAttributeManager();
    const {
      iconAtlas,
      iconMapping,
      data,
      getIcon
    } = props;
    const {
      iconManager
    } = this.state;
    iconManager.setProps({
      loadOptions: props.loadOptions
    });
    let iconMappingChanged = false;
    const prePacked = iconAtlas || this.internalState.isAsyncPropLoading('iconAtlas');

    if (prePacked) {
      if (oldProps.iconAtlas !== props.iconAtlas) {
        iconManager.setProps({
          iconAtlas,
          autoPacking: false
        });
      }

      if (oldProps.iconMapping !== props.iconMapping) {
        iconManager.setProps({
          iconMapping
        });
        iconMappingChanged = true;
      }
    } else {
      iconManager.setProps({
        autoPacking: true
      });
    }

    if (changeFlags.dataChanged || changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getIcon)) {
      iconManager.setProps({
        data,
        getIcon
      });
    }

    if (iconMappingChanged) {
      attributeManager.invalidate('instanceOffsets');
      attributeManager.invalidate('instanceIconFrames');
      attributeManager.invalidate('instanceColorModes');
    }

    if (changeFlags.extensionsChanged) {
      var _this$state$model;

      const {
        gl
      } = this.context;
      (_this$state$model = this.state.model) === null || _this$state$model === void 0 ? void 0 : _this$state$model.delete();
      this.state.model = this._getModel(gl);
      attributeManager.invalidateAll();
    }
  }

  get isLoaded() {
    return super.isLoaded && this.state.iconManager.isLoaded;
  }

  finalizeState() {
    super.finalizeState();
    this.state.iconManager.finalize();
  }

  draw(_ref2) {
    let {
      uniforms
    } = _ref2;
    const {
      sizeScale,
      sizeMinPixels,
      sizeMaxPixels,
      sizeUnits,
      billboard,
      alphaCutoff
    } = this.props;
    const {
      iconManager
    } = this.state;
    const iconsTexture = iconManager.getTexture();

    if (iconsTexture) {
      this.state.model.setUniforms(uniforms).setUniforms({
        iconsTexture,
        iconsTextureDim: [iconsTexture.width, iconsTexture.height],
        sizeUnits: UNIT[sizeUnits],
        sizeScale,
        sizeMinPixels,
        sizeMaxPixels,
        billboard,
        alphaCutoff
      }).draw();
    }
  }

  _getModel(gl) {
    const positions = [-1, -1, -1, 1, 1, 1, 1, -1];
    return new Model(gl, { ...this.getShaders(),
      id: this.props.id,
      geometry: new Geometry({
        drawMode: 6,
        attributes: {
          positions: {
            size: 2,
            value: new Float32Array(positions)
          }
        }
      }),
      isInstanced: true
    });
  }

  _onUpdate() {
    this.setNeedsRedraw();
  }

  _onError(evt) {
    const {
      onIconError
    } = this.getCurrentLayer().props;

    if (onIconError) {
      onIconError(evt);
    } else {
      log.error(evt.error)();
    }
  }

  getInstanceOffset(icon) {
    const rect = this.state.iconManager.getIconMapping(icon);
    return [rect.width / 2 - rect.anchorX || 0, rect.height / 2 - rect.anchorY || 0];
  }

  getInstanceColorMode(icon) {
    const mapping = this.state.iconManager.getIconMapping(icon);
    return mapping.mask ? 1 : 0;
  }

  getInstanceIconFrame(icon) {
    const rect = this.state.iconManager.getIconMapping(icon);
    return [rect.x || 0, rect.y || 0, rect.width || 0, rect.height || 0];
  }

}
IconLayer.layerName = 'IconLayer';
IconLayer.defaultProps = defaultProps$8;

var vs$2 = "#define SHADER_NAME scatterplot-layer-vertex-shader\n\nattribute vec3 positions;\n\nattribute vec3 instancePositions;\nattribute vec3 instancePositions64Low;\nattribute float instanceRadius;\nattribute float instanceLineWidths;\nattribute vec4 instanceFillColors;\nattribute vec4 instanceLineColors;\nattribute vec3 instancePickingColors;\n\nuniform float opacity;\nuniform float radiusScale;\nuniform float radiusMinPixels;\nuniform float radiusMaxPixels;\nuniform float lineWidthScale;\nuniform float lineWidthMinPixels;\nuniform float lineWidthMaxPixels;\nuniform float stroked;\nuniform bool filled;\nuniform bool billboard;\nuniform int radiusUnits;\nuniform int lineWidthUnits;\n\nvarying vec4 vFillColor;\nvarying vec4 vLineColor;\nvarying vec2 unitPosition;\nvarying float innerUnitRadius;\nvarying float outerRadiusPixels;\n\nvoid main(void) {\n  geometry.worldPosition = instancePositions;\n  outerRadiusPixels = clamp(\n    project_size_to_pixel(radiusScale * instanceRadius, radiusUnits),\n    radiusMinPixels, radiusMaxPixels\n  );\n  float lineWidthPixels = clamp(\n    project_size_to_pixel(lineWidthScale * instanceLineWidths, lineWidthUnits),\n    lineWidthMinPixels, lineWidthMaxPixels\n  );\n  outerRadiusPixels += stroked * lineWidthPixels / 2.0;\n  unitPosition = positions.xy;\n  geometry.uv = unitPosition;\n  geometry.pickingColor = instancePickingColors;\n\n  innerUnitRadius = 1.0 - stroked * lineWidthPixels / outerRadiusPixels;\n  \n  if (billboard) {\n    gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);\n    vec3 offset = positions * outerRadiusPixels;\n    DECKGL_FILTER_SIZE(offset, geometry);\n    gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);\n  } else {\n    vec3 offset = positions * project_pixel_size(outerRadiusPixels);\n    DECKGL_FILTER_SIZE(offset, geometry);\n    gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset, geometry.position);\n  }\n\n  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);\n  vFillColor = vec4(instanceFillColors.rgb, instanceFillColors.a * opacity);\n  DECKGL_FILTER_COLOR(vFillColor, geometry);\n  vLineColor = vec4(instanceLineColors.rgb, instanceLineColors.a * opacity);\n  DECKGL_FILTER_COLOR(vLineColor, geometry);\n}\n";

var fs$4 = "#define SHADER_NAME scatterplot-layer-fragment-shader\n\nprecision highp float;\n\nuniform bool filled;\nuniform float stroked;\nuniform bool antialiasing;\n\nvarying vec4 vFillColor;\nvarying vec4 vLineColor;\nvarying vec2 unitPosition;\nvarying float innerUnitRadius;\nvarying float outerRadiusPixels;\n\nvoid main(void) {\n  geometry.uv = unitPosition;\n\n  float distToCenter = length(unitPosition) * outerRadiusPixels;\n  float inCircle = antialiasing ? \n    smoothedge(distToCenter, outerRadiusPixels) : \n    step(distToCenter, outerRadiusPixels);\n\n  if (inCircle == 0.0) {\n    discard;\n  }\n\n  if (stroked > 0.5) {\n    float isLine = antialiasing ? \n      smoothedge(innerUnitRadius * outerRadiusPixels, distToCenter) :\n      step(innerUnitRadius * outerRadiusPixels, distToCenter);\n\n    if (filled) {\n      gl_FragColor = mix(vFillColor, vLineColor, isLine);\n    } else {\n      if (isLine == 0.0) {\n        discard;\n      }\n      gl_FragColor = vec4(vLineColor.rgb, vLineColor.a * isLine);\n    }\n  } else if (filled) {\n    gl_FragColor = vFillColor;\n  } else {\n    discard;\n  }\n\n  gl_FragColor.a *= inCircle;\n  DECKGL_FILTER_COLOR(gl_FragColor, geometry);\n}\n";

const DEFAULT_COLOR$3 = [0, 0, 0, 255];
const defaultProps$7 = {
  radiusUnits: 'meters',
  radiusScale: {
    type: 'number',
    min: 0,
    value: 1
  },
  radiusMinPixels: {
    type: 'number',
    min: 0,
    value: 0
  },
  radiusMaxPixels: {
    type: 'number',
    min: 0,
    value: Number.MAX_SAFE_INTEGER
  },
  lineWidthUnits: 'meters',
  lineWidthScale: {
    type: 'number',
    min: 0,
    value: 1
  },
  lineWidthMinPixels: {
    type: 'number',
    min: 0,
    value: 0
  },
  lineWidthMaxPixels: {
    type: 'number',
    min: 0,
    value: Number.MAX_SAFE_INTEGER
  },
  stroked: false,
  filled: true,
  billboard: false,
  antialiasing: true,
  getPosition: {
    type: 'accessor',
    value: x => x.position
  },
  getRadius: {
    type: 'accessor',
    value: 1
  },
  getFillColor: {
    type: 'accessor',
    value: DEFAULT_COLOR$3
  },
  getLineColor: {
    type: 'accessor',
    value: DEFAULT_COLOR$3
  },
  getLineWidth: {
    type: 'accessor',
    value: 1
  },
  strokeWidth: {
    deprecatedFor: 'getLineWidth'
  },
  outline: {
    deprecatedFor: 'stroked'
  },
  getColor: {
    deprecatedFor: ['getFillColor', 'getLineColor']
  }
};
class ScatterplotLayer extends Layer {
  getShaders() {
    return super.getShaders({
      vs: vs$2,
      fs: fs$4,
      modules: [project32, picking]
    });
  }

  initializeState() {
    this.getAttributeManager().addInstanced({
      instancePositions: {
        size: 3,
        type: 5130,
        fp64: this.use64bitPositions(),
        transition: true,
        accessor: 'getPosition'
      },
      instanceRadius: {
        size: 1,
        transition: true,
        accessor: 'getRadius',
        defaultValue: 1
      },
      instanceFillColors: {
        size: this.props.colorFormat.length,
        transition: true,
        normalized: true,
        type: 5121,
        accessor: 'getFillColor',
        defaultValue: [0, 0, 0, 255]
      },
      instanceLineColors: {
        size: this.props.colorFormat.length,
        transition: true,
        normalized: true,
        type: 5121,
        accessor: 'getLineColor',
        defaultValue: [0, 0, 0, 255]
      },
      instanceLineWidths: {
        size: 1,
        transition: true,
        accessor: 'getLineWidth',
        defaultValue: 1
      }
    });
  }

  updateState(_ref) {
    let {
      props,
      oldProps,
      changeFlags
    } = _ref;
    super.updateState({
      props,
      oldProps,
      changeFlags
    });

    if (changeFlags.extensionsChanged) {
      var _this$state$model;

      const {
        gl
      } = this.context;
      (_this$state$model = this.state.model) === null || _this$state$model === void 0 ? void 0 : _this$state$model.delete();
      this.state.model = this._getModel(gl);
      this.getAttributeManager().invalidateAll();
    }
  }

  draw(_ref2) {
    let {
      uniforms
    } = _ref2;
    const {
      radiusUnits,
      radiusScale,
      radiusMinPixels,
      radiusMaxPixels,
      stroked,
      filled,
      billboard,
      antialiasing,
      lineWidthUnits,
      lineWidthScale,
      lineWidthMinPixels,
      lineWidthMaxPixels
    } = this.props;
    this.state.model.setUniforms(uniforms).setUniforms({
      stroked: stroked ? 1 : 0,
      filled,
      billboard,
      antialiasing,
      radiusUnits: UNIT[radiusUnits],
      radiusScale,
      radiusMinPixels,
      radiusMaxPixels,
      lineWidthUnits: UNIT[lineWidthUnits],
      lineWidthScale,
      lineWidthMinPixels,
      lineWidthMaxPixels
    }).draw();
  }

  _getModel(gl) {
    const positions = [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0];
    return new Model(gl, { ...this.getShaders(),
      id: this.props.id,
      geometry: new Geometry({
        drawMode: 6,
        vertexCount: 4,
        attributes: {
          positions: {
            size: 3,
            value: new Float32Array(positions)
          }
        }
      }),
      isInstanced: true
    });
  }

}
ScatterplotLayer.layerName = 'ScatterplotLayer';
ScatterplotLayer.defaultProps = defaultProps$7;

const WINDING = {
  CLOCKWISE: 1,
  COUNTER_CLOCKWISE: -1
};
function modifyPolygonWindingDirection(points, direction, options = {}) {
  const windingDirection = getPolygonWindingDirection(points, options);

  if (windingDirection !== direction) {
    reversePolygon(points, options);
    return true;
  }

  return false;
}
function getPolygonWindingDirection(points, options = {}) {
  return Math.sign(getPolygonSignedArea(points, options));
}
function getPolygonSignedArea(points, options = {}) {
  const {
    start = 0,
    end = points.length
  } = options;
  const dim = options.size || 2;
  let area = 0;

  for (let i = start, j = end - dim; i < end; i += dim) {
    area += (points[i] - points[j]) * (points[i + 1] + points[j + 1]);
    j = i;
  }

  return area / 2;
}

function reversePolygon(points, options) {
  const {
    start = 0,
    end = points.length,
    size = 2
  } = options;
  const numPoints = (end - start) / size;
  const numSwaps = Math.floor(numPoints / 2);

  for (let i = 0; i < numSwaps; ++i) {
    const b1 = start + i * size;
    const b2 = start + (numPoints - 1 - i) * size;

    for (let j = 0; j < size; ++j) {
      const tmp = points[b1 + j];
      points[b1 + j] = points[b2 + j];
      points[b2 + j] = tmp;
    }
  }
}

function push(target, source) {
  const size = source.length;
  const startIndex = target.length;

  if (startIndex > 0) {
    let isDuplicate = true;

    for (let i = 0; i < size; i++) {
      if (target[startIndex - size + i] !== source[i]) {
        isDuplicate = false;
        break;
      }
    }

    if (isDuplicate) {
      return false;
    }
  }

  for (let i = 0; i < size; i++) {
    target[startIndex + i] = source[i];
  }

  return true;
}
function copy(target, source) {
  const size = source.length;

  for (let i = 0; i < size; i++) {
    target[i] = source[i];
  }
}
function getPointAtIndex(positions, index, size, offset, out = []) {
  const startI = offset + index * size;

  for (let i = 0; i < size; i++) {
    out[i] = positions[startI + i];
  }

  return out;
}

function intersect(a, b, edge, bbox, out = []) {
  let t;
  let snap;

  if (edge & 8) {
    t = (bbox[3] - a[1]) / (b[1] - a[1]);
    snap = 3;
  } else if (edge & 4) {
    t = (bbox[1] - a[1]) / (b[1] - a[1]);
    snap = 1;
  } else if (edge & 2) {
    t = (bbox[2] - a[0]) / (b[0] - a[0]);
    snap = 2;
  } else if (edge & 1) {
    t = (bbox[0] - a[0]) / (b[0] - a[0]);
    snap = 0;
  } else {
    return null;
  }

  for (let i = 0; i < a.length; i++) {
    out[i] = (snap & 1) === i ? bbox[snap] : t * (b[i] - a[i]) + a[i];
  }

  return out;
}
function bitCode(p, bbox) {
  let code = 0;
  if (p[0] < bbox[0]) code |= 1;else if (p[0] > bbox[2]) code |= 2;
  if (p[1] < bbox[1]) code |= 4;else if (p[1] > bbox[3]) code |= 8;
  return code;
}

function cutPolylineByGrid(positions, options = {}) {
  const {
    size = 2,
    broken = false,
    gridResolution = 10,
    gridOffset = [0, 0],
    startIndex = 0,
    endIndex = positions.length
  } = options;
  const numPoints = (endIndex - startIndex) / size;
  let part = [];
  const result = [part];
  const a = getPointAtIndex(positions, 0, size, startIndex);
  let b;
  let codeB;
  const cell = getGridCell(a, gridResolution, gridOffset, []);
  const scratchPoint = [];
  push(part, a);

  for (let i = 1; i < numPoints; i++) {
    b = getPointAtIndex(positions, i, size, startIndex, b);
    codeB = bitCode(b, cell);

    while (codeB) {
      intersect(a, b, codeB, cell, scratchPoint);
      const codeAlt = bitCode(scratchPoint, cell);

      if (codeAlt) {
        intersect(a, scratchPoint, codeAlt, cell, scratchPoint);
        codeB = codeAlt;
      }

      push(part, scratchPoint);
      copy(a, scratchPoint);
      moveToNeighborCell(cell, gridResolution, codeB);

      if (broken && part.length > size) {
        part = [];
        result.push(part);
        push(part, a);
      }

      codeB = bitCode(b, cell);
    }

    push(part, b);
    copy(a, b);
  }

  return broken ? result : result[0];
}
const TYPE_INSIDE = 0;
const TYPE_BORDER = 1;

function concatInPlace(arr1, arr2) {
  for (let i = 0; i < arr2.length; i++) {
    arr1.push(arr2[i]);
  }

  return arr1;
}

function cutPolygonByGrid(positions, holeIndices, options = {}) {
  if (!positions.length) {
    return [];
  }

  const {
    size = 2,
    gridResolution = 10,
    gridOffset = [0, 0],
    edgeTypes = false
  } = options;
  const result = [];
  const queue = [{
    pos: positions,
    types: edgeTypes && new Array(positions.length / size).fill(TYPE_BORDER),
    holes: holeIndices || []
  }];
  const bbox = [[], []];
  let cell = [];

  while (queue.length) {
    const {
      pos,
      types,
      holes
    } = queue.shift();
    getBoundingBox$1(pos, size, holes[0] || pos.length, bbox);
    cell = getGridCell(bbox[0], gridResolution, gridOffset, cell);
    const code = bitCode(bbox[1], cell);

    if (code) {
      let parts = bisectPolygon(pos, types, size, 0, holes[0] || pos.length, cell, code);
      const polygonLow = {
        pos: parts[0].pos,
        types: parts[0].types,
        holes: []
      };
      const polygonHigh = {
        pos: parts[1].pos,
        types: parts[1].types,
        holes: []
      };
      queue.push(polygonLow, polygonHigh);

      for (let i = 0; i < holes.length; i++) {
        parts = bisectPolygon(pos, types, size, holes[i], holes[i + 1] || pos.length, cell, code);

        if (parts[0]) {
          polygonLow.holes.push(polygonLow.pos.length);
          polygonLow.pos = concatInPlace(polygonLow.pos, parts[0].pos);

          if (edgeTypes) {
            polygonLow.types = concatInPlace(polygonLow.types, parts[0].types);
          }
        }

        if (parts[1]) {
          polygonHigh.holes.push(polygonHigh.pos.length);
          polygonHigh.pos = concatInPlace(polygonHigh.pos, parts[1].pos);

          if (edgeTypes) {
            polygonHigh.types = concatInPlace(polygonHigh.types, parts[1].types);
          }
        }
      }
    } else {
      const polygon = {
        positions: pos
      };

      if (edgeTypes) {
        polygon.edgeTypes = types;
      }

      if (holes.length) {
        polygon.holeIndices = holes;
      }

      result.push(polygon);
    }
  }

  return result;
}

function bisectPolygon(positions, edgeTypes, size, startIndex, endIndex, bbox, edge) {
  const numPoints = (endIndex - startIndex) / size;
  const resultLow = [];
  const resultHigh = [];
  const typesLow = [];
  const typesHigh = [];
  const scratchPoint = [];
  let p;
  let side;
  let type;
  const prev = getPointAtIndex(positions, numPoints - 1, size, startIndex);
  let prevSide = Math.sign(edge & 8 ? prev[1] - bbox[3] : prev[0] - bbox[2]);
  let prevType = edgeTypes && edgeTypes[numPoints - 1];
  let lowPointCount = 0;
  let highPointCount = 0;

  for (let i = 0; i < numPoints; i++) {
    p = getPointAtIndex(positions, i, size, startIndex, p);
    side = Math.sign(edge & 8 ? p[1] - bbox[3] : p[0] - bbox[2]);
    type = edgeTypes && edgeTypes[startIndex / size + i];

    if (side && prevSide && prevSide !== side) {
      intersect(prev, p, edge, bbox, scratchPoint);
      push(resultLow, scratchPoint) && typesLow.push(prevType);
      push(resultHigh, scratchPoint) && typesHigh.push(prevType);
    }

    if (side <= 0) {
      push(resultLow, p) && typesLow.push(type);
      lowPointCount -= side;
    } else if (typesLow.length) {
      typesLow[typesLow.length - 1] = TYPE_INSIDE;
    }

    if (side >= 0) {
      push(resultHigh, p) && typesHigh.push(type);
      highPointCount += side;
    } else if (typesHigh.length) {
      typesHigh[typesHigh.length - 1] = TYPE_INSIDE;
    }

    copy(prev, p);
    prevSide = side;
    prevType = type;
  }

  return [lowPointCount ? {
    pos: resultLow,
    types: edgeTypes && typesLow
  } : null, highPointCount ? {
    pos: resultHigh,
    types: edgeTypes && typesHigh
  } : null];
}

function getGridCell(p, gridResolution, gridOffset, out) {
  const left = Math.floor((p[0] - gridOffset[0]) / gridResolution) * gridResolution + gridOffset[0];
  const bottom = Math.floor((p[1] - gridOffset[1]) / gridResolution) * gridResolution + gridOffset[1];
  out[0] = left;
  out[1] = bottom;
  out[2] = left + gridResolution;
  out[3] = bottom + gridResolution;
  return out;
}

function moveToNeighborCell(cell, gridResolution, edge) {
  if (edge & 8) {
    cell[1] += gridResolution;
    cell[3] += gridResolution;
  } else if (edge & 4) {
    cell[1] -= gridResolution;
    cell[3] -= gridResolution;
  } else if (edge & 2) {
    cell[0] += gridResolution;
    cell[2] += gridResolution;
  } else if (edge & 1) {
    cell[0] -= gridResolution;
    cell[2] -= gridResolution;
  }
}

function getBoundingBox$1(positions, size, endIndex, out) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < endIndex; i += size) {
    const x = positions[i];
    const y = positions[i + 1];
    minX = x < minX ? x : minX;
    maxX = x > maxX ? x : maxX;
    minY = y < minY ? y : minY;
    maxY = y > maxY ? y : maxY;
  }

  out[0][0] = minX;
  out[0][1] = minY;
  out[1][0] = maxX;
  out[1][1] = maxY;
  return out;
}

const DEFAULT_MAX_LATITUDE = 85.051129;
function cutPolylineByMercatorBounds(positions, options = {}) {
  const {
    size = 2,
    startIndex = 0,
    endIndex = positions.length,
    normalize = true
  } = options;
  const newPositions = positions.slice(startIndex, endIndex);
  wrapLongitudesForShortestPath(newPositions, size, 0, endIndex - startIndex);
  const parts = cutPolylineByGrid(newPositions, {
    size,
    broken: true,
    gridResolution: 360,
    gridOffset: [-180, -180]
  });

  if (normalize) {
    for (const part of parts) {
      shiftLongitudesIntoRange(part, size);
    }
  }

  return parts;
}
function cutPolygonByMercatorBounds(positions, holeIndices, options = {}) {
  const {
    size = 2,
    normalize = true,
    edgeTypes = false
  } = options;
  holeIndices = holeIndices || [];
  const newPositions = [];
  const newHoleIndices = [];
  let srcStartIndex = 0;
  let targetIndex = 0;

  for (let ringIndex = 0; ringIndex <= holeIndices.length; ringIndex++) {
    const srcEndIndex = holeIndices[ringIndex] || positions.length;
    const targetStartIndex = targetIndex;
    const splitIndex = findSplitIndex(positions, size, srcStartIndex, srcEndIndex);

    for (let i = splitIndex; i < srcEndIndex; i++) {
      newPositions[targetIndex++] = positions[i];
    }

    for (let i = srcStartIndex; i < splitIndex; i++) {
      newPositions[targetIndex++] = positions[i];
    }

    wrapLongitudesForShortestPath(newPositions, size, targetStartIndex, targetIndex);
    insertPoleVertices(newPositions, size, targetStartIndex, targetIndex, options.maxLatitude);
    srcStartIndex = srcEndIndex;
    newHoleIndices[ringIndex] = targetIndex;
  }

  newHoleIndices.pop();
  const parts = cutPolygonByGrid(newPositions, newHoleIndices, {
    size,
    gridResolution: 360,
    gridOffset: [-180, -180],
    edgeTypes
  });

  if (normalize) {
    for (const part of parts) {
      shiftLongitudesIntoRange(part.positions, size);
    }
  }

  return parts;
}

function findSplitIndex(positions, size, startIndex, endIndex) {
  let maxLat = -1;
  let pointIndex = -1;

  for (let i = startIndex + 1; i < endIndex; i += size) {
    const lat = Math.abs(positions[i]);

    if (lat > maxLat) {
      maxLat = lat;
      pointIndex = i - 1;
    }
  }

  return pointIndex;
}

function insertPoleVertices(positions, size, startIndex, endIndex, maxLatitude = DEFAULT_MAX_LATITUDE) {
  const firstLng = positions[startIndex];
  const lastLng = positions[endIndex - size];

  if (Math.abs(firstLng - lastLng) > 180) {
    const p = getPointAtIndex(positions, 0, size, startIndex);
    p[0] += Math.round((lastLng - firstLng) / 360) * 360;
    push(positions, p);
    p[1] = Math.sign(p[1]) * maxLatitude;
    push(positions, p);
    p[0] = firstLng;
    push(positions, p);
  }
}

function wrapLongitudesForShortestPath(positions, size, startIndex, endIndex) {
  let prevLng = positions[0];
  let lng;

  for (let i = startIndex; i < endIndex; i += size) {
    lng = positions[i];
    const delta = lng - prevLng;

    if (delta > 180 || delta < -180) {
      lng -= Math.round(delta / 360) * 360;
    }

    positions[i] = prevLng = lng;
  }
}

function shiftLongitudesIntoRange(positions, size) {
  let refLng;
  const pointCount = positions.length / size;

  for (let i = 0; i < pointCount; i++) {
    refLng = positions[i * size];

    if ((refLng + 180) % 360 !== 0) {
      break;
    }
  }

  const delta = -Math.round(refLng / 360) * 360;

  if (delta === 0) {
    return;
  }

  for (let i = 0; i < pointCount; i++) {
    positions[i * size] += delta;
  }
}

function normalizePath(path, size, gridResolution, wrapLongitude) {
  let flatPath = path;

  if (Array.isArray(path[0])) {
    const length = path.length * size;
    flatPath = new Array(length);

    for (let i = 0; i < path.length; i++) {
      for (let j = 0; j < size; j++) {
        flatPath[i * size + j] = path[i][j] || 0;
      }
    }
  }

  if (gridResolution) {
    return cutPolylineByGrid(flatPath, {
      size,
      gridResolution
    });
  }

  if (wrapLongitude) {
    return cutPolylineByMercatorBounds(flatPath, {
      size
    });
  }

  return flatPath;
}

const START_CAP = 1;
const END_CAP = 2;
const INVALID = 4;
class PathTesselator extends Tesselator {
  constructor(opts) {
    super({ ...opts,
      attributes: {
        positions: {
          size: 3,
          padding: 18,
          initialize: true,
          type: opts.fp64 ? Float64Array : Float32Array
        },
        segmentTypes: {
          size: 1,
          type: Uint8ClampedArray
        }
      }
    });
  }

  getGeometryFromBuffer(buffer) {
    if (this.normalize) {
      return super.getGeometryFromBuffer(buffer);
    }

    return () => null;
  }

  normalizeGeometry(path) {
    if (this.normalize) {
      return normalizePath(path, this.positionSize, this.opts.resolution, this.opts.wrapLongitude);
    }

    return path;
  }

  get(attributeName) {
    return this.attributes[attributeName];
  }

  getGeometrySize(path) {
    if (Array.isArray(path[0])) {
      let size = 0;

      for (const subPath of path) {
        size += this.getGeometrySize(subPath);
      }

      return size;
    }

    const numPoints = this.getPathLength(path);

    if (numPoints < 2) {
      return 0;
    }

    if (this.isClosed(path)) {
      return numPoints < 3 ? 0 : numPoints + 2;
    }

    return numPoints;
  }

  updateGeometryAttributes(path, context) {
    if (context.geometrySize === 0) {
      return;
    }

    if (path && Array.isArray(path[0])) {
      for (const subPath of path) {
        const geometrySize = this.getGeometrySize(subPath);
        context.geometrySize = geometrySize;
        this.updateGeometryAttributes(subPath, context);
        context.vertexStart += geometrySize;
      }
    } else {
      this._updateSegmentTypes(path, context);

      this._updatePositions(path, context);
    }
  }

  _updateSegmentTypes(path, context) {
    const {
      segmentTypes
    } = this.attributes;
    const isPathClosed = this.isClosed(path);
    const {
      vertexStart,
      geometrySize
    } = context;
    segmentTypes.fill(0, vertexStart, vertexStart + geometrySize);

    if (isPathClosed) {
      segmentTypes[vertexStart] = INVALID;
      segmentTypes[vertexStart + geometrySize - 2] = INVALID;
    } else {
      segmentTypes[vertexStart] += START_CAP;
      segmentTypes[vertexStart + geometrySize - 2] += END_CAP;
    }

    segmentTypes[vertexStart + geometrySize - 1] = INVALID;
  }

  _updatePositions(path, context) {
    const {
      positions
    } = this.attributes;

    if (!positions) {
      return;
    }

    const {
      vertexStart,
      geometrySize
    } = context;
    const p = new Array(3);

    for (let i = vertexStart, ptIndex = 0; ptIndex < geometrySize; i++, ptIndex++) {
      this.getPointOnPath(path, ptIndex, p);
      positions[i * 3] = p[0];
      positions[i * 3 + 1] = p[1];
      positions[i * 3 + 2] = p[2];
    }
  }

  getPathLength(path) {
    return path.length / this.positionSize;
  }

  getPointOnPath(path, index) {
    let target = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
    const {
      positionSize
    } = this;

    if (index * positionSize >= path.length) {
      index += 1 - path.length / positionSize;
    }

    const i = index * positionSize;
    target[0] = path[i];
    target[1] = path[i + 1];
    target[2] = positionSize === 3 && path[i + 2] || 0;
    return target;
  }

  isClosed(path) {
    if (!this.normalize) {
      return this.opts.loop;
    }

    const {
      positionSize
    } = this;
    const lastPointIndex = path.length - positionSize;
    return path[0] === path[lastPointIndex] && path[1] === path[lastPointIndex + 1] && (positionSize === 2 || path[2] === path[lastPointIndex + 2]);
  }

}

var vs$1 = "#define SHADER_NAME path-layer-vertex-shader\n\nattribute vec2 positions;\n\nattribute float instanceTypes;\nattribute vec3 instanceStartPositions;\nattribute vec3 instanceEndPositions;\nattribute vec3 instanceLeftPositions;\nattribute vec3 instanceRightPositions;\nattribute vec3 instanceLeftPositions64Low;\nattribute vec3 instanceStartPositions64Low;\nattribute vec3 instanceEndPositions64Low;\nattribute vec3 instanceRightPositions64Low;\nattribute float instanceStrokeWidths;\nattribute vec4 instanceColors;\nattribute vec3 instancePickingColors;\n\nuniform float widthScale;\nuniform float widthMinPixels;\nuniform float widthMaxPixels;\nuniform float jointType;\nuniform float capType;\nuniform float miterLimit;\nuniform bool billboard;\nuniform int widthUnits;\n\nuniform float opacity;\n\nvarying vec4 vColor;\nvarying vec2 vCornerOffset;\nvarying float vMiterLength;\nvarying vec2 vPathPosition;\nvarying float vPathLength;\nvarying float vJointType;\n\nconst float EPSILON = 0.001;\nconst vec3 ZERO_OFFSET = vec3(0.0);\n\nfloat flipIfTrue(bool flag) {\n  return -(float(flag) * 2. - 1.);\n}\nvec3 lineJoin(\n  vec3 prevPoint, vec3 currPoint, vec3 nextPoint,\n  vec2 width\n) {\n  bool isEnd = positions.x > 0.0;\n  float sideOfPath = positions.y;\n  float isJoint = float(sideOfPath == 0.0);\n\n  vec3 deltaA3 = (currPoint - prevPoint);\n  vec3 deltaB3 = (nextPoint - currPoint);\n\n  mat3 rotationMatrix;\n  bool needsRotation = !billboard && project_needs_rotation(currPoint, rotationMatrix);\n  if (needsRotation) {\n    deltaA3 = deltaA3 * rotationMatrix;\n    deltaB3 = deltaB3 * rotationMatrix;\n  }\n  vec2 deltaA = deltaA3.xy / width;\n  vec2 deltaB = deltaB3.xy / width;\n\n  float lenA = length(deltaA);\n  float lenB = length(deltaB);\n\n  vec2 dirA = lenA > 0. ? normalize(deltaA) : vec2(0.0, 0.0);\n  vec2 dirB = lenB > 0. ? normalize(deltaB) : vec2(0.0, 0.0);\n\n  vec2 perpA = vec2(-dirA.y, dirA.x);\n  vec2 perpB = vec2(-dirB.y, dirB.x);\n  vec2 tangent = dirA + dirB;\n  tangent = length(tangent) > 0. ? normalize(tangent) : perpA;\n  vec2 miterVec = vec2(-tangent.y, tangent.x);\n  vec2 dir = isEnd ? dirA : dirB;\n  vec2 perp = isEnd ? perpA : perpB;\n  float L = isEnd ? lenA : lenB;\n  float sinHalfA = abs(dot(miterVec, perp));\n  float cosHalfA = abs(dot(dirA, miterVec));\n  float turnDirection = flipIfTrue(dirA.x * dirB.y >= dirA.y * dirB.x);\n  float cornerPosition = sideOfPath * turnDirection;\n\n  float miterSize = 1.0 / max(sinHalfA, EPSILON);\n  miterSize = mix(\n    min(miterSize, max(lenA, lenB) / max(cosHalfA, EPSILON)),\n    miterSize,\n    step(0.0, cornerPosition)\n  );\n\n  vec2 offsetVec = mix(miterVec * miterSize, perp, step(0.5, cornerPosition))\n    * (sideOfPath + isJoint * turnDirection);\n  bool isStartCap = lenA == 0.0 || (!isEnd && (instanceTypes == 1.0 || instanceTypes == 3.0));\n  bool isEndCap = lenB == 0.0 || (isEnd && (instanceTypes == 2.0 || instanceTypes == 3.0));\n  bool isCap = isStartCap || isEndCap;\n  if (isCap) {\n    offsetVec = mix(perp * sideOfPath, dir * capType * 4.0 * flipIfTrue(isStartCap), isJoint);\n    vJointType = capType;\n  } else {\n    vJointType = jointType;\n  }\n  vPathLength = L;\n  vCornerOffset = offsetVec;\n  vMiterLength = dot(vCornerOffset, miterVec * turnDirection);\n  vMiterLength = isCap ? isJoint : vMiterLength;\n\n  vec2 offsetFromStartOfPath = vCornerOffset + deltaA * float(isEnd);\n  vPathPosition = vec2(\n    dot(offsetFromStartOfPath, perp),\n    dot(offsetFromStartOfPath, dir)\n  );\n  geometry.uv = vPathPosition;\n\n  float isValid = step(instanceTypes, 3.5);\n  vec3 offset = vec3(offsetVec * width * isValid, 0.0);\n\n  if (needsRotation) {\n    offset = rotationMatrix * offset;\n  }\n  return currPoint + offset;\n}\nvoid clipLine(inout vec4 position, vec4 refPosition) {\n  if (position.w < EPSILON) {\n    float r = (EPSILON - refPosition.w) / (position.w - refPosition.w);\n    position = refPosition + (position - refPosition) * r;\n  }\n}\n\nvoid main() {\n  geometry.pickingColor = instancePickingColors;\n\n  vColor = vec4(instanceColors.rgb, instanceColors.a * opacity);\n\n  float isEnd = positions.x;\n\n  vec3 prevPosition = mix(instanceLeftPositions, instanceStartPositions, isEnd);\n  vec3 prevPosition64Low = mix(instanceLeftPositions64Low, instanceStartPositions64Low, isEnd);\n\n  vec3 currPosition = mix(instanceStartPositions, instanceEndPositions, isEnd);\n  vec3 currPosition64Low = mix(instanceStartPositions64Low, instanceEndPositions64Low, isEnd);\n\n  vec3 nextPosition = mix(instanceEndPositions, instanceRightPositions, isEnd);\n  vec3 nextPosition64Low = mix(instanceEndPositions64Low, instanceRightPositions64Low, isEnd);\n\n  geometry.worldPosition = currPosition;\n  vec2 widthPixels = vec2(clamp(\n    project_size_to_pixel(instanceStrokeWidths * widthScale, widthUnits),\n    widthMinPixels, widthMaxPixels) / 2.0);\n  vec3 width;\n\n  if (billboard) {\n    vec4 prevPositionScreen = project_position_to_clipspace(prevPosition, prevPosition64Low, ZERO_OFFSET);\n    vec4 currPositionScreen = project_position_to_clipspace(currPosition, currPosition64Low, ZERO_OFFSET, geometry.position);\n    vec4 nextPositionScreen = project_position_to_clipspace(nextPosition, nextPosition64Low, ZERO_OFFSET);\n\n    clipLine(prevPositionScreen, currPositionScreen);\n    clipLine(nextPositionScreen, currPositionScreen);\n    clipLine(currPositionScreen, mix(nextPositionScreen, prevPositionScreen, isEnd));\n\n    width = vec3(widthPixels, 0.0);\n    DECKGL_FILTER_SIZE(width, geometry);\n\n    vec3 pos = lineJoin(\n      prevPositionScreen.xyz / prevPositionScreen.w,\n      currPositionScreen.xyz / currPositionScreen.w,\n      nextPositionScreen.xyz / nextPositionScreen.w,\n      project_pixel_size_to_clipspace(width.xy)\n    );\n\n    gl_Position = vec4(pos * currPositionScreen.w, currPositionScreen.w);\n  } else {\n    prevPosition = project_position(prevPosition, prevPosition64Low);\n    currPosition = project_position(currPosition, currPosition64Low);\n    nextPosition = project_position(nextPosition, nextPosition64Low);\n\n    width = vec3(project_pixel_size(widthPixels), 0.0);\n    DECKGL_FILTER_SIZE(width, geometry);\n\n    vec4 pos = vec4(\n      lineJoin(prevPosition, currPosition, nextPosition, width.xy),\n      1.0);\n    geometry.position = pos;\n    gl_Position = project_common_position_to_clipspace(pos);\n  }\n  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);\n  DECKGL_FILTER_COLOR(vColor, geometry);\n}\n";

var fs$3 = "#define SHADER_NAME path-layer-fragment-shader\n\nprecision highp float;\n\nuniform float miterLimit;\n\nvarying vec4 vColor;\nvarying vec2 vCornerOffset;\nvarying float vMiterLength;\nvarying vec2 vPathPosition;\nvarying float vPathLength;\nvarying float vJointType;\n\nvoid main(void) {\n  geometry.uv = vPathPosition;\n\n  if (vPathPosition.y < 0.0 || vPathPosition.y > vPathLength) {\n    if (vJointType > 0.5 && length(vCornerOffset) > 1.0) {\n      discard;\n    }\n    if (vJointType < 0.5 && vMiterLength > miterLimit + 1.0) {\n      discard;\n    }\n  }\n  gl_FragColor = vColor;\n\n  DECKGL_FILTER_COLOR(gl_FragColor, geometry);\n}\n";

const DEFAULT_COLOR$2 = [0, 0, 0, 255];
const defaultProps$6 = {
  widthUnits: 'meters',
  widthScale: {
    type: 'number',
    min: 0,
    value: 1
  },
  widthMinPixels: {
    type: 'number',
    min: 0,
    value: 0
  },
  widthMaxPixels: {
    type: 'number',
    min: 0,
    value: Number.MAX_SAFE_INTEGER
  },
  jointRounded: false,
  capRounded: false,
  miterLimit: {
    type: 'number',
    min: 0,
    value: 4
  },
  billboard: false,
  _pathType: null,
  getPath: {
    type: 'accessor',
    value: object => object.path
  },
  getColor: {
    type: 'accessor',
    value: DEFAULT_COLOR$2
  },
  getWidth: {
    type: 'accessor',
    value: 1
  },
  rounded: {
    deprecatedFor: ['jointRounded', 'capRounded']
  }
};
const ATTRIBUTE_TRANSITION$1 = {
  enter: (value, chunk) => {
    return chunk.length ? chunk.subarray(chunk.length - value.length) : value;
  }
};
class PathLayer extends Layer {
  getShaders() {
    return super.getShaders({
      vs: vs$1,
      fs: fs$3,
      modules: [project32, picking]
    });
  }

  get wrapLongitude() {
    return false;
  }

  initializeState() {
    const noAlloc = true;
    const attributeManager = this.getAttributeManager();
    attributeManager.addInstanced({
      positions: {
        size: 3,
        vertexOffset: 1,
        type: 5130,
        fp64: this.use64bitPositions(),
        transition: ATTRIBUTE_TRANSITION$1,
        accessor: 'getPath',
        update: this.calculatePositions,
        noAlloc,
        shaderAttributes: {
          instanceLeftPositions: {
            vertexOffset: 0
          },
          instanceStartPositions: {
            vertexOffset: 1
          },
          instanceEndPositions: {
            vertexOffset: 2
          },
          instanceRightPositions: {
            vertexOffset: 3
          }
        }
      },
      instanceTypes: {
        size: 1,
        type: 5121,
        update: this.calculateSegmentTypes,
        noAlloc
      },
      instanceStrokeWidths: {
        size: 1,
        accessor: 'getWidth',
        transition: ATTRIBUTE_TRANSITION$1,
        defaultValue: 1
      },
      instanceColors: {
        size: this.props.colorFormat.length,
        type: 5121,
        normalized: true,
        accessor: 'getColor',
        transition: ATTRIBUTE_TRANSITION$1,
        defaultValue: DEFAULT_COLOR$2
      },
      instancePickingColors: {
        size: 3,
        type: 5121,
        accessor: (object, _ref) => {
          let {
            index,
            target: value
          } = _ref;
          return this.encodePickingColor(object && object.__source ? object.__source.index : index, value);
        }
      }
    });
    this.setState({
      pathTesselator: new PathTesselator({
        fp64: this.use64bitPositions()
      })
    });

    if (this.props.getDashArray && !this.props.extensions.length) {
      log.removed('getDashArray', 'PathStyleExtension')();
    }
  }

  updateState(_ref2) {
    let {
      oldProps,
      props,
      changeFlags
    } = _ref2;
    super.updateState({
      props,
      oldProps,
      changeFlags
    });
    const attributeManager = this.getAttributeManager();
    const geometryChanged = changeFlags.dataChanged || changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getPath);

    if (geometryChanged) {
      const {
        pathTesselator
      } = this.state;
      const buffers = props.data.attributes || {};
      pathTesselator.updateGeometry({
        data: props.data,
        geometryBuffer: buffers.getPath,
        buffers,
        normalize: !props._pathType,
        loop: props._pathType === 'loop',
        getGeometry: props.getPath,
        positionFormat: props.positionFormat,
        wrapLongitude: props.wrapLongitude,
        resolution: this.context.viewport.resolution,
        dataChanged: changeFlags.dataChanged
      });
      this.setState({
        numInstances: pathTesselator.instanceCount,
        startIndices: pathTesselator.vertexStarts
      });

      if (!changeFlags.dataChanged) {
        attributeManager.invalidateAll();
      }
    }

    if (changeFlags.extensionsChanged) {
      var _this$state$model;

      const {
        gl
      } = this.context;
      (_this$state$model = this.state.model) === null || _this$state$model === void 0 ? void 0 : _this$state$model.delete();
      this.state.model = this._getModel(gl);
      attributeManager.invalidateAll();
    }
  }

  getPickingInfo(params) {
    const info = super.getPickingInfo(params);
    const {
      index
    } = info;
    const {
      data
    } = this.props;

    if (data[0] && data[0].__source) {
      info.object = data.find(d => d.__source.index === index);
    }

    return info;
  }

  disablePickingIndex(objectIndex) {
    const {
      data
    } = this.props;

    if (data[0] && data[0].__source) {
      for (let i = 0; i < data.length; i++) {
        if (data[i].__source.index === objectIndex) {
          this._disablePickingIndex(i);
        }
      }
    } else {
      this._disablePickingIndex(objectIndex);
    }
  }

  draw(_ref3) {
    let {
      uniforms
    } = _ref3;
    const {
      jointRounded,
      capRounded,
      billboard,
      miterLimit,
      widthUnits,
      widthScale,
      widthMinPixels,
      widthMaxPixels
    } = this.props;
    this.state.model.setUniforms(uniforms).setUniforms({
      jointType: Number(jointRounded),
      capType: Number(capRounded),
      billboard,
      widthUnits: UNIT[widthUnits],
      widthScale,
      miterLimit,
      widthMinPixels,
      widthMaxPixels
    }).draw();
  }

  _getModel(gl) {
    const SEGMENT_INDICES = [0, 1, 2, 1, 4, 2, 1, 3, 4, 3, 5, 4];
    const SEGMENT_POSITIONS = [0, 0, 0, -1, 0, 1, 1, -1, 1, 1, 1, 0];
    return new Model(gl, { ...this.getShaders(),
      id: this.props.id,
      geometry: new Geometry({
        drawMode: 4,
        attributes: {
          indices: new Uint16Array(SEGMENT_INDICES),
          positions: {
            value: new Float32Array(SEGMENT_POSITIONS),
            size: 2
          }
        }
      }),
      isInstanced: true
    });
  }

  calculatePositions(attribute) {
    const {
      pathTesselator
    } = this.state;
    attribute.startIndices = pathTesselator.vertexStarts;
    attribute.value = pathTesselator.get('positions');
  }

  calculateSegmentTypes(attribute) {
    const {
      pathTesselator
    } = this.state;
    attribute.startIndices = pathTesselator.vertexStarts;
    attribute.value = pathTesselator.get('segmentTypes');
  }

}
PathLayer.layerName = 'PathLayer';
PathLayer.defaultProps = defaultProps$6;

var earcut_1 = earcut;
var _default$1 = earcut;

function earcut(data, holeIndices, dim) {

    dim = dim || 2;

    var hasHoles = holeIndices && holeIndices.length,
        outerLen = hasHoles ? holeIndices[0] * dim : data.length,
        outerNode = linkedList(data, 0, outerLen, dim, true),
        triangles = [];

    if (!outerNode || outerNode.next === outerNode.prev) return triangles;

    var minX, minY, maxX, maxY, x, y, invSize;

    if (hasHoles) outerNode = eliminateHoles(data, holeIndices, outerNode, dim);

    // if the shape is not too simple, we'll use z-order curve hash later; calculate polygon bbox
    if (data.length > 80 * dim) {
        minX = maxX = data[0];
        minY = maxY = data[1];

        for (var i = dim; i < outerLen; i += dim) {
            x = data[i];
            y = data[i + 1];
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        }

        // minX, minY and invSize are later used to transform coords into integers for z-order calculation
        invSize = Math.max(maxX - minX, maxY - minY);
        invSize = invSize !== 0 ? 1 / invSize : 0;
    }

    earcutLinked(outerNode, triangles, dim, minX, minY, invSize);

    return triangles;
}

// create a circular doubly linked list from polygon points in the specified winding order
function linkedList(data, start, end, dim, clockwise) {
    var i, last;

    if (clockwise === (signedArea(data, start, end, dim) > 0)) {
        for (i = start; i < end; i += dim) last = insertNode(i, data[i], data[i + 1], last);
    } else {
        for (i = end - dim; i >= start; i -= dim) last = insertNode(i, data[i], data[i + 1], last);
    }

    if (last && equals(last, last.next)) {
        removeNode(last);
        last = last.next;
    }

    return last;
}

// eliminate colinear or duplicate points
function filterPoints(start, end) {
    if (!start) return start;
    if (!end) end = start;

    var p = start,
        again;
    do {
        again = false;

        if (!p.steiner && (equals(p, p.next) || area(p.prev, p, p.next) === 0)) {
            removeNode(p);
            p = end = p.prev;
            if (p === p.next) break;
            again = true;

        } else {
            p = p.next;
        }
    } while (again || p !== end);

    return end;
}

// main ear slicing loop which triangulates a polygon (given as a linked list)
function earcutLinked(ear, triangles, dim, minX, minY, invSize, pass) {
    if (!ear) return;

    // interlink polygon nodes in z-order
    if (!pass && invSize) indexCurve(ear, minX, minY, invSize);

    var stop = ear,
        prev, next;

    // iterate through ears, slicing them one by one
    while (ear.prev !== ear.next) {
        prev = ear.prev;
        next = ear.next;

        if (invSize ? isEarHashed(ear, minX, minY, invSize) : isEar(ear)) {
            // cut off the triangle
            triangles.push(prev.i / dim);
            triangles.push(ear.i / dim);
            triangles.push(next.i / dim);

            removeNode(ear);

            // skipping the next vertex leads to less sliver triangles
            ear = next.next;
            stop = next.next;

            continue;
        }

        ear = next;

        // if we looped through the whole remaining polygon and can't find any more ears
        if (ear === stop) {
            // try filtering points and slicing again
            if (!pass) {
                earcutLinked(filterPoints(ear), triangles, dim, minX, minY, invSize, 1);

            // if this didn't work, try curing all small self-intersections locally
            } else if (pass === 1) {
                ear = cureLocalIntersections(filterPoints(ear), triangles, dim);
                earcutLinked(ear, triangles, dim, minX, minY, invSize, 2);

            // as a last resort, try splitting the remaining polygon into two
            } else if (pass === 2) {
                splitEarcut(ear, triangles, dim, minX, minY, invSize);
            }

            break;
        }
    }
}

// check whether a polygon node forms a valid ear with adjacent nodes
function isEar(ear) {
    var a = ear.prev,
        b = ear,
        c = ear.next;

    if (area(a, b, c) >= 0) return false; // reflex, can't be an ear

    // now make sure we don't have other points inside the potential ear
    var p = ear.next.next;

    while (p !== ear.prev) {
        if (pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
            area(p.prev, p, p.next) >= 0) return false;
        p = p.next;
    }

    return true;
}

function isEarHashed(ear, minX, minY, invSize) {
    var a = ear.prev,
        b = ear,
        c = ear.next;

    if (area(a, b, c) >= 0) return false; // reflex, can't be an ear

    // triangle bbox; min & max are calculated like this for speed
    var minTX = a.x < b.x ? (a.x < c.x ? a.x : c.x) : (b.x < c.x ? b.x : c.x),
        minTY = a.y < b.y ? (a.y < c.y ? a.y : c.y) : (b.y < c.y ? b.y : c.y),
        maxTX = a.x > b.x ? (a.x > c.x ? a.x : c.x) : (b.x > c.x ? b.x : c.x),
        maxTY = a.y > b.y ? (a.y > c.y ? a.y : c.y) : (b.y > c.y ? b.y : c.y);

    // z-order range for the current triangle bbox;
    var minZ = zOrder(minTX, minTY, minX, minY, invSize),
        maxZ = zOrder(maxTX, maxTY, minX, minY, invSize);

    var p = ear.prevZ,
        n = ear.nextZ;

    // look for points inside the triangle in both directions
    while (p && p.z >= minZ && n && n.z <= maxZ) {
        if (p !== ear.prev && p !== ear.next &&
            pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
            area(p.prev, p, p.next) >= 0) return false;
        p = p.prevZ;

        if (n !== ear.prev && n !== ear.next &&
            pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, n.x, n.y) &&
            area(n.prev, n, n.next) >= 0) return false;
        n = n.nextZ;
    }

    // look for remaining points in decreasing z-order
    while (p && p.z >= minZ) {
        if (p !== ear.prev && p !== ear.next &&
            pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
            area(p.prev, p, p.next) >= 0) return false;
        p = p.prevZ;
    }

    // look for remaining points in increasing z-order
    while (n && n.z <= maxZ) {
        if (n !== ear.prev && n !== ear.next &&
            pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, n.x, n.y) &&
            area(n.prev, n, n.next) >= 0) return false;
        n = n.nextZ;
    }

    return true;
}

// go through all polygon nodes and cure small local self-intersections
function cureLocalIntersections(start, triangles, dim) {
    var p = start;
    do {
        var a = p.prev,
            b = p.next.next;

        if (!equals(a, b) && intersects(a, p, p.next, b) && locallyInside(a, b) && locallyInside(b, a)) {

            triangles.push(a.i / dim);
            triangles.push(p.i / dim);
            triangles.push(b.i / dim);

            // remove two nodes involved
            removeNode(p);
            removeNode(p.next);

            p = start = b;
        }
        p = p.next;
    } while (p !== start);

    return filterPoints(p);
}

// try splitting polygon into two and triangulate them independently
function splitEarcut(start, triangles, dim, minX, minY, invSize) {
    // look for a valid diagonal that divides the polygon into two
    var a = start;
    do {
        var b = a.next.next;
        while (b !== a.prev) {
            if (a.i !== b.i && isValidDiagonal(a, b)) {
                // split the polygon in two by the diagonal
                var c = splitPolygon(a, b);

                // filter colinear points around the cuts
                a = filterPoints(a, a.next);
                c = filterPoints(c, c.next);

                // run earcut on each half
                earcutLinked(a, triangles, dim, minX, minY, invSize);
                earcutLinked(c, triangles, dim, minX, minY, invSize);
                return;
            }
            b = b.next;
        }
        a = a.next;
    } while (a !== start);
}

// link every hole into the outer loop, producing a single-ring polygon without holes
function eliminateHoles(data, holeIndices, outerNode, dim) {
    var queue = [],
        i, len, start, end, list;

    for (i = 0, len = holeIndices.length; i < len; i++) {
        start = holeIndices[i] * dim;
        end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
        list = linkedList(data, start, end, dim, false);
        if (list === list.next) list.steiner = true;
        queue.push(getLeftmost(list));
    }

    queue.sort(compareX);

    // process holes from left to right
    for (i = 0; i < queue.length; i++) {
        outerNode = eliminateHole(queue[i], outerNode);
        outerNode = filterPoints(outerNode, outerNode.next);
    }

    return outerNode;
}

function compareX(a, b) {
    return a.x - b.x;
}

// find a bridge between vertices that connects hole with an outer ring and and link it
function eliminateHole(hole, outerNode) {
    var bridge = findHoleBridge(hole, outerNode);
    if (!bridge) {
        return outerNode;
    }

    var bridgeReverse = splitPolygon(bridge, hole);

    // filter collinear points around the cuts
    var filteredBridge = filterPoints(bridge, bridge.next);
    filterPoints(bridgeReverse, bridgeReverse.next);

    // Check if input node was removed by the filtering
    return outerNode === bridge ? filteredBridge : outerNode;
}

// David Eberly's algorithm for finding a bridge between hole and outer polygon
function findHoleBridge(hole, outerNode) {
    var p = outerNode,
        hx = hole.x,
        hy = hole.y,
        qx = -Infinity,
        m;

    // find a segment intersected by a ray from the hole's leftmost point to the left;
    // segment's endpoint with lesser x will be potential connection point
    do {
        if (hy <= p.y && hy >= p.next.y && p.next.y !== p.y) {
            var x = p.x + (hy - p.y) * (p.next.x - p.x) / (p.next.y - p.y);
            if (x <= hx && x > qx) {
                qx = x;
                if (x === hx) {
                    if (hy === p.y) return p;
                    if (hy === p.next.y) return p.next;
                }
                m = p.x < p.next.x ? p : p.next;
            }
        }
        p = p.next;
    } while (p !== outerNode);

    if (!m) return null;

    if (hx === qx) return m; // hole touches outer segment; pick leftmost endpoint

    // look for points inside the triangle of hole point, segment intersection and endpoint;
    // if there are no points found, we have a valid connection;
    // otherwise choose the point of the minimum angle with the ray as connection point

    var stop = m,
        mx = m.x,
        my = m.y,
        tanMin = Infinity,
        tan;

    p = m;

    do {
        if (hx >= p.x && p.x >= mx && hx !== p.x &&
                pointInTriangle(hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, p.x, p.y)) {

            tan = Math.abs(hy - p.y) / (hx - p.x); // tangential

            if (locallyInside(p, hole) &&
                (tan < tanMin || (tan === tanMin && (p.x > m.x || (p.x === m.x && sectorContainsSector(m, p)))))) {
                m = p;
                tanMin = tan;
            }
        }

        p = p.next;
    } while (p !== stop);

    return m;
}

// whether sector in vertex m contains sector in vertex p in the same coordinates
function sectorContainsSector(m, p) {
    return area(m.prev, m, p.prev) < 0 && area(p.next, m, m.next) < 0;
}

// interlink polygon nodes in z-order
function indexCurve(start, minX, minY, invSize) {
    var p = start;
    do {
        if (p.z === null) p.z = zOrder(p.x, p.y, minX, minY, invSize);
        p.prevZ = p.prev;
        p.nextZ = p.next;
        p = p.next;
    } while (p !== start);

    p.prevZ.nextZ = null;
    p.prevZ = null;

    sortLinked(p);
}

// Simon Tatham's linked list merge sort algorithm
// http://www.chiark.greenend.org.uk/~sgtatham/algorithms/listsort.html
function sortLinked(list) {
    var i, p, q, e, tail, numMerges, pSize, qSize,
        inSize = 1;

    do {
        p = list;
        list = null;
        tail = null;
        numMerges = 0;

        while (p) {
            numMerges++;
            q = p;
            pSize = 0;
            for (i = 0; i < inSize; i++) {
                pSize++;
                q = q.nextZ;
                if (!q) break;
            }
            qSize = inSize;

            while (pSize > 0 || (qSize > 0 && q)) {

                if (pSize !== 0 && (qSize === 0 || !q || p.z <= q.z)) {
                    e = p;
                    p = p.nextZ;
                    pSize--;
                } else {
                    e = q;
                    q = q.nextZ;
                    qSize--;
                }

                if (tail) tail.nextZ = e;
                else list = e;

                e.prevZ = tail;
                tail = e;
            }

            p = q;
        }

        tail.nextZ = null;
        inSize *= 2;

    } while (numMerges > 1);

    return list;
}

// z-order of a point given coords and inverse of the longer side of data bbox
function zOrder(x, y, minX, minY, invSize) {
    // coords are transformed into non-negative 15-bit integer range
    x = 32767 * (x - minX) * invSize;
    y = 32767 * (y - minY) * invSize;

    x = (x | (x << 8)) & 0x00FF00FF;
    x = (x | (x << 4)) & 0x0F0F0F0F;
    x = (x | (x << 2)) & 0x33333333;
    x = (x | (x << 1)) & 0x55555555;

    y = (y | (y << 8)) & 0x00FF00FF;
    y = (y | (y << 4)) & 0x0F0F0F0F;
    y = (y | (y << 2)) & 0x33333333;
    y = (y | (y << 1)) & 0x55555555;

    return x | (y << 1);
}

// find the leftmost node of a polygon ring
function getLeftmost(start) {
    var p = start,
        leftmost = start;
    do {
        if (p.x < leftmost.x || (p.x === leftmost.x && p.y < leftmost.y)) leftmost = p;
        p = p.next;
    } while (p !== start);

    return leftmost;
}

// check if a point lies within a convex triangle
function pointInTriangle(ax, ay, bx, by, cx, cy, px, py) {
    return (cx - px) * (ay - py) - (ax - px) * (cy - py) >= 0 &&
           (ax - px) * (by - py) - (bx - px) * (ay - py) >= 0 &&
           (bx - px) * (cy - py) - (cx - px) * (by - py) >= 0;
}

// check if a diagonal between two polygon nodes is valid (lies in polygon interior)
function isValidDiagonal(a, b) {
    return a.next.i !== b.i && a.prev.i !== b.i && !intersectsPolygon(a, b) && // dones't intersect other edges
           (locallyInside(a, b) && locallyInside(b, a) && middleInside(a, b) && // locally visible
            (area(a.prev, a, b.prev) || area(a, b.prev, b)) || // does not create opposite-facing sectors
            equals(a, b) && area(a.prev, a, a.next) > 0 && area(b.prev, b, b.next) > 0); // special zero-length case
}

// signed area of a triangle
function area(p, q, r) {
    return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
}

// check if two points are equal
function equals(p1, p2) {
    return p1.x === p2.x && p1.y === p2.y;
}

// check if two segments intersect
function intersects(p1, q1, p2, q2) {
    var o1 = sign(area(p1, q1, p2));
    var o2 = sign(area(p1, q1, q2));
    var o3 = sign(area(p2, q2, p1));
    var o4 = sign(area(p2, q2, q1));

    if (o1 !== o2 && o3 !== o4) return true; // general case

    if (o1 === 0 && onSegment(p1, p2, q1)) return true; // p1, q1 and p2 are collinear and p2 lies on p1q1
    if (o2 === 0 && onSegment(p1, q2, q1)) return true; // p1, q1 and q2 are collinear and q2 lies on p1q1
    if (o3 === 0 && onSegment(p2, p1, q2)) return true; // p2, q2 and p1 are collinear and p1 lies on p2q2
    if (o4 === 0 && onSegment(p2, q1, q2)) return true; // p2, q2 and q1 are collinear and q1 lies on p2q2

    return false;
}

// for collinear points p, q, r, check if point q lies on segment pr
function onSegment(p, q, r) {
    return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) && q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
}

function sign(num) {
    return num > 0 ? 1 : num < 0 ? -1 : 0;
}

// check if a polygon diagonal intersects any polygon segments
function intersectsPolygon(a, b) {
    var p = a;
    do {
        if (p.i !== a.i && p.next.i !== a.i && p.i !== b.i && p.next.i !== b.i &&
                intersects(p, p.next, a, b)) return true;
        p = p.next;
    } while (p !== a);

    return false;
}

// check if a polygon diagonal is locally inside the polygon
function locallyInside(a, b) {
    return area(a.prev, a, a.next) < 0 ?
        area(a, b, a.next) >= 0 && area(a, a.prev, b) >= 0 :
        area(a, b, a.prev) < 0 || area(a, a.next, b) < 0;
}

// check if the middle point of a polygon diagonal is inside the polygon
function middleInside(a, b) {
    var p = a,
        inside = false,
        px = (a.x + b.x) / 2,
        py = (a.y + b.y) / 2;
    do {
        if (((p.y > py) !== (p.next.y > py)) && p.next.y !== p.y &&
                (px < (p.next.x - p.x) * (py - p.y) / (p.next.y - p.y) + p.x))
            inside = !inside;
        p = p.next;
    } while (p !== a);

    return inside;
}

// link two polygon vertices with a bridge; if the vertices belong to the same ring, it splits polygon into two;
// if one belongs to the outer ring and another to a hole, it merges it into a single ring
function splitPolygon(a, b) {
    var a2 = new Node(a.i, a.x, a.y),
        b2 = new Node(b.i, b.x, b.y),
        an = a.next,
        bp = b.prev;

    a.next = b;
    b.prev = a;

    a2.next = an;
    an.prev = a2;

    b2.next = a2;
    a2.prev = b2;

    bp.next = b2;
    b2.prev = bp;

    return b2;
}

// create a node and optionally link it with previous one (in a circular doubly linked list)
function insertNode(i, x, y, last) {
    var p = new Node(i, x, y);

    if (!last) {
        p.prev = p;
        p.next = p;

    } else {
        p.next = last.next;
        p.prev = last;
        last.next.prev = p;
        last.next = p;
    }
    return p;
}

function removeNode(p) {
    p.next.prev = p.prev;
    p.prev.next = p.next;

    if (p.prevZ) p.prevZ.nextZ = p.nextZ;
    if (p.nextZ) p.nextZ.prevZ = p.prevZ;
}

function Node(i, x, y) {
    // vertex index in coordinates array
    this.i = i;

    // vertex coordinates
    this.x = x;
    this.y = y;

    // previous and next vertex nodes in a polygon ring
    this.prev = null;
    this.next = null;

    // z-order curve value
    this.z = null;

    // previous and next nodes in z-order
    this.prevZ = null;
    this.nextZ = null;

    // indicates whether this is a steiner point
    this.steiner = false;
}

// return a percentage difference between the polygon area and its triangulation area;
// used to verify correctness of triangulation
earcut.deviation = function (data, holeIndices, dim, triangles) {
    var hasHoles = holeIndices && holeIndices.length;
    var outerLen = hasHoles ? holeIndices[0] * dim : data.length;

    var polygonArea = Math.abs(signedArea(data, 0, outerLen, dim));
    if (hasHoles) {
        for (var i = 0, len = holeIndices.length; i < len; i++) {
            var start = holeIndices[i] * dim;
            var end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
            polygonArea -= Math.abs(signedArea(data, start, end, dim));
        }
    }

    var trianglesArea = 0;
    for (i = 0; i < triangles.length; i += 3) {
        var a = triangles[i] * dim;
        var b = triangles[i + 1] * dim;
        var c = triangles[i + 2] * dim;
        trianglesArea += Math.abs(
            (data[a] - data[c]) * (data[b + 1] - data[a + 1]) -
            (data[a] - data[b]) * (data[c + 1] - data[a + 1]));
    }

    return polygonArea === 0 && trianglesArea === 0 ? 0 :
        Math.abs((trianglesArea - polygonArea) / polygonArea);
};

function signedArea(data, start, end, dim) {
    var sum = 0;
    for (var i = start, j = end - dim; i < end; i += dim) {
        sum += (data[j] - data[i]) * (data[i + 1] + data[j + 1]);
        j = i;
    }
    return sum;
}

// turn a polygon in a multi-dimensional array form (e.g. as in GeoJSON) into a form Earcut accepts
earcut.flatten = function (data) {
    var dim = data[0][0].length,
        result = {vertices: [], holes: [], dimensions: dim},
        holeIndex = 0;

    for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < data[i].length; j++) {
            for (var d = 0; d < dim; d++) result.vertices.push(data[i][j][d]);
        }
        if (i > 0) {
            holeIndex += data[i - 1].length;
            result.holes.push(holeIndex);
        }
    }
    return result;
};

var earcut$1 = earcut_1;
earcut_1.default = _default$1;

const OUTER_POLYGON_WINDING = WINDING.CLOCKWISE;
const HOLE_POLYGON_WINDING = WINDING.COUNTER_CLOCKWISE;
const windingOptions = {
  isClosed: true
};

function validate(polygon) {
  polygon = polygon && polygon.positions || polygon;

  if (!Array.isArray(polygon) && !ArrayBuffer.isView(polygon)) {
    throw new Error('invalid polygon');
  }
}

function isSimple(polygon) {
  return polygon.length >= 1 && polygon[0].length >= 2 && Number.isFinite(polygon[0][0]);
}

function isNestedRingClosed(simplePolygon) {
  const p0 = simplePolygon[0];
  const p1 = simplePolygon[simplePolygon.length - 1];
  return p0[0] === p1[0] && p0[1] === p1[1] && p0[2] === p1[2];
}

function isFlatRingClosed(positions, size, startIndex, endIndex) {
  for (let i = 0; i < size; i++) {
    if (positions[startIndex + i] !== positions[endIndex - size + i]) {
      return false;
    }
  }

  return true;
}

function copyNestedRing(target, targetStartIndex, simplePolygon, size, windingDirection) {
  let targetIndex = targetStartIndex;
  const len = simplePolygon.length;

  for (let i = 0; i < len; i++) {
    for (let j = 0; j < size; j++) {
      target[targetIndex++] = simplePolygon[i][j] || 0;
    }
  }

  if (!isNestedRingClosed(simplePolygon)) {
    for (let j = 0; j < size; j++) {
      target[targetIndex++] = simplePolygon[0][j] || 0;
    }
  }

  windingOptions.start = targetStartIndex;
  windingOptions.end = targetIndex;
  windingOptions.size = size;
  modifyPolygonWindingDirection(target, windingDirection, windingOptions);
  return targetIndex;
}

function copyFlatRing(target, targetStartIndex, positions, size) {
  let srcStartIndex = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
  let srcEndIndex = arguments.length > 5 ? arguments[5] : undefined;
  let windingDirection = arguments.length > 6 ? arguments[6] : undefined;
  srcEndIndex = srcEndIndex || positions.length;
  const srcLength = srcEndIndex - srcStartIndex;

  if (srcLength <= 0) {
    return targetStartIndex;
  }

  let targetIndex = targetStartIndex;

  for (let i = 0; i < srcLength; i++) {
    target[targetIndex++] = positions[srcStartIndex + i];
  }

  if (!isFlatRingClosed(positions, size, srcStartIndex, srcEndIndex)) {
    for (let i = 0; i < size; i++) {
      target[targetIndex++] = positions[srcStartIndex + i];
    }
  }

  windingOptions.start = targetStartIndex;
  windingOptions.end = targetIndex;
  windingOptions.size = size;
  modifyPolygonWindingDirection(target, windingDirection, windingOptions);
  return targetIndex;
}

function normalize(polygon, positionSize) {
  validate(polygon);
  const positions = [];
  const holeIndices = [];

  if (polygon.positions) {
    const {
      positions: srcPositions,
      holeIndices: srcHoleIndices
    } = polygon;

    if (srcHoleIndices) {
      let targetIndex = 0;

      for (let i = 0; i <= srcHoleIndices.length; i++) {
        targetIndex = copyFlatRing(positions, targetIndex, srcPositions, positionSize, srcHoleIndices[i - 1], srcHoleIndices[i], i === 0 ? OUTER_POLYGON_WINDING : HOLE_POLYGON_WINDING);
        holeIndices.push(targetIndex);
      }

      holeIndices.pop();
      return {
        positions,
        holeIndices
      };
    }

    polygon = srcPositions;
  }

  if (Number.isFinite(polygon[0])) {
    copyFlatRing(positions, 0, polygon, positionSize, 0, positions.length, OUTER_POLYGON_WINDING);
    return positions;
  }

  if (!isSimple(polygon)) {
    let targetIndex = 0;

    for (const [polygonIndex, simplePolygon] of polygon.entries()) {
      targetIndex = copyNestedRing(positions, targetIndex, simplePolygon, positionSize, polygonIndex === 0 ? OUTER_POLYGON_WINDING : HOLE_POLYGON_WINDING);
      holeIndices.push(targetIndex);
    }

    holeIndices.pop();
    return {
      positions,
      holeIndices
    };
  }

  copyNestedRing(positions, 0, polygon, positionSize, OUTER_POLYGON_WINDING);
  return positions;
}
function getSurfaceIndices(normalizedPolygon, positionSize, preproject) {
  let holeIndices = null;

  if (normalizedPolygon.holeIndices) {
    holeIndices = normalizedPolygon.holeIndices.map(positionIndex => positionIndex / positionSize);
  }

  let positions = normalizedPolygon.positions || normalizedPolygon;

  if (preproject) {
    const n = positions.length;
    positions = positions.slice();
    const p = [];

    for (let i = 0; i < n; i += positionSize) {
      p[0] = positions[i];
      p[1] = positions[i + 1];
      const xy = preproject(p);
      positions[i] = xy[0];
      positions[i + 1] = xy[1];
    }
  }

  return earcut$1(positions, holeIndices, positionSize);
}

class PolygonTesselator extends Tesselator {
  constructor(opts) {
    const {
      fp64,
      IndexType = Uint32Array
    } = opts;
    super({ ...opts,
      attributes: {
        positions: {
          size: 3,
          type: fp64 ? Float64Array : Float32Array
        },
        vertexValid: {
          type: Uint8ClampedArray,
          size: 1
        },
        indices: {
          type: IndexType,
          size: 1
        }
      }
    });
  }

  get(attributeName) {
    const {
      attributes
    } = this;

    if (attributeName === 'indices') {
      return attributes.indices && attributes.indices.subarray(0, this.vertexCount);
    }

    return attributes[attributeName];
  }

  updateGeometry(opts) {
    super.updateGeometry(opts);
    const externalIndices = this.buffers.indices;

    if (externalIndices) {
      this.vertexCount = (externalIndices.value || externalIndices).length;
    }
  }

  normalizeGeometry(polygon) {
    if (this.normalize) {
      polygon = normalize(polygon, this.positionSize);

      if (this.opts.resolution) {
        return cutPolygonByGrid(polygon.positions || polygon, polygon.holeIndices, {
          size: this.positionSize,
          gridResolution: this.opts.resolution,
          edgeTypes: true
        });
      }

      if (this.opts.wrapLongitude) {
        return cutPolygonByMercatorBounds(polygon.positions || polygon, polygon.holeIndices, {
          size: this.positionSize,
          maxLatitude: 86,
          edgeTypes: true
        });
      }
    }

    return polygon;
  }

  getGeometrySize(polygon) {
    if (Array.isArray(polygon) && !Number.isFinite(polygon[0])) {
      let size = 0;

      for (const subPolygon of polygon) {
        size += this.getGeometrySize(subPolygon);
      }

      return size;
    }

    return (polygon.positions || polygon).length / this.positionSize;
  }

  getGeometryFromBuffer(buffer) {
    if (this.normalize || !this.buffers.indices) {
      return super.getGeometryFromBuffer(buffer);
    }

    return () => null;
  }

  updateGeometryAttributes(polygon, context) {
    if (Array.isArray(polygon) && !Number.isFinite(polygon[0])) {
      for (const subPolygon of polygon) {
        const geometrySize = this.getGeometrySize(subPolygon);
        context.geometrySize = geometrySize;
        this.updateGeometryAttributes(subPolygon, context);
        context.vertexStart += geometrySize;
        context.indexStart = this.indexStarts[context.geometryIndex + 1];
      }
    } else {
      this._updateIndices(polygon, context);

      this._updatePositions(polygon, context);

      this._updateVertexValid(polygon, context);
    }
  }

  _updateIndices(polygon, _ref) {
    let {
      geometryIndex,
      vertexStart: offset,
      indexStart
    } = _ref;
    const {
      attributes,
      indexStarts,
      typedArrayManager
    } = this;
    let target = attributes.indices;

    if (!target) {
      return;
    }

    let i = indexStart;
    const indices = getSurfaceIndices(polygon, this.positionSize, this.opts.preproject);
    target = typedArrayManager.allocate(target, indexStart + indices.length, {
      copy: true
    });

    for (let j = 0; j < indices.length; j++) {
      target[i++] = indices[j] + offset;
    }

    indexStarts[geometryIndex + 1] = indexStart + indices.length;
    attributes.indices = target;
  }

  _updatePositions(polygon, _ref2) {
    let {
      vertexStart,
      geometrySize
    } = _ref2;
    const {
      attributes: {
        positions
      },
      positionSize
    } = this;

    if (!positions) {
      return;
    }

    const polygonPositions = polygon.positions || polygon;

    for (let i = vertexStart, j = 0; j < geometrySize; i++, j++) {
      const x = polygonPositions[j * positionSize];
      const y = polygonPositions[j * positionSize + 1];
      const z = positionSize > 2 ? polygonPositions[j * positionSize + 2] : 0;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
  }

  _updateVertexValid(polygon, _ref3) {
    let {
      vertexStart,
      geometrySize
    } = _ref3;
    const {
      attributes: {
        vertexValid
      },
      positionSize
    } = this;
    const holeIndices = polygon && polygon.holeIndices;

    if (polygon && polygon.edgeTypes) {
      vertexValid.set(polygon.edgeTypes, vertexStart);
    } else {
      vertexValid.fill(1, vertexStart, vertexStart + geometrySize);
    }

    if (holeIndices) {
      for (let j = 0; j < holeIndices.length; j++) {
        vertexValid[vertexStart + holeIndices[j] / positionSize - 1] = 0;
      }
    }

    vertexValid[vertexStart + geometrySize - 1] = 0;
  }

}

var main = "\nattribute vec2 vertexPositions;\nattribute float vertexValid;\n\nuniform bool extruded;\nuniform bool isWireframe;\nuniform float elevationScale;\nuniform float opacity;\n\nvarying vec4 vColor;\n\nstruct PolygonProps {\n  vec4 fillColors;\n  vec4 lineColors;\n  vec3 positions;\n  vec3 nextPositions;\n  vec3 pickingColors;\n  vec3 positions64Low;\n  vec3 nextPositions64Low;\n  float elevations;\n};\n\nvec3 project_offset_normal(vec3 vector) {\n  if (project_uCoordinateSystem == COORDINATE_SYSTEM_LNGLAT ||\n    project_uCoordinateSystem == COORDINATE_SYSTEM_LNGLAT_OFFSETS) {\n    return normalize(vector * project_uCommonUnitsPerWorldUnit);\n  }\n  return project_normal(vector);\n}\n\nvoid calculatePosition(PolygonProps props) {\n#ifdef IS_SIDE_VERTEX\n  if(vertexValid < 0.5){\n    gl_Position = vec4(0.);\n    return;\n  }\n#endif\n\n  vec3 pos;\n  vec3 pos64Low;\n  vec3 normal;\n  vec4 colors = isWireframe ? props.lineColors : props.fillColors;\n\n  geometry.worldPosition = props.positions;\n  geometry.worldPositionAlt = props.nextPositions;\n  geometry.pickingColor = props.pickingColors;\n\n#ifdef IS_SIDE_VERTEX\n  pos = mix(props.positions, props.nextPositions, vertexPositions.x);\n  pos64Low = mix(props.positions64Low, props.nextPositions64Low, vertexPositions.x);\n#else\n  pos = props.positions;\n  pos64Low = props.positions64Low;\n#endif\n\n  if (extruded) {\n    pos.z += props.elevations * vertexPositions.y * elevationScale;\n\n#ifdef IS_SIDE_VERTEX\n    normal = vec3(\n      props.positions.y - props.nextPositions.y + (props.positions64Low.y - props.nextPositions64Low.y),\n      props.nextPositions.x - props.positions.x + (props.nextPositions64Low.x - props.positions64Low.x),\n      0.0);\n    normal = project_offset_normal(normal);\n#else\n    normal = vec3(0.0, 0.0, 1.0);\n#endif\n    geometry.normal = normal;\n  }\n\n  gl_Position = project_position_to_clipspace(pos, pos64Low, vec3(0.), geometry.position);\n  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);\n\n  if (extruded) {\n    vec3 lightColor = lighting_getLightColor(colors.rgb, project_uCameraPosition, geometry.position.xyz, normal);\n    vColor = vec4(lightColor, colors.a * opacity);\n  } else {\n    vColor = vec4(colors.rgb, colors.a * opacity);\n  }\n  DECKGL_FILTER_COLOR(vColor, geometry);\n}\n";

var vsTop = "#define SHADER_NAME solid-polygon-layer-vertex-shader\n\nattribute vec3 positions;\nattribute vec3 positions64Low;\nattribute float elevations;\nattribute vec4 fillColors;\nattribute vec4 lineColors;\nattribute vec3 pickingColors;\n\n".concat(main, "\n\nvoid main(void) {\n  PolygonProps props;\n\n  props.positions = positions;\n  props.positions64Low = positions64Low;\n  props.elevations = elevations;\n  props.fillColors = fillColors;\n  props.lineColors = lineColors;\n  props.pickingColors = pickingColors;\n\n  calculatePosition(props);\n}\n");

var vsSide = "#define SHADER_NAME solid-polygon-layer-vertex-shader-side\n#define IS_SIDE_VERTEX\n\n\nattribute vec3 instancePositions;\nattribute vec3 nextPositions;\nattribute vec3 instancePositions64Low;\nattribute vec3 nextPositions64Low;\nattribute float instanceElevations;\nattribute vec4 instanceFillColors;\nattribute vec4 instanceLineColors;\nattribute vec3 instancePickingColors;\n\n".concat(main, "\n\nvoid main(void) {\n  PolygonProps props;\n\n  #if RING_WINDING_ORDER_CW == 1\n    props.positions = instancePositions;\n    props.positions64Low = instancePositions64Low;\n    props.nextPositions = nextPositions;\n    props.nextPositions64Low = nextPositions64Low;\n  #else\n    props.positions = nextPositions;\n    props.positions64Low = nextPositions64Low;\n    props.nextPositions = instancePositions;\n    props.nextPositions64Low = instancePositions64Low;\n  #endif\n  props.elevations = instanceElevations;\n  props.fillColors = instanceFillColors;\n  props.lineColors = instanceLineColors;\n  props.pickingColors = instancePickingColors;\n\n  calculatePosition(props);\n}\n");

var fs$2 = "#define SHADER_NAME solid-polygon-layer-fragment-shader\n\nprecision highp float;\n\nvarying vec4 vColor;\n\nvoid main(void) {\n  gl_FragColor = vColor;\n\n  DECKGL_FILTER_COLOR(gl_FragColor, geometry);\n}\n";

const DEFAULT_COLOR$1 = [0, 0, 0, 255];
const defaultProps$5 = {
  filled: true,
  extruded: false,
  wireframe: false,
  _normalize: true,
  _windingOrder: 'CW',
  elevationScale: {
    type: 'number',
    min: 0,
    value: 1
  },
  getPolygon: {
    type: 'accessor',
    value: f => f.polygon
  },
  getElevation: {
    type: 'accessor',
    value: 1000
  },
  getFillColor: {
    type: 'accessor',
    value: DEFAULT_COLOR$1
  },
  getLineColor: {
    type: 'accessor',
    value: DEFAULT_COLOR$1
  },
  material: true
};
const ATTRIBUTE_TRANSITION = {
  enter: (value, chunk) => {
    return chunk.length ? chunk.subarray(chunk.length - value.length) : value;
  }
};
class SolidPolygonLayer extends Layer {
  getShaders(type) {
    return super.getShaders({
      vs: type === 'top' ? vsTop : vsSide,
      fs: fs$2,
      defines: {
        RING_WINDING_ORDER_CW: !this.props._normalize && this.props._windingOrder === 'CCW' ? 0 : 1
      },
      modules: [project32, gouraudLighting, picking]
    });
  }

  get wrapLongitude() {
    return false;
  }

  initializeState() {
    const {
      gl,
      viewport
    } = this.context;
    let {
      coordinateSystem
    } = this.props;

    if (viewport.isGeospatial && coordinateSystem === COORDINATE_SYSTEM.DEFAULT) {
      coordinateSystem = COORDINATE_SYSTEM.LNGLAT;
    }

    this.setState({
      numInstances: 0,
      polygonTesselator: new PolygonTesselator({
        preproject: coordinateSystem === COORDINATE_SYSTEM.LNGLAT && viewport.projectFlat,
        fp64: this.use64bitPositions(),
        IndexType: !gl || hasFeatures(gl, FEATURES.ELEMENT_INDEX_UINT32) ? Uint32Array : Uint16Array
      })
    });
    const attributeManager = this.getAttributeManager();
    const noAlloc = true;
    attributeManager.remove(['instancePickingColors']);
    attributeManager.add({
      indices: {
        size: 1,
        isIndexed: true,
        update: this.calculateIndices,
        noAlloc
      },
      positions: {
        size: 3,
        type: 5130,
        fp64: this.use64bitPositions(),
        transition: ATTRIBUTE_TRANSITION,
        accessor: 'getPolygon',
        update: this.calculatePositions,
        noAlloc,
        shaderAttributes: {
          positions: {
            vertexOffset: 0,
            divisor: 0
          },
          instancePositions: {
            vertexOffset: 0,
            divisor: 1
          },
          nextPositions: {
            vertexOffset: 1,
            divisor: 1
          }
        }
      },
      vertexValid: {
        size: 1,
        divisor: 1,
        type: 5121,
        update: this.calculateVertexValid,
        noAlloc
      },
      elevations: {
        size: 1,
        transition: ATTRIBUTE_TRANSITION,
        accessor: 'getElevation',
        shaderAttributes: {
          elevations: {
            divisor: 0
          },
          instanceElevations: {
            divisor: 1
          }
        }
      },
      fillColors: {
        alias: 'colors',
        size: this.props.colorFormat.length,
        type: 5121,
        normalized: true,
        transition: ATTRIBUTE_TRANSITION,
        accessor: 'getFillColor',
        defaultValue: DEFAULT_COLOR$1,
        shaderAttributes: {
          fillColors: {
            divisor: 0
          },
          instanceFillColors: {
            divisor: 1
          }
        }
      },
      lineColors: {
        alias: 'colors',
        size: this.props.colorFormat.length,
        type: 5121,
        normalized: true,
        transition: ATTRIBUTE_TRANSITION,
        accessor: 'getLineColor',
        defaultValue: DEFAULT_COLOR$1,
        shaderAttributes: {
          lineColors: {
            divisor: 0
          },
          instanceLineColors: {
            divisor: 1
          }
        }
      },
      pickingColors: {
        size: 3,
        type: 5121,
        accessor: (object, _ref) => {
          let {
            index,
            target: value
          } = _ref;
          return this.encodePickingColor(object && object.__source ? object.__source.index : index, value);
        },
        shaderAttributes: {
          pickingColors: {
            divisor: 0
          },
          instancePickingColors: {
            divisor: 1
          }
        }
      }
    });
  }

  getPickingInfo(params) {
    const info = super.getPickingInfo(params);
    const {
      index
    } = info;
    const {
      data
    } = this.props;

    if (data[0] && data[0].__source) {
      info.object = data.find(d => d.__source.index === index);
    }

    return info;
  }

  disablePickingIndex(objectIndex) {
    const {
      data
    } = this.props;

    if (data[0] && data[0].__source) {
      for (let i = 0; i < data.length; i++) {
        if (data[i].__source.index === objectIndex) {
          this._disablePickingIndex(i);
        }
      }
    } else {
      this._disablePickingIndex(objectIndex);
    }
  }

  draw(_ref2) {
    let {
      uniforms
    } = _ref2;
    const {
      extruded,
      filled,
      wireframe,
      elevationScale
    } = this.props;
    const {
      topModel,
      sideModel,
      polygonTesselator
    } = this.state;
    const renderUniforms = { ...uniforms,
      extruded: Boolean(extruded),
      elevationScale
    };

    if (sideModel) {
      sideModel.setInstanceCount(polygonTesselator.instanceCount - 1);
      sideModel.setUniforms(renderUniforms);

      if (wireframe) {
        sideModel.setDrawMode(3);
        sideModel.setUniforms({
          isWireframe: true
        }).draw();
      }

      if (filled) {
        sideModel.setDrawMode(6);
        sideModel.setUniforms({
          isWireframe: false
        }).draw();
      }
    }

    if (topModel) {
      topModel.setVertexCount(polygonTesselator.vertexCount);
      topModel.setUniforms(renderUniforms).draw();
    }
  }

  updateState(updateParams) {
    super.updateState(updateParams);
    this.updateGeometry(updateParams);
    const {
      props,
      oldProps,
      changeFlags
    } = updateParams;
    const attributeManager = this.getAttributeManager();
    const regenerateModels = changeFlags.extensionsChanged || props.filled !== oldProps.filled || props.extruded !== oldProps.extruded;

    if (regenerateModels) {
      var _this$state$models;

      (_this$state$models = this.state.models) === null || _this$state$models === void 0 ? void 0 : _this$state$models.forEach(model => model.delete());
      this.setState(this._getModels(this.context.gl));
      attributeManager.invalidateAll();
    }
  }

  updateGeometry(_ref3) {
    let {
      props,
      oldProps,
      changeFlags
    } = _ref3;
    const geometryConfigChanged = changeFlags.dataChanged || changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getPolygon);

    if (geometryConfigChanged) {
      const {
        polygonTesselator
      } = this.state;
      const buffers = props.data.attributes || {};
      polygonTesselator.updateGeometry({
        data: props.data,
        normalize: props._normalize,
        geometryBuffer: buffers.getPolygon,
        buffers,
        getGeometry: props.getPolygon,
        positionFormat: props.positionFormat,
        wrapLongitude: props.wrapLongitude,
        resolution: this.context.viewport.resolution,
        fp64: this.use64bitPositions(),
        dataChanged: changeFlags.dataChanged
      });
      this.setState({
        numInstances: polygonTesselator.instanceCount,
        startIndices: polygonTesselator.vertexStarts
      });

      if (!changeFlags.dataChanged) {
        this.getAttributeManager().invalidateAll();
      }
    }
  }

  _getModels(gl) {
    const {
      id,
      filled,
      extruded
    } = this.props;
    let topModel;
    let sideModel;

    if (filled) {
      const shaders = this.getShaders('top');
      shaders.defines.NON_INSTANCED_MODEL = 1;
      topModel = new Model(gl, { ...shaders,
        id: "".concat(id, "-top"),
        drawMode: 4,
        attributes: {
          vertexPositions: new Float32Array([0, 1])
        },
        uniforms: {
          isWireframe: false,
          isSideVertex: false
        },
        vertexCount: 0,
        isIndexed: true
      });
    }

    if (extruded) {
      sideModel = new Model(gl, { ...this.getShaders('side'),
        id: "".concat(id, "-side"),
        geometry: new Geometry({
          drawMode: 1,
          vertexCount: 4,
          attributes: {
            vertexPositions: {
              size: 2,
              value: new Float32Array([1, 0, 0, 0, 0, 1, 1, 1])
            }
          }
        }),
        instanceCount: 0,
        isInstanced: 1
      });
      sideModel.userData.excludeAttributes = {
        indices: true
      };
    }

    return {
      models: [sideModel, topModel].filter(Boolean),
      topModel,
      sideModel
    };
  }

  calculateIndices(attribute) {
    const {
      polygonTesselator
    } = this.state;
    attribute.startIndices = polygonTesselator.indexStarts;
    attribute.value = polygonTesselator.get('indices');
  }

  calculatePositions(attribute) {
    const {
      polygonTesselator
    } = this.state;
    attribute.startIndices = polygonTesselator.vertexStarts;
    attribute.value = polygonTesselator.get('positions');
  }

  calculateVertexValid(attribute) {
    attribute.value = this.state.polygonTesselator.get('vertexValid');
  }

}
SolidPolygonLayer.layerName = 'SolidPolygonLayer';
SolidPolygonLayer.defaultProps = defaultProps$5;

function replaceInRange(_ref) {
  let {
    data,
    getIndex,
    dataRange,
    replace
  } = _ref;
  const {
    startRow = 0,
    endRow = Infinity
  } = dataRange;
  const count = data.length;
  let replaceStart = count;
  let replaceEnd = count;

  for (let i = 0; i < count; i++) {
    const row = getIndex(data[i]);

    if (replaceStart > i && row >= startRow) {
      replaceStart = i;
    }

    if (row >= endRow) {
      replaceEnd = i;
      break;
    }
  }

  let index = replaceStart;
  const dataLengthChanged = replaceEnd - replaceStart !== replace.length;
  const endChunk = dataLengthChanged && data.slice(replaceEnd);

  for (let i = 0; i < replace.length; i++) {
    data[index++] = replace[i];
  }

  if (dataLengthChanged) {
    for (let i = 0; i < endChunk.length; i++) {
      data[index++] = endChunk[i];
    }

    data.length = index;
  }

  return {
    startRow: replaceStart,
    endRow: replaceStart + replace.length
  };
}

function binaryToFeatureForAccesor(data, index) {
  if (!data) {
    return null;
  }

  const featureIndex = 'startIndices' in data ? data.startIndices[index] : index;
  const geometryIndex = data.featureIds.value[featureIndex];

  if (featureIndex !== -1) {
    return getPropertiesForIndex(data, geometryIndex, featureIndex);
  }

  return null;
}

function getPropertiesForIndex(data, propertiesIndex, numericPropsIndex) {
  const feature = {
    properties: { ...data.properties[propertiesIndex]
    }
  };

  for (const prop in data.numericProps) {
    feature.properties[prop] = data.numericProps[prop].value[numericPropsIndex];
  }

  return feature;
}

function calculatePickingColors(geojsonBinary, encodePickingColor) {
  const pickingColors = {
    points: null,
    lines: null,
    polygons: null
  };

  for (const key in pickingColors) {
    const featureIds = geojsonBinary[key].globalFeatureIds.value;
    pickingColors[key] = new Uint8ClampedArray(featureIds.length * 3);
    const pickingColor = [];

    for (let i = 0; i < featureIds.length; i++) {
      encodePickingColor(featureIds[i], pickingColor);
      pickingColors[key][i * 3 + 0] = pickingColor[0];
      pickingColors[key][i * 3 + 1] = pickingColor[1];
      pickingColors[key][i * 3 + 2] = pickingColor[2];
    }
  }

  return pickingColors;
}

var fs$1 = "#define SHADER_NAME multi-icon-layer-fragment-shader\n\nprecision highp float;\n\nuniform float opacity;\nuniform sampler2D iconsTexture;\nuniform float gamma;\nuniform bool sdf;\nuniform float alphaCutoff;\nuniform float buffer;\nuniform float outlineBuffer;\nuniform vec4 outlineColor;\n\nvarying vec4 vColor;\nvarying vec2 vTextureCoords;\nvarying vec2 uv;\n\nvoid main(void) {\n  geometry.uv = uv;\n\n  if (!picking_uActive) {\n    float alpha = texture2D(iconsTexture, vTextureCoords).a;\n    vec4 color = vColor;\n    if (sdf) {\n      float distance = alpha;\n      alpha = smoothstep(buffer - gamma, buffer + gamma, distance);\n\n      if (outlineBuffer > 0.0) {\n        float inFill = alpha;\n        float inBorder = smoothstep(outlineBuffer - gamma, outlineBuffer + gamma, distance);\n        color = mix(outlineColor, vColor, inFill);\n        alpha = inBorder;\n      }\n    }\n    float a = alpha * color.a;\n    \n    if (a < alphaCutoff) {\n      discard;\n    }\n\n    gl_FragColor = vec4(color.rgb, a * opacity);\n  }\n\n  DECKGL_FILTER_COLOR(gl_FragColor, geometry);\n}\n";

const DEFAULT_BUFFER$1 = 192.0 / 256;
const EMPTY_ARRAY = [];
const defaultProps$4 = {
  getIconOffsets: {
    type: 'accessor',
    value: x => x.offsets
  },
  alphaCutoff: 0.001,
  smoothing: 0.1,
  outlineWidth: 0,
  outlineColor: {
    type: 'color',
    value: [0, 0, 0, 255]
  }
};
class MultiIconLayer extends IconLayer {
  getShaders() {
    return { ...super.getShaders(),
      fs: fs$1
    };
  }

  initializeState() {
    super.initializeState();
    const attributeManager = this.getAttributeManager();
    attributeManager.addInstanced({
      instanceOffsets: {
        size: 2,
        accessor: 'getIconOffsets'
      },
      instancePickingColors: {
        type: 5121,
        size: 3,
        accessor: (object, _ref) => {
          let {
            index,
            target: value
          } = _ref;
          return this.encodePickingColor(index, value);
        }
      }
    });
  }

  updateState(params) {
    super.updateState(params);
    const {
      props,
      oldProps
    } = params;
    let {
      outlineColor
    } = props;

    if (outlineColor !== oldProps.outlineColor) {
      outlineColor = outlineColor.map(x => x / 255);
      outlineColor[3] = Number.isFinite(outlineColor[3]) ? outlineColor[3] : 1;
      this.setState({
        outlineColor
      });
    }

    if (!props.sdf && props.outlineWidth) {
      log.warn("".concat(this.id, ": fontSettings.sdf is required to render outline"))();
    }
  }

  draw(params) {
    const {
      sdf,
      smoothing,
      outlineWidth
    } = this.props;
    const {
      outlineColor
    } = this.state;
    params.uniforms = { ...params.uniforms,
      buffer: DEFAULT_BUFFER$1,
      outlineBuffer: outlineWidth ? Math.max(smoothing, DEFAULT_BUFFER$1 * (1 - outlineWidth)) : -1,
      gamma: smoothing,
      sdf: Boolean(sdf),
      outlineColor
    };
    super.draw(params);
  }

  getInstanceOffset(icons) {
    return icons ? Array.from(icons).map(icon => super.getInstanceOffset(icon)) : EMPTY_ARRAY;
  }

  getInstanceColorMode(icons) {
    return 1;
  }

  getInstanceIconFrame(icons) {
    return icons ? Array.from(icons).map(icon => super.getInstanceIconFrame(icon)) : EMPTY_ARRAY;
  }

}
MultiIconLayer.layerName = 'MultiIconLayer';
MultiIconLayer.defaultProps = defaultProps$4;

var tinySdf = TinySDF;
var _default = TinySDF;

var INF = 1e20;

function TinySDF(fontSize, buffer, radius, cutoff, fontFamily, fontWeight) {
    this.fontSize = fontSize || 24;
    this.buffer = buffer === undefined ? 3 : buffer;
    this.cutoff = cutoff || 0.25;
    this.fontFamily = fontFamily || 'sans-serif';
    this.fontWeight = fontWeight || 'normal';
    this.radius = radius || 8;

    // For backwards compatibility, we honor the implicit contract that the
    // size of the returned bitmap will be fontSize + buffer * 2
    var size = this.size = this.fontSize + this.buffer * 2;
    // Glyphs may be slightly larger than their fontSize. The canvas already
    // has buffer space, but create extra buffer space in the output grid for the
    // "halo" to extend into (if metric extraction is enabled)
    var gridSize = size + this.buffer * 2;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvas.height = size;

    this.ctx = this.canvas.getContext('2d');
    this.ctx.font = this.fontWeight + ' ' + this.fontSize + 'px ' + this.fontFamily;

    this.ctx.textAlign = 'left'; // Necessary so that RTL text doesn't have different alignment
    this.ctx.fillStyle = 'black';

    // temporary arrays for the distance transform
    this.gridOuter = new Float64Array(gridSize * gridSize);
    this.gridInner = new Float64Array(gridSize * gridSize);
    this.f = new Float64Array(gridSize);
    this.z = new Float64Array(gridSize + 1);
    this.v = new Uint16Array(gridSize);

    this.useMetrics = this.ctx.measureText('A').actualBoundingBoxLeft !== undefined;

    // hack around https://bugzilla.mozilla.org/show_bug.cgi?id=737852
    this.middle = Math.round((size / 2) * (navigator.userAgent.indexOf('Gecko/') >= 0 ? 1.2 : 1));
}

function prepareGrids(imgData, width, height, glyphWidth, glyphHeight, gridOuter, gridInner) {
    // Initialize grids outside the glyph range to alpha 0
    gridOuter.fill(INF, 0, width * height);
    gridInner.fill(0, 0, width * height);

    var offset = (width - glyphWidth) / 2; // This is zero if we're not extracting metrics

    for (var y = 0; y < glyphHeight; y++) {
        for (var x = 0; x < glyphWidth; x++) {
            var j = (y + offset) * width + x + offset;
            var a = imgData.data[4 * (y * glyphWidth + x) + 3] / 255; // alpha value
            if (a === 1) {
                gridOuter[j] = 0;
                gridInner[j] = INF;
            } else if (a === 0) {
                gridOuter[j] = INF;
                gridInner[j] = 0;
            } else {
                var b = Math.max(0, 0.5 - a);
                var c = Math.max(0, a - 0.5);
                gridOuter[j] = b * b;
                gridInner[j] = c * c;
            }
        }
    }
}

function extractAlpha(alphaChannel, width, height, gridOuter, gridInner, radius, cutoff) {
    for (var i = 0; i < width * height; i++) {
        var d = Math.sqrt(gridOuter[i]) - Math.sqrt(gridInner[i]);
        alphaChannel[i] = Math.round(255 - 255 * (d / radius + cutoff));
    }
}

TinySDF.prototype._draw = function (char, getMetrics) {
    var textMetrics = this.ctx.measureText(char);
    // Older browsers only expose the glyph width
    // This is enough for basic layout with all glyphs using the same fixed size
    var advance = textMetrics.width;

    var doubleBuffer = 2 * this.buffer;
    var width, glyphWidth, height, glyphHeight, top;

    var imgTop, imgLeft, baselinePosition;
    // If the browser supports bounding box metrics, we can generate a smaller
    // SDF. This is a significant performance win.
    if (getMetrics && this.useMetrics) {
        // The integer/pixel part of the top alignment is encoded in metrics.top
        // The remainder is implicitly encoded in the rasterization
        top = Math.floor(textMetrics.actualBoundingBoxAscent);
        baselinePosition = this.buffer + Math.ceil(textMetrics.actualBoundingBoxAscent);
        imgTop = this.buffer;
        imgLeft = this.buffer;

        // If the glyph overflows the canvas size, it will be clipped at the
        // bottom/right
        glyphWidth = Math.min(this.size,
            Math.ceil(textMetrics.actualBoundingBoxRight - textMetrics.actualBoundingBoxLeft));
        glyphHeight = Math.min(this.size - imgTop,
            Math.ceil(textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent));

        width = glyphWidth + doubleBuffer;
        height = glyphHeight + doubleBuffer;
        this.ctx.textBaseline = 'alphabetic';
    } else {
        width = glyphWidth = this.size;
        height = glyphHeight = this.size;
        // 19 points is an approximation of the "cap height" ascent from alphabetic
        // baseline (even though actual drawing is from middle baseline, we can
        // use the approximation because every glyph fills the em box)
        top = 19 * this.fontSize / 24;
        imgTop = imgLeft = 0;
        baselinePosition = this.middle;
        this.ctx.textBaseline = 'middle';
    }

    var imgData;
    if (glyphWidth && glyphHeight) {
        this.ctx.clearRect(imgLeft, imgTop, glyphWidth, glyphHeight);
        this.ctx.fillText(char, this.buffer, baselinePosition);
        imgData = this.ctx.getImageData(imgLeft, imgTop, glyphWidth, glyphHeight);
    }

    var alphaChannel = new Uint8ClampedArray(width * height);

    prepareGrids(imgData, width, height, glyphWidth, glyphHeight, this.gridOuter, this.gridInner);

    edt(this.gridOuter, width, height, this.f, this.v, this.z);
    edt(this.gridInner, width, height, this.f, this.v, this.z);

    extractAlpha(alphaChannel, width, height, this.gridOuter, this.gridInner, this.radius, this.cutoff);

    return {
        data: alphaChannel,
        metrics: {
            width: glyphWidth,
            height: glyphHeight,
            sdfWidth: width,
            sdfHeight: height,
            top: top,
            left: 0,
            advance: advance
        }
    };
};

TinySDF.prototype.draw = function (char) {
    return this._draw(char, false).data;
};

TinySDF.prototype.drawWithMetrics = function (char) {
    return this._draw(char, true);
};

// 2D Euclidean squared distance transform by Felzenszwalb & Huttenlocher https://cs.brown.edu/~pff/papers/dt-final.pdf
function edt(data, width, height, f, v, z) {
    for (var x = 0; x < width; x++) edt1d(data, x, width, height, f, v, z);
    for (var y = 0; y < height; y++) edt1d(data, y * width, 1, width, f, v, z);
}

// 1D squared distance transform
function edt1d(grid, offset, stride, length, f, v, z) {
    var q, k, s, r;
    v[0] = 0;
    z[0] = -INF;
    z[1] = INF;

    for (q = 0; q < length; q++) f[q] = grid[offset + q * stride];

    for (q = 1, k = 0, s = 0; q < length; q++) {
        do {
            r = v[k];
            s = (f[q] - f[r] + q * q - r * r) / (q - r) / 2;
        } while (s <= z[k] && --k > -1);

        k++;
        v[k] = q;
        z[k] = s;
        z[k + 1] = INF;
    }

    for (q = 0, k = 0; q < length; q++) {
        while (z[k + 1] < q) k++;
        r = v[k];
        grid[offset + q * stride] = f[r] + (q - r) * (q - r);
    }
}

var TinySDF$1 = tinySdf;
tinySdf.default = _default;

const MISSING_CHAR_WIDTH = 32;
const SINGLE_LINE = [];
function nextPowOfTwo(number) {
  return Math.pow(2, Math.ceil(Math.log2(number)));
}
function buildMapping(_ref) {
  let {
    characterSet,
    getFontWidth,
    fontHeight,
    buffer,
    maxCanvasWidth,
    mapping = {},
    xOffset = 0,
    yOffset = 0
  } = _ref;
  let row = 0;
  let x = xOffset;
  let i = 0;

  for (const char of characterSet) {
    if (!mapping[char]) {
      const width = getFontWidth(char, i++);

      if (x + width + buffer * 2 > maxCanvasWidth) {
        x = 0;
        row++;
      }

      mapping[char] = {
        x: x + buffer,
        y: yOffset + row * (fontHeight + buffer * 2) + buffer,
        width,
        height: fontHeight
      };
      x += width + buffer * 2;
    }
  }

  const rowHeight = fontHeight + buffer * 2;
  return {
    mapping,
    xOffset: x,
    yOffset: yOffset + row * rowHeight,
    canvasHeight: nextPowOfTwo(yOffset + (row + 1) * rowHeight)
  };
}

function getTextWidth(text, startIndex, endIndex, mapping) {
  let width = 0;

  for (let i = startIndex; i < endIndex; i++) {
    const character = text[i];
    let frameWidth = null;
    const frame = mapping && mapping[character];

    if (frame) {
      frameWidth = frame.width;
    }

    width += frameWidth;
  }

  return width;
}

function breakAll(text, startIndex, endIndex, maxWidth, iconMapping, target) {
  let rowStartCharIndex = startIndex;
  let rowOffsetLeft = 0;

  for (let i = startIndex; i < endIndex; i++) {
    const textWidth = getTextWidth(text, i, i + 1, iconMapping);

    if (rowOffsetLeft + textWidth > maxWidth) {
      if (rowStartCharIndex < i) {
        target.push(i);
      }

      rowStartCharIndex = i;
      rowOffsetLeft = 0;
    }

    rowOffsetLeft += textWidth;
  }

  return rowOffsetLeft;
}

function breakWord(text, startIndex, endIndex, maxWidth, iconMapping, target) {
  let rowStartCharIndex = startIndex;
  let groupStartCharIndex = startIndex;
  let groupEndCharIndex = startIndex;
  let rowOffsetLeft = 0;

  for (let i = startIndex; i < endIndex; i++) {
    if (text[i] === ' ') {
      groupEndCharIndex = i + 1;
    } else if (text[i + 1] === ' ' || i + 1 === endIndex) {
      groupEndCharIndex = i + 1;
    }

    if (groupEndCharIndex > groupStartCharIndex) {
      let groupWidth = getTextWidth(text, groupStartCharIndex, groupEndCharIndex, iconMapping);

      if (rowOffsetLeft + groupWidth > maxWidth) {
        if (rowStartCharIndex < groupStartCharIndex) {
          target.push(groupStartCharIndex);
          rowStartCharIndex = groupStartCharIndex;
          rowOffsetLeft = 0;
        }

        if (groupWidth > maxWidth) {
          groupWidth = breakAll(text, groupStartCharIndex, groupEndCharIndex, maxWidth, iconMapping, target);
          rowStartCharIndex = target[target.length - 1];
        }
      }

      groupStartCharIndex = groupEndCharIndex;
      rowOffsetLeft += groupWidth;
    }
  }

  return rowOffsetLeft;
}

function autoWrapping(text, wordBreak, maxWidth, iconMapping) {
  let startIndex = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
  let endIndex = arguments.length > 5 ? arguments[5] : undefined;

  if (endIndex === undefined) {
    endIndex = text.length;
  }

  const result = [];

  if (wordBreak === 'break-all') {
    breakAll(text, startIndex, endIndex, maxWidth, iconMapping, result);
  } else {
    breakWord(text, startIndex, endIndex, maxWidth, iconMapping, result);
  }

  return result;
}

function transformRow(line, startIndex, endIndex, iconMapping, leftOffsets, rowSize) {
  let x = 0;
  let rowHeight = 0;

  for (let i = startIndex; i < endIndex; i++) {
    const character = line[i];
    const frame = iconMapping[character];

    if (frame) {
      if (!rowHeight) {
        rowHeight = frame.height;
      }

      leftOffsets[i] = x + frame.width / 2;
      x += frame.width;
    } else {
      log.warn("Missing character: ".concat(character, " (").concat(character.codePointAt(0), ")"))();
      leftOffsets[i] = x;
      x += MISSING_CHAR_WIDTH;
    }
  }

  rowSize[0] = x;
  rowSize[1] = rowHeight;
}

function transformParagraph(paragraph, lineHeight, wordBreak, maxWidth, iconMapping) {
  paragraph = Array.from(paragraph);
  const numCharacters = paragraph.length;
  const x = new Array(numCharacters);
  const y = new Array(numCharacters);
  const rowWidth = new Array(numCharacters);
  const autoWrappingEnabled = (wordBreak === 'break-word' || wordBreak === 'break-all') && isFinite(maxWidth) && maxWidth > 0;
  const size = [0, 0];
  const rowSize = [];
  let rowOffsetTop = 0;
  let lineStartIndex = 0;
  let lineEndIndex = 0;

  for (let i = 0; i <= numCharacters; i++) {
    const char = paragraph[i];

    if (char === '\n' || i === numCharacters) {
      lineEndIndex = i;
    }

    if (lineEndIndex > lineStartIndex) {
      const rows = autoWrappingEnabled ? autoWrapping(paragraph, wordBreak, maxWidth, iconMapping, lineStartIndex, lineEndIndex) : SINGLE_LINE;

      for (let rowIndex = 0; rowIndex <= rows.length; rowIndex++) {
        const rowStart = rowIndex === 0 ? lineStartIndex : rows[rowIndex - 1];
        const rowEnd = rowIndex < rows.length ? rows[rowIndex] : lineEndIndex;
        transformRow(paragraph, rowStart, rowEnd, iconMapping, x, rowSize);

        for (let j = rowStart; j < rowEnd; j++) {
          y[j] = rowOffsetTop + rowSize[1] / 2;
          rowWidth[j] = rowSize[0];
        }

        rowOffsetTop = rowOffsetTop + rowSize[1] * lineHeight;
        size[0] = Math.max(size[0], rowSize[0]);
      }

      lineStartIndex = lineEndIndex;
    }

    if (char === '\n') {
      x[lineStartIndex] = 0;
      y[lineStartIndex] = 0;
      rowWidth[lineStartIndex] = 0;
      lineStartIndex++;
    }
  }

  size[1] = rowOffsetTop;
  return {
    x,
    y,
    rowWidth,
    size
  };
}
function getTextFromBuffer(_ref2) {
  let {
    value,
    length,
    stride,
    offset,
    startIndices,
    characterSet
  } = _ref2;
  const bytesPerElement = value.BYTES_PER_ELEMENT;
  const elementStride = stride ? stride / bytesPerElement : 1;
  const elementOffset = offset ? offset / bytesPerElement : 0;
  const characterCount = startIndices[length] || Math.ceil((value.length - elementOffset) / elementStride);
  const autoCharacterSet = characterSet && new Set();
  const texts = new Array(length);
  let codes = value;

  if (elementStride > 1 || elementOffset > 0) {
    codes = new value.constructor(characterCount);

    for (let i = 0; i < characterCount; i++) {
      codes[i] = value[i * elementStride + elementOffset];
    }
  }

  for (let index = 0; index < length; index++) {
    const startIndex = startIndices[index];
    const endIndex = startIndices[index + 1] || characterCount;
    const codesAtIndex = codes.subarray(startIndex, endIndex);
    texts[index] = String.fromCodePoint.apply(null, codesAtIndex);

    if (autoCharacterSet) {
      codesAtIndex.forEach(autoCharacterSet.add, autoCharacterSet);
    }
  }

  if (autoCharacterSet) {
    for (const charCode of autoCharacterSet) {
      characterSet.add(String.fromCodePoint(charCode));
    }
  }

  return {
    texts,
    characterCount
  };
}

class LRUCache {
  constructor() {
    let limit = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 5;
    this.limit = limit;
    this.clear();
  }

  clear() {
    this._cache = {};
    this._order = [];
  }

  get(key) {
    const value = this._cache[key];

    if (value) {
      this._deleteOrder(key);

      this._appendOrder(key);
    }

    return value;
  }

  set(key, value) {
    if (!this._cache[key]) {
      if (Object.keys(this._cache).length === this.limit) {
        this.delete(this._order[0]);
      }

      this._cache[key] = value;

      this._appendOrder(key);
    } else {
      this.delete(key);
      this._cache[key] = value;

      this._appendOrder(key);
    }
  }

  delete(key) {
    const value = this._cache[key];

    if (value) {
      this._deleteCache(key);

      this._deleteOrder(key);
    }
  }

  _deleteCache(key) {
    delete this._cache[key];
  }

  _deleteOrder(key) {
    const index = this._order.findIndex(o => o === key);

    if (index >= 0) {
      this._order.splice(index, 1);
    }
  }

  _appendOrder(key) {
    this._order.push(key);
  }

}

function getDefaultCharacterSet() {
  const charSet = [];

  for (let i = 32; i < 128; i++) {
    charSet.push(String.fromCharCode(i));
  }

  return charSet;
}

const DEFAULT_CHAR_SET = getDefaultCharacterSet();
const DEFAULT_FONT_FAMILY = 'Monaco, monospace';
const DEFAULT_FONT_WEIGHT = 'normal';
const DEFAULT_FONT_SIZE = 64;
const DEFAULT_BUFFER = 4;
const DEFAULT_CUTOFF = 0.25;
const DEFAULT_RADIUS = 12;
const MAX_CANVAS_WIDTH = 1024;
const BASELINE_SCALE = 0.9;
const HEIGHT_SCALE = 1.2;
const CACHE_LIMIT = 3;
let cache = new LRUCache(CACHE_LIMIT);
const VALID_PROPS = ['fontFamily', 'fontWeight', 'characterSet', 'fontSize', 'sdf', 'buffer', 'cutoff', 'radius'];

function getNewChars(key, characterSet) {
  const cachedFontAtlas = cache.get(key);

  if (!cachedFontAtlas) {
    return characterSet;
  }

  const newChars = [];
  const cachedMapping = cachedFontAtlas.mapping;
  let cachedCharSet = Object.keys(cachedMapping);
  cachedCharSet = new Set(cachedCharSet);
  let charSet = characterSet;

  if (charSet instanceof Array) {
    charSet = new Set(charSet);
  }

  charSet.forEach(char => {
    if (!cachedCharSet.has(char)) {
      newChars.push(char);
    }
  });
  return newChars;
}

function populateAlphaChannel(alphaChannel, imageData) {
  for (let i = 0; i < alphaChannel.length; i++) {
    imageData.data[4 * i + 3] = alphaChannel[i];
  }
}

function setTextStyle(ctx, fontFamily, fontSize, fontWeight) {
  ctx.font = "".concat(fontWeight, " ").concat(fontSize, "px ").concat(fontFamily);
  ctx.fillStyle = '#000';
  ctx.textBaseline = 'baseline';
  ctx.textAlign = 'left';
}

function setFontAtlasCacheLimit(limit) {
  log.assert(Number.isFinite(limit) && limit >= CACHE_LIMIT, 'Invalid cache limit');
  cache = new LRUCache(limit);
}
class FontAtlasManager {
  constructor() {
    this.props = {
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: DEFAULT_FONT_WEIGHT,
      characterSet: DEFAULT_CHAR_SET,
      fontSize: DEFAULT_FONT_SIZE,
      buffer: DEFAULT_BUFFER,
      sdf: false,
      cutoff: DEFAULT_CUTOFF,
      radius: DEFAULT_RADIUS
    };
    this._key = null;
    this._atlas = null;
  }

  get texture() {
    return this._atlas;
  }

  get mapping() {
    return this._atlas && this._atlas.mapping;
  }

  get scale() {
    return HEIGHT_SCALE;
  }

  setProps() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    VALID_PROPS.forEach(prop => {
      if (prop in props) {
        this.props[prop] = props[prop];
      }
    });
    const oldKey = this._key;
    this._key = this._getKey();
    const charSet = getNewChars(this._key, this.props.characterSet);
    const cachedFontAtlas = cache.get(this._key);

    if (cachedFontAtlas && charSet.length === 0) {
      if (this._key !== oldKey) {
        this._atlas = cachedFontAtlas;
      }

      return;
    }

    const fontAtlas = this._generateFontAtlas(this._key, charSet, cachedFontAtlas);

    this._atlas = fontAtlas;
    cache.set(this._key, fontAtlas);
  }

  _generateFontAtlas(key, characterSet, cachedFontAtlas) {
    const {
      fontFamily,
      fontWeight,
      fontSize,
      buffer,
      sdf,
      radius,
      cutoff
    } = this.props;
    let canvas = cachedFontAtlas && cachedFontAtlas.data;

    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = MAX_CANVAS_WIDTH;
    }

    const ctx = canvas.getContext('2d');
    setTextStyle(ctx, fontFamily, fontSize, fontWeight);
    const {
      mapping,
      canvasHeight,
      xOffset,
      yOffset
    } = buildMapping({
      getFontWidth: char => ctx.measureText(char).width,
      fontHeight: fontSize * HEIGHT_SCALE,
      buffer,
      characterSet,
      maxCanvasWidth: MAX_CANVAS_WIDTH,
      ...(cachedFontAtlas && {
        mapping: cachedFontAtlas.mapping,
        xOffset: cachedFontAtlas.xOffset,
        yOffset: cachedFontAtlas.yOffset
      })
    });

    if (canvas.height !== canvasHeight) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      canvas.height = canvasHeight;
      ctx.putImageData(imageData, 0, 0);
    }

    setTextStyle(ctx, fontFamily, fontSize, fontWeight);

    if (sdf) {
      const tinySDF = new TinySDF$1(fontSize, buffer, radius, cutoff, fontFamily, fontWeight);
      const imageData = ctx.getImageData(0, 0, tinySDF.size, tinySDF.size);

      for (const char of characterSet) {
        populateAlphaChannel(tinySDF.draw(char), imageData);
        ctx.putImageData(imageData, mapping[char].x - buffer, mapping[char].y + buffer);
      }
    } else {
      for (const char of characterSet) {
        ctx.fillText(char, mapping[char].x, mapping[char].y + fontSize * BASELINE_SCALE);
      }
    }

    return {
      xOffset,
      yOffset,
      mapping,
      data: canvas,
      width: canvas.width,
      height: canvas.height
    };
  }

  _getKey() {
    const {
      fontFamily,
      fontWeight,
      fontSize,
      buffer,
      sdf,
      radius,
      cutoff
    } = this.props;

    if (sdf) {
      return "".concat(fontFamily, " ").concat(fontWeight, " ").concat(fontSize, " ").concat(buffer, " ").concat(radius, " ").concat(cutoff);
    }

    return "".concat(fontFamily, " ").concat(fontWeight, " ").concat(fontSize, " ").concat(buffer);
  }

}

var vs = "#define SHADER_NAME text-background-layer-vertex-shader\n\nattribute vec2 positions;\n\nattribute vec3 instancePositions;\nattribute vec3 instancePositions64Low;\nattribute vec4 instanceRects;\nattribute float instanceSizes;\nattribute float instanceAngles;\nattribute vec2 instancePixelOffsets;\nattribute float instanceLineWidths;\nattribute vec4 instanceFillColors;\nattribute vec4 instanceLineColors;\nattribute vec3 instancePickingColors;\n\nuniform bool billboard;\nuniform float opacity;\nuniform float sizeScale;\nuniform float sizeMinPixels;\nuniform float sizeMaxPixels;\nuniform vec4 padding;\nuniform int sizeUnits;\n\nvarying vec4 vFillColor;\nvarying vec4 vLineColor;\nvarying float vLineWidth;\nvarying vec2 uv;\nvarying vec2 dimensions;\n\nvec2 rotate_by_angle(vec2 vertex, float angle) {\n  float angle_radian = radians(angle);\n  float cos_angle = cos(angle_radian);\n  float sin_angle = sin(angle_radian);\n  mat2 rotationMatrix = mat2(cos_angle, -sin_angle, sin_angle, cos_angle);\n  return rotationMatrix * vertex;\n}\n\nvoid main(void) {\n  geometry.worldPosition = instancePositions;\n  geometry.uv = positions;\n  geometry.pickingColor = instancePickingColors;\n  uv = positions;\n  vLineWidth = instanceLineWidths;\n  float sizePixels = clamp(\n    project_size_to_pixel(instanceSizes * sizeScale, sizeUnits),\n    sizeMinPixels, sizeMaxPixels\n  );\n\n  dimensions = instanceRects.zw * sizePixels + padding.xy + padding.zw;\n\n  vec2 pixelOffset = (positions * instanceRects.zw + instanceRects.xy) * sizePixels + mix(-padding.xy, padding.zw, positions);\n  pixelOffset = rotate_by_angle(pixelOffset, instanceAngles);\n  pixelOffset += instancePixelOffsets;\n  pixelOffset.y *= -1.0;\n\n  if (billboard)  {\n    gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);\n    vec3 offset = vec3(pixelOffset, 0.0);\n    DECKGL_FILTER_SIZE(offset, geometry);\n    gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);\n  } else {\n    vec3 offset_common = vec3(project_pixel_size(pixelOffset), 0.0);\n    DECKGL_FILTER_SIZE(offset_common, geometry);\n    gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset_common, geometry.position);\n  }\n  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);\n  vFillColor = vec4(instanceFillColors.rgb, instanceFillColors.a * opacity);\n  DECKGL_FILTER_COLOR(vFillColor, geometry);\n  vLineColor = vec4(instanceLineColors.rgb, instanceLineColors.a * opacity);\n  DECKGL_FILTER_COLOR(vLineColor, geometry);\n}\n";

var fs = "#define SHADER_NAME text-background-layer-fragment-shader\n\nprecision highp float;\n\nuniform bool stroked;\n\nvarying vec4 vFillColor;\nvarying vec4 vLineColor;\nvarying float vLineWidth;\nvarying vec2 uv;\nvarying vec2 dimensions;\n\nvoid main(void) {\n  geometry.uv = uv;\n\n  vec2 pixelPosition = uv * dimensions;\n  if (stroked) {\n    float distToEdge = min(\n      min(pixelPosition.x, dimensions.x - pixelPosition.x),\n      min(pixelPosition.y, dimensions.y - pixelPosition.y)\n    );\n    float isBorder = smoothedge(distToEdge, vLineWidth);\n    gl_FragColor = mix(vFillColor, vLineColor, isBorder);\n  } else {\n    gl_FragColor = vFillColor;\n  }\n\n  DECKGL_FILTER_COLOR(gl_FragColor, geometry);\n}\n";

const defaultProps$3 = {
  billboard: true,
  sizeScale: 1,
  sizeUnits: 'pixels',
  sizeMinPixels: 0,
  sizeMaxPixels: Number.MAX_SAFE_INTEGER,
  padding: {
    type: 'array',
    value: [0, 0, 0, 0]
  },
  getPosition: {
    type: 'accessor',
    value: x => x.position
  },
  getSize: {
    type: 'accessor',
    value: 1
  },
  getAngle: {
    type: 'accessor',
    value: 0
  },
  getPixelOffset: {
    type: 'accessor',
    value: [0, 0]
  },
  getBoundingRect: {
    type: 'accessor',
    value: [0, 0, 0, 0]
  },
  getFillColor: {
    type: 'accessor',
    value: [0, 0, 0, 255]
  },
  getLineColor: {
    type: 'accessor',
    value: [0, 0, 0, 255]
  },
  getLineWidth: {
    type: 'accessor',
    value: 1
  }
};
class TextBackgroundLayer extends Layer {
  getShaders() {
    return super.getShaders({
      vs,
      fs,
      modules: [project32, picking]
    });
  }

  initializeState() {
    this.getAttributeManager().addInstanced({
      instancePositions: {
        size: 3,
        type: 5130,
        fp64: this.use64bitPositions(),
        transition: true,
        accessor: 'getPosition'
      },
      instanceSizes: {
        size: 1,
        transition: true,
        accessor: 'getSize',
        defaultValue: 1
      },
      instanceAngles: {
        size: 1,
        transition: true,
        accessor: 'getAngle'
      },
      instanceRects: {
        size: 4,
        accessor: 'getBoundingRect'
      },
      instancePixelOffsets: {
        size: 2,
        transition: true,
        accessor: 'getPixelOffset'
      },
      instanceFillColors: {
        size: 4,
        transition: true,
        normalized: true,
        type: 5121,
        accessor: 'getFillColor',
        defaultValue: [0, 0, 0, 255]
      },
      instanceLineColors: {
        size: 4,
        transition: true,
        normalized: true,
        type: 5121,
        accessor: 'getLineColor',
        defaultValue: [0, 0, 0, 255]
      },
      instanceLineWidths: {
        size: 1,
        transition: true,
        accessor: 'getLineWidth',
        defaultValue: 1
      }
    });
  }

  updateState(_ref) {
    let {
      props,
      oldProps,
      changeFlags
    } = _ref;
    super.updateState({
      props,
      oldProps,
      changeFlags
    });

    if (changeFlags.extensionsChanged) {
      var _this$state$model;

      const {
        gl
      } = this.context;
      (_this$state$model = this.state.model) === null || _this$state$model === void 0 ? void 0 : _this$state$model.delete();
      this.state.model = this._getModel(gl);
      this.getAttributeManager().invalidateAll();
    }
  }

  draw(_ref2) {
    let {
      uniforms
    } = _ref2;
    const {
      billboard,
      sizeScale,
      sizeUnits,
      sizeMinPixels,
      sizeMaxPixels,
      getLineWidth
    } = this.props;
    let {
      padding
    } = this.props;

    if (padding.length < 4) {
      padding = [padding[0], padding[1], padding[0], padding[1]];
    }

    this.state.model.setUniforms(uniforms).setUniforms({
      billboard,
      stroked: Boolean(getLineWidth),
      padding,
      sizeUnits: UNIT[sizeUnits],
      sizeScale,
      sizeMinPixels,
      sizeMaxPixels
    }).draw();
  }

  _getModel(gl) {
    const positions = [0, 0, 1, 0, 1, 1, 0, 1];
    return new Model(gl, { ...this.getShaders(),
      id: this.props.id,
      geometry: new Geometry({
        drawMode: 6,
        vertexCount: 4,
        attributes: {
          positions: {
            size: 2,
            value: new Float32Array(positions)
          }
        }
      }),
      isInstanced: true
    });
  }

}
TextBackgroundLayer.layerName = 'TextBackgroundLayer';
TextBackgroundLayer.defaultProps = defaultProps$3;

const DEFAULT_FONT_SETTINGS = {
  fontSize: DEFAULT_FONT_SIZE,
  buffer: DEFAULT_BUFFER,
  sdf: false,
  radius: DEFAULT_RADIUS,
  cutoff: DEFAULT_CUTOFF,
  smoothing: 0.1
};
const TEXT_ANCHOR = {
  start: 1,
  middle: 0,
  end: -1
};
const ALIGNMENT_BASELINE = {
  top: 1,
  center: 0,
  bottom: -1
};
const DEFAULT_COLOR = [0, 0, 0, 255];
const DEFAULT_LINE_HEIGHT = 1.0;
const FONT_SETTINGS_PROPS = ['fontSize', 'buffer', 'sdf', 'radius', 'cutoff'];
const defaultProps$2 = {
  billboard: true,
  sizeScale: 1,
  sizeUnits: 'pixels',
  sizeMinPixels: 0,
  sizeMaxPixels: Number.MAX_SAFE_INTEGER,
  background: false,
  getBackgroundColor: {
    type: 'accessor',
    value: [255, 255, 255, 255]
  },
  getBorderColor: {
    type: 'accessor',
    value: DEFAULT_COLOR
  },
  getBorderWidth: {
    type: 'accessor',
    value: 0
  },
  backgroundPadding: {
    type: 'array',
    value: [0, 0, 0, 0]
  },
  characterSet: {
    type: 'object',
    value: DEFAULT_CHAR_SET
  },
  fontFamily: DEFAULT_FONT_FAMILY,
  fontWeight: DEFAULT_FONT_WEIGHT,
  lineHeight: DEFAULT_LINE_HEIGHT,
  outlineWidth: {
    type: 'number',
    value: 0,
    min: 0
  },
  outlineColor: {
    type: 'color',
    value: DEFAULT_COLOR
  },
  fontSettings: {},
  wordBreak: 'break-word',
  maxWidth: {
    type: 'number',
    value: -1
  },
  getText: {
    type: 'accessor',
    value: x => x.text
  },
  getPosition: {
    type: 'accessor',
    value: x => x.position
  },
  getColor: {
    type: 'accessor',
    value: DEFAULT_COLOR
  },
  getSize: {
    type: 'accessor',
    value: 32
  },
  getAngle: {
    type: 'accessor',
    value: 0
  },
  getTextAnchor: {
    type: 'accessor',
    value: 'middle'
  },
  getAlignmentBaseline: {
    type: 'accessor',
    value: 'center'
  },
  getPixelOffset: {
    type: 'accessor',
    value: [0, 0]
  },
  backgroundColor: {
    deprecatedFor: ['background', 'getBackgroundColor']
  }
};
class TextLayer extends CompositeLayer {
  initializeState() {
    this.state = {
      styleVersion: 0,
      fontAtlasManager: new FontAtlasManager()
    };
  }

  updateState(_ref) {
    let {
      props,
      oldProps,
      changeFlags
    } = _ref;
    const textChanged = changeFlags.dataChanged || changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getText);
    const oldCharacterSet = this.state.characterSet;

    if (textChanged) {
      this._updateText();
    }

    const fontChanged = oldCharacterSet !== this.state.characterSet || this._fontChanged(oldProps, props);

    if (fontChanged) {
      this._updateFontAtlas(oldProps, props);
    }

    const styleChanged = fontChanged || props.lineHeight !== oldProps.lineHeight || props.wordBreak !== oldProps.wordBreak || props.maxWidth !== oldProps.maxWidth;

    if (styleChanged) {
      this.setState({
        styleVersion: this.state.styleVersion + 1
      });
    }
  }

  getPickingInfo(_ref2) {
    let {
      info
    } = _ref2;
    info.object = info.index >= 0 ? this.props.data[info.index] : null;
    return info;
  }

  _updateFontAtlas(oldProps, props) {
    const {
      fontSettings,
      fontFamily,
      fontWeight
    } = props;
    const {
      fontAtlasManager,
      characterSet
    } = this.state;
    fontAtlasManager.setProps({ ...DEFAULT_FONT_SETTINGS,
      ...fontSettings,
      characterSet,
      fontFamily,
      fontWeight
    });
  }

  _fontChanged(oldProps, props) {
    if (oldProps.fontFamily !== props.fontFamily || oldProps.fontWeight !== props.fontWeight) {
      return true;
    }

    if (oldProps.fontSettings === props.fontSettings) {
      return false;
    }

    const oldFontSettings = oldProps.fontSettings || {};
    const fontSettings = props.fontSettings || {};
    return FONT_SETTINGS_PROPS.some(prop => oldFontSettings[prop] !== fontSettings[prop]);
  }

  _updateText() {
    const {
      data,
      characterSet
    } = this.props;
    const textBuffer = data.attributes && data.attributes.getText;
    let {
      getText
    } = this.props;
    let {
      startIndices
    } = data;
    let numInstances;
    const autoCharacterSet = characterSet === 'auto' && new Set();

    if (textBuffer && startIndices) {
      const {
        texts,
        characterCount
      } = getTextFromBuffer({ ...(ArrayBuffer.isView(textBuffer) ? {
          value: textBuffer
        } : textBuffer),
        length: data.length,
        startIndices,
        characterSet: autoCharacterSet
      });
      numInstances = characterCount;

      getText = (_, _ref3) => {
        let {
          index
        } = _ref3;
        return texts[index];
      };
    } else {
      const {
        iterable,
        objectInfo
      } = createIterable(data);
      startIndices = [0];
      numInstances = 0;

      for (const object of iterable) {
        objectInfo.index++;
        const text = Array.from(getText(object, objectInfo) || '');

        if (autoCharacterSet) {
          text.forEach(autoCharacterSet.add, autoCharacterSet);
        }

        numInstances += text.length;
        startIndices.push(numInstances);
      }
    }

    this.setState({
      getText,
      startIndices,
      numInstances,
      characterSet: autoCharacterSet || characterSet
    });
  }

  getBoundingRect(object, objectInfo) {
    const iconMapping = this.state.fontAtlasManager.mapping;
    const {
      getText
    } = this.state;
    const {
      wordBreak,
      maxWidth,
      lineHeight,
      getTextAnchor,
      getAlignmentBaseline
    } = this.props;
    const paragraph = getText(object, objectInfo) || '';
    const {
      size: [width, height]
    } = transformParagraph(paragraph, lineHeight, wordBreak, maxWidth, iconMapping);
    const anchorX = TEXT_ANCHOR[typeof getTextAnchor === 'function' ? getTextAnchor(object, objectInfo) : getTextAnchor];
    const anchorY = ALIGNMENT_BASELINE[typeof getAlignmentBaseline === 'function' ? getAlignmentBaseline(object, objectInfo) : getAlignmentBaseline];
    return [(anchorX - 1) * width / 2, (anchorY - 1) * height / 2, width, height];
  }

  getIconOffsets(object, objectInfo) {
    const iconMapping = this.state.fontAtlasManager.mapping;
    const {
      getText
    } = this.state;
    const {
      wordBreak,
      maxWidth,
      lineHeight,
      getTextAnchor,
      getAlignmentBaseline
    } = this.props;
    const paragraph = getText(object, objectInfo) || '';
    const {
      x,
      y,
      rowWidth,
      size: [width, height]
    } = transformParagraph(paragraph, lineHeight, wordBreak, maxWidth, iconMapping);
    const anchorX = TEXT_ANCHOR[typeof getTextAnchor === 'function' ? getTextAnchor(object, objectInfo) : getTextAnchor];
    const anchorY = ALIGNMENT_BASELINE[typeof getAlignmentBaseline === 'function' ? getAlignmentBaseline(object, objectInfo) : getAlignmentBaseline];
    const numCharacters = x.length;
    const offsets = new Array(numCharacters * 2);
    let index = 0;

    for (let i = 0; i < numCharacters; i++) {
      const rowOffset = (1 - anchorX) * (width - rowWidth[i]) / 2;
      offsets[index++] = (anchorX - 1) * width / 2 + rowOffset + x[i];
      offsets[index++] = (anchorY - 1) * height / 2 + y[i];
    }

    return offsets;
  }

  renderLayers() {
    const {
      startIndices,
      numInstances,
      getText,
      fontAtlasManager: {
        scale,
        texture,
        mapping
      },
      styleVersion
    } = this.state;
    const {
      data,
      _dataDiff,
      getPosition,
      getColor,
      getSize,
      getAngle,
      getPixelOffset,
      getBackgroundColor,
      getBorderColor,
      getBorderWidth,
      backgroundPadding,
      background,
      billboard,
      fontSettings,
      outlineWidth,
      outlineColor,
      sizeScale,
      sizeUnits,
      sizeMinPixels,
      sizeMaxPixels,
      transitions,
      updateTriggers
    } = this.props;
    const CharactersLayerClass = this.getSubLayerClass('characters', MultiIconLayer);
    const BackgroundLayerClass = this.getSubLayerClass('background', TextBackgroundLayer);
    return [background && new BackgroundLayerClass({
      getFillColor: getBackgroundColor,
      getLineColor: getBorderColor,
      getLineWidth: getBorderWidth,
      padding: backgroundPadding,
      getPosition,
      getSize,
      getAngle,
      getPixelOffset,
      billboard,
      sizeScale: sizeScale / this.state.fontAtlasManager.props.fontSize,
      sizeUnits,
      sizeMinPixels,
      sizeMaxPixels,
      transitions: transitions && {
        getPosition: transitions.getPosition,
        getAngle: transitions.getAngle,
        getSize: transitions.getSize,
        getFillColor: transitions.getBackgroundColor,
        getLineColor: transitions.getBorderColor,
        getLineWidth: transitions.getBorderWidth,
        getPixelOffset: transitions.getPixelOffset
      }
    }, this.getSubLayerProps({
      id: 'background',
      updateTriggers: {
        getPosition: updateTriggers.getPosition,
        getAngle: updateTriggers.getAngle,
        getSize: updateTriggers.getSize,
        getFillColor: updateTriggers.getBackgroundColor,
        getLineColor: updateTriggers.getBorderColor,
        getLineWidth: updateTriggers.getBorderWidth,
        getPixelOffset: updateTriggers.getPixelOffset,
        getBoundingRect: {
          getText: updateTriggers.getText,
          getTextAnchor: updateTriggers.getTextAnchor,
          getAlignmentBaseline: updateTriggers.getAlignmentBaseline,
          styleVersion
        }
      }
    }), {
      data: data.attributes ? {
        length: data.length,
        attributes: data.attributes.background || {}
      } : data,
      _dataDiff,
      autoHighlight: false,
      getBoundingRect: this.getBoundingRect.bind(this)
    }), new CharactersLayerClass({
      sdf: fontSettings.sdf,
      smoothing: Number.isFinite(fontSettings.smoothing) ? fontSettings.smoothing : DEFAULT_FONT_SETTINGS.smoothing,
      outlineWidth,
      outlineColor,
      iconAtlas: texture,
      iconMapping: mapping,
      getPosition,
      getColor,
      getSize,
      getAngle,
      getPixelOffset,
      billboard,
      sizeScale: sizeScale * scale,
      sizeUnits,
      sizeMinPixels: sizeMinPixels * scale,
      sizeMaxPixels: sizeMaxPixels * scale,
      transitions: transitions && {
        getPosition: transitions.getPosition,
        getAngle: transitions.getAngle,
        getColor: transitions.getColor,
        getSize: transitions.getSize,
        getPixelOffset: transitions.getPixelOffset
      }
    }, this.getSubLayerProps({
      id: 'characters',
      updateTriggers: {
        getIcon: updateTriggers.getText,
        getPosition: updateTriggers.getPosition,
        getAngle: updateTriggers.getAngle,
        getColor: updateTriggers.getColor,
        getSize: updateTriggers.getSize,
        getPixelOffset: updateTriggers.getPixelOffset,
        getIconOffsets: {
          getText: updateTriggers.getText,
          getTextAnchor: updateTriggers.getTextAnchor,
          getAlignmentBaseline: updateTriggers.getAlignmentBaseline,
          styleVersion
        }
      }
    }), {
      data,
      _dataDiff,
      startIndices,
      numInstances,
      getIconOffsets: this.getIconOffsets.bind(this),
      getIcon: getText
    })];
  }

  static set fontAtlasCacheLimit(limit) {
    setFontAtlasCacheLimit(limit);
  }

}
TextLayer.layerName = 'TextLayer';
TextLayer.defaultProps = defaultProps$2;

const POINT_LAYER = {
  circle: {
    type: ScatterplotLayer,
    props: {
      filled: 'filled',
      stroked: 'stroked',
      lineWidthMaxPixels: 'lineWidthMaxPixels',
      lineWidthMinPixels: 'lineWidthMinPixels',
      lineWidthScale: 'lineWidthScale',
      lineWidthUnits: 'lineWidthUnits',
      pointRadiusMaxPixels: 'radiusMaxPixels',
      pointRadiusMinPixels: 'radiusMinPixels',
      pointRadiusScale: 'radiusScale',
      pointRadiusUnits: 'radiusUnits',
      pointAntialiasing: 'antialiasing',
      pointBillboard: 'billboard',
      getFillColor: 'getFillColor',
      getLineColor: 'getLineColor',
      getLineWidth: 'getLineWidth',
      getPointRadius: 'getRadius'
    }
  },
  icon: {
    type: IconLayer,
    props: {
      iconAtlas: 'iconAtlas',
      iconMapping: 'iconMapping',
      iconSizeMaxPixels: 'sizeMaxPixels',
      iconSizeMinPixels: 'sizeMinPixels',
      iconSizeScale: 'sizeScale',
      iconSizeUnits: 'sizeUnits',
      iconAlphaCutoff: 'alphaCutoff',
      iconBillboard: 'billboard',
      getIcon: 'getIcon',
      getIconAngle: 'getAngle',
      getIconColor: 'getColor',
      getIconPixelOffset: 'getPixelOffset',
      getIconSize: 'getSize'
    }
  },
  text: {
    type: TextLayer,
    props: {
      textSizeMaxPixels: 'sizeMaxPixels',
      textSizeMinPixels: 'sizeMinPixels',
      textSizeScale: 'sizeScale',
      textSizeUnits: 'sizeUnits',
      textBackground: 'background',
      textBackgroundPadding: 'backgroundPadding',
      textFontFamily: 'fontFamily',
      textFontWeight: 'fontWeight',
      textLineHeight: 'lineHeight',
      textMaxWidth: 'maxWidth',
      textOutlineColor: 'outlineColor',
      textOutlineWidth: 'outlineWidth',
      textWordBreak: 'wordBreak',
      textCharacterSet: 'characterSet',
      textBillboard: 'billboard',
      textFontSettings: 'fontSettings',
      getText: 'getText',
      getTextAngle: 'getAngle',
      getTextColor: 'getColor',
      getTextPixelOffset: 'getPixelOffset',
      getTextSize: 'getSize',
      getTextAnchor: 'getTextAnchor',
      getTextAlignmentBaseline: 'getAlignmentBaseline',
      getTextBackgroundColor: 'getBackgroundColor',
      getTextBorderColor: 'getBorderColor',
      getTextBorderWidth: 'getBorderWidth'
    }
  }
};
const LINE_LAYER = {
  type: PathLayer,
  props: {
    lineWidthUnits: 'widthUnits',
    lineWidthScale: 'widthScale',
    lineWidthMinPixels: 'widthMinPixels',
    lineWidthMaxPixels: 'widthMaxPixels',
    lineJointRounded: 'jointRounded',
    lineCapRounded: 'capRounded',
    lineMiterLimit: 'miterLimit',
    lineBillboard: 'billboard',
    getLineColor: 'getColor',
    getLineWidth: 'getWidth'
  }
};
const POLYGON_LAYER = {
  type: SolidPolygonLayer,
  props: {
    extruded: 'extruded',
    filled: 'filled',
    wireframe: 'wireframe',
    elevationScale: 'elevationScale',
    material: 'material',
    getElevation: 'getElevation',
    getFillColor: 'getFillColor',
    getLineColor: 'getLineColor'
  }
};
function getDefaultProps(_ref) {
  let {
    type,
    props
  } = _ref;
  const result = {};

  for (const key in props) {
    result[key] = type.defaultProps[props[key]];
  }

  return result;
}
function forwardProps(layer, mapping) {
  const {
    transitions,
    updateTriggers
  } = layer.props;
  const result = {
    updateTriggers: {},
    transitions: transitions && {
      getPosition: transitions.geometry
    }
  };

  for (const sourceKey in mapping) {
    const targetKey = mapping[sourceKey];
    let value = layer.props[sourceKey];

    if (sourceKey.startsWith('get')) {
      value = layer.getSubLayerAccessor(value);
      result.updateTriggers[targetKey] = updateTriggers[sourceKey];

      if (transitions) {
        result.transitions[targetKey] = transitions[sourceKey];
      }
    }

    result[targetKey] = value;
  }

  return result;
}

function getGeojsonFeatures(geojson) {
  if (Array.isArray(geojson)) {
    return geojson;
  }

  log.assert(geojson.type, 'GeoJSON does not have type');

  switch (geojson.type) {
    case 'Feature':
      return [geojson];

    case 'FeatureCollection':
      log.assert(Array.isArray(geojson.features), 'GeoJSON does not have features array');
      return geojson.features;

    default:
      return [{
        geometry: geojson
      }];
  }
}
function separateGeojsonFeatures(features, wrapFeature) {
  let dataRange = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  const separated = {
    pointFeatures: [],
    lineFeatures: [],
    polygonFeatures: [],
    polygonOutlineFeatures: []
  };
  const {
    startRow = 0,
    endRow = features.length
  } = dataRange;

  for (let featureIndex = startRow; featureIndex < endRow; featureIndex++) {
    const feature = features[featureIndex];
    log.assert(feature && feature.geometry, 'GeoJSON does not have geometry');
    const {
      geometry
    } = feature;

    if (geometry.type === 'GeometryCollection') {
      log.assert(Array.isArray(geometry.geometries), 'GeoJSON does not have geometries array');
      const {
        geometries
      } = geometry;

      for (let i = 0; i < geometries.length; i++) {
        const subGeometry = geometries[i];
        separateGeometry(subGeometry, separated, wrapFeature, feature, featureIndex);
      }
    } else {
      separateGeometry(geometry, separated, wrapFeature, feature, featureIndex);
    }
  }

  return separated;
}

function separateGeometry(geometry, separated, wrapFeature, sourceFeature, sourceFeatureIndex) {
  const {
    type,
    coordinates
  } = geometry;
  const {
    pointFeatures,
    lineFeatures,
    polygonFeatures,
    polygonOutlineFeatures
  } = separated;

  if (!validateGeometry(type, coordinates)) {
    log.warn("".concat(type, " coordinates are malformed"))();
    return;
  }

  switch (type) {
    case 'Point':
      pointFeatures.push(wrapFeature({
        geometry
      }, sourceFeature, sourceFeatureIndex));
      break;

    case 'MultiPoint':
      coordinates.forEach(point => {
        pointFeatures.push(wrapFeature({
          geometry: {
            type: 'Point',
            coordinates: point
          }
        }, sourceFeature, sourceFeatureIndex));
      });
      break;

    case 'LineString':
      lineFeatures.push(wrapFeature({
        geometry
      }, sourceFeature, sourceFeatureIndex));
      break;

    case 'MultiLineString':
      coordinates.forEach(path => {
        lineFeatures.push(wrapFeature({
          geometry: {
            type: 'LineString',
            coordinates: path
          }
        }, sourceFeature, sourceFeatureIndex));
      });
      break;

    case 'Polygon':
      polygonFeatures.push(wrapFeature({
        geometry
      }, sourceFeature, sourceFeatureIndex));
      coordinates.forEach(path => {
        polygonOutlineFeatures.push(wrapFeature({
          geometry: {
            type: 'LineString',
            coordinates: path
          }
        }, sourceFeature, sourceFeatureIndex));
      });
      break;

    case 'MultiPolygon':
      coordinates.forEach(polygon => {
        polygonFeatures.push(wrapFeature({
          geometry: {
            type: 'Polygon',
            coordinates: polygon
          }
        }, sourceFeature, sourceFeatureIndex));
        polygon.forEach(path => {
          polygonOutlineFeatures.push(wrapFeature({
            geometry: {
              type: 'LineString',
              coordinates: path
            }
          }, sourceFeature, sourceFeatureIndex));
        });
      });
      break;
  }
}

const COORDINATE_NEST_LEVEL = {
  Point: 1,
  MultiPoint: 2,
  LineString: 2,
  MultiLineString: 3,
  Polygon: 3,
  MultiPolygon: 4
};
function validateGeometry(type, coordinates) {
  let nestLevel = COORDINATE_NEST_LEVEL[type];
  log.assert(nestLevel, "Unknown GeoJSON type ".concat(type));

  while (coordinates && --nestLevel > 0) {
    coordinates = coordinates[0];
  }

  return coordinates && Number.isFinite(coordinates[0]);
}

function createEmptyLayerProps() {
  return {
    points: {},
    lines: {},
    polygons: {},
    polygonsOutline: {}
  };
}

function getCoordinates(f) {
  return f.geometry.coordinates;
}

function createLayerPropsFromFeatures(features, featuresDiff) {
  const layerProps = createEmptyLayerProps();
  const {
    pointFeatures,
    lineFeatures,
    polygonFeatures,
    polygonOutlineFeatures
  } = features;
  layerProps.points.data = pointFeatures;

  layerProps.points._dataDiff = featuresDiff.pointFeatures && (() => featuresDiff.pointFeatures);

  layerProps.points.getPosition = getCoordinates;
  layerProps.lines.data = lineFeatures;

  layerProps.lines._dataDiff = featuresDiff.lineFeatures && (() => featuresDiff.lineFeatures);

  layerProps.lines.getPath = getCoordinates;
  layerProps.polygons.data = polygonFeatures;

  layerProps.polygons._dataDiff = featuresDiff.polygonFeatures && (() => featuresDiff.polygonFeatures);

  layerProps.polygons.getPolygon = getCoordinates;
  layerProps.polygonsOutline.data = polygonOutlineFeatures;

  layerProps.polygonsOutline._dataDiff = featuresDiff.polygonOutlineFeatures && (() => featuresDiff.polygonOutlineFeatures);

  layerProps.polygonsOutline.getPath = getCoordinates;
  return layerProps;
}
function createLayerPropsFromBinary(geojsonBinary, encodePickingColor) {
  const layerProps = createEmptyLayerProps();
  const {
    points,
    lines,
    polygons
  } = geojsonBinary;
  const customPickingColors = calculatePickingColors(geojsonBinary, encodePickingColor);
  layerProps.points.data = {
    length: points.positions.value.length / points.positions.size,
    attributes: {
      getPosition: points.positions,
      instancePickingColors: {
        size: 3,
        value: customPickingColors.points
      }
    },
    properties: points.properties,
    numericProps: points.numericProps,
    featureIds: points.featureIds
  };
  layerProps.lines.data = {
    length: lines.pathIndices.value.length - 1,
    startIndices: lines.pathIndices.value,
    attributes: {
      getPath: lines.positions,
      instancePickingColors: {
        size: 3,
        value: customPickingColors.lines
      }
    },
    properties: lines.properties,
    numericProps: lines.numericProps,
    featureIds: lines.featureIds
  };
  layerProps.lines._pathType = 'open';
  layerProps.polygons.data = {
    length: polygons.polygonIndices.value.length - 1,
    startIndices: polygons.polygonIndices.value,
    attributes: {
      getPolygon: polygons.positions,
      pickingColors: {
        size: 3,
        value: customPickingColors.polygons
      }
    },
    properties: polygons.properties,
    numericProps: polygons.numericProps,
    featureIds: polygons.featureIds
  };
  layerProps.polygons._normalize = false;

  if (polygons.triangles) {
    layerProps.polygons.data.attributes.indices = polygons.triangles.value;
  }

  layerProps.polygonsOutline.data = {
    length: polygons.primitivePolygonIndices.value.length - 1,
    startIndices: polygons.primitivePolygonIndices.value,
    attributes: {
      getPath: polygons.positions,
      instancePickingColors: {
        size: 3,
        value: customPickingColors.polygons
      }
    },
    properties: polygons.properties,
    numericProps: polygons.numericProps,
    featureIds: polygons.featureIds
  };
  layerProps.polygonsOutline._pathType = 'open';
  return layerProps;
}

const FEATURE_TYPES = ['points', 'linestrings', 'polygons'];
const defaultProps$1 = { ...getDefaultProps(POINT_LAYER.circle),
  ...getDefaultProps(POINT_LAYER.icon),
  ...getDefaultProps(POINT_LAYER.text),
  ...getDefaultProps(LINE_LAYER),
  ...getDefaultProps(POLYGON_LAYER),
  stroked: true,
  filled: true,
  extruded: false,
  wireframe: false,
  iconAtlas: {
    type: 'object',
    value: null
  },
  iconMapping: {
    type: 'object',
    value: {}
  },
  getIcon: {
    type: 'accessor',
    value: f => f.properties.icon
  },
  getText: {
    type: 'accessor',
    value: f => f.properties.text
  },
  pointType: 'circle',
  getRadius: {
    deprecatedFor: 'getPointRadius'
  }
};
class GeoJsonLayer extends CompositeLayer {
  initializeState() {
    this.state = {
      layerProps: {},
      features: {}
    };

    if (this.props.getLineDashArray) {
      log.removed('getLineDashArray', 'PathStyleExtension')();
    }
  }

  updateState(_ref) {
    let {
      props,
      changeFlags
    } = _ref;

    if (!changeFlags.dataChanged) {
      return;
    }

    const {
      data
    } = this.props;
    const binary = data && 'points' in data && 'polygons' in data && 'lines' in data;
    this.setState({
      binary
    });

    if (binary) {
      this._updateStateBinary({
        props,
        changeFlags
      });
    } else {
      this._updateStateJSON({
        props,
        changeFlags
      });
    }
  }

  _updateStateBinary(_ref2) {
    let {
      props,
      changeFlags
    } = _ref2;
    const layerProps = createLayerPropsFromBinary(props.data, this.encodePickingColor);
    this.setState({
      layerProps
    });
  }

  _updateStateJSON(_ref3) {
    let {
      props,
      changeFlags
    } = _ref3;
    const features = getGeojsonFeatures(props.data);
    const wrapFeature = this.getSubLayerRow.bind(this);
    let newFeatures = {};
    const featuresDiff = {};

    if (Array.isArray(changeFlags.dataChanged)) {
      const oldFeatures = this.state.features;

      for (const key in oldFeatures) {
        newFeatures[key] = oldFeatures[key].slice();
        featuresDiff[key] = [];
      }

      for (const dataRange of changeFlags.dataChanged) {
        const partialFeatures = separateGeojsonFeatures(features, wrapFeature, dataRange);

        for (const key in oldFeatures) {
          featuresDiff[key].push(replaceInRange({
            data: newFeatures[key],
            getIndex: f => f.__source.index,
            dataRange,
            replace: partialFeatures[key]
          }));
        }
      }
    } else {
      newFeatures = separateGeojsonFeatures(features, wrapFeature);
    }

    const layerProps = createLayerPropsFromFeatures(newFeatures, featuresDiff);
    this.setState({
      features: newFeatures,
      featuresDiff,
      layerProps
    });
  }

  getPickingInfo(params) {
    const info = super.getPickingInfo(params);
    const {
      sourceLayer
    } = info;
    info.featureType = FEATURE_TYPES.find(ft => sourceLayer.id.startsWith("".concat(this.id, "-").concat(ft, "-")));
    return info;
  }

  _updateAutoHighlight(info) {
    const pointLayerIdPrefix = "".concat(this.id, "-points-");
    const sourceIsPoints = info.featureType === 'points';

    for (const layer of this.getSubLayers()) {
      if (layer.id.startsWith(pointLayerIdPrefix) === sourceIsPoints) {
        layer.updateAutoHighlight(info);
      }
    }
  }

  _renderPolygonLayer() {
    const {
      extruded,
      wireframe
    } = this.props;
    const {
      layerProps
    } = this.state;
    const id = 'polygons-fill';
    const PolygonFillLayer = this.shouldRenderSubLayer(id, layerProps.polygons.data) && this.getSubLayerClass(id, POLYGON_LAYER.type);

    if (PolygonFillLayer) {
      const forwardedProps = forwardProps(this, POLYGON_LAYER.props);
      const useLineColor = extruded && wireframe;

      if (!useLineColor) {
        delete forwardedProps.getLineColor;
      }

      forwardedProps.updateTriggers.lineColors = useLineColor;
      return new PolygonFillLayer(forwardedProps, this.getSubLayerProps({
        id,
        updateTriggers: forwardedProps.updateTriggers
      }), layerProps.polygons);
    }

    return null;
  }

  _renderLineLayers() {
    const {
      extruded,
      stroked
    } = this.props;
    const {
      layerProps
    } = this.state;
    const polygonStrokeLayerId = 'polygons-stroke';
    const lineStringsLayerId = 'linestrings';
    const PolygonStrokeLayer = !extruded && stroked && this.shouldRenderSubLayer(polygonStrokeLayerId, layerProps.polygonsOutline.data) && this.getSubLayerClass(polygonStrokeLayerId, LINE_LAYER.type);
    const LineStringsLayer = this.shouldRenderSubLayer(lineStringsLayerId, layerProps.lines.data) && this.getSubLayerClass(lineStringsLayerId, LINE_LAYER.type);

    if (PolygonStrokeLayer || LineStringsLayer) {
      const forwardedProps = forwardProps(this, LINE_LAYER.props);
      return [PolygonStrokeLayer && new PolygonStrokeLayer(forwardedProps, this.getSubLayerProps({
        id: polygonStrokeLayerId,
        updateTriggers: forwardedProps.updateTriggers
      }), layerProps.polygonsOutline), LineStringsLayer && new LineStringsLayer(forwardedProps, this.getSubLayerProps({
        id: lineStringsLayerId,
        updateTriggers: forwardedProps.updateTriggers
      }), layerProps.lines)];
    }

    return null;
  }

  _renderPointLayers() {
    const {
      pointType
    } = this.props;
    const {
      layerProps,
      binary
    } = this.state;
    let {
      highlightedObjectIndex
    } = this.props;

    if (!binary && Number.isFinite(highlightedObjectIndex)) {
      highlightedObjectIndex = layerProps.points.data.findIndex(d => d.__source.index === highlightedObjectIndex);
    }

    const types = new Set(pointType.split('+'));
    const pointLayers = [];

    for (const type of types) {
      const id = "points-".concat(type);
      const PointLayerMapping = POINT_LAYER[type];
      const PointsLayer = PointLayerMapping && this.shouldRenderSubLayer(id, layerProps.points.data) && this.getSubLayerClass(id, PointLayerMapping.type);

      if (PointsLayer) {
        const forwardedProps = forwardProps(this, PointLayerMapping.props);
        pointLayers.push(new PointsLayer(forwardedProps, this.getSubLayerProps({
          id,
          updateTriggers: forwardedProps.updateTriggers,
          highlightedObjectIndex
        }), layerProps.points));
      }
    }

    return pointLayers;
  }

  renderLayers() {
    const {
      extruded
    } = this.props;

    const polygonFillLayer = this._renderPolygonLayer();

    const lineLayers = this._renderLineLayers();

    const pointLayers = this._renderPointLayers();

    return [!extruded && polygonFillLayer, lineLayers, pointLayers, extruded && polygonFillLayer];
  }

  getSubLayerAccessor(accessor) {
    const {
      binary
    } = this.state;

    if (!binary || typeof accessor !== 'function') {
      return super.getSubLayerAccessor(accessor);
    }

    return (object, info) => {
      const {
        data,
        index
      } = info;
      const feature = binaryToFeatureForAccesor(data, index);
      return accessor(feature, info);
    };
  }

}
GeoJsonLayer.layerName = 'GeoJsonLayer';
GeoJsonLayer.defaultProps = defaultProps$1;

class Tile2DHeader {
  constructor(_ref) {
    let {
      x,
      y,
      z
    } = _ref;
    this.x = x;
    this.y = y;
    this.z = z;
    this.isVisible = false;
    this.isSelected = false;
    this.parent = null;
    this.children = [];
    this.content = null;
    this._loaderId = 0;
    this._isLoaded = false;
    this._isCancelled = false;
    this._needsReload = false;
  }

  get data() {
    return this.isLoading ? this._loader.then(() => this.data) : this.content;
  }

  get isLoaded() {
    return this._isLoaded && !this._needsReload;
  }

  get isLoading() {
    return Boolean(this._loader) && !this._isCancelled;
  }

  get needsReload() {
    return this._needsReload || this._isCancelled;
  }

  get byteLength() {
    const result = this.content ? this.content.byteLength : 0;

    if (!Number.isFinite(result)) {
      log.error('byteLength not defined in tile data')();
    }

    return result;
  }

  async _loadData(_ref2) {
    let {
      getData,
      requestScheduler,
      onLoad,
      onError
    } = _ref2;
    const {
      x,
      y,
      z,
      bbox
    } = this;
    const loaderId = this._loaderId;
    this._abortController = new AbortController();
    const {
      signal
    } = this._abortController;
    const requestToken = await requestScheduler.scheduleRequest(this, tile => {
      return tile.isSelected ? 1 : -1;
    });

    if (!requestToken) {
      this._isCancelled = true;
      return;
    }

    if (this._isCancelled) {
      requestToken.done();
      return;
    }

    let tileData = null;
    let error;

    try {
      tileData = await getData({
        x,
        y,
        z,
        bbox,
        signal
      });
    } catch (err) {
      error = err || true;
    } finally {
      requestToken.done();
    }

    if (loaderId !== this._loaderId) {
      return;
    }

    this._loader = undefined;
    this.content = tileData;

    if (this._isCancelled && !tileData) {
      this._isLoaded = false;
      return;
    }

    this._isLoaded = true;
    this._isCancelled = false;

    if (error) {
      onError(error, this);
    } else {
      onLoad(this);
    }
  }

  loadData(opts) {
    this._isLoaded = false;
    this._isCancelled = false;
    this._needsReload = false;
    this._loaderId++;
    this._loader = this._loadData(opts);
    return this._loader;
  }

  setNeedsReload() {
    if (this.isLoading) {
      this.abort();
      this._loader = undefined;
    }

    this._needsReload = true;
  }

  abort() {
    if (this.isLoaded) {
      return;
    }

    this._isCancelled = true;

    this._abortController.abort();
  }

}

const INTERSECTION = Object.freeze({
  OUTSIDE: -1,
  INTERSECTING: 0,
  INSIDE: 1
});

const scratchVector$1 = new Vector3();
const scratchNormal$1 = new Vector3();
class AxisAlignedBoundingBox {
  constructor(minimum = [0, 0, 0], maximum = [0, 0, 0], center = null) {
    center = center || scratchVector$1.copy(minimum).add(maximum).scale(0.5);
    this.center = new Vector3(center);
    this.halfDiagonal = new Vector3(maximum).subtract(this.center);
    this.minimum = new Vector3(minimum);
    this.maximum = new Vector3(maximum);
  }

  clone() {
    return new AxisAlignedBoundingBox(this.minimum, this.maximum, this.center);
  }

  equals(right) {
    return this === right || Boolean(right) && this.minimum.equals(right.minimum) && this.maximum.equals(right.maximum);
  }

  transform(transformation) {
    this.center.transformAsPoint(transformation);
    this.halfDiagonal.transform(transformation);
    this.minimum.transform(transformation);
    this.maximum.transform(transformation);
    return this;
  }

  intersectPlane(plane) {
    const {
      halfDiagonal
    } = this;
    const normal = scratchNormal$1.from(plane.normal);
    const e = halfDiagonal.x * Math.abs(normal.x) + halfDiagonal.y * Math.abs(normal.y) + halfDiagonal.z * Math.abs(normal.z);
    const s = this.center.dot(normal) + plane.distance;

    if (s - e > 0) {
      return INTERSECTION.INSIDE;
    }

    if (s + e < 0) {
      return INTERSECTION.OUTSIDE;
    }

    return INTERSECTION.INTERSECTING;
  }

  distanceTo(point) {
    return Math.sqrt(this.distanceSquaredTo(point));
  }

  distanceSquaredTo(point) {
    const offset = scratchVector$1.from(point).subtract(this.center);
    const {
      halfDiagonal
    } = this;
    let distanceSquared = 0.0;
    let d;
    d = Math.abs(offset.x) - halfDiagonal.x;

    if (d > 0) {
      distanceSquared += d * d;
    }

    d = Math.abs(offset.y) - halfDiagonal.y;

    if (d > 0) {
      distanceSquared += d * d;
    }

    d = Math.abs(offset.z) - halfDiagonal.z;

    if (d > 0) {
      distanceSquared += d * d;
    }

    return distanceSquared;
  }

}

const scratchVector = new Vector3();
const scratchVector2$1 = new Vector3();
class BoundingSphere {
  constructor(center = [0, 0, 0], radius = 0.0) {
    this.radius = -0;
    this.center = new Vector3();
    this.fromCenterRadius(center, radius);
  }

  fromCenterRadius(center, radius) {
    this.center.from(center);
    this.radius = radius;
    return this;
  }

  fromCornerPoints(corner, oppositeCorner) {
    oppositeCorner = scratchVector.from(oppositeCorner);
    this.center = new Vector3().from(corner).add(oppositeCorner).scale(0.5);
    this.radius = this.center.distance(oppositeCorner);
    return this;
  }

  equals(right) {
    return this === right || Boolean(right) && this.center.equals(right.center) && this.radius === right.radius;
  }

  clone() {
    return new BoundingSphere(this.center, this.radius);
  }

  union(boundingSphere) {
    const leftCenter = this.center;
    const leftRadius = this.radius;
    const rightCenter = boundingSphere.center;
    const rightRadius = boundingSphere.radius;
    const toRightCenter = scratchVector.copy(rightCenter).subtract(leftCenter);
    const centerSeparation = toRightCenter.magnitude();

    if (leftRadius >= centerSeparation + rightRadius) {
      return this.clone();
    }

    if (rightRadius >= centerSeparation + leftRadius) {
      return boundingSphere.clone();
    }

    const halfDistanceBetweenTangentPoints = (leftRadius + centerSeparation + rightRadius) * 0.5;
    scratchVector2$1.copy(toRightCenter).scale((-leftRadius + halfDistanceBetweenTangentPoints) / centerSeparation).add(leftCenter);
    this.center.copy(scratchVector2$1);
    this.radius = halfDistanceBetweenTangentPoints;
    return this;
  }

  expand(point) {
    point = scratchVector.from(point);
    const radius = point.subtract(this.center).magnitude();

    if (radius > this.radius) {
      this.radius = radius;
    }

    return this;
  }

  transform(transform) {
    this.center.transform(transform);
    const scale = getScaling(scratchVector, transform);
    this.radius = Math.max(scale[0], Math.max(scale[1], scale[2])) * this.radius;
    return this;
  }

  distanceSquaredTo(point) {
    const d = this.distanceTo(point);
    return d * d;
  }

  distanceTo(point) {
    point = scratchVector.from(point);
    const delta = point.subtract(this.center);
    return Math.max(0, delta.len() - this.radius);
  }

  intersectPlane(plane) {
    const center = this.center;
    const radius = this.radius;
    const normal = plane.normal;
    const distanceToPlane = normal.dot(center) + plane.distance;

    if (distanceToPlane < -radius) {
      return INTERSECTION.OUTSIDE;
    }

    if (distanceToPlane < radius) {
      return INTERSECTION.INTERSECTING;
    }

    return INTERSECTION.INSIDE;
  }

}

const scratchVector3$1 = new Vector3();
const scratchOffset = new Vector3();
const scratchVectorU = new Vector3();
const scratchVectorV = new Vector3();
const scratchVectorW = new Vector3();
const scratchCorner = new Vector3();
const scratchToCenter = new Vector3();
const MATRIX3 = {
  COLUMN0ROW0: 0,
  COLUMN0ROW1: 1,
  COLUMN0ROW2: 2,
  COLUMN1ROW0: 3,
  COLUMN1ROW1: 4,
  COLUMN1ROW2: 5,
  COLUMN2ROW0: 6,
  COLUMN2ROW1: 7,
  COLUMN2ROW2: 8
};
class OrientedBoundingBox {
  constructor(center = [0, 0, 0], halfAxes = [0, 0, 0, 0, 0, 0, 0, 0, 0]) {
    this.center = new Vector3().from(center);
    this.halfAxes = new Matrix3(halfAxes);
  }

  get halfSize() {
    const xAxis = this.halfAxes.getColumn(0);
    const yAxis = this.halfAxes.getColumn(1);
    const zAxis = this.halfAxes.getColumn(2);
    return [new Vector3(xAxis).len(), new Vector3(yAxis).len(), new Vector3(zAxis).len()];
  }

  get quaternion() {
    const xAxis = this.halfAxes.getColumn(0);
    const yAxis = this.halfAxes.getColumn(1);
    const zAxis = this.halfAxes.getColumn(2);
    const normXAxis = new Vector3(xAxis).normalize();
    const normYAxis = new Vector3(yAxis).normalize();
    const normZAxis = new Vector3(zAxis).normalize();
    return new Quaternion().fromMatrix3(new Matrix3([...normXAxis, ...normYAxis, ...normZAxis]));
  }

  fromCenterHalfSizeQuaternion(center, halfSize, quaternion) {
    const quaternionObject = new Quaternion(quaternion);
    const directionsMatrix = new Matrix3().fromQuaternion(quaternionObject);
    directionsMatrix[0] = directionsMatrix[0] * halfSize[0];
    directionsMatrix[1] = directionsMatrix[1] * halfSize[0];
    directionsMatrix[2] = directionsMatrix[2] * halfSize[0];
    directionsMatrix[3] = directionsMatrix[3] * halfSize[1];
    directionsMatrix[4] = directionsMatrix[4] * halfSize[1];
    directionsMatrix[5] = directionsMatrix[5] * halfSize[1];
    directionsMatrix[6] = directionsMatrix[6] * halfSize[2];
    directionsMatrix[7] = directionsMatrix[7] * halfSize[2];
    directionsMatrix[8] = directionsMatrix[8] * halfSize[2];
    this.center = new Vector3().from(center);
    this.halfAxes = directionsMatrix;
    return this;
  }

  clone() {
    return new OrientedBoundingBox(this.center, this.halfAxes);
  }

  equals(right) {
    return this === right || Boolean(right) && this.center.equals(right.center) && this.halfAxes.equals(right.halfAxes);
  }

  getBoundingSphere(result = new BoundingSphere()) {
    const halfAxes = this.halfAxes;
    const u = halfAxes.getColumn(0, scratchVectorU);
    const v = halfAxes.getColumn(1, scratchVectorV);
    const w = halfAxes.getColumn(2, scratchVectorW);
    const cornerVector = scratchVector3$1.copy(u).add(v).add(w);
    result.center.copy(this.center);
    result.radius = cornerVector.magnitude();
    return result;
  }

  intersectPlane(plane) {
    const center = this.center;
    const normal = plane.normal;
    const halfAxes = this.halfAxes;
    const normalX = normal.x;
    const normalY = normal.y;
    const normalZ = normal.z;
    const radEffective = Math.abs(normalX * halfAxes[MATRIX3.COLUMN0ROW0] + normalY * halfAxes[MATRIX3.COLUMN0ROW1] + normalZ * halfAxes[MATRIX3.COLUMN0ROW2]) + Math.abs(normalX * halfAxes[MATRIX3.COLUMN1ROW0] + normalY * halfAxes[MATRIX3.COLUMN1ROW1] + normalZ * halfAxes[MATRIX3.COLUMN1ROW2]) + Math.abs(normalX * halfAxes[MATRIX3.COLUMN2ROW0] + normalY * halfAxes[MATRIX3.COLUMN2ROW1] + normalZ * halfAxes[MATRIX3.COLUMN2ROW2]);
    const distanceToPlane = normal.dot(center) + plane.distance;

    if (distanceToPlane <= -radEffective) {
      return INTERSECTION.OUTSIDE;
    } else if (distanceToPlane >= radEffective) {
      return INTERSECTION.INSIDE;
    }

    return INTERSECTION.INTERSECTING;
  }

  distanceTo(point) {
    return Math.sqrt(this.distanceSquaredTo(point));
  }

  distanceSquaredTo(point) {
    const offset = scratchOffset.from(point).subtract(this.center);
    const halfAxes = this.halfAxes;
    const u = halfAxes.getColumn(0, scratchVectorU);
    const v = halfAxes.getColumn(1, scratchVectorV);
    const w = halfAxes.getColumn(2, scratchVectorW);
    const uHalf = u.magnitude();
    const vHalf = v.magnitude();
    const wHalf = w.magnitude();
    u.normalize();
    v.normalize();
    w.normalize();
    let distanceSquared = 0.0;
    let d;
    d = Math.abs(offset.dot(u)) - uHalf;

    if (d > 0) {
      distanceSquared += d * d;
    }

    d = Math.abs(offset.dot(v)) - vHalf;

    if (d > 0) {
      distanceSquared += d * d;
    }

    d = Math.abs(offset.dot(w)) - wHalf;

    if (d > 0) {
      distanceSquared += d * d;
    }

    return distanceSquared;
  }

  computePlaneDistances(position, direction, result = [-0, -0]) {
    let minDist = Number.POSITIVE_INFINITY;
    let maxDist = Number.NEGATIVE_INFINITY;
    const center = this.center;
    const halfAxes = this.halfAxes;
    const u = halfAxes.getColumn(0, scratchVectorU);
    const v = halfAxes.getColumn(1, scratchVectorV);
    const w = halfAxes.getColumn(2, scratchVectorW);
    const corner = scratchCorner.copy(u).add(v).add(w).add(center);
    const toCenter = scratchToCenter.copy(corner).subtract(position);
    let mag = direction.dot(toCenter);
    minDist = Math.min(mag, minDist);
    maxDist = Math.max(mag, maxDist);
    corner.copy(center).add(u).add(v).subtract(w);
    toCenter.copy(corner).subtract(position);
    mag = direction.dot(toCenter);
    minDist = Math.min(mag, minDist);
    maxDist = Math.max(mag, maxDist);
    corner.copy(center).add(u).subtract(v).add(w);
    toCenter.copy(corner).subtract(position);
    mag = direction.dot(toCenter);
    minDist = Math.min(mag, minDist);
    maxDist = Math.max(mag, maxDist);
    corner.copy(center).add(u).subtract(v).subtract(w);
    toCenter.copy(corner).subtract(position);
    mag = direction.dot(toCenter);
    minDist = Math.min(mag, minDist);
    maxDist = Math.max(mag, maxDist);
    center.copy(corner).subtract(u).add(v).add(w);
    toCenter.copy(corner).subtract(position);
    mag = direction.dot(toCenter);
    minDist = Math.min(mag, minDist);
    maxDist = Math.max(mag, maxDist);
    center.copy(corner).subtract(u).add(v).subtract(w);
    toCenter.copy(corner).subtract(position);
    mag = direction.dot(toCenter);
    minDist = Math.min(mag, minDist);
    maxDist = Math.max(mag, maxDist);
    center.copy(corner).subtract(u).subtract(v).add(w);
    toCenter.copy(corner).subtract(position);
    mag = direction.dot(toCenter);
    minDist = Math.min(mag, minDist);
    maxDist = Math.max(mag, maxDist);
    center.copy(corner).subtract(u).subtract(v).subtract(w);
    toCenter.copy(corner).subtract(position);
    mag = direction.dot(toCenter);
    minDist = Math.min(mag, minDist);
    maxDist = Math.max(mag, maxDist);
    result[0] = minDist;
    result[1] = maxDist;
    return result;
  }

  transform(transformation) {
    this.center.transformAsPoint(transformation);
    const xAxis = this.halfAxes.getColumn(0, scratchVectorU);
    xAxis.transformAsPoint(transformation);
    const yAxis = this.halfAxes.getColumn(1, scratchVectorV);
    yAxis.transformAsPoint(transformation);
    const zAxis = this.halfAxes.getColumn(2, scratchVectorW);
    zAxis.transformAsPoint(transformation);
    this.halfAxes = new Matrix3([...xAxis, ...yAxis, ...zAxis]);
    return this;
  }

  getTransform() {
    throw new Error('not implemented');
  }

}

const scratchPosition = new Vector3();
const scratchNormal = new Vector3();
class Plane {
  constructor(normal = [0, 0, 1], distance = 0) {
    this.normal = new Vector3();
    this.distance = -0;
    this.fromNormalDistance(normal, distance);
  }

  fromNormalDistance(normal, distance) {
    assert(Number.isFinite(distance));
    this.normal.from(normal).normalize();
    this.distance = distance;
    return this;
  }

  fromPointNormal(point, normal) {
    point = scratchPosition.from(point);
    this.normal.from(normal).normalize();
    const distance = -this.normal.dot(point);
    this.distance = distance;
    return this;
  }

  fromCoefficients(a, b, c, d) {
    this.normal.set(a, b, c);
    assert(equals$1(this.normal.len(), 1));
    this.distance = d;
    return this;
  }

  clone(plane) {
    return new Plane(this.normal, this.distance);
  }

  equals(right) {
    return equals$1(this.distance, right.distance) && equals$1(this.normal, right.normal);
  }

  getPointDistance(point) {
    return this.normal.dot(point) + this.distance;
  }

  transform(matrix4) {
    const normal = scratchNormal.copy(this.normal).transformAsVector(matrix4).normalize();
    const point = this.normal.scale(-this.distance).transform(matrix4);
    return this.fromPointNormal(point, normal);
  }

  projectPointOntoPlane(point, result = [0, 0, 0]) {
    point = scratchPosition.from(point);
    const pointDistance = this.getPointDistance(point);
    const scaledNormal = scratchNormal.copy(this.normal).scale(pointDistance);
    return point.subtract(scaledNormal).to(result);
  }

}

const faces = [new Vector3([1, 0, 0]), new Vector3([0, 1, 0]), new Vector3([0, 0, 1])];
const scratchPlaneCenter = new Vector3();
const scratchPlaneNormal = new Vector3();
new Plane(new Vector3(1.0, 0.0, 0.0), 0.0);
class CullingVolume {
  static get MASK_OUTSIDE() {
    return 0xffffffff;
  }

  static get MASK_INSIDE() {
    return 0x00000000;
  }

  static get MASK_INDETERMINATE() {
    return 0x7fffffff;
  }

  constructor(planes = []) {
    this.planes = planes;
    assert(this.planes.every(plane => plane instanceof Plane));
  }

  fromBoundingSphere(boundingSphere) {
    this.planes.length = 2 * faces.length;
    const center = boundingSphere.center;
    const radius = boundingSphere.radius;
    let planeIndex = 0;

    for (const faceNormal of faces) {
      let plane0 = this.planes[planeIndex];
      let plane1 = this.planes[planeIndex + 1];

      if (!plane0) {
        plane0 = this.planes[planeIndex] = new Plane();
      }

      if (!plane1) {
        plane1 = this.planes[planeIndex + 1] = new Plane();
      }

      const plane0Center = scratchPlaneCenter.copy(faceNormal).scale(-radius).add(center);
      -faceNormal.dot(plane0Center);
      plane0.fromPointNormal(plane0Center, faceNormal);
      const plane1Center = scratchPlaneCenter.copy(faceNormal).scale(radius).add(center);
      const negatedFaceNormal = scratchPlaneNormal.copy(faceNormal).negate();
      -negatedFaceNormal.dot(plane1Center);
      plane1.fromPointNormal(plane1Center, negatedFaceNormal);
      planeIndex += 2;
    }

    return this;
  }

  computeVisibility(boundingVolume) {
    assert(boundingVolume);
    let intersect = INTERSECTION.INSIDE;

    for (const plane of this.planes) {
      const result = boundingVolume.intersectPlane(plane);

      switch (result) {
        case INTERSECTION.OUTSIDE:
          return INTERSECTION.OUTSIDE;

        case INTERSECTION.INTERSECTING:
          intersect = INTERSECTION.INTERSECTING;
          break;
      }
    }

    return intersect;
  }

  computeVisibilityWithPlaneMask(boundingVolume, parentPlaneMask) {
    assert(boundingVolume, 'boundingVolume is required.');
    assert(Number.isFinite(parentPlaneMask), 'parentPlaneMask is required.');

    if (parentPlaneMask === CullingVolume.MASK_OUTSIDE || parentPlaneMask === CullingVolume.MASK_INSIDE) {
      return parentPlaneMask;
    }

    let mask = CullingVolume.MASK_INSIDE;
    const planes = this.planes;

    for (let k = 0; k < this.planes.length; ++k) {
      const flag = k < 31 ? 1 << k : 0;

      if (k < 31 && (parentPlaneMask & flag) === 0) {
        continue;
      }

      const plane = planes[k];
      const result = boundingVolume.intersectPlane(plane);

      if (result === INTERSECTION.OUTSIDE) {
        return CullingVolume.MASK_OUTSIDE;
      } else if (result === INTERSECTION.INTERSECTING) {
        mask |= flag;
      }
    }

    return mask;
  }

}

new Vector3();
new Vector3();
new Vector3();
new Vector3();
new Vector3();

new Vector3();
new Vector3();
new Vector3();
new Vector3();
new Vector3();
new Vector3();
new Vector3();
new Vector3();
new Vector3();
new Vector3();
new Vector3();
new Vector3();

const scratchMatrix = new Matrix3();
const scratchUnitary = new Matrix3();
const scratchDiagonal = new Matrix3();
const jMatrix = new Matrix3();
const jMatrixTranspose = new Matrix3();
function computeEigenDecomposition(matrix, result = {}) {
  const EIGEN_TOLERANCE = _MathUtils.EPSILON20;
  const EIGEN_MAX_SWEEPS = 10;
  let count = 0;
  let sweep = 0;
  const unitaryMatrix = scratchUnitary;
  const diagonalMatrix = scratchDiagonal;
  unitaryMatrix.identity();
  diagonalMatrix.copy(matrix);
  const epsilon = EIGEN_TOLERANCE * computeFrobeniusNorm(diagonalMatrix);

  while (sweep < EIGEN_MAX_SWEEPS && offDiagonalFrobeniusNorm(diagonalMatrix) > epsilon) {
    shurDecomposition(diagonalMatrix, jMatrix);
    jMatrixTranspose.copy(jMatrix).transpose();
    diagonalMatrix.multiplyRight(jMatrix);
    diagonalMatrix.multiplyLeft(jMatrixTranspose);
    unitaryMatrix.multiplyRight(jMatrix);

    if (++count > 2) {
      ++sweep;
      count = 0;
    }
  }

  result.unitary = unitaryMatrix.toTarget(result.unitary);
  result.diagonal = diagonalMatrix.toTarget(result.diagonal);
  return result;
}

function computeFrobeniusNorm(matrix) {
  let norm = 0.0;

  for (let i = 0; i < 9; ++i) {
    const temp = matrix[i];
    norm += temp * temp;
  }

  return Math.sqrt(norm);
}

const rowVal = [1, 0, 0];
const colVal = [2, 2, 1];

function offDiagonalFrobeniusNorm(matrix) {
  let norm = 0.0;

  for (let i = 0; i < 3; ++i) {
    const temp = matrix[scratchMatrix.getElementIndex(colVal[i], rowVal[i])];
    norm += 2.0 * temp * temp;
  }

  return Math.sqrt(norm);
}

function shurDecomposition(matrix, result) {
  const tolerance = _MathUtils.EPSILON15;
  let maxDiagonal = 0.0;
  let rotAxis = 1;

  for (let i = 0; i < 3; ++i) {
    const temp = Math.abs(matrix[scratchMatrix.getElementIndex(colVal[i], rowVal[i])]);

    if (temp > maxDiagonal) {
      rotAxis = i;
      maxDiagonal = temp;
    }
  }

  const p = rowVal[rotAxis];
  const q = colVal[rotAxis];
  let c = 1.0;
  let s = 0.0;

  if (Math.abs(matrix[scratchMatrix.getElementIndex(q, p)]) > tolerance) {
    const qq = matrix[scratchMatrix.getElementIndex(q, q)];
    const pp = matrix[scratchMatrix.getElementIndex(p, p)];
    const qp = matrix[scratchMatrix.getElementIndex(q, p)];
    const tau = (qq - pp) / 2.0 / qp;
    let t;

    if (tau < 0.0) {
      t = -1.0 / (-tau + Math.sqrt(1.0 + tau * tau));
    } else {
      t = 1.0 / (tau + Math.sqrt(1.0 + tau * tau));
    }

    c = 1.0 / Math.sqrt(1.0 + t * t);
    s = t * c;
  }

  Matrix3.IDENTITY.to(result);
  result[scratchMatrix.getElementIndex(p, p)] = result[scratchMatrix.getElementIndex(q, q)] = c;
  result[scratchMatrix.getElementIndex(q, p)] = s;
  result[scratchMatrix.getElementIndex(p, q)] = -s;
  return result;
}

const scratchVector2 = new Vector3();
const scratchVector3 = new Vector3();
const scratchVector4 = new Vector3();
const scratchVector5 = new Vector3();
const scratchVector6 = new Vector3();
const scratchCovarianceResult = new Matrix3();
const scratchEigenResult = {
  diagonal: new Matrix3(),
  unitary: new Matrix3()
};
function makeOrientedBoundingBoxFromPoints(positions, result = new OrientedBoundingBox()) {
  if (!positions || positions.length === 0) {
    result.halfAxes = new Matrix3([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    result.center = new Vector3();
    return result;
  }

  const length = positions.length;
  const meanPoint = new Vector3(0, 0, 0);

  for (const position of positions) {
    meanPoint.add(position);
  }

  const invLength = 1.0 / length;
  meanPoint.multiplyByScalar(invLength);
  let exx = 0.0;
  let exy = 0.0;
  let exz = 0.0;
  let eyy = 0.0;
  let eyz = 0.0;
  let ezz = 0.0;

  for (const position of positions) {
    const p = scratchVector2.copy(position).subtract(meanPoint);
    exx += p.x * p.x;
    exy += p.x * p.y;
    exz += p.x * p.z;
    eyy += p.y * p.y;
    eyz += p.y * p.z;
    ezz += p.z * p.z;
  }

  exx *= invLength;
  exy *= invLength;
  exz *= invLength;
  eyy *= invLength;
  eyz *= invLength;
  ezz *= invLength;
  const covarianceMatrix = scratchCovarianceResult;
  covarianceMatrix[0] = exx;
  covarianceMatrix[1] = exy;
  covarianceMatrix[2] = exz;
  covarianceMatrix[3] = exy;
  covarianceMatrix[4] = eyy;
  covarianceMatrix[5] = eyz;
  covarianceMatrix[6] = exz;
  covarianceMatrix[7] = eyz;
  covarianceMatrix[8] = ezz;
  const {
    unitary
  } = computeEigenDecomposition(covarianceMatrix, scratchEigenResult);
  const rotation = result.halfAxes.copy(unitary);
  let v1 = rotation.getColumn(0, scratchVector4);
  let v2 = rotation.getColumn(1, scratchVector5);
  let v3 = rotation.getColumn(2, scratchVector6);
  let u1 = -Number.MAX_VALUE;
  let u2 = -Number.MAX_VALUE;
  let u3 = -Number.MAX_VALUE;
  let l1 = Number.MAX_VALUE;
  let l2 = Number.MAX_VALUE;
  let l3 = Number.MAX_VALUE;

  for (const position of positions) {
    scratchVector2.copy(position);
    u1 = Math.max(scratchVector2.dot(v1), u1);
    u2 = Math.max(scratchVector2.dot(v2), u2);
    u3 = Math.max(scratchVector2.dot(v3), u3);
    l1 = Math.min(scratchVector2.dot(v1), l1);
    l2 = Math.min(scratchVector2.dot(v2), l2);
    l3 = Math.min(scratchVector2.dot(v3), l3);
  }

  v1 = v1.multiplyByScalar(0.5 * (l1 + u1));
  v2 = v2.multiplyByScalar(0.5 * (l2 + u2));
  v3 = v3.multiplyByScalar(0.5 * (l3 + u3));
  result.center.copy(v1).add(v2).add(v3);
  const scale = scratchVector3.set(u1 - l1, u2 - l2, u3 - l3).multiplyByScalar(0.5);
  const scaleMatrix = new Matrix3([scale[0], 0, 0, 0, scale[1], 0, 0, 0, scale[2]]);
  result.halfAxes.multiplyRight(scaleMatrix);
  return result;
}

const TILE_SIZE$1 = 512;
const MAX_MAPS = 3;
const REF_POINTS_5 = [[0.5, 0.5], [0, 0], [0, 1], [1, 0], [1, 1]];
const REF_POINTS_9 = REF_POINTS_5.concat([[0, 0.5], [0.5, 0], [1, 0.5], [0.5, 1]]);
const REF_POINTS_11 = REF_POINTS_9.concat([[0.25, 0.5], [0.75, 0.5]]);

class OSMNode {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  get children() {
    if (!this._children) {
      const x = this.x * 2;
      const y = this.y * 2;
      const z = this.z + 1;
      this._children = [new OSMNode(x, y, z), new OSMNode(x, y + 1, z), new OSMNode(x + 1, y, z), new OSMNode(x + 1, y + 1, z)];
    }

    return this._children;
  }

  update(params) {
    const {
      viewport,
      cullingVolume,
      elevationBounds,
      minZ,
      maxZ,
      bounds,
      offset,
      project
    } = params;
    const boundingVolume = this.getBoundingVolume(elevationBounds, offset, project);

    if (bounds && !this.insideBounds(bounds)) {
      return false;
    }

    const isInside = cullingVolume.computeVisibility(boundingVolume);

    if (isInside < 0) {
      return false;
    }

    if (!this.childVisible) {
      let {
        z
      } = this;

      if (z < maxZ && z >= minZ) {
        const distance = boundingVolume.distanceTo(viewport.cameraPosition) * viewport.scale / viewport.height;
        z += Math.floor(Math.log2(distance));
      }

      if (z >= maxZ) {
        this.selected = true;
        return true;
      }
    }

    this.selected = false;
    this.childVisible = true;

    for (const child of this.children) {
      child.update(params);
    }

    return true;
  }

  getSelected() {
    let result = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

    if (this.selected) {
      result.push(this);
    }

    if (this._children) {
      for (const node of this._children) {
        node.getSelected(result);
      }
    }

    return result;
  }

  insideBounds(_ref) {
    let [minX, minY, maxX, maxY] = _ref;
    const scale = Math.pow(2, this.z);
    const extent = TILE_SIZE$1 / scale;
    return this.x * extent < maxX && this.y * extent < maxY && (this.x + 1) * extent > minX && (this.y + 1) * extent > minY;
  }

  getBoundingVolume(zRange, worldOffset, project) {
    if (project) {
      const refPoints = this.z < 1 ? REF_POINTS_11 : this.z < 2 ? REF_POINTS_9 : REF_POINTS_5;
      const refPointPositions = [];

      for (const p of refPoints) {
        const lngLat = osmTile2lngLat(this.x + p[0], this.y + p[1], this.z);
        lngLat[2] = zRange[0];
        refPointPositions.push(project(lngLat));

        if (zRange[0] !== zRange[1]) {
          lngLat[2] = zRange[1];
          refPointPositions.push(project(lngLat));
        }
      }

      return makeOrientedBoundingBoxFromPoints(refPointPositions);
    }

    const scale = Math.pow(2, this.z);
    const extent = TILE_SIZE$1 / scale;
    const originX = this.x * extent + worldOffset * TILE_SIZE$1;
    const originY = TILE_SIZE$1 - (this.y + 1) * extent;
    return new AxisAlignedBoundingBox([originX, originY, zRange[0]], [originX + extent, originY + extent, zRange[1]]);
  }

}

function getOSMTileIndices(viewport, maxZ, zRange, bounds) {
  const project = viewport.resolution ? viewport.projectPosition : null;
  const planes = Object.values(viewport.getFrustumPlanes()).map(_ref2 => {
    let {
      normal,
      distance
    } = _ref2;
    return new Plane(normal.clone().negate(), distance);
  });
  const cullingVolume = new CullingVolume(planes);
  const unitsPerMeter = viewport.distanceScales.unitsPerMeter[2];
  const elevationMin = zRange && zRange[0] * unitsPerMeter || 0;
  const elevationMax = zRange && zRange[1] * unitsPerMeter || 0;
  const minZ = viewport.pitch <= 60 ? maxZ : 0;

  if (bounds) {
    const [minLng, minLat, maxLng, maxLat] = bounds;
    const topLeft = lngLatToWorld([minLng, maxLat]);
    const bottomRight = lngLatToWorld([maxLng, minLat]);
    bounds = [topLeft[0], TILE_SIZE$1 - topLeft[1], bottomRight[0], TILE_SIZE$1 - bottomRight[1]];
  }

  const root = new OSMNode(0, 0, 0);
  const traversalParams = {
    viewport,
    project,
    cullingVolume,
    elevationBounds: [elevationMin, elevationMax],
    minZ,
    maxZ,
    bounds,
    offset: 0
  };
  root.update(traversalParams);

  if (viewport.subViewports && viewport.subViewports.length > 1) {
    traversalParams.offset = -1;

    while (root.update(traversalParams)) {
      if (--traversalParams.offset < -MAX_MAPS) {
        break;
      }
    }

    traversalParams.offset = 1;

    while (root.update(traversalParams)) {
      if (++traversalParams.offset > MAX_MAPS) {
        break;
      }
    }
  }

  return root.getSelected();
}

const TILE_SIZE = 512;
const DEFAULT_EXTENT = [-Infinity, -Infinity, Infinity, Infinity];
const urlType = {
  type: 'url',
  value: null,
  validate: (value, propType) => propType.optional && value === null || typeof value === 'string' || Array.isArray(value) && value.every(url => typeof url === 'string'),
  equals: (value1, value2) => {
    if (value1 === value2) {
      return true;
    }

    if (!Array.isArray(value1) || !Array.isArray(value2)) {
      return false;
    }

    const len = value1.length;

    if (len !== value2.length) {
      return false;
    }

    for (let i = 0; i < len; i++) {
      if (value1[i] !== value2[i]) {
        return false;
      }
    }

    return true;
  }
};

function transformBox(bbox, modelMatrix) {
  const transformedCoords = [modelMatrix.transformPoint([bbox[0], bbox[1]]), modelMatrix.transformPoint([bbox[2], bbox[1]]), modelMatrix.transformPoint([bbox[0], bbox[3]]), modelMatrix.transformPoint([bbox[2], bbox[3]])];
  const transformedBox = [Math.min(...transformedCoords.map(i => i[0])), Math.min(...transformedCoords.map(i => i[1])), Math.max(...transformedCoords.map(i => i[0])), Math.max(...transformedCoords.map(i => i[1]))];
  return transformedBox;
}

function getURLFromTemplate(template, properties) {
  if (!template || !template.length) {
    return null;
  }

  if (Array.isArray(template)) {
    const index = Math.abs(properties.x + properties.y) % template.length;
    template = template[index];
  }

  const {
    x,
    y,
    z
  } = properties;
  return template.replace(/\{x\}/g, x).replace(/\{y\}/g, y).replace(/\{z\}/g, z).replace(/\{-y\}/g, Math.pow(2, z) - y - 1);
}

function getBoundingBox(viewport, zRange, extent) {
  let bounds;

  if (zRange && zRange.length === 2) {
    const [minZ, maxZ] = zRange;
    const bounds0 = viewport.getBounds({
      z: minZ
    });
    const bounds1 = viewport.getBounds({
      z: maxZ
    });
    bounds = [Math.min(bounds0[0], bounds1[0]), Math.min(bounds0[1], bounds1[1]), Math.max(bounds0[2], bounds1[2]), Math.max(bounds0[3], bounds1[3])];
  } else {
    bounds = viewport.getBounds();
  }

  if (!viewport.isGeospatial) {
    return [Math.max(Math.min(bounds[0], extent[2]), extent[0]), Math.max(Math.min(bounds[1], extent[3]), extent[1]), Math.min(Math.max(bounds[2], extent[0]), extent[2]), Math.min(Math.max(bounds[3], extent[1]), extent[3])];
  }

  return [Math.max(bounds[0], extent[0]), Math.max(bounds[1], extent[1]), Math.min(bounds[2], extent[2]), Math.min(bounds[3], extent[3])];
}

function getIndexingCoords(bbox, scale, modelMatrixInverse) {
  if (modelMatrixInverse) {
    const transformedTileIndex = transformBox(bbox, modelMatrixInverse).map(i => i * scale / TILE_SIZE);
    return transformedTileIndex;
  }

  return bbox.map(i => i * scale / TILE_SIZE);
}

function getScale(z, tileSize) {
  return Math.pow(2, z) * TILE_SIZE / tileSize;
}

function osmTile2lngLat(x, y, z) {
  const scale = getScale(z, TILE_SIZE);
  const lng = x / scale * 360 - 180;
  const n = Math.PI - 2 * Math.PI * y / scale;
  const lat = 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return [lng, lat];
}

function tile2XY(x, y, z, tileSize) {
  const scale = getScale(z, tileSize);
  return [x / scale * TILE_SIZE, y / scale * TILE_SIZE];
}

function tileToBoundingBox(viewport, x, y, z) {
  let tileSize = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : TILE_SIZE;

  if (viewport.isGeospatial) {
    const [west, north] = osmTile2lngLat(x, y, z);
    const [east, south] = osmTile2lngLat(x + 1, y + 1, z);
    return {
      west,
      north,
      east,
      south
    };
  }

  const [left, top] = tile2XY(x, y, z, tileSize);
  const [right, bottom] = tile2XY(x + 1, y + 1, z, tileSize);
  return {
    left,
    top,
    right,
    bottom
  };
}

function getIdentityTileIndices(viewport, z, tileSize, extent, modelMatrixInverse) {
  const bbox = getBoundingBox(viewport, null, extent);
  const scale = getScale(z, tileSize);
  const [minX, minY, maxX, maxY] = getIndexingCoords(bbox, scale, modelMatrixInverse);
  const indices = [];

  for (let x = Math.floor(minX); x < maxX; x++) {
    for (let y = Math.floor(minY); y < maxY; y++) {
      indices.push({
        x,
        y,
        z
      });
    }
  }

  return indices;
}

function getTileIndices(_ref) {
  let {
    viewport,
    maxZoom,
    minZoom,
    zRange,
    extent,
    tileSize = TILE_SIZE,
    modelMatrix,
    modelMatrixInverse,
    zoomOffset = 0
  } = _ref;
  let z = viewport.isGeospatial ? Math.round(viewport.zoom + Math.log2(TILE_SIZE / tileSize)) + zoomOffset : Math.ceil(viewport.zoom) + zoomOffset;

  if (Number.isFinite(minZoom) && z < minZoom) {
    if (!extent) {
      return [];
    }

    z = minZoom;
  }

  if (Number.isFinite(maxZoom) && z > maxZoom) {
    z = maxZoom;
  }

  let transformedExtent = extent;

  if (modelMatrix && modelMatrixInverse && extent && !viewport.isGeospatial) {
    transformedExtent = transformBox(extent, modelMatrix);
  }

  return viewport.isGeospatial ? getOSMTileIndices(viewport, z, zRange, extent) : getIdentityTileIndices(viewport, z, tileSize, transformedExtent || DEFAULT_EXTENT, modelMatrixInverse);
}

const TILE_STATE_UNKNOWN = 0;
const TILE_STATE_VISIBLE = 1;
const TILE_STATE_PLACEHOLDER = 3;
const TILE_STATE_HIDDEN = 4;
const TILE_STATE_SELECTED = 5;
const STRATEGY_NEVER = 'never';
const STRATEGY_DEFAULT = 'best-available';
const DEFAULT_CACHE_SCALE = 5;
class Tileset2D {
  constructor(opts) {
    this.opts = opts;

    this.onTileLoad = tile => {
      this.opts.onTileLoad(tile);

      if (this.opts.maxCacheByteSize) {
        this._cacheByteSize += tile.byteLength;

        this._resizeCache();
      }
    };

    this._requestScheduler = new RequestScheduler({
      maxRequests: opts.maxRequests,
      throttleRequests: opts.maxRequests > 0
    });
    this._cache = new Map();
    this._tiles = [];
    this._dirty = false;
    this._cacheByteSize = 0;
    this._viewport = null;
    this._selectedTiles = null;
    this._frameNumber = 0;
    this._modelMatrix = new Matrix4();
    this._modelMatrixInverse = new Matrix4();
    this.setOptions(opts);
  }

  get tiles() {
    return this._tiles;
  }

  get selectedTiles() {
    return this._selectedTiles;
  }

  get isLoaded() {
    return this._selectedTiles.every(tile => tile.isLoaded);
  }

  get needsReload() {
    return this._selectedTiles.some(tile => tile.needsReload);
  }

  setOptions(opts) {
    Object.assign(this.opts, opts);

    if (Number.isFinite(opts.maxZoom)) {
      this._maxZoom = Math.floor(opts.maxZoom);
    }

    if (Number.isFinite(opts.minZoom)) {
      this._minZoom = Math.ceil(opts.minZoom);
    }
  }

  finalize() {
    for (const tile of this._cache.values()) {
      if (tile.isLoading) {
        tile.abort();
      }
    }

    this._cache.clear();

    this._tiles = [];
    this._selectedTiles = null;
  }

  reloadAll() {
    for (const tileId of this._cache.keys()) {
      const tile = this._cache.get(tileId);

      if (!this._selectedTiles.includes(tile)) {
        this._cache.delete(tileId);
      } else {
        tile.setNeedsReload();
      }
    }
  }

  update(viewport) {
    let {
      zRange,
      modelMatrix
    } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    const modelMatrixAsMatrix4 = new Matrix4(modelMatrix);
    const isModelMatrixNew = !modelMatrixAsMatrix4.equals(this._modelMatrix);

    if (!viewport.equals(this._viewport) || isModelMatrixNew) {
      if (isModelMatrixNew) {
        this._modelMatrixInverse = modelMatrixAsMatrix4.clone().invert();
        this._modelMatrix = modelMatrixAsMatrix4;
      }

      this._viewport = viewport;
      const tileIndices = this.getTileIndices({
        viewport,
        maxZoom: this._maxZoom,
        minZoom: this._minZoom,
        zRange,
        modelMatrix: this._modelMatrix,
        modelMatrixInverse: this._modelMatrixInverse
      });
      this._selectedTiles = tileIndices.map(index => this._getTile(index, true));

      if (this._dirty) {
        this._rebuildTree();
      }
    } else if (this.needsReload) {
      this._selectedTiles = this._selectedTiles.map(tile => this._getTile({
        x: tile.x,
        y: tile.y,
        z: tile.z
      }));
    }

    const changed = this.updateTileStates();

    if (this._dirty) {
      this._resizeCache();
    }

    if (changed) {
      this._frameNumber++;
    }

    return this._frameNumber;
  }

  getTileIndices(_ref) {
    let {
      viewport,
      maxZoom,
      minZoom,
      zRange,
      modelMatrix,
      modelMatrixInverse
    } = _ref;
    const {
      tileSize,
      extent,
      zoomOffset
    } = this.opts;
    return getTileIndices({
      viewport,
      maxZoom,
      minZoom,
      zRange,
      tileSize,
      extent,
      modelMatrix,
      modelMatrixInverse,
      zoomOffset
    });
  }

  getTileMetadata(_ref2) {
    let {
      x,
      y,
      z
    } = _ref2;
    const {
      tileSize
    } = this.opts;
    return {
      bbox: tileToBoundingBox(this._viewport, x, y, z, tileSize)
    };
  }

  getParentIndex(tileIndex) {
    tileIndex.x = Math.floor(tileIndex.x / 2);
    tileIndex.y = Math.floor(tileIndex.y / 2);
    tileIndex.z -= 1;
    return tileIndex;
  }

  updateTileStates() {
    this._updateTileStates(this.selectedTiles);

    const {
      maxRequests
    } = this.opts;
    const abortCandidates = [];
    let ongoingRequestCount = 0;
    let changed = false;

    for (const tile of this._cache.values()) {
      const isVisible = Boolean(tile.state & TILE_STATE_VISIBLE);

      if (tile.isVisible !== isVisible) {
        changed = true;
        tile.isVisible = isVisible;
      }

      tile.isSelected = tile.state === TILE_STATE_SELECTED;

      if (tile.isLoading) {
        ongoingRequestCount++;

        if (!tile.isSelected) {
          abortCandidates.push(tile);
        }
      }
    }

    if (maxRequests > 0) {
      while (ongoingRequestCount > maxRequests && abortCandidates.length > 0) {
        const tile = abortCandidates.shift();
        tile.abort();
        ongoingRequestCount--;
      }
    }

    return changed;
  }

  _rebuildTree() {
    const {
      _cache
    } = this;

    for (const tile of _cache.values()) {
      tile.parent = null;
      tile.children.length = 0;
    }

    for (const tile of _cache.values()) {
      const parent = this._getNearestAncestor(tile.x, tile.y, tile.z);

      tile.parent = parent;

      if (parent) {
        parent.children.push(tile);
      }
    }
  }

  _updateTileStates(selectedTiles) {
    const {
      _cache
    } = this;
    const refinementStrategy = this.opts.refinementStrategy || STRATEGY_DEFAULT;

    for (const tile of _cache.values()) {
      tile.state = TILE_STATE_UNKNOWN;
    }

    for (const tile of selectedTiles) {
      tile.state = TILE_STATE_SELECTED;
    }

    if (refinementStrategy === STRATEGY_NEVER) {
      return;
    }

    for (const tile of selectedTiles) {
      getPlaceholderInAncestors(tile, refinementStrategy);
    }

    for (const tile of selectedTiles) {
      if (needsPlaceholder(tile)) {
        getPlaceholderInChildren(tile);
      }
    }
  }

  _resizeCache() {
    const {
      _cache,
      opts
    } = this;
    const maxCacheSize = opts.maxCacheSize || (opts.maxCacheByteSize ? Infinity : DEFAULT_CACHE_SCALE * this.selectedTiles.length);
    const maxCacheByteSize = opts.maxCacheByteSize || Infinity;
    const overflown = _cache.size > maxCacheSize || this._cacheByteSize > maxCacheByteSize;

    if (overflown) {
      for (const [tileId, tile] of _cache) {
        if (!tile.isVisible) {
          this._cacheByteSize -= opts.maxCacheByteSize ? tile.byteLength : 0;

          _cache.delete(tileId);

          this.opts.onTileUnload(tile);
        }

        if (_cache.size <= maxCacheSize && this._cacheByteSize <= maxCacheByteSize) {
          break;
        }
      }

      this._rebuildTree();

      this._dirty = true;
    }

    if (this._dirty) {
      this._tiles = Array.from(this._cache.values()).sort((t1, t2) => t1.z - t2.z);
      this._dirty = false;
    }
  }

  _getTile(_ref3, create) {
    let {
      x,
      y,
      z
    } = _ref3;
    const tileId = "".concat(x, ",").concat(y, ",").concat(z);

    let tile = this._cache.get(tileId);

    let needsReload = false;

    if (!tile && create) {
      tile = new Tile2DHeader({
        x,
        y,
        z
      });
      Object.assign(tile, this.getTileMetadata(tile));
      needsReload = true;

      this._cache.set(tileId, tile);

      this._dirty = true;
    } else if (tile && tile.needsReload) {
      needsReload = true;
    }

    if (needsReload) {
      tile.loadData({
        getData: this.opts.getTileData,
        requestScheduler: this._requestScheduler,
        onLoad: this.onTileLoad,
        onError: this.opts.onTileError
      });
    }

    return tile;
  }

  _getNearestAncestor(x, y, z) {
    const {
      _minZoom = 0
    } = this;
    let index = {
      x,
      y,
      z
    };

    while (index.z > _minZoom) {
      index = this.getParentIndex(index);

      const parent = this._getTile(index);

      if (parent) {
        return parent;
      }
    }

    return null;
  }

}

function needsPlaceholder(tile) {
  let t = tile;

  while (t) {
    if (t.state & TILE_STATE_VISIBLE === 0) {
      return true;
    }

    if (t.isLoaded) {
      return false;
    }

    t = t.parent;
  }

  return true;
}

function getPlaceholderInAncestors(tile, refinementStrategy) {
  let parent;
  let state = TILE_STATE_PLACEHOLDER;

  while (parent = tile.parent) {
    if (tile.isLoaded) {
      state = TILE_STATE_HIDDEN;

      if (refinementStrategy === STRATEGY_DEFAULT) {
        return;
      }
    }

    parent.state = Math.max(parent.state, state);
    tile = parent;
  }
}

function getPlaceholderInChildren(tile) {
  for (const child of tile.children) {
    child.state = Math.max(child.state, TILE_STATE_PLACEHOLDER);

    if (!child.isLoaded) {
      getPlaceholderInChildren(child);
    }
  }
}

const defaultProps = {
  data: [],
  dataComparator: urlType.equals,
  renderSubLayers: {
    type: 'function',
    value: props => new GeoJsonLayer(props),
    compare: false
  },
  getTileData: {
    type: 'function',
    optional: true,
    value: null,
    compare: false
  },
  onViewportLoad: {
    type: 'function',
    optional: true,
    value: null,
    compare: false
  },
  onTileLoad: {
    type: 'function',
    value: tile => {},
    compare: false
  },
  onTileUnload: {
    type: 'function',
    value: tile => {},
    compare: false
  },
  onTileError: {
    type: 'function',
    value: err => console.error(err),
    compare: false
  },
  extent: {
    type: 'array',
    optional: true,
    value: null,
    compare: true
  },
  tileSize: 512,
  maxZoom: null,
  minZoom: 0,
  maxCacheSize: null,
  maxCacheByteSize: null,
  refinementStrategy: STRATEGY_DEFAULT,
  zRange: null,
  maxRequests: 6,
  zoomOffset: 0
};
class TileLayer extends CompositeLayer {
  initializeState() {
    this.state = {
      tileset: null,
      isLoaded: false
    };
  }

  finalizeState() {
    var _this$state$tileset;

    (_this$state$tileset = this.state.tileset) === null || _this$state$tileset === void 0 ? void 0 : _this$state$tileset.finalize();
  }

  get isLoaded() {
    const {
      tileset
    } = this.state;
    return tileset.selectedTiles.every(tile => tile.isLoaded && tile.layers && tile.layers.every(layer => layer.isLoaded));
  }

  shouldUpdateState(_ref) {
    let {
      changeFlags
    } = _ref;
    return changeFlags.somethingChanged;
  }

  updateState(_ref2) {
    let {
      props,
      changeFlags
    } = _ref2;
    let {
      tileset
    } = this.state;
    const propsChanged = changeFlags.propsOrDataChanged || changeFlags.updateTriggersChanged;
    const dataChanged = changeFlags.dataChanged || changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getTileData);

    if (!tileset) {
      tileset = new Tileset2D(this._getTilesetOptions(props));
      this.setState({
        tileset
      });
    } else if (propsChanged) {
      tileset.setOptions(this._getTilesetOptions(props));

      if (dataChanged) {
        tileset.reloadAll();
      } else {
        this.state.tileset.tiles.forEach(tile => {
          tile.layers = null;
        });
      }
    }

    this._updateTileset();
  }

  _getTilesetOptions(props) {
    const {
      tileSize,
      maxCacheSize,
      maxCacheByteSize,
      refinementStrategy,
      extent,
      maxZoom,
      minZoom,
      maxRequests,
      zoomOffset
    } = props;
    return {
      maxCacheSize,
      maxCacheByteSize,
      maxZoom,
      minZoom,
      tileSize,
      refinementStrategy,
      extent,
      maxRequests,
      zoomOffset,
      getTileData: this.getTileData.bind(this),
      onTileLoad: this._onTileLoad.bind(this),
      onTileError: this._onTileError.bind(this),
      onTileUnload: this._onTileUnload.bind(this)
    };
  }

  _updateTileset() {
    const {
      tileset
    } = this.state;
    const {
      zRange,
      modelMatrix
    } = this.props;
    const frameNumber = tileset.update(this.context.viewport, {
      zRange,
      modelMatrix
    });
    const {
      isLoaded
    } = tileset;
    const loadingStateChanged = this.state.isLoaded !== isLoaded;
    const tilesetChanged = this.state.frameNumber !== frameNumber;

    if (isLoaded && (loadingStateChanged || tilesetChanged)) {
      this._onViewportLoad();
    }

    if (tilesetChanged) {
      this.setState({
        frameNumber
      });
    }

    this.state.isLoaded = isLoaded;
  }

  _onViewportLoad() {
    const {
      tileset
    } = this.state;
    const {
      onViewportLoad
    } = this.props;

    if (onViewportLoad) {
      onViewportLoad(tileset.selectedTiles);
    }
  }

  _onTileLoad(tile) {
    this.props.onTileLoad(tile);
    tile.layers = null;

    if (tile.isVisible) {
      this.setNeedsUpdate();
    }
  }

  _onTileError(error, tile) {
    this.props.onTileError(error);
    tile.layers = null;

    if (tile.isVisible) {
      this.setNeedsUpdate();
    }
  }

  _onTileUnload(tile) {
    this.props.onTileUnload(tile);
  }

  getTileData(tile) {
    const {
      data,
      getTileData,
      fetch
    } = this.props;
    const {
      signal
    } = tile;
    tile.url = getURLFromTemplate(data, tile);

    if (getTileData) {
      return getTileData(tile);
    }

    if (tile.url) {
      return fetch(tile.url, {
        propName: 'data',
        layer: this,
        signal
      });
    }

    return null;
  }

  renderSubLayers(props) {
    return this.props.renderSubLayers(props);
  }

  getSubLayerPropsByTile(tile) {
    return null;
  }

  getPickingInfo(_ref3) {
    let {
      info,
      sourceLayer
    } = _ref3;
    info.tile = sourceLayer.props.tile;
    return info;
  }

  _updateAutoHighlight(info) {
    if (info.sourceLayer) {
      info.sourceLayer.updateAutoHighlight(info);
    }
  }

  renderLayers() {
    return this.state.tileset.tiles.map(tile => {
      const subLayerProps = this.getSubLayerPropsByTile(tile);

      if (!tile.isLoaded && !tile.content) ; else if (!tile.layers) {
        const layers = this.renderSubLayers({ ...this.props,
          id: "".concat(this.id, "-").concat(tile.x, "-").concat(tile.y, "-").concat(tile.z),
          data: tile.content,
          _offset: 0,
          tile
        });
        tile.layers = flatten(layers, Boolean).map(layer => layer.clone({
          tile,
          ...subLayerProps
        }));
      } else if (subLayerProps && tile.layers[0] && Object.keys(subLayerProps).some(propName => tile.layers[0].props[propName] !== subLayerProps[propName])) {
        tile.layers = tile.layers.map(layer => layer.clone(subLayerProps));
      }

      return tile.layers;
    });
  }

  filterSubLayer(_ref4) {
    let {
      layer
    } = _ref4;
    return layer.props.tile.isVisible;
  }

}
TileLayer.layerName = 'TileLayer';
TileLayer.defaultProps = defaultProps;

export { TileLayer };
