import { u as uid, e as assert, p as project } from './layer-edaf1562.js';

const DEFAULT_HIGHLIGHT_COLOR = new Uint8Array([0, 255, 255, 255]);
const DEFAULT_MODULE_OPTIONS = {
  pickingSelectedColor: null,
  pickingHighlightColor: DEFAULT_HIGHLIGHT_COLOR,
  pickingActive: false,
  pickingAttribute: false
};

function getUniforms(opts = DEFAULT_MODULE_OPTIONS) {
  const uniforms = {};

  if (opts.pickingSelectedColor !== undefined) {
    if (!opts.pickingSelectedColor) {
      uniforms.picking_uSelectedColorValid = 0;
    } else {
      const selectedColor = opts.pickingSelectedColor.slice(0, 3);
      uniforms.picking_uSelectedColorValid = 1;
      uniforms.picking_uSelectedColor = selectedColor;
    }
  }

  if (opts.pickingHighlightColor) {
    const color = Array.from(opts.pickingHighlightColor, x => x / 255);

    if (!Number.isFinite(color[3])) {
      color[3] = 1;
    }

    uniforms.picking_uHighlightColor = color;
  }

  if (opts.pickingActive !== undefined) {
    uniforms.picking_uActive = Boolean(opts.pickingActive);
    uniforms.picking_uAttribute = Boolean(opts.pickingAttribute);
  }

  return uniforms;
}

const vs$1 = `\
uniform bool picking_uActive;
uniform bool picking_uAttribute;
uniform vec3 picking_uSelectedColor;
uniform bool picking_uSelectedColorValid;

out vec4 picking_vRGBcolor_Avalid;

const float COLOR_SCALE = 1. / 255.;

bool picking_isColorValid(vec3 color) {
  return dot(color, vec3(1.0)) > 0.001;
}

bool isVertexPicked(vec3 vertexColor) {
  return
    picking_uSelectedColorValid &&
    !picking_isColorValid(abs(vertexColor - picking_uSelectedColor));
}

void picking_setPickingColor(vec3 pickingColor) {
  if (picking_uActive) {
    picking_vRGBcolor_Avalid.a = float(picking_isColorValid(pickingColor));

    if (!picking_uAttribute) {
      picking_vRGBcolor_Avalid.rgb = pickingColor * COLOR_SCALE;
    }
  } else {
    picking_vRGBcolor_Avalid.a = float(isVertexPicked(pickingColor));
  }
}

void picking_setPickingAttribute(float value) {
  if (picking_uAttribute) {
    picking_vRGBcolor_Avalid.r = value;
  }
}
void picking_setPickingAttribute(vec2 value) {
  if (picking_uAttribute) {
    picking_vRGBcolor_Avalid.rg = value;
  }
}
void picking_setPickingAttribute(vec3 value) {
  if (picking_uAttribute) {
    picking_vRGBcolor_Avalid.rgb = value;
  }
}
`;
const fs = `\
uniform bool picking_uActive;
uniform vec3 picking_uSelectedColor;
uniform vec4 picking_uHighlightColor;

in vec4 picking_vRGBcolor_Avalid;
vec4 picking_filterHighlightColor(vec4 color) {
  if (picking_uActive) {
    return color;
  }
  bool selected = bool(picking_vRGBcolor_Avalid.a);

  if (selected) {
    float highLightAlpha = picking_uHighlightColor.a;
    float blendedAlpha = highLightAlpha + color.a * (1.0 - highLightAlpha);
    float highLightRatio = highLightAlpha / blendedAlpha;

    vec3 blendedRGB = mix(color.rgb, picking_uHighlightColor.rgb, highLightRatio);
    return vec4(blendedRGB, blendedAlpha);
  } else {
    return color;
  }
}
vec4 picking_filterPickingColor(vec4 color) {
  if (picking_uActive) {
    if (picking_vRGBcolor_Avalid.a == 0.0) {
      discard;
    }
    return picking_vRGBcolor_Avalid;
  }
  return color;
}
vec4 picking_filterColor(vec4 color) {
  vec4 highightColor = picking_filterHighlightColor(color);
  return picking_filterPickingColor(highightColor);
}

`;
const picking$1 = {
  name: 'picking',
  vs: vs$1,
  fs,
  getUniforms
};

