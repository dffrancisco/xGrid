var xGrid = function (param) {
    const version = 3.2;
    var element;
    var elementSideBySide;
    var argDefalt = {
        data: {},
        columns: {},
        onSelectLine: {},
        compare: {},
        heightLine: '',
        height: 'default',
        width: 'default',
        lineFocus: '',
        render: {},
        theme: 'x-gray',
        query: {},
        sideBySide: false,
        click: false,
        dblClick: false,
        enter: false,
        duplicity: false,
        frame: false,
        complete: false,
        keyDown: false,
        count: false,
        title: true
    };
    var arg = $.extend(argDefalt, param);
    var lineDataSource = {};
    var index = 0;
    var xgridDados;
    var maxIndex = 0;
    var skip = 0;
    var count = 1;
    var lastSearch = {};
    var controlEnbleDisable = true;
    var controlFocus = false;
    var focusFieldObj = {};
    var abortAjax = null;

    this.version = version;

    this.create = function (data) {
        create(data);
    };

    function create(data) {
        $(function () {
            element = $(document).find(param.id);
            if (data === undefined)
                data = [];
            arg.data = data;
            maxIndex = 0;
            skip = 0;
            count = 1;
            if (arg.width !== 'default') {
                element.css('width', arg.width);
            }


            //verifica se a grid ja foi costruida
            if (!element.hasClass('xGrid-main')) {

                if (arg.count) {
                    var col = {};
                    col['&nbsp;'] = {width: '4%', style: 'text-align: center;opacity: 0.5'};
                    $.each(arg.columns, function (i, ln) {
                        col[i] = ln;
                    });
                    arg.columns = col;
                    col = '';
                }


                if (!Object.keys(arg.columns).length)
                    autoColumns(data);
                else
                    checkWidthColumns();

                element.addClass('xGrid-main');

                element.addClass(arg.theme);

                if (arg.title) {

                    var divTitle = $('<div>', {class: 'xGrid-title xGrid-row'});

                    $.each(arg.columns, function (i, ln) {
                        var span = $('<span>', {html: i});
                        var label = $('<label>');
                        var divTxtTitle = $('<div>', {class: 'xGrid-col', style: "width:" + ln.width, name: ln.dataField}).append(span).append(label);
                        divTitle.append(divTxtTitle);
                    });

                    element.append(divTitle);
                }

                //serve para corrigir problema da linha superior quando usado no mofo
                // element.before('<span style="opacity: 0; font-size: 5px;">&nbsp;</span>');

                orderByGrid();

            } else {
                element.find('.xGrid-content').remove();
//        setTimeout(function () {
//          element.find('.xGrid-load').remove();
//        }, 100);
            }

            xgridDados = $('<div>', {class: 'xGrid-content', style: arg.height !== 'default' ? 'height:' + arg.height + 'px' : ''});
//      xgridDados = $('<div>', {class: 'xGrid-content', style: arg.height !== 'default' ? 'height:' + arg.height : ''});

            xgridDados.append(createLine(data));

            element.append(xgridDados);

            if (arg.sideBySide !== false) {
                elementSideBySide = $(arg.sideBySide.id);
                tabToEnter();
                shortCut_Ctrl_EnterTextArea();

                if (data.length === 0)
                    xGridAx.xGridClearFields(elementSideBySide);
            }

            if (arg.sideBySide.duplicity !== undefined) {
//        add class duplicity no fields
                $.each(arg.sideBySide.duplicity.dataField, function (i, field) {
                    elementSideBySide.find('[name="' + field + '"]').addClass('duplicity');
                });
            }

            if (arg.click !== false) {
                $(document).find(element).find('.xGrid-content .xGrid-row').on('click', function () {
                    arg.click(lineDataSource);
                });
            }

            if (arg.dblClick !== false) {
                $(document).find(element).find('.xGrid-content .xGrid-row').on('dblclick', function () {
                    arg.dblClick(lineDataSource);
                });
            }

            if (arg.enter !== false) {
                $(document).find(element).find('.xGrid-content .xGrid-row').on('keydown', function (e) {
                    if (e.keyCode === 13)
                        arg.enter(lineDataSource);
                });
            }

            if (arg.keyDown !== false) {
                keyDown();
            }

            execultNavegador();

            //controla o scroll quando ativado a funcao query
            if (Object.keys(arg.query).length > 0)
                element.find('.xGrid-content').scroll(function () {
                    if ($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
                        element.prepend($('<div>', {class: 'xGrid-load-search', html: '<i class="fa fa-spinner fa-pulse fa-fw fa-lg"></i> Carregando'}));
                        search(lastSearch);
                    }
                });
            if (arg.complete !== false) {
                arg.complete();
            }

        });
    }

    function createLine(data) {
// var maxIndex = element.attr('maxIndex') !== undefined ? 0 : element.attr('maxIndex');

        if (data.length === 0)
            lineDataSource = [];
        var div = $('<div>');
        //percorre o json
        $.each(data, function (i, ln) { //-------------
            // dataSource[i] = ln;
            var style = arg.heightLine !== '' ? 'height:' + arg.heightLine + 'px; ' : '';
            var xgridLinha = $('<div>', {class: 'xGrid-row', tabindex: maxIndex, style: style});
            // percore as colunas
            $.each(arg.columns, function (c, l) { //--------------

                var value = l.render !== undefined ? l.render(ln[l.dataField]) : ln[l.dataField];
                if (arg.count === true && c === '&nbsp;') {
                    value = count++;
                }

                if (l.compare !== undefined) { // verifica se tem o compare na coluna

                    if (arg.compare[l.compare] !== undefined) // verifica se tem a declaração do compare
                        if (arg.compare[l.compare].call.length !== undefined) { // verifica se tem a função compare

                            var dataField = {}; //criar os paramentros com os valores
                            $.each(arg.compare[l.compare].dataField, function (e, a) {
                                dataField[a] = ln[a];
                            });
                            //retorna o valor da field que chama o compare
                            dataField['value'] = value;
                            // devolve o valor comparado para a xGrid
                            value = arg.compare[l.compare].call(dataField);
                        }
                }
                if (l.style !== undefined) {
                    value = $('<span>', {html: value, style: l.style + '; width:100%'});
                }

                var _class = '';
                if (l.class !== undefined) {
                    _class = ' ' + l.class;
                    console.log(l.class);
                }


                xgridLinha.append($('<div>', {class: 'xGrid-col' + _class, html: value, name: l.dataField, style: "width: " + l.width}));

            });
            //xgridDados.append(xgridLinha);
            div.append(xgridLinha);
            maxIndex++;
            skip++;
        });
        element.attr('maxIndex', maxIndex);
        div = div.html();
        return div;
    }

    function checkWidthColumns() {

        var valPercente = 0;
        var qtoColumn = 0;
        $.each(arg.columns, function (i, ln) {
            if (ln.width === undefined)
                qtoColumn++;
            var wd = ln.width !== undefined ? parseInt(ln.width) : 0;
            valPercente += parseInt(wd);
        });
        if (qtoColumn !== 0)
            $.each(arg.columns, function (i, ln) {
                if (ln.width === undefined)
                    ln.width = (100 - valPercente) / qtoColumn + '%';
            });
    }

    function autoColumns(data) {
        if (data[0] === undefined)
            data[0] = {xGrid: ''};
        var wid = 100 / Object.keys(data[0]).length;
        arg.columns = {};
        $.each(data[0], function (i, ln) {
            arg.columns[i] = {dataField: i, width: wid + '%'};
        });
    }

    /**
     *
     * @param {type} field
     * @param {type} value
     * @example Get Value <br> grid.dataSource().name or grid.dataSource('name') <br>
     * set Value <br> grid.dataSource('name', 'Alves')
     * set any values <br> grid.dataSource({nome:'alves', tel:'11114545'});
     * @returns grid.dataSource() return objeto
     */
    this.dataSource = function (field, value) {

        if (typeof field === 'string') {

            /* quando o field e o values forem peenchidos*/
            /*seta os valor passado na grid e no input quando informado*/
            if (field !== undefined && value !== undefined) {
                var i = index;
                var valueOld = value;
                $.each(arg.columns, function (c, l) {
                    if (l.dataField === field) {

                        value = l.render !== undefined ? l.render(value) : value;
                        if (l.style !== undefined) {
                            value = $('<span>', {html: value, style: l.style + '; width:100%'});
                        }
                    }
                });
                element.find('.xGrid-row[tabindex=' + index + ']').find('div[name=' + field + ']').html(value);
                arg.data[i][field] = valueOld;
                lineDataSource[field] = valueOld;
                //atualizar os inputs
                if (arg.sideBySide !== false)
                    sideBySide(arg.data[index]);
                return value;
            }

            /*get o valor do field solicitado*/
            if (field !== undefined && value === undefined) {
                return lineDataSource[field];
            }

        } else
        if (field !== undefined && value === undefined) {
            /*seta os valores passar por array*/

            $.each(field, function (id, val) {
                var valueCru = val;
                /*verifica se tem alguma formatação passada pelo o usuario*/
                $.each(arg.columns, function (c, l) {

                    if (l.dataField === id) {

                        val = l.render !== undefined ? l.render(val) : val;
                        if (l.style !== undefined) {
                            value = $('<span>', {html: val, style: l.style + '; width:100%'});
                        }
                    } else
                        value = val;
                });
                element.find('.xGrid-row[tabindex=' + index + ']').find('div[name=' + id + ']').html(value);
                arg.data[index][field] = valueCru;
                lineDataSource[id] = valueCru;
                //atualizar os inputs
                if (arg.sideBySide !== false)
                    sideBySide(arg.data[index]);
                return value;
            });
        }

        if (Object.keys(lineDataSource).length === 0)
            return false;
        else
            return lineDataSource;
    };

    /**
     *
     * @param {type} param {name:'alves', qto:5} or<br> [{name:'alves', qto:5}, {name:'Xico', qto:55}]
     * @param {type} order default top, bottom
     * @returns append line in dbgrid
     */
    this.insertLine = function (param, order) {
        insertLine(param, order);
    };

    function insertLine(param, order) {
        var order = order === undefined ? 'default' : order;
        var qtoLine = arg.data.length;
//    var order = order === undefined ? 'top' : 'bottom';

        if (param[0]) { // em formato array de objeto
            $.each(param, function (i, ln) {
                arg.data.push(ln);
            });
            if (order === 'top')
                element.find('.xGrid-content').prepend(createLine(param));
            else
                element.find('.xGrid-content').append(createLine(param));
        } else {// em formato objeto
            var dt = [];
            dt.push(param);
            arg.data.push(dt[0]);
            if (order === 'default') {
                if (index === 0)
                    element.find('.xGrid-content').prepend(createLine(dt));
                else
                    element.find('.xGrid-content [tabindex=' + index + ']').after(createLine(dt));
            }


            if (order.toUpperCase() === 'TOP') {
                element.find('.xGrid-content').prepend(createLine(dt));
            }


            if (order.toUpperCase() === 'BOTTOM') {
                element.find('.xGrid-content').append(createLine(dt));
                console.log('after');
            }

        }

        execultNavegador();

        if (order.toUpperCase() === 'DEFAULT')
            $('.dbGrid .xGrid-content').find('[tabindex="' + qtoLine + '"]').focus();



        /* seta o dataSource e popula os fields somente para o primeiro registro*/
        if (arg.sideBySide !== false)
            if (lineDataSource.length === 0) {
                sideBySide(arg.data[0]);
                lineDataSource = arg.data[0];
            }


        setTimeout(function () {
            element.find('.xGrid-load-search').remove();
            element.find('.xGrid-load').remove();
        }, 100);

    }

    /**
     * @description foca o grid na linha desejada o index comessa com 0(zero)
     * @example grid.focus(1); ou grid.focus() -> retorna para ultima posição;
     * @param {type} numLine
     * @returns {undefined}
     */
    this.focus = function (numLine) {

//foco mais preciso
//foco na linha e nao na posição
//      $('.dbGrid .xGrid-content').find('[tabindex="' + qtoLine + '"]').focus();

        if (Object.keys(lineDataSource).length > 0) {
            if (numLine === undefined) {
//                element.find('.xGrid-content .xGrid-row')[index].focus();
                element.find('.xGrid-content').find('[tabindex="' + index + '"]').focus();

            } else
//                element.find('.xGrid-content .xGrid-row')[numLine].focus();
                element.find('.xGrid-content').find('[tabindex="' + numLine + '"]').focus();


        } else

        if (numLine === undefined) {
            if (element.find('.xGrid-content .xGrid-row')[numLine] === undefined)
                controlFocus = true;
//            element.find('.xGrid-content .xGrid-row:visible').first().focus();
            element.find('.xGrid-content').find('[tabindex="0"]').focus();

        } else {

            element.find('.xGrid-content').find('[tabindex="' + index + '"]').focus();

            if (element.find('.xGrid-content .xGrid-row')[index] === undefined)
                controlFocus = true;
        }

    };

    this.focusFirstRow = function () {
        element.find('.xGrid-content .xGrid-row:visible').first().focus();
    }

    /**
     * 
     * @description passando o name do field ele foca no field com o name. Ou sem argumento foco no primeiro field do sideBySide
     */
    this.focusField = function (name) {

        setTimeout(function () {
            if (name === undefined) {
                focusFieldObj[0].focus();
                try {
                    focusFieldObj[0].select();
                } catch (e) {
                }
            } else
                elementSideBySide.find('[name="' + name + '"]').focus().select();
        }, 100);
    };

    /**
     *
     * @description retorna o index da linha selecionada
     * @returns {inteiro}
     */
    this.getIndex = function () {
        return index;
    };
    /**
     * @description deleta a linha selecionada
     * @param {type} index of the line
     * @example grid.deleteLine()<br> deleta a linha selecionada<br>
     *   grid.deleteLine(2) <br> deleta a linha corespondente a 2
     * @returns object deleted
     */
    this.deleteLine = function () {

        var del = arg.data[index];
        delete arg.data[index];
        var indexOld = index;
        var target = element.find('.xGrid-row[tabindex=' + index + ']');
        if (target.next().length === 0)
            target.prev().focus();
        else
            target.next().focus();
//        element.find('.xGrid-row[tabindex=' + indexOld + ']').animate({
        target.animate({
            opacity: '0.3',
            height: 0
        }, 500, function () {
//      element.find('.xGrid-row[tabindex=' + indexOld + ']').remove();
            target.remove();
        });
        if (element.find('.xGrid-content .xGrid-row').length === 1)
            if (arg.sideBySide !== false)
                clearDataSource();
        return del;
    };
    this.clearGrid = function () {
        element.find('.xGrid-content div').remove();
    };

    /**
     *
     * @description desabilita o grid
     */
    this.disable = function () {
        controlEnbleDisable = false;
        element.prepend($('<div>', {class: 'xGrid-disable', tabindex: 0}));
        //  $(document).find(element).find('.xGrid-disable').focus();
        $(document).find(element).find('.xGrid-row').off('keydown focusin focusout');
    };
    /**
     *
     * @description abilita o grid
     */
    this.enable = function () {
        element.find('.xGrid-disable').remove();
        execultNavegador();
        controlEnbleDisable = true;
    };
    /**
     *
     * @description exibe um preload na frente do grid, quando os dados chegar o preload some
     */
    this.load = function (text = 'Carregando . . .') {
        element.find('.xGrid-load').remove();
        setTimeout(function () {
            var html = '<i class="fa fa-spinner fa-pulse fa-fw fa-lg"></i> ' + text;
            element.prepend($('<div>', {class: 'xGrid-load', html: html}));
            // element.find('.xGrid-content div').remove();
        }, 100);
//    element.find('.xGrid-content').append($('<div>', {class: 'xGrid-load', html: html}));
    };

    this.closeLoad = function () {
        setTimeout(function () {
            element.find('.xGrid-load-search').remove();
            element.find('.xGrid-load').remove();
        }, 200);
    };

    /**
     *
     * @description Atualiza os dados antigos
     */
    this.refresh = function () {
        this.create(arg.data);
    };

    function query(call) {

        if (arg.query.param === undefined || arg.query.param.maxItem === undefined)
            arg.query.param = {
                maxItem: 50
            };

        var param = $.extend(arg.query.param, lastSearch);

        param['skip'] = skip;

        function success(r) {

            if (r.length > 0) {
//        console.log('xxxxxx');
                var lastIndex = index;
                insertLine(r, 'bottom');
                if (lastIndex !== 0)
                    element.find('.xGrid-content .xGrid-row')[lastIndex].focus();
            } else {

                if (arg.sideBySide) {
                    //   xGridAx.xGridClearFields(elementSideBySide);
                    //console.log('yyyyyyyy', arg.sideBySide);
                }

                setTimeout(function () {
                    element.find('.xGrid-load-search').remove();
                    element.find('.xGrid-load').remove();
                }, 100);

            }

            if (call !== undefined)
                call(r.length);

        }


        function stopAjax() {
            if (abortAjax !== null) {
                abortAjax.abort();
                abortAjax = null;
            }
        }


        if (arg.query.url === undefined) {

            abortAjax = $.ajax({
                data: arg.query,
                beforeSend: stopAjax,
                success: success,
                error: function (r) {
                    console.log('error, ajax query xGrid, pode ter sido stopAjax');
//          console.log(r);
                }
            });
        }


        if (arg.query.url !== undefined) {

            abortAjax = $.ajax({
                url: arg.query.url,
                data: arg.query,
                beforeSend: stopAjax,
                success: success,
                error: function (r) {
                    alert('error, verifique o log');
                    console.log(r);
                }
            });
        }

    }

    function search(param, call) {
        $(function () {
            lastSearch = param;
            query(call);
        });
    }

    /**
     * @description para o search funcionar o query quem que esta setado nas configurações do grid. exemplo.: <br>
     * query: { param: { maxItem: 10}}
     * @param {objeto de dados}
     */
    this.search = function (param, call) {
        if (!Object.keys(arg.columns).length)
            console.log('autoColumns dont work in search, please put columns in your xGrid');
        this.create();
        index = 0;
        search(param, call);
    };

    function sideBySide(source) {
        var argDefalt = {
            source: source,
            fields: {},
            compare: {},
            render: {}
        };
        var argSide = $.extend(argDefalt, arg.sideBySide);
        $.each(argSide.source, function (field, value) {
            try {
                var type = elementSideBySide.find('[name="' + field + '"]')[0].type;
                if (argSide.fields[field] !== undefined) {

                    value = argSide.fields[field].render !== undefined ? argSide.fields[field].render(value) : value;
                    if (argSide.compare[argSide.fields[field].compare] !== undefined) {
                        var dataField = {}; //criar os paramentros com os valores
                        $.each(argSide.compare[argSide.fields[field].compare].dataField, function (e, a) {
                            dataField[a] = argSide.source[a];
                        });
                        dataField['value'] = value;
                        value = argSide.compare[argSide.fields[field].compare].call(dataField);
                    }
                }

                switch (type) {
                    case undefined:
                        var typeEle = elementSideBySide.find('[name="' + field + '"]')[0].localName;
                        if (typeEle === 'img') {
                            elementSideBySide.find('[name="' + field + '"]').attr('src', value);
                        } else
                            elementSideBySide.find('[name="' + field + '"]').html(value);
                        break;
                    case 'text':
                    case 'password':
                    case 'textarea':
                    case 'number':
                    case 'tel':
                    case 'date':
                    case 'time':
                    case 'range':
                    case 'hidden':
                        elementSideBySide.find('[name="' + field + '"]').val(value);
                        break;
                    case 'radio':
                        elementSideBySide.find('[name="' + field + '"][value="' + value + '"]').prop('checked', true);
                        break;
                    case 'select-one':
                        elementSideBySide.find('[name="' + field + '"]').val(value).change();
                        break;
                    case 'checkbox':
                        elementSideBySide.find('[name="' + field + '"]').prop('checked', (value === '1' ? true : false));
                        break;
                    case '': //href
                        elementSideBySide.find('[name="' + field + '"]').attr('href', value).html(value);
                        break;
                }

            } catch (e) {
            }

        });
    }

    /**
     * @param {objeto} 
     * @example grid.sideBySideExt({field1:'aa', field2:'bb'}); 
     * @description recebe um objeto externo e passar para os fildes do sideBySide
     */
    this.sideBySideExt = function (source) {
        sideBySide(source);
    };
    this.getFieldsToObjeto = function (toUpperCase = false) {
        return getFieldsToObjeto(toUpperCase);
    };
    /**
     * @description retona um objeto com o nome e valor dos fields do sideByside
     * @param {toUpperCase} defalt false, quando true retorna os dados em maiusculo 
     * @returns objeto
     */
    function getFieldsToObjeto(toUpperCase = false) {
        var objeto = {};
        var element = $(arg.sideBySide.id);
        var fields = element.find('input, textarea, select').serializeArray();
        $.each(fields, function (i, a) {

            /*se o conteudo da variavel for numerico ele retorna false*/
            /*para igular os valores no edit esta 1,00 no lineDataSourse esta 1.00*/
            if (!isNaN(parseFloat(a.value))) {
                if (a.value.indexOf(",") !== -1)
                    a.value = a.value.replace(/\./g, '').replace(/\,/g, '.');
            }
            a.value = $.trim(a.value);
            if (typeof a.value === 'string')
                objeto[a.name] = toUpperCase ? a.value.toUpperCase() : a.value;
            else
                objeto[a.name] = a.value;
        });
        element.find('[name]').each(function (i, a) {
            if ($(this).prop('type') === 'checkbox') {
                objeto[$(this).attr('name')] = $(this).is(':checked');
                objeto[$(this).attr('value')] = $(this).is(':checked') ? '1' : '0';
            }
        });
        return objeto;
    }


    /**
     * 
     * @returns {undefined}
     * @example dentro do sideByside <> br 
     * tabindex-1 no input desabilita o focus
     * tabindex defalt false, quando true e preciso colocar nos input tabindex=?
     * tabToEnter defalt true, quando false o enter não funciona como o tab
     */

    this.tabToEnter = function () {
        tabToEnter();
    };
    function tabToEnter() {

        var tabindex = false;
        if (arg.sideBySide.tabindex)
            tabindex = true;
        if (arg.sideBySide.tabToEnter !== false) {


            if (tabindex) {
                focusFieldObj = elementSideBySide.find('input,select,button,textarea')
                        .filter("[tabindex]:not([tabindex=-1])")
                        .sort(function (a, b) {
                            return a.tabIndex > b.tabIndex ? 1 : -1;
                        });
            } else
                focusFieldObj = elementSideBySide.find('input,select,button,textarea')

            elementSideBySide.on('keydown', 'input, select, textarea', function (e) {
                if (e.keyCode === 13) {
                    var next;
                    focusFieldObj = focusFieldObj.filter(':not([disabled]):visible:not([tabindex=-1])');
                    focusFieldObj.push($('.btnSalvar-Frame'));
                    next = focusFieldObj.eq(focusFieldObj.index(this) + 1);
                    if (next.length) {
                        next.focus().select();
                    }
                    return false;
                }
            });
        }
    }


    function shortCut_Ctrl_EnterTextArea() {

        elementSideBySide.find('textarea').off('keydown');
        elementSideBySide.find('textarea').on('keydown', function (e) {

            if (e.keyCode === 13 && e.ctrlKey) {

                var start = $(this).prop("selectionStart");
                var end = $(this).prop("selectionEnd");
                var text = $(this).val();
                var before = text.substring(0, start);
                var after = text.substring(end, text.length);
                $(this).val(before + '\n' + after);
                $(this)[0].selectionStart = $(this)[0].selectionEnd = start + 1;
                if (e.preventDefault)
                    e.preventDefault();
                if (e.stopPropagation)
                    e.stopPropagation();
                return false;
            }

        });
    }


    /**
     * 
     * @description filtra o grid em tempo real
     * sem cunsulta no banco
     * @param {filtro}
     * @param {field}
     * @example passando somente o filtro ele filtra tudo, passando o field ele filtra especifico;
     * 1º grid.filtro('BRASILIA'); todas que tiver BRASILIA NO GRID
     * 2º grid.filtro('BRASILIA','DF'); somente no campo DF que procurar BRASILIA
     */
    this.filtro = function (filtro, field) {

        if (field === undefined) {
//      $('#griCarro').find(".xGrid-content .xGrid-col:not(:contains(G))").hide(); 
//      $('#griCarro').find(".xGrid-content .xGrid-col:contains(G)").hide(); 
            element.find(".xGrid-content .xGrid-col").parent().hide();
            element.find(".xGrid-content .xGrid-col:contains(" + filtro.toUpperCase() + ")").parent().show();

        } else {
//      element.find(".xGrid-content .xGrid-row").css("display", "block");
//
//      element.find(".xGrid-content .xGrid-row [name=" + field + "]").each(function () {
//        if ($(this).text().toUpperCase().indexOf(filtro.toUpperCase()) < 0)
//          $(this).parent().css("display", "none");
//        else
//          $(this).parent().css("display", "");
//      });



            var valThis = filtro.toLowerCase();

//      element.find(".xGrid-content .xGrid-row .xGrid-col").each(function () {
            element.find(".xGrid-content .xGrid-row [name=" + field + "]").each(function () {
                var textL = $(this).text().toLowerCase();

                if (textL.indexOf(valThis) == 0)
                    $(this).parent().show();
                else
                    $(this).parent().hide();

            });



        }
    };

    this.clearFiltro = function () {
        element.find(".xGrid-content .xGrid-row").css("display", "block");
    };


    this.dados = function () {
        return arg;
    };


    function execultNavegador() {
        var forOnSelectLine = -1;
        if (arg.data.length > 0) {

            //destroi a ação do on -> para não duplicidade de evento
            $(document).find(element).find('.xGrid-row').off('keydown focusin focusout');
            // $(document).find(element).find('.xGrid-row').off('keydown');

//            $(document).find(element).find('.xGrid-row').on({
            $(document).find(element).find('.xGrid-row').on({
                keydown: function (e) {
//                    var target = $(e.currentTarget);
                    //  console.log(target);

                    // seta para cima
                    if (e.keyCode === 38) {

                        var scroll = $(document).find(element).find('.xGrid-content').scrollTop();
                        if (scroll > 0)
                            $(document).find(element).find('.xGrid-content').scrollTop(scroll - 1);

//                        target.prev().focus();

                        element.find('.xGrid-Selected').prevAll('.xGrid-row:visible').first().focus();


                        if (e.preventDefault)
                            e.preventDefault();

                        if (e.stopPropagation)
                            e.stopPropagation();
                    }

                    // seta para baixo
                    if (e.keyCode === 40) {

                        var scroll = $(document).find(element).find('.xGrid-content').scrollTop();


                        if (scroll > 0)
                            $(document).find(element).find('.xGrid-content').scrollTop(scroll + 1);

                        //  target.next().focus();
                        element.find('.xGrid-Selected').nextAll('.xGrid-row:visible').first().focus();

                        if (e.preventDefault)
                            e.preventDefault();
                        if (e.stopPropagation)
                            e.stopPropagation();
                    }

                    // page up
                    if (e.keyCode === 33) {

                        //target.prev().prev().prev().prev().focus();

                        element.find('.xGrid-Selected').prevAll('.xGrid-row:visible').first().prev().prev().prev().prev().focus();

                        if (e.preventDefault)
                            e.preventDefault();
                        if (e.stopPropagation)
                            e.stopPropagation();
                    }

                    // page Down
                    if (e.keyCode === 34) {

                        // target.next().next().next().next().focus();

                        element.find('.xGrid-Selected').nextAll('.xGrid-row:visible').first().next().next().next().next().focus();

                        if (e.preventDefault)
                            e.preventDefault();
                        if (e.stopPropagation)
                            e.stopPropagation();
                    }

                },
                focusin: function (e) {

                    $(document).find(element).find('.xGrid-row').removeClass("xGrid-Selected");

                    $(document).find(element).find('.xGrid-row').removeClass("xGrid-SelectedFocusOut");

                    $(e.currentTarget).addClass("xGrid-Selected");

                    //seta o index na div principal
                    index = $(e.currentTarget).attr('tabindex');
                    lineDataSource = arg.data[index];

                    if (arg.onSelectLine.length !== undefined) {
                        if (index != forOnSelectLine) {
                            forOnSelectLine = index;
                            arg.onSelectLine(lineDataSource);
                        }
                    }



                    if (arg.sideBySide !== false) {
                        sideBySide(arg.data[index]);
                    }


                }
            });


            $(document).find(element).on('focusout', function () {
                $(document).find(element).find('.xGrid-Selected').addClass("xGrid-SelectedFocusOut");
                $(document).find(element).find('.xGrid-row').removeClass("xGrid-Selected");
            });
            if (controlEnbleDisable)
                if (arg.data.length > 0)
                    if (arg.lineFocus !== '')
                        element.find('.xGrid-content .xGrid-row')[arg.lineFocus].focus();
            if (controlEnbleDisable)
                if (controlFocus) {
                    element.find('.xGrid-content .xGrid-row')[0].focus();
                    controlFocus = false;
                }

        } else {
            controlFocus = false;
        }

    }

    function duplicity(obj) {
        var that = false;
        var field = obj.attr('name');
        var value = obj.val();
//    controleDuplicity = false;


        if (value !== '')
//    console.log(field, value, lineDataSource[field]);  
//      if (lineDataSource[field] !== undefined) // no credito precisamos colocar essa sentenca, no insert do produto quando usada não fuciona o duplicity
            if (lineDataSource[field] !== value) {

                var data = {
                    class: 'crud',
                    call: 'duplicity',
                    param: {
                        field: field,
                        table: arg.sideBySide.duplicity.table,
                        value: value
                    }
                };
                function beforeSend() {
                    obj.addClass('preloadInput');
                }

                function success(r) {

                    obj.removeClass('preloadInput');
                    if (r.length > 0) {
                        // alert(obj.prev().html() + ' já está em uso.');
                        obj.addClass('treme');
                        $('body').append('<div id="pnMensDuplicity">' + obj.prev().html() + ' já está em uso.</div>');
                        setTimeout(function () {
                            obj.removeClass('treme');
                        }, 1000);
                        setTimeout(function () {
                            xGridAx.RemovePnMensDuplicity();
                        }, 5000);
//              obj.focus().select();
                        that = true;
                    }
                }

                if (arg.sideBySide.duplicity.url === undefined) {
                    $.ajax({
                        async: false,
                        data: data,
                        beforeSend: beforeSend,
                        success: success
                    });
                }

                if (arg.sideBySide.duplicity.url !== undefined) {
                    $.ajax({
                        url: arg.sideBySide.duplicity.url,
                        async: false,
                        data: data,
                        beforeSend: beforeSend,
                        success: success
                    });
                }

                return that;
            }
    }

    this.getDuplicityAll = function () {
        var that = false;
        elementSideBySide.find('.duplicity').each(function () {
            that = duplicity($(this));
            if (that)
                return false;
        });
        return that;
    };
    this.clearDataSource = function () {

        xGridAx.xGridClearFields(elementSideBySide);
        lineDataSource = {};
    };
    function clearDataSource() {
        xGridAx.xGridClearFields(elementSideBySide);
        lineDataSource = {};
    }

    this.clearFields = function () {
        xGridAx.xGridClearFields(elementSideBySide);
    };
    this.enableBtnsSalvarCancelar = function () {
        xGridAx.enableBtnsSalvarCancelar(arg.sideBySide);
    };
    this.disableBtnsSalvarCancelar = function () {
        xGridAx.disableBtnsSalvarCancelar(arg.sideBySide);
    };
    function orderByGrid() {
        $(document).find(element).find('.xGrid-title .xGrid-col').on('click', function () {

            var val = $(this).attr('name');
            var order = $(this).find('label').attr('order');
            if (val === undefined)
                return false;
            if (order === 'desc') {
                $(this).find('label').removeAttr('order').removeClass('xGridAsc').removeClass('xGridDesc');
                return false;
            }

            element.find('.xGrid-title .xGrid-col label').removeClass('xGridAsc').removeClass('xGridDesc');
            var newArray = arg.data.sort(function (a, b) {
                // console.log(a,b);
                if (order === undefined) {
                    if (!(a[val] - b[val]))
                        return a[val] > b[val];
                    else
                        return a[val] - b[val];
                }
                if (order === 'asc') {
                    if (!(b[val] - a[val]))
                        return b[val] > a[val];
                    else
                        return b[val] - a[val];
                }

            });
            if (order === undefined)
                $(this).find('label').attr('order', 'asc').addClass('xGridAsc');
            if (order === 'asc')
                $(this).find('label').attr('order', 'desc').addClass('xGridDesc').removeClass('xGridAsc');
            create(newArray);
        });
    }

    function keyDown() {
        var controKeyDown = {};
        $.each(arg.keyDown, function (id, obj) {
            controKeyDown[String(obj.key).toUpperCase()] = {call: obj.call};
        });
        //remove o evento do DOM
//    $(document).find(element).find('.xGrid-content').off('keydown');

        $(document).find(element).find('.xGrid-content').on('keydown', function (e) {

            var ctrlKey = e.ctrlKey ? 'CTRL+' : '';
            var shiftKey = e.shiftKey ? 'SHIFT+' : '';
            var altKey = e.altKey ? 'ALT+' : '';
            var key = ctrlKey + shiftKey + altKey + e.keyCode;
            if (key in controKeyDown) {
                controKeyDown[key].call(lineDataSource);
                if (e.preventDefault)
                    e.preventDefault();
                if (e.stopPropagation)
                    e.stopPropagation();
                return false;
            }

        });
    }

    this.differenceTwoObject = function (toUpperCase = false) {
        var objOld = {};
        var objNew = {};
        var fieldsNew = getFieldsToObjeto(toUpperCase);
//    console.log(fieldsNew);
        $.each(fieldsNew, function (oldField, oldValue) {

            lineDataSource[oldField] = lineDataSource[oldField] == null ? '' : lineDataSource[oldField];
//      console.log(typeof oldValue);
            if (typeof oldValue === 'string') {
                if (lineDataSource[oldField].toUpperCase() != oldValue.toUpperCase()) {
//        if (lineDataSource[oldField] != null && oldValue != '') {
//        if (lineDataSource[oldField] != null) {
                    objOld[oldField] = $.trim(lineDataSource[oldField]);
                    objNew[oldField] = $.trim(oldValue);
//        }
                }
            } else {
                console.log(oldValue, 'outro Value');
                if (lineDataSource[oldField] != oldValue) {
//        if (lineDataSource[oldField] != null && oldValue != '') {
//        if (lineDataSource[oldField] != null) {
                    objOld[oldField] = lineDataSource[oldField];
                    if (typeof oldValue === 'boolean')
                        objNew[oldField] = (oldValue == true ? '1' : '0');
                    else
                        objNew[oldField] = oldValue;
//        }        
                }
            }
        });
        if (Object.keys(objNew).length > 0)
            return {'objOld': objOld, 'objNew': objNew};
        else
            return false;
    };
    this.destroy = function () {
        element.find('.xGrid-title').remove();
        element.find('.xGrid-content').remove();
        element.removeClass('xGrid-main x-gray');
        element.removeAttr('maxindex');
    };
    /* auto execult */

    if (arg.sideBySide.duplicity !== undefined) {
        $(document).find(arg.sideBySide.id).on('blur', '.duplicity', function () {
            duplicity($(this));
        });
    }

    if (arg.sideBySide.frame !== undefined) {
        xGridAx.frameBtns(arg.sideBySide, clearDataSource);
        /*CANCELAR*/
        if (arg.sideBySide.frame.btnCancel !== undefined) {

            $(document).on('keydown', function (e) {
                /* asc + ctrl execulta o button cancelar*/
                if (e.keyCode === 27 && e.ctrlKey)
                    if (!$(arg.sideBySide.frame.id).find('.btnCancelar-Frame').prop('disabled'))
                        $(arg.sideBySide.frame.id).find('.btnCancelar-Frame').click();
            });
            $(document).on('click', arg.sideBySide.frame.id + ' .btnCancelar-Frame', function () {

                if (arg.sideBySide.frame.btnCancel() === false)
                    return false;
                try {
                    sideBySide(arg.data[index]);
                    lineDataSource = arg.data[index];
                } catch (e) {

                }

                xGridAx.disableBtnsSalvarCancelar(arg.sideBySide);
            });
        }

    }

};

