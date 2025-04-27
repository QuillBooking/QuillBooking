import { createCommand, LexicalCommand } from 'lexical';
import { DecoratorNode, EditorConfig, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical';
import React from 'react';

// Define the command payload type 
export type InsertImagePayload = {
  src: string;
  altText?: string;
  width?: string;
  height?: string;
  id?: string;
};

// Create the command with proper typing
export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> = 
  createCommand('INSERT_IMAGE_COMMAND');

export type SerializedImageNode = Spread<
  {
    src: string;
    altText: string;
    width?: string;
    height?: string;
    id?: string;
    type: 'image';
    version: 1;
  },
  SerializedLexicalNode
>;

// Create a separate React component for rendering the image
function ImageComponent({
  src,
  altText,
  width,
  height,
  id
}: {
  src: string;
  altText: string;
  width: string;
  height: string;
  id: string | null;
}) {
  // Safety check - always return a valid React element
  // This prevents the undefined return error
  if (!src) {
    return <span className="error-image">Missing image source</span>;
  }
  
  return (
    <img
      src={src}
      alt={altText || ''}
      width={width !== 'auto' ? width : undefined}
      height={height !== 'auto' ? height : undefined}
      className="editor-image"
      style={{ maxWidth: '100%', height: 'auto' }}
      data-lexical-image-id={id || undefined}
    />
  );
}

export class ImageNode extends DecoratorNode<React.ReactElement> {
  __src: string;
  __altText: string;
  __width: string;
  __height: string;
  __id: string | null; // WordPress media ID

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__id,
      node.__key
    );
  }

  constructor(
    src: string,
    altText: string,
    width?: string,
    height?: string,
    id?: string | null,
    key?: NodeKey
  ) {
    super(key);
    this.__src = src || ''; // Ensure src is never undefined
    this.__altText = altText || '';
    this.__width = width || 'auto';
    this.__height = height || 'auto';
    this.__id = id || null; // WordPress media ID
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    span.className = 'editor-image-wrapper';
    return span;
  }

  updateDOM(): boolean {
    // Return false to indicate the DOM node doesn't need to be replaced
    return false;
  }

  setWidthAndHeight(width: string, height: string): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  getWidth(): string {
    return this.__width;
  }

  getHeight(): string {
    return this.__height;
  }

  getId(): string | null {
    return this.__id;
  }

  // Required implementation of DecoratorNode
  // This method must never return undefined
  decorate(): React.ReactElement {
    // Always return a valid React element even if src is missing
    return (
      <ImageComponent
        src={this.__src || ''} // Ensure src is never undefined
        altText={this.__altText || ''}
        width={this.__width || 'auto'}
        height={this.__height || 'auto'}
        id={this.__id}
      />
    );
  }

  exportJSON(): SerializedImageNode {
    return {
      type: 'image',
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
      id: this.__id || undefined,
      version: 1,
      // Adding these from SerializedLexicalNode
      children: [],
      direction: null,
      format: 0,
      indent: 0,
    };
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { src, altText, width, height, id } = serializedNode;
    return new ImageNode(src || '', altText || '', width, height, id);
  }
}

export function $createImageNode({
  src,
  altText,
  width,
  height,
  id
}: {
  src: string;
  altText?: string;
  width?: string;
  height?: string;
  id?: string;
}): ImageNode {
  // Make sure src is never undefined or empty
  if (!src) {
    console.error('Attempting to create an ImageNode without a source');
    // Provide a placeholder or default image source
    src = '/api/placeholder/300/200';
  }
  return new ImageNode(src, altText || '', width, height, id);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}