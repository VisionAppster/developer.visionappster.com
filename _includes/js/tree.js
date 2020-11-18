/* Copyright (C) Kuvio Automation, 2020
 * This file is proprietary to Kuvio Automation.
 * All rights reserved.
 */


/* This file contains a generic utility for building hierarchical
 * structures out of 11ty page collections. To bind pages to a
 * collection, add a tag to the "front matter" of the page. Like this:
 *
 * ---
 * tags: menu
 * ---
 *
 * This makes 11ty to add the page to the `collections.menu` array.
 *
 * By default, the location of a page in the hierarchy is determined
 * by its `url`. This and other parameters can be changed by adding a
 * configuration block:
 *
 * ---
 * tags: menu
 * menu:
 *  path: /custom/path
 *  title: Custom title
 *  order: 2
 * ---
 *
 * Note that "menu" as the key of the configuration block is
 * user-selectable. A page can be part of many structures (e.g. menu
 * and sitemap), and a different configuration is used for each.
 */


/**
 * A node in a tree data structure. Used to build hierarchical menus,
 * site maps etc.
 */
class TreeNode {
  constructor(configName, name, parent) {
    this._configName = configName;
    this.parent = parent;
    this.name = name || '';
    this._children = [];
    this.data = {};
  }

  get path() {
    return this.parent ? (this.parent.path + '/' + this.name) : '';
  }

  get url() {
    if (this.config.url) {
      return this.config.url;
    } else if (this.data.page) {
      return this.data.page.url;
    }
    return this.path + '/';
  }

  get order() {
    return this.config.order || 0;
  }

  get title() {
    if (this.config.title) {
      return this.config.title;
    } else if (this.data.pageTitle) {
      return this.data.pageTitle;
    }
    return this._defaultTitle();
  }

  get children() {
    const copy = this._children.slice();
    copy.sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      } else if (a.title < b.title) {
        return -1;
      } else if (a.title > b.title) {
        return 1;
      } else {
        return 0;
      }
    });
    return copy;
  }

  get config() {
    return typeof this.data[this._configName] === 'object' ? (this.data[this._configName] || {}) : {};
  }

  /**
   * Adds a new tree node to the hierarchy. The location of the node
   * is parsed from the page's *data* block.
   */
  addNode(data) {
    const config = data[this._configName] || {};
    const path = typeof config.path === 'string' ? config.path : data.page.url;
    const pathParts = path.split('/').filter(str => str.length !== 0);
    this._addNode(pathParts, data);
    if (typeof config === 'object' && Array.isArray(config.nodes)) {
      for (const cfg of config.nodes) {
        const d = {};
        d[this._configName] = cfg;
        this.addNode(d);
      }
    }
  }

  _addNode(pathParts, data) {
    if (pathParts.length === 0) {
      this.data = data;
      return;
    }
    let child = this._children.find(c => c.name == pathParts[0]);
    if (!child) {
      child = new TreeNode(this._configName, pathParts[0], this);
      this._children.push(child);
    }
    child._addNode(pathParts.slice(1), data);
  }

  _defaultTitle() {
    return this.name.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase());
  }
}

const _treeCache = [];

function tree(collection, configName) {
  const cacheEntry = _treeCache.find(e => e.configName === configName && e.collection === collection);

  let root;
  if (!cacheEntry) {
    root = new TreeNode(configName);
    for (const item of collection) {
      root.addNode(item.data);
    }
    _treeCache.push({collection, configName, root});
  } else {
    root = cacheEntry.root;
  }

  return root;
}

module.exports = {TreeNode, tree};
