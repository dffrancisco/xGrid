/**
 * @author Francisco Alves 20/11/2016
 * @default xGrid 1.0
 *
 * @param {width} (px,%) altura do do xGrid default 100% <br>
 * example width:100; width:'50%';<br>
 *
 * @param {height} (px,%) largura do xGrid default 100%<br>
 * example height:100; height:'50%';<br>
 *
 * @param {heightLine} (px) largura do Linha default 30px<br>
 * example height:50;<br>
 *
 *
 * @param {columns} (objeto) colunas da xGrid
 * example columns:{<br>
 *                   'Nome': {dataField: 'name', width: '75%'},<br>
 *                   'Valor': {dataField: 'value', width: '25%'}<br>
 *                  }<br>
 *
 *
 * @param {onSelectLine} (objeto) evento é disparado quando a linha é selecionada<br>
 * example onSelectLine: function (fields) {<br>
 *              console.log(fields.name);<br>
 *          }<br>
 *
 *
 * @param {compare} (objeto) verifica linha e celula <br>
 * example name: {<br>
 *              dataField: ['qto', 'value'],<br>
 *              call: function (r) {<br>
 *              if (r.qto > 1) {<br>
 *                  return '<span style="color:red">' + r.value + '</span>';<br>
 *              } else {<br>
 *                  return r.value;<br>
 *                }<br>
 *              }<br>
 *            },<br>
 *
 * name:{ // identificador para comparação
 * dataField:[] // campos a serem comparados
 * fun:function(r){ //fun sera execultada, e retorna com callback um objeto de dados
 * return // o processo da function devera ser retornado para o return para ser aplicado na celula
 * }
 * }
 
 * em columns deve ser feito a referencia do compare para funcionar
 * example 'Nome': {dataField: 'name', width: '75%', compare:name}
 *
 *
 *
 //para usar com search
 query: {
 param: {
 maxItem: 50,
 class: 'novo',
 call: 'call'
 }
 }
 
 
 sideBySide: {
 id: '#dadosGrid',
 fields: {
 tel: {render: testeRende},
 qto: {compare: 'testeCompare'}
 },
 compare: {
 testeCompare: {
 dataField: ['qto', 'tel'],
 call: function (r) {
 return r.qto + r.tel;
 }
 }
 }
 }
 
 */
