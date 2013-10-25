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
  simpleCart.currency({
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan'
  });
  simpleCart({
    checkout: {
      type: 'SendForm',
      url: '/buy'
    },
    currency: "CNY",
    cartColumns: [
      {
        view: function (item, column) {
          return '<span>' + item.get('quantity') + '</span>' +
            '<div>' +
            '<a href="javascript:;" class="simpleCart_increment arrow_up"></a>' +
            '<a href="javascript:;" class="simpleCart_decrement arrow_down"></a>' +
            '</div>';
        },
        attr: 'custom'
      },
      {
        attr: "name",
        label: false
      },
      {
        view: 'currency',
        attr: 'total',
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
  $(".addtocartbtn").click(function(e){
    e.preventDefault();
    var category = $(this).data('category'), model = $(this).data('model');
    if (category && model) {
      $.getJSON('/'+category+'/'+model, function(product){
        simpleCart.add({ 
          name: product.name,
          price: product.price,
          size: product.size,
          quantity: 1
        });
      });
    }
  });
});
