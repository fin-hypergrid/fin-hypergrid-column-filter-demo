'use strict';

// "require" external dependencies
var Hypergrid = require('fin-hypergrid'),
    DataModelLocal = require('datasaur-local'),
    DataModelFilter = require('datasaur-filter');

// "require" local dependencies
var makeData = require('./make-data');

// build data, data model
var data = makeData(),
    dataModel = new DataModelFilter(new DataModelLocal);

var grid = window.grid = new Hypergrid({
    dataModel: dataModel,
    data: data
});


var FilterSubgrid = require('./FilterSubgrid'),
    dataModels = require('fin-hypergrid/src/dataModels');

dataModels.add(FilterSubgrid);


grid.properties.showFilterRow = 1;
grid.properties.subgrids = [
    'HeaderSubgrid',
    'FilterSubgrid',
    'data'
];


var filterExpressionLabel = document.querySelector('label'),
    filterExpressionTextBox = document.getElementById('filter-expression'),
    traditionalSyntaxCheckBox = document.getElementById('trad-syntax'),
    alternateSyntaxCheckBox = document.getElementById('abbr-syntax'),
    keyboardModeChooser = document.getElementById('keyboard-mode-chooser'),
    errorBox = document.getElementById('error');

var columnNames = grid.behavior.schema.map(function(columnSchema) { return columnSchema.name; });
filterExpressionLabel.title = 'Column names:\n' + columnNames.join('\n');

grid.addEventListener('fin-after-cell-edit', function f(e) {
    var cellEvent = e.detail.input.event;
    if (cellEvent.isFilterCell) {
        setFilter();
    }
});

alternateSyntaxCheckBox.onchange = traditionalSyntaxCheckBox.onchange = setFilter;

// Bonus feature: support for immediate keyboard mode (see also the `getCellEditorAt` defined in FilterSubgrid)
grid.cellEditors.add(require('./FilterEditor'));
keyboardModeChooser.addEventListener('click', function(e) {
    if (e.target.name === 'keyboard-mode') {
        grid.properties.filteringMode = e.target.value; // see FilterEditor.js
    }
});

// concatenate all column filters and call dataModel.setFilter
function setFilter() {
    var errText = '',
        trad = traditionalSyntaxCheckBox.checked,
        options = {
            vars: [],
            syntax: trad ? 'traditional' : 'javascript'
        },
        and = trad ? 'and' : '&&',
        columns = grid.behavior.columns.map(function(column) { return {
            name: column.name,
            filter: column.properties.filter
        }; });

    if (alternateSyntaxCheckBox.checked) {
        columns.forEach(convertAlternateSyntax);
    }

    var filters = columns
        .map(function(column) { return column.filter; })
        .reduce(function(list, item) { if (item) { list.push(item); } return list; }, []);

    var expression = !filters.length
        ? ''
        : filters.length === 1
            ? filters[0]
            : '(' + filters.join(') ' + and + ' (') + ')';

    filterExpressionTextBox.value = expression;

    try {
        grid.behavior.dataModel.setFilter(expression, options);
    } catch (err) {
        errText += err;
    }

    errorBox.innerHTML = errText;
}

var regex = {
    starsWithUnaryOpAndOrIdentifierOrLiteralOrOpenParens: /^([-+~!]\s*)?[$\w'"\d(]/,
    containsRelationalOperator: /([<>]=?|<>|!?={1,3})/,
    startsWithRelationalOperator: /^([<>]=?|<>|!?={1,3})/
};

function convertAlternateSyntax(column) {
    var filter = column.filter,
        equalityOperator = traditionalSyntaxCheckBox.checked ? '=' : '===';

    if (filter && filter.length) {
        filter = filter
            .replace(/\bor\b|,/gi, '||')
            .replace(/\band\b|;/gi, '&&');

        for (var i = 0, j = 0; i < filter.length; i += x.length + 2) {
            j = filter.substr(i).search(/\|\||&&/);
            if (j < 0) { j = filter.length; }

            // add omitted equality operator
            var x = filter.substr(i).substr(0, j).trim();
            if (
                regex.starsWithUnaryOpAndOrIdentifierOrLiteralOrOpenParens.test(x) &&
                !regex.containsRelationalOperator.test(x)
            ) {
                x = equalityOperator + x;
            }

            // add omitted column name
            if (regex.startsWithRelationalOperator.test(x)) {
                x = column.name + x;
            }

            filter = filter.substr(0, i) + x + filter.substr(j);
        }
    } else {
        filter = undefined;
    }

    column.filter = filter;
}
