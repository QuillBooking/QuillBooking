/**
 *  External dependencies
 */
import { TextNode } from 'lexical';

export class MentionNode extends TextNode {
	__mention;
	__category;

	static getType() {
		return 'mention';
	}

	static clone(node) {
		return new MentionNode(
			node.__mention,
			node.__category,
			node.__text,
			node.__key
		);
	}

	constructor(mentionName, category, text, key) {
		super(text || `{{${category}:${mentionName}}}`, key);
		this.__mention = mentionName;
		this.__category = category;
	}

	createDOM(config) {
		// Use the standard TextNode DOM creation without styling
		const dom = super.createDOM(config);
		
		// Just add data attributes for reference but no styling
		dom.dataset.mentionCategory = this.__category;
		dom.dataset.mentionName = this.__mention;
		
		return dom;
	}

	static exportDOM(node) {
		// Use standard text export
		const element = document.createElement('span');
		element.textContent = node.__text;
		element.dataset.mentionCategory = node.__category;
		element.dataset.mentionName = node.__mention;
		return { element };
	}

	// Define how to import from DOM
	static importDOM() {
		return {
			span: (domNode: HTMLElement) => {
				if (domNode.dataset.mentionCategory && domNode.dataset.mentionName) {
					return {
						conversion: (domNode: HTMLElement) => {
							const category = domNode.dataset.mentionCategory || '';
							const mention = domNode.dataset.mentionName || '';
							return {
								node: new MentionNode(mention, category, domNode.textContent || '', undefined)
							};
						},
						priority: 1 as 0 | 1 | 2 | 3 | 4,
					};
				}
				return null;
			},
		};
	}

	updateDOM(prevNode, dom, config) {
		// No need to update if the mention and category haven't changed
		if (
			prevNode.__mention === this.__mention &&
			prevNode.__category === this.__category &&
			prevNode.__text === this.__text
		) {
			return false;
		}

		// If we need to update, let TextNode handle it
		return super.updateDOM(prevNode, dom, config);
	}

	exportJSON() {
		return {
			...super.exportJSON(),
			mention: this.__mention,
			category: this.__category,
			type: 'mention',
			version: 1,
		};
	}

	static importJSON(serializedNode) {
		const node = new MentionNode(
			serializedNode.mention,
			serializedNode.category,
			serializedNode.text,
			undefined
		);
		node.setFormat(serializedNode.format);
		node.setDetail(serializedNode.detail);
		node.setMode(serializedNode.mode);
		node.setStyle(serializedNode.style);
		return node;
	}

	isTextEntity() {
		return true;
	}
}

export function $createMentionNode(mentionName, category) {
	const mentionNode = new MentionNode(
		mentionName,
		category,
		mentionName,
		undefined
	);
	return mentionNode;
}

export function $isMentionNode(node) {
	return node instanceof MentionNode;
}