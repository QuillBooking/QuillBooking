// First, create a new file called ImageNode.jsx

import { DecoratorNode } from 'lexical';
import { ReactNode, createElement } from 'react';

export class ImageNode extends DecoratorNode {
  __src;
  __altText;
  __width;
  __height;
  __maxWidth;

  static getType() {
    return 'image';
  }

  static clone(node) {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__maxWidth,
      node.__key
    );
  }

  static importJSON(serializedNode) {
    const { src, altText, width, height, maxWidth } = serializedNode;
    const node = $createImageNode({
      src,
      altText,
      width,
      height,
      maxWidth
    });
    return node;
  }

  exportJSON() {
    return {
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
      maxWidth: this.__maxWidth,
      type: 'image',
      version: 1,
    };
  }

  constructor(src, altText, width, height, maxWidth, key) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width || null;
    this.__height = height || null;
    this.__maxWidth = maxWidth || 500;
  }

  createDOM() {
    const div = document.createElement('div');
    div.className = 'image-container';
    return div;
  }

  updateDOM() {
    return false;
  }

  getSrc() {
    return this.__src;
  }

  getAltText() {
    return this.__altText;
  }

  getWidth() {
    return this.__width;
  }

  getHeight() {
    return this.__height;
  }

  decorate() {
    return createElement(ImageComponent, {
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
      maxWidth: this.__maxWidth,
      nodeKey: this.getKey(),
    });
  }
}

function ImageComponent({ src, altText, width, height, maxWidth, nodeKey }) {
  return (
    <div data-lexical-decorator="true" className="image-container">
      <div className="image-inner-container">
        <img
          src={src}
          alt={altText}
          style={{
            height: height ? `${height}px` : 'auto',
            maxWidth: `${maxWidth}px`,
            width: width ? `${width}px` : '100%',
          }}
          draggable="false"
        />
      </div>
    </div>
  );
}

export function $createImageNode({ src, altText, width, height, maxWidth, key }) {
  return new ImageNode(src, altText, width, height, maxWidth, key);
}

export function $isImageNode(node) {
  return node instanceof ImageNode;
}