'use strict';

var DataSourceBase = require('datasaur-base');

/**
 * @implements dataModelAPI
 * @param {Hypergrid} grid
 * @param {object} [options]
 * @param {string} [options.name]
 * @constructor
 */
var FilterSubgrid = DataSourceBase.extend('FilterSubgrid', {
    type: 'filter',

    format: 'filter', // override column format

    initialize: function(nextDataSource, options) {
        this.grid = options.grid;

        if (options && options.name) {
            this.name = options.name;
        }
    },

    getRow: function(y) {
        return this.grid.behavior.allColumns.map(function(column) {
            return column.filter || '';
        });
    },

    getRowCount: function() {
        return this.grid.properties.showFilterRow ? 1 : 0;
    },

    getValue: function(x, y) {
        return this.grid.behavior.getColumn(x).properties.filter || '';
    },

    setValue: function(x, y, value) {
        var column = this.grid.behavior.getColumn(x).properties.filter = value;
    }
});

module.exports = FilterSubgrid;