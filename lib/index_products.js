module.exports = function(products) {
  var indexed_products = [];

  for (var category in products) {
    for (var model in products[category]) {
      var values = '';
      for (var key in products[category][model]) {
        var value = products[category][model][key];
        if (typeof(value) == 'string' || typeof(value) == 'number') values += value + ' ';
      }
      indexed_products.push({
        name: products[category][model].name,
        path: '/' + category + '/' + model,
        data: values.replace(/<([^>]+)>|\n/g, '').toLowerCase().trim()
      });
    }
  }

  return indexed_products;
};
