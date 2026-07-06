// Mock DOM environment with jsdom-like setup
var jsdom = require('jsdom');
var JSDOM = jsdom.JSDOM;

// Simplified Google AI Overview HTML structure based on user's actual HTML
var testHTML = '<html><body>' +
'<div class="YzCcne" data-mg-cp="YzCcne" data-mcp="18">' +
  '<div class="n6owBd awi2gc">' +
    '<span>Striping Satria Fu original adalah </span>' +
    '<mark>stiker bodi bawaan pabrik untuk motor ' +
      '<a href="https://www.tokopedia.com/find/striping">Suzuki Satria Fu 150</a>' +
    '</mark>. Stiker ini dibuat khusus oleh pabrik untuk menyesuaikan bentuk bodi motor.' +
  '</div>' +
  '<div class="n6owBd awi2gc">' +
    'Berikut adalah ciri dan keunggulan striping original:' +
  '</div>' +
  '<div class="n6owBd awi2gc" aria-hidden="true">' +
    '<ul>' +
      '<li><strong>Presisi:</strong> Ukuran stiker sangat pas dengan lekuk bodi motor. Ini membuat stiker mudah dipasang.</li>' +
      '<li><strong>Bahan Berkualitas:</strong> Terbuat dari vinil yang tebal dan kuat. Bahan ini tahan lama, tahan air, dan warnanya tidak mudah pudar.</li>' +
      '<li><strong>Warna Cerah:</strong> Desain dan warna asli bawaan pabrik terlihat lebih tajam dan menyala. ' +
        '<a href="https://www.lazada.co.id/tag/striping">Lazada</a>' +
      '</li>' +
    '</ul>' +
  '</div>' +
  '<div class="n6owBd awi2gc" aria-hidden="true">' +
    'Biasanya, stiker ini dijual per set (lengkap untuk seluruh bodi kanan dan kiri). ' +
    'Banyak pemilik motor memakainya untuk mengembalikan tampilan motor seperti baru (restorasi) ' +
    'atau mempercantik tampilan standar motor. Anda bisa membelinya di ' +
    '<a href="https://www.tokopedia.com/find">toko onderdil</a>.' +
  '</div>' +
  '<div class="n6owBd awi2gc" aria-hidden="true">' +
    'Bisa beri tahu saya tahun berapa motor Satria Fu Anda dan apa warna dasar bodinya? ' +
    'Saya bisa bantu carikan informasi ketersediaan atau kisaran harga stiker originalnya!' +
  '</div>' +
'</div>' +
'</body></html>';

function extractGoogleOverview() {
  var MARKET = /shopee|bukalapak|lazada|tokopedia|tiktok\s*(shop|store)|blibli|jd\.id|olx/i;

  function clean(t) {
    return (t || '').trim().replace(/\s+/g, ' ');
  }

  function stripMarketLinks(el) {
    var clone = el.cloneNode(true);
    var links = clone.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].href || '';
      var text = links[i].textContent || '';
      if (MARKET.test(href) || MARKET.test(text)) {
        links[i].remove();
      }
    }
    var btns = clone.querySelectorAll('button');
    for (var b = 0; b < btns.length; b++) {
      btns[b].remove();
    }
    return clean(clone.textContent);
  }

  var contentBlocks = document.querySelectorAll('div.n6owBd.awi2gc');
  if (contentBlocks.length > 0) {
    var texts = [];
    for (var i = 0; i < contentBlocks.length; i++) {
      var t = stripMarketLinks(contentBlocks[i]);
      if (t.length > 20) {
        texts.push(t);
      }
    }
    if (texts.length) return joinOverview(texts, 150);
  }

  var overviewContainer = document.querySelector('.YzCcne[data-mg-cp]');
  if (overviewContainer) {
    var allText = stripMarketLinks(overviewContainer);
    if (allText.length > 50) return trimToSentences(allText, 150);
  }

  return '';
}

function joinOverview(arr, maxWords) {
  var result = '';
  for (var i = 0; i < arr.length; i++) {
    var next = result ? result + ' ' + arr[i] : arr[i];
    if (next.split(/\s+/).length > maxWords) break;
    result = next;
  }
  return result;
}

function trimToSentences(text, maxWords) {
  var sentences = text.split(/(?<=[.!?])\s+/);
  var result = '';
  for (var i = 0; i < sentences.length; i++) {
    var next = result ? result + ' ' + sentences[i] : sentences[i];
    if (next.split(/\s+/).length > maxWords) break;
    result = next;
  }
  return result || text.substring(0, maxWords * 6);
}

var dom = new JSDOM(testHTML);
global.document = dom.window.document;

var result = extractGoogleOverview();
console.log('=== RESULT ===');
console.log(result);
console.log('=== WORD COUNT ===');
console.log(result.split(/\s+/).length + ' words');
console.log('=== HAS MARKETPLACE? ===');
console.log(/shopee|tokopedia|lazada|blibli/i.test(result) ? 'YES (BAD)' : 'NO (GOOD)');
