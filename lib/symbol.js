const { renderer } = require('posthtml-svg-mode');
const { getRoot, getHash, attrToNumber } = require('./utils');
const defaultFactory = require('./symbol-factory');
const FileRequest = require('./request');
const clone = require('clone');

class SpriteSymbol {
  constructor({ id, tree, request }) {
    this.id = id;
    this._tree = tree;
    this.request = request;

    const root = getRoot(tree);

    if (root.attrs) {
      this.width = attrToNumber(root.attrs.width);
      this.height = attrToNumber(root.attrs.height);
      delete root.attrs.width;
      delete root.attrs.height;
    }
  }

  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.content
   * @param {string|FileRequest} options.request
   * @param {Function<Promise<PostHTMLProcessingResult>>} [options.factory]
   * @return {Promise<SpriteSymbol>}
   */
  static create(options) {
    const { content, factory = defaultFactory } = options;
    const request = typeof options.request === 'string' ? new FileRequest(options.request) : options.request;
    const id = typeof options.id === 'undefined' ? getHash(`${request.toString()}_${content}`) : options.id;

    return factory({ content, request, id })
      .then(({ tree }) => new SpriteSymbol({ id, request, tree }));
  }

  /**
   * @return {string}
   */
  get viewBox() {
    const root = getRoot(this._tree);
    return root.attrs ? root.attrs.viewBox : null;
  }

  get dimensions() {
    const root = getRoot(this._tree);

    if (typeof this.width === 'number' && typeof this.height === 'number') {
      return {
        width: this.width,
        height: this.height
      };
    } else if (this.viewBox) {
      const viewBox = this.viewBox.trim().split(/\s+/);
      return {
        width: attrToNumber(viewBox[2]),
        height: attrToNumber(viewBox[3])
      }
    } else {
      return {};
    }
  }

  get tree() {
    return clone(this._tree);
  }

  /**
   * @return {string}
   */
  get useId() {
    return `${this.id}-usage`;
  }

  /**
   * @return {string}
   */
  render() {
    return renderer(this.tree);
  }
}

module.exports = SpriteSymbol;
