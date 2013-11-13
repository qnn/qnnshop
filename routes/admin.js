module.exports = function(app, products, configs) {

  var generate_captcha = function(){
    return Math.random().toString().substr(3, 6);
  };

  app.get('/SysAdmin', function(req, res, next){
    if (req.user && req.user.is_admin) {
      res.render('admin/index', { admin: req.user });
    } else {
      req.session.returnTo = '/SysAdmin';
      res.redirect('/SysAdmin/login');
    }
  });

  app.get('/SysAdmin/login', function(req, res, next){
    res.render('admin/login');
  });

  var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;
  passport.use('local-admin', new LocalStrategy({
      usernameField: 'admin_username',
      passwordField: 'admin_password',
      passReqToCallback: true
    },
    function(req, username, password, done) {
      var wrong = function(){
        req.session.messages.push({ error: '用户名或密码错误。' });
        return done(null, false);
      };
      if (!req.body.captcha || req.body.captcha != req.session.captcha) {
        req.session.messages.push({ error: '验证码输入错误。' });
        req.session.captcha = generate_captcha();
        return done(null, false);
      }
      if (!/^[A-Za-z0-9_\-]{3,20}$/.test(username)) return wrong();
      if (!/^[A-Za-z0-9!@#$%^&*+\-]{6,16}$/.test(password)) return wrong();
      var show_wrong = true, user = null;
      for (var i = 0; i < configs.admins.length; i++) {
        if (configs.admins[i].username == username) {
          var bcrypt = require('bcrypt');
          if (bcrypt.compareSync(password, configs.admins[i].password)) {
            user = configs.admins[i];
            user.is_admin = true;
            show_wrong = false;
          }
          break;
        }
      }
      if (show_wrong) {
        return wrong();
      } else {
        req.session.messages.push({ success: '成功登录。' });
        return done(null, user);
      }
    }
  ));
  passport.serializeUser(function(user, done) {
    done(null, user.username);
  });
  passport.deserializeUser(function(username, done) {
    var user;
    for (var i = 0; i < configs.admins.length; i++) {
      if (configs.admins[i].username == username) {
        user = configs.admins[i];
      }
    }
    done(null, user);
  });

  app.post('/SysAdmin/login', passport.authenticate('local-admin', { successReturnToOrRedirect: '/SysAdmin', failureRedirect: '/SysAdmin/login' }));

  app.post('/SysAdmin/logout', function(req, res){
    req.logout();
    req.session.messages.push({ success: '成功退出。' });
    res.send(200);
  });

  app.get('/SysAdmin/orders/:order_id?', function(req, res, next){
    var order_id = req.params.order_id;
    var by_user = req.query.user;
    if (req.user && req.user.is_admin) {
      var Order = require('../models/order');
      var User = require('../models/user');
      var find = {};
      if (order_id) find = { _id: order_id };
      if (by_user) find['_user'] = by_user;
      Order.find(find).populate({ path: '_user', select: 'username alias' }).sort('-created_at').exec(function(error, orders){
        if (order_id) {
          if (!orders) return next();
          res.render('admin/orders', { orders: orders, user: req.user, is_single: true, by_user: by_user, configs: configs });
        } else {
          var items_per_page = 10;
          var total_pages = Math.ceil(orders.length / items_per_page);
          var current_page = 1;
          if (req.query.page && /^([1-9]|[1-9][0-9]+)$/.test(req.query.page)) {
            if (req.query.page <= total_pages) current_page = req.query.page;
          }
          var start = (current_page - 1) * items_per_page;
          orders = orders.slice(start, start + items_per_page);
          res.render('admin/orders', { orders: orders, user: req.user, is_single: false, by_user: by_user,
            current_page: current_page, total_pages: total_pages, configs: configs });
        }
      });
    } else {
      req.session.returnTo = '/SysAdmin/orders' + (order_id ? '/' + order_id : '');
      res.redirect('/SysAdmin/login');
    }
  });

  app.post('/SysAdmin/orders/:order_id', function(req, res, next){
    if (!req.user || !req.user.is_admin) return next();
    var order_id = req.params.order_id;
    try {
      var status = req.body.status ? req.body.status.trim() : '';
      var final_price = req.body.final_price;
      var seller_comments = req.body.seller_comments ? req.body.seller_comments.trim() : '';
      var admin_password = req.body.admin_password;
      if (!/^[A-Za-z0-9!@#$%^&*+\-]{6,16}$/.test(admin_password)) throw '密码不正确。';
      var bcrypt = require('bcrypt');
      var password = null;
      for (var i = 0; i < configs.admins.length; i++) {
        if (configs.admins[i].username == req.user.username) {
          password = configs.admins[i].password;
          break;
        }
      }
      if (!password || !bcrypt.compareSync(admin_password, password)) throw '密码不正确。';
      if (status.length == 0 || status.length > 10) throw '状态文字长度规定在1至10个字符。';
      if (final_price && !/^\d+(\.\d+|)$/.test(final_price)) throw '合计总价必须是数字，如 999.99 。';
      if (final_price === '') final_price = -1;
      if (seller_comments.length > 20000) throw '卖家备注过长，最多能包含20000个字符。';
      var Order = require('../models/order');
      Order.findOne({ _id: order_id }, function(err, order){
        if (err || !order) {
          req.session.messages.push({ error: '无法保存订单。' });
        } else {
          order.status = status;
          order.final_price = final_price;
          order.seller_comments = seller_comments;
          order.updated_at = new Date();
          order.save();
          req.session.messages.push({ success: '成功保存订单。' });
        }
        res.redirect('/SysAdmin/orders/' + order_id);
      });
    } catch (error) {
      req.session.messages.push({ error: error instanceof String ? error : '发生未知错误。' });
      res.redirect('/SysAdmin/orders/' + order_id);
    }
  });

};
