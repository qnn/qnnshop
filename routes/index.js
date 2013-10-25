module.exports = function(app, products) {

  app.get('/', function(req, res){
    res.render('index');
  });

  app.post('/cart', function(req, res, next){
    var category = req.body.category, model = req.body.model;
    if (category && model && products[category] && products[category][model]) {
      res.render('products/show', { products: products, category: category, model: model });
    } else {
      res.send(500);
    }
  });

  app.get('/:category/:model', function(req, res, next){
    var category = req.params.category, model = req.params.model;
    if (products[category] && products[category][model]) {
      res.render('products/show', { products: products, category: category, model: model });
    } else {
      next();
    }
  });

};
