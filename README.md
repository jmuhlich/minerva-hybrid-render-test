# Hybrid image rendering test

Proof of concept for hybrid offline/online image rendering. Raw data is scaled and compressed to
grayscale JPEG pyramids offline. The resulting files are stored in the `data` directory.  These
tiles are then consumed by the client code where they are colored and composited.

Thanks to Trevor Manz for providing a scaffold to get me stared with deck.gl and its TileLayer:
https://gist.github.com/manzt/988b8938db0e4ff9d60e80796b091c18

This repo was boootstrapped with [`snowpack`](https://www.snowpack.dev/). 

## Development

Install the required dependencies and start a development server. Once the development server has
started, you can edit the source files and the changes should be reflected in your browser.

```bash
npm install
npm start # starts a development server on localhost:8080
```

## Notes

This is hard-coded around a single demo tonsil dataset. My lack of experience with React shows in
the poor organization of the components and state, but it was good enough for this proof of concept.

The additive (`GL.FUNC_ADD`) blending introduces artifacts as the TileLayer loads in new sublayers
on zoom. The four new higher-resolution tiles underlying a given old tile are rendered as soon as
they each load, and the old tile isn't removed until the new tiles are fully loaded. With additive
blending this doubles the brightness where the new tiles are loading. We could block the new tiles
from showing until all four in a group are available, or perhaps there is a way to leverage depth
testing to fix the rendering.

The disabled channels have their TileLayer marked as `visible: false`. This unfortunately still
triggers fetching of new image tiles on pan and zoom. We need to rework it so only the visible
channels are fetched.

Brightness and contrast could be made adjustable in the UI even though the available dynamic range
of the image data is fixed.
