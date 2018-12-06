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
    function getTrackingUrl(url) {
      // clk.tradedoubler.com/click?p(ProgramID)&a(AdvertiserID)&g(AdID)url(TARGET_URL)
      return `//clk.tradedoubler.com/click?p(${SB.programID})a(${SB.advertiserID})g(${SB.adID})url(${encodeURIComponent(url)})`;
    }
    function getHost() {
      return document.location.hostname;
    }
    const stockHomeUrl = getTrackingUrl(`https://stock.adobe.com?as_campaign=${encodeURIComponent(getHost())}`);
    // returns cta link per ctaLink config variable
    const getCtaText = () => {
      const fmfUrl = getTrackingUrl(`https://stock.adobe.com/promo/firstmonthfree?as_campaign=${getHost()}`);
      const videoUrl = getTrackingUrl(`https://stock.adobe.com/video?as_campaign=${getHost()}`);
      const cta = {
        fmf: `<p>First month free with <a href="${fmfUrl}" class="astock-searchbar-link" target="_blank">Adobe Stock annual plans</a>.</p>`,
        video: `<p>Save money on Adobe Stock videos <a href="${videoUrl}" class="astock-searchbar-link" target="_blank">with a credit pack</a>.</p>`,
      };
      if (SB.ctaLink === 'video') return cta.video;
      return cta.fmf;
    };
    const sbHeader = `<div class="astock-searchbar-header"><a href="${stockHomeUrl}" target="_blank"><img src="${includePath}/adobe_stock_logo-400.png"></a>${getCtaText()}</div>`;
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
    /*
      <div class="astock-searchbar-item" style="position: absolute; left: 0px; top: 0px;"><a href="//clk.tradedoubler.com/click?p(264355)a(3033058)g(22804962)url(https%3A%2F%2Fstock.adobe.com%2F213282832%3Fas_channel%3Daffiliate%26as_source%3Dapi%26as_content%3Db3f036780e4148b6a3f845bbe4c6de45)" target="_blank"><video preload="none" poster="https://as1.ftcdn.net/jpg/02/13/28/28/220_F_213282832_VAZvWySW4wa5YpZjBqZEEU6yUYxM7PkT.jpg" muted="muted" onmouseover="this.play()" onmouseout="this.pause()"><source src="https://v.ftcdn.net/02/13/28/28/240_F_213282832_VAZvWySW4wa5YpZjBqZEEU6yUYxM7PkT_ST.mp4" type="video/mp4"></video></a></div>
    */
    function updateUiThumbs(files) {
      const wrapClass = 'astock-searchbar-wrap';
      const bodyClass = 'astock-searchbar-body';
      let itemClass = 'astock-searchbar-item';
      const tipClass = 'astock-searchbar-tip';
      const iconClass = 'astock-searchbar-item-icon';
      // get reference to result columns object
      const columns = AdobeStock.RESULT_COLUMNS;
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
      // svg video icon
      const videoSvg = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 19 12" style="enable-background:new 0 0 19 12; width:19px; height:10px; fill:white;" xml:space="preserve"><g><path d="M17.8,0.8L13,3V0.8C13,0.4,12.6,0,12.2,0H0.8C0.4,0,0,0.4,0,0.8v10.4C0,11.6,0.4,12,0.8,12h11.4c0.4,0,0.8-0.4,0.8-0.8V 9l4.8,2.2c0.5,0.4,1.2,0,1.2-0.7v-9C19,0.9,18.3,0.5,17.8,0.8z"></path></g></svg>';
      // populate with images using html returned in json
      files.forEach((asset) => {
        // get url to details page on Stock and wrap inside affiliate tracking url
        const url = getTrackingUrl(asset[columns.DETAILS_URL]);
        // create div wrapper
        const div = document.createElement('div');
        div.className = itemClass;
        // create anchor with link to details
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        let thumb;
        // construct a different thumb element depending on asset type
        if (SB.videoSupport && asset[columns.MEDIA_TYPE_ID] === 4) {
          // create video and source tag
          const video = document.createElement('video');
          const source = document.createElement('source');
          Object.assign(video, {
            preload: 'none',
            poster: asset[columns.THUMBNAIL_URL],
            loop: 'loop',
          });
          // for some reason, cannot assign these properties
          video.setAttribute('muted', 'muted');
          video.setAttribute('onmouseover', 'this.play()');
          video.setAttribute('onmouseout', 'this.pause()');
          Object.assign(source, {
            src: asset[columns.VIDEO_SMALL_PREVIEW_URL],
            type: asset[columns.VIDEO_SMALL_PREVIEW_CONTENT_TYPE],
          });
          // add video source and set thumb as video
          video.appendChild(source);
          // add play icon
          const iconDiv = document.createElement('div');
          iconDiv.className = iconClass;
          const svg = document.createRange().createContextualFragment(videoSvg);
          iconDiv.appendChild(svg);
          div.appendChild(iconDiv);
          link.appendChild(video);
          // get html tag
          const tag = asset[columns.THUMBNAIL_HTML_TAG];
          // convert html string into dom element
          thumb = document.createRange().createContextualFragment(tag);
        } else {
          // get html tag
          const tag = asset[columns.THUMBNAIL_HTML_TAG];
          // convert html string into dom element
          thumb = document.createRange().createContextualFragment(tag);
        }
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
        // wrap link around image/video and add to document
        link.appendChild(thumb);
        div.insertBefore(link, div.lastChild);
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
      const imageColumns = [
        AdobeStock.RESULT_COLUMNS.THUMBNAIL_HTML_TAG,
        AdobeStock.RESULT_COLUMNS.DETAILS_URL,
        AdobeStock.RESULT_COLUMNS.NB_RESULTS,
      ];
      const videoColumns = [
        AdobeStock.RESULT_COLUMNS.TITLE,
        AdobeStock.RESULT_COLUMNS.THUMBNAIL_URL,
        AdobeStock.RESULT_COLUMNS.MEDIA_TYPE_ID,
        AdobeStock.RESULT_COLUMNS.VIDEO_SMALL_PREVIEW_URL,
        AdobeStock.RESULT_COLUMNS.VIDEO_SMALL_PREVIEW_CONTENT_TYPE,
      ];
      // if video support is enabled, include extra result columns
      const resultColumns = (SB.videoSupport) ? imageColumns.concat(videoColumns) : imageColumns;
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
        $searchBar.append($header);
        // extract search options and run search
        doSearch(parseFilters(SB.filters));
      },
      getFilters: () => { console.log(SB.filters); },
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
    // check for jQuery and load conditionally if version 1.9 or higher
    if (typeof window.jQuery === 'undefined' && !window.jQuery && (parseFloat(jQuery().jquery) >= 1.9)) {
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
