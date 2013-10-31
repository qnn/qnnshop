//= require vendor/jquery-1.10.2.min.js
//= require vendor/jquery.sliderkit.1.9.2.js
//= require vendor/jquery.path.js
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
  var checkout = {
    type: 'Custom',
    url: '/checkout'
  };
  simpleCart.currency({
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan'
  });
  simpleCart.extendCheckout({
    Custom: function (opts) {
      var data = [];
      simpleCart.each(function (item, x) {
        data.push({
          category: item.get('category'),
          model: item.get('model'),
          quantity: item.quantity(),
          price: item.price()
        });
      });
      return {
        action: opts.url,
        method: opts.method === "GET" ? "GET" : "POST",
        data: { data: JSON.stringify(data) }
      };
    }
  });
  $('.toCurrency').each(function(){
    $(this).text(simpleCart.toCurrency($(this).text()));
  });
  if ($('#headerCart').length == 1) {
    simpleCart({
      checkout: checkout,
      currency: 'CNY',
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
          attr: 'name',
          label: false,
          view: function(item, column){
            return '<a href="' + item.get('path') + '">' + item.get('name') + '</a>';
          }
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
  }
  if ($('#shopping_cart').length == 1) {
    simpleCart({
      checkout: checkout,
      currency: 'CNY',
      cartStyle: 'table',
      cartColumns: [
        { attr: 'image', label: false, view: function(item, column){
            var name = item.get('name');
            return '<a title="' + name + '" href="' + item.get('path') + '"><img alt="' + name + '" src="' + item.get('image') + '"></a>';
          }
        },
        { attr: 'name' , label: '商品名称', view: function(item, column){
            return '<a href="' + item.get('path') + '">' + item.get('name') + '</a>';
          }
        },
        { attr: 'quantity', label: '数量', view: 'input' },
        { attr: 'price', label: '单价', view: 'currency' },
        { attr: 'total' , label: '合计', view: 'currency' },
        { view: 'remove', text: '删除', label: false }
      ]
    });
  }
  $(".addtocartbtn").click(function(e){
    e.preventDefault();
    var category = $(this).data('category'), model = $(this).data('model');
    if (category && model) {
      $.getJSON('/'+category+'/'+model, function(product){
        simpleCart.add({ 
          name: product.name,
          category: product.category,
          model: product.model,
          price: product.price,
          path: product.path,
          image: product.image,
          quantity: 1
        });
        var active_image = $('#pslider .sliderkit-panel-active img');
        var image = active_image.clone();
        image.width(active_image.width()).height(active_image.height());
        image.css({ position: 'absolute', 'z-index': 9999 });
        image.appendTo('body');
        image.animate({
          path: new $.path.bezier({
            start: {
              x: active_image.offset().left,
              y: active_image.offset().top,
              angle: -90
            },
            end: {
              x: $('#headerCart').offset().left,
              y: $('#headerCart').offset().top,
              angle: 180,
              length: 0.25
            }
          })
        }, 600, function(){
          $(this).remove();
        });
        image.addClass('cartAnimation');
      });
    }
  });
  if ($('#pslider').length == 1) {
    $('#pslider').sliderkit({
      mousewheel: false,
      shownavitems: 5,
      panelbtnshover: false,
      auto: false,
      circular: true,
      navscrollatend: false,
      navpanelautoswitch: false
    });
  }
});
