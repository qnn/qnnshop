$(function(){
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
});
