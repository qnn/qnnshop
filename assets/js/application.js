//= require vendor/jquery-1.10.2.min.js
//= require vendor/jquery.sliderkit.1.9.2.js
//= require vendor/jquery.path.js
//= require vendor/simpleCart.min.js
//= require vendor/jquery.timeago.js
//= require vendor/toastr.min.js
//= require vendor/jquery.jqpagination.min.js
//= require vendor/typeahead.js
//= require vendor/jquery.blockUI.js
//= require vendor/jquery.isotope.min.js
//= require vendor/jquery.unveil.min.js
//= require account.js
//= require checkout.js
//= require product_details.js
//= require login.js
//= require orders_cancel.js
//= require cart.js
//= require orders.js
//= require find.js
toastr.options = {
  closeButton: true,
  showDuration: 200,
  hideDuration: 200,
  timeOut: 4000
};
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
        action: '/checkout',
        method: 'POST',
        data: { data: JSON.stringify(data), _csrf: window.csrf_token }
      };
    }
  });
  $('.toCurrency').each(function(){
    $(this).text(simpleCart.toCurrency($(this).text()));
  });
  if ($('#headerCart').length == 1) {
    simpleCart({
      checkout: { type: 'Custom' },
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
      checkout: { type: 'Custom' },
      currency: 'CNY',
      cartStyle: 'table',
      cartColumns: [
        { attr: 'image', label: false, view: function(item, column){
            var name = item.get('name');
            return '<a title="' + name + '" href="' + item.get('path') + '"><img alt="' + name + '" src="' + item.get('image') + '"></a>';
          }
        },
        { attr: 'name', label: '商品名称', view: function(item, column){
            return '<a href="' + item.get('path') + '">' + item.get('name') + '</a>';
          }
        },
        { attr: 'quantity', label: '数量', view: function (item, column) {
            return '<a href="javascript:;" class="simpleCart_increment arrow_up arrow_up_black"></a>' +
              '<input type="text" value="' + item.get('quantity') + '" class="simpleCart_input">' +
              '<a href="javascript:;" class="simpleCart_decrement arrow_down arrow_down_black"></a>';
          }
        },
        { attr: 'price', label: '单价', view: 'currency' },
        { attr: 'total', label: '合计', view: 'currency' },
        { view: 'remove', text: '删除', label: false }
      ]
    });
    simpleCart.bind('beforeRemove', function(item){
      return confirm('确定要从购物车上删除“' + item.get('name') + '”？')
    });
    simpleCart.bind('ready update', function(){
      if (simpleCart.quantity() == 0) {
        $('.cart').addClass('hidden');
        $('.empty_cart').removeClass('hidden');
      } else {
        $('.cart').removeClass('hidden');
        $('.empty_cart').addClass('hidden');
      }
    });
  }
  $(".addtocartbtn").click(function(e){
    e.preventDefault();
    var category = $(this).data('category'), model = $(this).data('model');
    var that = $(this);
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
        if (that.hasClass('redirects')) {
          window.location.href = that.attr('href');
          return;
        }
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
          toastr['success']('成功添加商品到购物车。');
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
  if ($('#district_selector').length == 1) {
    var defaults = $('#district_selector').data('districts');
    if (defaults) defaults = defaults.split(',');
    $.getJSON('/js/districts.tree.json', function(districts){
      var province = $('<select />', { id: 'province', name: 'province', class: 'form_select' });
      province.append('<option value="">请选择地区</option>');
      $.each(districts, function(a, b){
        province.append('<option value="' + a + '">' + a + '</option>');
      });
      province.change(function(){
        $('option[value=""]', this).remove();
        $(this).nextAll().remove();
        var p = $(this).val();
        var city = $('<select />', { id: 'city', name: 'city', class: 'form_select' });
        $.each(districts[p], function(a, b){
          city.append('<option value="' + a + '">' + a + '</option>');
        });
        city.data('province', p);
        $('#district_selector').append(city);
        city.change(function(){
          $(this).nextAll().remove();
          var p = $(this).data('province'), c = $(this).val();
          if (districts[p][c] instanceof Array && districts[p][c].length > 0) {
            var district = $('<select />', { id: 'district', name: 'district', class: 'form_select' });
            $.each(districts[p][c], function(a, b){
              district.append('<option value="' + b + '">' + b + '</option>');
            });
            $('#district_selector').append(district);
          }
        }).trigger('change');
      });
      $('#district_selector').append(province);
      if (Object.keys(districts).length == 1) defaults = [Object.keys(districts)[0]];
      if (defaults[0]) {
        province.val(defaults[0]).trigger('change');
        if (defaults[1]) {
          province.next('select').val(defaults[1]).trigger('change');
          if (defaults[2]) {
            province.next('select').next('select').val(defaults[2]);
          }
        }
      }
    });
  }
  $('abbr.timeago').timeago();
  $('#logout').click(function(){
    $.post('/logout', { _csrf: window.csrf_token }).done(function(){
      window.location.reload();
    }).error(function(){
      window.location.href = '/';
    });
  });
  $('.reload_captcha').click(function(){
    var img = $(this).find('img');
    img.attr('src', img.attr('src').replace(/\?.*$/,'') + '?' + Math.random());
  });
  function f(n) {
    return n < 10 ? '0' + n : n;
  }
  $('.toLocalTime').each(function(){
    var d = new Date($(this).text());
    d = d.getFullYear() + '-' + f(d.getMonth() + 1) + '-' + f(d.getDate()) + ' ' + f(d.getHours()) + ':' + f(d.getMinutes()) + ':' + f(d.getSeconds());
    $(this).text(d)
  });
  if ($('.account').length == 1) {
    $('.edit-section').click(function(){
      $(this).parent().siblings('.text').addClass('hidden');
      $(this).parent().siblings('.edit').removeClass('hidden');
      $(this).remove();
      $('.form_buttons').removeClass('hidden');
    });
  }
  $('.show_canceled').click(function(){
    $(this).parents('table.canceled').removeClass('canceled');
    $(this).parents('thead').remove();
  });
});
