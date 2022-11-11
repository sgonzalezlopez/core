(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
      // AMD
      define(['jquery'], factory);
    } else if (typeof exports === 'object') {
      // Node, CommonJS-like
      module.exports = factory(require('jquery'));
    } else {
      // Browser globals (root is window)
      root.pagesCore = factory(root.jQuery);
    }
  }(this, function init($, undefined) {
    'use strict';

    var exports = {};

    var VERSION = '1.0.0';
    exports.VERSION = VERSION;
  
    var locales = {
      en : {
        DELETE_CONFIRM_MESSAGE : 'The element will be removed. Are you sure?',
        DELETE_SUCCESS_MESSAGE : 'Element has been removed.',
        DELETE_ERROR_MESSAGE : 'An error occurred when removing the element.',
        DATE_FORMAT : 'mm/dd/yyyy'
      }
    };

    var defaults = {
        // default language
        locale: 'en',
        // nombre de la aplicación
        appName: 'Core Apps',
        // api base del elemento
        api : null,
        // formato 
        dateFormat : 'L'
      };

    var options = {}

    exports.options = options

    // PUBLIC FUNCTIONS
    // *************************************************************************************************************

    // Return all currently registered locales, or a specific locale if "name" is defined
    exports.locales = function (name) {
        return name ? locales[name] : locales;
    };


    // Register localized strings for the OK, CONFIRM, and CANCEL buttons
    exports.addLocale = function (name, values) {
        $.each(['DELETE_CONFIRM_MESSAGE', 'DATE_FORMAT'], function (_, v) {
        if (!values[v]) {
            throw new Error('Please supply a translation for "' + v + '"');
        }
        });

        locales[name] = {
            DELETE_CONFIRM_MESSAGE: values.DELETE_CONFIRM_MESSAGE,
            DATE_FORMAT: values.DATE_FORMAT,
        };

        return exports;
    };

    // Remove a previously-registered locale
    exports.removeLocale = function (name) {
        if (name !== 'en') {
        delete locales[name];
        }
        else {
        throw new Error('"en" is used as the default and fallback locale and cannot be removed.');
        }

        return exports;
    };

    // Set the default locale
    exports.setLocale = function (name) {
        return exports.setDefaults('locale', name);
    };

    // Override default value(s)
    exports.setDefaults = function () {
        var values = {};
        
        if (arguments.length === 2) {
        // allow passing of single key/value...
            values[arguments[0]] = arguments[1];
        } else {
            // ... and as an object too
            values = arguments[0];
        }
        
        $.extend(defaults, values);
    
        return exports;
    };

    // Allows the base init() function to be overridden
    exports.init = function (_$) {
        return init(_$ || $);
    };
    
    // CORE HELPER FUNCTIONS
    // *************************************************************************************************************

    // Core dialog function
    exports.setup = function (new_options) {
        options = sanitize(new_options);

        $('table.clickable').each(function(index, value) {
            var a = $(`#${value.id}`)
            $(a).on('click-row.bs.table', function (e, row, $element) {
                window.location.href =  $(a).attr('detail-url') + row._id
            })
        });

        $(".mydatepicker[date-value]").each(function() {
            var element = $(this)
            element.datepicker({
                language: options.locale,
                format : getText('DATE_FORMAT'),
                todayHighlight: true,
            });
    
            console.log(element.attr('date-value'));
            element.datepicker('setDate', new Date(element.attr('date-value')))
        })

        $(".select2").select2();

        var tables = $("[data-toggle='table']")
        if (tables) {
            window.actionEvents = {    
                'click .delete' : function (e, value, row, index) {
                    e.stopPropagation()
                    bootbox.confirm({
                        message :  getText('DELETE_CONFIRM_MESSAGE'), 
                        title : options.appName,
                        closeButton : false,
                        callback : function(result){
                            if (!result) return;
                            $.ajax({
                                type: 'DELETE',
                                url: `${options.api}/${row._id}`,
                                dataType: 'json',
                                success: function(data) {
                                    toastr.success(options.appName, getText('DELETE_SUCCESS_MESSAGE'))
                                    tables.bootstrapTable('refresh')
                                },
                                error: function(error) {
                                    toastr.error(options.appName, getText('DELETE_ERROR_MESSAGE'))
                                    console.error(error);
                                },
                            });
                        }
                    })
                }   
            }       
        }

        return exports;
    }

    exports.deleteElement = function (id, callback) {
        bootbox.confirm({
            message :  getText('DELETE_CONFIRM_MESSAGE'), 
            title : options.appName,
            closeButton : false,
            callback : function(result){
                if (!result) return;
                $.ajax({
                    type: 'DELETE',
                    url: `${options.api}/${id}`,
                    dataType: 'json',
                    success: function(data) {
                        toastr.success(options.appName, getText('DELETE_SUCCESS_MESSAGE'))
                        if (callback) return callback()
                    },
                    error: function(error) {
                        toastr.error(options.appName, getText('DELETE_ERROR_MESSAGE'))
                        console.error(error);
                    },
                });
            }
        })

    }

    exports.setOptions = function (new_options) {
        options = sanitize(new_options);
        return exports;
    }

    exports.getOptions = function () {
        return options;
    }

    exports.dateFormatter = function (value, row, index) {
        return moment(value).locale(options.locale).format(options.dateFormat)
    }


    //  Get localized text from a locale. Defaults to 'en' locale if no locale 
    //  provided or a non-registered locale is requested
    function getText(key, locale) {
        if (!locale) locale = defaults.locale
        var labels = locales[locale];

        return labels ? labels[key] : locales.en[key];
    }

    //  Filter and tidy up any user supplied parameters to this dialog.
    //  Also looks for any shorthands used and ensures that the options
    //  which are returned are all normalized properly
    function sanitize(new_options) {
        if (!new_options) new_options = {}
        // Establecer que las opciones son obligatorias
        // if (typeof options !== 'object') {
        //     throw new Error('Please supply an object of options');
        // }

        // Establecer opciones obligatorias
        // if (!options.message) {
        // throw new Error('"message" option must not be null or an empty string.');
        // }

        // Establecer locale
        if (new_options.locale) {
            exports.setLocale(new_options.locale)
        }

        // make sure any supplied options take precedence over defaults
        new_options = $.extend({}, defaults, options, new_options);

        //make sure backdrop is either true, false, or 'static'
        // if (!options.backdrop) {
        // options.backdrop = (options.backdrop === false || options.backdrop === 0) ? false : 'static';
        // } else {
        // options.backdrop = typeof options.backdrop === 'string' && options.backdrop.toLowerCase() === 'static' ? 'static' : true;
        // } 
        return new_options
    }
  //  The PageCore object
  return exports;
}));