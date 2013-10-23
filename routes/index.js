module.exports = function(app, products) {

  app.get('/', function(req, res){
    res.render('index');
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
