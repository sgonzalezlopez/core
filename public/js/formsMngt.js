function sendForm(formId) {
    var frm = document.getElementById(formId);
    var form = $('#'+formId);
    if (frm.checkValidity() === true) {
      $.ajax({
        type: frmMethod,
        url: frmURL,
        data: form.serialize(),
        success: function(data) {
          $.toast({heading:'Tournament Manager', text:'Se ha enviado la información', delay:3000})
          $('#newRecord').modal('hide');
          $table.bootstrapTable('refresh')
         //frm.reset();
         frm.classList.remove('was-validated');
          
        },
        error: function(error) {         
          console.log(error);
        },
        dataType: 'json'
      });
      
    } else 
    frm.classList.add('was-validated');
}