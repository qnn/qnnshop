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
      if (app.enabled('captcha')) {
        if (!req.body.captcha || req.body.captcha != req.session.captcha) {
          req.session.messages.push({ error: '验证码输入错误。' });
          req.session.captcha = generate_captcha();
          return done(null, false);
        }
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

  app.get('/SysAdmin/orders/export', function(req, res, next){
    if (req.user && req.user.is_admin) {
      res.render('admin/orders_export');
    } else {
      req.session.returnTo = '/SysAdmin/orders/export';
      res.redirect('/SysAdmin/login');
    }
  });

  app.get('/SysAdmin/orders/export.xlsx', function(req, res, next){
    var currency_format = "&quot;￥&quot;#,##0.00;&quot;￥&quot;\\-#,##0.00";
    var Order = require('../models/order');
    Order.find({}).sort('-created_at').exec(function(error, orders){
      var data = [[
        { value: "每日发货详细数据表", colSpan: 14, hAlign: 'center', fontSize: 18, bold: true }
      ], [
        { colWidth: 5,  hAlign: 'center', value: "序号" },
        { colWidth: 26, hAlign: 'center', value: "订单号" },
        { colWidth: 20, hAlign: 'center', value: "商品名称" },
        { colWidth: 5,  hAlign: 'center', value: "数量" },
        { colWidth: 13, hAlign: 'center', value: "单价" },
        { colWidth: 13, hAlign: 'center', value: "金额" },
        { colWidth: 10, hAlign: 'center', value: "发票抬头" },
        { colWidth: 10, hAlign: 'center', value: "收货人" },
        { colWidth: 20, hAlign: 'center', value: "收货地址" },
        { colWidth: 14, hAlign: 'center', value: "联系电话" },
        { colWidth: 14, hAlign: 'center', value: "备注" },
        { colWidth: 9,  hAlign: 'center', value: "快递公司" },
        { colWidth: 14, hAlign: 'center', value: "快递单号" },
        { colWidth: 17, hAlign: 'center', value: "创建日期" }
      ]];
      for (var i = 0; i < orders.length; i++) {
        var order = orders[i];
        var l = order.products.length;
        var grandTotal = 0;
        for (var j = 0; j < l; j++) {
          var product = order.products[j];
          var cat = product.category, model = product.model;
          var total = product.quantity * product.price;
          data.push([
            { value: j == 0 ? i + 1 : '' },
            { value: j == 0 ? order._id + '' : '' },
            { value: products[cat] && products[cat][model] ? products[cat][model].name : '(商品已下架)' },
            { value: product.quantity },
            { value: product.price, formatCode: currency_format, hAlign: 'right' },
            { value: total, formatCode: currency_format, hAlign: 'right' },
            { value: j == 0 ? (order.invoice || '(无)') : '' },
            { value: j == 0 ? order.username : '', forceString: true },
            { value: j == 0 ? order.address : '',  forceString: true },
            { value: j == 0 ? order.phone : '',    forceString: true },
            { value: j == 0 ? (order.buyer_comments || '(无)') : '' },
            { value: j == 0 ? (order.shipping.by || '(无)') : '' },
            { value: j == 0 ? (order.shipping.number || '(无)') : '', forceString: true },
            { value: j == 0 ? order.created_at : '', formatCode: "yyyy-mm-dd HH:mm" }
          ]);
          grandTotal += total;
        }
        var blank_arr = function(n){
          var arr = [];
          for (var i = 0; i < n; i++) arr.push({ value: '' });
          return arr;
        };
        if (order.final_price >= 0 || l > 1) {
          if (order.final_price >= 0) {
            var diff = order.final_price - grandTotal
            grandTotal = order.final_price
            var blank = blank_arr(14);
            blank[4] = { value: '价格调整', hAlign: 'right' };
            blank[5] = { value: diff, formatCode: currency_format, hAlign: 'right' };
            data.push(blank);
          }
          var blank = blank_arr(14);
          blank[4] = { value: '合计', hAlign: 'right' };
          blank[5] = { value: grandTotal, formatCode: currency_format, hAlign: 'right' };
          data.push(blank);
        }
      }
      var xlsx = require('node-xlsx');
      var buffer = xlsx.build({ worksheets: [{
        name: "发货数据表", 
        data: data
      }] }, {
        defaultFontName: '宋体',
        defaultFontSize: 10,
        defaultVAlign: 'center',
        defaultCellBorders: { left: '000', right: '000', top: '000', bottom: '000' },
        page: {
          margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.1, footer: 0.1 },
          paper_size: 9, // A4
          orientation: 'landscape'
        }
      });
      res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.set('Content-Disposition', 'attachment; filename=' + encodeURIComponent('发货数据表') + '.xlsx');
      res.send(buffer);
    });
  });

  app.get('/SysAdmin/orders/:order_id?', function(req, res, next){
    var order_id = req.params.order_id;
    var by_user = req.query.user;
    if (req.user && req.user.is_admin) {
      if (req.query.all) req.session.admin_show_all_orders = req.query.all === '1';
      var show_all = !!req.session.admin_show_all_orders;

      var Order = require('../models/order');
      var User = require('../models/user');
      var find = {};
      if (order_id) {
        find = { _id: order_id };
      } else {
        if (!show_all && !by_user) {
          find = { status: { $nin: configs.default_statuses_not_to_show } };
        }
      }
      if (by_user) find['_user'] = by_user;
      Order.find(find).populate({ path: '_user', select: 'username alias' }).sort('-created_at').exec(function(error, orders){
        if (order_id) {
          if (!orders) return next();
          res.render('admin/orders', { orders: orders, user: req.user, is_single: true, by_user: by_user, configs: configs });
        } else {
          var items_per_page = 10;
          var total_items = orders.length;
          var total_pages = Math.ceil(total_items / items_per_page);
          var current_page = 1;
          if (req.query.page && /^([1-9]|[1-9][0-9]+)$/.test(req.query.page)) {
            if (req.query.page <= total_pages) current_page = req.query.page;
          }
          var start = (current_page - 1) * items_per_page;
          orders = orders.slice(start, start + items_per_page);
          res.render('admin/orders', { orders: orders, user: req.user, show_all: show_all, is_single: false, by_user: by_user,
            current_page: current_page, total_pages: total_pages, total_items: total_items, configs: configs });
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
      var shipping_by = req.body.shipping_by ? req.body.shipping_by.trim() : '';
      var shipping_number = req.body.shipping_number ? req.body.shipping_number.trim() : '';
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
      if (shipping_by.length > 10) throw '快递公司名字长度规定在10个字符以下。';
      if (shipping_number.length > 50) throw '快递单号长度规定在50个字符以下。';
      var Order = require('../models/order');
      Order.findOne({ _id: order_id }, function(err, order){
        if (err || !order) {
          req.session.messages.push({ error: '无法保存订单。' });
        } else {
          order.id_str = order_id;
          order.status = status;
          order.final_price = final_price;
          order.seller_comments = seller_comments;
          order.shipping.by = shipping_by;
          if (order.shipping.number != shipping_number) {
            order.shipping.number = shipping_number;
            order.shipping.at = new Date();
          }
          order.updated_at = new Date();
          order.save();
          req.session.messages.push({ success: '成功保存订单。' });
        }
        res.redirect('/SysAdmin/orders/' + order_id);
      });
    } catch (error) {
      req.session.messages.push({ error: typeof(error) == 'string' ? error : '发生未知错误。' });
      res.redirect('/SysAdmin/orders/' + order_id);
    }
  });

  app.get('/SysAdmin/orderids/:order_id?', function(req, res, next){
    var order_id = req.params.order_id;
    var by_user = req.query.user;
    if (req.user && req.user.is_admin) {
      var find = {};
      if (order_id) order_id = order_id.replace(/[^A-Za-z0-9]+/g, '');
      if (order_id) find = { id_str: new RegExp(order_id) };
      var Order = require('../models/order');
      Order.find(find, '_id').limit(10).sort('-created_at').exec(function(error, orders){
        if (error || !orders || orders.length === 0) {
          res.send([]);
        } else {
          res.send(orders);
        }
      });
    } else {
      res.send([]);
    }
  });

};
