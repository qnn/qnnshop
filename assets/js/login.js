$(function(){
  $('form.login').submit(function(){
    var err = [];
    if (!/^[0-9+\-]{10,25}$/.test($('#username').val())) {
      err.push('手机/电话号码');
    }
    if (!/^[A-Za-z0-9!@#$%^&*+\-]{6,16}$/.test($('#password').val())) {
      err.push('密码');
    }
    if (!/^[0-9]{6}/.test($('#captcha').val())) {
      err.push('验证码');
    }
    if (err.length > 0) {
      toastr.error(err.join('、') + '输入错误。');
      return false;
    }
  });
});
