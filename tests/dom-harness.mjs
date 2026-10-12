// A small DOM event harness for component tests, not a layout/browser emulator.
// It supplies only the native DOM operations the component uses. No dependency
// installation, network, or personal data is needed to exercise its event flow.
class TestNode {
  constructor(document, tag) {
    this.ownerDocument = document; this.tagName = tag.toUpperCase(); this.children = []; this.listeners = new Map(); this.attributes = new Map();
    this.checked = false; this.disabled = false; this.hidden = false; this.value = ''; this._text = '';
  }
  set textContent(value) { this._text = String(value); this.replaceChildren(); }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  append(...children) { for (const child of children) { child.parentNode = this; this.children.push(child); } }
  replaceChildren(...children) { for (const child of this.children) child.parentNode = null; this.children = []; this.append(...children); }
  setAttribute(key, value) { this.attributes.set(key, String(value)); }
  addEventListener(type, callback) { const callbacks = this.listeners.get(type) || []; callbacks.push(callback); this.listeners.set(type, callbacks); }
  emit(type) { for (const callback of this.listeners.get(type) || []) callback({ target: this }); }
  focus() { this.ownerDocument.activeElement = this; }
  scrollIntoView(options) { this.ownerDocument.lastScroll = { node: this, options }; }
}

export function componentHarness() {
  const document = { activeElement: null, createElement(tag) { return new TestNode(this, tag); } };
  const root = document.createElement('section');
  const nodes = (node = root) => [node, ...node.children.flatMap(child => nodes(child))];
  const visible = node => !node.hidden && (!node.parentNode || visible(node.parentNode));
  const find = (predicate) => nodes().filter(node => visible(node) && predicate(node));
  function click(label) {
    const candidates = find(node => node.tagName === 'BUTTON' && node.textContent === label);
    if (candidates.length !== 1 || candidates[0].disabled) throw new Error(`Button unavailable: ${label}`);
    candidates[0].emit('click');
  }
  function inputByLabel(label) {
    const candidates = find(node => node.tagName === 'LABEL' && node.textContent === label);
    if (candidates.length !== 1) throw new Error(`Label unavailable: ${label}`);
    return candidates[0].children.find(node => node.tagName === 'INPUT');
  }
  function select(label, checked = true) {
    const input = inputByLabel(label);
    if (input.type === 'radio' && checked) for (const node of nodes()) if (node.tagName === 'INPUT' && node.name === input.name) node.checked = false;
    input.checked = checked; input.emit('change');
  }
  function fillEmail(value) {
    const input = find(node => node.tagName === 'INPUT' && node.type === 'email')[0];
    if (!input) throw new Error('Email unavailable');
    input.value = value; input.emit('input');
  }
  return { root, document, nodes, find, click, select, inputByLabel, fillEmail };
}
