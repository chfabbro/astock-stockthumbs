console.log('Creative Pixel custom loaded');

(() => {
  const cpThumbs = {};
  let stockThumbsConfig = {};

  function getTmplString(html, args) {
    return html.call(this, args);
  }

  // converts html string to DOM element
  // taken from https://stackoverflow.com/a/35385518
  const htmlToElement = ((htmlString) => {
    const template = document.createElement('template');
    const html = htmlString.trim();
    template.innerHTML = html;
    return template.content.firstChild;
  });

  /** TO DO: transform URLs and text with tracking links <<<<<
   * Creates node list from search data
   * @param {array} files array of JSON data
   * @returns {object} document fragment list of nodes
   */
  const createThumbList = ((files) => {
    const cp = cpThumbs;
    const stc = stockThumbsConfig;
    // create cta tracking url and text
    const { utils, overlayText, ctaUrl } = cp;
    const ctaText = overlayText(utils.getTrackingUrl(`${ctaUrl}?as_campaign=${utils.getHost()}`, stc));
    // create doc fragment consisting of node list
    const list = document.createDocumentFragment();
    files.forEach((row) => {
      // create substitution values for html string
      const args = {
        ctaText,
      };
      // add result fields
      Object.entries(row).forEach((field) => {
        // transform details URL with tracking data
        if (field[0] === 'details_url') {
          args.details_url = utils.getTrackingUrl(field[1], stc);
        } else {
          // eslint-disable-next-line prefer-destructuring
          args[field[0]] = field[1];
        }
      });
      // replace variables in html string and create thumb node
      list.appendChild(htmlToElement(getTmplString(cp.html, args)));
    });
    return list;
  });

  /**
   * Returns cloned nodes for further manipulation
   * @param {string} name DOM name of parent
   * @returns {object} cloned node
   */
  const cloneNodeList = (name) => {
    // will only get first matching element
    const parent = document.querySelector(name) || null;
    const nodeClone = parent.cloneNode(true);
    return nodeClone.childNodes;
  };

  /**
   * Removes all node children
   * @param {string} name DOM name of parent
   * @returns {object} emptied node
   */
  const emptyNode = (name) => {
    const el = document.querySelector(name);
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
    return el;
  };

  /**
   * Interleaves target node members with nodes from source
   * @param {object} source new node list content
   * @param {object} target node list to be combined
   * @returns {object} combined node list with new children
   */
  const combineNodes = (source, target) => {
    // returns new nodelist
    const newList = document.createDocumentFragment();
    // iterate over target nodes and combine with source nodes
    let srcNodeList = source.childNodes;
    target.forEach((node) => {
      // get first node from source using spread operator and store remainder
      const [srcNode, ...tailNodes] = srcNodeList;
      // clone current node or else appendChild will remove it from list
      const targetNode = node.cloneNode(true);
      // check if element node
      if (targetNode.nodeType === Node.ELEMENT_NODE && srcNode) {
        // insert original element node
        newList.appendChild(targetNode);
        // insert source node
        newList.appendChild(srcNode);
        // update source list with remaining nodes
        srcNodeList = tailNodes;
      } else {
        // add back other nodes without modification
        newList.appendChild(targetNode);
      }
    });
    return newList;
  };

  // add global objects if they don't exist
  const StockThumbs = window.StockThumbs || {};
  StockThumbs.config = StockThumbs.config || {};
  StockThumbs.config.custom = StockThumbs.config.custom || {};

  // run any setup code here
  StockThumbs.config.custom.init = (config, stockThumbsMain) => {
    console.log('custom init called');
    // get access to utility methods
    stockThumbsConfig = config;
    const cp = cpThumbs;
    // store utility functions and custom text/html
    cp.utils = stockThumbsMain.utils;
    cp.resultColumns = stockThumbsConfig.custom.result_columns;
    cp.overlayText = stockThumbsConfig.custom.overlayText;
    cp.ctaUrl = stockThumbsConfig.custom.ctaUrl;
    cp.html = stockThumbsConfig.custom.html;
    if (!cp.overlayText || !cp.html || !cp.resultColumns) {
      throw new Error('StockThumbs config is missing required overlayText, html, or result_columns members.');
    } else if (!(typeof cp.html === 'function')) {
      throw new Error('html element in StockThumbs config must be a function which returns a template string.');
    }
  };
  // run main functionality after search
  StockThumbs.config.custom.exec = (result) => {
    console.log('custom exec called');
    const stc = stockThumbsConfig;
    // creates document fragment consisting of new list of nodes
    const source = createThumbList(result);
    // gets child nodes from cloned target
    const target = cloneNodeList(stc.parentId);
    if (!source || !target) {
      throw new Error('ParentID or HTML is invalid');
    }
    const combined = combineNodes(source, target);
    if (window.jQuery && window.Masonry) {
      const $jq = window.jQuery;
      // replace existing node children with new list
      emptyNode(stc.parentId).appendChild(combined);
      const $cont = $jq(stc.parentId);
      $cont.imagesLoaded(() => {
        // remove existing masonry
        $cont.masonry('destroy');
        // re-layout items
        $cont.masonry({ itemSelector: '.edd_download' });
      });
    }
  };
})();

// Make script visible in console. see https://stackoverflow.com/a/23701451
// eslint-disable-next-line spaced-comment
//# sourceURL=./custom-creativepixel.js
