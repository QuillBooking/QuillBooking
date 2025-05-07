/**
 *  External dependencies
 */
import type {
  DOMConversionMap,
  DOMConversionOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { $applyNodeReplacement, DecoratorNode } from 'lexical';

export interface ImagePayload {
  src: string;
  altText: string;
  width?: number;
  height?: number;
  key?: NodeKey;
}

export type SerializedImageNode = Spread<
  {
    src: string;
    altText: string;
    width?: number;
    height?: number;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width: number | undefined;
  __height: number | undefined;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__key,
    );
  }

  constructor(
    src: string,
    altText: string,
    width?: number,
    height?: number,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__height = height;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      span.className = className;
    }
    const img = document.createElement('img');
    img.src = this.__src;
    img.alt = this.__altText;
    img.width = this.__width || 0;
    img.height = this.__height || 0;
    img.className = 'max-w-full';
    img.draggable = false;
    img.setAttribute('contenteditable', 'false');
    
    img.setAttribute('data-lexical-editor', 'true');
    img.setAttribute('data-lexical-image', 'true');
    img.setAttribute('data-lexical-key', this.__key);
    img.setAttribute('data-lexical-src', this.__src);
    img.setAttribute('data-lexical-alt', this.__altText);
    img.setAttribute('data-lexical-width', String(this.__width || 0));
    img.setAttribute('data-lexical-height', String(this.__height || 0));
    img.setAttribute('data-lexical-type', 'image-node');
    span.appendChild(img);
    return span;
  }

  updateDOM(): false {
    return false;
  }

  // Add DOM conversion method
  static importDOM(): DOMConversionMap | null {
    return {
      img: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-image')) {
          return null;
        }
        return {
          conversion: convertImageElement,
          priority: 2,
        };
      },
      span: (domNode: HTMLElement) => {
        const img = domNode.querySelector('img[data-lexical-image]');
        if (!img) {
          return null;
        }
        return {
          conversion: convertImageElement,
          priority: 2,
        };
      }
    };
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { src, altText, width, height } = serializedNode;
    const node = $createImageNode({
      src,
      altText,
      width,
      height,
    });
    return node;
  }

  exportJSON(): SerializedImageNode {
    return {
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
      type: 'image',
      version: 1,
    };
  }

  decorate(): JSX.Element {
    return (
      <img
        src={this.__src}
        alt={this.__altText}
        width={this.__width}
        height={this.__height}
        className="max-w-full"
        draggable="false"
      />
    );
  }
}

function convertImageElement(domNode: HTMLElement): DOMConversionOutput {
  const img = domNode.querySelector('img') || domNode;
  const src = img.getAttribute('data-lexical-src') || img.getAttribute('src');
  const alt = img.getAttribute('data-lexical-alt') || img.getAttribute('alt');
  const width = parseInt(img.getAttribute('data-lexical-width') || '', 10);
  const height = parseInt(img.getAttribute('data-lexical-height') || '', 10);

  if (!src) {
    return { node: null };
  }

  const node = $createImageNode({
    src: src,
    altText: alt || '',
    width: isNaN(width) ? undefined : width,
    height: isNaN(height) ? undefined : height,
  });

  return { node };
}

export function $createImageNode({
  src,
  altText,
  width,
  height,
  key,
}: ImagePayload): ImageNode {
  return $applyNodeReplacement(new ImageNode(src, altText, width, height, key));
}

export function $isImageNode(
  node: LexicalNode | null | undefined,
): node is ImageNode {
  return node instanceof ImageNode;
}