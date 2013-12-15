module.exports = function(app, products, configs) {

  app.use(function(req, res, next){
    res.locals.captcha_enabled = app.enabled('captcha');
    res.locals.csrf_token = req.csrfToken();
    res.locals.current_user = (req.user && req.user._id) ? req.user : null;
    res.locals.current_admin = (req.user && req.user.is_admin) ? req.user : null;
    res.locals.products = products;
    if (!req.session.messages) req.session.messages = [];
    res.locals.session = req.session;
    next();
  });

  require('./admin')(app, products, configs);
  require('./static')(app, products, configs);

  app.get('/', function(req, res){
    res.render('index');
  });

  // for POST-only pages, we don't want it be 404
  // redirect to home if you click log out link and refresh the page using GET
  app.get('/:page(logout|checkout|confirm_checkout)', function(req, res){
    res.redirect('/');
  });

  var generate_captcha = function(){
    return Math.random().toString().substr(3, 6);
  };

  app.get('/captcha.png', function(req, res){
    var Canvas = require('canvas');
    var canvas = new Canvas(200, 50);
    var context = canvas.getContext('2d');
    context.fillStyle = 'rgb(50,50,50)';
    context.strokeStyle = context.fillStyle;
    for (var i = 0; i < 3; i++) {
      context.moveTo(10, Math.random() * 50);
      context.bezierCurveTo(70, Math.random() * 50, 130, Math.random() * 50, 190, Math.random() * 50);
      context.stroke();
    }
    var text = generate_captcha();
    for (i = 0; i < text.length; i++) {
      context.setTransform(Math.random() * 0.7 + 0.9, Math.random() * 0.4,
        Math.random() * 0.4, Math.random() * 0.5 + 1, 30 * i + 10, 40);
      context.font = (Math.random() * 10 > 7 ? 'bold ' : '') + '40px sans';
      context.fillText(text.charAt(i), 0, 0);
    }
    canvas.toBuffer(function(err, buf) {
      req.session.captcha = text;
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", 0);
      res.end(buf);
    });
  });

  app.get('/login', function(req, res){
    if (req.user && req.user._id) {
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
      var wrong = function(){
        req.session.messages.push({ error: '手机/电话号码或密码错误。' });
        return done(null, false);
      };
      if (app.enabled('captcha')) {
        if (!req.body.captcha || req.body.captcha != req.session.captcha) {
          req.session.messages.push({ error: '验证码输入错误。' });
          req.session.captcha = generate_captcha();
          return done(null, false);
        }
      }
      if (!/^[0-9+\-]{10,25}$/.test(username)) return wrong();
      if (!/^[A-Za-z0-9!@#$%^&*+\-]{6,16}$/.test(password)) return wrong();
      var User = require('../models/user');
      User.findOne({ username: username }, function(err, user){
        if (err) return done(err);
        if (!user) return wrong();
        var bcrypt = require('bcrypt');
        if (!bcrypt.compareSync(password, user.password)) return wrong();
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
    if (req.user && req.user._id) {
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
    if (!req.user || !req.user._id) return next();
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
        if (!/^[A-Za-z0-9!@#$%^&*+\-]{6,16}$/.test(new_password)) throw ['新密码输入错误。'];
        var bcrypt = require('bcrypt');
        if (bcrypt.compareSync(password, req.user.password)) {
          var salt = bcrypt.genSaltSync(10);
          var hash = bcrypt.hashSync(new_password, salt);
          req.user.password = hash;
          req.user.password_updated_at = new Date();
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

      if (alias !== '' && !/^[\u4E00-\u9FA5A-Za-z0-9_\-]{1,20}$/.test(alias)) throw ['不是有效的显示名。'];
      if (!/^[\u4E00-\u9FA5A-Za-z\s]{1,20}$/.test(name)) throw ['不是有效的收货人名字。'];
      if (!/^[0-9+\-]{10,25}$/.test(phone)) throw ['不是有效的收货人联系电话。'];
      if (!/^[\u4E00-\u9FA5A-Za-z\s0-9\-\(\)]{2,100}$/.test(address)) throw ['不是有效的收货人地址。'];
      if (email !== '' && !/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)) throw ['不是有效的电邮地址。'];

      if (province == '' || city == '' || district == '') {
        province = undefined;
        city = undefined;
        district = undefined;
      }
      var valid_districts = verify_districts(province, city, district);

      req.user.alias = alias;
      req.user.defaults.name = name;
      req.user.defaults.phone = phone;
      req.user.defaults.districts = valid_districts;
      req.user.defaults.address = address;
      req.user.defaults.email = email;
      req.user.updated_at = new Date();
      req.user.save();

      req.session.messages.push({ success: '成功更新账户资料。' });
    } catch (errors) {
      for (var i = 0; i < errors.length; i++) {
        req.session.messages.push({ error: errors[i] });
      }
    }
    res.redirect('/my_account');
  });

  app.get('/orders/:order_id/success', function(req, res, next){
    // var log = function(what) {
    //   require('fs').appendFile(__dirname + '/log', JSON.stringify(what) + '\n', function(){});
    // };
    // log(req.query);

    // first verification
    var blacklist = [ 'sign_type', 'sign' ];
    var query = [];
    for (var key in req.query) {
      if (blacklist.indexOf(key) === -1) {
        query.push(key + '=' + req.query[key]);
      }
    }
    query.sort();
    query = query.join('&') + configs.secrets.alipayconfigs.key;
    var md5 = require('crypto').createHash('md5').update(query, 'UTF-8').digest('hex');
    var user_hash = req.query.extra_common_param;

    if (md5 !== req.query.sign || !user_hash) {
      req.session.messages.push({ error: '支付过程出现错误，如有问题请咨询客服。' });
      res.redirect('/orders/' + order_id);
      return;
    }

    // second verification
    var order_id = req.params.order_id;
    var Order = require('../models/order');
    var User = require('../models/user');
    Order.findOne({ _id: order_id, status: { $in: configs.payable_statuses } }).populate('_user').exec(function(error, order){
      try {
        if (error || !order || !order._id) throw null;
        var order_user_hash = require('crypto').createHash('md5').update(order._user._id + order._user.password, 'UTF-8').digest('hex');
        // log([order_user_hash, user_hash]);
        if (order_user_hash !== user_hash) throw null;

        var payment_details = '---- ' + (new Date).toJSON().replace(/\.\d+/,'') + ' ----\n';
        var statuses = function(s, st) {
          return s.hasOwnProperty(st) ? s[st] + '（' + st + '）' : st;
        };
        payment_details += '支付宝交易号：' + req.query.trade_no + '\n';
        payment_details += '交易状态：' + statuses({
          TRADE_FINISHED: '交易完成',
          TRADE_SUCCESS: '支付成功',
          WAIT_BUYER_PAY: '交易创建',
          TRADE_CLOSED: '交易关闭'
        }, req.query.trade_status) + '\n';
        payment_details += '交易金额：' + req.query.total_fee + '\n';
        payment_details += '卖家支付宝ID：' + req.query.seller_id + '\n';
        payment_details += '买家支付宝ID：' + req.query.buyer_id + '\n';
        payment_details += '卖家支付宝账号：' + req.query.seller_email + '\n';
        payment_details += '买家支付宝账号：' + req.query.buyer_email + '\n';
        payment_details += '商品名称：' + req.query.subject + '\n';
        payment_details += '商品描述：' + req.query.body + '\n';
        payment_details += '------------------------------\n';
        order.status = configs.status_if_user_paid;
        if (!order.payment_details) order.payment_details = '';
        order.payment_details += payment_details;
        // log(order.payment_details);
        order.save();
        req.session.messages.push({ success: '交易成功。' });
        res.redirect('/orders/' + order_id);
      } catch (error) {
        // log(error);
        req.session.messages.push({ error: '支付过程出现错误，如有问题请咨询客服。' });
        res.redirect('/orders/' + order_id);
      }
    });
  });

  app.get('/orders/:order_id?/:action?', function(req, res, next){
    var order_id = req.params.order_id;
    var action = req.params.action;
    if (req.user && req.user._id) {
      var Order = require('../models/order');
      var find = { _user: req.user._id };
      if (order_id) find = { _user: req.user._id, _id: order_id };
      var cancelable = function(status) {
        return configs.cancelable_statuses.indexOf(status) > -1;
      };
      Order.find(find).sort('-created_at').exec(function(error, orders){
        if (error) return next();
        if (order_id) {
          if (!orders || orders.length != 1) return next();
          switch (action) {
          case 'cancel':
            res.render('orders_cancel', { orders: orders, user: req.user, configs: configs, cancelable: cancelable });
            break;
          case 'payment_details':
            res.send({ payment_details: orders[0].payment_details });
            break;
          case undefined:
            res.render('orders', { orders: orders, user: req.user, configs: configs, is_single: true, cancelable: cancelable });
            break;
          default:
            next();
          }
        } else {
          var items_per_page = 5;
          var total_items = orders.length;
          var total_pages = Math.ceil(total_items / items_per_page);
          var current_page = 1;
          if (req.query.page && /^([1-9]|[1-9][0-9]+)$/.test(req.query.page)) {
            if (req.query.page <= total_pages) current_page = req.query.page;
          }
          var start = (current_page - 1) * items_per_page;
          orders = orders.slice(start, start + items_per_page);
          res.render('orders', { orders: orders, user: req.user, configs: configs, is_single: false,
            current_page: current_page, total_pages: total_pages, total_items: total_items, cancelable: cancelable });
        }
      });
    } else {
      req.session.returnTo = '/orders' + (order_id ? '/' + order_id + (action ? '/' + action : '') : '');
      res.redirect('/login');
    }
  });

  app.post('/orders/:order_id/cancel', function(req, res, next){
    var order_id = req.params.order_id;
    if (req.user && req.user._id) {
      var Order = require('../models/order');
      Order.findOne({ _user: req.user._id, _id: order_id, status: { $in: configs.cancelable_statuses } }, function(error, order){
        try {
          if (error || !order || !order._id) throw null;
          var reason_opts = req.body.reason_opts ? req.body.reason_opts.trim() : '';
          var reason = req.body.reason ? req.body.reason.trim() : '';
          var password = req.body.password;
          var bcrypt = require('bcrypt');
          if (reason_opts.length > 20000) throw '取消原因过长，最多能包含20000个字符。';
          if (reason.length > 20000) throw '取消原因过长，最多能包含20000个字符。';
          if (!password || !bcrypt.compareSync(password, req.user.password)) throw '密码不正确。';
          order.status = configs.buyer_cancel_status;
          order.buyer_comments += '\n取消原因：' + (reason ? reason : (reason_opts ? reason_opts : '(无)'));
          order.updated_at = new Date();
          order.save();
          req.session.messages.push({ success: '订单已取消。' });
          res.redirect('/orders/' + order_id);
        } catch (error) {
          req.session.messages.push({ error: typeof(error) == 'string' ? error : '发生未知错误。' });
          res.redirect('/orders/' + order_id);
        }
      });
    } else {
      next();
    }
  });

  app.post('/orders/:order_id/alipay', function(req, res, next){
    var order_id = req.params.order_id;
    if (req.user && req.user._id) {
      var Order = require('../models/order');
      Order.findOne({ _user: req.user._id, _id: order_id, status: { $in: configs.payable_statuses } }, function(error, order){
        try {
          if (error || !order || !order._id) throw null;
          if (order.payment !== configs.alipay) throw null;

          var price = 0;
          var body = '收货人：' + order.username + '；联系电话：' + order.phone + '；';
          body += '地址：' + order.districts.join(' ') + ' ' + order.address + '；';
          body += '备注：' + (order.buyer_comments || '(无)') + '；';
          body += '购买的商品：';
          for (var i = 0; i < order.products.length; i++) {
            var total = order.products[i].price * order.products[i].quantity;
            price += total;
            body += order.products[i].title + '（单价：' + parseFloat(order.products[i].price).toFixed(2) + '元，数量：' + order.products[i].quantity + '）、';
          }
          body = body.replace(/、$/, '') + '；';
          if (order.final_price >= 0) {
            var diff = order.final_price - price;
            price = order.final_price;
            if (diff != 0) {
              body += '价格调整：' + (diff > 0 ? '+' : '-') + parseFloat(Math.abs(diff)).toFixed(2) + '元；';
            }
          }
          body += '订单合计' + price + '元。';

          var process = function(key) {
            var user_hash = require('crypto').createHash('md5').update(req.user._id + req.user.password, 'UTF-8').digest('hex');
            var query = [
              [ '_input_charset', 'utf-8' ],
              [ 'partner', configs.secrets.alipayconfigs.pid ],
              [ 'seller_email', configs.secrets.alipayconfigs.seller_email ],
              [ 'payment_type', '1' ],

              [ 'service', 'create_direct_pay_by_user' ],

              [ 'out_trade_no', order._id ],
              [ 'subject', configs.alipayconfigs.subject.replace('{{id}}', order._id) ],
              [ 'body', body ],
              [ 'total_fee', parseFloat(price).toFixed(2) ],

              [ 'return_url', configs.alipayconfigs.return_url.replace('{{id}}', order._id) ],
              [ 'show_url', configs.alipayconfigs.show_url.replace('{{id}}', order._id) ],

              [ 'anti_phishing_key', key ],
              [ 'exter_invoke_ip', req.ip ],
              [ 'extra_common_param', user_hash ]
            ];
            query.sort(function(a, b) {
              return a[0] > b[0] ? 1 : -1;
            });
            var sign = [];
            for (var i = 0; i < query.length; i++) {
              sign.push(query[i][0] + '=' + query[i][1]);
            }
            sign = sign.join('&') + configs.secrets.alipayconfigs.key;
            var md5 = require('crypto').createHash('md5').update(sign, 'UTF-8').digest('hex');
            query.push([ 'sign', md5 ]);
            query.push([ 'sign_type', 'MD5' ]);
            for (var i = 0; i < query.length; i++) {
              query[i] = query[i][0] + '=' + encodeURIComponent(query[i][1]);
            }
            query = query.join('&')
            var url = configs.alipayconfigs.gateway + '?' + query;
            res.send({ redirect: url });
          };

          var https = require('https');
          https.get(configs.alipayconfigs.gateway + '?service=query_timestamp&_input_charset=utf-8&partner=' + configs.secrets.alipayconfigs.pid, function(response) {
            var data = '';
            response.on('data', function(chunk) {
              data += chunk;
            });
            response.on('end', function() {
              process(/<encrypt_key>(.*)<\/encrypt_key>/.exec(data)[1]);
            });
          }).on('error', function() {
            next();
          });
        } catch (error) {
          next();
        }
      });
    } else {
      next();
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
        res.render('checkout', { products: verified, _data: req.body.data, configs: configs });
      });
    };
    var render_login_form = function(){
      res.render('login_or_not', { _data: req.body.data });
    };
    var ignore_login = req.body.new == 'yes';
    if ((req.user && req.user._id) || ignore_login) {
      user_logged_in_checkout();
    } else {
      if (req.body.username && req.body.password && (!app.enabled('captcha') || req.body.captcha)) {
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
            res.locals.current_user = (req.user && req.user._id) ? req.user : null;
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
      if (app.enabled('captcha')) {
        if (!req.body.captcha || req.body.captcha != req.session.captcha) {
          req.session.captcha = generate_captcha();
          throw ['验证码输入错误。'];
        }
      }

      var name = req.body.shipping_user_name;
      var phone = req.body.shipping_user_phone;
      var address = req.body.shipping_address;
      var province = req.body.province;
      var city = req.body.city;
      var district = req.body.district;
      var email = req.body.shipping_user_email;
      var payment = req.body.payment;
      var comments = req.body.comments;
      var invoice = '';

      if (name) name = name.trim();
      if (phone) phone = phone.trim();
      if (address) address = address.trim();
      if (province) province = province.trim();
      if (city) city = city.trim();
      if (district) district = district.trim();
      if (email) email = email.trim();
      if (comments) comments = comments.trim();

      if (!name || !phone || !address) throw ['收货人、联系电话、收货地址均不能为空。'];
      if (!/^[\u4E00-\u9FA5A-Za-z\s]{1,20}$/.test(name)) throw ['不是有效的收货人名字。'];
      if (!/^[0-9+\-]{10,25}$/.test(phone)) throw ['不是有效的收货人联系电话。'];
      if (!/^[\u4E00-\u9FA5A-Za-z\s0-9\-\(\)]{2,100}$/.test(address)) throw ['不是有效的收货人地址。'];
      if (email !== '' && !/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)) throw ['不是有效的电邮地址。'];
      if (comments.length > 20000) throw ['买家备注过长，最多能包含20000个字符。'];
      if (configs.invoice_enabled) {
        invoice = req.body.invoice ? req.body.invoice.trim() : '';
        if (!/^[\u4E00-\u9FA5A-Za-z\s]{1,20}$/.test(invoice)) throw ['不是有效的发票抬头。'];
      }

      var valid_districts = verify_districts(province, city, district);

      switch (payment) {
      case 'cod': break;
      case 'alipay': break;
      default: throw ['请选择支付方式。'];
      }
    } catch (errors) {
      render_errors(res, errors);
      return;
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
        var payment_method, status;
        switch (payment) {
        case 'cod':
          payment_method = '货到付款';
          status = configs.cod_initial_status;
          break;
        case 'alipay':
          payment_method = configs.alipay;
          status = configs.payment_initial_status;
          break;
        default:
          payment_method = '';
          status = configs.payment_initial_status;
        }
        var new_order = new Order({
          _user: user._id,
          status: status,
          payment: payment_method,
          products: _products,
          username: name,
          phone: phone,
          districts: valid_districts,
          address: address,
          email: email,
          buyer_comments: comments,
          invoice: invoice
        });
        new_order.id_str = new_order._id;
        new_order.save(function (error) {
          if (error) {
            render_errors(res, ['创建订单时出错。']);
          } else {
            req.session.messages.push({ success: '成功创建订单。' });
            req.logIn(user, function(error){
              res.locals.current_user = (req.user && req.user._id) ? req.user : null;
              req.session.empty_cart = true;
              res.redirect('/orders/'+new_order._id);
            });
          }
        });
      };
      if (req.user && req.user._id) {
        create_new_order(req.user);
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

  app.get('/search/:query?', function(req, res, next){
    var query = req.params.query ? req.params.query.trim().toLowerCase() : '';
    var results = [];
    if (query) {
      var indexed_products = app.get('indexed_products');
      for (var i = 0; i < indexed_products.length; i++) {
        if (indexed_products[i].data.indexOf(query) > -1) {
          results.push({
            name: indexed_products[i].name,
            path: indexed_products[i].path
          });
          if (results.length >= 5) break;
          continue;
        }
      }
    }
    res.format({
      json: function(){
        res.send(results);
      }
    });
  });

  app.get('/:category/:model', function(req, res, next){
    var category = req.params.category, model = req.params.model;
    if (products[category] && products[category][model]) {
      res.format({
        json: function(){
          res.send(products[category][model]);
        },
        html: function(){
          var markdown = require('marked');
          res.render('products/show', { category: category, model: model, markdown: markdown });
        }
      });
    } else {
      next();
    }
  });

  app.use(function(err, req, res, next){
    switch (err.status) {
    case 403:
      return res.status(403).render('errors/403');
    default:
      return next();
    }
  });

  app.use(function(req, res){
    res.status(404).render('errors/404');
  });

};
