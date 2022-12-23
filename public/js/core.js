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
            DATE_FORMAT: 'mm/dd/yyyy',
            BOOLEAN_TRUE: 'Yes',
            BOOLEAN_FALSE: 'No'
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

    var tableDefaults = {
        'data-show-fullscreen': 'true',
        'data-minimum-count-columns': '2',
        'data-show-pagination-switch': 'true',
        'data-page-size': '15',
        'data-pagination': 'false',
        'data-show-columns': 'true',
        'data-show-columns-toggle-all': 'true',
        'data-buttons-align': 'left',
        'data-search': 'true',
        'data-search-align': 'left',
        'data-search-accent-neutralise': 'true',
        // 'data-height': '650',
        'data-show-export': 'true',
        'data-export-types': '["csv", "txt", "excel", "xlsx"]',
        'data-sticky-header': 'true',
        'data-mobile-responsive':"true",
        'data-check-on-init':"true",
    }

    var options = {}
    options.tableDefaults = tableDefaults

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

    function getLocales() {
        return $.getJSON(`/locales/${options.locale}.json`, function (data) {
            options.localized = data;
        });
    }

    // Core dialog function
    exports.setup = async function (new_options) {
        addActionEvent();
        await setTablesOptions();

        options = sanitize(new_options);
        await getLocales();


        setDatePickers();


        setSelect2()

        await createActionButton();
        await setModals();

        setInputMasks();

        setCollapse();

        return exports;
    }

    exports.goTo = function goTo(url) { window.location.assign(url) }

    var refreshViewCore = function () {
        if ($('#id').val() != '') $('.onlyId').show()
        else $('.onlyId').hide()

        if (typeof refreshView !== 'undefined') refreshView()
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
        },
        boolean: function (value, row, index) {
            return value ? options.localized.BOOLEAN_true : options.localized.BOOLEAN_false
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

            var dateInput = $(`#${formName} .mydatepicker`)
            dateInput.each((e, element) => {
                if ($(element).datepicker("getDate") != null) values[element.id] = moment($(element).datepicker("getDate")).format("YYYY-MM-DD")
            })

            return values;
        },
        loadSelect: function (select) {
            if (select.attr('data-collection')) {
                if (select.attr('data-hide-detail-link') != "true" && !select.attr('multiple')) {
                select.parent().css('display', 'flex')
                select.after(`<div class="input-group-append">
                    <button type="button" data-from="${select.attr('id')}" class="to-detail input-group-text h-100"><i class="fa-solid fa-eye"></i></button>
                    </div>`)
                $('.to-detail').on('click', function() {
                    if ($(`#${$(this).attr('data-from')}`).val() == "") return
                    var url = location.pathname.split('/')[1]
                    var collection = $(`#${$(this).attr('data-from')}`).attr('data-collection')
                    location.assign('/' + url + '/' + collection.toLowerCase() + '/' + $(`#${$(this).attr('data-from')}`).val());

                })
            }

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
                        if (select.attr('data-filter')) data = data.filter(v => {
                            var filter = JSON.parse(select.attr('data-filter'))
                            var resp = true;
                            for (const key in filter) {
                                if (Object.hasOwnProperty.call(filter, key)) {
                                    const element = filter[key];
                                    if (v[key] != element) resp = false;
                                }
                            }
                            if (!resp) {
                                if (select.attr('data-value').includes(v._id)) resp = true
                            }
                            return resp;
                        })
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
            } else if (select.attr('data-list-values')) {
                select.empty()
                select.append('<option value=""></option>')
                $.each(select.attr('data-list-values'), (i, item) => {
                    select.append(`<option value="${item.value}" ${((select.attr('data-value') && select.attr('data-value').includes(item.value)) ? "selected" : "")}>${item.text || item.value}</option>`);
                })
            } else if (select.attr('data-value-boolean')) {
                select.empty()
                select.append('<option value=""></option>')
                select.append(`<option value="true" ${((select.attr('data-value') && select.attr('data-value') == 'true') ? "selected" : "")}>${getText('BOOLEAN_TRUE')}</option>`)
                select.append(`<option value="false" ${((select.attr('data-value') && select.attr('data-value') == 'false') ? "selected" : "")}>${getText('BOOLEAN_FALSE')}</option>`)
            }
        },
        save: function (form, api, saveOverride, saveAfter, updateAfter, formParse) {
            if (saveOverride != null) saveOverride()
            else {
                var values = core.forms.parse(form)
                if (formParse) values = formParse(values)
                if (values == null) return;
                if (values.id) core.api.update(api, values.id, values, function (data) {
                    refreshViewCore(data)
                    if (saveAfter != null && saveAfter != '') saveAfter(data);
                })
                else core.api.create(api, values, function (data) {
                    $(`#${form} #id`).val(data.id)
                    refreshViewCore(data)
                    if (updateAfter != null && updateAfter != '') updateAfter(data);
                })
            }
        },
        saveNew: function (form, api, saveNewOverride, newAfter, saveAfter, updateAfter, formParse) {
            if (saveNewOverride != null) saveNewOverride()
            else {
                var values = core.forms.parse(form)
                if (formParse) values = formParse(values)
                if (values == null) return;
                if (values.id) core.api.update(api, values.id, values, function (data) {
                    refreshViewCore(data)
                    if (saveAfter != null && saveAfter != '') saveAfter(data);
                })
                else core.api.create(api, values, function (data) {
                    refreshViewCore(data)
                    if (updateAfter != null && updateAfter != '') updateAfter(data);
                })
                $(`#${form} #id`).val(null)
                if (newAfter != null && newAfter != '') newAfter();
            }
        },
        delete: function (form, api, deleteOverride, deleteAfter) {
            if (deleteOverride != null) deleteOverride()
            else {
                var values = core.forms.parse(form)
                if (values.id) core.api.delete(api, values.id, function (data) {
                    refreshViewCore(data)
                    if (deleteAfter != null && deleteAfter != '') deleteAfter(data);
                })
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
        var entity = object.attr('data-entity');
        $(object).find(`[data-type="action-buttons"] .btn`).each(function () {
            if (typeof $(this).attr('id') === 'undefined' || $(this).attr('id').search('_save_btn') == -1) $(this).remove();
            else {
                $(this).attr('onclick', `core.modalCallback("${entity}", "${$(object).find('form').attr('id')}", "${$(object).attr('data-api')}", "${$(object).attr('id')}")`)
            }
        })
        $(object).find(`[data-type="action-buttons"]`).append(`<button id="" type="button" class="btn btn-secondary" data-bs-dismiss="modal">${options.localized['CLOSE']}</button>`)
        $(object).find(`[data-bs-toggle="modal"]`).hide();
    }

    async function setModals() {
        // Cargar los cuadros modales
        await $(".modal-new").each(function () {
            createModalNew($(this));
        })
    }

    function setDatePickers() {
        // Establecer el valor de datepickers
        $(".mydatepicker").each(function () {
            var element = $(this)
            element.datepicker({
                language: options.locale,
                format: getText('DATE_FORMAT'),
                todayHighlight: true,
            });
            if (element.attr('date-value')) element.datepicker('setDate', moment.utc(element.attr('date-value')).format(getText('DATE_FORMAT').toUpperCase()))
            element.attr('autocomplete', 'off')
        })
    }

    function setCollapse() {
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
    }

    function setSelect2() {
        // Cargar los select con datos
        $("select").each(function () {
            var select = $(this)
            exports.forms.loadSelect(select)
        })

        // Formatear los SELECT
        $(".select2").select2();
        $(".select2.allow-new ").select2({ tags: true });
    }

    function setTablesOptions() {
        options.tableDefaults['data-locale'] = options.locale
        $('table').each(function () {
            for (const key in options.tableDefaults) {
                if (Object.hasOwnProperty.call(options.tableDefaults, key)) {
                    const value = options.tableDefaults[key];
                    var attr = $(this).attr(key);
                    if (typeof attr === 'undefined') $(this).attr(key, value)
                }
            }
        })

        // Tablas abren el elemento con un click
        $('table.clickable').each(function (index, value) {
            var a = $(`#${value.id}`)
            $(a).on('click-cell.bs.table', function (e, field, row, $element) {
                if (field != 'id' && !e.sender.columns.find(a => a.field == field).hasOwnProperty('detailFormatter')) {
                    e.stopPropagation();
                    window.location.href = $(a).attr('detail-url') + $element._id
                }
            })
        });
    }

    function addActionEvent() {
        // Establecer las acciones de BORRADO en las tablas
        var tables = $("[data-toggle='table']")
        if (tables) {
            window.actionEvents = {
                'click .delete': function (e, value, row, index) {
                    e.stopPropagation()
                    core.api.delete(tables.attr('data-url') || tables.attr('data-api'), row._id, function () {
                        tables.bootstrapTable('remove', {
                            field: 'id',
                            values: [row._id]
                        })
                    })
                }
            }
        }
    }

    function setInputMasks() {
        // Establecer las máscaras de formato
        $(".registry-time-inputmask").inputmask("99:99:99.999")
    }

    async function createActionButton() {
        // Creación de botonera en detalle de elementos
        // REQUIERE
        // data-type="action-buttons" 
        // data-api="url-api"
        // data-form="nombre-de-formulario"
        // data-permissions="<%=locals.permissions.join('')%>"

        // Si existe una función refreshView se va a llamar después de guardar o borrar

        // OPCIONES
        // data-save="true"         --> Mostrar el boton de GUARDAR
        // data-save-override=""    --> Función que sobreescribe comportamiento de GUARDAR
        // data-save-after=""       --> Función a ejecutar después de crear un nuevo registro
        // data-update-after=""     --> Función a ejecutar después de actualizar un registro existente
        // data-savenew="true"      --> Mostrar el botón de GUARDAR Y NUEVO
        // data-savenew-override="" --> Función que sobreescribe comportamiento de GUARDAR Y NUEVO
        // data-savenew-after=""    --> Función a ejecutar después de pulsar el botón GUARDAR Y NUEVO (se ejecuta después de data-save-after o data-update-after)
        // data-delete="true"       --> Mostrar el botón de ELIMINAR
        // data-delete-override=""  --> Función que sobreescribe comportamiento de ELIMINAR
        // data-delete-after=""     --> Función a ejecutar después de eliminar un registro
        // data-new="link"          --> Si no es vacío muestra el botón NUEVO y navega a la dirección especificada en el atributo al pulsarlo
        // data-list"link"          --> Si no es vacío muestra el botón LISTADO y navega a la dirección especificada en el atributo al pulsarlo
        // data-search"link"        --> Si no es vacío muestra el botón BUSCAR y navega a la dirección especificada en el atributo al pulsarlo
        await $('[data-type="action-buttons"]').each(function () {
            var buttonsGroup = $(this);

            var object = {};

            object.permissions = buttonsGroup.attr('data-permissions') ? buttonsGroup.attr('data-permissions').split('') : [];



            object.dataEntity = buttonsGroup.attr('data-entity') || 'Entity';

            object.dataApi = buttonsGroup.attr('data-api') || '/api/' + object.dataEntity;
            object.dataForm = buttonsGroup.attr('data-form') || object.dataEntity + "Form";

            object.dataNew = buttonsGroup.attr('data-new') || null;
            object.dataList = buttonsGroup.attr('data-list') || object.dataNew ? object.dataNew + "-list" : null;
            object.dataSearch = buttonsGroup.attr('data-search') || object.dataNew ? object.dataNew + "-search" : null;

            object.dataSave = buttonsGroup.attr('data-save') ? buttonsGroup.attr('data-save') == 'true' : true;

            object.dataSaveAfter = buttonsGroup.attr('data-save-after');
            if (object.dataSaveAfter === '') object.dataSaveAfter = null;

            object.dataFormParse = buttonsGroup.attr('data-save-form-parse');
            if (object.dataFormParse === '') object.dataFormParse = null;

            object.dataUpdateAfter = buttonsGroup.attr('data-update-after');
            if (object.dataUpdateAfter === '') object.dataUpdateAfter = null;

            object.dataSaveOverride = buttonsGroup.attr('data-save-override');
            if (object.dataSaveOverride == '') object.dataSaveOverride = null;

            object.dataSaveNew = buttonsGroup.attr('data-savenew') ? buttonsGroup.attr('data-savenew') == 'true' : true;

            object.dataSaveNewOverride = buttonsGroup.attr('data-savenew-override');
            if (object.dataSaveNewOverride == '') object.dataSaveNewOverride = null;

            object.dataNewAfter = buttonsGroup.attr('data-savenew-after');
            if (object.dataNewAfter == '') object.dataNewAfter = null;

            object.dataDelete = buttonsGroup.attr('data-delete') ? buttonsGroup.attr('data-delete') == 'true' : true;

            object.dataDeleteOverride = buttonsGroup.attr('data-delete-override');
            if (object.dataDeleteOverride == '') object.dataDeleteOverride = null;

            object.dataDeleteAfter = buttonsGroup.attr('data-delete-after');
            if (object.dataDeleteAfter == '') object.dataDeleteAfter = null;
            if (!object.dataDeleteAfter && object.dataList) object.dataDeleteAfter = `function () {core.goTo('${object.dataList}')}`;

            if (object.dataNew && object.dataNew != '' && object.permissions.includes('C')) buttonsGroup.prepend(`<button onclick="core.goTo('${object.dataNew}')" id="${object.dataForm}_new_btn" type="button" class="btn btn-success onlyId">${options.localized['NEW']}</button>\n`)
            if (object.dataSearch && object.dataSearch != '') buttonsGroup.prepend(`<button onclick="core.goTo('${object.dataSearch}')" id="${object.dataForm}_search_btn" type="button" class="btn btn-warning">${options.localized['SEARCH']}</button>\n`)
            if (object.dataList && object.dataList != '') buttonsGroup.prepend(`<button onclick="core.goTo('${object.dataList}')" id="${object.dataForm}_list_btn" type="button" class="btn btn-info">${options.localized['LIST']}</button>\n`)
            if (object.dataDelete && object.permissions.includes('D')) buttonsGroup.prepend(`<button onclick="core.forms.delete('${object.dataForm}', '${object.dataApi}', ${object.dataDeleteOverride}, ${object.dataDeleteAfter});" id="${object.dataForm}_delete_btn" type="button" class="btn btn-danger onlyId">${options.localized['DELETE']}</button>\n`)
            if (object.dataSaveNew && object.permissions.includes('U')) buttonsGroup.prepend(`<button onclick="core.forms.saveNew('${object.dataForm}', '${object.dataApi}', ${object.dataSaveNewOverride}, ${object.dataNewAfter}, ${object.dataSaveAfter}, ${object.dataUpdateAfter}, ${object.dataFormParse});" id="${object.dataForm}_savenew_btn" type="button" class="btn btn-primary">${options.localized['SAVE&NEW']}</button>\n`)
            if (object.dataSave && object.permissions.includes('U')) buttonsGroup.prepend(`<button onclick="core.forms.save('${object.dataForm}', '${object.dataApi}', ${object.dataSaveOverride}, ${object.dataSaveAfter}, ${object.dataUpdateAfter}, ${object.dataFormParse});" id="${object.dataForm}_save_btn" type="button" class="btn btn-primary">${options.localized['SAVE']}</button>\n`)


            refreshViewCore()
        })
    }

    // Funcion para recuperar los datos de un modal y asignarlos al formulario padre
    exports.modalCallback = function (entity, form, api, modal) {
        var values = core.forms.parse(`${form}`)
        core.api.create(api, values, (item) => {
            var combo = $(`#${entity.toLowerCase()}`)
            $(`#${modal}`).modal("hide")

            // Set the value, creating a new option if necessary
            if ($(combo).find("option[value='" + item._id + "']").length) {
                combo.val(item._id).trigger('change');
            } else {
                // Create a DOM Option and pre-select by default
                var newOption = new Option(item[combo.attr('data-show')], item._id, true, true);
                // Append it to the select
                combo.append(newOption).trigger('change');
            }
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