var xGrid = function (param) {
  var element;
  var elementSideBySide;

  var argDefalt = {
    data: {},
    onSelectLine: {},
    compare: {},
    heightLine: '',
    height: 'default',
    width: 'default',
    lineFocus: '',
    after: {},
    render: {},
    theme: 'x-gray',
    query: {},
    sideBySide: false,
    click: false,
    dblClick: false,
    enter: false
  };
  var arg = $.extend(argDefalt, param);

  var lineDataSource = {};
  var index;
  var xgridDados;
  var maxIndex = 0;
  var skip = 0;
  var lastSearch = {};

  this.create = function (data) {

    $(function () {
      element = $(document).find(param.id);

      if (data === undefined)
        data = [];

      arg.data = data;
      maxIndex = 0;
      skip = 0;
      if (arg.width !== 'default') {
        element.css('width', arg.width);
      }


      //verifica se a grid ja foi costruida
      if (!element.hasClass('xGrid-main')) {
        element.addClass('xGrid-main');
        var divTitle = $('<div>', {class: 'xGrid-title xGrid-row'});
        element.addClass(arg.theme);
        $.each(arg.columns, function (i, ln) {
          var span = $('<span>', {html: i});
          var divTxtTitle = $('<div>', {class: 'xGrid-col', style: "width:" + ln.width, name: ln.dataField}).append(span);
          divTitle.append(divTxtTitle);
        });
        element.append(divTitle);
      } else {
        element.find('.xGrid-content').remove();
      }

      xgridDados = $('<div>', {class: 'xGrid-content', style: arg.height !== 'default' ? 'height:' + arg.height + 'px' : ''});
      xgridDados.append(createLine(data));
      element.append(xgridDados);


      if (arg.sideBySide !== false) {
        elementSideBySide = $(arg.sideBySide.id);
      }

      if (arg.click !== false) {
        $(document).find(element).find('.xGrid-content').on('click', function () {
          arg.click(lineDataSource);
        });
      }
      if (arg.dblClick !== false) {
        $(document).find(element).find('.xGrid-content').on('dblclick', function () {
          arg.dblClick(lineDataSource);
        });
      }
      if (arg.enter !== false) {
        $(document).find(element).find('.xGrid-content').on('keydown', function (e) {
          if (e.keyCode === 13)
            arg.enter(lineDataSource);
        });
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



    });
  };

  function createLine(data) {
    // var maxIndex = element.attr('maxIndex') !== undefined ? 0 : element.attr('maxIndex');

    var div = $('<div>');
    //percorre o json
    $.each(data, function (i, ln) { //-------------
      // dataSource[i] = ln;
      var style = arg.heightLine !== '' ? 'height:' + arg.heightLine + 'px; ' : '';
      var xgridLinha = $('<div>', {class: 'xGrid-row', tabindex: maxIndex, style: style});
      // percore as colunas
      $.each(arg.columns, function (c, l) { //--------------
        // var value = ln[l.dataField];
        //  var value = l.render !== '' ? l.render.replace('/{value}/g', ln[l.dataField]) : ln[l.dataField];
        var value = l.render !== undefined ? l.render(ln[l.dataField]) : ln[l.dataField];
        if (l.compare !== undefined) { // verifica se tem o compare na coluna
          if (arg.compare[l.compare] !== undefined) // verifica se tem a declaração do compare
            if (arg.compare[l.compare].call.length !== undefined) { // verifica se tem a função compare

              var dataField = {}; //criar os paramentros com os valores
              $.each(arg.compare[l.compare].dataField, function (e, a) {
                dataField[a] = ln[a];
              });
              // console.log(dataField);
              // devolve o valor comparado para a xGrid
              value = arg.compare[l.compare].call(dataField);
            }
        }
        if (l.style !== undefined) {
          value = $('<span>', {html: value, style: l.style + '; width:100%'});
        }

        xgridLinha.append($('<div>', {class: 'xGrid-col', html: value, name: l.dataField, style: "width: " + l.width}));
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

  /**
   *
   * @param {type} field
   * @param {type} value
   * @example Get Value <br> grid.dataSource().name or grid.dataSource('name') <br>
   * set Value <br> grid.dataSource('name', 'Alves')
   * set any values <br> grid.dataSource({nome:'alves', tel:'11:114545'});
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
//                    if (l.dataField === field) {
//
//                        if (l.style !== undefined)
//                            value = $('<span>', {html: value, style: l.style + '; width:100%'});
//
//                        if (l.render !== undefined)
//                            value = l.render(value);
//
//                    }

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

    return lineDataSource;
  };

  /**
   *
   * @param {type} param {name:'alves', qto:5} or<br> [{name:'alves', qto:5}, {name:'Xico', qto:55}]
   * @param {type} order default top, bottom
   * @returns append line in dbgrid
   */
  this.insertLinha = function (param, order) {
    insertLinha(param, order);
  };

  function insertLinha(param, order) {
    var order = order === undefined ? 'top' : 'bottom';

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
      if (order === 'top')
        element.find('.xGrid-content').prepend(createLine(dt));
      else
        element.find('.xGrid-content').append(createLine(dt));
    }

    execultNavegador();
  }

  /**
   * @description Inclui novas linhas no final da grid, passar um objeto de dados
   * @param {type} param
   * @returns {undefined}
   */
  this.update = function (param) {
    //   console.log('asdf');
    var lastIndex = index;
    this.insertLinha(param, 'bottom');
    this.focus(lastIndex);
  };

  /**
   * @description foca o grid na linha desejada o index comessa com 0(zero)
   * @param {type} numLine
   * @returns {undefined}
   */
  this.focus = function (numLine) {
    element.find('.xGrid-content .xGrid-row')[numLine].focus();
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
//    var Index = _index_ === undefined ? index : _index_;
    var del = arg.data[index];
    delete arg.data[index];
    element.find('.xGrid-row[tabindex=' + index + ']').remove();
    index = undefined;
    return del;
  };

  /**
   *
   * @description desabilita o grid
   */
  this.disable = function () {
    element.prepend($('<div>', {class: 'xGrid-disable'}));
    $(document).find(element).find('.xGrid-row').off('keydown focusin focusout');
  };

  /**
   *
   * @description abilita o grid
   */
  this.enable = function () {
    element.find('.xGrid-disable').remove();
    execultNavegador();
  };

  /**
   *
   * @description exibe um preload na frente do grid, quando os dados chegar o preload some
   */
  this.load = function () {
    setTimeout(function () {
      element.find('.xGrid-load').remove();
      var html = '<i class="fa fa-spinner fa-pulse fa-fw fa-lg"></i> Carregando';
      element.prepend($('<div>', {class: 'xGrid-load', html: html}));
      element.find('.xGrid-content div').remove();
    }, 100);

//    element.find('.xGrid-content').append($('<div>', {class: 'xGrid-load', html: html}));
  };

  /**
   *
   * @description Atualiza os dados antigos
   */
  this.refresh = function () {
    this.create(arg.data);
  };

  function query() {
    var param = $.extend(arg.query.param, lastSearch);
    param['skip'] = skip;

    $.ajax({
      data: {
        param: param
      },
      success: function (r) {
        element.find('.xGrid-load-search').remove();
        if (r.length > 0) {
          var lastIndex = index;
          element.find('.xGrid-load').remove();
          insertLinha(r, 'bottom');
          element.find('.xGrid-content .xGrid-row')[lastIndex].focus();
        }
      }
    });
  }

  function search(param) {
    $(function () {
      lastSearch = param;
      query();
    });
  }

  /**
   * @description para o search funcionar o query quem que esta setado nas configurações do grid. exemplo.: <br>
   * query: { param: { maxItem: 10}}
   * @param {objeto de dados}
   */
  this.search = function (param) {
    this.create();
    index = 0;
    search(param);
  };

  /**
   * @description popula valores do dataSource nos inputs
   * @param {type} id identificador dos inputs
   * @returns {undefined}
   */
  this.sideBySide = function (id) {
    elementSideBySide = $(id);
    sideBySide(arg.data[index]);

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
            elementSideBySide.find('[name="' + field + '"]').prop('checked', value);
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
   *
   * @description get os dados os inputs e set no grid, obs.: Antes de chamar o sideBySideR() o sideBySide() deve ser invocado
   * @returns {undefined}
   */
  this.sideBySideR = function () {

    var fields = elementSideBySide.find('input, textarea, select').serializeArray();

    $.each(fields, function (i, a) {
      arg.data[index][a.name] = a.value;
    });

    elementSideBySide.find('[name]').each(function (i, a) {
      if ($(this).prop('type') === 'checkbox') {
        arg.data[index][$(this).attr('name')] = $(this).is(':checked');
      }
    });

    $.each(arg.data[index], function (field, value) {

      $.each(arg.columns, function (c, l) {
        if (l.dataField === field) {

          if (l.style !== undefined)
            value = $('<span>', {html: value, style: l.style + '; width:100%'});

          if (l.render !== undefined)
            value = l.render(value);

        }

      });


      element.find('.xGrid-row[tabindex=' + index + ']').find('div[name=' + field + ']').html(value);

    });
    sideBySide(arg.data[index]);

  };


  /**
   * @description retorna um objeto com os nomes dos fiels e os seus valores
   * @param {type} id (#pnPrincipal)
   * @returns {OBJETO}
   */
  this.getFieldsInputs = function (id) {
    var ele = $(id);
    var dados = {};

    var fields = ele.find('input, textarea, select').serializeArray();

    $.each(fields, function (i, a) {
      dados[a.name] = a.value;
    });

    ele.find('[name]').each(function (i, a) {
      if ($(this).prop('type') === 'checkbox') {
        dados[$(this).attr('name')] = $(this).is(':checked');
      }
    });


    return dados;

  };




  this.dados = function () {
    return arg;
  };

  function execultNavegador() {
    //destroi a ação do on -> para não duplicidade de evento
    $(document).find(element).find('.xGrid-row').off('keydown focusin focusout');
    // $(document).find(element).find('.xGrid-row').off('keydown');

    $(document).find(element).find('.xGrid-row').on({
      keydown: function (e) {
        var target = $(e.currentTarget);
        // seta para cima
        if (e.keyCode === 38) {
          target.prev().focus();
          if (e.preventDefault)
            e.preventDefault();
          if (e.stopPropagation)
            e.stopPropagation();
        }

        // seta para baixo
        if (e.keyCode === 40) {
          target.next().focus();
          if (e.preventDefault)
            e.preventDefault();
          if (e.stopPropagation)
            e.stopPropagation();
        }

        // page up
        if (e.keyCode === 33) {
          target.prev().prev().prev().prev().focus();
          if (e.preventDefault)
            e.preventDefault();
          if (e.stopPropagation)
            e.stopPropagation();
        }
        // page Down
        if (e.keyCode === 34) {
          target.next().next().next().next().focus();
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
        // element.attr('index', index);
        lineDataSource = arg.data[index];

        if (arg.onSelectLine.length !== undefined) {
          arg.onSelectLine(lineDataSource);
        }


        if (arg.sideBySide !== false) {
          sideBySide(arg.data[index]);
        }


      },
      focusout: function (e) {
//                $(e.currentTarget).removeClass("xGrid-Selected");
        //  $(document).find(element).css('border', '3px solid blue');


      }
    });

    $(document).find(element).on('focusout', function (a, b, c) {
      $(document).find(element).find('.xGrid-Selected').addClass("xGrid-SelectedFocusOut");
      $(document).find(element).find('.xGrid-row').removeClass("xGrid-Selected");
    });


//        $(document).find(element).on({
//            focusin: function () {
//                $(document).find(element).css('border','3px solid red');
//                console.log('bb');
//
//            },
//            focusout: function () {
//                $(document).find(element).css('border','3px solid blue');
//                $(document).find(element).find('.xGrid-Selected').addClass("xGrid-SelectedFocusOut");
//                console.log('asfd');
////                $(document).find(element).find('.xGrid-row').
//
//            }
//        });


    if (arg.data.length > 0)
      if (arg.lineFocus !== '')
        element.find('.xGrid-content .xGrid-row')[arg.lineFocus].focus();
  }
};