var xGridAx = (function () {
    function xGridClearFields(element) {

        element.find('[name]').each(function (i, a) {
            var type = $(this).prop('type');
            switch (type) {
                case undefined:
                    var typeEle = $(this).prop('localName');
                    if (typeEle === 'img') {
                        $(this).attr('src', '');
                    } else
                        $(this).html('');
                    break;
                case 'text':
                case 'password':
                case 'textarea':
                case 'number':
                case 'tel':
                case 'date':
                case 'time':
                case 'range':
                case 'hidden':
                    $(this).val('');
                    break;
                case 'radio':
                    $(this).prop('checked', false);
                    break;
                case 'select-one':
                    $(this).val('').change();
                    break;
                case 'checkbox':
                    $(this).prop('checked', false);
                    break;
                case '': //href
                    $(this).attr('href', '').html('');
                    break;
            }

        });
    }

    function frameBtns(sideBySide, clearDataSource) {
        var frame = sideBySide.frame;
        /*PDF*/
        if (frame.btnPDF !== undefined) {
            $(frame.id).append('<button class="btn-Frame btnPDF-Frame"><i class="fa fa-file-pdf-o"></i></button>');
            $(document).on('click', frame.id + ' .btnPDF-Frame', function () {
                frame.btnPDF();
            });
        }

        /*IMPRIMIR*/
        if (frame.btnPrint !== undefined) {
            $(frame.id).append('<button class="btn-Frame btnPrint-Frame"><i class="fa fa-print"></i></button>');
            $(document).on('click', frame.id + ' .btnPrint-Frame', function () {
                frame.btnPrint();
            });
        }

        /*NOVO*/
        if (frame.btnInsert !== undefined) {
            $(frame.id).append('<button class="btn-Frame btnNovo-Frame"><i class="fa fa-file-o"></i> Novo</button>');
            $(document).on('click', frame.id + ' .btnNovo-Frame', function () {
                if (frame.btnInsert() === false)
                    return false;
                clearDataSource();
                enableBtnsSalvarCancelar(sideBySide);
            });
        }

        /*ALTERAR*/
        if (frame.btnEdit !== undefined) {
            $(frame.id).append('<button class="btn-Frame btnAlterar-Frame"><i class="fa fa-pencil"></i> Alterar</button>');
            $(document).on('click', frame.id + ' .btnAlterar-Frame', function () {
                if (frame.btnEdit() === false)
                    return false;
                enableBtnsSalvarCancelar(sideBySide);
            });
        }

        /*EXCLUIR*/
        if (frame.btnDelete !== undefined) {
            $(frame.id).append('<button class="btn-Frame btnExcluir-Frame"><i class="fa fa-trash-o"></i> Excluir</button>');
            $(document).on('click', frame.id + ' .btnExcluir-Frame', function () {
                if (frame.btnDelete() === false)
                    return false;
//        console.log('excluir');
            });
        }

        /*SALVAR*/
        if (frame.btnSave !== undefined) {
            $(frame.id).append('<button class="btn-Frame btnSalvar-Frame" disabled><i class="fa fa-floppy-o"></i> Salvar</button>');
            $(document).on('click', frame.id + ' .btnSalvar-Frame', function () {
                if (frame.btnSave() === false)
                    return false;
                disableBtnsSalvarCancelar(sideBySide);
            });
        }

        /*CANCELAR*/
        if (frame.btnCancel !== undefined) {
            $(frame.id).append('<button class="btn-Frame btnCancelar-Frame" disabled title="ESC+CTRL Atalho" ><i class="fa fa-stop"></i> Cancelar</button>');
            /*o evento do button cancel estar no xgrid*/
        }


        disableBtnsSalvarCancelar(sideBySide);
    }

    function enableBtnsSalvarCancelar(sideBySide) {
        $(sideBySide.frame.id).find('.btnSalvar-Frame, .btnCancelar-Frame').prop("disabled", false);
        $(sideBySide.frame.id).find('.btnLocalizar-Frame, .btnNovo-Frame, .btnAlterar-Frame, .btnExcluir-Frame, .btnPrint-Frame, .btnPDF-Frame').prop("disabled", true);
        $(sideBySide.id).find("input[type='text'], textarea").prop('readonly', false);
        $(sideBySide.id).find("select, input[type='radio'], input[type='checkbox']").prop('disabled', false);
        //   $(".chosen").prop('disabled', false).trigger('chosen:updated');
    }

    function disableBtnsSalvarCancelar(sideBySide) {
        $(sideBySide.frame.id).find('.btnSalvar-Frame, .btnCancelar-Frame').prop("disabled", true);
        $(sideBySide.frame.id).find('.btnLocalizar-Frame, .btnNovo-Frame, .btnAlterar-Frame, .btnExcluir-Frame, .btnPrint-Frame, .btnPDF-Frame').prop("disabled", false);
        $(sideBySide.id).find("input[type='text'], textarea").prop('readonly', true);
        $(sideBySide.id).find("select, input[type='radio'], input[type='checkbox']").prop('disabled', true);
    }

    function RemovePnMensDuplicity() {
        $('#pnMensDuplicity').animate({top: "-100px"}, 1000, function () {
            $('#pnMensDuplicity').remove();
        });
    }

    $(document).on('click', '#pnMensDuplicity', function () {

        RemovePnMensDuplicity();
    });
    return {
        xGridClearFields: xGridClearFields,
        frameBtns: frameBtns,
        disableBtnsSalvarCancelar: disableBtnsSalvarCancelar,
        enableBtnsSalvarCancelar: enableBtnsSalvarCancelar,
        RemovePnMensDuplicity: RemovePnMensDuplicity

    };
})();

/*
 modificações romulo 27/01
 xGrid
 linha 669 mod
 linha 723 add
 linha 1120 add
 */