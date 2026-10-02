// Tiny helpers to build DOM elements without a framework.

// h('button', { class: 'btn', onclick: fn }, 'Text', childNode, [more])
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2), value);
    } else if (key === 'html') {
      el.innerHTML = value;
    } else if (key === 'style' && typeof value === 'object') {
      for (const [prop, v] of Object.entries(value)) el.style.setProperty(prop, v);
    } else if (value === true) {
      el.setAttribute(key, '');
    } else {
      el.setAttribute(key, String(value));
    }
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (Array.isArray(child)) append(el, child);
    else el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

// An inline SVG icon from a string of SVG markup.
export function icon(markup, className = 'icon') {
  const span = document.createElement('span');
  span.className = className;
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = markup;
  return span;
}

export function replaceChildren(el, ...children) {
  el.replaceChildren();
  append(el, children);
}

// A page that is drawn again gets new <img> elements, and a new element shows
// nothing until its picture is decoded again: the clothes of the Envoy, for
// example, would vanish for a moment. So pictures already on screen are moved
// into the new page (with the new element's attributes) instead.
export function keepPictures(oldRoot, newRoot) {
  const shown = new Map();
  for (const img of oldRoot.querySelectorAll('img')) {
    const src = img.getAttribute('src');
    if (!src || !img.complete || img.naturalWidth === 0) continue;
    if (!shown.has(src)) shown.set(src, []);
    shown.get(src).push(img);
  }
  for (const img of newRoot.querySelectorAll('img')) {
    const src = img.getAttribute('src');
    const old = src && shown.get(src)?.shift();
    if (!old) continue;
    for (const { name } of [...old.attributes]) if (!img.hasAttribute(name)) old.removeAttribute(name);
    for (const { name, value } of [...img.attributes]) if (name !== 'src') old.setAttribute(name, value);
    img.replaceWith(old);
  }
}

export const formatNumber = (n) => Math.floor(n).toLocaleString('de-DE');
