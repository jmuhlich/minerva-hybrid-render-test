import { l as lerp, J as COORDINATE_SYSTEM, N as lngLatToWorld } from '../common/transition-e4288157.js';
import { L as Layer, M as Model } from '../common/layer-edaf1562.js';
import { p as project32, a as picking, G as Geometry } from '../common/picking-e2bc8da0.js';
import '../common/log-2130d917.js';
import '../common/process-2545f00a.js';
import '../common/load-4b03c340.js';
import '../common/globals-76d38a77.js';

const DEFAULT_INDICES = new Uint16Array([0, 2, 1, 0, 3, 2]);
const DEFAULT_TEX_COORDS = new Float32Array([0, 1, 0, 0, 1, 0, 1, 1]);
function createMesh(bounds, resolution) {
  if (!resolution) {
    return createQuad(bounds);
  }

  const maxXSpan = Math.max(Math.abs(bounds[0][0] - bounds[3][0]), Math.abs(bounds[1][0] - bounds[2][0]));
  const maxYSpan = Math.max(Math.abs(bounds[1][1] - bounds[0][1]), Math.abs(bounds[2][1] - bounds[3][1]));
  const uCount = Math.ceil(maxXSpan / resolution) + 1;
  const vCount = Math.ceil(maxYSpan / resolution) + 1;
  const vertexCount = (uCount - 1) * (vCount - 1) * 6;
  const indices = new Uint32Array(vertexCount);
  const texCoords = new Float32Array(uCount * vCount * 2);
  const positions = new Float64Array(uCount * vCount * 3);
  let vertex = 0;
  let index = 0;

  for (let u = 0; u < uCount; u++) {
    const ut = u / (uCount - 1);

    for (let v = 0; v < vCount; v++) {
      const vt = v / (vCount - 1);
      const p = interpolateQuad(bounds, ut, vt);
      positions[vertex * 3 + 0] = p[0];
      positions[vertex * 3 + 1] = p[1];
      positions[vertex * 3 + 2] = p[2] || 0;
      texCoords[vertex * 2 + 0] = ut;
      texCoords[vertex * 2 + 1] = 1 - vt;

      if (u > 0 && v > 0) {
        indices[index++] = vertex - vCount;
        indices[index++] = vertex - vCount - 1;
        indices[index++] = vertex - 1;
        indices[index++] = vertex - vCount;
        indices[index++] = vertex - 1;
        indices[index++] = vertex;
      }

      vertex++;
    }
  }

  return {
    vertexCount,
    positions,
    indices,
    texCoords
  };
}

function createQuad(bounds) {
  const positions = new Float64Array(12);

  for (let i = 0; i < bounds.length; i++) {
    positions[i * 3 + 0] = bounds[i][0];
    positions[i * 3 + 1] = bounds[i][1];
    positions[i * 3 + 2] = bounds[i][2] || 0;
  }

  return {
    vertexCount: 6,
    positions,
    indices: DEFAULT_INDICES,
    texCoords: DEFAULT_TEX_COORDS
  };
}

function interpolateQuad(quad, ut, vt) {
  return lerp(lerp(quad[0], quad[1], vt), lerp(quad[3], quad[2], vt), ut);
}

var vs = "\n#define SHADER_NAME bitmap-layer-vertex-shader\n\nattribute vec2 texCoords;\nattribute vec3 positions;\nattribute vec3 positions64Low;\n\nvarying vec2 vTexCoord;\nvarying vec2 vTexPos;\n\nuniform float coordinateConversion;\n\nconst vec3 pickingColor = vec3(1.0, 0.0, 0.0);\n\nvoid main(void) {\n  geometry.worldPosition = positions;\n  geometry.uv = texCoords;\n  geometry.pickingColor = pickingColor;\n\n  gl_Position = project_position_to_clipspace(positions, positions64Low, vec3(0.0), geometry.position);\n  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);\n\n  vTexCoord = texCoords;\n\n  if (coordinateConversion < -0.5) {\n    vTexPos = geometry.position.xy;\n  } else if (coordinateConversion > 0.5) {\n    vTexPos = geometry.worldPosition.xy;\n  }\n\n  vec4 color = vec4(0.0);\n  DECKGL_FILTER_COLOR(color, geometry);\n}\n";

