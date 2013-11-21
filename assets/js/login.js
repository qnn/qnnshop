$(function(){
  $('.ignore_check').click(function(){
    $(this).addClass('should_ignore_check');
  });
  $('form.login').submit(function(){
    if ($(this).find('.should_ignore_check').length > 0) return true;
    var err = [];
    if ($('#username').length == 1 && !/^[0-9+\-]{10,25}$/.test($('#username').val())) {
      err.push('手机/电话号码');
    }
    if ($('#admin_username').length == 1 && !/^[A-Za-z0-9_\-]{3,20}$/.test($('#admin_username').val())) {
      err.push('用户名');
    }
    if (!/^[A-Za-z0-9!@#$%^&*+\-]{6,16}$/.test($('#password').val())) {
      err.push('密码');
    }
    if ($('#captcha').length == 1 && !/^[0-9]{6}$/.test($('#captcha').val())) {
      err.push('验证码');
    }
    if (err.length > 0) {
      toastr.error(err.join('、') + '输入错误。');
      return false;
    }
  });
});
