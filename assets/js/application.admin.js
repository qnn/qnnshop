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
      var prompt = window.prompt('请输入自定状态：', '');
      var selected = $(this).find('option:selected');
      if (prompt) {
        $('<option value="'+prompt+'">'+prompt+'</option>').insertBefore(selected);
        $(this).val(prompt);
      } else {
        $(this).val($(this).find('option:first').attr('value'));
      }
    }
  });
});
