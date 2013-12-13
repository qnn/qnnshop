$(function(){
  $.blockUI.defaults.css.cursor = 'default';
  $.blockUI.defaults.overlayCSS.cursor = 'default';
  $('.alipay_now').click(function(e){
    e.preventDefault();
    $.blockUI({ message: '<p style="padding: 30px;">请稍等……</p>' });
    $.post($(this).attr('href'), { _csrf: window.csrf_token }).error(function(){
      alert('暂时无法完成您的请求，请稍候再试。');
      window.location.reload();
    }).success(function(data){
      window.location.href=data.redirect;
    });
  });
  $('.show_payment_details').click(function(e){
    e.preventDefault();
    $.get($(this).attr('href'), { _csrf: window.csrf_token }).error(function(){
      alert('暂时无法完成您的请求，请稍候再试。');
      window.location.reload();
    }).success(function(data){
      $.blockUI({ css: { top: '50px' }, message: '<div class="buiinfo"><pre>' + data.payment_details + '</pre><a class="hudbtn primary" href="javascript:$.unblockUI();">关闭</a></div>' });
    });
  });
});
