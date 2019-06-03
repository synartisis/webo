const parse5 = require('parse5')
const htmlparser2Adapter = require('parse5-htmlparser2-tree-adapter')


exports.parseHtml = function parse(html) {
  return parse5.parse(html, { treeAdapter: htmlparser2Adapter })
}


exports.parseFragment = function parseFragment(html) {
  return parse5.parseFragment(html, { treeAdapter: htmlparser2Adapter })
}


exports.serialize = function serialize(document) {
  return parse5.serialize(document, { treeAdapter: htmlparser2Adapter })
}

exports.qs = function qs(node, predicate) {
  let result
  if (predicate(node)) {
    result = node
  } else {
    if (node.children) {
      for (let child of node.children) {
        result = qs(child, predicate)
        if (result) break
      }
    }
  }
  return result
}


exports.qsa = function qsa(node, predicate, res = []) {
  if (predicate(node)) res.push(node)
  if (node.children) node.children.forEach(child => qsa(child, predicate, res))
  return res
}


exports.walk = function walk(node, fn) {
  fn(node)
  if (node.children) node.children.forEach(child => walk(child, fn))
}


exports.createElement = function createElement(type, attributes = {}) {
  return { 
    type, 
    name: type,
    namespace: 'http://www.w3.org/1999/xhtml',
    attribs: Object.create(null, Object.getOwnPropertyDescriptors(attributes)),
    ['x-attribsNamespace']: Object.create(null, { src: {}, type: {} }),
    ['x-attribsPrefix']: Object.create(null, { src: {}, type: {} }),
    children: [],
    parent: null,
    prev: null,
    next: null
  }
}


exports.insertBefore = function insertBefore(newChild, refChild) {
  if (!newChild || !refChild) throw new Error('missing parameter')
  newChild.parent = refChild.parent
  refChild.parent.children.splice(refChild.parent.children.indexOf(refChild), 0, newChild)
  const oldSibbling = refChild.next
  refChild.next = newChild
  newChild.prev = refChild
  newChild.next = oldSibbling
}


exports.remove = function remove(el) {
  if (!el) throw new Error('missing parameter')
  el.parent.children.splice(el.parent.children.indexOf(el), 1)
  if (el.prev) el.prev.next = el.next
  if (el.next) el.next.prev = el.prev
}