const packUVsIntoRGB = "\nvec3 packUVsIntoRGB(vec2 uv) {\n  // Extract the top 8 bits. We want values to be truncated down so we can add a fraction\n  vec2 uv8bit = floor(uv * 256.);\n\n  // Calculate the normalized remainders of u and v parts that do not fit into 8 bits\n  // Scale and clamp to 0-1 range\n  vec2 uvFraction = fract(uv * 256.);\n  vec2 uvFraction4bit = floor(uvFraction * 16.);\n\n  // Remainder can be encoded in blue channel, encode as 4 bits for pixel coordinates\n  float fractions = uvFraction4bit.x + uvFraction4bit.y * 16.;\n\n  return vec3(uv8bit, fractions) / 255.;\n}\n";
var fs = "\n#define SHADER_NAME bitmap-layer-fragment-shader\n\n#ifdef GL_ES\nprecision highp float;\n#endif\n\nuniform sampler2D bitmapTexture;\n\nvarying vec2 vTexCoord;\nvarying vec2 vTexPos;\n\nuniform float desaturate;\nuniform vec4 transparentColor;\nuniform vec3 tintColor;\nuniform float opacity;\n\nuniform float coordinateConversion;\nuniform vec4 bounds;\n\n/* projection utils */\nconst float TILE_SIZE = 512.0;\nconst float PI = 3.1415926536;\nconst float WORLD_SCALE = TILE_SIZE / PI / 2.0;\n\n// from degrees to Web Mercator\nvec2 lnglat_to_mercator(vec2 lnglat) {\n  float x = lnglat.x;\n  float y = clamp(lnglat.y, -89.9, 89.9);\n  return vec2(\n    radians(x) + PI,\n    PI + log(tan(PI * 0.25 + radians(y) * 0.5))\n  ) * WORLD_SCALE;\n}\n\n// from Web Mercator to degrees\nvec2 mercator_to_lnglat(vec2 xy) {\n  xy /= WORLD_SCALE;\n  return degrees(vec2(\n    xy.x - PI,\n    atan(exp(xy.y - PI)) * 2.0 - PI * 0.5\n  ));\n}\n/* End projection utils */\n\n// apply desaturation\nvec3 color_desaturate(vec3 color) {\n  float luminance = (color.r + color.g + color.b) * 0.333333333;\n  return mix(color, vec3(luminance), desaturate);\n}\n\n// apply tint\nvec3 color_tint(vec3 color) {\n  return color * tintColor;\n}\n\n// blend with background color\nvec4 apply_opacity(vec3 color, float alpha) {\n  return mix(transparentColor, vec4(color, 1.0), alpha);\n}\n\nvec2 getUV(vec2 pos) {\n  return vec2(\n    (pos.x - bounds[0]) / (bounds[2] - bounds[0]),\n    (pos.y - bounds[3]) / (bounds[1] - bounds[3])\n  );\n}\n\n".concat(packUVsIntoRGB, "\n\nvoid main(void) {\n  vec2 uv = vTexCoord;\n  if (coordinateConversion < -0.5) {\n    vec2 lnglat = mercator_to_lnglat(vTexPos);\n    uv = getUV(lnglat);\n  } else if (coordinateConversion > 0.5) {\n    vec2 commonPos = lnglat_to_mercator(vTexPos);\n    uv = getUV(commonPos);\n  }\n  vec4 bitmapColor = texture2D(bitmapTexture, uv);\n\n  gl_FragColor = apply_opacity(color_tint(color_desaturate(bitmapColor.rgb)), bitmapColor.a * opacity);\n\n  geometry.uv = uv;\n  DECKGL_FILTER_COLOR(gl_FragColor, geometry);\n\n  if (picking_uActive) {\n    // Since instance information is not used, we can use picking color for pixel index\n    gl_FragColor.rgb = packUVsIntoRGB(uv);\n  }\n}\n");

const defaultProps = {
  image: {
    type: 'image',
    value: null,
    async: true
  },
  bounds: {
    type: 'array',
    value: [1, 0, 0, 1],
    compare: true
  },
  _imageCoordinateSystem: COORDINATE_SYSTEM.DEFAULT,
  desaturate: {
    type: 'number',
    min: 0,
    max: 1,
    value: 0
  },
  transparentColor: {
    type: 'color',
    value: [0, 0, 0, 0]
  },
  tintColor: {
    type: 'color',
    value: [255, 255, 255]
  }
};
class BitmapLayer extends Layer {
  getShaders() {
    return super.getShaders({
      vs,
      fs,
      modules: [project32, picking]
    });
  }

  initializeState() {
    const attributeManager = this.getAttributeManager();
    attributeManager.remove(['instancePickingColors']);
    const noAlloc = true;
    attributeManager.add({
      indices: {
        size: 1,
        isIndexed: true,
        update: attribute => attribute.value = this.state.mesh.indices,
        noAlloc
      },
      positions: {
        size: 3,
        type: 5130,
        fp64: this.use64bitPositions(),
        update: attribute => attribute.value = this.state.mesh.positions,
        noAlloc
      },
      texCoords: {
        size: 2,
        update: attribute => attribute.value = this.state.mesh.texCoords,
        noAlloc
      }
    });
  }

