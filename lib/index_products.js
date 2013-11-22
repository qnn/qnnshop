var pinyin_index = require('pinyin_index');

module.exports = function(products) {
  var indexed_products = [];

  for (var category in products) {
    for (var model in products[category]) {
      var values = '';
      for (var key in products[category][model]) {
        var value = products[category][model][key];
        if (typeof(value) == 'string' || typeof(value) == 'number') values += value + ' ';
      }
      var data = values.replace(/<([^>]+)>|\n/g, '').toLowerCase().trim();
      var pinyin_indexed_data = pinyin_index(data);
      data += pinyin_indexed_data.full + ' ' + pinyin_indexed_data.abbr;
      indexed_products.push({
        name: products[category][model].name,
        path: '/' + category + '/' + model,
        data: data
      });
    }
  }

  return indexed_products;
};
