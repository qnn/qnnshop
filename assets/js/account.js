$(function(){
  if ($('#account_form').length == 1) {
    $('#account_form').submit(function(){
      var err = [];
      var pwdRegex = /^[A-Za-z0-9!@#$%^&*+\-.]{6,16}$/;
      if ($('#alias').val() !== '' && !/^[\u4E00-\u9FA5A-Za-z0-9_\-]{1,20}$/.test($('#alias').val())) {
        err.push('显示名');
      }
      if (!pwdRegex.test($('#password').val())) {
        err.push('旧密码');
      }
      if ($('#newPassword').val() != '' && $('#newPasswordAgain').val() != '') {
        if (!pwdRegex.test($('#newPassword').val()) || $('#newPasswordAgain').val() != $('#newPassword').val()) {
          err.push('新密码');
        }
      }
      if ($('#shipping_user_name').val() !== '' && !/^[\u4E00-\u9FA5A-Za-z\s]{1,20}$/.test($('#shipping_user_name').val())) {
        err.push('收货人名字');
      }
      if ($('#shipping_user_phone').val() !== '' && !/^[0-9+\-]{10,25}$/.test($('#shipping_user_phone').val())) {
        err.push('收货人联系电话');
      }
      if ($('#shipping_address').val() !== '' && !/^[\u4E00-\u9FA5A-Za-z\s0-9\-\(\)]{2,100}$/.test($('#shipping_address').val())) {
        err.push('收货地址');
      }
      if ($('#shipping_user_email').val() !== '' && !/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test($('#shipping_user_email').val())) {
        err.push('电邮地址');
      }
      if (err.length > 0) {
        toastr.error(err.join('、') + '输入错误。');
        return false;
      }
    });
  }
});
