// /**
//  * @typedef {Object} Node
//  * @property {string} type
//  * @property {string} name
//  * @property {{[key: string]: string}} attribs
//  * @property {Node[]} children
//  * @property {'http://www.w3.org/1999/xhtml'} namespace
//  * @property {'http://www.w3.org/1999/xhtml'} [x-attribsNamespace]
//  * @property {'http://www.w3.org/1999/xhtml'} [x-attribsPrefix]
//  * @property {Node?} parent
//  * @property {Node?} prev
//  * @property {Node?} next
//  */

// import * as parse5 from 'parse5'
// import * as htmlparser2Adapter from 'parse5-htmlparser2-tree-adapter'


// /** @type {(html: string) => Node})} */
// export function parseHtml(html) {
//   return parse5.parse(html, { treeAdapter: htmlparser2Adapter })
// }


// /** @type {(html: string) => Node})} */
// export function parseFragment(html) {
//   return parse5.parseFragment(html, { treeAdapter: htmlparser2Adapter })
// }


// /** @type {(document: Node) => string})} */
// export function serialize(document) {
//   return parse5.serialize(document, { treeAdapter: htmlparser2Adapter })
// }

// /** @type {(node: Node, predicate: (el: Node) => boolean) => Node | undefined})} */
// export function qs(node, predicate) {
//   let result
//   if (predicate(node)) {
//     result = node
//   } else {
//     if (node.children) {
//       for (let child of node.children) {
//         result = qs(child, predicate)
//         if (result) break
//       }
//     }
//   }
//   return result
// }


// /** @type {(node: Node, predicate: (el: Node) => boolean, res?: Node[]) => Node[]})} */
// export function qsa(node, predicate, res = []) {
//   if (predicate(node)) res.push(node)
//   if (node.children) node.children.forEach(child => qsa(child, predicate, res))
//   return res
// }


// /** @type {(node: Node, fn: (el: Node) => void) => void})} */
// export function walk(node, fn) {
//   fn(node)
//   if (node.children) node.children.forEach(child => walk(child, fn))
// }


// /** @type {(type: string, attributes: any) => Node} */
// export function createElement(type, attributes = {}) {
//   return { 
//     type, 
//     name: type,
//     namespace: 'http://www.w3.org/1999/xhtml',
//     attribs: Object.create(null, Object.getOwnPropertyDescriptors(attributes)),
//     ['x-attribsNamespace']: Object.create(null, { src: {}, type: {} }),
//     ['x-attribsPrefix']: Object.create(null, { src: {}, type: {} }),
//     children: [],
//     parent: null,
//     prev: null,
//     next: null
//   }
// }


// /** @type {(newChild: Node, refChild: Node) => void} */
// export function insertBefore(newChild, refChild) {
//   if (!newChild || !refChild) throw new Error('missing parameter')
//   newChild.parent = refChild.parent
//   refChild.parent?.children.splice(refChild.parent.children.indexOf(refChild), 0, newChild)
//   const oldSibbling = refChild.next
//   refChild.next = newChild
//   newChild.prev = refChild
//   newChild.next = oldSibbling
// }


// /** @type {(el: Node) => void} */
// export function remove(el) {
//   if (!el) throw new Error('missing parameter')
//   el.parent?.children.splice(el.parent.children.indexOf(el), 1)
//   if (el.prev) el.prev.next = el.next
//   if (el.next) el.next.prev = el.prev
// }