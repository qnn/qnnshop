module.exports = function(app, products, configs) {

  app.get('/:static(about|contact|tips|choose)', function(req, res){
    res.render('static/' + req.params.static, { belongs_to: req.params.static });
  });

  app.get('/products', function(req, res) {
    res.render('static/find_products', { products: products, belongs_to: 'products' });
  });

};
