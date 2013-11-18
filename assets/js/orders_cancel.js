$(function(){
  if ($('#orders_cancel').length == 1) {
    $('#orders_cancel').submit(function(){
      var err = [];
      if ($('#reason').length == 1 && $('#reason').val().length > 20000) err.push('取消原因');
      if (!/^[A-Za-z0-9!@#$%^&*+\-]{6,16}$/.test($('#password').val())) {
        err.push('密码');
      }
      if (err.length > 0) {
        toastr.error(err.join('、') + '输入错误。');
        return false;
      }
    });
    $('#reason').bind('click change', function(){
      $('#reason_opts_0').prop('checked', true);
    });
  }
});
