# Stock SearchBar sample app

When dropped into your page, this sample library creates a gallery of Stock search thumbnails. While you can add different search parameters, it is designed to search on a similar image URL (such as the main image on your page), or on keywords. 

## Responsive demo
http://cfsdemos.com/stock/demos/searchbar/sdk_searchbar1.html

## Register
Before you use the sample, you will need to register for an [Adobe Stock API key](https://console.adobe.io/integrations). Also, if you want to get paid for referral traffic, sign up to become an [Adobe affiliate](https://www.adobe.com/affiliates.html). Otherwise, you will not receive credit for traffic you generate.

For more information about the Stock API and the SDK, see [Getting Started](https://www.adobe.io/apis/creativecloud/stock/docs/getting-started.html).

## Install
All files are pre-built in the dist folder, otherwise you can run `npm install` and `npm run build` to build your own copy. The library includes minified versions of jQuery, Masonry, and the Adobe Stock SDK for JavaScript; these are not dependencies of the main script and are not built, but are required to reside in the same folder. You can supply your own versions if you prefer. The script will load jQuery if it does not detect it already loaded.

Copy all files to a folder on your server and include this embed code in your page. The gallery will build itself inside a container on your page.

```javascript
<!-- Begin Stock SearchBar -->
  <!-- SearchBar container -->
  <div id="astock-searchbar" class="astock-searchbar unfloat"></div>
  <!-- SearchBar styles -->
  <link rel="stylesheet" type="text/css" href="./sdk_searchbar_styles.min.css">
  <!-- SearchBar script include -->
  <script type="text/javascript" src="./sdk_searchbar-1.0.min.js"></script>
  <script type="text/javascript">
    StockSearchBar.init({
      // container where SearchBar will appear
      contId: '#astock-searchbar',
      // additional filters
      filters: {
        // first param is CSS selector of element containing keywords
        // second param is how many keywords to include
        WORDS: ['title', 3],
        // for high contrast, use '000000,ffffff'
        FILTERS_COLORS: '',
        /* To enable search on similar url:
         * Enter selector of parent element containing image
         * leave blank or remove to disable */
        SIMILAR_URL: '',
        THUMBNAIL_SIZE: 220,
        LIMIT: 16,
      },
      // Stock api key registered on console.adobe.io
      // DO NOT USE THIS ONE!
      apiKey: 'b3f036780e4148b6a3f845bbe4c6de45',
      // Name you choose for app (whatever you want)
      appName: 'Stock-Searchbar/1.0',
      // Your affiliate data--Change these values to receive credit!
      programID: 264355,
      advertiserID: 3014001,
      adID: 22804962,
    });
  </script>
  <!-- End Stock SearchBar -->
```

## Configure
To configure different search parameters, see the [Stock JavaScript API SDK](https://github.com/adobe/stock-api-libjs). Styles can be configured in sdk_searchbar_styles.css.
