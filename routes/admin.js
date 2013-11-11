module.exports = function(app, products, configs) {

  app.get('/SysAdmin', function(req, res, next){
    if (req.user && req.user.is_admin) {
      res.render('admin/index', { admin: req.user });
    } else {
      res.redirect('/SysAdmin/login');
    }
  });

  app.get('/SysAdmin/login', function(req, res, next){
    res.render('admin/login');
  });

  var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;
  passport.use(new LocalStrategy({
      usernameField: 'admin_username',
      passwordField: 'admin_password',
      strategyName: 'local-admin',
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

};
