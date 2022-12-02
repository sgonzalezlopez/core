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
        root.core = factory(root.jQuery);
    }
}(this, function init($, undefined) {
    'use strict';

    var exports = {};

    var VERSION = '1.0.0';
    exports.VERSION = VERSION;

    var locales = {
        en: {
            DELETE_CONFIRM_MESSAGE: 'The element will be removed. Are you sure?',
            DELETE_SUCCESS_MESSAGE: 'Element has been removed.',
            DELETE_ERROR_MESSAGE: 'An error occurred when removing the element.',
            UPDATE_SUCCESS_MESSAGE: 'Element has been updated.',
            UPDATE_ERROR_MESSAGE: 'An error occurred when updating the element.',
            CREATE_SUCCESS_MESSAGE: 'Element has been updated.',
            CREATE_ERROR_MESSAGE: 'An error occurred when creating the element.',
            SEARCH_ERROR_MESSAGE: 'An error occurred when searching elements.',
            DATE_FORMAT: 'mm/dd/yyyy'
        }
    };

    var defaults = {
        // default language
        locale: 'en',
        // nombre de la aplicación
        appName: 'Core Apps',
        // formato 
        dateFormat: 'L'
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

        if (!locales[name]) locales[name] = locales[name] = {}

        for (const key in locales[defaults.locale]) {
            if (Object.hasOwnProperty.call(locales[defaults.locale], key)) {
                locales[name][key] = values[key]
            }
        }

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

        // Tablas abren el elemento con un click
        $('table.clickable').each(function (index, value) {
            var a = $(`#${value.id}`)
            $(a).on('click-row.bs.table', function (e, row, $element) {
                window.location.href = $(a).attr('detail-url') + row._id
            })
        });

        // Establecer el valor de datepickers
        $(".mydatepicker[date-value]").each(function () {
            var element = $(this)
            element.datepicker({
                language: options.locale,
                format: getText('DATE_FORMAT'),
                todayHighlight: true,
            });

            element.datepicker('setDate', moment.utc(element.attr('date-value')).format(getText('DATE_FORMAT').toUpperCase()))
        })

        // Cargar los select con datos
        $("select").each(function () {
            var select = $(this)
            exports.forms.loadSelect(select)
        })


        // Cargar los cuadros modales
        $(".modal-new").each(function () {
            createModalNew($(this));
        })


        // Formatear los SELECT
        $(".select2").select2();
        $(".select2.allow-new ").select2({ tags: true });

        // Establecer las acciones de BORRADO en las tablas
        var tables = $("[data-toggle='table']")
        if (tables) {
            window.actionEvents = {
                'click .delete': function (e, value, row, index) {
                    e.stopPropagation()
                    core.api.delete(tables.attr('data-url'), row._id, function () { tables.bootstrapTable('refresh') })
                }
            }
        }

        // Establecer las máscaras de formato
        $(".registry-time-inputmask").inputmask("99:99:99.999")


        // Comportamiento de collapse
        $('[data-bs-toggle="collapse"]').each(function () {
            var panelelement = $($(this).attr('data-bs-target'))

            panelelement.on('hidden.bs.collapse', function () {
                var element = $(this)[0]
                $(`div[data-bs-target="#${element.id}"] i`).addClass('fa-angle-double-down')
                $(`div[data-bs-target="#${element.id}"] i`).removeClass('fa-angle-double-up')

                // do something…
            })
            panelelement.on('shown.bs.collapse', function () {
                var element = $(this)[0]
                $(`div[data-bs-target="#${element.id}"] i`).addClass('fa-angle-double-up')
                $(`div[data-bs-target="#${element.id}"] i`).removeClass('fa-angle-double-down')

                // do something…
            })
        })

        return exports;
    }

    exports.setOptions = function (new_options) {
        options = sanitize(new_options);
        return exports;
    }

    exports.getOptions = function () {
        return options;
    }

    exports.formatters = {
        date: function (value, row, index) {
            return moment.utc(value).locale(options.locale).format(options.dateFormat)
        },
        datetime: function (value, row, index) {
            return moment(value).locale(options.locale).format()
        },
        milliseconds: function (value, row, index) {
            return moment.utc(value).format('HH:mm:ss.SSS')
        },
        distance: function (value, row, index) {
            return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " m";
        },
        speed: function (value, row, index) {
            return value + " km/h";
        }
    }

    exports.forms = {
        parse: function (formName) {
            const formValues = new FormData(document.getElementById(formName))
            const values = Object.fromEntries(formValues.entries());

            for (const key in values) {
                if (Object.hasOwnProperty.call(values, key)) {
                    const element = values[key];
                    if (formValues.getAll(key).length > 1) values[key] = formValues.getAll(key)
                }
            }
            return values;
        },
        loadSelect: function (select) {
            if (select.attr('data-collection')) {
                $.ajax({
                    type: 'GET',
                    url: `/api/${select.attr('data-collection')}`,
                    dataType: 'json',
                    success: function (data) {
                        if (select.attr('data-distinct')) {
                            // const unique =  [...new Set(data.map(item => {_id: item[select.attr('data-distinct')]}))];
                            const unique = [...new Map(data.map(item => [item[select.attr('data-distinct')], item])).values()];
                            unique.map(v => {
                                v._id = v[select.attr('data-show')]
                            })
                            data = unique;
                        }
                        if (select.attr('data-sort')) data.sort((a, b) => (a[select.attr('data-sort')] > b[select.attr('data-sort')]) ? 1 : ((b[select.attr('data-sort')] > a[select.attr('data-sort')]) ? -1 : 0));
                        select.empty()
                        select.append('<option value=""></option>')
                        $.each(data, (i, item) => {
                            select.append(`<option value="${item._id}" ${((select.attr('data-value') && select.attr('data-value').includes(item._id)) ? "selected" : "")}>${item[select.attr('data-show')]}</option>`);
                        })
                    },
                    error: function (error) {
                        toastr.error('', options.appName)
                        console.error(error);
                    },
                });
            } else if (select.attr('data-value-list')) {
                $.ajax({
                    type: 'POST',
                    url: `/api/value/find`,
                    data: { type: select.attr('data-value-list') },
                    dataType: 'json',
                    success: function (data) {
                        select.empty()
                        select.append('<option value=""></option>')
                        $.each(data, (i, item) => {
                            select.append(`<option value="${item.value}" ${((select.attr('data-value') && select.attr('data-value').includes(item.value)) ? "selected" : "")}>${item.text || item.value}</option>`);
                        })
                    },
                    error: function (error) {
                        toastr.error('', options.appName)
                        console.error(error);
                    },
                });
            }
        }
    }

    // Funciones para interactuar con las APIs
    exports.api = {
        delete: function (api, id, callback) {
            bootbox.confirm({
                message: getText('DELETE_CONFIRM_MESSAGE'),
                title: options.appName,
                closeButton: false,
                callback: function (result) {
                    if (!result) return;
                    $.ajax({
                        type: 'DELETE',
                        url: `${api}/${id}`,
                        dataType: 'json',
                        success: function (data) {
                            toastr.success(getText('DELETE_SUCCESS_MESSAGE'), options.appName)
                            if (callback && $.isFunction(callback)) callback(data);
                        },
                        error: function (error) {
                            toastr.error(getText('DELETE_ERROR_MESSAGE'), options.appName)
                            console.error(error);
                        },
                    });
                }
            })
        },
        create: function (api, data, callback) {
            $.ajax({
                type: "POST",
                url: api,
                data: data,
                dataType: 'json',
                success: function (data) {
                    toastr.success(getText('CREATE_SUCCESS_MESSAGE'), options.appName)
                    if (callback && $.isFunction(callback)) callback(data);
                },
                error: function (error) {
                    console.error(error);
                    toastr.error(getText('CREATE_ERROR_MESSAGE'), options.appName)
                },
            });
        },
        update: function (api, id, data, callback) {
            $.ajax({
                type: "PUT",
                url: api + "/" + id,
                data: data,
                dataType: 'json',
                success: function (data) {
                    toastr.success(getText('UPDATE_SUCCESS_MESSAGE'), options.appName)
                    if (callback && $.isFunction(callback)) callback(data);
                },
                error: function (error) {
                    console.error(error);
                    toastr.error(getText('UPDATE_ERROR_MESSAGE'), options.appName)
                },
            });
        },
        find: function (api, data, callback) {
            $.ajax({
                type: 'POST',
                url: api + '/find',
                data: data,
                dataType: 'json',
                success: function (data) {
                    if (callback && $.isFunction(callback)) callback(data);
                },
                error: function (error) {
                    console.error(error);
                    toastr.error(getText('FIND_ERROR_MESSAGE'), options.appName)
                },
            });
        },
        get: function (api, callback) {
            $.ajax({
                type: 'GET',
                url: api,
                dataType: 'json',
                success: function (data) {
                    if (callback && $.isFunction(callback)) callback(data);
                },
                error: function (error) {
                    console.error(error);
                    toastr.error(getText('GET_ERROR_MESSAGE'), options.appName)
                },
            });
        },
        getById: function (api, id, callback) {
            $.ajax({
                type: 'GET',
                url: api + '/' + id,
                dataType: 'json',
                success: function (data) {
                    if (callback && $.isFunction(callback)) callback(data);
                },
                error: function (error) {
                    console.error(error);
                    toastr.error(getText('GET_ERROR_MESSAGE'), options.appName)
                },
            });
        }
    }


    // Funciones locales

    function createModalNew(object) {
        var entity = object.attr('data-entity').toLowerCase();
        var api = object.attr('data-api');
        // object.append(`	<div class="modal-dialog" role="document">
        //     <div class="modal-content">
        //         <div class="modal-header">
        //             <h5 class="modal-title" id="New${entity}ModalLabel"><%= __('CREATE_NEW_TRACK') %></h5>
        //             <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
        //                 <span aria-hidden="true">&times;</span>
        //             </button>
        //         </div>
        //         <div class="modal-body"><%- include('./${entity}.ejs', {formName :'${entity}Form', api:'${api}', object: null}) %></div>
        //         <div class="modal-footer">
        //             <button id="" type="button" class="btn btn-secondary" data-bs-dismiss="modal"><%= __('CLOSE') %></button>
        //             <button id="${entity}Form_submit_btn_modal" type="button" class="btn btn-primary"><%= __('SAVE_&_CONTINUE') %></button>
        //         </div>
        //     </div>
        // </div>`);

        $(`#${entity}Form_submit_btn`).unbind("click")
        $(`#${entity}Form_submit_btn`).hide()
        $(`#${entity}Form_submit_btn_modal`).click(() => {
            values = core.forms.parse(`${entity}Form`)
            core.api.create(api, values, (item) => {
                $(`#${entity}`).attr("data-value", item._id)
                $(`#New${entity}Modal`).modal("hide")
                core.forms.loadSelect($(`#${entity}`))
                $(`#${entity}Form`).each(function () {
                    this.reset()
                })
            })
        })

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