module.exports = function(app, products) {

  app.use(function(req, res, next){
    res.locals.current_user = req.user;
    res.locals.products = products;
    if (!req.session.messages) req.session.messages = [];
    res.locals.messages = req.session.messages;
    next();
  });

  app.get('/', function(req, res){
    res.render('index');
  });

  // for POST-only pages, we don't want it be 404
  // redirect to home if you click log out link and refresh the page using GET
  app.get('/:page(logout|checkout|confirm_checkout)', function(req, res){
    res.redirect('/');
  });

  app.get('/login', function(req, res){
    if (req.user) {
      res.redirect('/my_account');
    } else {
      res.render('login');
    }
  });

  var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;
  passport.use(new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true
    },
    function(req, username, password, done) {
      var User = require('../models/user');
      User.findOne({ username: username }, function(err, user){
        if (err) return done(err);
        if (!user) {
          req.session.messages.push({ error: '手机/电话号码或密码错误。' });
          return done(null, false);
        }
        var bcrypt = require('bcrypt');
        if (!bcrypt.compareSync(password, user.password)) {
          req.session.messages.push({ error: '手机/电话号码或密码错误。' });
          return done(null, false);
        }
        if (user.last_logged_in_at instanceof Array) {
          user.last_logged_in_at.unshift(new Date);
          user.last_logged_in_at.splice(3);
        } else {
          user.last_logged_in_at = [new Date];
        }
        user.save();
        req.session.messages.push({ success: '成功登录。' });
        return done(null, user);
      });
    }
  ));
  passport.serializeUser(function(user, done) {
    done(null, user.username);
  });
  passport.deserializeUser(function(username, done) {
    var User = require('../models/user');
    User.findOne({ username: username }, function(err, user) {
      done(err, user);
    });
  });

  app.post('/login', passport.authenticate('local', { successReturnToOrRedirect: '/', failureRedirect: '/login' }));

  app.post('/logout', function(req, res){
    req.logout();
    req.session.messages.push({ success: '成功退出。' });
    res.send(200);
  });

  app.get('/my_account', function(req, res){
    if (req.user) {
      res.render('my_account');
    } else {
      req.session.returnTo = '/my_account';
      res.redirect('/login');
    }
  });

  var verify_districts = function(province, city, district) {
    var valid_districts = [];
    if (province != undefined) {
      var districts = require('../public/js/districts.tree.json');
      if (!districts.hasOwnProperty(province)) throw ['错误的省份。'];
      valid_districts.push(province);
      if (city != undefined) {
        if (!districts[province].hasOwnProperty(city) && 
            (districts[province] instanceof Array && districts[province].indexOf(city) == -1)) throw ['错误的城市。'];
        valid_districts.push(city);
        if (district != undefined) {
          if (!districts[province][city].hasOwnProperty(district) && 
              (districts[province][city] instanceof Array && districts[province][city].indexOf(district) == -1)) throw ['错误的城区。'];
          valid_districts.push(district);
        }
      }
    }
    return valid_districts;
  }

  app.post('/my_account', function(req, res, next){
    var user = req.user;
    if (!user) return next();
    try {
      var alias = req.body.alias;
      var name = req.body.shipping_user_name;
      var phone = req.body.shipping_user_phone;
      var address = req.body.shipping_address;
      var province = req.body.province;
      var city = req.body.city;
      var district = req.body.district;
      var email = req.body.shipping_user_email;
      var password = req.body.password;
      var new_password = req.body.new_password;
      var new_password_again = req.body.new_password_again;

      if (password && new_password) {
        if (new_password !== new_password_again) throw ['新密码输入错误。'];
        if (!/^[A-Za-z0-9!@#$%^&*]{6,16}$/.test(new_password)) throw ['新密码输入错误。'];
        var bcrypt = require('bcrypt');
        if (bcrypt.compareSync(password, user.password)) {
          var salt = bcrypt.genSaltSync(10);
          var hash = bcrypt.hashSync(new_password, salt);
          user.password = hash;
          user.password_updated_at = new Date();
        } else {
          throw ['旧密码错误'];
        }
      }

      if (alias) alias = alias.trim();
      if (name) name = name.trim();
      if (phone) phone = phone.trim();
      if (address) address = address.trim();
      if (province) province = province.trim();
      if (city) city = city.trim();
      if (district) district = district.trim();
      if (email) email = email.trim();

      if (alias !== '' && !/^[\u4E00-\u9FA5A-Za-z0-9_\-]{1,20}$/.test(alias)) throw ['别名只能由1至20个中英文、数字、下划线和减号组成。'];
      if (name.length > 10) throw ['收货人名字过长。'];
      if (phone.length > 20) throw ['收货人联系电话过长。'];
      if (address.length > 100) throw ['收货人地址过长。'];
      if (email !== '' && !/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)) throw ['不是有效的电邮地址。'];

      if (province == '' || city == '' || district == '') {
        province = undefined;
        city = undefined;
        district = undefined;
      }
      var valid_districts = verify_districts(province, city, district);

      user.alias = alias;
      user.defaults.name = name;
      user.defaults.phone = phone;
      user.defaults.districts = valid_districts;
      user.defaults.address = address;
      user.defaults.email = email;
      user.updated_at = new Date();
      user.save();

      req.session.messages.push({ success: '成功更新账户资料。' });
    } catch (errors) {
      for (var i = 0; i < errors.length; i++) {
        req.session.messages.push({ error: errors[i] });
      }
    }
    res.redirect('/my_account');
  });

  app.get('/orders', function(req, res, next){
    var user = req.user;
    if (user) {
      var Order = require('../models/order');
      Order.find({ _user: user._id }).sort('-created_at').exec(function(error, orders){
        res.render('orders', { orders: orders, user: user });
      });
    } else {
      req.session.returnTo = '/orders';
      res.redirect('/login');
    }
  });

  app.get('/cart', function(req, res, next){
    res.render('cart');
  });

  var render_errors = function(res, errors){
    res.render('checkout_error', { errors: errors instanceof Array ? errors : null });
  };

  var verify_products = function(req, res, done){
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

      done(verified);
    } catch (errors) {
      render_errors(res, errors);
    }
  };

  app.post('/checkout', function(req, res, next){
    var user_logged_in_checkout = function(){
      verify_products(req, res, function(verified){
        res.render('checkout', { products: verified, _data: req.body.data });
      });
    };
    var render_login_form = function(){
      res.render('login_or_not', { _data: req.body.data });
    };
    var ignore_login = req.body.new == 'yes';
    if (req.user || ignore_login) {
      user_logged_in_checkout();
    } else {
      if (req.body.username && req.body.password) {
        passport.authenticate('local', function(err, user, info) {
          if (err || !user) {
            render_login_form();
            return;
          }
          req.logIn(user, function(error){
            if (error) {
              render_login_form();
              return;
            }
            res.locals.current_user = req.user;
            user_logged_in_checkout();
          });
        })(req, res, next);
      } else {
        render_login_form();
      }
    }
  });

  app.post('/confirm_checkout', function(req, res){
    try {
      var name = req.body.shipping_user_name;
      var phone = req.body.shipping_user_phone;
      var address = req.body.shipping_address;
      var province = req.body.province;
      var city = req.body.city;
      var district = req.body.district;
      var email = req.body.shipping_user_email;

      if (name) name = name.trim();
      if (phone) phone = phone.trim();
      if (address) address = address.trim();
      if (province) province = province.trim();
      if (city) city = city.trim();
      if (district) district = district.trim();
      if (email) email = email.trim();

      if (!name || !phone || !address) throw ['收货人、联系电话、收货地址均不能为空。'];
      if (name.length > 10) throw ['收货人名字过长。'];
      if (phone.length > 20) throw ['收货人联系电话过长。'];
      if (address.length > 100) throw ['收货人地址过长。'];
      if (email !== '' && !/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)) throw ['不是有效的电邮地址。'];

      var valid_districts = verify_districts(province, city, district);
    } catch (errors) {
      render_errors(res, errors);
    }
    verify_products(req, res, function(verified){
      var Order = require('../models/order');
      var User = require('../models/user');
      var _products = [];
      for (var i = 0; i < verified.length; i++) {
        _products.push({
          title: verified[i].title,
          category: verified[i].category,
          model: verified[i].model,
          price: verified[i].price,
          quantity: verified[i].quantity
        });
      }
      var create_new_order = function(user) {
        var new_order = new Order({
          _user: user._id,
          status: '等待买家付款',
          products: _products,
          username: name,
          phone: phone,
          districts: valid_districts,
          address: address,
          email: email
        });
        new_order.save(function (error) {
          if (error) {
            render_errors(res, ['创建订单时出错。']);
          } else {
            res.send(200);
          }
        });
      };
      var current_user = req.user;
      if (current_user) {
        create_new_order(current_user);
      } else {
        User.findOne({ username: phone }, function(error, user){
          if (error || user) {
            render_errors(res, ['您是注册用户，请先登录。']);
            return;
          }
          var bcrypt = require('bcrypt');
          bcrypt.genSalt(10, function(error, salt) {
            if (error) {
              render_errors(res, ['创建用户时出错。']);
              return;
            }
            bcrypt.hash(phone, salt, function(error, hash) {
              if (error) {
                render_errors(res, ['创建用户时出错。']);
                return;
              }
              var new_user = new User({
                username: phone,
                password: hash,
                alias: name,
                defaults: {
                  name: name,
                  phone: phone,
                  districts: valid_districts,
                  address: address,
                  email: email
                }
              });
              new_user.save(function (error) {
                if (error) {
                  render_errors(res, ['创建用户时出错。']);
                  return;
                }
                create_new_order(new_user);
              });
            });
          });
        });
      }
    });
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
          res.render('products/show', { category: category, model: model });
        }
      });
    } else {
      next();
    }
  });

};
