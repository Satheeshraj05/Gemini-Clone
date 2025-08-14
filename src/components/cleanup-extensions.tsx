'use client';

import { useEffect } from 'react';

const EXTENSION_ATTRIBUTES = ['jf-ext-', 'data-extension-'];

const cleanNode = (node: Element) => {
  if (!node || !node.attributes) return;
  
  // Remove extension attributes
  const attributes = Array.from(node.attributes);
  for (const attr of attributes) {
    if (EXTENSION_ATTRIBUTES.some(prefix => attr.name.startsWith(prefix))) {
      node.removeAttribute(attr.name);
    }
  }
  
  // Process child nodes
  const children = Array.from(node.children);
  children.forEach(child => cleanNode(child));};

const setupMutationObserver = () => {
  if (typeof window === 'undefined' || !window.MutationObserver) return () => {};
  
  // Immediate cleanup
  cleanNode(document.documentElement);
  
  // Set up mutation observer to catch any dynamic additions
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes') {
        // Clean attributes on attribute changes
        if (mutation.target instanceof Element) {
          cleanNode(mutation.target);
        }
      } else if (mutation.type === 'childList') {
        // Clean attributes on added nodes
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            cleanNode(node);
          }
        });
      }
    });
  });
  
  // Start observing the document with the configured parameters
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: EXTENSION_ATTRIBUTES.map(prefix => `${prefix}*`)
  });
  
  return () => observer.disconnect();
};

export function CleanupExtensions() {
  useEffect(() => {
    // Initial cleanup
    cleanNode(document.documentElement);
    
    // Set up mutation observer for dynamic content
    const disconnect = setupMutationObserver();
    
    // Clean up on unmount
    return () => {
      disconnect();
    };
  }, []);

  return null; // This component doesn't render anything
}
