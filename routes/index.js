module.exports = function(app, products) {

  app.get('/', function(req, res){
    res.render('index');
  });

  app.get('/cart', function(req, res, next){
    res.render('cart');
  });

  app.post('/checkout', function(req, res, next){
    var verified = [];
    try {
      var data = JSON.parse(req.body.data);
      if (data instanceof Array == false) throw ['购物车上没有商品，无法结账。'];

      var data_length = data.length;
      if (data_length > 50) throw ['购物车商品种类不应超过50种。'];

      for (var i = 0; i < data_length; i++) {
        var item = data[i];
        var quantity = item.quantity;
        if (!/^\d+$/.test(quantity) || quantity <= 0 || quantity > 50) throw ['每种商品购买数量不应超过50件。'];

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

      if (verified.length == 0) throw ['购物车上没有商品，无法结账。'];
      if (data_length != verified.length) throw ['购物车上至少有一种商品已过时或已发生改变。'];

      res.render('checkout', { products: verified });
    } catch (errors) {
      res.render('checkout_error', { errors: errors instanceof Array ? errors : null });
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