  updateState(_ref) {
    let {
      props,
      oldProps,
      changeFlags
    } = _ref;

    if (changeFlags.extensionsChanged) {
      var _this$state$model;

      const {
        gl
      } = this.context;
      (_this$state$model = this.state.model) === null || _this$state$model === void 0 ? void 0 : _this$state$model.delete();
      this.state.model = this._getModel(gl);
      this.getAttributeManager().invalidateAll();
    }

    const attributeManager = this.getAttributeManager();

    if (props.bounds !== oldProps.bounds) {
      const oldMesh = this.state.mesh;

      const mesh = this._createMesh();

      this.state.model.setVertexCount(mesh.vertexCount);

      for (const key in mesh) {
        if (oldMesh && oldMesh[key] !== mesh[key]) {
          attributeManager.invalidate(key);
        }
      }

      this.setState({
        mesh,
        ...this._getCoordinateUniforms()
      });
    } else if (props._imageCoordinateSystem !== oldProps._imageCoordinateSystem) {
      this.setState(this._getCoordinateUniforms());
    }
  }

  getPickingInfo(_ref2) {
    let {
      info
    } = _ref2;
    const {
      image
    } = this.props;

    if (!info.color || !image) {
      info.bitmap = null;
      return info;
    }

    const {
      width,
      height
    } = image;
    info.index = 0;
    const uv = unpackUVsFromRGB(info.color);
    const pixel = [Math.floor(uv[0] * width), Math.floor(uv[1] * height)];
    info.bitmap = {
      size: {
        width,
        height
      },
      uv,
      pixel
    };
    return info;
  }

  disablePickingIndex() {
    this.setState({
      disablePicking: true
    });
  }

  restorePickingColors() {
    this.setState({
      disablePicking: false
    });
  }

  _updateAutoHighlight(info) {
    super._updateAutoHighlight({ ...info,
      color: this.encodePickingColor(0)
    });
  }

  _createMesh() {
    const {
      bounds
    } = this.props;
    let normalizedBounds = bounds;

    if (Number.isFinite(bounds[0])) {
      normalizedBounds = [[bounds[0], bounds[1]], [bounds[0], bounds[3]], [bounds[2], bounds[3]], [bounds[2], bounds[1]]];
    }

    return createMesh(normalizedBounds, this.context.viewport.resolution);
  }

  _getModel(gl) {
    if (!gl) {
      return null;
    }

    return new Model(gl, { ...this.getShaders(),
      id: this.props.id,
      geometry: new Geometry({
        drawMode: 4,
        vertexCount: 6
      }),
      isInstanced: false
    });
  }

  draw(opts) {
    const {
      uniforms,
      moduleParameters
    } = opts;
    const {
      model,
      coordinateConversion,
      bounds,
      disablePicking
    } = this.state;
    const {
      image,
      desaturate,
      transparentColor,
      tintColor
    } = this.props;

    if (moduleParameters.pickingActive && disablePicking) {
      return;
    }

    if (image && model) {
      model.setUniforms(uniforms).setUniforms({
        bitmapTexture: image,
        desaturate,
        transparentColor: transparentColor.map(x => x / 255),
        tintColor: tintColor.slice(0, 3).map(x => x / 255),
        coordinateConversion,
        bounds
      }).draw();
    }
  }

  _getCoordinateUniforms() {
    const {
      LNGLAT,
      CARTESIAN,
      DEFAULT
    } = COORDINATE_SYSTEM;
    let {
      _imageCoordinateSystem: imageCoordinateSystem
    } = this.props;

    if (imageCoordinateSystem !== DEFAULT) {
      const {
        bounds
      } = this.props;

      if (!Number.isFinite(bounds[0])) {
        throw new Error('_imageCoordinateSystem only supports rectangular bounds');
      }

      const defaultImageCoordinateSystem = this.context.viewport.resolution ? LNGLAT : CARTESIAN;
      imageCoordinateSystem = imageCoordinateSystem === LNGLAT ? LNGLAT : CARTESIAN;

      if (imageCoordinateSystem === LNGLAT && defaultImageCoordinateSystem === CARTESIAN) {
        return {
          coordinateConversion: -1,
          bounds
        };
      }

      if (imageCoordinateSystem === CARTESIAN && defaultImageCoordinateSystem === LNGLAT) {
        const bottomLeft = lngLatToWorld([bounds[0], bounds[1]]);
        const topRight = lngLatToWorld([bounds[2], bounds[3]]);
        return {
          coordinateConversion: 1,
          bounds: [bottomLeft[0], bottomLeft[1], topRight[0], topRight[1]]
        };
      }
    }

    return {
      coordinateConversion: 0,
      bounds: [0, 0, 0, 0]
    };
  }

}
BitmapLayer.layerName = 'BitmapLayer';
BitmapLayer.defaultProps = defaultProps;

function unpackUVsFromRGB(color) {
  const [u, v, fracUV] = color;
  const vFrac = (fracUV & 0xf0) / 256;
  const uFrac = (fracUV & 0x0f) / 16;
  return [(u + uFrac) / 256, (v + vFrac) / 256];
}

export { BitmapLayer };
