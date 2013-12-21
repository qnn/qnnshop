$(function(){
  if ($('#typeselector').length === 1) {
    $('.filtered').isotope({
      itemSelector: '.filtered_item',
      onLayout: function() {
        $(window).trigger('scroll');
      }
    });
    $('#typeselector a[data-filter]').click(function(e) {
      e.preventDefault();
      if ($(this).data('filter') == '*') {
        $('#typeselector a[data-filter]').removeClass('active');
      } else {
        if ($(this).hasClass('active')) {
          $(this).removeClass('active');
        } else {
          $(this).siblings().removeClass('active');
          $(this).addClass('active');
        }
      }
      var filter = '';
      $('#typeselector a.active').each(function(){
        var f=$(this).data('filter');
        if (filter.indexOf(f)===-1) filter+=f;
      });
      if (!filter) {
        filter = '*';
        $('#typeselector a.showall').hide();
      } else {
        $('#typeselector a.showall').show();
      }
      $('.filtered').isotope({
        filter: filter
      });
    });
    $('#productfilter img').unveil();
  }
});
