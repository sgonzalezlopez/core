$(function () {
  $('table.clickable').each(function(index, value) {
      a = $(`#${value.id}`)
      $(a).on('click-row.bs.table', function (e, row, $element) {
          window.location.href =  $(a).attr('detail-url') + row._id
      })
  });
});

$( document).ready( function () {
  $(".mydatepicker").each(function() {
      var element = $(this)
      element.datepicker({
          language: '<%=__("LANGUAGE")%>',
          format : 'dd/mm/yyyy',
          todayHighlight: true,
      });

      element.datepicker('setDate', new Date(element.attr('date-value')))
  })
  
})

$(function () {
  $(".select2").select2();
})
