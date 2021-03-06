$(function(){
  if ($('#checkout_form').length == 1) {
    $('#checkout_form').submit(function(){
      var err = [], err_s = [];
      if ($('#comments').length == 1 && $('#comments').val().length > 20000) err.push('买家备注');
      if (!/^[\u4E00-\u9FA5A-Za-z\s]{1,20}$/.test($('#shipping_user_name').val())) {
        err.push('收货人名字');
      }
      if (!/^[0-9+\-]{10,25}$/.test($('#shipping_user_phone').val())) {
        err.push('收货人联系电话');
      }
      if (!/^[\u4E00-\u9FA5A-Za-z\s0-9\-\(\)]{2,100}$/.test($('#shipping_address').val())) {
        err.push('收货地址');
      }
      if ($('#shipping_user_email').val() !== '' && !/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test($('#shipping_user_email').val())) {
        err.push('电邮地址');
      }
      if ($('#captcha').length == 1 && !/^[0-9]{6}$/.test($('#captcha').val())) {
        err.push('验证码');
      }
      if ($('#invoice').length == 1 && !/^[\u4E00-\u9FA5A-Za-z\s]{1,20}$/.test($('#invoice').val())) {
        err.push('发票抬头');
      }
      if ($('#province').length == 1 && $('#province').val() == '') {
        err_s.push('省份');
      }
      if (err.length + err_s.length > 0) {
        if (err_s.length > 0) {
          toastr.error(err_s.join('、') + '选择错误。');
        }
        if (err.length > 0) {
          toastr.error(err.join('、') + '输入错误。');
        }
        return false;
      }
    });
  }
});
