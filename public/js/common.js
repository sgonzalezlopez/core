$(function () {
  $('table.clickable').each(function(index, value) {
      a = $(`#${value.id}`)
      $(a).on('click-row.bs.table', function (e, row, $element) {
          window.location.href =  $(a).attr('detail-url') + row._id
      })
  });
});

$(function () {
  $(".select2").select2();
})
