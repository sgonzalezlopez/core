(function (global, factory) {  
    'use strict';
    if (typeof define === 'function' && define.amd) {
      define(['pages'], factory);
    } else if (typeof module === 'object' && module.exports) {
      factory(require('./pages'));
    } else {
      factory(global.core);
    }
  }(this, function (core) {
    'use strict';
    (function () {
      core.addLocale('es', {
        DELETE_CONFIRM_MESSAGE : 'Se va a eliminar un elemento. ¿Deseas continuar?',
        DELETE_SUCCESS_MESSAGE : 'El elemento se ha eliminado correctamente.',
        DELETE_ERROR_MESSAGE : 'Se ha producido un error al eliminar el elemento.',
        UPDATE_SUCCESS_MESSAGE : 'Se ha actualizado el elemento correctamente.',
        UPDATE_ERROR_MESSAGE : 'Se ha producido un error al actualizar el elemento.',
        CREATE_SUCCESS_MESSAGE : 'El elemento se ha creado correctamente.',
        CREATE_ERROR_MESSAGE : 'Se ha producido un error al crear el elemento.',
        SEARCH_ERROR_MESSAGE : 'Se ha producido un error al buscar elementos.',
        DATE_FORMAT : 'dd/mm/yyyy',
        BOOLEAN_TRUE: 'Si',
        BOOLEAN_FALSE: 'No'
      });
    })();
})
)