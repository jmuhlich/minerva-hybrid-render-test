import { OrthographicView } from '@deck.gl/core';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
import { load } from '@loaders.gl/core';
import { ImageLoader } from '@loaders.gl/images';
import GL from '@luma.gl/constants';
import Deck from 'deck.gl';
import React, { useState } from 'react';
import { HsvColorPicker } from 'react-colorful';

import './styles.css';

function createTileLayer(meta, subpath, color, visible) {
  return new TileLayer({
    id: subpath,
    visible: visible,
    tileSize: meta.tileSize,
    minZoom: -meta.maxLevel,
    maxZoom: 0,
    extent: [0, 0, meta.width, meta.height],
    color: color,
    getTileData: ({ x, y, z }) => {
      if (x < 0 || y < 0) return null;
      return load(`${meta.path}/${subpath}/${-z}_${x}_${y}.jpg`, ImageLoader);
    },
    renderSubLayers: (props) => {
      const { left, bottom, right, top } = props.tile.bbox;
      const { x, y, z } = props.tile;
      const color = props.color;
      return new BitmapLayer({
        id: `${subpath}-${z}-${x}-${y}`,
        image: props.data,
        bounds: [left, Math.min(bottom, meta.height), Math.min(right, meta.width), top],
        parameters: {
          depthTest: false,
          blend: true,
          blendFunc: [GL.CONSTANT_COLOR, GL.ONE, GL.ONE, GL.ONE],
          blendColor: color,
          blendEquation: GL.FUNC_ADD,
        },
      });
    },
  });
}

function ChannelControl(props) {
  const { name, color, setColor, visible, toggleVisible } = props;
  return (
    <>
      <div
        className={'channel-label ' + (visible ? 'enabled' : '')}
        onClick={toggleVisible}
      >
        {name}
      </div>
      <HsvColorPicker color={color} onChange={setColor} />
    </>
  );
}

const imageSource = {
  width: 3500,
  height: 2500,
  tileSize: 1024,
  maxLevel: 2,
  path: 'data/tonsil',
};

function channelLayer(subpath, color, visible) {
  return createTileLayer(imageSource, subpath, color, visible);
}

function hsv2gl ({ h, s, v }) {
  h = (h / 360) * 6;
  s = s / 100;
  v = v / 100;
  const hh = Math.floor(h),
        b = v * (1 - s),
        c = v * (1 - (h - hh) * s),
        d = v * (1 - (1 - h + hh) * s),
        module = hh % 6;
  return [
    [v, c, b, b, d, v][module],
    [d, v, v, c, b, b][module],
    [b, b, d, v, v, c][module],
    1,
  ];
};

function hue2hsv(h) {
  return { h: h, s: 100, v: 100};
}

function App() {
  const [viewState, setViewState] = useState({ zoom: -2, target: [imageSource.width / 2, imageSource.height / 2, 0]});
  const [color1, setColor1] = useState(hue2hsv(240));
  const [color2, setColor2] = useState(hue2hsv(0));
  const [color3, setColor3] = useState(hue2hsv(40));
  const [color4, setColor4] = useState(hue2hsv(80));
  const [color5, setColor5] = useState(hue2hsv(120));
  const [color6, setColor6] = useState(hue2hsv(160));
  const [color7, setColor7] = useState(hue2hsv(200));
  const [color8, setColor8] = useState(hue2hsv(280));
  const [color9, setColor9] = useState(hue2hsv(320));
  const [visible, setVisible] = useState([true, true, true, false, false, true, false, true, false]);
  const toggleVisibleI = (i) => () => {
    const newVisible = [...visible];
    newVisible[i] = !newVisible[i];
    setVisible(newVisible);
  };
  return (
    <>
      <Deck
        layers={[
          channelLayer('DNA_0__DNA', hsv2gl(color1), visible[0]),
          channelLayer('Ki-67_1__Ki-67', hsv2gl(color2), visible[1]),
          channelLayer('Keratin_2__Keratin', hsv2gl(color3), visible[2]),
          channelLayer('CD3D_3__CD3D', hsv2gl(color4), visible[3]),
          channelLayer('CD4_4__CD4', hsv2gl(color5), visible[4]),
          channelLayer('CD45_5__CD45', hsv2gl(color6), visible[5]),
          channelLayer('CD8A_6__CD8A', hsv2gl(color7), visible[6]),
          channelLayer('-SMA_7__-SMA', hsv2gl(color8), visible[7]),
          channelLayer('CD20_8__CD20', hsv2gl(color9), visible[8]),
        ]}
        views={[new OrthographicView({ id: 'ortho', controller: true })]}
        viewState={viewState}
        onViewStateChange={e => setViewState(e.viewState)}
        controller={true}
      />
      <div className='channel-list'>
        <ChannelControl name='DNA' color={color1} setColor={setColor1} visible={visible[0]} toggleVisible={toggleVisibleI(0)} />
        <ChannelControl name='Ki-67' color={color2} setColor={setColor2} visible={visible[1]} toggleVisible={toggleVisibleI(1)} />
        <ChannelControl name='Keratin' color={color3} setColor={setColor3} visible={visible[2]} toggleVisible={toggleVisibleI(2)} />
        <ChannelControl name='CD3D' color={color4} setColor={setColor4} visible={visible[3]} toggleVisible={toggleVisibleI(3)} />
        <ChannelControl name='CD4' color={color5} setColor={setColor5} visible={visible[4]} toggleVisible={toggleVisibleI(4)} />
        <ChannelControl name='CD45' color={color6} setColor={setColor6} visible={visible[5]} toggleVisible={toggleVisibleI(5)} />
        <ChannelControl name='CD8A' color={color7} setColor={setColor7} visible={visible[6]} toggleVisible={toggleVisibleI(6)} />
        <ChannelControl name='&alpha;SMA' color={color8} setColor={setColor8} visible={visible[7]} toggleVisible={toggleVisibleI(7)} />
        <ChannelControl name='CD20' color={color9} setColor={setColor9} visible={visible[8]} toggleVisible={toggleVisibleI(8)} />
    </div>
    </>
  );
}

export default App;
