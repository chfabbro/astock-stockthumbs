(() => {
  let searchBarConfig = {};
  let searchBarMain = null;
  // expose global object
  window.StockSearchBar = {
    init: (config) => {
      searchBarConfig = config;
      window.addEventListener('StockSearchBarReady', () => {
        console.log('SearchBar ready');
        const sbm = searchBarMain();
        window.StockSearchBar.getFilters = sbm.getFilters;
        window.StockSearchBar.setFilters = sbm.setFilters;
        sbm.init();
      }, false);
    },
  };
  searchBarMain = () => {
    const AdobeStock = window.AdobeStock;
    const SB = searchBarConfig;
    const includePath = window.StockSearchBar.PATH;
    const sbHeader = `<div class="astock-searchbar-header"><a href="https://stock.adobe.com" target="_blank"><img src="${includePath}/adobe_stock_logo-400.png"></a></div>`;
    function getTrackingUrl(url) {
      // clk.tradedoubler.com/click?p(ProgramID)&a(AdvertiserID)&g(AdID)url(TARGET_URL)
      return `//clk.tradedoubler.com/click?p(${SB.programID})a(${SB.advertiserID})g(${SB.adID})url(${encodeURIComponent(url)})`;
    }
    function parseFilters(filters) {
      const searchFilters = {};
      const $jq = window.StockSearchBar.$jq;
      if (!filters) return;
      // iterate over object using method that won't bother eslint!
      const filterMap = Object.entries(filters);
      const stkParams = AdobeStock.SEARCH_PARAMS;
      // lookup Stock keyname and map to search filter name
      filterMap.forEach(([key, currentValue]) => {
        let value = currentValue;
        if (Object.prototype.hasOwnProperty.call(stkParams, key)) {
          if (key === 'SIMILAR_URL') {
            if (value !== '' && value !== undefined) {
              const firstImg = $jq(`${value} img`)[0] || $jq(`${value}`)[0];
              const url = $jq(firstImg).attr('src');
              if (url !== '' && url !== undefined) {
                searchFilters[stkParams[key]] = url;
              }
            }
          } else if (key === 'WORDS') {
            // value should be array ['DOM element', keyword count]
            if (value && value[0]) {
              const phrase = $jq(value[0]).text();
              // if element has text get keywords
              if (phrase) {
                const keywords = window.StockSearchBar.keywordx.extract(phrase, {
                  language: 'english',
                  remove_digits: true,
                  return_changed_case: true,
                  remove_duplicates: true,
                });
                // if count is not supplied default to 1
                const keywordCount = (value[1]) ? value[1] : 1;
                const searchWords = (keywords.length > 0) ? keywords.slice(0, keywordCount).join(' ') : '';
                console.log('keywords: %o\nsearching on %s', keywords, searchWords);
                searchFilters[stkParams[key]] = searchWords;
              }
            }
          } else if (value !== '' && value !== undefined) {
            // validate size
            if (key === 'THUMBNAIL_SIZE') {
              const sizes = [110, 160, 220, 240, 500, 1000];
              const targetSize = value;
              // check if size is in array of allowed sizes
              if (sizes.indexOf(targetSize) < 0) {
                value = sizes.reduce((a, b) => {
                  const newSize = (Math.abs(a - targetSize) < Math.abs(b - targetSize) ? a : b);
                  return newSize;
                });
                console.warn('Thumbnail size of %s is not valid. Closest size is %s', targetSize, value);
              }
            }
            searchFilters[stkParams[key]] = value;
          }
        }
      });
      return searchFilters;
    }
    // returns container div from selector and adds main class
    function $getContDiv(el) {
      const mainClass = 'astock-searchbar';
      const dataId = 'searchbar';
      // get reference to jQuery
      const $jq = window.StockSearchBar.$jq;
      // get reference to target div and data node (might be same)
      let $tempDiv = $jq(el);
      const $dataDiv = $tempDiv.find(`[data-id=${dataId}]`);
      // if data node exists, return it
      if ($dataDiv.length > 0) {
        $tempDiv = $dataDiv;
      // does target node exist
      } else if ($tempDiv.length > 0) {
        // does target node contain main class
        if (!$tempDiv.hasClass(mainClass)) {
          // create new div to be container
          const $mainDiv = $jq(document.createElement('div'));
          // add main class
          $mainDiv.addClass(mainClass);
          // add new container under target and return that
          $tempDiv = $mainDiv;
          $jq(el).append($tempDiv);
        }
        // add data node
        $tempDiv.attr('data-id', dataId);
      // neither exists, throw exception
      } else {
        throw (new Error('Stock SearchBar error: Container does not exist. Set "contId" to a valid selector.'));
      }
      return $tempDiv;
    }
    // creates thumbs and inserts -- input is json array
    function updateUiThumbs(files) {
      const wrapClass = 'astock-searchbar-wrap';
      const bodyClass = 'astock-searchbar-body';
      let itemClass = 'astock-searchbar-item';
      const tipClass = 'astock-searchbar-tip';
      // get reference to jQuery
      const $jq = window.StockSearchBar.$jq;
      const $sb = $getContDiv(SB.contId);
      // wrap thumbnails in container to allow scrolling
      const $wrapDiv = $jq(document.createElement('div'));
      $wrapDiv.addClass(wrapClass);
      const $thumbsDiv = $jq(document.createElement('div'));
      $thumbsDiv.addClass(bodyClass);
      // if body width is less than 150px, apply small item size
      if ($sb.width() <= 150) {
        itemClass = `${itemClass} item-small`;
      }
      // populate with images using html returned in json
      files.forEach((asset) => {
        // get html tag
        const tag = asset[AdobeStock.RESULT_COLUMNS.THUMBNAIL_HTML_TAG];
        // get url to details page on Stock and wrap inside affiliate tracking url
        const url = getTrackingUrl(asset[AdobeStock.RESULT_COLUMNS.DETAILS_URL]);
        // convert html string into dom element
        const range = document.createRange();
        const thumb = range.createContextualFragment(tag);
        // create div wrapper
        const div = document.createElement('div');
        div.className = itemClass;
        // create anchor with link to details
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        // if captions are enabled
        if (SB.tooltips) {
          // create tool tip from image title
          const tip = document.createElement('div');
          tip.className = tipClass;
          // get title text from document-fragment
          const tipText = thumb.querySelector('img').title;
          if (tipText !== '' && tipText !== undefined) {
            tip.textContent = tipText;
            thumb.querySelector('img').removeAttribute('title');
            link.appendChild(tip);
            // create hover behavior for tip
            const $tip = $jq(tip);
            const $link = $jq(link);
            const showTip = (el) => {
              el.stopPropagation();
              el.preventDefault();
              const $img = $jq(el.currentTarget);
              const $off1 = $img.offset();
              const $off2 = $sb.offset();
              const newPos = {
                top: ($off1.top - $off2.top) + $img.height(),
                left: ($off1.left - $off2.left) + $img.width(),
              };
              $tip.css({
                top: newPos.top,
                left: newPos.left,
              });
              // console.log('final pos', newPos);
              $tip.show();
              // change parent to main div
              $sb.append($tip);
            };
            const hideTip = (el) => {
              $tip.css($jq(el.currentTarget).offset());
              $tip.hide();
              // reset parent to link
              $link.append($tip);
            };
            // $jq(thumb.querySelector('img')).hover(showTip);
            $jq(link).hover(showTip, hideTip);
          }
        }
        // wrap link around image and add to document
        link.appendChild(thumb);
        div.appendChild(link);
        $thumbsDiv.append(div);
      });
      $wrapDiv.append($thumbsDiv);
      $sb.append($wrapDiv);
      // init Masonry
      $thumbsDiv.masonry({
        itemSelector: `.${itemClass}`,
      });
      // listen for images loaded event
      $thumbsDiv.imagesLoaded()
        .progress(() => {
          $thumbsDiv.masonry('layout');
        })
        .done(() => {
          console.log('all images successfully loaded');
          // show search bar
          $sb.addClass('astock-searchbar-fadein');
          // make sure it is visible in case class is missing
          window.setTimeout(() => {
            $sb.css({
              visibility: 'visible',
              opacity: 1,
            });
            // call Masonry layout one final time for Firefox!
            $thumbsDiv.masonry('layout');
          }, 1000);
        });
    }
    // runs search using sdk
    function doSearch(params) {
      // default filters
      const defaultParams = {
        offset: 0,
        limit: 16,
      };
      // merge default filters with params from config
      const searchParams = Object.assign(defaultParams, params);
      const queryParams = {
        locale: 'en-US',
        search_parameters: searchParams,
      };
      // result fields to get back
      const resultColumns = [
        AdobeStock.RESULT_COLUMNS.THUMBNAIL_HTML_TAG,
        AdobeStock.RESULT_COLUMNS.DETAILS_URL,
        AdobeStock.RESULT_COLUMNS.NB_RESULTS,
      ];
      console.log('Search query: %o', searchParams);
      // create sdk instance
      const stock = new AdobeStock(SB.apiKey, SB.appName, AdobeStock.ENVIRONMENT.PROD);
      // execute search and load results
      const iterator = stock.searchFiles(null, queryParams, resultColumns);
      // iterate over returned Promise
      iterator.next().then(() => {
        const response = iterator.getResponse();
        // only update UI if there are results
        if (response.nb_results > 0) {
          updateUiThumbs(response.files);
        } else {
          console.log('no results from Stock');
        }
      });
    }
    return {
      init: () => {
        const $jq = window.StockSearchBar.$jq;
        // create search results
        const $searchBar = $getContDiv(SB.contId);
        // create stock header
        const $header = $jq(sbHeader);
        const headerUrl = $header.find('a').attr('href');
        $header.find('a').attr('href', getTrackingUrl(headerUrl));
        $searchBar.append($header);
        // extract search options and run search
        doSearch(parseFilters(SB.filters));
      },
      getFilters: () => { console.log(SB); },
      setFilters: (filters) => { console.log(filters); },
    };
  };
  // Get current path of script by triggering a stack trace
  /*! @source https://gist.github.com/eligrey/5426730 */
  window.StockSearchBar.PATH = (() => {
    const filename = 'fileName';
    const stack = 'stack';
    const stacktrace = 'stacktrace';
    const sourceUrl = 'sourceURL';
    const current = 'currentScript';
    let loc = null;
    const matcher = (name, matchedLoc) => {
      loc = matchedLoc;
    };

    // for modern browsers
    if (document[current] && document[current].src !== '') {
      loc = document[current].src;
      return loc.slice(0, loc.lastIndexOf('/') + 1);
    }

    try {
      0(); // throws error
      return false;
    } catch (ex) {
      if (filename in ex) { // Firefox
        loc = ex[filename];
      } else if (sourceUrl in ex) { // New Safari
        loc = ex[sourceUrl];
      } else if (stacktrace in ex) { // Opera
        ex[stacktrace].replace(/called from line \d+, column \d+ in (.*):/gm, matcher);
      } else if (stack in ex) { // WebKit, Blink, and IE10
        ex[stack].replace(/at.*?\(?(\S+):\d+:\d+\)?$/g, matcher);
      }
      return loc.slice(0, loc.lastIndexOf('/') + 1);
    }
  })();

  // notifies main script when everything is loaded
  function jqLoaded() {
    // get current path of script
    const includePath = window.StockSearchBar.PATH;
    jQuery(document).ready((jQuery) => {
      const SS = window.StockSearchBar;
      SS.$jq = jQuery.noConflict();
      const $jq = SS.$jq;
      const reqs = {
        keywordx: 'keywordx.min.js',
        imagesloaded: 'imagesloaded.pkgd.min.js',
        adobestocklib: 'adobestocklib.min.js',
        masonry: 'masonry.pkgd.min.js',
      };
      // load other libraries using a promise
      // https://stackoverflow.com/a/11803418/9421005
      $jq.when(
        $jq.getScript(`${includePath}${reqs.adobestocklib}`),
        $jq.getScript(`${includePath}${reqs.masonry}`),
        $jq.getScript(`${includePath}${reqs.imagesloaded}`),
        $jq.getScript(`${includePath}${reqs.keywordx}`),
        $jq.Deferred((deferred) => {
          $jq(deferred.resolve);
        }),
      ).done(() => {
        console.log('jQuery %s and all libraries loaded.', $jq().jquery);
        // dispatch event that searchbar is ready to load
        SS.keywordx = window.keywordx;
        SS.Masonry = window.Masonry;
        const event = new Event('StockSearchBarReady');
        // Dispatch the event.
        window.dispatchEvent(event);
      }).fail((jqXHR, textStatus, errorThrown) => {
        console.error(errorThrown);
      });
    });
  }

  const domReadyHandler = (a) => {
    const b = document;
    const c = 'addEventListener';
    if (b[c]) b[c]('DOMContentLoaded', a);
    else window.attachEvent('onload', a);
  };

  domReadyHandler(() => {
    // check for jQuery and load conditionally
    if (typeof window.jQuery === 'undefined' && !window.jQuery) {
      const jQ = document.createElement('script');
      jQ.type = 'text/javascript';
      jQ.onload = jQ.onreadystatechange;
      jQ.onload = jqLoaded;
      jQ.src = `${window.StockSearchBar.PATH}/jquery.min.js`;
      document.body.appendChild(jQ);
    } else {
      jqLoaded();
    }
  });
})();