const DRAW_MODE = {
  POINTS: 0x0000,
  LINES: 0x0001,
  LINE_LOOP: 0x0002,
  LINE_STRIP: 0x0003,
  TRIANGLES: 0x0004,
  TRIANGLE_STRIP: 0x0005,
  TRIANGLE_FAN: 0x0006
};
class Geometry {
  static get DRAW_MODE() {
    return DRAW_MODE;
  }

  constructor(props = {}) {
    const {
      id = uid('geometry'),
      drawMode = DRAW_MODE.TRIANGLES,
      attributes = {},
      indices = null,
      vertexCount = null
    } = props;
    this.id = id;
    this.drawMode = drawMode | 0;
    this.attributes = {};
    this.userData = {};

    this._setAttributes(attributes, indices);

    this.vertexCount = vertexCount || this._calculateVertexCount(this.attributes, this.indices);
  }

  get mode() {
    return this.drawMode;
  }

  getVertexCount() {
    return this.vertexCount;
  }

  getAttributes() {
    return this.indices ? {
      indices: this.indices,
      ...this.attributes
    } : this.attributes;
  }

  _print(attributeName) {
    return `Geometry ${this.id} attribute ${attributeName}`;
  }

  _setAttributes(attributes, indices) {
    if (indices) {
      this.indices = ArrayBuffer.isView(indices) ? {
        value: indices,
        size: 1
      } : indices;
    }

    for (const attributeName in attributes) {
      let attribute = attributes[attributeName];
      attribute = ArrayBuffer.isView(attribute) ? {
        value: attribute
      } : attribute;
      assert(ArrayBuffer.isView(attribute.value), `${this._print(attributeName)}: must be typed array or object with value as typed array`);

      if ((attributeName === 'POSITION' || attributeName === 'positions') && !attribute.size) {
        attribute.size = 3;
      }

      if (attributeName === 'indices') {
        assert(!this.indices);
        this.indices = attribute;
      } else {
        this.attributes[attributeName] = attribute;
      }
    }

    if (this.indices && this.indices.isIndexed !== undefined) {
      this.indices = Object.assign({}, this.indices);
      delete this.indices.isIndexed;
    }

    return this;
  }

  _calculateVertexCount(attributes, indices) {
    if (indices) {
      return indices.value.length;
    }

    let vertexCount = Infinity;

    for (const attributeName in attributes) {
      const attribute = attributes[attributeName];
      const {
        value,
        size,
        constant
      } = attribute;

      if (!constant && value && size >= 1) {
        vertexCount = Math.min(vertexCount, value.length / size);
      }
    }

    assert(Number.isFinite(vertexCount));
    return vertexCount;
  }

}

const vs = "\nvec4 project_position_to_clipspace(\n  vec3 position, vec3 position64Low, vec3 offset, out vec4 commonPosition\n) {\n  vec3 projectedPosition = project_position(position, position64Low);\n  if (project_uProjectionMode == PROJECTION_MODE_GLOBE) {\n    // offset is specified as ENU\n    // when in globe projection, rotate offset so that the ground alighs with the surface of the globe\n    mat3 rotation = project_get_orientation_matrix(projectedPosition);\n    offset = rotation * offset;\n  }\n  commonPosition = vec4(projectedPosition + offset, 1.0);\n  return project_common_position_to_clipspace(commonPosition);\n}\n\nvec4 project_position_to_clipspace(\n  vec3 position, vec3 position64Low, vec3 offset\n) {\n  vec4 commonPosition;\n  return project_position_to_clipspace(position, position64Low, offset, commonPosition);\n}\n";
var project32 = {
  name: 'project32',
  dependencies: [project],
  vs
};

var picking = {
  inject: {
    'vs:DECKGL_FILTER_GL_POSITION': "\n    // for picking depth values\n    picking_setPickingAttribute(position.z / position.w);\n  ",
    'vs:DECKGL_FILTER_COLOR': "\n  picking_setPickingColor(geometry.pickingColor);\n  ",
    'fs:DECKGL_FILTER_COLOR': {
      order: 99,
      injection: "\n  // use highlight color if this fragment belongs to the selected object.\n  color = picking_filterHighlightColor(color);\n\n  // use picking color if rendering to picking FBO.\n  color = picking_filterPickingColor(color);\n    "
    }
  },
  ...picking$1
};

export { Geometry as G, picking as a, project32 as p };
