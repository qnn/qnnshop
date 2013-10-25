//= require vendor/jquery-1.10.2.min.js
//= require vendor/jquery.sliderkit.1.9.2.js
//= require vendor/simpleCart.min.js
$(function(){
  if ($('#main-slider').length == 1) {
    $('#main-slider').sliderkit({
      auto: true,
      autospeed: 3000,
      panelbtnshover: true,
      circular: true,
      fastchange: false
    });
  }
  simpleCart({
    checkout: {
      type: "SendForm",
      url: "/buy"
    },
    cartColumns: [
      {
        view: function (item, column) {
          return "<span>" + item.get('quantity') + "</span>" +
            "<div>" +
            "<a href='javascript:;' class='simpleCart_increment'><img src='/assets/images/increment.png' title='+1' alt='arrow up'/></a>" +
            "<a href='javascript:;' class='simpleCart_decrement'><img src='/assets/images/decrement.png' title='-1' alt='arrow down'/></a>" +
            "</div>";
        },
        attr: 'custom'
      },
      {
        attr: "name",
        label: false
      },
      {
        view: 'currency',
        attr: "total",
        label: false
      }
    ],
    cartStyle: 'div'
  });
  $(".cartInfo").click(function(){
    if ($(this).hasClass('open')) {
      $("#cartPopover").hide();
      $(this).removeClass('open');
    } else {
      $("#cartPopover").show();
      $(this).addClass('open');
    }
  });
});
