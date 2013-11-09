$(function(){
  $('.pdetails .selects a').click(function(){
    $(this).siblings().removeClass('active');
    $(this).addClass('active');
    var pages = $(this).parents('.pdetails').find('.pdpages .pdpage');
    pages.addClass('hidden');
    pages.eq($(this).index()).removeClass('hidden');
  });
});
