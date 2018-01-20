module.exports.htmlDeps = function htmlDeps(document, includeHtmlLinks = false) {
  const deps = [
    ...[... document.querySelectorAll('script[src]:not([type="module"])')],
    ...[... document.querySelectorAll('script[src][type="module"]')],
    ...[... document.querySelectorAll('link[rel="stylesheet"]')],
    ...[... document.querySelectorAll('link[rel~="icon"]')],
    ...[... document.querySelectorAll('img[src]')],
    ...[... document.querySelectorAll('a[href$=".pdf"]')],
  ].filter(el => el.href ? !el.href.startsWith('http:') && !el.href.startsWith('https:') : !el.src.startsWith('http:') && !el.src.startsWith('https:') && !el.src.endsWith('.legacy.js') && !el.src.startsWith('/webo/'))
  if (includeHtmlLinks) deps.push(...[... document.querySelectorAll('a[href]')].filter(el => !el.href.startsWith('http:') && !el.href.startsWith('https:')))
  return deps
}
