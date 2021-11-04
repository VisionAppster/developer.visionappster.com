const treejs = require('./_includes/js/tree.js');

/* TODO
 *
 * The correct way to implement a navigation is <nav><ol><li><a>.
 * Other markup may be needed, but it should be the same on all levels
 * and styles should be used to make it look like a menu. 11ty even
 * has a ready-made plugin for generating a navigation structure like
 * that.
 *
 * Here's how we do it instead:
 */
function mainMenuBar(node) {
  return `<ul class="menu-horizontal text-left">
${node.children.reduce((str, child) => str + mainMenuItem(child) + '\n', '')}
</ul>`;
}

function mainMenuItem(node) {
  const children = node.children;
  if (children.length === 0) {
    return `<li class="dropdown"><a href="${node.url}">${node.title}</a></li>`;
  } else {
    return `<li class="dropdown">
<span class="dropdown__trigger">${node.title}</span>
<div class="dropdown__container">
  <div class="container">
    <div class="row">
      <div class="dropdown__content col-lg-2 col-md-4">
        <ul class="menu-vertical">
          ${node.children.reduce((str, child) => str + submenuItem(child) + '\n', '')}
        </ul>
      </div>
    </div>
  </div>
</div>`;
  }
}

function submenuItem(node) {
  const cls = node.config.styleClass ? ` class="${node.config.styleClass}"` : '';
  return `<li${cls}><a href="${node.url}">${node.title}</a></li>`;
}

function tree(collection, configName = 'tree') {
  const root = treejs.tree(collection, configName);
  return mainMenuBar(root);
}

module.exports = function(eleventyConfig) {
  eleventyConfig.setLiquidOptions({
    dynamicPartials: true // Restore liquid default which is overridden by 11ty.
  });
  // This provides a "tree" shortcode to templates.
  eleventyConfig.addShortcode('tree', tree);
  // This directory is just copied and not scanned for templates.
  eleventyConfig.addPassthroughCopy('assets');
  eleventyConfig.addPassthroughCopy("favicon.ico");
  eleventyConfig.addPassthroughCopy("update/status.json");
  return {
    templateFormats: ['liquid', 'html'],
    htmlTemplateEngine: 'liquid',
    dataTemplateEngine: 'liquid'
  };
};
