$(function(){
  $('#adminlogout').click(function(){
    $.post('/SysAdmin/logout', { _csrf: window.csrf_token }).done(function(){
      window.location.reload();
    }).error(function(){
      window.location.href = '/SysAdmin';
    });
  });
  $('.customizable-select').change(function(){
    if ($(this).val() == '') {
      var prompt = window.prompt('请输入自定' + $(this).data('property') + '：', '');
      var selected = $(this).find('option:selected');
      $(this).find('option').prop('selected', false);
      if (prompt != null) {
        if (prompt && $(this).find('option[value="'+prompt+'"]').length > 0) {
          $(this).find('option[value="'+prompt+'"]').prop('selected', true);
        } else {
          $('<option value="'+prompt+'">'+(prompt||'(空)')+'</option>').insertBefore(selected).prop('selected', true);
        }
      } else {
        $(this).find('option[data-original]').prop('selected', true);
      }
    }
  });
  $('.need_confirm').change(function(){
    var nc = $(this).find('option:selected:first');
    if (nc.data('confirm') && !confirm(nc.data('confirm'))) {
      $(this).find('option').prop('selected', false);
      $(this).find('option:not([data-confirm]):first').prop('selected', true);
    }
  });
  if ($('.form').length > 0) {
    $('.form').each(function(){
      $(this).submit(function(){
        var err = [];
        if ($('#final_price').length == 1) {
          if ($('#final_price').val().length > 0 && !/^\d+(\.\d+|)$/.test($('#final_price').val())) {
            err.push('合计总价');
          }
        }
        if ($('#password').length == 1) {
          if (!/^[A-Za-z0-9!@#$%^&*+\-.]{6,16}$/.test($('#password').val())) {
            err.push('密码');
          }
        }
        if (err.length > 0) {
          toastr.error(err.join('、') + '输入错误。');
          return false;
        }
      });
    });
  }
  $('#searchorderno').typeahead({
    name: 'orderids',
    remote: '/SysAdmin/orderids/%QUERY',
    limit: 10,
    rateLimitWait: 0
  }).bind('typeahead:selected typeahead:autocompleted', function(event, object, name) {
    if (object.value && /^[a-fA-F0-9]+$/.test(object.value)) {
      window.location.href='/SysAdmin/orders/' + object.value;
    }
  });
  $('#searchorderno').typeahead('setQuery', '');
});
