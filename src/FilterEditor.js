'use strict';

var Textfield = require('fin-hypergrid/src/cellEditors//Textfield');
var CellEditor = require('fin-hypergrid/src/cellEditors/CellEditor');

// This extension of Textfield implements `filterMode` grid property,
// which if "immediate" calls `reindex` after each keyup event or save.

module.exports = Textfield.extend('FilterEditor', {
    keyup: function(event) {
        if (
            !CellEditor.prototype.keyup.call(this, event) &&
            this.grid.properties.filteringMode === 'immediate'
        ) {
            try {
                this.saveEditorValue(this.getEditorValue());
            } catch (err) {
                // ignore syntax errors in immediate mode
            }
        }
    },

    saveEditorValue: function(value) {
        CellEditor.prototype.saveEditorValue.call(this, value);
        this.grid.behavior.reindex();
    }
});