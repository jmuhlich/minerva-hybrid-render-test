// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = ".channel-list .react-colorful {\n  height: 14px;\n}\n\n.channel-list .react-colorful__saturation,\n.channel-list .react-colorful__alpha {\n  display:none;\n  height: 0;\n  width: 0;\n}\n\n.channel-list .react-colorful__hue {\n  height: 14px;\n  border-radius: 2px;\n}\n\n.channel-list .react-colorful__hue-pointer {\n  width: 20px;\n  height: 20px;\n}\n\n.channel-list {\n  display: grid;\n  grid-auto-rows: 20px;\n  grid-template-columns: 75px min-content;\n  column-gap: 10px;\n  align-items: center;\n  background: rgba(0, 0, 0, 0.5);\n  position: relative;\n  width: min-content;\n  padding: 0.5em;\n}\n\n.channel-label {\n  font-family: sans-serif;\n  color: #cccccc;\n  vertical-align: middle;\n  cursor: pointer;\n}\n\n.channel-label.enabled {\n  color: #ffffff;\n  font-weight: bold;\n}\n";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}