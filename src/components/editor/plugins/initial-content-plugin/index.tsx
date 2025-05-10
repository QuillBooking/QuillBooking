/**
 *  External dependencies
 */
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode } from 'lexical';
import { $generateNodesFromDOM } from '@lexical/html';
/**
 *  Internal dependencies
 */
import { $createMentionNode } from '../../nodes/mention-node';

interface InitialContentPluginProps {
  initialContent: string;
}

export default function InitialContentPlugin({ initialContent }: InitialContentPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!initialContent) return;

    editor.update(() => {
      try {
        const parser = new DOMParser();
        const dom = parser.parseFromString(initialContent, 'text/html');
        const hasContent = dom.body && dom.body.childNodes.length > 0;
    
        if (!hasContent) {
          const root = $getRoot();
          root.clear();
          root.append($createParagraphNode());
          return;
        }
    
        // Find all mention elements in the DOM
        const mentionElements = dom.querySelectorAll('.mention-node');
        console.log('Found mention elements:', mentionElements.length);
    
        // Process the DOM to replace mention elements with placeholders
        // This helps us track where mentions should be inserted later
        const mentionData = [];
        mentionElements.forEach((mentionEl, index) => {
          const mentionName = mentionEl.dataset.mentionName;
          const category = mentionEl.dataset.mentionCategory;
          
          if (mentionName && category) {
            // Create a unique placeholder
            const placeholder = document.createElement('span');
            placeholder.setAttribute('data-mention-placeholder', `mention-${index}`);
            placeholder.textContent = `@${mentionName}`;
            
            // Store the data for later
            mentionData.push({
              placeholder: `mention-${index}`,
              name: mentionName,
              category: category
            });
            
            // Replace the mention element with the placeholder
            mentionEl.parentNode?.replaceChild(placeholder, mentionEl);
          }
        });
    
        const root = $getRoot();
    
        // Generate nodes from the modified HTML
        const newNodes = $generateNodesFromDOM(editor, dom);
        console.log('Generated Nodes:', newNodes);
    
        // Clear the root
        console.log('Clearing root...');
        root.clear();
        
        // Process and append each node, looking for placeholders to replace with mention nodes
        console.log('Appending nodes to root...');
        newNodes.forEach((node) => {
          if (node.getType() === 'text') {
            const text = node.getTextContent();
            
            // Check if this text node contains any mention placeholders
            const mentionPlaceholderRegex = /@([^@]+)/g;
            let match;
            let hasMention = false;
            
            // For each mention placeholder in this text
            while ((match = mentionPlaceholderRegex.exec(text)) !== null) {
              const mentionText = match[1];
              
              // Find the mention data
              const mentionInfo = mentionData.find(m => mentionText.includes(m.name));
              
              if (mentionInfo) {
                hasMention = true;
                
                // Create the mention node
                const mentionNode = $createMentionNode(mentionInfo.name, mentionInfo.category);
                
                // Create paragraph for the mention
                const paragraph = $createParagraphNode();
                paragraph.append(mentionNode);
                
                // Append to the root
                root.append(paragraph);
                console.log('Added mention node:', mentionInfo.name, mentionInfo.category);
              }
            }
            
            // If no mentions were found, append the original node
            if (!hasMention) {
              const paragraph = $createParagraphNode();
              paragraph.append(node);
              root.append(paragraph);
            }
          } else {
            // For non-text nodes, just append them directly
            root.append(node);
            console.log('Appending Node:', node);
          }
        });
    
        if (root.getChildrenSize() === 0) {
          const paragraph = $createParagraphNode();
          root.append(paragraph);
          console.log('Root was empty. Added a blank paragraph:', paragraph);
        }
      } catch (error) {
        console.error('Error initializing content:', error);
        const root = $getRoot();
        root.clear();
        root.append($createParagraphNode());
      }
    });
  }, [editor, initialContent]);

  return null;
}