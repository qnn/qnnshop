$(function(){
  $('#adminlogout').click(function(){
    $.post('/SysAdmin/logout', { _csrf: window.csrf_token }).done(function(){
      window.location.reload();
    }).error(function(){
      window.location.href = '/SysAdmin';
    });
  });
});
