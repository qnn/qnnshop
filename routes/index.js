module.exports = function(app, products) {

  app.get('/', function(req, res){
    res.render('index');
  });

  app.get('/cart', function(req, res, next){
    res.render('cart');
  });

  app.post('/checkout', function(req, res, next){
    var data;
    var data_length = 0;
    var verified = [];
    try {
      data = JSON.parse(req.body.data);
    } catch(e) {}
    if (data instanceof Array) {
      data_length = data.length;
      for (var i = 0; i < data.length; i++) {
        var item = data[i];
        var quantity = item.quantity;
        if (!/^\d+$/.test(quantity) || quantity <= 0 || quantity > 50) continue;

        var category = item.category, model = item.model;
        if (products[category] && products[category][model]) {
          var output = products[category][model];
          if (item.price != output.price) continue;
          output['category'] = category;
          output['model'] = model;
          output['image'] = output['images'] ? output['images'][0] : null;
          output['path'] = '/' + category + '/' + model;
          output['quantity'] = quantity;
          verified.push(output);
        }
      }
    }
    if (data_length != verified.length) {
      res.render('checkout_error');
    } else {
      res.render('checkout', { products: verified });
    }
  });

  app.get('/:category/:model', function(req, res, next){
    var category = req.params.category, model = req.params.model;
    if (products[category] && products[category][model]) {
      res.format({
        json: function(){
          var output = products[category][model];
          output['category'] = category;
          output['model'] = model;
          output['image'] = output['images'] ? output['images'][0] : null;
          output['path'] = '/' + category + '/' + model;
          res.send(output);
        },
        html: function(){
          res.render('products/show', { products: products, category: category, model: model });
        }
      });
    } else {
      next();
    }
  });

};
