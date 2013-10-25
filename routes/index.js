module.exports = function(app, products) {

  app.get('/', function(req, res){
    res.render('index');
  });

  app.get('/cart', function(req, res, next){
    res.render('cart');
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
