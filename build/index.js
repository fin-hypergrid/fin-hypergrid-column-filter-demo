(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* eslint-env browser */

'use strict';

/** @module automat */

var ENCODERS = /%\{(\d+)\}/g; // double $$ to encode

var REPLACERS = /\$\{(.*?)\}/g; // single $ to replace


/**
 * @summary String formatter.
 *
 * @desc String substitution is performed on numbered _replacer_ patterns like `${n}` or _encoder_ patterns like `%{n}` where n is the zero-based `arguments` index. So `${0}` would be replaced with the first argument following `text`.
 *
 * Encoders are just like replacers except the argument is HTML-encoded before being used.
 *
 * To change the format patterns, assign new `RegExp` patterns to `automat.encoders` and `automat.replacers`.
 *
 * @param {string|function} template - A template to be formatted as described above. Overloads:
 * * A string primitive containing the template.
 * * A function to be called with `this` as the calling context. The template is the value returned from this call.
 *
 * @param {...*} [replacements] - Replacement values for numbered format patterns.
 *
 * @return {string} The formatted text.
 *
 * @memberOf module:automat
 */
function automat(template, replacements/*...*/) {
    var hasReplacements = arguments.length > 1;

    // if `template` is a function, convert it to text
    if (typeof template === 'function') {
        template = template.call(this); // non-template function: call it with context and use return value
    }

    if (hasReplacements) {
        var args = arguments;
        template = template.replace(automat.replacersRegex, function(match, key) {
            key -= -1; // convert to number and increment
            return args.length > key ? args[key] : '';
        });

        template = template.replace(automat.encodersRegex, function(match, key) {
            key -= -1; // convert to number and increment
            if (args.length > key) {
                var htmlEncoderNode = document.createElement('DIV');
                htmlEncoderNode.textContent = args[key];
                return htmlEncoderNode.innerHTML;
            } else {
                return '';
            }
        });
    }

    return template;
}

/**
 * @summary Replace contents of `el` with `Nodes` generated from formatted template.
 *
 * @param {string|function} template - See `template` parameter of {@link automat}.
 *
 * @param {HTMLElement} [el] - Node in which to return markup generated from template. If omitted, a new `<div>...</div>` element will be created and returned.
 *
 * @param {...*} [replacements] - Replacement values for numbered format patterns.
 *
 * @return {HTMLElement} The `el` provided or a new `<div>...</div>` element, its `innerHTML` set to the formatted text.
 *
 * @memberOf module:automat
 */
function replace(template, el, replacements/*...*/) {
    var elOmitted = typeof el !== 'object',
        args = Array.prototype.slice.call(arguments, 1);

    if (elOmitted) {
        el = document.createElement('DIV');
        args.unshift(template);
    } else {
        args[0] = template;
    }

    el.innerHTML = automat.apply(null, args);

    return el;
}

/**
 * @summary Append or insert `Node`s generated from formatted template into given `el`.
 *
 * @param {string|function} template - See `template` parameter of {@link automat}.
 *
 * @param {HTMLElement} el
 *
 * @param {Node} [referenceNode=null] Inserts before this element within `el` or at end of `el` if `null`.
 *
 * @param {...*} [replacements] - Replacement values for numbered format patterns.
 *
 * @returns {Node[]} Array of the generated nodes (this is an actual Array instance; not an Array-like object).
 *
 * @memberOf module:automat
 */
function append(template, el, referenceNode, replacements/*...*/) {
    var replacementsStartAt = 3,
        referenceNodeOmitted = typeof referenceNode !== 'object';  // replacements are never objects

    if (referenceNodeOmitted) {
        referenceNode = null;
        replacementsStartAt = 2;
    }

    replacements = Array.prototype.slice.call(arguments, replacementsStartAt);
    var result = [],
        div = replace.apply(null, [template].concat(replacements));

    while (div.childNodes.length) {
        result.push(div.firstChild);
        el.insertBefore(div.firstChild, referenceNode); // removes child from div
    }

    return result;
}

/**
 * Use this convenience wrapper to return the first child node described in `template`.
 *
 * @param {string|function} template - If a function, extract template from comment within.
 *
 * @returns {HTMLElement} The first `Node` in your template.
 *
 * @memberOf module:automat
 */
function firstChild(template, replacements/*...*/) {
    return replace.apply(null, arguments).firstChild;
}

/**
 * Use this convenience wrapper to return the first child element described in `template`.
 *
 * @param {string|function} template - If a function, extract template from comment within.
 *
 * @returns {HTMLElement} The first `HTMLElement` in your template.
 *
 * @memberOf module:automat
 */
function firstElement(template, replacements/*...*/) {
    return replace.apply(null, arguments).firstElementChild;
}

/**
 * @summary Finds string substitution lexemes that require HTML encoding.
 * @desc Modify to suit.
 * @default %{n}
 * @type {RegExp}
 * @memberOf module:automat
 */
automat.encodersRegex = ENCODERS;

/**
 * @summary Finds string substitution lexemes.
 * @desc Modify to suit.
 * @default ${n}
 * @type {RegExp}
 * @memberOf module:automat
 */
automat.replacersRegex = REPLACERS;

automat.format = automat; // if you find using just `automat()` confusing
automat.replace = replace;
automat.append = append;
automat.firstChild = firstChild;
automat.firstElement = firstElement;

module.exports = automat;

},{}],2:[function(require,module,exports){
'use strict';

/* eslint-env browser */

/** @namespace cssInjector */

/**
 * @summary Insert base stylesheet into DOM
 *
 * @desc Creates a new `<style>...</style>` element from the named text string(s) and inserts it but only if it does not already exist in the specified container as per `referenceElement`.
 *
 * > Caveat: If stylesheet is for use in a shadow DOM, you must specify a local `referenceElement`.
 *
 * @returns A reference to the newly created `<style>...</style>` element.
 *
 * @param {string|string[]} cssRules
 * @param {string} [ID]
 * @param {undefined|null|Element|string} [referenceElement] - Container for insertion. Overloads:
 * * `undefined` type (or omitted): injects stylesheet at top of `<head>...</head>` element
 * * `null` value: injects stylesheet at bottom of `<head>...</head>` element
 * * `Element` type: injects stylesheet immediately before given element, wherever it is found.
 * * `string` type: injects stylesheet immediately before given first element found that matches the given css selector.
 *
 * @memberOf cssInjector
 */
function cssInjector(cssRules, ID, referenceElement) {
    if (typeof referenceElement === 'string') {
        referenceElement = document.querySelector(referenceElement);
        if (!referenceElement) {
            throw 'Cannot find reference element for CSS injection.';
        }
    } else if (referenceElement && !(referenceElement instanceof Element)) {
        throw 'Given value not a reference element.';
    }

    var container = referenceElement && referenceElement.parentNode || document.head || document.getElementsByTagName('head')[0];

    if (ID) {
        ID = cssInjector.idPrefix + ID;

        if (container.querySelector('#' + ID)) {
            return; // stylesheet already in DOM
        }
    }

    var style = document.createElement('style');
    style.type = 'text/css';
    if (ID) {
        style.id = ID;
    }
    if (cssRules instanceof Array) {
        cssRules = cssRules.join('\n');
    }
    cssRules = '\n' + cssRules + '\n';
    if (style.styleSheet) {
        style.styleSheet.cssText = cssRules;
    } else {
        style.appendChild(document.createTextNode(cssRules));
    }

    if (referenceElement === undefined) {
        referenceElement = container.firstChild;
    }

    container.insertBefore(style, referenceElement);

    return style;
}

/**
 * @summary Optional prefix for `<style>` tag IDs.
 * @desc Defaults to `'injected-stylesheet-'`.
 * @type {string}
 * @memberOf cssInjector
 */
cssInjector.idPrefix = 'injected-stylesheet-';

// Interface
module.exports = cssInjector;

},{}],3:[function(require,module,exports){
'use strict';

function DatasaurBase() {}

DatasaurBase.extend = require('extend-me'); // make `extend`-able

/**
 * @classdesc Concatenated data model base class.
 * @param {Datasaur} [datasaur] - Omit for origin (actual data source). Otherwise, point to source you are transforming.
 * @param {object} [options] - Not used here at this time. Define properties as needed for custom datasaurs.
 */
DatasaurBase.prototype = {
    constructor: DatasaurBase.prototype.constructor,

    $$CLASS_NAME: 'DatasaurBase',

    isNullObject: true,

    drillDownCharMap: {
        true: '\u25bc', // BLACK DOWN-POINTING TRIANGLE aka '▼'
        false: '\u25b6', // BLACK RIGHT-POINTING TRIANGLE aka '▶'
        undefined: '', // leaf rows have no control glyph
        null: '   ' // indent
    },

    DataModelError: DataModelError,

    initialize: function(datasaur, options) {
        if (datasaur) {
            this.datasaur = datasaur;
            this.handlers = datasaur.handlers;
        } else {
            this.handlers = [];
        }

        this.install(Object.getPrototypeOf(this));
    },

    /**
     * @implements dataModelAPI#install
     * @see {@link https://fin-hypergrid.github.io/core/doc/dataModelAPI.html#install|install}
     */
    install: function(api, options) {
        var dataModel = this,
            keys = getFilteredKeys(api);

        options = options || {};

        keys.forEach(function(key) {
            if (options.inject && !Array.isArray(api)) {
                var source = needs(dataModel, key, options.force);
                if (source) {
                    source[key] = api[key];
                }
            }

            if (!DatasaurBase.prototype[key]) {
                DatasaurBase.prototype[key] = function() {
                    if (this.datasaur) {
                        return this.datasaur[key].apply(this.datasaur, arguments);
                    }
                };
            }
        });
    },

    dispatchEvent: function(nameOrEvent) {
        this.handlers.forEach(function(handler) {
            handler.call(this, nameOrEvent);
        }, this);
    },

    addListener: function(handler) {
        if (this.handlers.indexOf(handler) < 0) {
            this.handlers.push(handler);
        }
    },

    removeListener: function(handler) {
        var index = this.handlers.indexOf(handler);
        if (index) {
            delete this.handlers[index];
        }
    },


    // SYNONYMS

    isTree: function(x) {
        return this.isDrillDown(x);
    },

    getDataIndex: function(y) {
        return this.getRowIndex(y);
    },


    // DEBUGGING AIDS

    dump: function(max) {
        max = Math.min(this.getRowCount(), max || Math.max(100, this.getRowCount()));
        var data = [];
        var schema = this.getSchema();
        var fields = schema ? schema.map(function(cs) { return cs.name; }) : this.getHeaders();
        var cCount = this.getColumnCount();
        var viewMakesSense = this.viewMakesSense;
        for (var r = 0; r < max; r++) {
            var row = {};
            for (var c = 0; c < cCount; c++) {
                var val = this.getValue(c, r);
                if (c === 0 && viewMakesSense) {
                    val = this.fixIndentForTableDisplay(val);
                }
                row[fields[c]] = val;
            }
            data[r] = row;
        }
        console.table(data);
    }
};

/**
 * Searches linked list of objects for implementation of `key` anywhere on their prototype chain.
 * The search excludes members of `DatasaurBase.prototype`.
 * @param {object} transformer - Data model transformer list, linked backwards one to the previous one by `datasaur` property.
 * The first transformer, the actual data source, has null `datasaur`, meaning start-of-list.
 * @param {string} key - Property to search for.
 * @param {boolean} force - Always needed, so always return last object in list. All other implementations will be deleted (all implementations found along prototype chains of all transformers).
 * @returns {undefined|object} - `undefined` means an implementation was found; otherwise returns utlimate datasaur (last datasaur in linked list).
 */
function needs(transformer, key, force) {
    var source;

    do {
        if (transformer[key]) {
            if (force) {
                for (var link = transformer; link && link !== Object.prototype; link = Object.getPrototypeOf(link)) {
                    delete link[key];
                }
            } else if (transformer[key] !== DatasaurBase.prototype[key]) {
                return; // means implementation exists (ignoring previously installed forwarding catchers in base)
            }
        }
        source = transformer;
        transformer = transformer.datasaur;
    } while (transformer);

    return source;
}

var blacklistAlways = ['constructor', 'initialize', '!keys', '!!keys'];

/**
 * The following keys (array elements or object keys) are filtered out:
 * * Defined as something other than a function, including an accessor (getter and/or setter)
 * * Keys missing from whitelist (not listed in string array `api['!!keys']`, when defined)
 * * Keys blacklisted (listed in string array `api['!keys']` or `blacklistAlways`)
 * @param {string[]|object} api
 * @returns {string[]}
 */
function getFilteredKeys(api) {
    var whitelist = api.hasOwnProperty('!!keys') && api['!!keys'],
        blacklist = blacklistAlways.concat(api.hasOwnProperty('!keys') && api['!keys'] || []),
        keys;

    if (Array.isArray(api)) {
        keys = api;
    } else {
        keys = Object.keys(api).filter(function(key) {
            return typeof Object.getOwnPropertyDescriptor(api, key).value === 'function';
        });
    }

    return keys.filter(function(key) {
        return !(
            whitelist && whitelist.indexOf(key) < 0 ||
            blacklist.indexOf(key) >= 0
        );
    });
}


// DataModelError

function DataModelError(message) {
    this.message = message;
}

// extend from `Error'
DataModelError.prototype = Object.create(Error.prototype);

// override error name displayed in console
DataModelError.prototype.name = 'DataModelError';


module.exports = DatasaurBase;

},{"extend-me":7}],4:[function(require,module,exports){
/* eslint-env commonjs */

'use strict';

var DatasaurIndexed = require('datasaur-indexed');
var compile = require('predicated').compile;

/**
 * @interface filterInterface
 */

/**
 * @name filterInterface#test
 * @method
 * @param {object} dataRow - Object representing a row in the grid containing all the column names included in {@link Datasaur#getSchema|getSchema()}.
 * @returns {boolean}
 * * `true` - include in grid (row passes through filter)
 * * `false` - exclude from grid (row is blocked by filter)
 */

/**
 * @constructor
 * @extends DatasaurIndexed
 */
var DatasaurFilter = DatasaurIndexed.extend('DatasaurFilter', {

    /**
     * @param {object|function|string} [filter] - Falsy means remove filter.
     * @param {object} [options]
     * @param {string} [options.syntax='javascript'] - Also accepts 'traditional' (VB/SQL-like)
     * @param {string[]} [vars] - Check expression and throw error if it has variables not in schema or `vars`. If omitted or falsy, no checking is performed.
     * @memberOf DatasaurFilter#
     */
    setFilter: function(filter, options) {
        if (!filter) {
            filter = undefined;
        }

        switch (typeof filter) {
            case 'object':
                this._filter = filter;
                break;

            case 'function':
                this._filter = { test: filter };
                break;

            case 'string':
                options = options && {
                    syntax: options.syntax,
                    keys: options.vars && this.getSchema().map(name).concat(options.vars)
                };
                this._filter = { test: compile(filter, options) };
                break;

            default:
                this._filter = undefined;
        }

        this.apply();
    },

    /**
     * @memberOf DatasaurFilter#
     */
    apply: function() {
        var predicate,
            filter = this._filter;

        if (filter) {
            predicate = function(y) {
                return filter.test(this.getRow(y));
            }
        }

        this.buildIndex(predicate);
    }

});

function name(fld) {
    return fld.name;
}

module.exports = DatasaurFilter;

},{"datasaur-indexed":5,"predicated":98}],5:[function(require,module,exports){
/* eslint-env commonjs */

'use strict';

var DatasaurBase = require('datasaur-base');

/**
 * @constructor
 */
var DatasaurIndexed = DatasaurBase.extend('DatasaurIndexed', {

    isNullObject: false,

    /**
     * @memberOf DatasaurIndexed#
     * @param y
     * @returns {*}
     */
    transposeY: function(y) {
        return this.index ? this.index[y] : y;
    },

    getRowIndex: function(y) {
        return this.datasaur.getRowIndex(this.transposeY(y));
    },

    /**
     * @memberOf DatasaurIndexed#
     * @param y
     * @returns {object}
     */
    getRow: function(y) {
        return this.datasaur.getRow(this.transposeY(y));
    },

    getRowMetadata: function(y, prototype) {
        return this.datasaur.getRowMetadata(this.transposeY(y), prototype);
    },

    setRowMetadata: function(y, metadata) {
        return this.datasaur.setRowMetadata(this.transposeY(y), metadata);
    },

    /**
     * @memberOf DatasaurIndexed#
     * @param x
     * @param y
     * @returns {*|Mixed}
     */
    getValue: function(x, y) {
        return this.datasaur.getValue(x, this.transposeY(y));
    },

    /**
     * @memberOf DatasaurIndexed#
     * @param {number} x
     * @param {number} y
     * @param {*} value
     */
    setValue: function(x, y, value) {
        this.datasaur.setValue(x, this.transposeY(y), value);
    },

    /**
     * @memberOf DatasaurIndexed#
     * @returns {Number|*}
     */
    getRowCount: function() {
        return this.index ? this.index.length : this.datasaur.getRowCount();
    },

    /**
     * @memberOf DatasaurIndexed#
     */
    clearIndex: function() {
        this.buildIndex();
    },

    /**
     * @memberOf DatasaurIndexed#
     * @param {filterPredicate} predicate
     * @returns {number[]}
     */
    buildIndex: function(predicate) {
        var index = this.index || [];

        this.dispatchEvent('fin-hypergrid-data-prereindex');

        this.index = undefined;

        if (predicate) {
            index.length = 0; // attempt to reuse this.index memory allocation

            var datasaur = this.datasaur;

            for (var y = 0, Y = datasaur.getRowCount(); y < Y; y++) {
                if (predicate.call(datasaur, y)) {
                    index.push(y);
                }
            }

            if (index.length < Y) {
                this.index = index;
            }
        }

        this.dispatchEvent('fin-hypergrid-data-postreindex');
    }
});

/** @typedef {function} filterPredicate
 * @summary Applies filter to given row.
 * @this {Datasaur}
 * @param {number} y - Index of row in data source (`this.datasaur`).
 * @returns {boolean} Row qualifies (passes through filter).
 */

/**
 * Used by the sorters, such as `DatasaurSorter`
 * @param {object} dataRow
 * @param {string} columnName
 * @returns {*}
 */
DatasaurIndexed.valOrFunc = function(dataRow, columnName, calculator) {
    var result;
    if (dataRow) {
        result = dataRow[columnName];
        calculator = (typeof result)[0] === 'f' && result || calculator;
        if (calculator) {
            result = calculator(dataRow, columnName);
        }
    }
    return result;
};

module.exports = DatasaurIndexed;

},{"datasaur-base":3}],6:[function(require,module,exports){
/* eslint-env browser */

'use strict';

var DatasaurBase = require('datasaur-base');

/** @typedef {object} columnSchemaObject
 * @property {string} name - The required column name.
 * @property {string} [header] - An override for derived header
 * @property {function} [calculator] - A function for a computed column. Undefined for normal data columns.
 * @property {string} [type] - Used for sorting when and only when comparator not given.
 * @property {object} [comparator] - For sorting, both of following required:
 * @property {function} comparator.asc - ascending comparator
 * @property {function} comparator.desc - descending comparator
 */


/**
 * @param {object} [options]
 * @param {object[]} [options.data]
 * @param {object[]} [options.schema]
 * @constructor
 */
var DatasaurLocal = DatasaurBase.extend('DatasaurLocal',  {

    initialize: function(datasaur, options) {
        /**
         * @summary The array of column schema objects.
         * @name schema
         * @type {columnSchemaObject[]}
         * @memberOf DatasaurLocal#
         */
        this.schema = [];

        /**
         * @summary The array of uniform data objects.
         * @name data
         * @type {object[]}
         * @memberOf DatasaurLocal#
         */
        this.data = [];
    },

    /**
     * Establish new data and schema.
     * If no data provided, data will be set to 0 rows.
     * If no schema provided AND no previously set schema, new schema will be derived from data.
     * @param {object[]} [data=[]] - Array of uniform objects containing the grid data.
     * @param {columnSchemaObject[]} [schema=[]]
     * @memberOf DatasaurLocal#
     */
    setData: function(data, schema) {
        /**
         * @summary The array of uniform data objects.
         * @name data
         * @type {object[]}
         * @memberOf DatasaurLocal#
         */
        this.data = data || [];

        if (schema) {
            this.setSchema(schema);
        } else if (this.data.length && !this.schema.length) {
            this.setSchema([]);
        }
    },

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getSchema}
     * @memberOf DatasaurLocal#
     */
    getSchema:  function(){
        return this.schema;
    },
    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#setSchema}
     * @memberOf DatasaurLocal#
     */
    setSchema: function(newSchema){
        if (!newSchema.length) {
            var dataRow = this.data.find(function(dataRow) { return dataRow; });
            if (dataRow) {
                newSchema = Object.keys(dataRow);
            }
        }

        this.schema = newSchema;
        this.dispatchEvent('fin-hypergrid-schema-changed');
    },

    /**
     * @param y
     * @returns {dataRowObject}
     * @memberOf DatasaurLocal#
     */
    getRow: function(y) {
        return this.data[y];
    },

    /**
     * Update or blank row in place.
     *
     * _Note parameter order is the reverse of `addRow`._
     * @param {number} y
     * @param {object} [dataRow] - if omitted or otherwise falsy, row renders as blank
     * @memberOf DatasaurLocal#
     */
    setRow: function(y, dataRow) {
        this.data[y] = dataRow || undefined;
    },

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getRowMetadata}
     * @memberOf DatasaurLocal#
     */
    getRowMetadata: function(y, prototype) {
        var dataRow = this.data[y];
        return dataRow && (dataRow.__META || (prototype !== undefined && (dataRow.__META = Object.create(prototype))));
    },

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#setRowMetadata}
     * @memberOf DatasaurLocal#
     */
    setRowMetadata: function(y, metadata) {
        var dataRow = this.data[y];
        if (dataRow) {
            if (metadata) {
                dataRow.__META = metadata;
            } else {
                delete dataRow.__META;
            }
        }
        return !!dataRow;
    },

    /**
     * Insert or append a new row.
     *
     * _Note parameter order is the reverse of `setRow`._
     * @param {object} dataRow
     * @param {number} [y=Infinity] - The index of the new row. If `y` >= row count, row is appended to end; otherwise row is inserted at `y` and row indexes of all remaining rows are incremented.
     * @memberOf DatasaurLocal#
     */
    addRow: function(dataRow, y) {
        if (y === undefined || y >= this.getRowCount()) {
            this.data.push(dataRow);
        } else {
            this.data.splice(y, 0, dataRow);
        }
        this.dispatchEvent('fin-hypergrid-data-shape-changed');
    },

    /**
     * Rows are removed entirely and no longer render.
     * Indexes of all remaining rows are decreased by `rowCount`.
     * @param {number} y
     * @param {number} [rowCount=1]
     * @returns {dataRowObject[]}
     * @memberOf DatasaurLocal#
     */
    delRow: function(y, rowCount) {
        var rows = this.data.splice(y, rowCount === undefined ? 1 : rowCount);
        if (rows.length) {
            this.dispatchEvent('fin-hypergrid-data-shape-changed');
        }
        return rows;
    },

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getValue}
     * @memberOf DatasaurLocal#
     */
    getValue: function(x, y) {
        var row = this.data[y];
        if (!row) {
            return null;
        }
        return row[getColumnName.call(this, x)];
    },
    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#setValue}
     * @memberOf DatasaurLocal#
     */
    setValue: function(x, y, value) {
        this.data[y][getColumnName.call(this, x)] = value;
    },

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getRowCount}
     * @memberOf DatasaurLocal#
     */
    getRowCount: function() {
        return this.data.length;
    },

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getColumnCount}
     * @memberOf DatasaurLocal#
     */
    getColumnCount: function() {
        return this.schema.length;
    }
});

function getColumnName(x) {
    return (typeof x)[0] === 'n' ? this.schema[x].name : x;
}

module.exports = DatasaurLocal;

},{"datasaur-base":3}],7:[function(require,module,exports){
'use strict';

/** @namespace extend-me **/

/** @summary Extends an existing constructor into a new constructor.
 *
 * @returns {Constructor} A new constructor, extended from the given context, possibly with some prototype additions.
 *
 * @desc Extends "objects" (constructors), with optional additional code, optional prototype additions, and optional prototype member aliases.
 *
 * > CAVEAT: Not to be confused with Underscore-style .extend() which is something else entirely. I've used the name "extend" here because other packages (like Backbone.js) use it this way. You are free to call it whatever you want when you "require" it, such as `var inherits = require('extend')`.
 *
 * Provide a constructor as the context and any prototype additions you require in the first argument.
 *
 * For example, if you wish to be able to extend `BaseConstructor` to a new constructor with prototype overrides and/or additions, basic usage is:
 *
 * ```javascript
 * var Base = require('extend-me').Base;
 * var BaseConstructor = Base.extend(basePrototype); // mixes in .extend
 * var ChildConstructor = BaseConstructor.extend(childPrototypeOverridesAndAdditions);
 * var GrandchildConstructor = ChildConstructor.extend(grandchildPrototypeOverridesAndAdditions);
 * ```
 *
 * This function (`extend()`) is added to the new extended object constructor as a property `.extend`, essentially making the object constructor itself easily "extendable." (Note: This is a property of each constructor and not a method of its prototype!)
 *
 * @this Base class being extended from (i.e., its constructor function object).
 *
 * @param {string} [extendedClassName] - This is simply added to the prototype as $$CLASS_NAME. Useful for debugging because all derived constructors appear to have the same name ("Constructor") in the debugger.
 *
 * @param {extendedPrototypeAdditionsObject} [prototypeAdditions] - Object with members to copy to new constructor's prototype.
 *
 * @property {boolean} [debug] - See parameter `extendedClassName` _(above)_.
 *
 * @property {object} Base - A convenient base class from which all other classes can be extended.
 *
 * @memberOf extend-me
 */
function extend(extendedClassName, prototypeAdditions) {
    switch (arguments.length) {
        case 0:
            prototypeAdditions = {};
            break;
        case 1:
            switch (typeof extendedClassName) {
                case 'object':
                    prototypeAdditions = extendedClassName;
                    extendedClassName = undefined;
                    break;
                case 'string':
                    prototypeAdditions = {};
                    break;
                default:
                    throw 'Single-parameter overload must be either string or object.';
            }
            break;
        case 2:
            if (typeof extendedClassName !== 'string' || typeof prototypeAdditions !== 'object') {
                throw 'Two-parameter overload must be string, object.';
            }
            break;
        default:
            throw 'Too many parameters';
    }

    /**
     * @class
     */
    function Constructor() {
        if (this.preInitialize) {
            this.preInitialize.apply(this, arguments);
        }

        initializePrototypeChain.apply(this, arguments);

        if (this.postInitialize) {
            this.postInitialize.apply(this, arguments);
        }
    }

    /**
     * @method
     * @see {@link extend-me.extend}
     * @desc Added to each returned extended class constructor.
     */
    Constructor.extend = extend;

    Constructor.getClassName = getClassName;

    /**
     * @method
     * @param {string} [ancestorConstructorName] - If given, searches up the prototype chain for constructor with matching name.
     * @returns {function|null} Constructor of parent class; or ancestor class with matching name; or null
     */
    Constructor.parent = parentConstructor;

    var prototype = Constructor.prototype = Object.create(this.prototype);
    prototype.constructor = Constructor;

    extendedClassName = extendedClassName || prototype.$$CLASS_NAME || prototype.name;
    if (extendedClassName) {
        Object.defineProperty(Constructor, 'name', { value: extendedClassName, configurable: true });
        prototype.$$CLASS_NAME = extendedClassName;
    }

    // define each prototype addition on the prototype (including getter/setters)
    var key, descriptor;
    for (key in prototypeAdditions) {
        if ((descriptor = Object.getOwnPropertyDescriptor(prototypeAdditions, key))) {
            Object.defineProperty(prototype, key, descriptor);
        }
    }

    if (typeof this.postExtend === 'function') {
        this.postExtend(prototype);
    }

    return Constructor;
}

function Base() {}
Base.prototype = {

    constructor: Base.prototype.constructor,

    getClassName: function() {
        return (
            this.$$CLASS_NAME ||
            this.name ||
            this.constructor.name // try Function.prototype.name as last resort
        );
    },

    /**
     * Access a member of the super class.
     * @returns {Object}
     */
    get super() {
        return Object.getPrototypeOf(Object.getPrototypeOf(this));
    },

    /**
     * Find member on prototype chain beginning with super class.
     * @param {string} memberName
     * @returns {undefined|*} `undefined` if not found; value otherwise.
     */
    superMember: function(memberName) {
        var parent = this.super;
        do { parent = Object.getPrototypeOf(parent); } while (!parent.hasOwnProperty(memberName));
        return parent && parent[memberName];
    },

    /**
     * Find method on prototype chain beginning with super class.
     * @param {string} methodName
     * @returns {function}
     */
    superMethod: function(methodName) {
        var method = this.superMember(methodName);
        if (typeof method !== 'function') {
            throw new TypeError('this.' + methodName + ' is not a function');
        }
        return method;
    },

    /**
     * Find method on prototype chain beginning with super class and call it with remaining args.
     * @param {string} methodName
     * @returns {*}
     */
    callSuperMethod: function(methodName) {
        return this.superMethod(methodName).apply(this, Array.prototype.slice.call(arguments, 1));
    }
};
Base.extend = extend;
extend.Base = Base;

/**
 * Optional static method is called with new "class" (constructor) after extending.
 * This permits miscellaneous tweaking and cleanup of the new class.
 * @method postExtend
 * @param {object} prototype
 * @memberOf Base
 */

/** @typedef {function} extendedConstructor
 * @property prototype.super - A reference to the prototype this constructor was extended from.
 * @property [extend] - If `prototypeAdditions.extendable` was truthy, this will be a reference to {@link extend.extend|extend}.
 */

/** @typedef {object} extendedPrototypeAdditionsObject
 * @desc All members are copied to the new object. The following have special meaning.
 * @property {function} [initialize] - Additional constructor code for new object. This method is added to the new constructor's prototype. Gets passed new object as context + same args as constructor itself. Called on instantiation after similar function in all ancestors called with same signature.
 * @property {function} [preInitialize] - Called before the `initialize` cascade. Gets passed new object as context + same args as constructor itself. If not defined here, the top-most (and only the top-most) definition found on the prototype chain is called.
 * @property {function} [postInitialize] - Called after the `initialize` cascade. Gets passed new object as context + same args as constructor itself. If not defined here, the top-most (and only the top-most) definition found on the prototype chain is called.
 */

/** @summary Call all `initialize` methods found in prototype chain, beginning with the most senior ancestor's first.
 * @desc This recursive routine is called by the constructor.
 * 1. Walks back the prototype chain to `Object`'s prototype
 * 2. Walks forward to new object, calling any `initialize` methods it finds along the way with the same context and arguments with which the constructor was called.
 * @private
 * @memberOf extend-me
 */
function initializePrototypeChain() {
    var term = this,
        args = arguments;
    recur(term);

    function recur(obj) {
        var proto = Object.getPrototypeOf(obj);
        if (proto.constructor !== Object) {
            recur(proto);
            if (proto.hasOwnProperty('initialize')) {
                proto.initialize.apply(term, args);
            }
        }
    }
}

function getClassName() {
    return (
        this.prototype.$$CLASS_NAME ||
        this.prototype.name ||
        this.name // try Function.prototype.name as last resort
    );
}

function parentConstructor(ancestorConstructorName) {
    var prototype = this.prototype;
    if (prototype) {
        do {
            prototype = Object.getPrototypeOf(prototype);
        } while (ancestorConstructorName && prototype && prototype.constructor.name !== ancestorConstructorName);
    }
    return prototype && prototype.constructor;
}

module.exports = extend;

},{}],8:[function(require,module,exports){
'use strict';

exports.grid = [
'.hypergrid-container {',
'	position: relative;',
'	height: 500px;',
'}',
'.hypergrid-container > div:first-child {',
'	position: absolute;',
'	left: 0;',
'	top: 0;',
'	right: 0;',
'	bottom: 0;',
'}',
'.hypergrid-container > div:first-child > div.info {',
'	position: absolute;',
'	display: none; /* initially hidden */',
'	margin-top: 150px; /* to place below headers */',
'	color: #eee;',
'	text-shadow: 1px 1px #ccc;',
'	font-size: 36pt;',
'	font-weight: bold;',
'	text-align: center;',
'	top: 0; right: 0; bottom: 0; left: 0;',
'}',
'.hypergrid-textfield {',
'	position: absolute;',
'	font-size: 12px;',
'	color: black;',
'	background-color: ivory;',
'	box-sizing: border-box;',
'	margin: 0;',
'	padding: 0 5px;',
'	border: 0; /*border: 1px solid #777;*/',
'	outline: 0;',
'}',
'',
''
].join('\n');

},{}],9:[function(require,module,exports){
module.exports = {
	"calendar": {
		type: "image/png",
		data: "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAc0lEQVR4nIXQwQkCMRSE4U9ZLMCT9Xjaq2AfNhfYU5oQLMAOtoN48EWei5iBIRPe/yYQ3qrhf1lFG7iKcEaJxSfukUvMWgdHavt0uWHtg2QwxXnAnJZ2uOLyVZtybzzhgWNmfoFl0/YB87NbzR1cjP9xeQHSDC6mcL1xFQAAAABJRU5ErkJggg=="
	},
	"checked": {
		type: "image/png",
		data: "iVBORw0KGgoAAAANSUhEUgAAAA0AAAAPCAYAAAA/I0V3AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAYJJREFUOE+NkstLglEQxf0fahG0iFrUxm2ElFDYLohCqCDaCAkWPaxIRbFFEJEaGEKLDCoMETRFUAMLyaIHBUG6sSKIMtKFqEhLT818ZUgmDhzu3DPn9z0uV1RrmUwmyGQyqNVqfFvViwBxu5RFPZuLSyGMKhz/qlEsRV19K8xm6y+w7bpBPFnAferjj3bdQX6DpHcAUwavAHUN2RGIZxBJZHH2mC/TUeydwwTZvBegLENNgw7sX6Wh1FswNmPEmjPCDyGRRwCtW9E3tMgdAtQw7GZjYcNX+gza2wJ3ZXsSZUuQ0vWCOV8SHfJJ/uluhbHUj1v8PKNMszIoQNRMHCShD6Wh8zyhrbOPwz8w+STKlCCJ7oRNUzQH63kBs5thBghePXxlj2aUoSxDPcuXPNiLAc5EEZ6HIkbmV2DYiXBPHs0o079+K0DTVj/s11mE00A0L+g4VcDp10qKZMAzytBhMaTRaPmYg885DlcSzSij0eoEiIouoUqlqqqaL2rlEok+Ad4vlfzPoVDsAAAAAElFTkSuQmCC"
	},
	"down-rectangle": {
		type: "image/png",
		data: "iVBORw0KGgoAAAANSUhEUgAAAAkAAAAECAYAAABcDxXOAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjExR/NCNwAAABpJREFUGFdjgIL/eDAKIKgABggqgAE0BQwMAPTlD/Fpi0JfAAAAAElFTkSuQmCC"
	},
	"filter-off": {
		type: "image/png",
		data: "iVBORw0KGgoAAAANSUhEUgAAAA4AAAAMCAYAAABSgIzaAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAAChSURBVChTzZHBCoUgFET9TqEiskgyWoutQvRLRIr+cR7XQAjiJW/1BgZmMUevXsY5xy9OoDEGMcYiUzeB67qibVuwQjVNA6311V+WBeM4vsLDMEApde/1fY9pmtI453neHEKAlBJd1z0fXtc16PbjODK07zvmeUZVVd8nooc75zJIOX3Gm6i0bVsGKf8xKIRIuyJTLgJJ3nvQzsjW2geIsQ/pr9hMVrSncAAAAABJRU5ErkJggg=="
	},
	"filter-on": {
		type: "image/png",
		data: "iVBORw0KGgoAAAANSUhEUgAAAA4AAAAMCAYAAABSgIzaAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAACoSURBVChTY3BqfP2fHAzWmDbj7f8p294RhVOBasEa02e+/e/VBmQQCTxaX/9PnvYGoj5ywpv/Qd2ENft3vv4f1gfVBAP+nW/+h/a+ATtn1q73KHjytvdgg3070DTBgHvL6/8g22fsQGiaDmSHA21xaybgIpDHixa8hWssnA8NDEIApCh3LkIjiD2INYJCL2X6W3B8gdhEaQQBUOCA4gyE8+e9xaKJgQEA/74BNE3cElkAAAAASUVORK5CYII="
	},
	"unchecked": {
		type: "image/png",
		data: "iVBORw0KGgoAAAANSUhEUgAAAA0AAAAPCAYAAAA/I0V3AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAARBJREFUOE+9krtug1AQRPldSio7FQ1tZImOkoKOBomGT0EURC5ino54yTw90WywQhTkIkVWGoF2zuxdrlD+t0zThKZpT0Vmxb8CQRCg6zr0fb8rer7vfwcPxxdcrx+YpgnzPGNZlh9ibxxHlGUJshLSdV0at9tNpg7DIBrX5+OkPM9BVkKGYSBJEtR1jbZrBdiqbVtUVYU0TUFWQq+nE+I4xvvlImGaW7FHjwxZCVmWhbfzGVmWoSgKWXUr9uiRISshx3FkEldomubXauzRI0NWQp7nyUR+NG/rfr/jUXxnjx5vmKyEbNuWox9Xvid6ZMhK6HA4wnVdhGGIKIp2RY8MWQmx+JuoqvpUZFb8L6UonyYL3uOtrFH+AAAAAElFTkSuQmCC"
	},
	"up-down-spin": {
		type: "image/png",
		data: "iVBORw0KGgoAAAANSUhEUgAAAA4AAAAPCAYAAADUFP50AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAGJJREFUOE+lkwEKACEIBH2Zb/PnHsoGeaVJDUjGOgRRpKpkiIj+y4MME3eDR7kaKOVNsJyMNjIHzGy9YnW6J7qIcrriQimeCqORNABd0fpRTkt8uVUj7EsxC6vs/q3e/Q6iD2bwnByjPXHNAAAAAElFTkSuQmCC"
	},
	"up-down": {
		type: "image/png",
		data: "iVBORw0KGgoAAAANSUhEUgAAAA4AAAAPCAYAAADUFP50AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAGFJREFUOE+lkkEKQCEIRD2ZJ3Ph3iN4WD9GflpYhj0YYowpGgJmbikd3gjMDFokwbuT1iAiurG5nomgqo5QaPo9ERQRI6Jf7sfGjudy2je23+i0Wl2oQ85TOdlfrJQOazF8br+rqTXQKn0AAAAASUVORK5CYII="
	},
};

},{}],10:[function(require,module,exports){
/* eslint-env browser */

/**
 * This is a registry of `HTMLImageIcon` objects.
 *
 * Hypergrid comes with a few images (see below).
 *
 * Application developer is free to register additional image objects here (see {@link module:images.add|add}).
 * @module images
 */

'use strict';

var _ = require('object-iterators');

var images = require('./images'); // this is the file generated by gulpfile.js (and ignored by git)

/**
 * <img src="https://raw.githubusercontent.com/openfin/fin-hypergrid/master/images/calendar.png">
 * @name calendar
 * @memberOf module:images
 */

/**
 * <img src="https://raw.githubusercontent.com/openfin/fin-hypergrid/master/images/checked.png">
 * @name checked
 * @memberOf module:images
 */

/**
 * <img src="https://raw.githubusercontent.com/openfin/fin-hypergrid/master/images/unchecked.png">
 * @name unchecked
 * @memberOf module:images
 */

/**
 * <img src="https://raw.githubusercontent.com/openfin/fin-hypergrid/master/images/filter-off.png">
 * @name filter-off
 * @memberOf module:images
 */

/**
 * <img src="https://raw.githubusercontent.com/openfin/fin-hypergrid/master/images/filter-on.png">
 * @name filter-on
 * @memberOf module:images
 */

/**
 * <img src="https://raw.githubusercontent.com/openfin/fin-hypergrid/master/images/up-down.png">
 * @name up-down
 * @memberOf module:images
 */

_(images).each(function(image, key) {
    var element = new Image();
    element.src = 'data:' + image.type + ';base64,' + image.data;
    images[key] = element;
});

/**
 * Synonym of {@link module:images.checked|checked} (unaffected if `checked` overridden).
 * @name checkbox-on
 * @memberOf module:images
 */
images['checkbox-on'] = images.checked;

/**
 * Synonym of {@link module:images.unchecked|unchecked} (unaffected if `unchecked` overridden).
 * @name checkbox-off
 * @memberOf module:images
 */
images['checkbox-off'] = images.unchecked;

/**
 * @name add
 * @method
 * @param {string} key
 * @param {HTMLImageElement} img
 * @memberOf module:images
 */
images.add = function(key, img) {
    return images[key] = img;
};

/**
 * Convenience function.
 * @name checkbox
 * @method
 * @param {boolean} state
 * @returns {HTMLImageElement} {@link module:images.checked|checked} when `state` is truthy or {@link module:images.unchecked|unchecked} otherwise.
 * @memberOf module:images
 */
images.checkbox = function(state) {
    return images[state ? 'checked' : 'unchecked'];
};

/**
 * Convenience function.
 * @name filter
 * @method
 * @param {boolean} state
 * @returns {HTMLImageElement} {@link module:images.filter-off|filter-off} when `state` is truthy or {@link module:images.filter-on|filter-on} otherwise.
 * @memberOf module:images
 */
images.filter = function(state) {
    return images[state ? 'filter-on' : 'filter-off'];
};

module.exports = images;

},{"./images":9,"object-iterators":94}],11:[function(require,module,exports){
module.exports={
  "_from": "github:joneit/core#v3.0.0",
  "_id": "fin-hypergrid@3.0.0",
  "_inBundle": false,
  "_integrity": "",
  "_location": "/fin-hypergrid",
  "_phantomChildren": {},
  "_requested": {
    "type": "git",
    "raw": "fin-hypergrid@github:joneit/core#v3.0.0",
    "name": "fin-hypergrid",
    "escapedName": "fin-hypergrid",
    "rawSpec": "github:joneit/core#v3.0.0",
    "saveSpec": "github:joneit/core#v3.0.0",
    "fetchSpec": null,
    "gitCommittish": "v3.0.0"
  },
  "_requiredBy": [
    "/"
  ],
  "_resolved": "github:joneit/core#283b29aed70245488285079edf536273ccbe9724",
  "_spec": "fin-hypergrid@github:joneit/core#v3.0.0",
  "_where": "/Users/joneit/repos/fin-hypergrid-column-filter-demo",
  "author": {
    "name": "SWirts, JEiten, DJones, NMichaud"
  },
  "bugs": {
    "url": "https://github.com/fin-hypergrid/core/issues"
  },
  "bundleDependencies": false,
  "dependencies": {
    "datasaur-base": "github:fin-hypergrid/datasaur-base#3.0.0",
    "datasaur-local": "github:fin-hypergrid/datasaur-local#3.0.0",
    "extend-me": "^2.7.0",
    "finbars": "1.5.2",
    "inject-stylesheet-template": "^1.0.1",
    "mustache": "^2.3.0",
    "object-iterators": "1.3.0",
    "overrider": "^0",
    "rectangular": "1.0.1",
    "sparse-boolean-array": "1.0.1",
    "synonomous": "^2.1.1"
  },
  "deprecated": false,
  "description": "Canvas-based high-performance grid",
  "devDependencies": {
    "gulp": "^3.9.0",
    "gulp-concat": "^2.6.0",
    "gulp-each": "^0.1.1",
    "gulp-eslint": "^4.0.2",
    "gulp-footer": "^1.1.1",
    "gulp-header": "^1.8.2",
    "gulp-imagine-64": "^1.0.1",
    "gulp-load-plugins": "^1.1.0",
    "gulp-mocha": "^2.2.0",
    "run-sequence": "^1.1.4"
  },
  "gitHead": "",
  "homepage": "https://github.com/fin-hypergrid/core#readme",
  "keywords": [
    "spreadsheet",
    "grid"
  ],
  "license": "MIT",
  "main": "src/Hypergrid",
  "name": "fin-hypergrid",
  "repository": {
    "type": "git",
    "url": "git://github.com/fin-hypergrid/core.git"
  },
  "version": "3.0.0"
}

},{}],12:[function(require,module,exports){
/* globals alert */

'use strict';

/**
 * @constructor
 * @desc Extend from this base class using `Base.extend` per example.
 * @example
 * var prototype = { ... };
 * var descendantClass = Base.extend(prototype};
 * @classdesc This is an abstract base class available for all Hypergrid classes.
 */
var Base = require('extend-me').Base;

Object.defineProperty(Base.prototype, 'version', {
    enumerable: true,
    writable: false, // read-only
    configurable: false,
    value: require('../package.json').version
});

Base.prototype.deprecated = require('./lib/deprecated');
Base.prototype.HypergridError = require('./lib/error');

Base.prototype.notify = function(message, onerror) {
    switch (onerror) {
        case 'warn': console.warn(message); break;
        case 'alert': alert(message); break; // eslint-disable-line no-alert
        default: throw new this.HypergridError(message);
    }
};

/**
 * Convenience function for getting the value when that value can be defined as a function that needs to be called to get the actual (primitive) value.
 * @param value
 * @returns {*}
 */
Base.prototype.unwrap = function(value) {
    if ((typeof value)[0] === 'f') {
        value = value();
    }
    return value;
};

/**
 * @method
 * @summary Mixes source members into calling context.
 * @desc Context is typically either an instance or the (shared) prototype of a "class" extended from {@link Base} (see examples).
 *
 * Typically used by plug-ins.
 * @example
 * // define instance members: myGrid.fix(), etc.
 * myGrid.mixIn({ fix: function() {...}, ... });
 * @example
 * // define prototype members: Hypergrid.prototype.fix(), etc.
 * Hypergrid.prototype.mixIn({ fix: function() {...}, ... });
 * @See {@link https://joneit.github.io/overrider/module-overrider.htm#.mixIn}
 * @param {object} source
 */
Base.prototype.mixIn = require('overrider').mixIn;


/**
 * @method
 * @summary Instantiate an object with discrete + variable args.
 * @desc The discrete args are passed first, followed by the variable args.
 * @param {function} Constructor
 * @param {Array} variableArgArray
 * @param {...*} discreteArgs
 * @returns {object} Object of type `Constructor` newly constructor using the arguments in `arrayOfArgs`.
 */
Base.prototype.createApply = function(Constructor, variableArgArray, discreteArgs) {
    var discreteArgArray = Array.prototype.slice.call(arguments, 2),
        args = [null] // null is context for `bind` call below
            .concat(discreteArgArray) // discrete arguments
            .concat(variableArgArray), // variable arguments
        BoundConstructor = Constructor.bind.apply(Constructor, args);

    return new BoundConstructor;
};


module.exports = Base;

},{"../package.json":11,"./lib/deprecated":73,"./lib/error":76,"extend-me":7,"overrider":95}],13:[function(require,module,exports){
/* eslint-env browser */

'use strict';

var dispatchGridEvent = require('../lib/dispatchGridEvent');

/**
 * Hypergrid/index.js mixes this module into its prototype.
 * @mixin
 */
exports.mixin = {

    /**
     * @summary Add an event listener to me.
     * @desc Listeners added by this method should only be removed by {@link Hypergrid#removeEventListener|grid.removeEventListener} (or {@link Hypergrid#removeAllEventListeners|grid.removeAllEventListeners}).
     * @param {string} eventName - The type of event we are interested in.
     * @param {function} listener - The event handler.
     * @param {boolean} [internal=false] - Used by {@link Hypergrid#addInternalEventListener|grid.addInternalEventListener} (see).
     * @memberOf Hypergrid#
     */
    addEventListener: function(eventName, listener, internal) {
        var self = this,
            listeners = this.listeners[eventName] = this.listeners[eventName] || [],
            alreadyAttached = listeners.find(function(info) { return info.listener === listener; });

        if (!alreadyAttached) {
            var info = {
                internal: internal,
                listener: listener,
                decorator: function(e) {
                    if (self.allowEventHandlers) {
                        listener(e);
                    }
                }
            };
            listeners.push(info);
            this.canvas.addEventListener(eventName, info.decorator);
        }
    },

    /**
     * @summary Add an internal event listener to me.
     * @desc The new listener is flagged as "internal." Internal listeners are removed as usual by {@link Hypergrid#removeEventListener|grid.removeEventListener}. However, they are ignored by {@link Hypergrid#removeAllEventListeners|grid.removeAllEventListeners()} (as called by {@link Hypergrid#reset|reset}). (But see {@link Hypergrid#removeAllEventListeners|grid.removeAllEventListeners(true)}.)
     *
     * Listeners added by this method should only be removed by {@link Hypergrid#removeEventListener|grid.removeEventListener} (or {@link Hypergrid#removeAllEventListeners|grid.removeAllEventListeners(true)}).
     * @param {string} eventName - The type of event we are interested in.
     * @param {function} listener - The event handler.
     * @memberOf Hypergrid#
     */
    addInternalEventListener: function(eventName, listener) {
        this.addEventListener(eventName, listener, true);
    },

    /**
     * @summary Remove an event listeners.
     * @desc Removes the event listener with matching name and function that was added by {@link Hypergrid#addEventListener|grid.addEventListener}.
     *
     * NOTE: This method cannot remove event listeners added by other means.
     * @memberOf Hypergrid#
     */
    removeEventListener: function(eventName, listener) {
        var listenerList = this.listeners[eventName];

        if (listenerList) {
            listenerList.find(function(info, index) {
                if (info.listener === listener) {
                    if (listenerList.length === 1) {
                        delete this.listeners[eventName];
                    } else {
                        listenerList.splice(index, 1); // remove it from the list
                    }
                    this.canvas.removeEventListener(eventName, info.decorator);
                    return true;
                }
            }, this);
        }
    },

    /**
     * @summary Remove all event listeners.
     * @desc Removes all event listeners added with {@link Hypergrid#addEventListener|grid.addEventListener} except those added as "internal."
     * @param {boolean} [internal=false] - Include internal listeners.
     * @memberOf Hypergrid#
     */
    removeAllEventListeners: function(internal) {
        Object.keys(this.listeners).forEach(function(key) {
            this.listeners[key].slice().forEach(function(info) {
                if (internal || !info.internal) {
                    this.removeEventListener(key, info.listener);
                }
            }, this);
        }, this);
    },

    allowEvents: function(allow){
        this.allowEventHandlers = !!allow;

        if (this.behavior.featureChain) {
            if (allow){
                this.behavior.featureChain.attachChain();
            } else {
                this.behavior.featureChain.detachChain();
            }
        }

        this.behavior.changed();
    },

    /**
     * @memberOf Hypergrid#
     * @param {number} c - grid column index.
     * @param {string[]} keys
     */
    fireSyntheticColumnSortEvent: function(c, keys) {
        return dispatchGridEvent.call(this, 'fin-column-sort', {
            column: c,
            keys: keys
        });
    },

    fireSyntheticEditorKeyUpEvent: function(inputControl, keyEvent) {
        return dispatchGridEvent.call(this, 'fin-editor-keyup', {
            input: inputControl,
            keyEvent: keyEvent,
            char: this.canvas.getCharMap()[keyEvent.keyCode][keyEvent.shiftKey ? 1 : 0]
        });
    },

    fireSyntheticEditorKeyDownEvent: function(inputControl, keyEvent) {
        return dispatchGridEvent.call(this, 'fin-editor-keydown', {
            input: inputControl,
            keyEvent: keyEvent,
            char: this.canvas.getCharMap()[keyEvent.keyCode][keyEvent.shiftKey ? 1 : 0]
        });
    },

    fireSyntheticEditorKeyPressEvent: function(inputControl, keyEvent) {
        return dispatchGridEvent.call(this, 'fin-editor-keypress', {
            input: inputControl,
            keyEvent: keyEvent,
            char: this.canvas.getCharMap()[keyEvent.keyCode][keyEvent.shiftKey ? 1 : 0]
        });
    },

    fireSyntheticEditorDataChangeEvent: function(inputControl, oldValue, newValue) {
        return dispatchGridEvent.call(this, 'fin-editor-data-change', true, {
            input: inputControl,
            oldValue: oldValue,
            newValue: newValue
        });
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-row-selection-changed` event.
     */
    fireSyntheticRowSelectionChangedEvent: function() {
        return dispatchGridEvent.call(this, 'fin-row-selection-changed', this.selectionDetailGetters);
    },

    fireSyntheticColumnSelectionChangedEvent: function() {
        return dispatchGridEvent.call(this, 'fin-column-selection-changed', this.selectionDetailGetters);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-context-menu` event
     * @param {keyEvent} event - The canvas event.
     */
    fireSyntheticContextMenuEvent: function(event) {
        Object.defineProperties(event, this.selectionDetailGetterDescriptors);
        return dispatchGridEvent.call(this, 'fin-context-menu', {}, event);
    },

    fireSyntheticMouseUpEvent: function(event) {
        Object.defineProperties(event, this.selectionDetailGetterDescriptors);
        return dispatchGridEvent.call(this, 'fin-mouseup', {}, event);
    },

    fireSyntheticMouseDownEvent: function(event) {
        Object.defineProperties(event, this.selectionDetailGetterDescriptors);
        return dispatchGridEvent.call(this, 'fin-mousedown', {}, event);
    },

    fireSyntheticMouseMoveEvent: function(event) {
        return dispatchGridEvent.call(this, 'fin-mousemove', {}, event);
    },

    fireSyntheticButtonPressedEvent: function(event) {
        var subrects = this.isViewableButton(event.dataCell.x, event.gridCell.y);
        if (subrects) {
            var subrow = subrects.findIndex(function(bounds) {
                var mouse = event.primitiveEvent.detail.mouse;
                return bounds.y <= mouse.y && mouse.y < bounds.y + bounds.height;
            });
            if (subrow >= 0) {
                event.subrow = subrow;
                return dispatchGridEvent.call(this, 'fin-button-pressed', {}, event);
            }
        }
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-column-drag-start` event.
     */
    fireSyntheticOnColumnsChangedEvent: function() {
        return dispatchGridEvent.call(this, 'fin-column-changed-event', {});
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-keydown` event.
     * @param {keyEvent} event - The canvas event.
     */
    fireSyntheticKeydownEvent: function(keyEvent) {
        return dispatchGridEvent.call(this, 'fin-keydown', keyEvent.detail);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-keyup` event.
     * @param {keyEvent} event - The canvas event.
     */
    fireSyntheticKeyupEvent: function(keyEvent) {
        return dispatchGridEvent.call(this, 'fin-keyup', keyEvent.detail);
    },

    fireSyntheticFilterAppliedEvent: function() {
        return dispatchGridEvent.call(this, 'fin-filter-applied', {});
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-cell-enter` event
     * @param {Point} cell - The pixel location of the cell in which the click event occurred.
     * @param {MouseEvent} event - The system mouse event.
     */
    fireSyntheticOnCellEnterEvent: function(cellEvent) {
        return dispatchGridEvent.call(this, 'fin-cell-enter', cellEvent);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-cell-exit` event.
     * @param {Point} cell - The pixel location of the cell in which the click event occured.
     * @param {MouseEvent} event - The system mouse event.
     */
    fireSyntheticOnCellExitEvent: function(cellEvent) {
        return dispatchGridEvent.call(this, 'fin-cell-exit', cellEvent);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-cell-click` event.
     * @param {Point} cell - The pixel location of the cell in which the click event occured.
     * @param {MouseEvent} event - The system mouse event.
     */
    fireSyntheticClickEvent: function(cellEvent) {
        return dispatchGridEvent.call(this, 'fin-click', {}, cellEvent);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-double-click` event.
     * @param {MouseEvent} event - The system mouse event.
     */
    fireSyntheticDoubleClickEvent: function(cellEvent) {
        if (!this.abortEditing()) { return; }

        return dispatchGridEvent.call(this, 'fin-double-click', {}, cellEvent);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a rendered event.
     */
    fireSyntheticGridRenderedEvent: function() {
       return dispatchGridEvent.call(this, 'fin-grid-rendered', { source: this });
    },

    fireSyntheticTickEvent: function() {
        return dispatchGridEvent.call(this, 'fin-tick', { source: this });
    },

    fireSyntheticGridResizedEvent: function(e) {
        return dispatchGridEvent.call(this, 'fin-grid-resized', e);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a scroll event.
     * @param {string} type - Should be either `fin-scroll-x` or `fin-scroll-y`.
     * @param {number} oldValue - The old scroll value.
     * @param {number} newValue - The new scroll value.
     */
    fireScrollEvent: function(eventName, oldValue, newValue) {
        return dispatchGridEvent.call(this, eventName, {
            oldValue: oldValue,
            value: newValue
        });
    },

    fireRequestCellEdit: function(cellEvent, value) {
        return dispatchGridEvent.call(this, 'fin-request-cell-edit', true, { value: value }, cellEvent);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a fin-before-cell-edit event.
     * @param {Point} cell - The x,y coordinates.
     * @param {Object} value - The current value.
     * @returns {boolean} Proceed (don't cancel).
     */
    fireBeforeCellEdit: function(cellEvent, oldValue, newValue, control) {
        return dispatchGridEvent.call(this, 'fin-before-cell-edit', true, {
            oldValue: oldValue,
            newValue: newValue,
            input: control
        }, cellEvent);
    },

    /**
     * @memberOf Hypergrid#
     * @returns {Renderer} sub-component
     * @param {Point} cell - The x,y coordinates.
     * @param {Object} oldValue - The old value.
     * @param {Object} newValue - The new value.
     */
    fireAfterCellEdit: function(cellEvent, oldValue, newValue, control) {
        return dispatchGridEvent.call(this, 'fin-after-cell-edit', {
            newValue: newValue,
            oldValue: oldValue,
            input: control
        }, cellEvent);
    },

    delegateCanvasEvents: function() {
        var grid = this;

        function handleMouseEvent(e, cb) {
            if (grid.getLogicalRowCount() === 0) {
                return;
            }

            var c = grid.getGridCellFromMousePoint(e.detail.mouse),
                primitiveEvent,
                decoratedEvent;

            // No events on the whitespace of the grid unless they're drag events
            if (!c.fake || e.detail.dragstart) {
                primitiveEvent = c.cellEvent;
            }

            if (primitiveEvent) {
                decoratedEvent = Object.defineProperty(
                    primitiveEvent,
                    'primitiveEvent',
                    {
                        value: e,
                        enumerable: false,
                        configurable: true,
                        writable: true
                    }
                );
                cb.call(grid, decoratedEvent);
            }
        }

        this.addInternalEventListener('fin-canvas-resized', function(e) {
            grid.resized();
            grid.fireSyntheticGridResizedEvent(e);
        });

        this.addInternalEventListener('fin-canvas-mousemove', function(e) {
            if (grid.properties.readOnly) {
                return;
            }
            handleMouseEvent(e, function(mouseEvent) {
                this.delegateMouseMove(mouseEvent);
                this.fireSyntheticMouseMoveEvent(mouseEvent);
            });
        });

        this.addInternalEventListener('fin-canvas-mousedown', function(e) {
            if (grid.properties.readOnly) {
                return;
            }
            if (!grid.abortEditing()) {
                e.stopPropagation();
                return;
            }

            handleMouseEvent(e, function(mouseEvent) {
                mouseEvent.keys = e.detail.keys;
                this.mouseDownState = mouseEvent;
                this.delegateMouseDown(mouseEvent);
                this.fireSyntheticMouseDownEvent(mouseEvent);
                this.repaint();
            });
        });

        this.addInternalEventListener('fin-canvas-click', function(e) {
            if (grid.properties.readOnly) {
                return;
            }
            handleMouseEvent(e, function(mouseEvent) {
                mouseEvent.keys = e.detail.keys; // todo: this was in fin-tap but wasn't here
                this.fireSyntheticClickEvent(mouseEvent);
                this.delegateClick(mouseEvent);
            });
        });

        this.addInternalEventListener('fin-canvas-mouseup', function(e) {
            if (grid.properties.readOnly) {
                return;
            }
            grid.dragging = false;
            if (grid.isScrollingNow()) {
                grid.setScrollingNow(false);
            }
            if (grid.columnDragAutoScrolling) {
                grid.columnDragAutoScrolling = false;
            }
            handleMouseEvent(e, function(mouseEvent) {
                this.delegateMouseUp(mouseEvent);
                if (grid.mouseDownState) {
                    grid.fireSyntheticButtonPressedEvent(grid.mouseDownState);
                }
                this.mouseDownState = null;
                this.fireSyntheticMouseUpEvent(mouseEvent);
            });
        });

        this.addInternalEventListener('fin-canvas-dblclick', function(e) {
            if (grid.properties.readOnly) {
                return;
            }
            handleMouseEvent(e, function(mouseEvent) {
                this.fireSyntheticDoubleClickEvent(mouseEvent, e);
                this.delegateDoubleClick(mouseEvent);
            });
        });

        this.addInternalEventListener('fin-canvas-drag', function(e) {
            if (grid.properties.readOnly) {
                return;
            }
            grid.dragging = true;
            handleMouseEvent(e, grid.delegateMouseDrag);
        });

        this.addInternalEventListener('fin-canvas-keydown', function(e) {
            if (grid.properties.readOnly) {
                return;
            }
            grid.fireSyntheticKeydownEvent(e);
            grid.delegateKeyDown(e);
        });

        this.addInternalEventListener('fin-canvas-keyup', function(e) {
            if (grid.properties.readOnly) {
                return;
            }
            grid.fireSyntheticKeyupEvent(e);
            grid.delegateKeyUp(e);
        });

        this.addInternalEventListener('fin-canvas-wheelmoved', function(e) {
            handleMouseEvent(e, grid.delegateWheelMoved);
        });

        this.addInternalEventListener('fin-canvas-mouseout', function(e) {
            if (grid.properties.readOnly) {
                return;
            }
            handleMouseEvent(e, grid.delegateMouseExit);
        });

        this.addInternalEventListener('fin-canvas-context-menu', function(e) {
            handleMouseEvent(e, function(mouseEvent){
                grid.delegateContextMenu(mouseEvent);
                grid.fireSyntheticContextMenuEvent(mouseEvent);
            });
        });

        //Register a listener for the copy event so we can copy our selected region to the pastebuffer if conditions are right.
        document.body.addEventListener('copy', function(evt) {
            grid.checkClipboardCopy(evt);
        });
    },

    /**
     * @memberOf Hypergrid#
     * @desc Delegate the wheel moved event to the behavior.
     * @param {Event} event - The pertinent event.
     */
    delegateWheelMoved: function(event) {
        this.behavior.onWheelMoved(this, event);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Delegate MouseExit to the behavior (model).
     * @param {Event} event - The pertinent event.
     */
    delegateMouseExit: function(event) {
        this.behavior.handleMouseExit(this, event);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Delegate MouseExit to the behavior (model).
     * @param {Event} event - The pertinent event.
     */
    delegateContextMenu: function(event) {
        this.behavior.onContextMenu(this, event);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Delegate MouseMove to the behavior (model).
     * @param {mouseDetails} mouseDetails - An enriched mouse event from fin-canvas.
     */
    delegateMouseMove: function(mouseDetails) {
        this.behavior.onMouseMove(this, mouseDetails);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Delegate mousedown to the behavior (model).
     * @param {mouseDetails} mouseDetails - An enriched mouse event from fin-canvas.
     */
    delegateMouseDown: function(mouseDetails) {
        this.behavior.handleMouseDown(this, mouseDetails);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Delegate mouseup to the behavior (model).
     * @param {mouseDetails} mouseDetails - An enriched mouse event from fin-canvas.
     */
    delegateMouseUp: function(mouseDetails) {
        this.behavior.onMouseUp(this, mouseDetails);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Delegate click to the behavior (model).
     * @param {mouseDetails} mouseDetails - An enriched mouse event from fin-canvas.
     */
    delegateClick: function(mouseDetails) {
        this.behavior.onClick(this, mouseDetails);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Delegate mouseDrag to the behavior (model).
     * @param {mouseDetails} mouseDetails - An enriched mouse event from fin-canvas.
     */
    delegateMouseDrag: function(mouseDetails) {
        this.behavior.onMouseDrag(this, mouseDetails);
    },

    /**
     * @memberOf Hypergrid#
     * @desc We've been doubleclicked on. Delegate through the behavior (model).
     * @param {mouseDetails} mouseDetails - An enriched mouse event from fin-canvas.
     */
    delegateDoubleClick: function(mouseDetails) {
        this.behavior.onDoubleClick(this, mouseDetails);
    },

    /**
     * @memberOf Hypergrid#
     * @summary Generate a function name and call it on self.
     * @desc This should also be delegated through Behavior keeping the default implementation here though.
     * @param {event} event - The pertinent event.
     */
    delegateKeyDown: function(event) {
        this.behavior.onKeyDown(this, event);
    },

    /**
     * @memberOf Hypergrid#
     * @summary Generate a function name and call it on self.
     * @desc This should also be delegated through Behavior keeping the default implementation here though.
     * @param {event} event - The pertinent event.
     */
    delegateKeyUp: function(event) {
        this.behavior.onKeyUp(this, event);
    }

};

},{"../lib/dispatchGridEvent":74}],14:[function(require,module,exports){
/* eslint-env browser */

'use strict';

require('../lib/polyfills'); // Installs misc. polyfills into global objects, as needed

var Point = require('rectangular').Point;
var Rectangle = require('rectangular').Rectangle;
var _ = require('object-iterators'); // fyi: installs the Array.prototype.find polyfill, as needed
var injectCSS = require('inject-stylesheet-template').bind(require('../../css'));

var Base = require('../Base');
var defaults = require('../defaults');
var dynamicPropertyDescriptors = require('../lib/dynamicProperties');
var Canvas = require('../lib/Canvas');
var Renderer = require('../renderer');
var SelectionModel = require('../lib/SelectionModel');
var Localization = require('../lib/Localization');
var Behavior = require('../behaviors/Behavior');
var behaviorJSON = require('../behaviors/Local');
var cellRenderers = require('../cellRenderers');
var cellEditors = require('../cellEditors');
var modules = require('./modules');

var EDGE_STYLES = ['top', 'bottom', 'left', 'right'],
    RECT_STYLES = EDGE_STYLES.concat(['width', 'height', 'position']);

/**
 * @mixes scrolling.mixin
 * @mixes events.mixin
 * @mixes selection.mixin
 * @mixes themes.instanceMixin
 * @constructor
 * @param {string|Element} [container] - CSS selector or Element
 * @param {object} [options] - If `options.data` provided, passed to {@link Hypergrid#setData setData}; else if `options.Behavior` provided, passed to {@link Hypergrid#setBehavior setBehavior}.
 * @param {function} [options.Behavior=Local] - _Per {@link Behavior#setData}._
 * @param {dataModelAPI} [options.dataModel] - _Passed to behavior {@link Behavior constructor}._
 * @param {function} [options.DataModel=require('datasaur-local')] - _Passed to behavior {@link Behavior constructor}._
 * @param {function|object[]} [options.data] - _Passed to behavior {@link Behavior constructor}._
 * @param {function|menuItem[]} [options.schema] - _Passed to behavior {@link Behavior constructor}._
 * @param {dataModelAPI} [options.metadata] - _Passed to behavior {@link Behavior constructor}._
 * * A schema array
 * @param {subgridSpec[]} [options.subgrids=this.properties.subgrids] - _Per {@link Behavior#setData}._
 *
 * @param {pluginSpec|pluginSpec[]} [options.plugins]
 *
 * @param {object} [options.state]
 *
 * @param {string|Element} [options.container] - CSS selector or Element
 *
 * @param {string} [options.localization=Hypergrid.localization]
 * @param {string|string[]} [options.localization.locale=Hypergrid.localization.locale] - The default locale to use when an explicit `locale` is omitted from localizer constructor calls. Passed to Intl.NumberFomrat` and `Intl.DateFomrat`. See {@ https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation|Locale identification and negotiation} for more information.
 * @param {string} [options.localization.numberOptions=Hypergrid.localization.numberOptions] - Options passed to `Intl.NumberFormat` for creating the basic "number" localizer.
 * @param {string} [options.localization.dateOptions=Hypergrid.localization.dateOptions] - Options passed to `Intl.DateFomrat` for creating the basic "date" localizer.
 *
 * @param {object} [options.margin] - Optional canvas "margins" applied to containing div as .left, .top, .right, .bottom. (Default values actually derive from 'grid' stylesheet's `.hypergrid-container` rule.)
 * @param {string} [options.margin.top='0px']
 * @param {string} [options.margin.right='0px']
 * @param {string} [options.margin.bottom='0px']
 * @param {string} [options.margin.left='0px']
 *
 * @param {object} [options.boundingRect] - Optional grid container size & position. (Default values actually derive from 'grid' stylesheet's `.hypergrid-container > div:first-child` rule.)
 * @param {string} [options.boundingRect.height='500px']
 * @param {string} [options.boundingRect.width='auto']
 * @param {string} [options.boundingRect.left='auto']
 * @param {string} [options.boundingRect.top='auto']
 * @param {string} [options.boundingRect.right='auto']
 * @param {string} [options.boundingRect.bottom='auto']
 * @param {string} [options.boundingRect.position='relative']
 */
var Hypergrid = Base.extend('Hypergrid', {
    initialize: function(container, options) {
        this.selectionInitialize();

        //Optional container argument
        if (!(typeof container === 'string') && !(container instanceof HTMLElement)) {
            options = container;
            container = null;
        }

        options = options || {};

        this.clearState();

        //Set up the container for a grid instance
        this.setContainer(
            container ||
            options.container ||
            findOrCreateContainer(options.boundingRect)
        );

        // Install shared plug-ins (those with a `preinstall` method)
        Hypergrid.prototype.installPlugins(options.plugins);

        this.lastEdgeSelection = [0, 0];
        this.isWebkit = navigator.userAgent.toLowerCase().indexOf('webkit') > -1;
        this.selectionModel = new SelectionModel(this);
        this.renderOverridesCache = {};
        this.allowEventHandlers = true;
        this.dragExtent = new Point(0, 0);
        this.numRows = 0;
        this.numColumns = 0;
        this.clearMouseDown();
        this.setFormatter(options.localization);
        this.listeners = {};

        /**
         * @name cellRenderers
         * @type {Registry}
         * @memberOf Hypergrid#
         */
        this.cellRenderers = cellRenderers;

        /**
         * Private version of cell editors registry with a bound `create` method for use by `getCellEditorAt`.
         * @name cellEditors
         * @type {Registry}
         * @memberOf Hypergrid#
         */
        this.cellEditors = Object.create(cellEditors);
        Object.defineProperty(this.cellEditors, 'create', { value: createCellEditor.bind(this) });

        this.initCanvas(options);

        if (options.data) {
            this.setData(options.data, options); // if no behavior has yet been set, `setData` sets a default behavior
        } else if (options.Behavior || options.dataModel || options.DataModel) {
            this.setBehavior(options); // also sets options.data
        }

        if (options.state) {
            this.loadState(options.state);
        }

        /**
         * @name plugins
         * @summary Dictionary of named instance plug-ins.
         * @desc See examples for how to reference (albeit there is normally no need to reference plugins directly).
         *
         * For the dictionary of _shared_ plugins, see {@link Hypergrid.plugins|plugins} (a property of the constructor).
         * @example
         * var instancePlugins = myGrid.plugins;
         * var instancePlugins = this.plugins; // internal use
         * var myInstancePlugin = myGrid.plugins.myInstancePlugin;
         * @type {object}
         * @memberOf Hypergrid#
         */
        this.plugins = {};

        // Install instance plug-ins (those that are constructors OR have an `install` method)
        this.installPlugins(options.plugins);

        // Listen for propagated mouseclicks. Used for aborting edit mode.
        document.addEventListener('mousedown', this.mouseCatcher = function() {
            this.abortEditing();
        }.bind(this));

        setTimeout(this.repaint.bind(this));

        Hypergrid.grids.push(this);

        this.resetGridBorder('Top');
        this.resetGridBorder('Right');
        this.resetGridBorder('Bottom');
        this.resetGridBorder('Left');
    },

    /**
     * Be a responsible citizen and call this function on instance disposal!
     */
    terminate: function() {
        document.removeEventListener('mousedown', this.mouseCatcher);
        this.canvas.stop();
        Hypergrid.grids.splice(this.grids.indexOf(this), 1);
    },


    resetGridBorder: function(edge) {
        edge = edge || '';

        var propName = 'gridBorder' + edge,
            styleName = 'border' + edge,
            props = this.properties,
            border = props[propName];

        switch (border) {
            case true:
                border = props.lineWidth + 'px solid ' + props.lineColor;
                break;
            case false:
                border = null;
                break;
        }
        this.canvas.canvas.style[styleName] = border;
    },

    modules: modules, // Mutate or replace prototype prop to affect all grid instances; set instance prop to affect just instance.

    /**
     *
     * A null object behavior serves as a place holder.
     * @type {object}
     * @memberOf Hypergrid#
     */
    behavior: null,

    /**
     * Cached resulan}
     * @memberOf Hypergrid#
     */
    isWebkit: true,

    /**
     * The pixel location of an initial mousedown click, either for editing a cell or for dragging a selection.
     * @type {Point}
     * @memberOf Hypergrid#
     */
    mouseDown: [],

    /**
     * The extent from the mousedown point during a drag operation.
     * @type {Point}
     * @memberOf Hypergrid#
     */

    dragExtent: null,

    /**
     * @property {fin-hypergrid-selection-model} selectionModel - A [fin-hypergrid-selection-model](module-._selection-model.html) instance.
     * @memberOf Hypergrid#
     */
    selectionModel: null,

    /**
     * @property {fin-hypergrid-cell-editor} cellEditor - The current instance of [fin-hypergrid-cell-editor](module-cell-editors_base.html).
     * @memberOf Hypergrid#
     */
    cellEditor: null,

    /**
     * @property {fin-vampire-bar} sbHScroller - An instance of {@link https://github.com/openfin/finbars|FinBar}.
     * @memberOf Hypergrid#
     */
    sbHScroller: null,

    /**
     * is the short term memory of what column I might be dragging around
     * @type {object}
     * @memberOf Hypergrid#
     */

    renderOverridesCache: {},

    /**
     * The pixel location of the current hovered cell.
     * @todo Need to detect hovering over bottom totals.
     * @type {Point}
     * @memberOf Hypergrid#
     */
    hoverCell: null,

    lastEdgeSelection: null,

    /**
     * @memberOf Hypergrid#
     */
    setAttribute: function(attribute, value) {
        this.div.setAttribute(attribute, value);
    },

    /**
     * @memberOf Hypergrid#
     */
    clearState: function() {
        /**
         * @name properties
         * @type {object}
         * @summary Object containing the properties of the grid.
         * @desc Grid properties objects have the following structure:
         * 1. User-configured properties and dynamic properties are in the "own" layer.
         * 2. Extends from the theme object.
         * 3. The theme object in turn extends from the {@link module:defaults|defaults} object.
         *
         * Note: Any changes the application developer may wish to make to the {@link module:defaults|defaults}
         * object should be made _before_ reaching this point (_i.e.,_ prior to any grid instantiations).
         * @memberOf Hypergrid#
         */
        this.properties = Object.defineProperties(this.initThemeLayer(), {
            grid: { value: this },
            var: { value: new Var() }
        });

        // For all default props of object type, if a dynamic prop, invoke setter; else deep clone it so changes
        // made to inner props won't go to object on theme or defaults layers which are shared by other instances.
        Object.keys(defaults).forEach(function(key) {
            var value = defaults[key];
            if (typeof value === 'object') {
                if (dynamicPropertyDescriptors[key]) {
                    this[key] = value; // invoke dynamic prop setter
                } else {
                    this[key] = deepClone(value); // just a plain object
                }
            }
        }, this.properties);
    },

    /**
     * @desc Clear out all state settings, data (rows), and schema (columns) of a grid instance.
     * @param {object} [options]
     * @param {object} [options.subgrids] - Consumed by {@link Behavior#reset}.
     * If omitted, previously established subgrids list is reused.
     * @memberOf Hypergrid#
     */
    reset: function(options) {
        this.clearState();

        this.removeAllEventListeners();

        this.lastEdgeSelection = [0, 0];
        this.selectionModel.reset();
        this.renderOverridesCache = {};
        this.clearMouseDown();
        this.dragExtent = new Point(0, 0);

        this.numRows = 0;
        this.numColumns = 0;

        this.vScrollValue = 0;
        this.hScrollValue = 0;

        this.cancelEditing();

        this.sbPrevVScrollValue = null;
        this.sbPrevHScrollValue = null;

        this.hoverCell = null;
        this.scrollingNow = false;
        this.lastEdgeSelection = [0, 0];

        this.behavior.reset({
            subgrids: options && options.subgrids
        });

        this.renderer.reset();
        this.canvas.resize();
        this.behaviorChanged();

        this.refreshProperties();
    },

    /** @typedef {object|function|Array} pluginSpec
     * @desc One of:
     * * simple API - a plain object with an `install` method
     * * object API - an object constructor
     * * array:
     *    * first element is an optional name for the API or the newly instantiated object
     *    * next element (or first element when not a string) is the simple or object API
     *    * remaining arguments are optional arguments for the object constructor
     * * falsy value such as `undefined` - ignored
     *
     * The API may have a `name` or `$$CLASS_NAME` property.
     */
    /**
     * @summary Install plugins.
     * @desc Plugin installation:
     * * Each simple API is installed by calling it's `install` method with `this` as first arg + any additional args listed in the `pluginSpec` (when it is an array).
     * * Each object API is installed by instantiating it's constructor with `this` as first arg + any additional args listed in the `pluginSpec` (when it is an array).
     *
     * The resulting plain object or instantiated objects may be named by (in priority order):
     * 1. if `pluginSpec` contains an array and first element is a string
     * 2. object has a `name` property
     * 3. object has a `$$CLASS_NAME` property
     *
     * If named, a reference to each object is saved in `this.plugins`. If the plug-in is unnamed, no reference is kept.
     *
     * There are two types of plugin installations:
     * * Preinstalled plugins which are installed on the prototype. These are simple API plugins with a `preinstall` method called with the `installPlugins` calling context as the first argument. Preinstallations are automatically performed whenever a grid is instantiated (at the beginning of the constructor), by calling `installPlugins` with `Hypergrid.prototype` as the calling context.
     * * Regular plugins which are installed on the instance. These are simple API plugins with an `install` method, as well as all object API plugins (constructors), called with the `installPlugins` calling context as the first argument. These installations are automatically performed whenever a grid is instantiated (at the end of the constructor), called with the new grid instance as the calling context.
     *
     * The "`installPlugins` calling context" means either the grid instance or its prototype, depending on how this method is called.
     *
     * Plugins may have both `preinstall` _and_ `install` methods, in which case both will be called. However, note that in any case, `install` methods on object API plugins are ignored.
     *
     * @this {Hypergrid}
     * @param {pluginSpec|pluginSpec[]} [plugins] - The plugins to install. If omitted, the call is a no-op.
     * @memberOf Hypergrid#
     */
    installPlugins: function(plugins) {
        var shared = this === Hypergrid.prototype; // Do shared ("preinstalled") plugins (if any)

        if (!plugins) {
            return;
        } else if (!Array.isArray(plugins)) {
            plugins = [plugins];
        }

        plugins.forEach(function(plugin) {
            var name, args, hash;

            if (!plugin) {
                return; // ignore falsy plugin spec
            }

            // set first arg of constructor to `this` (the grid instance)
            // set first arg of `install` method to `this` (the grid instance)
            // set first two args of `preinstall` method to `this` (the Hypergrid prototype) and the Behavior prototype
            args = [this];
            if (shared) {
                args.push(Behavior.prototype);
            }

            if (Array.isArray(plugin)) {
                if (!plugin.length) {
                    plugin = undefined;
                } else if (typeof plugin[0] !== 'string') {
                    args = args.concat(plugin.slice(1));
                    plugin = plugin[0];
                } else if (plugin.length >= 2) {
                    args = args.concat(plugin.slice(2));
                    name = plugin[0];
                    plugin = plugin[1];
                } else {
                    plugin = undefined;
                }
            }

            if (!plugin) {
                return; // ignore empty array or array with single string element
            }

            // Derive API name if not given in pluginSpec
            name = name || plugin.name || plugin.$$CLASS_NAME;
            if (name) {
                // Translate first character to lower case
                name = name.substr(0, 1).toLowerCase() + name.substr(1);
            }

            if (shared) {
                // Execute the `preinstall` method
                hash = this.constructor.plugins;
                if (plugin.preinstall && !hash[name]) {
                    plugin.preinstall.apply(plugin, args);
                }
            } else { // instance plug-ins:
                hash = this.plugins;
                if (typeof plugin === 'function') {
                    // Install "object API" by instantiating
                    plugin = this.createApply(plugin, args);
                } else if (plugin.install) {
                    // Install "simple API" by calling its `install` method
                    plugin.install.apply(plugin, args);
                } else if (!plugin.preinstall) {
                    throw new Base.prototype.HypergridError('Expected plugin (a constructor; or an API with a `preinstall` method and/or an `install` method).');
                }
            }

            if (name) {
                hash[name] = plugin;
            }

        }, this);
    },

    /**
     * @summary Uninstall all uninstallable plugins or just named plugins.
     * @desc Calls `uninstall` on plugins that define such a method.
     *
     * To uninstall "preinstalled" plugins, call with `Hypergrid.prototype` as context.
     *
     * For convenience, the following args are passed to the call:
     * * `this` - the plugin to be uninstalled
     * * `grid` - the hypergrid object
     * * `key` - name of the plugin to be uninstalled (_i.e.,_ key in `plugins`)
     * * `plugins` - the plugins hash (a.k.a. `grid.plugins`)
     * @param {string|stirng[]} [pluginNames] If provided, limit uninstall to the named plugin (string) or plugins (string[]).
     * @memberOf Hypergrid#
     */
    uninstallPlugins: function(pluginNames) {
        if (!pluginNames) {
            pluginNames = [];
        } else if (!Array.isArray(pluginNames)) {
            pluginNames = [pluginNames];
        }
        _(this.plugins).each(function(plugin, key, plugins) {
            if (
                plugins.hasOwnProperty(key) &&
                pluginNames.indexOf(key) >= 0 &&
                plugin.uninstall
            ) {
                plugin.uninstall(this, key, plugins);
            }
        }, this);
    },

    computeCellsBounds: function() {
        this.renderer.computeCellsBounds();
    },

    setFormatter: function(options) {
        options = options || {};
        this.localization = new Localization(
            options.locale || Hypergrid.localization.locale,
            options.numberOptions || Hypergrid.localization.numberOptions,
            options.dateOptions || Hypergrid.localization.dateOptions
        );
    },

    getFormatter: function(localizerName) {
        return this.localization.get(localizerName).format;
    },

    formatValue: function(localizerName, value) {
        var formatter = this.getFormatter(localizerName);
        return formatter(value);
    },


    /**
     * @memberOf Hypergrid#
     * @desc Set the cell under the cursor.
     * @param {CellEvent} cellEvent
     */
    setHoverCell: function(cellEvent) {
        var hoverCell = this.hoverCell;
        if (!hoverCell || !hoverCell.equals(cellEvent.gridCell)) {
            this.hoverCell = cellEvent.gridCell;
            if (hoverCell) {
                this.fireSyntheticOnCellExitEvent(cellEvent);
            }
            this.fireSyntheticOnCellEnterEvent(cellEvent);
            this.repaint();
        }
    },

    /**
     * @memberOf Hypergrid#
     * @desc Amend properties for this hypergrid only.
     * @param {object} moreProperties - A simple properties hash.
     */
    addProperties: function(properties) {
        Object.assign(this.properties, properties);
        this.refreshProperties();
    },

    /**
     * @todo deprecate this in favor of making properties dynamic instead (for those that need to be)
     * @memberOf Hypergrid#
     * @desc Utility function to push out properties if we change them.
     * @param {object} properties - An object of various key value pairs.
     */
    refreshProperties: function() {
        this.behaviorShapeChanged();
        this.behavior.defaultRowHeight = null;
        this.behavior.autosizeAllColumns();
    },

    /**
     * @memberOf Hypergrid#
     * @desc Set the state object to return to the given user configuration.
     * @param {object} state - A memento object.
     * @see [Memento pattern](http://en.wikipedia.org/wiki/Memento_pattern)
     */
    setState: function(state) {
        this.addState(state, true);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Add to the state object.
     * @param {object} state
     */
    addState: function(state, settingState) {
        this.behavior.addState(state, settingState);
        this.refreshProperties();
        this.behaviorChanged();
    },

    getState: function() {
        return this.behavior.getState();
    },

    loadState: function(state) {
        this.behavior.setState(state);
    },

    /**
     * @todo Only output values when they differ from defaults (deep compare needed).
     * @param {object} [options]
     * @param {string[]} [options.blacklist] - List of grid properties to exclude. Pertains to grid own properties only.
     * @param {boolean} [options.compact] - Run garbage collection first. The only property this current affects is `properties.calculators` (removes unused calculators).
     * @param {number|string} [options.space='\t'] - For no space, give `0`. (See {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Local/stringify|JSON.stringify}'s `space` param other options.)
     * @param {function} [options.headerify] - If your headers were generated by a function (taking column name as a parameter), give a reference to that function here to avoid persisting headers that match the generated string.
     * @memberOf Hypergrid#
     */
    saveState: function(options) {
        options = options || {};

        var space = options.space === undefined ? '\t' : options.space,
            properties = this.properties,
            calculators = properties.calculators,
            blacklist = options.blacklist = options.blacklist || [];

        blacklist.push('columnProperties'); // Never output this synonym of 'columns'

        if (calculators) {
            if (options.compact) {
                var columns = this.behavior.getColumns();
                Object.keys(calculators).forEach(function(key) {
                    if (!columns.find(function(column) {
                            return column.properties.calculator === calculators[key];
                        })) {
                        delete calculators[key];
                    }
                });
            }
            calculators.toJSON = stringifyFunctions;
        }

        // Temporarily copy the given headerify function for access by columns getter
        this.headerify = options.headerify;

        var json = JSON.stringify(properties, function(key, value) {
            if (this === properties && options.blacklist.indexOf(key) >= 0) {
                value = undefined; // JSON.stringify ignores undefined props
            } else if (key === 'calculator') {
                if (calculators) {
                    // convert function reference to registry key
                    value = Object.keys(calculators).find(function(key) {
                        return calculators[key] === value;
                    });
                } else {
                    // registry may not exist if Column.calculator setter was used directly so just save as is
                    value = value.toString();
                }
            }
            return value;
        }, space);

        // Remove the temporary copy
        delete this.headerify;

        return json;
    },

    /**
     * @memberOf Hypergrid#
     * @returns {object} The initial mouse position on a mouse down event for cell editing or a drag operation.
     * @memberOf Hypergrid#
     */
    getMouseDown: function() {
        if (this.mouseDown.length) {
            return this.mouseDown[this.mouseDown.length - 1];
        }
    },

    /**
     * @memberOf Hypergrid#
     * @desc Remove the last item from the mouse down stack.
     */
    popMouseDown: function() {
        var result;
        if (this.mouseDown.length) {
            result = this.mouseDown.pop();
        }
        return result;
    },

    /**
     * @memberOf Hypergrid#
     * @desc Empty out the mouse down stack.
     */
    clearMouseDown: function() {
        this.mouseDown = [new Point(-1, -1)];
        this.dragExtent = null;
    },

    /**
     * Set the mouse point that initiated a cell edit or drag operation.
     * @param {Point} point
     * @memberOf Hypergrid#
     */
    setMouseDown: function(point) {
        this.mouseDown.push(point);
    },

    /**
     * @memberOf Hypergrid#
     * @returns {Point} The extent point of the current drag selection rectangle.
     */
    getDragExtent: function() {
        return this.dragExtent;
    },

    /**
     * @memberOf Hypergrid#
     * @summary Set the extent point of the current drag selection operation.
     * @param {Point} point
     */
    setDragExtent: function(point) {
        this.dragExtent = point;
    },

    /**
     * @memberOf Hypergrid#
     * @desc This function is a callback from the HypergridRenderer sub-component. It is called after each paint of the canvas.
     */
    gridRenderedNotification: function() {
        if (this.cellEditor) {
            this.cellEditor.gridRenderedNotification();
        }
        this.checkColumnAutosizing();
        this.fireSyntheticGridRenderedEvent();
    },

    tickNotification: function() {
        this.fireSyntheticTickEvent();
    },

    /**
     * @memberOf Hypergrid#
     * @desc The grid has just been rendered, make sure the column widths are optimal.
     */
    checkColumnAutosizing: function() {
        this.behavior.autoSizeRowNumberColumn();
        if (this.behavior.checkColumnAutosizing(false)) {
            this.behaviorShapeChanged();
        }
    },

    /**
     * @memberOf Hypergrid#
     * @summary Conditionally copy to clipboard.
     * @desc If we have focus, copy our current selection data to the system clipboard.
     * @param {event} event - The copy system event.
     */
    checkClipboardCopy: function(event) {
        if (this.hasFocus()) {
            event.preventDefault();
            var csvData = this.getSelectionAsTSV();
            event.clipboardData.setData('text/plain', csvData);
        }
    },

    /**
     * @memberOf Hypergrid#
     * @returns {boolean} We have focus.
     */
    hasFocus: function() {
        return this.canvas.hasFocus();
    },

    /**
     * @memberOf Hypergrid#
     * @summary Set the Behavior object for this grid control.
     * @desc Called when `options.Behavior` from:
     * * Hypergrid constructor
     * * `setData` when not called explicitly before then
     * @param {object} [options] - _Per {@link Behavior#setData}._
     * @param {Behavior} [options.Behavior=Local] - The behavior (model) can be either a constructor or an instance.
     * @param {dataModelAPI} [options.dataModel] - A fully instantiated data model object.
     * @param {function} [options.DataModel=require('datasaur-local')] - Data model will be instantiated from this constructor unless `options.dataModel` was given.
     * @param {dataModelAPI} [options.metadata] - Value to be passed to setMetadataStore if the data model has changed.
     * @param {dataRowObject[]} [options.data] - _Per {@link Behavior#setData}._
     * @param {function|menuItem[]} [options.schema] - _Per {@link Behavior#setData}.
     */
    setBehavior: function(options) {
        var Behavior = options && options.Behavior || behaviorJSON;
        this.behavior = new Behavior(this, options);
        this.initScrollbars();
        this.refreshProperties();
        this.behavior.reindex();
    },

    /**
     * Number of _visible_ columns.
     * @memberOf Hypergrid#
     * @returns {number} The number of columns.
     */
    getColumnCount: function() {
        return this.behavior.getActiveColumnCount();
    },

    /**
     * @memberOf Hypergrid#
     * @returns {number} The number of rows.
     */
    getRowCount: function() {
        return this.behavior.getRowCount();
    },

    getRow: function(y) {
        return this.behavior.getRow(y);
    },

    /**
     * @memberOf Hypergrid#
     * @summary Get data value at given cell.
     * @param {number} x - The horizontal coordinate.
     * @param {number} y - The vertical coordinate.
     */
    getValue: function(x, y) {
        return this.behavior.getValue.apply(this.behavior, arguments); // must use .apply (see this.behavior.getValue)
    },

    /**
     * @memberOf Hypergrid#
     * @summary Set a data value of a given cell.
     * @param {number} x - The horizontal coordinate.
     * @param {number} y - The vertical coordinate.
     * @param {*} value - New cell value.
     */
    setValue: function(x, y, value) {
        this.behavior.setValue.apply(this.behavior, arguments); // must use .apply (see this.behavior.setValue)
    },

    /**
     * @memberOf Hypergrid#
     * @summary Set the underlying datasource.
     * @desc This can be done dynamically.
     * @param {function|object[]} dataRows - May be:
     * * An array of congruent raw data objects.
     * * A function returning same.
     * @param {object} [options] - _(See also {@link Behavior#setData} for additional options.)_
     * @param {Behavior} [options.Behavior=Local] - The behavior (model) can be either a constructor or an instance.
     * @param {dataModelAPI} [options.dataModel] - _Passed to behavior {@link Behavior constructor} (when `options.Behavior` given)._
     * @param {function} [options.DataModel=require('datasaur-local')] - _Passed to behavior {@link Behavior constructor} (when `options.Behavior` given)._
     * @param {dataModelAPI} [options.metadata] - _Passed to behavior {@link Behavior constructor} (when `options.Behavior` given)._
     * @param {dataRowObject[]} [options.data] - _Passed to behavior {@link Behavior constructor} (when `options.Behavior` given)._
     * @param {function|menuItem[]} [options.schema] - _Passed to behavior {@link Behavior constructor} (when `options.Behavior` given)._
     */
    setData: function(dataRows, options) {
        if (!this.behavior) {
            this.setBehavior(options);
        }
        this.behavior.setData(dataRows, options);
        this.setInfo(dataRows.length ? '' : this.properties.noDataMessage);
        this.behavior.changed();
    },

    setInfo: function(messages) {
        this.renderer.setInfo(messages);
    },

    /**
     * @memberOf Behavior#
     */
    reindex: function() {
        this.needsReindex = this.needsShapeChanged = true;
    },

    /**
     * @memberOf Hypergrid#
     * @desc I've been notified that the behavior has changed.
     */
    behaviorChanged: function() {
        if (this.divCanvas) {
            if (this.numColumns !== this.getColumnCount() || this.numRows !== this.getRowCount()) {
                this.numColumns = this.getColumnCount();
                this.numRows = this.getRowCount();
                this.behaviorShapeChanged();
            } else {
                this.behaviorStateChanged();
            }
        }
    },

    /**
     * @memberOf Hypergrid#
     * @desc The dimensions of the grid data have changed. You've been notified.
     */
    behaviorShapeChanged: function() {
        this.needsShapeChanged = true;
        this.repaint();
    },

    /**
     * @memberOf Hypergrid#
     * @desc The dimensions of the grid data have changed. You've been notified.
     */
    behaviorStateChanged: function() {
        this.needsStateChanged = true;
        this.repaint();
    },

    /**
     * Called from renderer/index.js
     */
    deferredBehaviorChange: function() {
        if (this.needsReindex) {
            this.behavior.reindex();
            this.needsReindex = false;
        }

        if (this.needsShapeChanged) {
            if (this.divCanvas) {
                this.synchronizeScrollingBoundaries(); // calls computeCellsBounds and repaint (state change)
            }
        } else if (this.needsStateChanged) {
            if (this.divCanvas) {
                this.computeCellsBounds();
            }
        }

        this.needsShapeChanged = this.needsStateChanged = false;
    },

    /**
     * @memberOf Hypergrid#
     * @returns {Rectangle} My bounds.
     */
    getBounds: function() {
        return this.renderer.getBounds();
    },

    repaint: function() {
        var now = this.properties.repaintImmediately;
        var canvas = this.canvas;
        if (canvas) {
            if (now === true) {
                canvas.paintNow();
            } else {
                canvas.repaint();
            }
        }
    },

    /**
     * @memberOf Hypergrid#
     * @desc Paint immediately in this microtask.
     */
    paintNow: function() {
        this.canvas.paintNow();
    },

    /**
     * @memberOf Hypergrid#
     * @summary Set the container for a grid instance
     * @private
     */
    setContainer: function(div) {
        this.initContainer(div);
        this.initRenderer();
        // injectGridElements.call(this);
    },

    /**
     * @memberOf Hypergrid#
     * @summary Initialize container
     * @private
     */
    initContainer: function(div) {
        if (typeof div === 'string') {
            div = document.querySelector(div);
        }

        //Default Position and height to ensure DnD works
        if (!div.style.position) {
            div.style.position = null; // revert to stylesheet value
        }

        if (div.clientHeight < 1) {
            div.style.height = null; // revert to stylesheet value
        }

        injectCSS('grid');

        //prevent the default context menu for appearing
        div.oncontextmenu = function(event) {
            event.stopPropagation();
            event.preventDefault();
            return false;
        };

        div.removeAttribute('tabindex');

        div.classList.add('hypergrid-container');
        div.id = div.id || 'hypergrid' + (document.querySelectorAll('.hypergrid-container').length - 1 || '');

        this.div = div;
    },

    /**
     * @memberOf Hypergrid#
     * @summary Initialize drawing surface.
     * @param {object} [options]
     * @param {object} [options.margin] - Optional canvas "margins" applied to containing div as .left, .top, .right, .bottom. (Default values actually derive from 'grid' stylesheet's `.hypergrid-container` rule.)
     * @param {string} [options.margin.top='0px']
     * @param {string} [options.margin.right='0px']
     * @param {string} [options.margin.bottom='0px']
     * @param {string} [options.margin.left='0px']
     * @private
     */
    initCanvas: function(options) {
        if (!this.divCanvas) {
            var divCanvas = document.createElement('div');

            setStyles(divCanvas, options && options.margin, EDGE_STYLES);

            this.div.appendChild(divCanvas);

            var canvas = new Canvas(divCanvas, this.renderer);
            canvas.canvas.classList.add('hypergrid');

            this.divCanvas = divCanvas;
            this.canvas = canvas;

            this.delegateCanvasEvents();
        }
    },

    convertViewPointToDataPoint: function(unscrolled) {
        return this.behavior.convertViewPointToDataPoint(unscrolled);
    },

    convertDataPointToViewPoint: function(dataPoint) {
        return this.behavior.convertDataPointToViewPoint(dataPoint);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Switch the cursor for a grid instance.
     * @param {string|string[]} cursorName - A well know cursor name.
     * @see [cursor names](http://www.javascripter.net/faq/stylesc.htm)
     */
    beCursor: function(cursorName) {
        if (!cursorName) {
            cursorName = ['default'];
        } else if (!Array.isArray(cursorName)) {
            cursorName = [cursorName];
        }
        cursorName.forEach(function(name) { this.cursor = name; }, this.div.style);
    },

    /**
     * @summary Shut down the current cell editor and save the edited value.
     * @returns {boolean} One of:
     * * `false` - Editing BUT could not abort.
     * * `true` - Not editing OR was editing AND abort was successful.
     * @memberOf Hypergrid#
     */
    stopEditing: function() {
        return !this.cellEditor || this.cellEditor.stopEditing();
    },

    /**
     * @summary Shut down the current cell editor without saving the edited val
     * @returns {boolean} One of:
     * * `false` - Editing BUT could not abort.
     * * `true` - Not editing OR was editing AND abort was successful.
     * @memberOf Hypergrid#
     */
    cancelEditing: function() {
        return !this.cellEditor || this.cellEditor.cancelEditing();
    },

    /**
     * @summary Give cell editor opportunity to cancel (or something) instead of stop .
     * @returns {boolean} One of:
     * * `false` - Editing BUT could not abort.
     * * `true` - Not editing OR was editing AND abort was successful.
     * @memberOf Hypergrid#
     */
    abortEditing: function() {
        return !this.cellEditor || (
            this.cellEditor.abortEditing ? this.cellEditor.abortEditing() : this.cellEditor.stopEditing()
        );
    },

    /**
     * @memberOf Hypergrid#
     * @returns {Rectangle} The pixel coordinates of just the center 'main" data area.
     */
    getDataBounds: function() {
        var b = this.canvas.bounds;
        return new Rectangle(0, 0, b.origin.x + b.extent.x, b.origin.y + b.extent.y);
    },

    /**
     * @memberOf Hypergrid#
     * @summary Open the cell-editor for the cell at the given coordinates.
     * @param {CellEvent} event - Coordinates of "edit point" (gridCell.x, dataCell.y).
     * @return {undefined|CellEditor} The cellEditor determined from the cell's render properties, which may be modified by logic added by overriding {@link DataModel#getCellEditorAt|getCellEditorAt}.
     */
    editAt: function(event) {
        var cellEditor;

        this.abortEditing(); // if another editor is open, close it first

        if (
            event.isDataColumn &&
            event.properties[event.isDataRow ? 'editable' : 'filterable'] &&
            (cellEditor = this.getCellEditorAt(event))
        ) {
            cellEditor.beginEditing();
        }

        return cellEditor;
    },

    /**
     * @memberOf Hypergrid#
     * @param {number} columnIndex - The column index in question.
     * @returns {boolean} The given column is fully visible.
     */
    isColumnVisible: function(columnIndex) {
        return this.renderer.isColumnVisible(columnIndex);
    },

    /**
     * @memberOf Hypergrid#
     * @param {number} r - The raw row index in question.
     * @returns {boolean} The given row is fully visible.
     */
    isDataRowVisible: function(r) {
        return this.renderer.isDataRowVisible(r);
    },

    /**
     * @memberOf Hypergrid#
     * @param {number} c - The column index in question.
     * @param {number} rn - The grid row index in question.
     * @returns {boolean} The given cell is fully is visible.
     */
    isDataVisible: function(c, rn) {
        return this.isDataRowVisible(rn) && this.isColumnVisible(c);
    },

    /**
     * @memberOf Hypergrid#
     * @summary Scroll in the `offsetX` direction if column index `colIndex` is not visible.
     * @param {number} colIndex - The column index in question.
     * @param {number} offsetX - The direction and magnitude to scroll if we need to.
     * @return {boolean} Column is visible.
     */
    insureModelColIsVisible: function(colIndex, offsetX) {
        var maxCols = this.getColumnCount() - 1, // -1 excludes partially visible columns
            indexToCheck = colIndex + Math.sign(offsetX),
            visible = !this.isColumnVisible(indexToCheck) || colIndex === maxCols;

        if (visible) {
            //the scroll position is the leftmost column
            this.scrollBy(offsetX, 0);
        }

        return visible;
    },

    /**
     * @memberOf Hypergrid#
     * @summary Scroll in the `offsetY` direction if column index c is not visible.
     * @param {number} rowIndex - The column index in question.
     * @param {number} offsetX - The direction and magnitude to scroll if we need to.
     * @return {boolean} Row is visible.
     */
    insureModelRowIsVisible: function(rowIndex, offsetY) {
        var maxRows = this.getRowCount() - 1, // -1 excludes partially visible rows
            scrollOffset = (offsetY > -1) ? 2 : 0, // 2 to keep one blank line below active cell, 0 to keep zero lines above active cell
            indexToCheck = rowIndex + scrollOffset,
            visible = !this.isDataRowVisible(indexToCheck) || rowIndex === maxRows;

        if (visible) {
            //the scroll position is the topmost row
            this.scrollBy(0, offsetY);
        }

        return visible;
    },

    /**
     * @memberOf Hypergrid#
     * @summary Scroll horizontal and vertically by the provided offsets.
     * @param {number} offsetX - Scroll in the x direction this much.
     * @param {number} offsetY - Scroll in the y direction this much.
     */
    scrollBy: function(offsetX, offsetY) {
        this.scrollHBy(offsetX);
        this.scrollVBy(offsetY);
    },

    /**
     * @memberOf Hypergrid#
     * @summary Scroll vertically by the provided offset.
     * @param {number} offsetY - Scroll in the y direction this much.
     */
    scrollVBy: function(offsetY) {
        var max = this.sbVScroller.range.max;
        var oldValue = this.getVScrollValue();
        var newValue = Math.min(max, Math.max(0, oldValue + offsetY));
        if (newValue !== oldValue) {
            this.setVScrollValue(newValue);
        }
    },

    /**
     * @memberOf Hypergrid#
     * @summary Scroll horizontally by the provided offset.
     * @param {number} offsetX - Scroll in the x direction this much.
     */
    scrollHBy: function(offsetX) {
        var max = this.sbHScroller.range.max;
        var oldValue = this.getHScrollValue();
        var newValue = Math.min(max, Math.max(0, oldValue + offsetX));
        if (newValue !== oldValue) {
            this.setHScrollValue(newValue);
        }
    },

    scrollToMakeVisible: function(c, r) {
        var delta,
            dw = this.renderer.dataWindow,
            fixedColumnCount = this.properties.fixedColumnCount,
            fixedRowCount = this.properties.fixedRowCount;

        // scroll only if target not in fixed columns
        if (c >= fixedColumnCount) {
            // target is to left of scrollable columns; negative delta scrolls left
            if ((delta = c - dw.origin.x) < 0) {
                this.sbHScroller.index += delta;

                // target is to right of scrollable columns; positive delta scrolls right
                // Note: The +1 forces right-most column to scroll left (just in case it was only partially in view)
            } else if ((c - dw.corner.x + 1) > 0) {
                this.sbHScroller.index = this.renderer.getMinimumLeftPositionToShowColumn(c);
            }
        }

        if (
            r >= fixedRowCount && // scroll only if target not in fixed rows
            (
                // target is above scrollable rows; negative delta scrolls up
                (delta = r - dw.origin.y) < 0 ||

                // target is below scrollable rows; positive delta scrolls down
                (delta = r - dw.corner.y) > 0
            )
        ) {
            this.sbVScroller.index += delta;
        }
    },

    selectCellAndScrollToMakeVisible: function(c, r) {
        this.scrollToMakeVisible(c, r);
        this.selectCell(c, r, true);
    },

    /**
     * @memberOf Hypergrid#
     * @summary Answer which data cell is under a pixel value mouse point.
     * @param {mousePoint} mouse - The mouse point to interrogate.
     */

    getGridCellFromMousePoint: function(mouse) {
        return this.renderer.getGridCellFromMousePoint(mouse);
    },

    /**
     * @param {Point} gridCell - The pixel location of the mouse in physical grid coordinates.
     * @returns {Rectangle} The pixel based bounds rectangle given a data cell point.
     * @memberOf Hypergrid#
     */
    getBoundsOfCell: function(gridCell) {
        var b = this.renderer.getBoundsOfCell(gridCell.x, gridCell.y);

        //convert to a proper rectangle
        return new Rectangle(b.x, b.y, b.width, b.height);
    },

    /**
     * @memberOf Hypergrid#
     * @desc This is called by the fin-canvas when a resize occurs.
     */
    resized: function() {
        this.behaviorShapeChanged();
    },

    /**
     * To intercept link clicks, override this method (either on the prototype to apply to all grid instances or on an instance to apply to a specific grid instance).
     * @memberOf Hypergrid#
     */
    windowOpen: function(url, name, features, replace) {
        return window.open.apply(window, arguments);
    },

    /**
     * @param {number} [begin]
     * @param {nubmer} [end]
     * * @returns {Column[]} A copy of the all columns array by passing the params to `Array.prototype.slice`.
     */
    getColumns: function(begin, end) {
        var columns = this.behavior.getColumns();
        return columns.slice.apply(columns, arguments);
    },

    /**
     * @param {number} [begin]
     * @param {nubmer} [end]
     * * @returns {Column[]} A copy of the active columns array by passing the params to `Array.prototype.slice`.
     */
    getActiveColumns: function(begin, end) {
        var columns = this.behavior.getActiveColumns();
        return columns.slice.apply(columns, arguments);
    },

    getHiddenColumns: function() {
        //A non in-memory behavior will be more troublesome
        return this.behavior.getHiddenColumns();
    },

    isViewableButton: function(c, r) {
        return this.renderer.isViewableButton(c, r);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Request input focus.
     */
    takeFocus: function() {
        var wasCellEditor = this.cellEditor;
        this.stopEditing();
        if (!wasCellEditor) {
            this.canvas.takeFocus();
        }
    },

    /**
     * @memberOf Hypergrid#
     * @desc Request focus for our cell editor.
     */
    editorTakeFocus: function() {
        if (this.cellEditor) {
            return this.cellEditor.takeFocus();
        }
    },

    /**
     * @memberOf Hypergrid#
     * @desc Initialize the scroll bars.
     */
    initScrollbars: function() {
        if (this.sbHScroller && this.sbVScroller) {
            return;
        }

        var Scrollbar = modules.scrollbar;

        var horzBar = new Scrollbar({
            orientation: 'horizontal',
            onchange: this.setHScrollValue.bind(this),
            cssStylesheetReferenceElement: this.div
        });

        var vertBar = new Scrollbar({
            orientation: 'vertical',
            onchange: this.setVScrollValue.bind(this),
            paging: {
                up: this.pageUp.bind(this),
                down: this.pageDown.bind(this)
            }
        });

        this.sbHScroller = horzBar;
        this.sbVScroller = vertBar;

        var hPrefix = this.properties.hScrollbarClassPrefix;
        var vPrefix = this.properties.vScrollbarClassPrefix;

        if (hPrefix && hPrefix !== '') {
            this.sbHScroller.classPrefix = hPrefix;
        }

        if (vPrefix && vPrefix !== '') {
            this.sbVScroller.classPrefix = vPrefix;
        }

        this.div.appendChild(horzBar.bar);
        this.div.appendChild(vertBar.bar);

        this.resizeScrollbars();
    },

    resizeScrollbars: function() {
        this.sbHScroller.shortenBy(this.sbVScroller).resize();
        //this.sbVScroller.shortenBy(this.sbHScroller);
        this.sbVScroller.resize();
    },

    /**
     * @memberOf Hypergrid#
     * @desc Scroll values have changed, we've been notified.
     */
    setVScrollbarValues: function(max) {
        this.sbVScroller.range = {
            min: 0,
            max: max
        };
    },

    setHScrollbarValues: function(max) {
        this.sbHScroller.range = {
            min: 0,
            max: max
        };
    },

    scrollValueChangedNotification: function() {
        if (
            this.hScrollValue !== this.sbPrevHScrollValue ||
            this.vScrollValue !== this.sbPrevVScrollValue
        ) {
            this.sbPrevHScrollValue = this.hScrollValue;
            this.sbPrevVScrollValue = this.vScrollValue;

            if (this.cellEditor) {
                this.cellEditor.scrollValueChangedNotification();
            }

            this.computeCellsBounds();
        }
    },

    /**
     * @memberOf Hypergrid#
     * @desc Note that "viewable rows" includes any partially viewable rows.
     * @returns {number} The number of viewable rows.
     */
    getVisibleRows: function() {
        return this.renderer.getVisibleRows();
    },

    /**
     * @memberOf Hypergrid#
     * @desc Note that "viewable columns" includes any partially viewable columns.
     * @returns {number} The number of viewable columns.
     */
    getVisibleColumns: function() {
        return this.renderer.getVisibleColumns();
    },

    /**
     * @memberOf Hypergrid#
     * @summary Initialize the renderer sub-component.
     */
    initRenderer: function() {
        this.renderer = this.renderer || new Renderer(this);
    },

    /**
     * @memberOf Hypergrid#
     * @returns {number} The width of the given column.
     * @param {number} columnIndex - The untranslated column index.
     */
    getColumnWidth: function(columnIndex) {
        return this.behavior.getColumnWidth(columnIndex);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Set the width of the given column.
     * @param {number} columnIndex - The untranslated column index.
     * @param {number} columnWidth - The width in pixels.
     */
    setColumnWidth: function(columnIndex, columnWidth) {
        if (this.abortEditing()) {
            this.behavior.setColumnWidth(columnIndex, columnWidth);
        }
    },

    /**
     * @memberOf Hypergrid#
     * @returns {number} The total width of all the fixed columns.
     */
    getFixedColumnsWidth: function() {
        return this.behavior.getFixedColumnsWidth();
    },

    /**
     * @memberOf Hypergrid#
     * @returns {number} The height of the given row
     * @param {number} rowIndex - The untranslated fixed column index.
     */
    getRowHeight: function(rowIndex, dataModel) {
        return this.behavior.getRowHeight(rowIndex, dataModel);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Set the height of the given row.
     * @param {number} rowIndex - The row index.
     * @param {number} rowHeight - The width in pixels.
     */
    setRowHeight: function(rowIndex, rowHeight, dataModel) {
        if (this.abortEditing()) {
            this.behavior.setRowHeight(rowIndex, rowHeight, dataModel);
        }
    },

    /**
     * @memberOf Hypergrid#
     * @returns {number} The total fixed rows height
     */
    getFixedRowsHeight: function() {
        return this.behavior.getFixedRowsHeight();
    },

    /**
     * @memberOf Hypergrid#
     * @returns {number} The number of fixed columns.
     */
    getFixedColumnCount: function() {
        return this.behavior.getFixedColumnCount();
    },

    /**
     * @memberOf Hypergrid#
     * @returns The number of fixed rows.
     */
    getFixedRowCount: function() {
        return this.behavior.getFixedRowCount();
    },

    /**
     * @memberOf Hypergrid#
     * @summary The top left area has been clicked on
     * @desc Delegates to the behavior.
     * @param {event} mouse - The event details.
     */
    topLeftClicked: function(mouse) {
        this.behavior.topLeftClicked(this, mouse);
    },

    /**
     * @memberOf Hypergrid#
     * @summary A fixed row has been clicked.
     * @desc Delegates to the behavior.
     * @param {event} event - The event details.
     */
    rowHeaderClicked: function(mouse) {
        this.behavior.rowHeaderClicked(this, mouse);
    },

    /**
     * @memberOf Hypergrid#
     * @summary A fixed column has been clicked.
     * @desc Delegates to the behavior.
     * @param {event} event - The event details.
     */
    columnHeaderClicked: function(mouse) {
        this.behavior.columnHeaderClicked(this, mouse);
    },

    /**
     * @memberOf Hypergrid#
     * @desc An edit event has occurred. Activate the editor at the given coordinates.
     * @param {number} event.gridCell.x - The horizontal coordinate.
     * @param {number} event.gridCell.y - The vertical coordinate.
     * @param {boolean} [event.primitiveEvent.type]
     * @returns {undefined|CellEditor} The editor object or `undefined` if no editor or editor already open.
     */
    onEditorActivate: function(event) {
        return this.editAt(event);
    },

    /**
     * @memberOf Hypergrid#
     * @summary Get the cell editor.
     * @desc Delegates to the behavior.
     * @returns The cell editor at the given coordinates.
     * @param {Point} cellEvent - The grid cell coordinates.
     */
    getCellEditorAt: function(event) {
        return this.behavior.getCellEditorAt(event);
    },

    /**
     * @memberOf Hypergrid#
     * @summary Toggle HiDPI support.
     * @desc HiDPI support is now *on* by default.
     * > There used to be a bug in Chrome that caused severe slow down on bit blit of large images, so this HiDPI needed to be optional.
     */
    toggleHiDPI: function() {
        if (this.properties.useHiDPI) {
            this.removeAttribute('hidpi');
        } else {
            this.setAttribute('hidpi', null);
        }
        this.canvas.resize();
    },

    /**
     * @memberOf Hypergrid#
     * @returns {number} The HiDPI ratio.
     */
    getHiDPI: function(ctx) {
        if (window.devicePixelRatio && this.properties.useHiDPI) {
            var devicePixelRatio = window.devicePixelRatio || 1,
                backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                    ctx.mozBackingStorePixelRatio ||
                    ctx.msBackingStorePixelRatio ||
                    ctx.oBackingStorePixelRatio ||
                    ctx.backingStorePixelRatio || 1,
                result = devicePixelRatio / backingStoreRatio;
        } else {
            result = 1;
        }
        return result;
    },

    /**
     * @memberOf Hypergrid#
     * @returns {number} The width of the given (recently rendered) column.
     * @param {number} colIndex - The column index.
     */
    getRenderedWidth: function(colIndex) {
        return this.renderer.getRenderedWidth(colIndex);
    },

    /**
     * @memberOf Hypergrid#
     * @returns {number} The height of the given (recently rendered) row.
     * @param {number} rowIndex - The row index.
     */
    getRenderedHeight: function(rowIndex) {
        return this.renderer.getRenderedHeight(rowIndex);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Update the cursor under the hover cell.
     */
    updateCursor: function() {
        var cursor = this.behavior.getCursorAt(-1, -1);
        var hoverCell = this.hoverCell;
        if (
            hoverCell &&
            hoverCell.x > -1 &&
            hoverCell.y > -1
        ) {
            var x = hoverCell.x + this.getHScrollValue();
            cursor = this.behavior.getCursorAt(x, hoverCell.y + this.getVScrollValue());
        }
        this.beCursor(cursor);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Repaint the given cell.
     * @param {x} x - The horizontal coordinate.
     * @param {y} y - The vertical coordinate.
     */
    repaintCell: function(x, y) {
        this.renderer.repaintCell(x, y);
    },

    /**
     * @memberOf Hypergrid#
     * @returns {boolean} The user is currently dragging a column to reorder it.
     */
    isDraggingColumn: function() {
        return !!this.renderOverridesCache.dragger;
    },

    /**
     * @memberOf Hypergrid#
     * @returns {object[]} Objects with the values that were just rendered.
     */
    getRenderedData: function() {
        return this.renderer.getVisibleCellMatrix();
    },

    /**
     * @summary Autosize a column for best fit.
     * @param {Column|number} columnOrIndex - The column or active column index.
     * @memberOf Hypergrid#
     */
    autosizeColumn: function(columnOrIndex) {
        var column = columnOrIndex >= -2 ? this.behavior.getActiveColumn(columnOrIndex) : columnOrIndex;
        column.checkColumnAutosizing(true);
        this.computeCellsBounds();
    },

    /**
     * @memberOf Hypergrid#
     * @desc Enable/disable if this component can receive the focus.
     * @param {boolean} - canReceiveFocus
     */
    setFocusable: function(canReceiveFocus) {
        this.canvas.setFocusable(canReceiveFocus);
    },

    /**
     * @memberOf Hypergrid#
     * @returns {number} The number of columns that were just rendered
     */
    getVisibleColumnsCount: function() {
        return this.renderer.getVisibleColumnsCount();
    },

    /**
     * @memberOf Hypergrid#
     * @returns {number} The number of rows that were just rendered
     */
    getVisibleRowsCount: function() {
        return this.renderer.getVisibleRowsCount();
    },

    /**
     * @memberOf Hypergrid#
     * @desc Update the size of a grid instance.
     */
    updateSize: function() {
        this.canvas.checksize();
    },


    /**
     * @memberOf Hypergrid#
     * @desc Stop the global repainting flag thread.
     */
    stopPaintThread: function() {
        this.canvas.stopPaintThread();
    },

    /**
     * @memberOf Hypergrid#
     * @desc Stop the global resize check flag thread.
     */
    stopResizeThread: function() {
        this.canvas.stopResizeThread();
    },

    /**
     * @memberOf Hypergrid#
     * @desc Restart the global resize check flag thread.
     */
    restartResizeThread: function() {
        this.canvas.restartResizeThread();
    },

    /**
     * @memberOf Hypergrid#
     * @desc Restart the global repainting check flag thread.
     */
    restartPaintThread: function() {
        this.canvas.restartPaintThread();
    },

    swapColumns: function(source, target) {
        //Turns out this is called during dragged 'i.e' when the floater column is reshuffled
        //by the currently dragged column. The column positions are constantly reshuffled
        this.behavior.swapColumns(source, target);
    },

    endDragColumnNotification: function() {
        this.behavior.endDragColumnNotification();
    },

    getFixedColumnsMaxWidth: function() {
        return this.behavior.getFixedColumnsMaxWidth();
    },

    isMouseDownInHeaderArea: function() {
        var headerRowCount = this.getHeaderRowCount();
        var mouseDown = this.getMouseDown();
        return mouseDown.x < 0 || mouseDown.y < headerRowCount;
    },

    /**
     * @param {index} x - Data x coordinate.
     * @return {Object} The properties for a specific column.
     * @memberOf Hypergrid#
     */
    getColumnProperties: function(x) {
        return this.behavior.getColumnProperties(x);
    },

    /**
     * @param {index} x - Data x coordinate.
     * @return {Object} The properties for a specific column.
     * @memberOf Hypergrid#
     */
    setColumnProperties: function(x, properties) {
        this.behavior.setColumnProperties(x, properties);
    },

    /**
     * Clears all cell properties of given column or of all columns.
     * @param {number} [x] - Omit for all columns.
     * @memberOf Behavior#
     */
    clearAllCellProperties: function(x) {
        this.behavior.clearAllCellProperties(x);
        this.renderer.resetAllCellPropertiesCaches();
    },

    /**
     * @param {integerRowIndex|sectionPoint} rn
     * @returns {boolean}
     * @memberOf Hypergrid#
     */
    isGridRow: function(y) {
        return new this.behavior.CellEvent(0, y).isDataRow;
    },

    /**
     * @returns {number} The total number of rows of all subgrids preceding the data subgrid.
     * @memberOf Hypergrid#
     */
    getHeaderRowCount: function() {
        return this.behavior.getHeaderRowCount();
    },

    /**
     * @returns {number} The total number of rows of all subgrids following the data subgrid.
     * @memberOf Hypergrid#
     */
    getFooterRowCount: function() {
        return this.behavior.getFooterRowCount();
    },

    /**
     * @returns {number} The total number of logical rows of all subgrids.
     * @memberOf Hypergrid#
     */
    getLogicalRowCount: function() {
        return this.behavior.getLogicalRowCount();
    },

    hasTreeColumn: function(columnIndex) {
        return this.behavior.hasTreeColumn(columnIndex);
    },
    lookupFeature: function(key) {
        return this.behavior.lookupFeature(key);
    },

    newPoint: function(x, y) {
        return new Point(x, y);
    },
    newRectangle: function(x, y, width, height) {
        return new Rectangle(x, y, width, height);
    },

    get charMap() {
        return this.behavior.charMap;
    }
});


/**
 * Creates an instance variable backer for use by the getters and setters described in {@link dynamicProperties}.
 * @constructor
 * @memberOf Hypergrid~
 * @private
 */
function Var() {
    this.gridRenderer = defaults.gridRenderer;
    this.rowHeaderCheckboxes = defaults.rowHeaderCheckboxes;
    this.rowHeaderNumbers = defaults.rowHeaderNumbers;
    this.gridBorder = defaults.gridBorder;
    this.gridBorderTop = defaults.gridBorderTop;
    this.gridBorderRight = defaults.gridBorderRight;
    this.gridBorderBottom = defaults.gridBorderBottom;
    this.gridBorderLeft = defaults.gridBorderLeft;
}

function findOrCreateContainer(boundingRect) {
    var div = document.getElementById('hypergrid'),
        used = div && !div.firstElementChild;

    if (!used) {
        div = document.createElement('div');
        setStyles(div, boundingRect, RECT_STYLES);
        document.body.appendChild(div);
    }

    return div;
}

function setStyles(el, style, keys) {
    if (style) {
        var elStyle = el.style;
        keys.forEach(function(key) {
            if (style[key] !== undefined) {
                elStyle[key] = style[key];
            }
        });
    }
}

function stringifyFunctions() {
    var self = this;
    return Object.keys(this).reduce(function(obj, key) {
        if (key !== 'toJSON') {
            obj[key] = /^function /.test(key)
                ? null // anon func: no point in saving because key itself is already the stringified function
                : self[key].toString() // stringify the function
                    .replace(/^function anonymous\(/, 'function(') // clean up Chromium artifact
                    .replace('\n/*``*/)', ')'); // clean up Chromium artifact
        }
        return obj;
    }, {});
}

function clone(value) {
    if (Array.isArray(value)) {
        return value.slice(); // clone array
    } else if (typeof value === 'object') {
        return Object.defineProperties({}, Object.getOwnPropertyDescriptors(value));
    } else {
        return value;
    }
}

function deepClone(object) {
    var result = clone(object);
    Object.keys(result).forEach(function(key) {
        var descriptor = Object.getOwnPropertyDescriptor(result, key);
        if (typeof descriptor.value === 'object') {
            result[key] = deepClone(descriptor.value);
        }
    });
    return result;
}

function createCellEditor(name, props) {
    var CellEditor = cellEditors.get(name);
    if (CellEditor) {
        return new CellEditor(this, props);
    }
}

/**
 * @name plugins
 * @memberOf Hypergrid
 * @type {object}
 * @summary Hash of references to shared plug-ins.
 * @desc Dictionary of shared (pre-installed) plug-ins. Used internally, primarily to avoid reinstallations. See examples for how to reference (albeit there is normally no need to reference plugins directly).
 *
 * For the dictionary of _instance_ plugins, see {@link Hypergrid#plugins|plugins} (defined in the {@link Hypergrid#intialize|Hypergrid constructor}).
 *
 * To force reinstallation of a shared plugin delete it first:
 * ```javascript
 * delete Hypergrid.plugins.mySharedPlugin;
 * ```
 * To force reinstallation of all shared plugins:
 * ```javascript
 * Hypergrid.plugins = {};
 * ```
 * @example
 * var allSharedPlugins = Hypergrid.plugins;
 * var mySharedPlugin = Hypergrid.plugins.mySharedPlugin;
 */
Hypergrid.plugins = {};

/**
 * @name localization
 * @memberOf Hypergrid
 * @type {object}
 * @summary Shared localization defaults for all grid instances.
 * @desc These property values are overridden by those supplied in the `Hypergrid` constructor's `options.localization`.
 * @property {string|string[]} [locale] - The default locale to use when an explicit `locale` is omitted from localizer constructor calls. Passed to Intl.NumberFormat` and `Intl.DateFormat`. See {@ https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation|Locale identification and negotiation} for more information. Omitting will use the runtime's local language and region.
 * @property {object} [numberOptions] - Options passed to `Intl.NumberFormat` for creating the basic "number" localizer.
 * @property {object} [dateOptions] - Options passed to `Intl.DateFormat` for creating the basic "date" localizer.
 */
Hypergrid.localization = {
    locale: 'en-US',
    numberOptions: { maximumFractionDigits: 0 }
};


// mix in the mixins

Hypergrid.mixIn = Hypergrid.prototype.mixIn;
Hypergrid.mixIn(require('./themes').sharedMixin);

Hypergrid.prototype.mixIn(require('./themes').mixin);
Hypergrid.prototype.mixIn(require('./events').mixin);
Hypergrid.prototype.mixIn(require('./selection').mixin);
Hypergrid.prototype.mixIn(require('./scrolling').mixin);


// deprecated module access

function pleaseUse(requireString, module) {
    if (!pleaseUse.warned[requireString]) {
        var key = requireString.match(/\w+$/)[0];
        console.warn('Reference to ' + key + ' external module using' +
            ' `Hypergrid.' + key + '.` has been deprecated as of v3.0.0 in favor of' +
            ' `require(\'' + requireString + '\')` from within a Hypergrid Client Module' +
            ' (otherwise use `Hypergrid.require(...)`) and will be removed in a future release.' +
            ' See https://github.com/fin-hypergrid/core/wiki/Client-Modules#internal-modules.');
        pleaseUse.warned[requireString] = true;
    }
    return module;
}
pleaseUse.warned = {};


Object.defineProperties(Hypergrid, {
    Base: { get: function() { return pleaseUse('fin-hypergrid/src/Base', require('../Base')); } },
    images: { get: function() { return pleaseUse('fin-hypergrid/images', require('../../images')); } }
});


/**
 * @summary List of grid instances.
 * @desc Added in {@link Hypergrid constructor}; removed in {@link Hypergrid#terminate terminate()}.
 * Used in themes.js.
 * @type {Hypergrid[]}
 */
Hypergrid.grids = [];


/** @name defaults
 * @memberOf Hypergrid
 * @type {object}
 * @summary The `defaults` layer of the Hypergrid properties hierarchy.
 * @desc Default values for all Hypergrid properties, including grid-level properties and column property defaults.
 *
 * Synonym: `properties`
 * Properties are divided broadly into two categories:
 * * Style (a.k.a. "lnf" for "look'n'feel") properties
 * * All other properties.
 */
Hypergrid.defaults = Hypergrid.properties = defaults;


// Define modules namespace and install overridable external modules.
// Hypergrid core code references them via this object — rather than require() — where used.
// Note that `modules` also supports the Hypergrid Module Loader (included only with the build file).
Hypergrid.modules = modules;


module.exports = Hypergrid;

},{"../../css":8,"../../images":10,"../Base":12,"../behaviors/Behavior":19,"../behaviors/Local":25,"../cellEditors":38,"../cellRenderers":48,"../defaults":51,"../lib/Canvas":66,"../lib/Localization":68,"../lib/SelectionModel":70,"../lib/dynamicProperties":75,"../lib/polyfills":79,"../renderer":88,"./events":13,"./modules":15,"./scrolling":16,"./selection":17,"./themes":18,"inject-stylesheet-template":91,"object-iterators":94,"rectangular":99}],15:[function(require,module,exports){
'use strict';

/*
 * This module is the namespace of loaded external modules known to `Hypergrid.require`,
 * which may include loaded application modules, datasource modules, and plug-in modules.
 *
 * Applications can override the "overridable" modules. For example, to override `finbars` with
 * a compatible module (that conforms to the same interface), just assign it like so:
 * ```js
 * Hypergrid.modules.Scrollbar = myFinbarReplacement;
 * ```
 */

// overridable modules
// Hypergrid vectors through here for these modules
module.exports = {
    Scrollbar: require('finbars'),
    templater: require('mustache') // mustache interface: { render: function(template, context) }
};

// non-overridable modules
// Access via `Hypergrid.require`
// For users of pre-bundled build file (others should use `require`)
// These are NOT overridable so non-configurable, non-writable
Object.defineProperties(module.exports, {
    'datasaur-base': { value: require('datasaur-base') }, // may be removed in a future release
    'datasaur-local': { value: require('datasaur-local') }, // may be removed in a future release
    'extend-me': {value: require('extend-me') },
    'object-iterators': { value: require('object-iterators') },
    overrider: { value: require('overrider') },
    rectangular: { value: require('rectangular') },
    'sparse-boolean-array': { value: require('sparse-boolean-array') },
    synonomous: { value: require('synonomous') }
});

},{"datasaur-base":3,"datasaur-local":6,"extend-me":7,"finbars":90,"mustache":93,"object-iterators":94,"overrider":95,"rectangular":99,"sparse-boolean-array":100,"synonomous":101}],16:[function(require,module,exports){
'use strict';

var Scrollbar = require('./modules').Scrollbar;

/**
 * @summary Scrollbar support.
 * @desc Hypergrid/index.js mixes this module into its prototype.
 * @mixin
 */
exports.mixin = {

    /**
     * A float value between 0.0 - 1.0 of the vertical scroll position.
     * @type {number}
     * @memberOf Hypergrid#
     */
    vScrollValue: 0,

    /**
     * A float value between 0.0 - 1.0 of the horizontal scroll position.
     * @type {number}
     * @memberOf Hypergrid#
     */
    hScrollValue: 0,

    /**
     * @property {fin-vampire-bar} sbVScroller - An instance of {@link https://github.com/openfin/finbars|FinBar}.
     * @memberOf Hypergrid#
     */
    sbVScroller: null,

    /**
     * The previous value of sbVScrollVal.
     * @type {number}
     * @memberOf Hypergrid#
     */
    sbPrevVScrollValue: null,

    /**
     * The previous value of sbHScrollValue.
     * @type {number}
     * @memberOf Hypergrid#
     */
    sbPrevHScrollValue: null,

    scrollingNow: false,

    /**
     * @memberOf Hypergrid#
     * @summary Set for `scrollingNow` field.
     * @param {boolean} isItNow - The type of event we are interested in.
     */
    setScrollingNow: function(isItNow) {
        this.scrollingNow = isItNow;
    },

    /**
     * @memberOf Hypergrid#
     * @returns {boolean} The `scrollingNow` field.
     */
    isScrollingNow: function() {
        return this.scrollingNow;
    },

    /**
     * @memberOf Hypergrid#
     * @summary Scroll horizontal and vertically by the provided offsets.
     * @param {number} offsetX - Scroll in the x direction this much.
     * @param {number} offsetY - Scroll in the y direction this much.
     */
    scrollBy: function(offsetX, offsetY) {
        this.scrollHBy(offsetX);
        this.scrollVBy(offsetY);
    },

    /**
     * @memberOf Hypergrid#
     * @summary Scroll vertically by the provided offset.
     * @param {number} offsetY - Scroll in the y direction this much.
     */
    scrollVBy: function(offsetY) {
        var max = this.sbVScroller.range.max;
        var oldValue = this.getVScrollValue();
        var newValue = Math.min(max, Math.max(0, oldValue + offsetY));
        if (newValue !== oldValue) {
            this.setVScrollValue(newValue);
        }
    },

    /**
     * @memberOf Hypergrid#
     * @summary Scroll horizontally by the provided offset.
     * @param {number} offsetX - Scroll in the x direction this much.
     */
    scrollHBy: function(offsetX) {
        var max = this.sbHScroller.range.max;
        var oldValue = this.getHScrollValue();
        var newValue = Math.min(max, Math.max(0, oldValue + offsetX));
        if (newValue !== oldValue) {
            this.setHScrollValue(newValue);
        }
    },

    scrollToMakeVisible: function(c, r) {
        var delta,
            dw = this.renderer.dataWindow,
            fixedColumnCount = this.properties.fixedColumnCount,
            fixedRowCount = this.properties.fixedRowCount;

        // scroll only if target not in fixed columns
        if (c >= fixedColumnCount) {
            // target is to left of scrollable columns; negative delta scrolls left
            if ((delta = c - dw.origin.x) < 0) {
                this.sbHScroller.index += delta;

                // target is to right of scrollable columns; positive delta scrolls right
                // Note: The +1 forces right-most column to scroll left (just in case it was only partially in view)
            } else if ((c - dw.corner.x + 1) > 0) {
                this.sbHScroller.index = this.renderer.getMinimumLeftPositionToShowColumn(c);
            }
        }

        if (
            r >= fixedRowCount && // scroll only if target not in fixed rows
            (
                // target is above scrollable rows; negative delta scrolls up
                (delta = r - dw.origin.y) < 0 ||

                // target is below scrollable rows; positive delta scrolls down
                (delta = r - dw.corner.y) > 0
            )
        ) {
            this.sbVScroller.index += delta;
        }
    },

    selectCellAndScrollToMakeVisible: function(c, r) {
        this.scrollToMakeVisible(c, r);
        this.selectCell(c, r, true);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Set the vertical scroll value.
     * @param {number} newValue - The new scroll value.
     */
    setVScrollValue: function(y) {
        var self = this;
        y = Math.min(this.sbVScroller.range.max, Math.max(0, Math.round(y)));
        if (y !== this.vScrollValue) {
            this.behavior.setScrollPositionY(y);
            this.behavior.changed();
            var oldY = this.vScrollValue;
            this.vScrollValue = y;
            this.scrollValueChangedNotification();
            setTimeout(function() {
                // self.sbVRangeAdapter.subjectChanged();
                self.fireScrollEvent('fin-scroll-y', oldY, y);
            });
        }
    },

    /**
     * @memberOf Hypergrid#
     * @return {number} The vertical scroll value.
     */
    getVScrollValue: function() {
        return this.vScrollValue;
    },

    /**
     * @memberOf Hypergrid#
     * @desc Set the horizontal scroll value.
     * @param {number} newValue - The new scroll value.
     */
    setHScrollValue: function(x) {
        var self = this;
        x = Math.min(this.sbHScroller.range.max, Math.max(0, Math.round(x)));
        if (x !== this.hScrollValue) {
            this.behavior.setScrollPositionX(x);
            this.behavior.changed();
            var oldX = this.hScrollValue;
            this.hScrollValue = x;
            this.scrollValueChangedNotification();
            setTimeout(function() {
                //self.sbHRangeAdapter.subjectChanged();
                self.fireScrollEvent('fin-scroll-x', oldX, x);
                //self.synchronizeScrollingBoundries(); // todo: Commented off to prevent the grid from bouncing back, but there may be repercussions...
            });
        }
    },

    /**
     * @memberOf Hypergrid#
     * @returns The vertical scroll value.
     */
    getHScrollValue: function() {
        return this.hScrollValue;
    },

    /**
     * @memberOf Hypergrid#
     * @desc Initialize the scroll bars.
     */
    initScrollbars: function() {
        if (this.sbHScroller && this.sbVScroller){
            return;
        }

        var self = this;

        var horzBar = new Scrollbar({
            orientation: 'horizontal',
            onchange: self.setHScrollValue.bind(self),
            cssStylesheetReferenceElement: this.div
        });

        var vertBar = new Scrollbar({
            orientation: 'vertical',
            onchange: self.setVScrollValue.bind(self),
            paging: {
                up: self.pageUp.bind(self),
                down: self.pageDown.bind(self)
            }
        });

        this.sbHScroller = horzBar;
        this.sbVScroller = vertBar;

        var hPrefix = this.properties.hScrollbarClassPrefix;
        var vPrefix = this.properties.vScrollbarClassPrefix;

        if (hPrefix && hPrefix !== '') {
            this.sbHScroller.classPrefix = hPrefix;
        }

        if (vPrefix && vPrefix !== '') {
            this.sbVScroller.classPrefix = vPrefix;
        }

        this.div.appendChild(horzBar.bar);
        this.div.appendChild(vertBar.bar);

        this.resizeScrollbars();
    },

    resizeScrollbars: function() {
        this.sbHScroller.shortenBy(this.sbVScroller).resize();
        //this.sbVScroller.shortenBy(this.sbHScroller);
        this.sbVScroller.resize();
    },

    /**
     * @memberOf Hypergrid#
     * @desc Scroll values have changed, we've been notified.
     */
    setVScrollbarValues: function(max) {
        this.sbVScroller.range = {
            min: 0,
            max: max
        };
    },

    setHScrollbarValues: function(max) {
        this.sbHScroller.range = {
            min: 0,
            max: max
        };
    },

    scrollValueChangedNotification: function() {
        if (
            this.hScrollValue !== this.sbPrevHScrollValue ||
            this.vScrollValue !== this.sbPrevVScrollValue
        ) {
            this.sbPrevHScrollValue = this.hScrollValue;
            this.sbPrevVScrollValue = this.vScrollValue;

            if (this.cellEditor) {
                this.cellEditor.scrollValueChangedNotification();
            }

            this.computeCellsBounds();
        }
    },

    /**
     * @memberOf Hypergrid#
     * @desc The data dimensions have changed, or our pixel boundaries have changed.
     * Adjust the scrollbar properties as necessary.
     */
    synchronizeScrollingBoundaries: function() {
        var numFixedColumns = this.getFixedColumnCount();

        var numColumns = this.getColumnCount();
        var numRows = this.getRowCount();

        var bounds = this.getBounds();
        if (!bounds) {
            return;
        }

        var scrollableWidth = bounds.width - this.behavior.getFixedColumnsMaxWidth();
        for (
            var columnsWidth = 0, lastPageColumnCount = 0;
            lastPageColumnCount < numColumns && columnsWidth < scrollableWidth;
            lastPageColumnCount++
        ) {
            columnsWidth += this.getColumnWidth(numColumns - lastPageColumnCount - 1);
        }
        if (columnsWidth > scrollableWidth) {
            lastPageColumnCount--;
        }

        var scrollableHeight = this.renderer.getVisibleScrollHeight();
        for (
            var rowsHeight = 0, lastPageRowCount = 0;
            lastPageRowCount < numRows && rowsHeight < scrollableHeight;
            lastPageRowCount++
        ) {
            rowsHeight += this.getRowHeight(numRows - lastPageRowCount - 1);
        }
        if (rowsHeight > scrollableHeight) {
            lastPageRowCount--;
        }

        // inform scroll bars
        if (this.sbHScroller) {
            var hMax = Math.max(0, numColumns - numFixedColumns - lastPageColumnCount);
            this.setHScrollbarValues(hMax);
            this.setHScrollValue(Math.min(this.getHScrollValue(), hMax));
        }
        if (this.sbVScroller) {
            var vMax = Math.max(0, numRows - this.properties.fixedRowCount - lastPageRowCount);
            this.setVScrollbarValues(vMax);
            this.setVScrollValue(Math.min(this.getVScrollValue(), vMax));
        }

        this.computeCellsBounds();

        // schedule to happen *after* the repaint
        setTimeout(this.resizeScrollbars.bind(this));
    },

    /**
     * @memberOf Hypergrid#
     * @desc Scroll up one full page.
     * @returns {number}
     */
    pageUp: function() {
        var rowNum = this.renderer.getPageUpRow();
        this.setVScrollValue(rowNum);
        return rowNum;
    },

    /**
     * @memberOf Hypergrid#
     * @desc Scroll down one full page.
     * @returns {number}
     */
    pageDown: function() {
        var rowNum = this.renderer.getPageDownRow();
        this.setVScrollValue(rowNum);
        return rowNum;
    },

    /**
     * @memberOf Hypergrid#
     * @desc Not yet implemented.
     */
    pageLeft: function() {
        throw 'page left not yet implemented';
    },

    /**
     * @memberOf Hypergrid#
     * @desc Not yet implemented.
     */
    pageRight: function() {
        throw 'page right not yet implemented';
    }
};

},{"./modules":15}],17:[function(require,module,exports){
/* eslint-env browser */

'use strict';

var Rectangle = require('rectangular').Rectangle;

/**
 * Hypergrid/index.js mixes this module into its prototype.
 * @mixin
 */
exports.mixin = {
    selectionInitialize: function() {
        var grid = this;

        /** for use by fin-selection-changed, fin-row-selection-changed, fin-column-selection-changed
         * @memberOf Hypergrid#
         * @private
         */
        this.selectionDetailGetters = {
            get rows() { return grid.getSelectedRows(); },
            get columns() { return grid.getSelectedColumns(); },
            get selections() { return grid.selectionModel.getSelections(); }
        };

        /**
         * for use by fin-context-menu, fin-mouseup, fin-mousedown
         * @memberOf Hypergrid#
         * @private
         */
        this.selectionDetailGetterDescriptors = Object.getOwnPropertyDescriptors(this.selectionDetailGetters);
    },

    /**
     * @memberOf Hypergrid#
     * @returns {boolean} We have any selections.
     */
    hasSelections: function() {
        if (!this.getSelectionModel) {
            return; // were not fully initialized yet
        }
        return this.selectionModel.hasSelections();
    },

    /**
     * @memberOf Hypergrid#
     * @returns {string} Tab separated value string from the selection and our data.
     */
    getSelectionAsTSV: function() {
        var sm = this.selectionModel;
        if (sm.hasSelections()) {
            var selections = this.getSelectionMatrix();
            selections = selections[selections.length - 1];
            return this.getMatrixSelectionAsTSV(selections);
        } else if (sm.hasRowSelections()) {
            return this.getMatrixSelectionAsTSV(this.getRowSelectionMatrix());
        } else if (sm.hasColumnSelections()) {
            return this.getMatrixSelectionAsTSV(this.getColumnSelectionMatrix());
        }
    },

    getMatrixSelectionAsTSV: function(selections) {
        var result = '';

        //only use the data from the last selection
        if (selections.length) {
            var width = selections.length,
                height = selections[0].length,
                area = width * height,
                lastCol = width - 1,
                //Whitespace will only be added on non-singular rows, selections
                whiteSpaceDelimiterForRow = (height > 1 ? '\n' : '');

            //disallow if selection is too big
            if (area > 20000) {
                alert('selection size is too big to copy to the paste buffer'); // eslint-disable-line no-alert
                return '';
            }

            for (var h = 0; h < height; h++) {
                for (var w = 0; w < width; w++) {
                    result += selections[w][h] + (w < lastCol ? '\t' : whiteSpaceDelimiterForRow);
                }
            }
        }

        return result;
    },

    /**
     * @memberOf Hypergrid#
     * @desc Clear all the selections.
     */
    clearSelections: function() {
        var keepRowSelections = this.properties.checkboxOnlyRowSelections;
        this.selectionModel.clear(keepRowSelections);
        this.clearMouseDown();
    },

    /**
     * @memberOf Hypergrid#
     * @desc Clear the most recent selection.
     */
    clearMostRecentSelection: function() {
        var keepRowSelections = this.properties.checkboxOnlyRowSelections;
        this.selectionModel.clearMostRecentSelection(keepRowSelections);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Clear the most recent column selection.
     */
    clearMostRecentColumnSelection: function() {
        this.selectionModel.clearMostRecentColumnSelection();
    },

    /**
     * @memberOf Hypergrid#
     * @desc Clear the most recent row selection.
     */
    clearMostRecentRowSelection: function() {
        //this.selectionModel.clearMostRecentRowSelection(); // commented off as per GRID-112
    },

    clearRowSelection: function() {
        this.selectionModel.clearRowSelection();
    },

    /**
     * @memberOf Hypergrid#
     * @summary Select given region.
     * @param {number} ox - origin x
     * @param {number} oy - origin y
     * @param {number} ex - extent x
     * @param {number} ex - extent y
     */
    select: function(ox, oy, ex, ey) {
        if (ox < 0 || oy < 0) {
            //we don't select negative area
            //also this means there is no origin mouse down for a selection rect
            return;
        }
        this.selectionModel.select(ox, oy, ex, ey);
    },

    /**
     * @memberOf Hypergrid#
     * @returns {boolean} Given point is selected.
     * @param {number} x - The horizontal coordinate.
     * @param {number} y - The vertical coordinate.
     */
    isSelected: function(x, y) {
        return this.selectionModel.isSelected(x, y);
    },

    /**
     * @memberOf Hypergrid#
     * @returns {boolean} The given column is selected anywhere in the entire table.
     * @param {number} y - The row index.
     */
    isCellSelectedInRow: function(y) {
        return this.selectionModel.isCellSelectedInRow(y);
    },

    /**
     * @memberOf Hypergrid#
     * @returns {boolean} The given row is selected anywhere in the entire table.
     * @param {number} x - The column index.
     */
    isCellSelectedInColumn: function(x) {
        return this.selectionModel.isCellSelectedInColumn(x);
    },

    /**
     * @param {boolean|number[]|string[]} [hiddenColumns=false] - _Per {@link Hypergrid~getColumns}._
     * @returns {{}}
     * @memberOf Hypergrid#
     */
    getRowSelection: function(hiddenColumns) {
        var dataModel = this.behavior.dataModel,
            selectedRowIndexes = this.selectionModel.getSelectedRows(),
            columns = getColumns.call(this, hiddenColumns),
            result = {};

        for (var c = 0, C = columns.length; c < C; c++) {
            var column = columns[c],
                rows = result[column.name] = new Array(selectedRowIndexes.length);
            selectedRowIndexes.forEach(getValue);
        }

        function getValue(selectedRowIndex, j) {
            var dataRow = dataModel.getRow(selectedRowIndex);
            rows[j] = valOrFunc(dataRow, column);
        }

        return result;
    },

    /**
     * @param {boolean|number[]|string[]} [hiddenColumns=false] - _Per {@link Hypergrid~getColumns}._
     * @returns {Array}
     * @memberOf Hypergrid#
     */
    getRowSelectionMatrix: function(hiddenColumns) {
        var dataModel = this.behavior.dataModel,
            selectedRowIndexes = this.selectionModel.getSelectedRows(),
            columns = getColumns.call(this, hiddenColumns),
            result = new Array(columns.length);

        for (var c = 0, C = columns.length; c < C; c++) {
            var column = columns[c];
            result[c] = new Array(selectedRowIndexes.length);
            selectedRowIndexes.forEach(getValue);
        }

        function getValue(selectedRowIndex, r) {
            var dataRow = dataModel.getRow(selectedRowIndex);
            result[c][r] = valOrFunc(dataRow, column);
        }

        return result;
    },

    getColumnSelectionMatrix: function() {
        var behavior = this.behavior,
            dataModel = behavior.dataModel,
            headerRowCount = this.getHeaderRowCount(),
            selectedColumnIndexes = this.getSelectedColumns(),
            numRows = this.getRowCount(),
            result = new Array(selectedColumnIndexes.length);

        selectedColumnIndexes.forEach(function(selectedColumnIndex, c) {
            var column = behavior.getActiveColumn(selectedColumnIndex),
                values = result[c] = new Array(numRows);

            for (var r = headerRowCount; r < numRows; r++) {
                var dataRow = dataModel.getRow(r);
                values[r] = valOrFunc(dataRow, column);
            }
        });

        return result;
    },

    getColumnSelection: function() {
        var behavior = this.behavior,
            dataModel = behavior.dataModel,
            headerRowCount = this.getHeaderRowCount(),
            selectedColumnIndexes = this.getSelectedColumns(),
            result = {},
            rowCount = this.getRowCount();

        selectedColumnIndexes.forEach(function(selectedColumnIndex) {
            var column = behavior.getActiveColumn(selectedColumnIndex),
                values = result[column.name] = new Array(rowCount);

            for (var r = headerRowCount; r < rowCount; r++) {
                var dataRow = dataModel.getRow(r);
                values[r] = valOrFunc(dataRow, column);
            }
        });

        return result;
    },

    getSelection: function() {
        var behavior = this.behavior,
            dataModel = behavior.dataModel,
            selections = this.getSelections(),
            rects = new Array(selections.length);

        selections.forEach(getRect);

        function getRect(selectionRect, i) {
            var rect = normalizeRect(selectionRect),
                colCount = rect.extent.x + 1,
                rowCount = rect.extent.y + 1,
                columns = {};

            for (var c = 0, x = rect.origin.x; c < colCount; c++, x++) {
                var column = behavior.getActiveColumn(x),
                    values = columns[column.name] = new Array(rowCount);

                for (var r = 0, y = rect.origin.y; r < rowCount; r++, y++) {
                    var dataRow = dataModel.getRow(y);
                    values[r] = valOrFunc(dataRow, column);
                }
            }

            rects[i] = columns;
        }

        return rects;
    },

    getSelectionMatrix: function() {
        var behavior = this.behavior,
            dataModel = behavior.dataModel,
            selections = this.getSelections(),
            rects = new Array(selections.length);

        selections.forEach(getRect);

        function getRect(selectionRect, i) {
            var rect = normalizeRect(selectionRect),
                colCount = rect.extent.x + 1,
                rowCount = rect.extent.y + 1,
                rows = [];

            for (var c = 0, x = rect.origin.x; c < colCount; c++, x++) {
                var values = rows[c] = new Array(rowCount),
                    column = behavior.getActiveColumn(x);

                for (var r = 0, y = rect.origin.y; r < rowCount; r++, y++) {
                    var dataRow = dataModel.getRow(y);
                    values[r] = valOrFunc(dataRow, column);
                }
            }

            rects[i] = rows;
        }

        return rects;
    },

    selectCell: function(x, y, silent) {
        var keepRowSelections = this.properties.checkboxOnlyRowSelections;
        this.selectionModel.clear(keepRowSelections);
        this.selectionModel.select(x, y, 0, 0, silent);
    },

    toggleSelectColumn: function(x, keys) {
        keys = keys || [];
        var model = this.selectionModel;
        var alreadySelected = model.isColumnSelected(x);
        var hasCTRL = keys.indexOf('CTRL') > -1;
        var hasSHIFT = keys.indexOf('SHIFT') > -1;
        if (!hasCTRL && !hasSHIFT) {
            model.clear();
            if (!alreadySelected) {
                model.selectColumn(x);
            }
        } else {
            if (hasCTRL) {
                if (alreadySelected) {
                    model.deselectColumn(x);
                } else {
                    model.selectColumn(x);
                }
            }
            if (hasSHIFT) {
                model.clear();
                model.selectColumn(this.lastEdgeSelection[0], x);
            }
        }
        if (!alreadySelected && !hasSHIFT) {
            this.lastEdgeSelection[0] = x;
        }
        this.repaint();
        this.fireSyntheticColumnSelectionChangedEvent();
    },

    toggleSelectRow: function(y, keys) {
        //we can select the totals rows if they exist, but not rows above that
        keys = keys || [];

        var sm = this.selectionModel;
        var alreadySelected = sm.isRowSelected(y);
        var hasSHIFT = keys.indexOf('SHIFT') >= 0;

        if (alreadySelected) {
            sm.deselectRow(y);
        } else {
            this.singleSelect();
            sm.selectRow(y);
        }

        if (hasSHIFT) {
            sm.clear();
            sm.selectRow(this.lastEdgeSelection[1], y);
        }

        if (!alreadySelected && !hasSHIFT) {
            this.lastEdgeSelection[1] = y;
        }

        this.repaint();
    },

    singleSelect: function() {
        var result = this.properties.singleRowSelectionMode;

        if (result) {
            this.selectionModel.clearRowSelection();
        }

        return result;
    },

    selectViewportCell: function(x, y) {
        var vc, vr;
        if (
            this.getRowCount() &&
            (vc = this.renderer.visibleColumns[x]) &&
            (vr = this.renderer.visibleRows[y + this.getHeaderRowCount()])
        ) {
            x = vc.columnIndex;
            y = vr.rowIndex;
            this.clearSelections();
            this.select(x, y, 0, 0);
            this.setMouseDown(this.newPoint(x, y));
            this.setDragExtent(this.newPoint(0, 0));
            this.repaint();
        }
    },

    selectToViewportCell: function(x, y) {
        var selections, vc, vr;
        if (
            (selections = this.getSelections()) && selections.length &&
            (vc = this.renderer.visibleColumns[x]) &&
            (vr = this.renderer.visibleRows[y + this.getHeaderRowCount()])
        ) {
            var origin = selections[0].origin;
            x = vc.columnIndex;
            y = vr.rowIndex;
            this.setDragExtent(this.newPoint(x - origin.x, y - origin.y));
            this.select(origin.x, origin.y, x - origin.x, y - origin.y);
            this.repaint();
        }
    },

    selectToFinalCellOfCurrentRow: function() {
        this.selectFinalCellOfCurrentRow(true);
    },

    selectFinalCellOfCurrentRow: function(to) {
        if (!this.getRowCount()) {
            return;
        }
        var selections = this.getSelections();
        if (selections && selections.length) {
            var selection = selections[0],
                origin = selection.origin,
                extent = selection.extent,
                columnCount = this.getColumnCount();

            this.scrollBy(columnCount, 0);

            this.clearSelections();
            if (to) {
                this.select(origin.x, origin.y, columnCount - origin.x - 1, extent.y);
            } else {
                this.select(columnCount - 1, origin.y, 0, 0);
            }

            this.repaint();
        }
    },

    selectToFirstCellOfCurrentRow: function() {
        this.selectFirstCellOfCurrentRow(true);
    },

    selectFirstCellOfCurrentRow: function(to) {
        if (!this.getRowCount()) {
            return;
        }
        var selections = this.getSelections();
        if (selections && selections.length) {
            var selection = selections[0],
                origin = selection.origin,
                extent = selection.extent;

            this.clearSelections();
            if (to) {
                this.select(origin.x, origin.y, -origin.x, extent.y);
            } else {
                this.select(0, origin.y, 0, 0);
            }

            this.setHScrollValue(0);
            this.repaint();
        }
    },

    selectFinalCell: function() {
        if (!this.getRowCount()) {
            return;
        }
        this.selectCellAndScrollToMakeVisible(this.getColumnCount() - 1, this.getRowCount() - 1);
        this.repaint();
    },

    selectToFinalCell: function() {
        if (!this.getRowCount()) {
            return;
        }
        var selections = this.getSelections();
        if (selections && selections.length) {
            var selection = selections[0],
                origin = selection.origin,
                columnCount = this.getColumnCount(),
                rowCount = this.getRowCount();

            this.clearSelections();
            this.select(origin.x, origin.y, columnCount - origin.x - 1, rowCount - origin.y - 1);
            // this.scrollBy(columnCount, rowCount);
            this.repaint();
        }
    },

    /**
     * @memberOf Hypergrid#
     * @returns {object} An object that represents the currently selection row.
     */
    getSelectedRow: function() {
        var sels = this.selectionModel.getSelections();
        if (sels.length) {
            var behavior = this.behavior,
                colCount = this.getColumnCount(),
                topRow = sels[0].origin.y,
                row = {
                    //hierarchy: behavior.getFixedColumnValue(0, topRow)
                };

            for (var c = 0; c < colCount; c++) {
                row[behavior.getActiveColumn(c).header] = behavior.getValue(c, topRow);
            }

            return row;
        }
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and dispatch a `fin-selection-changed` event.
     */
    selectionChanged: function() {
        // Project the cell selection into the rows
        this.selectRowsFromCells();

        // Project the cell selection into the columns
        this.selectColumnsFromCells();

        var selectionEvent = new CustomEvent('fin-selection-changed', {
            detail: this.selectionDetailGetters
        });
        this.canvas.dispatchEvent(selectionEvent);
    },

    isColumnOrRowSelected: function() {
        return this.selectionModel.isColumnOrRowSelected();
    },
    selectColumn: function(x1, x2) {
        this.selectionModel.selectColumn(x1, x2);
    },
    selectRow: function(y1, y2) {
        var sm = this.selectionModel;

        if (this.singleSelect()) {
            y1 = y2;
        } else {
            // multiple row selection
            y2 = y2 || y1;
        }

        sm.selectRow(Math.min(y1, y2), Math.max(y1, y2));
    },

    selectRowsFromCells: function() {
        if (!this.properties.checkboxOnlyRowSelections && this.properties.autoSelectRows) {
            var last;

            if (!this.properties.singleRowSelectionMode) {
                this.selectionModel.selectRowsFromCells(0, true);
            } else if ((last = this.selectionModel.getLastSelection())) {
                this.selectRow(null, last.corner.y);
            } else {
                this.clearRowSelection();
            }
            this.fireSyntheticRowSelectionChangedEvent();
        }
    },
    selectColumnsFromCells: function() {
        if (this.properties.autoSelectColumns) {
            this.selectionModel.selectColumnsFromCells();
        }
    },
    getSelectedRows: function() {
        return this.behavior.getSelectedRows();
    },
    getSelectedColumns: function() {
        return this.behavior.getSelectedColumns();
    },
    getSelections: function() {
        return this.behavior.getSelections();
    },
    getLastSelectionType: function() {
        return this.selectionModel.getLastSelectionType();
    },
    isInCurrentSelectionRectangle: function(x, y) {
        return this.selectionModel.isInCurrentSelectionRectangle(x, y);
    },
    selectAllRows: function() {
        this.selectionModel.selectAllRows();
    },
    areAllRowsSelected: function() {
        return this.selectionModel.areAllRowsSelected();
    },
    toggleSelectAllRows: function() {
        if (this.areAllRowsSelected()) {
            this.selectionModel.clear();
        } else {
            this.selectAllRows();
        }
        this.repaint();
    },

    /**
     * @summary Move cell selection by offset.
     * @desc Replace the most recent selection with a single cell selection that is moved (offsetX,offsetY) from the previous selection extent.
     * @param {number} offsetX - x offset
     * @param {number} offsetY - y offset
     * @memberOf Hypergrid#
     */
    moveSingleSelect: function(offsetX, offsetY) {
        var mouseCorner = this.getMouseDown().plus(this.getDragExtent());
        this.moveToSingleSelect(
            mouseCorner.x + offsetX,
            mouseCorner.y + offsetY
        );
    },

    /**
     * @summary Move cell selection by offset.
     * @desc Replace the most recent selection with a single cell selection that is moved (offsetX,offsetY) from the previous selection extent.
     * @param {number} newX - x coordinate to start at
     * @param {number} newY - y coordinate to start at
     * @memberOf Hypergrid#
     */
    moveToSingleSelect: function(newX, newY) {
        var maxColumns = this.getColumnCount() - 1,
            maxRows = this.getRowCount() - 1,

            maxViewableColumns = this.getVisibleColumnsCount() - 1,
            maxViewableRows = this.getVisibleRowsCount() - 1;

        if (!this.properties.scrollingEnabled) {
            maxColumns = Math.min(maxColumns, maxViewableColumns);
            maxRows = Math.min(maxRows, maxViewableRows);
        }

        newX = Math.min(maxColumns, Math.max(0, newX));
        newY = Math.min(maxRows, Math.max(0, newY));

        this.clearSelections();
        this.select(newX, newY, 0, 0);
        this.setMouseDown(this.newPoint(newX, newY));
        this.setDragExtent(this.newPoint(0, 0));

        this.selectCellAndScrollToMakeVisible(newX, newY);

        this.repaint();
    },

    /** @summary Extend cell selection by offset.
     * @desc Augment the most recent selection extent by (offsetX,offsetY) and scroll if necessary.
     * @param {number} offsetX - x coordinate to start at
     * @param {number} offsetY - y coordinate to start at
     * @memberOf Hypergrid#
     */
    extendSelect: function(offsetX, offsetY) {
        var maxColumns = this.getColumnCount() - 1,
            maxRows = this.getRowCount() - 1,

            maxViewableColumns = this.renderer.visibleColumns.length - 1,
            maxViewableRows = this.renderer.visibleRows.length - 1,

            origin = this.getMouseDown(),
            extent = this.getDragExtent(),

            newX = extent.x + offsetX,
            newY = extent.y + offsetY;

        if (!this.properties.scrollingEnabled) {
            maxColumns = Math.min(maxColumns, maxViewableColumns);
            maxRows = Math.min(maxRows, maxViewableRows);
        }

        newX = Math.min(maxColumns - origin.x, Math.max(-origin.x, newX));
        newY = Math.min(maxRows - origin.y, Math.max(-origin.y, newY));

        this.clearMostRecentSelection();

        this.select(origin.x, origin.y, newX, newY);
        this.setDragExtent(this.newPoint(newX, newY));

        var colScrolled = this.insureModelColIsVisible(newX + origin.x, offsetX),
            rowScrolled = this.insureModelRowIsVisible(newY + origin.y, offsetY);

        this.repaint();

        return colScrolled || rowScrolled;
    },

    /**
     * @returns {undefined|CellEvent}
     * @param {boolean} [useAllCells] - Search in all rows and columns instead of only rendered ones.
     * @memberOf Hypergrid#
     */
    getGridCellFromLastSelection: function(useAllCells) {
        var sel = this.selectionModel.getLastSelection();
        return sel && (new this.behavior.CellEvent).resetGridXDataY(sel.origin.x, sel.origin.y, null, useAllCells);
    }
};

/**
 * @param {boolean|number[]|string[]} [hiddenColumns=false] - One of:
 * `false` - Active column list
 * `true` - All column list
 * `Array` - Active column list with listed columns prefixed as needed (when not already in the list). Each item in the array may be either:
 * * `number` - index into all column list
 * * `string` - name of a column from the all column list
 * @returns {Column[]}
 * @memberOf Hypergrid~
 */
function getColumns(hiddenColumns) {
    var columns,
        allColumns = this.behavior.getColumns(),
        activeColumns = this.behavior.getActiveColumns();

    if (Array.isArray(hiddenColumns)) {
        columns = [];
        hiddenColumns.forEach(function(index) {
            var key = typeof index === 'number' ? 'index' : 'name',
                column = allColumns.find(function(column) { return column[key] === index; });
            if (activeColumns.indexOf(column) < 0) {
                columns.push(column);
            }
        });
        columns = columns.concat(activeColumns);
    } else {
        columns = hiddenColumns ? allColumns : activeColumns;
    }

    return columns;
}

function normalizeRect(rect) {
    var o = rect.origin,
        c = rect.corner,

        ox = Math.min(o.x, c.x),
        oy = Math.min(o.y, c.y),

        cx = Math.max(o.x, c.x),
        cy = Math.max(o.y, c.y);

    return new Rectangle(ox, oy, cx - ox, cy - oy);
}

/**
 * @this {dataRowObject}
 * @param column
 * @returns {string}
 */
function valOrFunc(dataRow, column) {
    var result, calculator;
    if (dataRow) {
        result = dataRow[column.name];
        calculator = (typeof result)[0] === 'f' && result || column.calculator;
        if (calculator) {
            result = calculator(dataRow, column.name);
        }
    }
    return result || result === 0 || result === false ? result : '';
}

},{"rectangular":99}],18:[function(require,module,exports){
'use strict';

// This file creates the Hypergrid theme registry, exposed via:
// shared methods `Hypergrid.registerTheme` and `Hypergrid.applyTheme`
// and instance methods `myGrid.applyTheme`.
// The initial registry consists of a single theme ('default').
// Application developers can add additional themes to this registry.

var _ = require('object-iterators'); // fyi: installs the Array.prototype.find polyfill, as needed

var defaults = require('../defaults');
var dynamicPropertyDescriptors = require('../lib/dynamicProperties');
var HypergridError = require('../lib/error');

var styles = [
    'BackgroundColor',
    'Color',
    'Font'
];

var stylesWithHalign = styles.concat([
    'Halign'
]);

var dataCellStyles = stylesWithHalign.concat([
    'cellPadding',
    'iconPadding'
]);

var stylers = [
    { prefix: '',                                props: dataCellStyles },
    { prefix: 'foregroundSelection',             props: styles },
    { prefix: 'columnHeader',                    props: stylesWithHalign },
    { prefix: 'columnHeaderForegroundSelection', props: styles },
    { prefix: 'rowHeader',                       props: styles },
    { prefix: 'rowHeaderForegroundSelection',    props: styles }
];

var dynamicCosmetics = {
    rowHeaderCheckboxes: defaults.rowHeaderCheckboxes,
    rowHeaderNumbers: defaults.rowHeaderNumbers,
    gridBorder: defaults.gridBorder,
    gridBorderTop: defaults.gridBorderTop,
    gridBorderRight: defaults.gridBorderRight,
    gridBorderBottom: defaults.gridBorderBottom,
    gridBorderLeft: defaults.gridBorderLeft,
    gridRenderer: defaults.gridRenderer
};

// Create the `defaultTheme` theme by copying over the theme props,
// which is a subset of all the props defined in defaults.js, beginning with
// they dynamic cosmetics and `themeName`...
var defaultTheme = Object.assign({}, dynamicCosmetics, {
    themeName: defaults.themeName
});

// ...and then adding non-dynamic cosmetics into `defaultTheme`, by combining the above
// prefixes with their styles to get prop names and then copy those props from `defaults`.
stylers.reduce(function(theme, styler) {
    return styler.props.reduce(function(theme, prop) {
        prop = styler.prefix + prop;
        prop = prop.replace('ForegroundSelectionBackground', 'BackgroundSelection'); // unfortunate!
        prop = prop[0].toLowerCase() + prop.substr(1);
        theme[prop] = defaults[prop];
        return theme;
    }, theme);
}, defaultTheme);

/**
 * @summary The Hypergrid theme registry.
 * @desc The standard registry consists of a single theme, `default`, built from values in defaults.js.
 */
var registry = Object.create(null, {
    default: { value: defaultTheme }
});
var pseudopropAdvice = {
    showRowNumbers: 'rowHeaderCheckboxes and rowHeaderNumbers',
    lineColor: 'gridLinesHColor and gridLinesVColor',
    lineWidth: 'gridLinesHWidth and gridLinesVWidth',
    gridBorder: 'gridBorderLeft, gridBorderRight, gridBorderTop, and gridBorderBottom'
};

function applyTheme(theme) {
    var themeLayer, grids, props;

    if (theme && typeof theme === 'object' && !Object.getOwnPropertyNames(theme).length) {
        theme = null;
    }

    if (this._theme) {
        grids = [this];
        themeLayer = this._theme;
        props = this.properties;

        // If removing theme, reset props to defaults
        if (!theme) {
            // Delete (non-dynamic) grid props named in this theme, revealing defaults
            Object.keys(themeLayer).forEach(function(key) {
                if (!(key in dynamicPropertyDescriptors)) {
                    delete props[key];
                }
            });

            // Reset dynamic cosmetic props to defaults
            Object.keys(dynamicCosmetics).forEach(function(key) {
                props.var[key] = defaults[key];
            });
        }

        // Delete all own props from this grid instance's theme layer (defined by an eariler call)
        Object.keys(themeLayer).forEach(function(key) {
            delete themeLayer[key];
        });
    } else {
        grids = this.grids;
        themeLayer = defaults; // global theme layer
        theme = theme || 'default';
    }

    if (typeof theme === 'string') {
        if (!registry[theme]) {
            throw new HypergridError('Unknown theme "' + theme + '"');
        }
        theme = registry[theme];
    }

    if (theme) {
        // When no theme name, set it to explicit `undefined` (to mask defaults.themeName).
        if (!theme.themeName) {
            theme.themeName = undefined;
        }

        Object.keys(theme).forEach(function(key) {
            if (key in dynamicPropertyDescriptors) {
                if (key in dynamicCosmetics) {
                    grids.forEach(function(grid) {
                        grid.properties[key] = theme[key];
                    });
                } else {
                    // Dynamic properties are defined on properties layer; defining these
                    // r-values on the theme layer is ineffective so let's not allow it.
                    var message = pseudopropAdvice[key];
                    message = message
                        ? 'Ignoring unexpected pseudo-prop ' + key + ' in theme object. Use actual props ' + message + ' instead.'
                        : 'Ignoring invalid property ' + key + ' in theme object.';
                    console.warn(message);
                    delete theme[key];
                }
            }
        });

        // No .assign() because themeName is read-only in defaults layer
        Object.defineProperties(themeLayer, Object.getOwnPropertyDescriptors(theme));
    }

    grids.forEach(function(grid) {
        grid.repaint();
    });
}


/**
 * @summary Instance theme support.
 * @desc Hypergrid/index.js mixes this module into its prototype.
 * @mixin
 */
var mixin = {
    initThemeLayer: function() {
        /**
         * Descends from {@link module:defaults|defaults}.
         * @memberOf Hypergrid#
         * @private
         */
        this._theme = Object.create(defaults);

        return Object.create(this._theme, dynamicPropertyDescriptors);
    },

    /**
     * @summary Apply a grid theme.
     * @desc Apply props from the given theme object to the grid instance,
     * the instance's `myGrid.themeLayer` layer in the properties hierarchy.
     * @this {Hypergrid}
     * @param {object|string} [theme] - One of:
     * * **string:** A registered theme name.
     * * **object:** A unregistered (anonymous) theme object. Empty object removes grid theme, exposing global theme.
     * * _falsy value:_ Also removes grid theme.
     * @param {string|undefined} [theme.themeName=undefined]
     * @memberOf Hypergrid#
     */
    applyTheme: applyTheme,

    /**
     * @summary Get currently active theme.
     * @desc May return a theme name or a theme object.
     * @returns {string|undefined|object} One of:
     * * **string:** Theme name (registered theme).
     * * **object:** Theme object (unregistered anonymous theme).
     * * **undefined:** No theme (i.e., the default theme).
     * @memberOf Hypergrid#
     */
    getTheme: function() {
        var themeLayer = this._theme,
            themeName = themeLayer.themeName;
        return themeName === 'default' || !Object.getOwnPropertyNames(themeLayer).length
            ? undefined // default theme or no theme
            : themeName in registry
                ? themeName // registered theme name
                : themeLayer; // unregistered theme object
    }
};
Object.defineProperty(mixin, 'theme', {
    enumerable: true,
    set: mixin.applyTheme,
    get: mixin.getTheme
});


/**
 * @summary Theme registration and global theme support.
 * @desc Hypergrid/index.js mixes this module into its "shared namespace" (_i.e.,_ as properties of the constructor).
 * @mixin
 */
var sharedMixin = {
    /**
     * @param {string} [name] - A registry name for the new theme. May be omitted if the theme has an embedded name (in `theme.themeName`).
     * _If omitted, the 2nd parameter (`theme`) is promoted to first position._
     * @param {HypergridThemeObject} [theme]
     * To build a Hypergrid theme object from a loaded {@link https://polymerthemes.com Polymer Theme} CSS stylesheet:
     * ```javascript
     * var myTheme = require('fin-hypergrid-themes').buildTheme();
     * ```
     * If omitted, the theme named in the first parameter is unregistered.
     * Grid instances that have previously applied the named theme are unaffected by this action (whether re-registering or unregistering).
     * @this {Hypergrid.constructor}
     * @memberOf Hypergrid.
     */
    registerTheme: function(name, theme) {
        if (typeof name === 'object') {
            theme = name;
            name = theme.themeName;
        }

        if (!name) {
            throw new HypergridError('Cannot register an anonymous theme.');
        }

        if (name === 'default') {
            throw new HypergridError('Cannot register or unregister the "default" theme.');
        }

        if (theme) {
            theme.themeName = name;
            registry[name] = theme;
        } else {
            delete registry[name];
        }
    },

    /**
     * App developers are free to add in additional themes, such as those in {@link https://openfin.github.com/fin-hypergrid-themes/themes}:
     * ```javascript
     * Hypergrind.registerThemes(require('fin-hypergrid-themes'));
     * ```
     * @param {object} themeCollection
     * @memberOf Hypergrid.
     */
    registerThemes: function(themeCollection) {
        if (themeCollection) {
            _(themeCollection).each(function(theme, name) {
                this.registerTheme(name, theme);
            }, this);
        } else {
            Object.keys(registry).forEach(function(themeName) {
                this.registerTheme(themeName);
            }, this);
        }
    },

    /**
     * @summary Apply global theme.
     * @desc Apply props from the given theme object to the global theme object,
     * the `defaults` layer at the bottom of the properties hierarchy.
     * @this {Hypergrid.constructor}
     * @param {object|string} [theme=registry.default] - One of:
     * * **string:** A registered theme name.
     * * **object:** A theme object. Empty object removes global them, restoring defaults.
     * * _falsy value:_ Also restores defaults.
     * @param {string|undefined} [theme.themeName=undefined]
     * @memberOf Hypergrid.
     */
    applyTheme: applyTheme
};
Object.defineProperty(sharedMixin, 'theme', { // global theme setter/getter
    enumerable: true,
    set: applyTheme,
    get: function() { return defaults; } // the defaults layer *is* the global theme layer
});


module.exports = {
    mixin: mixin,
    sharedMixin: sharedMixin
};

},{"../defaults":51,"../lib/dynamicProperties":75,"../lib/error":76,"object-iterators":94}],19:[function(require,module,exports){
'use strict';

var Point = require('rectangular').Point;

var Base = require('../Base');
var Column = require('./Column');
var cellEventFactory = require('../lib/cellEventFactory');
var fields = require('../lib/fields');
var featureRegistry = require('../features');
var ArrayDecorator = require('synonomous');
var propClassEnum = require('../defaults.js').propClassEnum;
var assignOrDelete = require('../lib/assignOrDelete');
var dispatchGridEvent = require('../lib/dispatchGridEvent');


var noExportProperties = [
    'columnHeader',
    'columnHeaderColumnSelection',
    'filterProperties',
    'rowHeader',
    'rowHeaderRowSelection',
    'rowNumbersProperties',
    'treeColumnProperties',
    'treeColumnPropertiesColumnSelection',
];

/**
 * @mixes cellProperties.behaviorMixin
 * @mixes rowProperties.mixin
 * @mixes subgrids.mixin
 * @constructor
 * @desc A controller for the data model.
 * > This constructor (actually `initialize`) will be called upon instantiation of this class or of any class that extends from this class. See {@link https://github.com/joneit/extend-me|extend-me} for more info.
 * @param {Hypergrid} grid
 * @param {object} [options] - _(Passed to {@link Behavior#reset reset})._
 * @param {dataModelAPI} [options.dataModel] - _Per {@link Behavior#reset reset}._
 * @param {object} [options.metadata] - _Per {@link Behavior#reset reset}._
 * @param {function} [options.DataModel=require('datasaur-local')] - _Per {@link Behavior#reset reset}._
 * @param {function|object[]} [options.data] - _Per {@link Behavior#setData setData}._
 * @param {function|menuItem[]} [options.schema] - _Per {@link Behavior#setData setData}._
 * @param {subgridSpec[]} [options.subgrids=this.grid.properties.subgrids] - _Per {@link Behavior#setData setData}._
 * @param {boolean} [options.apply=true] - _Per {@link Behavior#setData setData}._
 * @abstract
 */
var Behavior = Base.extend('Behavior', {

    initialize: function(grid, options) {
        /**
         * @type {Hypergrid}
         * @memberOf Behavior#
         */
        this.grid = grid;

        this.initializeFeatureChain();

        this.grid.behavior = this;
        this.reset(options);
    },

    /**
     * @desc Create the feature chain - this is the [chain of responsibility](http://c2.com/cgi/wiki?ChainOfResponsibilityPattern) pattern.
     * @param {Hypergrid} [grid] Unnecesary legacy parameter. May be omitted.
     * @memberOf Behavior#
     */
    initializeFeatureChain: function(grid) {
        var constructors;

        /**
         * @summary Controller chain of command.
         * @desc Each feature is linked to the next feature.
         * @type {Feature}
         * @memberOf Behavior#
         */
        this.featureChain = undefined;

        /**
         * @summary Hash of instantiated features by class names.
         * @desc Built here but otherwise not in use.
         * @type {object}
         * @memberOf Behavior#
         */
        this.featureMap = {};

        this.featureRegistry = this.featureRegistry || featureRegistry;

        if (this.grid.properties.features) {
            var getFeatureConstructor = this.featureRegistry.get.bind(this.featureRegistry);
            constructors = this.grid.properties.features.map(getFeatureConstructor);
        } else if (this.features) {
            constructors = this.features;
            warnBehaviorFeaturesDeprecation.call(this);
        }

        constructors.forEach(function(FeatureConstructor, i) {
            var feature = new FeatureConstructor;

            this.featureMap[feature.$$CLASS_NAME] = feature;

            if (i) {
                this.featureChain.setNext(feature);
            } else {
                this.featureChain = feature;
            }
        }, this);

        if (this.featureChain) {
            this.featureChain.initializeOn(this.grid);
        }
    },

    features: [], // override in implementing class; or provide feature names in grid.properties.features; else no features

    /**
     * Reset the behavior.
     * @param {object} [options] - _Same as constructor's `options`._<br>
     * _Passed to {@link Behavior#resetDataModel resetDataModel} and {@link Behavior#setData setData} (both of which see)._
     * @memberOf Behavior#
     */
    reset: function(options) {
        var dataModelChanged = this.resetDataModel(options);

        if (dataModelChanged) {
            // recreate `CellEvent` class so it can update its cached `grid`, `behavior`, and `dataModel` properties
            this.CellEvent = cellEventFactory(this.grid);
        }

        this.scrollPositionX = this.scrollPositionY = 0;

        this.rowPropertiesPrototype = Object.create(this.grid.properties,
            require('./rowProperties').rowPropertiesPrototypeDescriptors);

        this.clearColumns();
        this.createColumns();

        /**
         * Ordered list of subgrids to render.
         * @type {subgridSpec[]}
         * @memberOf Hypergrid#
         */
        this.subgrids = options && options.subgrids ||
            !dataModelChanged && this.subgrids ||
            this.grid.properties.subgrids;

        this.setData(options);
    },

    /**
     * @memberOf Local#
     * @description Set the header labels.
     * @param {string[]|object} headers - The header labels. One of:
     * * _If an array:_ Must contain all headers in column order.
     * * _If a hash:_ May contain any headers, keyed by field name, in any order.
     */
    setHeaders: function(headers) {
        if (headers instanceof Array) {
            // Reset all headers
            var allColumns = this.allColumns;
            headers.forEach(function(header, index) {
                allColumns[index].header = header; // setter updates header in both column and data source objects
            });
        } else if (typeof headers === 'object') {
            // Adjust just the headers in the hash
            this.allColumns.forEach(function(column) {
                if (headers[column.name]) {
                    column.header = headers[column.name];
                }
            });
        }
    },

    /**
     * @summary Set grid data.
     * @desc Fails silently if `dataRows` and `options.data` are both undefined.
     *
     * @param {function|object[]} [dataRows=options.data] - Array of uniform data row objects or function returning same.
     *
     * @param {object} [options] - _(Promoted to first argument position when `dataRows` omitted.)_
     *
     * @param {function|object[]} [options.data] - The data when `dataRows` undefined.
     *
     * @param {function|menuItem[]} [options.schema] - May be:
     * * A schema array
     * * A function returning same. Called at filter reset time with behavior as context.
     * * Omit to allow the data model to generate a basic schema from its data.
     *
     * @param {boolean} [options.apply=true] Apply data transformations to the new data.
     *
     * @memberOf Behavior#
     */
    setData: function(dataRows, options) {
        if (!(Array.isArray(dataRows) || typeof dataRows === 'function')) {
            options = dataRows;
            dataRows = options && options.data;
        }

        dataRows = this.unwrap(dataRows);

        if (dataRows === undefined) {
            return;
        }

        if (!Array.isArray(dataRows)) {
            throw 'Expected data to be an array (of data row objects).';
        }

        options = options || {};

        var schema = this.unwrap(options.schema);

        // Inform interested data models of data.
        this.subgrids.forEach(function(dataModel) {
            dataModel.setData(dataRows, schema);
        });

        if (this.grid.cellEditor) {
            this.grid.cellEditor.cancelEditing();
        }

        if (options.apply || options.apply === undefined) { // default is `true`
            this.reindex();
        }

        this.grid.allowEvents(this.getRowCount());
    },

    get renderedColumnCount() {
        return this.grid.renderer.visibleColumns.length;
    },

    get renderedRowCount() {
        return this.grid.renderer.visibleRows.length;
    },

    get leftMostColIndex() {
        return this.grid.properties.showRowNumbers ? this.rowColumnIndex : (this.hasTreeColumn() ? this.treeColumnIndex : 0);
    },

    clearColumns: function() {
        var schema = this.schema,
            tc = this.treeColumnIndex,
            rc = this.rowColumnIndex;

        schema[tc] = schema[tc] || {
            index: tc,
            name: 'Tree',
            header: 'Tree'
        };

        schema[rc] = schema[rc] || {
            index: rc,
            name: '',
            header: ''
        };

        /**
         * @type {Column[]}
         * @memberOf Behavior#
         */
        this.columns = [];

        /**
         * @type {Column[]}
         * @memberOf Behavior#
         */
        this.allColumns = [];

        this.allColumns[tc] = this.columns[tc] = this.newColumn({
            index: tc,
            header: schema[tc].header
        });
        this.allColumns[rc] = this.columns[rc] = this.newColumn({
            index: rc,
            header: schema[rc].header
        });

        this.columns[tc].properties.propClassLayers = this.columns[rc].properties.propClassLayers = [propClassEnum.COLUMNS];

        // Signal the renderer to size the now-reset handle column before next render
        this.grid.renderer.resetRowHeaderColumnWidth();
    },

    getActiveColumn: function(x) {
        return this.columns[x];
    },

    /**
     * The "grid index" of an active column given a "data index" (number), column name (string), or column object
     * @param {Column|number} columnOrIndex
     * @returns {undefined|number} The grid index of the column or undefined if column not in grid.
     * @memberOf Hypergrid#
     */
    getActiveColumnIndex: function(columnOrIndexOrName) {
        var value = columnOrIndexOrName instanceof Column ? columnOrIndexOrName.index : columnOrIndexOrName,
            key = typeof index === 'number' ? 'index' : 'name';

        return this.columns.findIndex(function(column) { return column[key] === value; });
    },

    getColumn: function(x) {
        return this.allColumns[x];
    },

    newColumn: function(options) {
        return new Column(this, options);
    },

    addColumn: function(options) {
        var column = this.newColumn(options),
            arrayDecorator = new ArrayDecorator,
            synonyms = arrayDecorator.getSynonyms(column.name);

        this.columns.push(column);
        arrayDecorator.decorateObject(this.columns, synonyms, column);

        this.allColumns.push(column);
        arrayDecorator.decorateObject(this.allColumns, synonyms, column);

        return column;
    },

    createColumns: function(realImplementation) {
        var schema = this.dataModel.getSchema();

        fields.normalizeSchema(schema);
        fields.decorateSchema(schema);
        fields.decorateColumnSchema(schema, this.grid.properties.headerify);

        this.createDataRowProxy();

        this.clearColumns();

        if (realImplementation) {
            realImplementation.call(this);
        }

        this.changed();

        dispatchGridEvent.call(this.grid, 'fin-hypergrid-columns-created');
    },

    createDataRowProxy: function() {
        // concrete implementation here if behavior doesn't implement its own getRow()
    },

    getColumnWidth: function(x) {
        var column = this.getActiveColumn(x);
        if (!column) {
            return this.grid.properties.defaultColumnWidth;
        }
        var width = column.getWidth();
        return width;
    },

    /**
     * @param {Column|number} columnOrIndex - The column or active column index.
     * @param width
     * @memberOf Hypergrid#
     */
    setColumnWidth: function(columnOrIndex, width) {
        var column = columnOrIndex >= -2 ? this.getActiveColumn(columnOrIndex) : columnOrIndex;
        column.setWidth(width);
        this.stateChanged();
    },

    /**
     * @memberOf Behavior#
     */
    reindex: function() {
        this.dataModel.reindex();
    },

    /**
     * @memberOf Behavior#
     * @desc utility function to empty an object of its members
     * @param {object} obj - the object to empty
     * @param {boolean} [exportProps]
     * * `undefined` (omitted) - delete *all* properties
     * * **falsy** - delete *only* the export properties
     * * **truthy** - delete all properties *except* the export properties
     */
    clearObjectProperties: function(obj, exportProps) {
        for (var key in obj) {
            if (
                obj.hasOwnProperty(key) && (
                    exportProps === undefined ||
                    !exportProps && noExportProperties.indexOf(key) >= 0 ||
                    exportProps && noExportProperties.indexOf(key) < 0
                )
            ) {
                delete obj[key];
            }
        }
    },

    //this is effectively a clone, with certain things removed....
    getState: function() {
        var copy = JSON.parse(JSON.stringify(this.grid.properties));
        this.clearObjectProperties(copy.columnProperties, false);
        return copy;
    },
    /**
     * @memberOf Behavior#
     * @desc clear all table state
     */
    clearState: function() {
        this.grid.clearState();
        this.createColumns();
    },

    /**
     * @memberOf Behavior#
     * @desc Restore this table to a previous state.
     * See the [memento pattern](http://c2.com/cgi/wiki?MementoPattern).
     * @param {Object} properties - assignable grid properties
     */
    setState: function(properties) {
        this.addState(properties, true);
    },

    /**
     *
     * @param {Object} properties - assignable grid properties
     * @param {boolean} [settingState] - Clear properties object before assignments.
     */
    addState: function(properties, settingState) {
        if (settingState) {
            this.clearState();
        }

        var gridProps = this.grid.properties;

        gridProps.settingState = settingState;
        assignOrDelete(gridProps, properties);
        delete gridProps.settingState;

        this.reindex();
    },

    /**
     * @summary Sets properties for active columns.
     * @desc Sets multiple columns' properties from elements of given array or collection. Keys may be column indexes or column names. The properties collection is cleared first. Falsy elements are ignored.
     * @param {object[]|undefined} columnsHash - If undefined, this call is a no-op.
     */
    setAllColumnProperties: function(columnsHash) {
        this.addAllColumnProperties(columnsHash, true);
    },

    /**
     * @summary Adds properties for multiple columns.
     * @desc Adds . The properties collection is optionally cleared first. Falsy elements are ignored.
     * @param {object[]|undefined} columnsHash - If undefined, this call is a no-op.
     * @param {boolean} [settingState] - Clear columns' properties objects before copying properties.
     */
    addAllColumnProperties: function(columnsHash, settingState) {
        if (!columnsHash) {
            return;
        }

        var columns = this.grid.behavior.getColumns();

        Object.keys(columnsHash).forEach(function(key) {
            var column = columns[key];
            if (column) {
                column.addProperties(columnsHash[key], settingState);
            }
        });
    },

    setColumnOrder: function(columnIndexes) {
        if (Array.isArray(columnIndexes)){
            var columns = this.columns,
                allColumns = this.allColumns,
                arrayDecorator = new ArrayDecorator;

            // avoid recreating the `columns` array object to keep refs valid; just empty it
            columns.length = 0;
            var tc = this.treeColumnIndex.toString(), rc = this.rowColumnIndex.toString();
            Object.keys(columns).forEach(function(key) {
                switch (key) {
                    case tc:
                    case rc:
                        break;
                    default:
                        delete columns[key];
                }
            });

            columnIndexes.forEach(function(index) {
                columns.push(allColumns[index]);
            });

            arrayDecorator.decorateArray(columns);
        }
    },

    setColumnOrderByName: function(columnNames) {
        if (Array.isArray(columnNames)) {
            var allColumns = this.allColumns;
            this.setColumnOrder(columnNames.map(function(name) { return allColumns[name].index; }));
        }
    },

    /**
     * @memberOf Behavior#
     * @desc Rebuild the column order indexes
     * @param {Array} columnIndexes - list of column indexes
     * @param {Boolean} [silent=false] - whether to trigger column changed event
     */
    setColumnIndexes: function(columnIndexes, silent) {
        this.grid.properties.columnIndexes = columnIndexes;
        if (!silent) {
            this.grid.fireSyntheticOnColumnsChangedEvent();
        }
    },

    /**
     * @summary Show inactive column(s) or move active column(s).
     *
     * @desc Adds one or several columns to the "active" column list.
     *
     * @param {boolean} [isActiveColumnIndexes=false] - Which list `columnIndexes` refers to:
     * * `true` - The active column list. This can only move columns around within the active column list; it cannot add inactive columns (because it can only refer to columns in the active column list).
     * * `false` - The full column list (as per column schema array). This inserts columns from the "inactive" column list, moving columns that are already active.
     *
     * @param {number|number[]} columnIndexes - Column index(es) into list as determined by `isActiveColumnIndexes`. One of:
     * * **Scalar column index** - Adds single column at insertion point.
     * * **Array of column indexes** - Adds multiple consecutive columns at insertion point.
     *
     * _This required parameter is promoted left one arg position when `isActiveColumnIndexes` omitted._
     *
     * @param {number} [referenceIndex=this.columns.length] - Insertion point, _i.e.,_ the element to insert before. A negative values skips the reinsert. Default is to insert new columns at end of active column list.
     *
     * _Promoted left one arg position when `isActiveColumnIndexes` omitted._
     *
     * @param {boolean} [allowDuplicateColumns=false] - Unless true, already visible columns are removed first.
     *
     * _Promoted left one arg position when `isActiveColumnIndexes` omitted + one position when `referenceIndex` omitted._
     *
     * @memberOf Behavior#
     */
    showColumns: function(isActiveColumnIndexes, columnIndexes, referenceIndex, allowDuplicateColumns) {
        // Promote args when isActiveColumnIndexes omitted
        if (typeof isActiveColumnIndexes === 'number' || Array.isArray(isActiveColumnIndexes)) {
            allowDuplicateColumns = referenceIndex;
            referenceIndex = columnIndexes;
            columnIndexes = isActiveColumnIndexes;
            isActiveColumnIndexes = false;
        }

        var activeColumns = this.columns,
            sourceColumnList = isActiveColumnIndexes ? activeColumns : this.allColumns;

        // Nest scalar index
        if (typeof columnIndexes === 'number') {
            columnIndexes = [columnIndexes];
        }

        var newColumns = columnIndexes
            .map(function(index) { return sourceColumnList[index]; }) // Look up columns using provided indexes
            .filter(function(column) { return column; }); // Remove any undefined columns

        // Default insertion point is end (i.e., before (last+1)th element)
        if (typeof referenceIndex !== 'number') {
            allowDuplicateColumns = referenceIndex; // assume reference index was omitted when not a number
            referenceIndex = activeColumns.length;
        }

        // Remove already visible columns and adjust insertion point
        if (!allowDuplicateColumns) {
            newColumns.forEach(function(column) {
                var i = activeColumns.indexOf(column);
                if (i >= 0) {
                    activeColumns.splice(i, 1);
                    if (referenceIndex > i) {
                        --referenceIndex;
                    }
                }
            });
        }

        // Insert the new columns at the insertion point
        if (referenceIndex >= 0) {
            activeColumns.splice.apply(activeColumns, [referenceIndex, 0].concat(newColumns));
        }

        this.grid.properties.columnIndexes = activeColumns.map(function(column) { return column.index; });
    },

    /**
     * @summary Hide active column(s).
     * @desc Removes one or several columns from the "active" column list.
     * @param {boolean} [isActiveColumnIndexes=false] - Which list `columnIndexes` refers to:
     * * `true` - The active column list.
     * * `false` - The full column list (as per column schema array).
     * @param {number|number[]} columnIndexes - Column index(es) into list as determined by `isActiveColumnIndexes`. One of:
     * * **Scalar column index** - Adds single column at insertion point.
     * * **Array of column indexes** - Adds multiple consecutive columns at insertion point.
     *
     * _This required parameter is promoted left one arg position when `isActiveColumnIndexes` omitted._
     * @memberOf Behavior#
     */
    hideColumns: function(isActiveColumnIndexes, columnIndexes) {
        var args = Array.prototype.slice.call(arguments); // Convert to array so we can add an argument (element)
        args.push(-1); // Remove only; do not reinsert.
        this.showColumns.apply(this, args);
    },

    /**
     * @memberOf Behavior#
     * @desc fetch the value for a property key
     * @returns {*} The value of the given property.
     * @param {string} key - a property name
     */
    resolveProperty: function(key) {
        // todo: remove when we remove the deprecated grid.resolveProperty
        return this.grid.resolveProperty(key);
    },

    lookupFeature: function(key) {
        return this.featureMap[key];
    },

    /**
     * @memberOf Behavior#
     * @return {number} The width of the fixed column area in the hypergrid.
     */
    getFixedColumnsWidth: function() {
        var count = this.getFixedColumnCount(),
            total = 0,
            i = this.leftMostColIndex;

        for (; i < count; i++) {
            total += this.getColumnWidth(i);
        }
        return total;
    },

    /**
     * @memberOf Behavior#
     * @desc This exists to support "floating" columns.
     * @return {number} The total width of the fixed columns area.
     */
    getFixedColumnsMaxWidth: function() {
        return this.getFixedColumnsWidth();
    },

    /**
     * @memberOf Behavior#
     * @desc delegate setting the cursor up the feature chain of responsibility
     * @param {Hypergrid} grid
     */
    setCursor: function(grid) {
        grid.updateCursor();
        this.featureChain.setCursor(grid);
    },

    /**
     * @memberOf Behavior#
     * @desc delegate handling mouse move to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onMouseMove: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleMouseMove(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior#
     * @desc delegate handling tap to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onClick: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleClick(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior#
     * @desc delegate handling tap to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onContextMenu: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleContextMenu(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior#
     * @desc delegate handling wheel moved to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onWheelMoved: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleWheelMoved(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior#
     * @desc delegate handling mouse up to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onMouseUp: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleMouseUp(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior#
     * @desc delegate handling mouse drag to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onMouseDrag: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleMouseDrag(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior#
     * @desc delegate handling key down to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onKeyDown: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleKeyDown(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior#
     * @desc delegate handling key up to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onKeyUp: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleKeyUp(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior#
     * @desc delegate handling double click to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onDoubleClick: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleDoubleClick(grid, event);
            this.setCursor(grid);
        }
    },
    /**
     * @memberOf Behavior#
     * @desc delegate handling mouse down to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDown: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleMouseDown(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior#
     * @desc delegate handling mouse exit to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseExit: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleMouseExit(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior#
     * @desc I've been notified that the behavior has changed.
     */
    changed: function() { this.grid.behaviorChanged(); },

    /**
     * @memberOf Behavior#
     * @desc The dimensions of the grid data have changed. You've been notified.
     */
    shapeChanged: function() { this.grid.behaviorShapeChanged(); },

    /**
     * @memberOf Behavior#
     * @desc The dimensions of the grid data have changed. You've been notified.
     */
    stateChanged: function() { this.grid.behaviorStateChanged(); },

    /**
     * @memberOf Behavior#
     * @return {boolean} Can re-order columns.
     */
    isColumnReorderable: function() {
        return this.deprecated('isColumnReorderable()', 'grid.properties.columnsReorderable', '2.1.3');
    },

    /**
     * @param {index} x - Data x coordinate.
     * @return {Object} The properties for a specific column.
     * @memberOf Behavior#
     */
    getColumnProperties: function(x) {
        var column = this.getColumn(x);
        return column && column.properties;
    },

    /**
     * @param {index} x - Data x coordinate.
     * @return {Object} The properties for a specific column.
     * @memberOf Behavior#
     */
    setColumnProperties: function(x, properties) {
        var column = this.getColumn(x);
        if (!column) {
            throw 'Expected column.';
        }
        var result = Object.assign(column.properties, properties);
        this.changed();
        return result;
    },

    /**
     * Clears all cell properties of given column or of all columns.
     * @param {number} [x] - Omit for all columns.
     * @memberOf Behavior#
     */
    clearAllCellProperties: function(x) {
        var X;

        if (x === undefined) {
            x = 0;
            X = this.columns.length;
        } else {
            X = x + 1;
        }

        for (; x < X; x++) {
            var column = this.getColumn(x);
            if (column) {
                column.clearAllCellProperties();
            }
        }
    },

    /**
     * @memberOf Behavior#
     * @return {string[]} All the currently hidden column header labels.
     */
    getHiddenColumnDescriptors: function() {
        var tableState = this.grid.properties;
        var indexes = tableState.columnIndexes;
        var labels = [];
        var columnCount = this.getActiveColumnCount();
        for (var i = 0; i < columnCount; i++) {
            if (indexes.indexOf(i) === -1) {
                var column = this.getActiveColumn(i);
                labels.push({
                    id: i,
                    header: column.header,
                    field: column.name
                });
            }
        }
        return labels;
    },

    /**
     * @memberOf Behavior#
     * @return {number} The number of fixed columns.
     */
    getFixedColumnCount: function() {
        return this.grid.properties.fixedColumnCount;
    },

    /**
     * @memberOf Behavior#
     * @desc set the number of fixed columns
     * @param {number} n - the integer count of how many columns to be fixed
     */
    setFixedColumnCount: function(n) {
        this.grid.properties.fixedColumnCount = n;
    },

    /**
     * @summary The number of "fixed rows."
     * @desc The number of (non-scrollable) rows preceding the (scrollable) data subgrid.
     * @memberOf Behavior#
     * @return {number} The sum of:
     * 1. All rows of all subgrids preceding the data subgrid.
     * 2. The first `fixedRowCount` rows of the data subgrid.
     */
    getFixedRowCount: function() {
        return (
            this.getHeaderRowCount() +
            this.grid.properties.fixedRowCount
        );
    },

    /**
     * @memberOf Behavior#
     * @desc Set the number of fixed rows, which includes (top to bottom order):
     * 1. The header rows
     *    1. The header labels row (optional)
     *    2. The filter row (optional)
     *    3. The top total rows (0 or more)
     * 2. The non-scrolling rows (externally called "the fixed rows")
     *
     * @returns {number} Sum of the above or 0 if none of the above are in use.
     *
     * @param {number} The number of rows.
     */
    setFixedRowCount: function(n) {
        this.grid.properties.fixedRowCount = n;
    },

    /**
     * @memberOf Behavior#
     * @desc a dnd column has just been dropped, we've been notified
     */
    endDragColumnNotification: function() {},

    /**
     * @memberOf Behavior#
     * @return {null} the cursor at a specific x,y coordinate
     * @param {number} x - the x coordinate
     * @param {number} y - the y coordinate
     */
    getCursorAt: function(x, y) {
        return null;
    },

    /**
     * Number of _visible_ columns.
     * @memberOf Behavior#
     * @return {number} The total number of columns.
     */
    getActiveColumnCount: function() {
        return this.columns.length;
    },

    /**
     * @summary Column alignment of given grid column.
     * @desc One of:
     * * `'left'`
     * * `'center'`
     * * `'right'`
     *
     * Cascades to grid.
     * @memberOf Behavior#
     * @desc Quietly set the horizontal scroll position.
     * @param {number} x - The new position in pixels.
     */
    setScrollPositionX: function(x) {
        /**
         * @memberOf Behavior#
         * @type {number}
         */
        this.scrollPositionX = x;
    },

    getScrollPositionX: function() {
        return this.scrollPositionX;
    },

    /**
     * @memberOf Behavior#
     * @desc Quietly set the vertical scroll position.
     * @param {number} y - The new position in pixels.
     */
    setScrollPositionY: function(y) {
        /**
         * @memberOf Behavior#
         * @type {number}
         */
        this.scrollPositionY = y;
    },

    getScrollPositionY: function() {
        return this.scrollPositionY;
    },

    /**
     * @memberOf Behavior#
     * @return {cellEditor} The cell editor for the cell at the given coordinates.
     * @param {CellEvent} editPoint - The grid cell coordinates.
     */
    getCellEditorAt: function(event) {
        return event.isDataColumn && event.column.getCellEditorAt(event);
    },

    /**
     * @memberOf Behavior#
     * @return {boolean} `true` if we should highlight on hover
     * @param {boolean} isColumnHovered - the column is hovered or not
     * @param {boolean} isRowHovered - the row is hovered or not
     */
    highlightCellOnHover: function(isColumnHovered, isRowHovered) {
        return isColumnHovered && isRowHovered;
    },

    /**
     * @memberOf Behavior#
     * @desc this function is a hook and is called just before the painting of a cell occurs
     * @param {Point} cell
     */
    set cellPropertiesPrePaintNotification(cell) {
        throw new this.HypergridError('cellPropertiesPrePaintNotification has been deprecated as of v3.0.0. Code to inspect or mutate the render config object should be moved to the getCell hook.');
    },

    /**
     * @memberOf Behavior#
     * @desc swap src and tar columns
     * @param {number} src - column index
     * @param {number} tar - column index
     */
    swapColumns: function(source, target) {
        var columns = this.columns;
        var tmp = columns[source];
        columns[source] = columns[target];
        columns[target] = tmp;
        this.changed();
    },

    convertViewPointToDataPoint: function(unscrolled) {
        return new Point(
            this.getActiveColumn(unscrolled.x).index,
            unscrolled.y
        );
    },

    hasTreeColumn: function(columnIndex) {
        return false;
    },

    getSelectionMatrixFunction: function(selectedRows) {
        return function() {
            return null;
        };
    },

    getRowHeaderColumn: function() {
        return this.allColumns[this.rowColumnIndex];
    },

    autosizeAllColumns: function() {
        this.checkColumnAutosizing(true);
        this.changed();
    },

    checkColumnAutosizing: function(force) {
        force = force === true;
        var autoSized = this.autoSizeRowNumberColumn() ||
            this.hasTreeColumn() && this.getRowHeaderColumn().checkColumnAutosizing(force);
        this.allColumns.forEach(function(column) {
            autoSized = column.checkColumnAutosizing(force) || autoSized;
        });
        return autoSized;
    },

    autoSizeRowNumberColumn: function() {
        if (this.grid.properties.showRowNumbers && this.grid.properties.rowNumberAutosizing) {
            return this.getRowHeaderColumn().checkColumnAutosizing(true);
        }
    },

    getColumns: function() {
        return this.allColumns;
    },

    getActiveColumns: function() {
        return this.columns;
    },

    getHiddenColumns: function() {
        var visible = this.columns;
        var all = this.allColumns;
        var hidden = [];
        for (var i = 0; i < all.length; i++) {
            if (visible.indexOf(all[i]) === -1) {
                hidden.push(all[i]);
            }
        }
        hidden.sort(function(a, b) {
            return a.header < b.header;
        });
        return hidden;
    },

    getSelectedRows: function() {
        return this.grid.selectionModel.getSelectedRows();
    },

    getSelectedColumns: function() {
        return this.grid.selectionModel.getSelectedColumns();
    },

    getSelections: function() {
        return this.grid.selectionModel.getSelections();
    },

    getIndexedData: function() {
        return this.deprecated('getIndexedData()', 'getData()', '3.0.0');
    }
});


// define constants as immutable (i.e., !writable)
Object.defineProperties(Behavior.prototype, {
    treeColumnIndex: { value: -1 },
    rowColumnIndex: { value: -2 }
});


function warnBehaviorFeaturesDeprecation() {
    var featureNames = [], unregisteredFeatures = [], n = 0;

    this.features.forEach(function(FeatureConstructor) {
        var className = FeatureConstructor.prototype.$$CLASS_NAME || FeatureConstructor.name,
            featureName = className || 'feature' + n++;

        // build list of feature names
        featureNames.push(featureName);

        // build list of unregistered features
        if (!this.featureRegistry.get(featureName, true)) {
            var constructorName = FeatureConstructor.name || FeatureConstructor.prototype.$$CLASS_NAME || 'FeatureConstructor' + n,
                params = [];
            if (!className) {
                params.push('\'' + featureName + '\'');
            }
            params.push(constructorName);
            unregisteredFeatures.push(params.join(', '));
        }
    }, this);

    if (featureNames.length) {
        var sampleCode = 'Hypergrid.defaults.features = [\n' + join('\t\'', featureNames, '\',\n') + '];';

        if (unregisteredFeatures.length) {
            sampleCode += '\n\nThe following custom features are unregistered and will need to be registered prior to behavior instantiation:\n\n' +
                join('Features.add(', unregisteredFeatures, ');\n');
        }

        if (n) {
            sampleCode += '\n\n(You should provide meaningful names for your custom features rather than the generated names above.)';
        }

        console.warn('`grid.behavior.features` (array of feature constructors) has been deprecated as of version 2.1.0 in favor of `grid.properties.features` (array of feature names). Remove `features` array from your behavior and add `features` property to your grid state object (or Hypergrid.defaults), e.g.:\n\n' + sampleCode);
    }
}

function join(prefix, array, suffix) {
    return prefix + array.join(suffix + prefix) + suffix;
}


// synonyms

/**
 * Synonym of {@link Behavior#reindex}.
 * @name applyAnalytics
 * @deprecated
 * @memberOf Behavior#
 */
Behavior.prototype.applyAnalytics = Behavior.prototype.reindex;


// mix-ins
Behavior.prototype.mixIn(require('./rowProperties').mixin);
Behavior.prototype.mixIn(require('./cellProperties').behaviorMixin);
Behavior.prototype.mixIn(require('./subgrids').mixin);


module.exports = Behavior;

},{"../Base":12,"../defaults.js":51,"../features":65,"../lib/assignOrDelete":71,"../lib/cellEventFactory":72,"../lib/dispatchGridEvent":74,"../lib/fields":77,"./Column":20,"./cellProperties":26,"./rowProperties":29,"./subgrids":30,"rectangular":99,"synonomous":101}],20:[function(require,module,exports){
/* eslint-env browser */

'use strict';

var overrider = require('overrider');

var toFunction = require('../lib/toFunction');
var assignOrDelete = require('../lib/assignOrDelete');
var HypergridError = require('../lib/error');
var images = require('../../images');


var warned = {};


/** @summary Create a new `Column` object.
 * @mixes cellProperties.columnMixin
 * @mixes columnProperties.mixin
 * @constructor
 * @param {Behavior} behavior
 * @param {object} columnSchema
 * @param {number} columnSchema.index
 * @param {string} columnSchema.name
 * @param {string} [columnSchema.header] - Displayed in column headers. If not defined, name is used.
 * @param {function} [columnSchema.calculator] - Define to make a computed column.
 * @param {string} [columnSchema.type] - For possible data model use. (Not used in core.)
 *
 * Positive values of `index` are "real" fields.
 *
 * Negative values of `index` are special cases:
 * `index` | Meaning
 * :-----: | --------
 *    -1   | Row header column
 *    -2   | Tree (drill-down) column
 */
function Column(behavior, columnSchema) {
    switch (typeof columnSchema) {
        case 'number':
            if (!warned.number) {
                console.warn('Column(behavior: object, index: number) overload has been deprecated as of v2.1.6 in favor of Column(behavior: object, columnSchema: object) overload with defined columnSchema.index. (Will be removed in a future release.)');
                warned.number = true;
            }
            columnSchema = {
                index: columnSchema
            };
            break;
        case 'string':
            if (!warned.string) {
                console.warn('Column(behavior:object, name: string) overload (where name is sought in schema) has been deprecated as of v2.1.6 in favor of Column(behavior: object, columnSchema: object) overload with defined columnSchema.index. (Will be removed in a future release.)');
                warned.string = true;
            }
            var name, index;
            name = columnSchema;
            index = behavior.dataModel.schema.findIndex(function(columnSchema) {
                return columnSchema.name === name;
            });
            if (index < 0) {
                throw new ReferenceError('Column named "' + name + '" not found in schema.');
            }
            columnSchema = {
                name: name,
                index: index
            };
            break;
        case 'object':
            if (columnSchema.index === undefined) {
                if (!warned.object) {
                    console.warn('Column(behavior:object, columnSchema: object) overload (where columnSchema.index is undefined but columnSchema.name is sought in schema) has been deprecated as of v2.1.6 in favor of defined columnSchema.index. (Will be removed in a future release.)');
                    warned.object = true;
                }
                name = columnSchema.name;
                index = behavior.dataModel.schema.findIndex(function(columnSchema) {
                    return columnSchema.name === name;
                });
                if (index < 0) {
                    throw new ReferenceError('Column named "' + name + '" not found in schema.');
                }
                columnSchema.index = index;
            }
            break;
    }

    if (columnSchema.index === undefined) {
        throw new HypergridError('Column index required.');
    }

    this.behavior = behavior;
    this.dataModel = behavior.dataModel;

    // set `index` and `name` as read-only properties
    Object.defineProperties(this, {
        index: {
            value: columnSchema.index
        },
        name: {
            enumerable: true,
            value: columnSchema.name || columnSchema.index.toString()
        }
    });

    this.properties = this.schema = columnSchema; // see {@link Column#properties properties} setter

    switch (columnSchema.index) {
        case this.behavior.treeColumnIndex:
            // Width of icon + 3-pixel spacer (checked and unchecked should be same width)
            var icon = images[Object.create(this.properties.treeHeader, { isDataRow: { value: true } }).leftIcon];
            this.properties.minimumColumnWidth = icon ? icon.width + 3 : 0;
            break;

        case this.behavior.rowColumnIndex:
            break;

        default:
            if (columnSchema.index < 0) {
                throw new RangeError('New column index ' + columnSchema.index + ' out of range.');
            }
    }
}

Column.prototype = {
    constructor: Column.prototype.constructor,
    $$CLASS_NAME: 'Column',

    HypergridError: HypergridError,

    mixIn: overrider.mixIn,

    /**
     * @summary Get or set the text of the column's header.
     * @desc The _header_ is the label at the top of the column.
     *
     * Setting the header updates both:
     * * the `schema` (aka, header) array in the underlying data source; and
     * * the filter.
     * @type {string}
     */
    set header(header) {
        this.schema.header = header;
        this.behavior.grid.repaint();
    },
    get header() {
        return this.schema.header;
    },

    /**
     * @summary Get or set the computed column's calculator function.
     * @desc Setting the value here updates the calculator in the data model schema.
     *
     * The results of the new calculations will appear in the column cells on the next repaint.
     * @type {string}
     */
    set calculator(calculator) {
        calculator = resolveCalculator.call(this, calculator);
        if (calculator !== this.schema.calculator) {
            this.schema.calculator = calculator;
            this.behavior.grid.reindex();
        }
    },
    get calculator() {
        return this.schema.calculator;
    },

    /**
     * @summary Get or set the type of the column's header.
     * @desc Setting the type updates the filter which typically uses this information for proper collation.
     *
     * @todo: Instead of using `this._type`, put on data source like the other essential properties. In this case, sorter could use the info to choose a comparator more intelligently and efficiently.
     * @type {string}
     */
    set type(type) {
        this.schema.type = type;
        this.behavior.reindex();
    },
    get type() {
        return this.schema.type;
    },

    getValue: function(y) {
        return this.dataModel.getValue(this.index, y);
    },

    setValue: function(y, value) {
        return this.dataModel.setValue(this.index, y, value);
    },

    getWidth: function() {
        return this.properties.width || this.behavior.grid.properties.defaultColumnWidth;
    },

    setWidth: function(width) {
        width = Math.max(this.properties.minimumColumnWidth, width);
        if (width !== this.properties.width) {
            this.properties.width = width;
            this.properties.columnAutosizing = false;
        }
    },

    checkColumnAutosizing: function(force) {
        var properties = this.properties,
            width, preferredWidth, autoSized;

        if (properties.columnAutosizing) {
            width = properties.width;
            preferredWidth = properties.preferredWidth || width;
            force = force || !properties.columnAutosized;
            if (width !== preferredWidth || force && preferredWidth !== undefined) {
                properties.width = force ? preferredWidth : Math.max(width, preferredWidth);
                properties.columnAutosized = !isNaN(properties.width);
                autoSized = properties.width !== width;
            }
        }

        return autoSized;
    },

    getCellType: function(y) {
        var value = this.getValue(y);
        return this.typeOf(value);
    },

    getType: function() {
        var props = this.properties;
        var type = props.type;
        if (!type) {
            type = this.computeColumnType();
            if (type !== 'unknown') {
                props.type = type;
            }
        }
        return type;
    },

    computeColumnType: function() {
        var headerRowCount = this.behavior.getHeaderRowCount();
        var height = this.behavior.getRowCount();
        var value = this.getValue(headerRowCount);
        var eachType = this.typeOf(value);
        if (!eachType) {
            return 'unknown';
        }
        var type = this.typeOf(value);
        //var isNumber = ((typeof value) === 'number');
        for (var y = headerRowCount; y < height; y++) {
            value = this.getValue(y);
            eachType = this.typeOf(value);
            // if (type !== eachType) {
            //     if (isNumber && (typeof value === 'number')) {
            //         type = 'float';
            //     } else {
            //         return 'mixed';
            //     }
            // }
        }
        return type;
    },

    typeOf: function(something) {
        if (something == null) {
            return null;
        }
        var typeOf = typeof something;
        switch (typeOf) {
            case 'object':
                return something.constructor.name.toLowerCase();
            case 'number':
                return parseInt(something) === something ? 'int' : 'float';
            default:
                return typeOf;
        }
    },

    get properties() {
        return this._properties;
    },
    set properties(properties) {
        this.addProperties(properties, true);
    },

    /**
     * Copy a properties collection to this column's properties object.
     *
     * When a value is `undefined` or `null`, the property is deleted except when a setter or non-configurable in which case it's set to `undefined`.
     * @param {object|undefined} properties - Properties to copy to column's properties object. If `undefined`, this call is a no-op.
     * @param {boolean} [settingState] - Clear column's properties object before copying properties.
     */
    addProperties: function(properties, settingState) {
        if (!properties) {
            return;
        }
        if (settingState || !this._properties) {
            this._properties = this.createColumnProperties();
        }
        assignOrDelete(this._properties, properties);
    },

    /** This method is provided because some grid renderer optimizations require that the grid renderer be informed when column colors change. Due to performance concerns, they cannot take the time to figure it out for themselves. Along the same lines, making the property a getter/setter (in columnProperties.js), though doable, might present performance concerns as this property is possibly the most accessed of all column properties.
     * @param color
     */
    setBackgroundColor: function(color) {
        if (this.properties.backgroundColor !== color) {
            this.properties.backgroundColor = color;
            this.behavior.grid.renderer.rebundleGridRenderers();
        }
    },

    /**
     * @summary Get a new cell editor.
     * @desc The cell editor to use must be registered with the key in the cell's `editor` property.
     *
     * The cell's `format` property is mixed into the provided cellEvent for possible overriding by developer's override of {@link DataModel.prototype.getCellEditorAt} before being used by {@link CellEditor} to parse and format the cell value.
     *
     * @param {CellEvent} cellEvent
     *
     * @returns {undefined|CellEditor} Falsy value means either no declared cell editor _or_ instantiation aborted by falsy return from `fireRequestCellEdit`.
     */
    getCellEditorAt: function(cellEvent) {
        var columnIndex = this.index,

            rowIndex = cellEvent.gridCell.y,

            editorName = cellEvent.properties.editor,

            options = Object.create(cellEvent, {
                format: {
                    // `options.format` is a copy of the cell's `format` property which is:
                    // 1. Subject to adjustment by the `getCellEditorAt` override.
                    // 2. Then used by the cell editor to reference the registered localizer (defaults to 'string' localizer)
                    writable: true,
                    enumerable: true, // so cell editor will copy it to self
                    value: cellEvent.properties.format
                }
            }),

            cellEditor = cellEvent.subgrid.getCellEditorAt(columnIndex, rowIndex, editorName, options);

        if (cellEditor && !cellEditor.grid) {
            // cell editor returned but not fully instantiated (aborted by falsy return from fireRequestCellEdit)
            cellEditor = undefined;
        }

        return cellEditor;
    },

    getFormatter: function() {
        var localizerName = this.properties.format;
        return this.behavior.grid.localization.get(localizerName).format;
    }
};

var REGEX_ARROW_FUNC = /^(\(.*\)|\w+)\s*=>/,
    REGEX_NAMED_FUNC = /^function\s+(\w+)\(/,
    REGEX_ANON_FUNC = /^function\s*\(/;

/**
 * Calculators are functions. Column calculators are saved in `grid.properties.calculators` using the function name as key. Anonymous functions use the stringified function itself as the key. This may seem pointless, but this achieves the objective here which is to share function instances.
 * @throws {HypergridError} Unexpected input.
 * @throws {HypergridError} Arrow function not permitted.
 * @throws {HypergridError} Unknown function.
 * @this {Column}
 * @param {function|string} calculator - One of:
 * * calculator function
 * * stringified calculator function with or without function name
 * * function name of a known function (already in `calculators`)
 * * falsy value
 * @returns {function} Shared calculator instance or `undefined` if input was falsy.
 */
function resolveCalculator(calculator) {
    if (!calculator) {
        return undefined;
    }

    var forColumnName = ' (for column "' + this.name + '").';

    if (typeof calculator === 'function') {
        calculator = calculator.toString();
    } else if (typeof calculator !== 'string') {
        throw new HypergridError('Expected calculator function OR string containing calculator function OR calculator name' + forColumnName);
    }

    var matches, key,
        calculators = this.behavior.grid.properties.calculators || (this.behavior.grid.properties.calculators = {});

    if (/^\w+$/.test(calculator)) {
        key = calculator; // just a function name
        if (!calculators[key]) {
            throw new HypergridError('Unknown calculator name "' + key + forColumnName);
        }
    } else if ((matches = calculator.match(REGEX_NAMED_FUNC))) {
        key = matches[1]; // function name extracted from stringified function
    } else if (calculator.test(REGEX_ANON_FUNC)) {
        key = calculator; // anonymous stringified function
    } else if (REGEX_ARROW_FUNC.test(calculator)) {
        throw new HypergridError('Arrow function not permitted as column calculator ' + forColumnName);
    }

    if (!calculators[key]) { // neither a string nor a function (previously functionified string)?
        calculators[key] = calculator;
    }

    // functionify existing entries as well as new `calculators` entries
    calculators[key] = toFunction(calculators[key]);

    return calculators[key];
}

Column.prototype.mixIn(require('./cellProperties').columnMixin);
Column.prototype.mixIn(require('./columnProperties').mixin);

module.exports = Column;

},{"../../images":10,"../lib/assignOrDelete":71,"../lib/error":76,"../lib/toFunction":80,"./cellProperties":26,"./columnProperties":28,"overrider":95}],21:[function(require,module,exports){
'use strict';


/**
 * @typedef {object} NormalizedDataModelEvent
 * @property {string} type - Event string.
 */

/**
 * @module decorators
 */

var hooks = require('./hooks');
var fallbacks = require('./fallbacks');
var dataModelEventHandlers = require('./events');
var dispatchGridEvent = require('../../lib/dispatchGridEvent');


var warned = {};


function silent() {}

/**
 * Injects missing utility functions into the data model.
 *
 * Typically, data models are extended from `datasaur-base` which supplies the utility functions. However, extending from `datasaur-base` is not a requirement and for those data models that do not, the necessary utility functions are injected here.
 *
 * The only utility function so injected at this time is `install`, which is used by:
 * * {@link module:decorators.injectCode injectCode} to:
 *    * Inject fallbacks for missing non-essential data model methods
 *    * Bind the data model's `dispatchEvent` method to the grid instance
 * * {@link module:decorators.injectCode injectCode} to:
 *    * Inject a default for the `getCell` hook
 *    * Inject a default for the `getCellEditorAt` hook
 *
 * @this {Local}
 * @param {dataModelAPI} dataModel
 * @memberOf module:decorators
 */
function injectPolyfills(dataModel) {
    if (!dataModel.install) {
        dataModel.install = function(api) {
            if (!api) {
                return;
            }

            var isArray = Array.isArray(api),
                keys = isArray ? api : Object.keys(api).filter(function(key) {
                    return typeof api[key] === 'function' &&
                        key !== 'constructor' &&
                        key !== 'initialize';
                });

            keys.forEach(function(key) {
                if (!this[key]) {
                    this[key] = isArray ? silent : api[key];
                }
            }, this);
        };
    }
}

/**
 * Injects code into data model:
 * * Inject fallback methods into data model when not implemented by data model.
 * * Binds the data model's `dispatchEvent` method to the grid instance:
 *    1. If `dataModel.addListener` is already implemented:<br>
 *       * Calls it event handler bound to this grid that handles all `data-` events.
 *       * `dataModel.dispatchEvent` is presumed to be implemented as well.
 *    2. If `dataModel.addListener` is not implemented:<br>
 *       * Inject same event handler as above into `dataModel.dispatchEvent`.
 *
 * @this {Local}
 * @param {dataModelAPI} dataModel
 * @param {Hypergrid} grid
 * @memberOf module:decorators
 */
function injectCode(dataModel, grid) {
    var options = {
        inject: true
    };

    dataModel.install(fallbacks, options);

    var handler = dispatchDataModelEvent.bind(grid);

    // There are two eventing models data models can use:
    if (dataModel.addListener) {
        // Choice #1: `addListener` eventing model: If implemented, register our bound dispatcher with it.
        dataModel.addListener(handler);
    } else {
        // Choice #2: Inject our bound dispatcher directly into data model
        options.force = true;
        dataModel.install({ dispatchEvent: handler }, options);
    }
}


var REGEX_DATA_EVENT_STRING = /^fin-hypergrid-(data|schema)(-[a-z]+)+$/;

/**
 * @summary Hypergrid data model event handler.
 * @desc This function is not called by Hypergrid.
 * Rather, it is handed to the data model (by {@link module:decorators.injectCode injectCode} as `dispatchEvent`) to issue callbacks to the grid.
 *
 * This handler:
 * 1. Checks the event string to make sure it conforms to the expected syntax:
 *    * Starts with `fin-hypergrid-data-` or `fin-hypergrid-schema-`
 *    * Includes only lowercase letters and hyphens
 * 2. Calls a handler in the {@link dataModelEventHandlers} namespace of the same name as the event string.
 * 3. Re-emits the event as a DOM event to the `<canvas>` element (unless the handler has already done so).
 *
 * The data model's `dispatchEvent` method is bound to the grid by {@link module:decorators.injectCode injectCode}.
 * A curried version of this function, bound to the grid instance, is either:
 * * Added to the data model via its `addListener` method, if it has one; or
 * * Force-injected into the data model, overriding any native implementation. (A native implementation may exist simply to "catch" calls that might be made before the data model is attached to Hypergrid.)
 *
 * @this {Hypergrid}
 * @param {string|NormalizedDataModelEvent} event
 * @memberOf module:decorators~
 */
function dispatchDataModelEvent(event) {
    var type;

    switch (typeof event) {
        case 'string':
            type = event;
            event = { type: type };
            break;
        case 'object':
            if ('type' in event) {
                type = event.type;
                break;
            }
        // fall through
        default:
            throw new TypeError('Expected data model event to be: (string | {type:string})');
    }

    if (!REGEX_DATA_EVENT_STRING.test(type)) {
        throw new TypeError('Expected data model event type "' + type + ' to match ' + REGEX_DATA_EVENT_STRING + '.');
    }

    var nativeHandler = dataModelEventHandlers[event.type];
    if (nativeHandler) {
        var dispatched = nativeHandler.call(this, event);
    }

    return dispatched !== undefined ? dispatched : dispatchGridEvent.call(this, event.type, event);
}

/**
 * @summary Add deprecation warnings for deprecated legacy data model properties.
 * @desc This method may be removed in a future version whence all deprecations are removed.
 * @this {Local}
 * @memberOf module:decorators
 */
function addDeprecationWarnings() {
    var grid = this.grid;

    Object.defineProperties(this.dataModel, {

        grid: {
            configurable: true,
            enumerable: false,
            get: function() {
                if (!warned.grid) {
                    console.warn('dataModel.grid has been deprecated as of v3.0.0. (Will be removed in a future release.) Data models should have no direct knowledge of or access to the grid. (If your data model needs to call grid methods, add a data event to your grid with `grid.addEventListener(\'fin-hypergrid-data-my-event\', myHandler)` and trigger it from your data model with `this.dispatchEvent(\'fin-hypergrid-data-my-event\')` or `this.dispatchEvent({ type: \'fin-hypergrid-data-my-event\' })`. If you need access to the grid object from within a `getCell` or `getCellEditAt` override, define `grid` in the same closure as the override.)');
                    warned.grid = true;
                }
                return grid;
            }
        },

        dataSource: {
            configurable: true,
            enumerable: false,
            get: function() {
                if (!warned.dataSource) {
                    console.warn('dataModel.dataSource has been deprecated as of 3.0.0 in favor of `dataModel`. (Will be removed in a future release.) The _external_ data model, formerly `grid.behavior.dataModel.dataSource`, is now `grid.behavior.dataModel`.');
                    warned.dataSource = true;
                }
                return this.dataModel;
            }
        }

    });
}

// for app layer access to drill down chars, provide friendlier keys than data model normally supports in `drillDownCharMap`.
var friendlierDrillDownMapKeys = {
    true: 'OPEN',
    false: 'CLOSE',
    null: 'INDENT'
};

/**
 * @this {Local}
 * @memberOf module:decorators
 */
function addFriendlierDrillDownMapKeys() {
    var charMap = this.dataModel.drillDownCharMap;
    if (charMap) {
        Object.keys(friendlierDrillDownMapKeys).forEach(function(key) {
            if (key in charMap) {
                var friendlierKey = friendlierDrillDownMapKeys[key];
                if (!(friendlierKey in charMap)) {
                    Object.defineProperty(charMap, friendlierKey, {
                        get: function() { return this[key]; },
                        set: function(s) { this[key] = s; }
                    });
                }
            }
        });
    }
}

/**
 * @param {dataModelAPI} dataModel
 * @this {Local}
 * @memberOf module:decorators
 */
function injectDefaulthooks(dataModel) {
    if (!dataModel.getCell) {
        dataModel.getCell = hooks.getCell;
    }

    if (!dataModel.getCellEditorAt) {
        dataModel.getCellEditorAt = hooks.getCellEditorAt;
    }
}


module.exports = {
    injectPolyfills: injectPolyfills,
    injectCode: injectCode,
    addDeprecationWarnings: addDeprecationWarnings,
    addFriendlierDrillDownMapKeys: addFriendlierDrillDownMapKeys,
    injectDefaulthooks: injectDefaulthooks
};

},{"../../lib/dispatchGridEvent":74,"./events":22,"./fallbacks":23,"./hooks":24}],22:[function(require,module,exports){
'use strict';

var dispatchGridEvent = require('../../lib/dispatchGridEvent.js');

/**
 * @namespace dataModelEventHandlers
 * @desc These handlers are called by {@link module:decorators.dispatchDataModelEvent dataModel.dispatchEvent}.
 *
 * They perform some Hypergrid housekeeping chores before (and possibly after) optionally re-emiting the event as a standard
 * Hypergrid event (to the `<canvas>` element).
 *
 * All the built-in data model events re-emit their events (all non-cancelable).
 *
 * #### Coding patterns
 * These handlers should return a boolean if they re-emit the event as a grid event themselves, when they have chores to perform post-re-emission. If they don't, they should return `undefined` which signals the caller (`dataModel.dispatchEvent`) to re-emit it as a grid event as a final step for the handler.
 *
 * Given the above, there are four typical coding patterns for these handlers:
 * 1. Perform chores with no event re-emission:
 * ```
 * Chores();
 * return true; // (or any defined value) signals caller not to re-emit the event
 * ```
 * 2. First perform chores; then re-emit the event as a grid event:
 * ```
 * Chores();
 * return undefined; // (or omit) signals caller to re-emit the event for us
 * ```
 * 3. First perform some pre-re-emit chores (optional); then re-emit the event as a _non-cancelable_ grid event; then perform remaining chores:
 * ```
 * optionalPreReemitChores();
 * dispatchGridEvent.call(this, event.type, event); // non-cancelable
 * remainingChores();
 * return true; // signals caller that we've already re-emitted the event and it was not canceled
 * ```
 * 3. First perform some pre-re-emit chores (optional); then re-emit the event as a _cancelable_ grid event; then perform remaining chores conditionally [iff](https://en.wikipedia.org/wiki/If_and_only_if) not canceled (_important:_ note the `true` in the following):
 * ```
 * optionalPreReemitChores();
 * if (dispatchGridEvent.call(this, event.type, true, event)) { // `true` here means cancelable
 *     conditionalChores();
 *     return true; // signals caller that we've already re-emitted the event (which was not canceled)
 * } else {
 *     return false; // signals caller that we've already re-emitted the event (which was canceled)
 * }
 * ```
 */
module.exports = {
    /**
     * _See the data model API page for event semantics (link below)._
     * @param {NormalizedDataModelEvent} event
     * @returns {undefined|boolean} Result of re-emitted event or `undefined` if event not re-emitted.
     * @see {@link dataModelAPI#event:fin-hypergrid-schema-changed}
     * @memberOf dataModelEventHandlers
     */
    'fin-hypergrid-schema-changed': function(event) {
        dispatchGridEvent.call(this, event.type, event);
        this.behavior.createColumns();
        return true;
    },

    /**
     * _See the data model API page for event semantics (link below)._
     * @param {NormalizedDataModelEvent} event
     * @returns {undefined|boolean} Result of re-emitted event or `undefined` if event not re-emitted.
     * @see {@link dataModelAPI#event:fin-hypergrid-data-changed}
     * @memberOf dataModelEventHandlers
     */
    'fin-hypergrid-data-changed': function(event) {
        this.repaint();
    },

    /**
     * _See the data model API page for event semantics (link below)._
     * @param {NormalizedDataModelEvent} event
     * @returns {undefined|boolean} Result of re-emitted event or `undefined` if event not re-emitted.
     * @see {@link dataModelAPI#event:fin-hypergrid-data-shape-changed}
     * @memberOf dataModelEventHandlers
     */
    'fin-hypergrid-data-shape-changed': function(event) {
        this.behaviorShapeChanged();
    },

    /**
     * _See the data model API page for event semantics (link below)._
     * @param {NormalizedDataModelEvent} event
     * @returns {undefined|boolean} Result of re-emitted event or `undefined` if event not re-emitted.
     * @see {@link dataModelAPI#event:fin-hypergrid-data-prereindex}
     * @memberOf dataModelEventHandlers
     */
    'fin-hypergrid-data-prereindex': function(event) {
        saveSelectedRowsAndColumns.call(this);
    },

    /**
     * _See the data model API page for event semantics (link below)._
     * @param {{type}} event
     * @returns {undefined|boolean} Result of re-emitted event or `undefined` if event not re-emitted.
     * @see {@link dataModelAPI#event:fin-hypergrid-data-postreindex}
     * @memberOf dataModelEventHandlers
     */
    'fin-hypergrid-data-postreindex': function(event) {
        reselectRowsAndColumns.call(this);
        this.behaviorShapeChanged();
    }
};


function saveSelectedRowsAndColumns() {
    saveSelectedDataRowIndexes.call(this);
    saveSelectedColumnNames.call(this);
}

function reselectRowsAndColumns() {
    this.selectionModel.reset();
    reselectRowsByDataRowIndexes.call(this);
    reselectColumnsByNames.call(this);
}

/**
 * Save underlying data row indexes backing current grid row selections in `grid.selectedDataRowIndexes`.
 *
 * This call should be paired with a subsequent call to `reselectRowsByUnderlyingIndexes`.
 * @private
 * @this {Hypergrid}
 * @returns {number|undefined} Number of selected rows or `undefined` if `restoreRowSelections` is falsy.
 */
function saveSelectedDataRowIndexes() {
    if (this.properties.restoreRowSelections) {
        var dataModel = this.behavior.dataModel;

        this.selectedDataRowIndexes = this.getSelectedRows().map(function(selectedRowIndex) {
            return dataModel.getRowIndex(selectedRowIndex);
        });

        return this.selectedDataRowIndexes.length;
    }
}

/**
 * Re-establish grid row selections based on underlying data row indexes saved by `getSelectedDataRowIndexes` which should be called first.
 *
 * Note that not all previously selected rows will necessarily be available after a data transformation. Even if they appear to be available, if they are not from the same data set, restoring the selections may not make sense. When this is the case, the application should set the `restoreRowSelections` property to `false`.
 * @private
 * @this {Hypergrid}
 * @returns {number|undefined} Number of rows reselected or `undefined` if there were no previously selected rows.
 */
function reselectRowsByDataRowIndexes() {
    var dataRowIndexes = this.selectedDataRowIndexes;
    if (dataRowIndexes) {
        delete this.selectedDataRowIndexes;

        var i, r,
            dataModel = this.behavior.dataModel,
            rowCount = this.getRowCount(),
            selectedRowCount = dataRowIndexes.length,
            gridRowIndexes = [],
            selectionModel = this.selectionModel;

        for (r = 0; selectedRowCount && r < rowCount; ++r) {
            i = dataRowIndexes.indexOf(dataModel.getRowIndex(r));
            if (i >= 0) {
                gridRowIndexes.push(r);
                delete dataRowIndexes[i]; // might make indexOf increasingly faster as deleted elements are not enumerable
                selectedRowCount--; // count down so we can bail early if all found
            }
        }

        gridRowIndexes.forEach(function(gridRowIndex) {
            selectionModel.selectRow(gridRowIndex);
        });

        return gridRowIndexes.length;
    }
}

/**
 * Save data column names of currently column selections in `grid.selectedColumnNames`.
 *
 * This call should be paired with a subsequent call to `reselectColumnsByNames`.
 * @private
 * @this {Hypergrid}
 * @param sourceColumnNames
 * @returns {number|undefined} Number of selected columns or `undefined` if `restoreColumnSelections` is falsy.
 */
function saveSelectedColumnNames() {
    if (this.properties.restoreColumnSelections) {
        var behavior = this.behavior;

        this.selectedColumnNames = this.getSelectedColumns().map(function(selectedColumnIndex) {
            return behavior.getActiveColumn(selectedColumnIndex).name;
        });

        return this.selectedColumnNames.length;
    }
}

/**
 * Re-establish columns selections based on column names saved by `getSelectedColumnNames` which should be called first.
 *
 * Note that not all preveiously selected columns wil necessarily be available after a data transformation. Even if they appear to be available, if they are not from the same data set, restoring the selections may not make sense. When this is the case, the application should set the `restoreRowSelections` property to `false`.
 * @private
 * @this {Hypergrid}
 * @param sourceColumnNames
 * @returns {number|undefined} Number of rows reselected or `undefined` if there were no previously selected columns.
 */
function reselectColumnsByNames(sourceColumnNames) {
    var selectedColumnNames = this.selectedColumnNames;
    if (selectedColumnNames) {
        delete this.selectedColumnNames;

        var behavior = this.behavior,
            selectionModel = this.selectionModel;

        return selectedColumnNames.reduce(function(reselectedCount, columnName) {
            var activeColumnIndex = behavior.getActiveColumnIndex(columnName);
            if (activeColumnIndex) {
                selectionModel.selectColumn(activeColumnIndex);
                reselectedCount++;
            }
            return reselectedCount;
        }, 0);
    }
}

},{"../../lib/dispatchGridEvent.js":74}],23:[function(require,module,exports){
'use strict';

/**
 * @module fallbacks
 *
 * @desc {@link Behavior#resetDataModel resetDataModel()} inserts each of these catcher methods into the new data model when not otherwise implemented, which allows Hypergrid to indiscriminately call these otherwise missing methods on the data model without fear of the call failing.
 */
module.exports = {
    /** @implements dataModelAPI#apply */
    apply: function() {},

    /** @implements dataModelAPI#isDrillDown */
    isDrillDown: function() { return false; },

    /** @implements dataModelAPI#click */
    click: function() { return false; },

    /** @implements dataModelAPI#getColumnCount */
    getColumnCount: function() {
        return this.getSchema().length;
    },

    /** @implements dataModelAPI#getRow */
    getRow: function(y) {
        this.$rowProxy$.$y$ = y;
        return this.$rowProxy$;
    },

    /** @implements dataModelAPI#getData */
    getData: function(metadataFieldName) {
        var y, Y = this.getRowCount(),
            row, rows = new Array(Y),
            metadata;

        for (y = 0; y < Y; y++) {
            row = this.getRow(y);
            if (row) {
                rows[y] = Object.assign({}, row);
                if (metadataFieldName) {
                    metadata = this.getRowMetadata(y);
                    if (metadata) {
                        rows[y][metadataFieldName] = metadata;
                    }
                }
            }
        }

        return rows;
    },

    setData: function(data) {
        // fail silently because Local.js::setData currently calls this for every subgrid
    },

    setValue: function(x, y, value) {
        console.warn('dataModel.setValue(' + x + ', ' + y + ', "' + value + '") called but no implementation. Data not saved.');
    },

    /** @implements dataModelAPI#getRowIndex */
    getRowIndex: function(y) {
        return y;
    },

    /** @implements dataModelAPI#getRowMetadata */
    getRowMetadata: function(y, prototype) {
        return this.metadata[y] || prototype !== undefined && (this.metadata[y] = Object.create(prototype));
    },

    /** @implements dataModelAPI#getMetadataStore */
    getMetadataStore: function() {
        return this.metadata;
    },

    /** @implements dataModelAPI#setRowMetadata */
    setRowMetadata: function(y, metadata) {
        if (metadata) {
            this.metadata[y] = metadata;
        } else {
            delete this.metadata[y];
        }
        return metadata;
    },

    /** @implements dataModelAPI#setMetadataStore */
    setMetadataStore: function(newMetadataStore) {
        this.metadata = newMetadataStore || [];
    }
};

},{}],24:[function(require,module,exports){
'use strict';


/**
 * Custom implementations should return with a call to the default implementation:
 * ```js
 * var getCell = require('fin-hypergrid/src/behaviors/dataModel').getCell;
 * function myCustomGetCell(config, rendererName) {
 *     // custom logic here that mutates config and/or renderName
 *     return getCell(config, rendererName);
 * }
 * ```
 * Alternatively, copy in the default implementation body (a one-liner):
 * ```js
 * function myCustomGetCell(config, rendererName) {
 *     // custom logic here that mutates config and/or renderName
 *     return config.grid.cellRenderers.get(rendererName);
 * }
 * ```
 * @implements {dataModelAPI#getCell}
 * @memberOf module:dataModel
 */
exports.getCell = function(config, rendererName) {
    return config.grid.cellRenderers.get(rendererName);
};


/**
 * Custom implementations should return with a call to the default implementation:
 * ```js
 * var getCellEditorAt = require('fin-hypergrid/src/behaviors/dataModel').getCellEditorAt;
 * function myCustomGetCellEditorAt(columnIndex, rowIndex, editorName, cellEvent) {
 *     // custom logic here, may mutate config and/or renderName
 *     return getCellEditorAt(columnIndex, rowIndex, editorName, cellEvent);
 * }
 * ```
 * Alternatively, copy in the default implementation body (a one-liner):
 * ```js
 * function myCustomGetCellEditorAt(columnIndex, rowIndex, editorName, cellEvent) {
 *     // custom logic here, may mutate editorName
 *     return cellEvent.grid.cellEditors.create(editorName, cellEvent);
 * }
 * ```
 * @implements {dataModelAPI#getCellEditorAt}
 * @memberOf module:dataModel
 */
exports.getCellEditorAt = function(columnIndex, rowIndex, editorName, cellEvent) {
    return cellEvent.grid.cellEditors.create(editorName, cellEvent);
};

},{}],25:[function(require,module,exports){
'use strict';

var Behavior = require('../Behavior');

/** @memberOf Local~
 * @default require('datasaur-local')
 * @summary Default data model.
 * @desc The default data model for newly instantiated `Hypergrid` objects without `DataModel` or `dataModel` options specified. Scheduled for eventual deprecation at which point one of the options will be required.
 */
var DefaultDataModel = require('datasaur-local');

var decorators = require('./decorators');


/**
 * This class mimics the {@link dataModelAPI}.
 * > This constructor (actually {@link Local#initialize}) will be called upon instantiation of this class or of any class that extends from this class. See {@link https://github.com/joneit/extend-me|extend-me} for more info.
 * @constructor
 * @extends Behavior
 */
var Local = Behavior.extend('Local', {

    initialize: function(grid, options) {
        this.setData(options);
    },

    /**
     * @summary Convenience getter/setter.
     * @desc Calls the data model's `getSchema`/`setSchema` methods.
     * @see {@link https://fin-hypergrid.github.io/doc/dataModelAPI.html#getSchema|getSchema}
     * @see {@link https://fin-hypergrid.github.io/doc/dataModelAPI.html#setSchema|setSchema}
     * @type {Array}
     * @memberOf Local#
     */
    get schema() {
        return this.dataModel.getSchema();
    },
    set schema(newSchema) {
        this.dataModel.setSchema(newSchema);
    },

    dataModelEventHandlers: require('./events').dataModelEventHandlers, // for adding additional event handlers

    createColumns: function() {
        this.super.createColumns.call(this, createColumns);
    },

    /**
     * @summary Build the `$rowProxy$` lazy getter collection based on current `schema`.
     *
     * @desc The `$rowProxy$` lazy getter collection is returned by the `getRow` fallback.
     *
     * `$rowProxy$` collection is a dataRow-like object (a hash of column values keyed by column name)
     * for the particular row whose index is in the `$y$` property.
     *
     * The row index can be conveniently set with a call to `fallbacks.getRow()`,
     * which sets the row index and returns the accessor itself.
     *
     * `$y$` is a "hidden" property, non-enumerable it won't show up in `Object.keys(...)`.
     *
     * This fallback implementation is "lazy": The enumerable members are all getters that invoke `getValue` and setters that invoke `setValue`.
     *
     * This function should be called each time a new schema is set.
     */
    createDataRowProxy: function() {
        var dataModel = this.dataModel,
            dataRowProxy = {};

        Object.defineProperty(dataRowProxy, '$y$', {
            enumerable: false, // not a real data field
            writable: true // set later on calls to fallbacks.getRow(y) to y
        });

        this.schema.forEach(function(columnSchema, columnIndex) {
            Object.defineProperty(dataRowProxy, columnSchema.name, {
                enumerable: true, // is a real data field
                get: function() {
                    return dataModel.getValue(columnIndex, this.$y$);
                },
                set: function(value) {
                    return dataModel.setValue(columnIndex, this.$y$, value);
                }
            });
        });

        dataModel.$rowProxy$ = dataRowProxy;
    },

    /**
     * Create a new data model
     * @param {object} [options]
     * @param {dataModelAPI} [options.dataModel] - A fully instantiated data model object.
     * @param {function} [options.DataModel=require('datasaur-local')] - Data model will be instantiated from this constructor unless `options.dataModel` was given.
     * @returns {boolean} `true` if the data model has changed.
     * @memberOf Local#
     */
    getNewDataModel: function(options) {
        var newDataModel;

        options = options || {};

        if (options.dataModel) {
            newDataModel = options.dataModel;
        } else if (options.DataModel) {
            newDataModel = new options.DataModel;
        } else {
            newDataModel = new DefaultDataModel;
        }

        return newDataModel;
    },

    /**
     * @summary Attach a data model object to the grid.
     * @desc Installs data model events, fallbacks, and hooks.
     *
     * Called from {@link Behavior#reset}.
     * @this {Behavior}
     * @param {object} [options]
     * @param {dataModelAPI} [options.dataModel] - A fully instantiated data model object.
     * @param {function} [options.DataModel=require('datasaur-local')] - Data model will be instantiated from this constructor unless `options.dataModel` was given.
     * @param {dataModelAPI} [options.metadata] - Passed to {@link dataModelAPI#setMetadataStore setMetadataStore}.
     * @returns {boolean} `true` if the data model has changed.
     * @memberOf Local#
     */
    resetDataModel: function(options) {
        var newDataModel = this.getNewDataModel(options),
            changed = newDataModel && newDataModel !== this.dataModel;

        if (changed) {
            this.dataModel = this.decorateDataModel(newDataModel, options);
            decorators.addDeprecationWarnings.call(this);
            decorators.addFriendlierDrillDownMapKeys.call(this);
        }

        return changed;
    },

    /**
     * Decorate data model object.
     * @see {@link module:decorators.injectPolyfills injectPolyfills}
     * @see {@link module:decorators.injectCode injectCode}
     * @see {@link module:decorators.injectDefaulthooks injectDefaulthooks}
     * @param {dataModelAPI} newDataModel
     * @param {dataModelAPI} [options.metadata] - Passed to {@link dataModelAPI#setMetadataStore setMetadataStore}.
     */
    decorateDataModel: function(newDataModel, options) {
        decorators.injectPolyfills(newDataModel);
        decorators.injectCode(newDataModel, this.grid);
        decorators.injectDefaulthooks(newDataModel);

        newDataModel.setMetadataStore(options && options.metadata);

        return newDataModel;
    },

    /**
     * @summary Map of drill down characters used by the data model.
     * @see {@link https://fin-hypergrid.github.io/doc/dataModelAPI.html#charMap|charMap}
     * @type {{OPEN:string, CLOSE:string, INDENT:string}}
     * @memberOf Local#
     */
    get charMap() {
        return this.dataModel.drillDownCharMap;
    },

    /**
     * @param {CellEvent|number} xOrCellEvent - Grid column coordinate.
     * @param {number} [y] - Grid row coordinate. Omit if `xOrCellEvent` is a CellEvent.
     * @param {dataModelAPI} [dataModel] - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid. If given, x and y are interpreted as data cell coordinates (unadjusted for scrolling). Does not default to the data subgrid, although you can provide it explicitly (`this.subgrids.lookup.data`).
     * @memberOf Local#
     */
    getValue: function(xOrCellEvent, y, dataModel) {
        if (typeof xOrCellEvent !== 'object') {
            var x = xOrCellEvent;
            xOrCellEvent = new this.CellEvent;
            if (dataModel) {
                xOrCellEvent.resetDataXY(x, y, dataModel);
            } else {
                xOrCellEvent.resetGridCY(x, y);
            }
        }
        return xOrCellEvent.value;
    },

    /**
     * @memberOf Local#
     * @desc update the data at point x, y with value
     * @return The data.
     * @param {CellEvent|number} xOrCellEvent - Grid column coordinate.
     * @param {number} [y] - Grid row coordinate. Omit if `xOrCellEvent` is a CellEvent.
     * @param {Object} value - The value to use. _When `y` omitted, promoted to 2nd arg._
     * @param {dataModelAPI} [dataModel] - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid. If given, x and y are interpreted as data cell coordinates (unadjusted for scrolling). Does not default to the data subgrid, although you can provide it explicitly (`this.subgrids.lookup.data`).
     * @return {boolean} Consumed.
     */
    setValue: function(xOrCellEvent, y, value, dataModel) {
        if (typeof xOrCellEvent === 'object') {
            value = y;
        } else {
            var x = xOrCellEvent;
            xOrCellEvent = new this.CellEvent;
            if (dataModel) {
                xOrCellEvent.resetDataXY(x, y, dataModel);
            } else {
                xOrCellEvent.resetGridCY(x, y);
            }
        }
        xOrCellEvent.value = value;
    },

    /**
     * @summary Calls `apply()` on the data model.
     * @see {@link https://fin-hypergrid.github.io/doc/dataModelAPI.html#reindex|reindex}
     * @memberOf Local#
     */
    reindex: function() {
        this.dataModel.apply();
    },

    /**
     * @summary Gets the number of rows in the data subgrid.
     * @see {@link https://fin-hypergrid.github.io/doc/dataModelAPI.html#getRowCount|getRowCount}
     * @memberOf Local#
     */
    getRowCount: function() {
        return this.dataModel.getRowCount();
    },

    /**
     * Retrieve a data row from the data model.
     * @see {@link https://fin-hypergrid.github.io/doc/dataModelAPI.html#getRow|getRow}
     * @memberOf Local#
     * @return {dataRowObject} The data row object at y index.
     * @param {number} y - the row index of interest
     */
    getRow: function(y) {
        return this.dataModel.getRow(y);
    },

    /**
     * Retrieve all data rows from the data model.
     * > Use with caution!
     * @see {@link https://fin-hypergrid.github.io/doc/dataModelAPI.html#getData|getData}
     * @return {dataRowObject[]}
     * @memberOf Local#
     */
    getData: function() {
        return this.dataModel.getData();
    },

    /**
     * @summary Calls `click` on the data model if column is a tree column.
     * @desc Sends clicked cell's coordinates to the data model.
     * @see {@link https://fin-hypergrid.github.io/doc/dataModelAPI.html#isDrillDown|isDrillDown}
     * @see {@link https://fin-hypergrid.github.io/doc/dataModelAPI.html#click|click}
     * @param {CellEvent} event
     * @returns {boolean} If click was in a drill down column and click on this row was "consumed" by the data model (_i.e., caused it's state to change).
     * @memberOf Local#
     */
    cellClicked: function(event) {
        return this.dataModel.isDrillDown(event.dataCell.x) &&
            this.dataModel.click(event.dataCell.y);
    },

    hasTreeColumn: function(columnIndex) {
        return this.grid.properties.showTreeColumn && this.dataModel.isDrillDown(columnIndex);
    }

});

/**
 * @this {Local}
 */
function createColumns() {
    this.schema.forEach(function(columnSchema) {
        this.addColumn(columnSchema);
    }, this);

    this.columnEnumSynchronize();
}

Local.prototype.mixIn(require('../columnEnum').mixin);

module.exports = Local;

},{"../Behavior":19,"../columnEnum":27,"./decorators":21,"./events":22,"datasaur-local":6}],26:[function(require,module,exports){
'use strict';

var assignOrDelete = require('../lib/assignOrDelete');


/**
 * Behavior.js mixes this module into its prototype.
 * @mixin
 */
exports.behaviorMixin = {
    /**
     * @summary Get the cell's own properties object.
     * @desc May be undefined because cells only have their own properties object when at lest one own property has been set.
     * @param {CellEvent|number} xOrCellEvent - Data x coordinate.
     * @param {number} [y] - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param {dataModelAPI} [dataModel=this.subgrids.lookup.data] - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     * @returns {undefined|object} The "own" properties of the cell at x,y in the grid. If the cell does not own a properties object, returns `undefined`.
     * @memberOf Behavior#
     */
    getCellOwnProperties: function(xOrCellEvent, y, dataModel) {
        if (arguments.length === 1) {
            // xOrCellEvent is cellEvent
            return xOrCellEvent.column.getCellOwnProperties(xOrCellEvent.dataCell.y, xOrCellEvent.subgrid);
        } else {
            // xOrCellEvent is x
            return this.getColumn(xOrCellEvent).getCellOwnProperties(y, dataModel);
        }
    },

    /**
     * @summary Get the properties object for cell.
     * @desc This is the cell's own properties object if found else the column object.
     *
     * If you are seeking a single specific property, consider calling {@link Behavior#getCellProperty} instead.
     * @param {CellEvent|number} xOrCellEvent - Data x coordinate.
     * @param {number} [y] - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param {dataModelAPI} [dataModel=this.subgrids.lookup.data] - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     * @return {object} The properties of the cell at x,y in the grid.
     * @memberOf Behavior#
     */
    getCellProperties: function(xOrCellEvent, y, dataModel) {
        if (arguments.length === 1) {
            // xOrCellEvent is cellEvent
            return xOrCellEvent.properties;
        } else {
            // xOrCellEvent is x
            return this.getColumn(xOrCellEvent).getCellProperties(y, dataModel);
        }
    },

    /**
     * @summary Return a specific cell property.
     * @desc If there is no cell properties object, defers to column properties object.
     * @param {CellEvent|number} xOrCellEvent - Data x coordinate.
     * @param {number} [y] - Grid row coordinate._ Omit when `xOrCellEvent` is a `CellEvent`._
     * @param {string} key - Name of property to get. _When `y` omitted, this param promoted to 2nd arg._
     * @param {dataModelAPI} [dataModel=this.subgrids.lookup.data] - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     * @return {object} The specified property for the cell at x,y in the grid.
     * @memberOf Behavior#
     */
    getCellProperty: function(xOrCellEvent, y, key, dataModel) {
        if (typeof xOrCellEvent === 'object') {
            key = y;
            return xOrCellEvent.properties[key];
        } else {
            return this.getColumn(xOrCellEvent).getCellProperty(y, key, dataModel);
        }
    },

    /**
     * @memberOf Behavior#
     * @desc update the data at point x, y with value
     * @param {CellEvent|number} xOrCellEvent - Data x coordinate.
     * @param {number} [y] - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param {Object} properties - Hash of cell properties. _When `y` omitted, this param promoted to 2nd arg._
     * @param {dataModelAPI} [dataModel=this.subgrids.lookup.data] - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     */
    setCellProperties: function(xOrCellEvent, y, properties, dataModel) {
        if (typeof xOrCellEvent === 'object') {
            properties = y;
            return xOrCellEvent.column.setCellProperties(xOrCellEvent.dataCell.y, properties, xOrCellEvent.subgrid);
        } else {
            return this.getColumn(xOrCellEvent).setCellProperties(y, properties, dataModel);
        }
    },

    /**
     * @memberOf Behavior#
     * @desc update the data at point x, y with value
     * @param {CellEvent|number} xOrCellEvent - Data x coordinate.
     * @param {number} [y] - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param {Object} properties - Hash of cell properties. _When `y` omitted, this param promoted to 2nd arg._
     * @param {dataModelAPI} [dataModel=this.subgrids.lookup.data] - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     */
    addCellProperties: function(xOrCellEvent, y, properties, dataModel) {
        if (typeof xOrCellEvent === 'object') {
            properties = y;
            return xOrCellEvent.column.addCellProperties(xOrCellEvent.dataCell.y, properties, xOrCellEvent.subgrid); // y omitted so y here is actually properties
        } else {
            return this.getColumn(xOrCellEvent).addCellProperties(y, properties, dataModel);
        }
    },

    /**
     * @summary Set a specific cell property.
     * @desc If there is no cell properties object, defers to column properties object.
     *
     * NOTE: For performance reasons, renderer's cell event objects cache their respective cell properties objects. This method accepts a `CellEvent` overload. Whenever possible, use the `CellEvent` from the renderer's cell event pool. Doing so will reset the cell properties object cache.
     *
     * If you use some other `CellEvent`, the renderer's `CellEvent` properties cache will not be automatically reset until the whole cell event pool is reset on the next call to {@link Renderer#computeCellBoundaries}. If necessary, you can "manually" reset it by calling {@link Renderer#resetCellPropertiesCache|resetCellPropertiesCache(yourCellEvent)} which searches the cell event pool for one with matching coordinates and resets the cache.
     *
     * The raw coordinates overload calls the `resetCellPropertiesCache(x, y)` overload for you.
     * @param {CellEvent|number} xOrCellEvent - `CellEvent` or data x coordinate.
     * @param {number} [y] - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param {string} key - Name of property to get. _When `y` omitted, this param promoted to 2nd arg._
     * @param value
     * @param {dataModelAPI} [dataModel=this.subgrids.lookup.data] - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     * @memberOf Behavior#
     */
    setCellProperty: function(xOrCellEvent, y, key, value, dataModel) {
        var cellOwnProperties;
        if (typeof xOrCellEvent === 'object') {
            value = key;
            key = y;
            cellOwnProperties = xOrCellEvent.setCellProperty(key, value);
        } else {
            cellOwnProperties = this.getColumn(xOrCellEvent).setCellProperty(y, key, value, dataModel);
            this.grid.renderer.resetCellPropertiesCache(xOrCellEvent, y, dataModel);
        }
        return cellOwnProperties;
    }
};

/**
 * Column.js mixes this module into its prototype.
 * @mixin
 */
exports.columnMixin = {

    /**
     * @summary Get the properties object for cell.
     * @desc This is the cell's own properties object if found; else the column object.
     *
     * If you are seeking a single specific property, consider calling {@link Column#getCellProperty} instead (which calls this method).
     * @param {number} rowIndex - Data row coordinate.
     * @return {object} The properties of the cell at x,y in the grid.
     * @memberOf Column#
     */
    getCellProperties: function(rowIndex, dataModel) {
        return this.getCellOwnProperties(rowIndex, dataModel) || this.properties;
    },

    /**
     * @param {number} rowIndex - Data row coordinate.
     * @param {object|undefined} properties - Hash of cell properties. If `undefined`, this call is a no-op.
     * @returns {*}
     * @memberOf Column#
     */
    setCellProperties: function(rowIndex, properties, dataModel) {
        if (properties) {
            return assignOrDelete(newCellPropertiesObject.call(this, rowIndex, dataModel), properties);
        }
    },

    /**
     * @param {number} rowIndex - Data row coordinate.
     * @param {object|undefined} properties - Hash of cell properties. If `undefined`, this call is a no-op.
     * @returns {object} Cell's own properties object, which will be created by this call if it did not already exist.
     * @memberOf Column#
     */
    addCellProperties: function(rowIndex, properties, dataModel) {
        if (properties) {
            return assignOrDelete(getCellPropertiesObject.call(this, rowIndex, dataModel), properties);
        }
    },

    /**
     * @summary Get the cell's own properties object.
     * @desc Due to memory constraints, we don't create a cell properties object for every cell.
     *
     * If the cell has its own properties object, it:
     * * was created by a previous call to `setCellProperties` or `setCellProperty`
     * * has the column properties object as its prototype
     * * is returned
     *
     * If the cell does not have its own properties object, this method returns `null`.
     *
     * Call this method only when you need to know if the the cell has its own properties object; otherwise call {@link Column#getCellProperties|getCellProperties}.
     * @param {number} rowIndex - Data row coordinate.
     * @returns {null|object} The "own" properties of the cell at x,y in the grid. If the cell does not own a properties object, returns `null`.
     * @memberOf Column#
     */
    getCellOwnProperties: function(rowIndex, dataModel) {
        var metadata;
        return (
            // this.index >= 0 && // no cell props on row handle cells
            (metadata = (dataModel || this.dataModel).getRowMetadata(rowIndex)) && // no cell props on non-existent rows
            metadata && metadata[this.name] ||
            null // null means not previously created
        );
    },

    deleteCellOwnProperties: function(rowIndex, dataModel) {
        dataModel = dataModel || this.dataModel;
        var metadata = dataModel.getRowMetadata(rowIndex);
        if (metadata) {
            delete metadata[this.name];
            if (Object.keys(metadata).length === 0) {
                dataModel.setRowMetadata(rowIndex);
            }
        }
    },

    /**
     * @summary Return a specific cell property.
     * @desc If there is no cell properties object, defers to column properties object.
     * @param {number} rowIndex - Data row coordinate.
     * @param {string} key
     * @return {object} The specified property for the cell at x,y in the grid.
     * @memberOf Column#
     */
    getCellProperty: function(rowIndex, key, dataModel) {
        return this.getCellProperties(rowIndex, dataModel)[key];
    },

    /**
     * @param {number} rowIndex - Data row coordinate.
     * @param {string} key
     * @param value
     * @returns {object} Cell's own properties object, which will be created by this call if it did not already exist.
     * @memberOf Column#
     */
    setCellProperty: function(rowIndex, key, value, dataModel) {
        var cellProps = getCellPropertiesObject.call(this, rowIndex, dataModel);
        cellProps[key] = value;
        return cellProps;
    },

    deleteCellProperty: function(rowIndex, key, dataModel) {
        var cellProps = this.getCellOwnProperties(rowIndex, dataModel);
        if (cellProps) {
            delete cellProps[key];
        }
    },

    /**
     * Clear all cell properties from all cells in this column.
     * @memberOf Column#
     */
    clearAllCellProperties: function() {
        this.behavior.subgrids.forEach(function(dataModel) {
            for (var y = dataModel.getRowCount(); y--;) {
                this.deleteCellOwnProperties(y, dataModel);
            }
        }, this);
    }
};

/**
 * @todo: Theoretically setData should call this method to ensure each cell's persisted properties object is properly recreated with prototype set to its column's properties object.
 * @this {Column}
 * @param {number} rowIndex - Data row coordinate.
 * @returns {object}
 * @private
 */
function getCellPropertiesObject(rowIndex, dataModel) {
    return this.getCellOwnProperties(rowIndex, dataModel) || newCellPropertiesObject.call(this, rowIndex, dataModel);
}

/**
 * @this {Column}
 * @param {number} rowIndex - Data row coordinate.
 * @returns {object}
 * @private
 */
function newCellPropertiesObject(rowIndex, dataModel) {
    var metadata = (dataModel || this.dataModel).getRowMetadata(rowIndex, null),
        props = this.properties;

    switch (this._index) {
        case this.behavior.treeColumnIndex:
            props = props.treeHeader;
            break;
        case this.behavior.rowColumnIndex:
            props = props.rowHeader;
            break;
    }

    return (metadata[this.name] = Object.create(props));
}

},{"../lib/assignOrDelete":71}],27:[function(require,module,exports){
'use strict';

// `columnEnum` et al, have been deprecated as of 3.0.0 in favor of accessing column schema
// through .schema, .columns, and .allColumns, all of which now sport self-referential dictionaries.
// To finally remove, delete this file and all lines using `_columnEnum`

var ArrayDecorator = require('synonomous');

var warned = {};

var columnEnumKey = function() {};
var columnEnumDecorators = {};

function warnColumnEnumDeprecation() {
    if (!warned.columnEnumDecorators) {
        console.warn('.columnEnumDecorators and .columnEnumKey have both been deprecated as of v3.0.0 and no longer have any meaning. (Will be removed in a future release.) Note that .columnEnum[propName] is also deprecated in favor of either .getColumns()[propName].index or .schema[propName].index.');
        warned.columnEnumDecorators = true;
    }
}

exports.mixin = {
    columnEnumSynchronize: function() {
        var columnEnum = this._columnEnum || (this._columnEnum = {}),
            allColumns = this.allColumns,
            arrayDecorator = new ArrayDecorator({ transformations: ['verbatim', 'toCamelCase', 'toAllCaps'] }),
            dict = arrayDecorator.decorateArray(allColumns.slice());

        dict.length = 0;
        Object.assign(columnEnum, dict);

        // clean up
        Object.keys(columnEnum).forEach(function(key) {
            if (!(key in dict)) {
                delete columnEnum[key];
            }
        });
    },

    get columnEnum() {
        if (!warned.columnEnum) {
            console.warn('.columnEnum[propName] has been deprecated as of v3.0.0 in favor of either .getColumns()[propName].index or .schema[propName].index. (Will be removed in a future release.)');
            warned.columnEnum = true;
        }
        return this._columnEnum;
    },

    get columnEnumKey() {
        warnColumnEnumDeprecation();
        return columnEnumKey;
    },
    set columnEnumKey($) {
        warnColumnEnumDeprecation();
    },

    get columnEnumDecorators() {
        warnColumnEnumDeprecation();
        return columnEnumDecorators;
    },
    set columnEnumDecorators($) {
        warnColumnEnumDeprecation();
    }
};

},{"synonomous":101}],28:[function(require,module,exports){
'use strict';

/**
 * @this {Column}
 * @returns {object}
 * @memberOf Column#
 */
function createColumnProperties() {
    var column = this,
        tableState = column.behavior.grid.properties,
        properties;

    properties = Object.create(tableState, {

        index: { // read-only (no setter)
            get: function() {
                return column.index;
            }
        },

        name: { // read-only (no setter)
           get: function() {
                return column.name;
            }
        },

        field: { // read-only (no setter)
            get: function() {
                return column.name;
            }
        },

        columnName: { // read-only (no setter)
            get: function() {
                return column.name;
            }
        },

        header: {
            get: function() {
                return column.header;
            },
            set: function(header) {
                if (this !== column.properties) {
                    tableState.header = header; // throws an error
                }
                column.header = header;
            }
        },

        type: {
            get: function() {
                return column.type;
            },
            set: function(type) {
                if (this !== column.properties) {
                    tableState.type = type; // throws an error
                }
                column.type = type;
            }
        },

        calculator: {
            get: function() {
                return column.calculator;
            },
            set: function(calculator) {
                if (this !== column.properties) {
                    tableState.calculator = calculator; // throws an error
                }
                column.calculator = calculator;
            }
        },

        toJSON: {
            // although we don't generally want header, type, and calculator to be enumerable, we do want them to be serializable
            value: function() {
                return Object.assign({
                    header: this.header,
                    type: this.type,
                    calculator: this.calculator
                }, this);
            }
        }

    });

    Object.defineProperties(properties, {
        rowHeader: { value: Object.create(properties, createColumnProperties.rowHeaderDescriptors) },
        treeHeader: { value: Object.create(properties, createColumnProperties.treeHeaderDescriptors) },
        columnHeader: { value: Object.create(properties, createColumnProperties.columnHeaderDescriptors) },
        filterProperties: { value: Object.create(properties, createColumnProperties.filterDescriptors) }
    });

    return properties;
}

createColumnProperties.treeHeaderDescriptors = {
    font: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.treeHeaderFont;
        },
        set: function(value) {
            this.treeHeaderFont = value;
        }
    },
    color: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.treeHeaderColor;
        },
        set: function(value) {
            this.treeHeaderColor = value;
        }
    },
    backgroundColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.treeHeaderBackgroundColor;
        },
        set: function(value) {
            this.treeHeaderBackgroundColor = value;
        }
    },
    foregroundSelectionFont: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.treeHeaderForegroundSelectionFont;
        },
        set: function(value) {
            this.treeHeaderForegroundSelectionFont = value;
        }
    },
    foregroundSelectionColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.treeHeaderForegroundSelectionColor;
        },
        set: function(value) {
            this.treeHeaderForegroundSelectionColor = value;
        }
    },
    renderer: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.treeRenderer;
        },
        set: function(value) {
            this.treeRenderer = value;
        }
    },
    backgroundSelectionColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.treeHeaderBackgroundSelectionColor;
        },
        set: function(value) {
            this.treeHeaderBackgroundSelectionColor = value;
        }
    }
    //leftIcon: undefined
};

createColumnProperties.rowHeaderDescriptors = {
    font: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.rowHeaderFont;
        },
        set: function(value) {
            this.rowHeaderFont = value;
        }
    },
    color: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.rowHeaderColor;
        },
        set: function(value) {
            this.rowHeaderColor = value;
        }
    },
    backgroundColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.rowHeaderBackgroundColor;
        },
        set: function(value) {
            this.rowHeaderBackgroundColor = value;
        }
    },
    foregroundSelectionFont: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.rowHeaderForegroundSelectionFont;
        },
        set: function(value) {
            this.rowHeaderForegroundSelectionFont = value;
        }
    },
    foregroundSelectionColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.rowHeaderForegroundSelectionColor;
        },
        set: function(value) {
            this.rowHeaderForegroundSelectionColor = value;
        }
    },
    backgroundSelectionColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.rowHeaderBackgroundSelectionColor;
        },
        set: function(value) {
            this.rowHeaderBackgroundSelectionColor = value;
        }
    },
    leftIcon: {
        configurable: true,
        enumerable: true,
        get: function() {
            if (this.grid.properties.rowHeaderCheckboxes) {
                var result;
                if (this.isDataRow) {
                    result = this.isRowSelected ? 'checked' : 'unchecked';
                } else if (this.isHeaderRow) {
                    result = this.allRowsSelected ? 'checked' : 'unchecked';
                } else if (this.isFilterRow) {
                    result = 'filter-off';
                }
                return result;
            }
        },
        set: function(value) {
            // replace self with a simple instance var
            Object.defineProperty(this, 'leftIcon', {
                configurable: true,
                enumerable: true,
                writable: true,
                value: value
            });
        }
    }
};

createColumnProperties.filterDescriptors = {
    font: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.filterFont;
        },
        set: function(value) {
            this.filterFont = value;
        }
    },
    color: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.filterColor;
        },
        set: function(value) {
            this.filterColor = value;
        }
    },
    backgroundColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.filterBackgroundColor;
        },
        set: function(value) {
            this.filterBackgroundColor = value;
        }
    },
    foregroundSelectionColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.filterForegroundSelectionColor;
        },
        set: function(value) {
            this.filterForegroundSelectionColor = value;
        }
    },
    backgroundSelectionColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.filterBackgroundSelectionColor;
        },
        set: function(value) {
            this.filterBackgroundSelectionColor = value;
        }
    },
    halign: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.filterHalign;
        },
        set: function(value) {
            this.filterHalign = value;
        }
    },
    renderer: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.filterRenderer;
        },
        set: function(value) {
            this.filterRenderer = value;
        }
    },
    editor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.filterEditor;
        },
        set: function(value) {
            this.filterEditor = value;
        }
    },
    rightIcon: {
        configurable: true,
        enumerable: true,
        get: function() {
            var result;
            if (this.filterable) {
                result = this.filter ? 'filter-on' : 'filter-off';
            }
            return result;
        },
        set: function(value) {
            // replace self with a simple instance var
            Object.defineProperty(this, 'rightIcon', {
                configurable: true,
                enumerable: true,
                writable: true,
                value: value
            });
        }
    }
};

createColumnProperties.columnHeaderDescriptors = {
    font: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.columnHeaderFont;
        },
        set: function(value) {
            this.columnHeaderFont = value;
        }
    },
    color: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.columnHeaderColor;
        },
        set: function(value) {
            this.columnHeaderColor = value;
        }
    },
    backgroundColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.columnHeaderBackgroundColor;
        },
        set: function(value) {
            this.columnHeaderBackgroundColor = value;
        }
    },
    foregroundSelectionFont: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.columnHeaderForegroundSelectionFont;
        },
        set: function(value) {
            this.columnHeaderForegroundSelectionFont = value;
        }
    },
    foregroundSelectionColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.columnHeaderForegroundSelectionColor;
        },
        set: function(value) {
            this.columnHeaderForegroundSelectionColor = value;
        }
    },
    backgroundSelectionColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.columnHeaderBackgroundSelectionColor;
        },
        set: function(value) {
            this.columnHeaderBackgroundSelectionColor = value;
        }
    },
    halign: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.columnHeaderHalign;
        },
        set: function(value) {
            this.columnHeaderHalign = value;
        }
    },
    renderer: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.columnHeaderRenderer;
        },
        set: function(value) {
            this.columnHeaderRenderer = value;
        }
    },
    leftIcon: { writable: true, value: undefined},
    centerIcon: { writable: true, value: undefined},
    rightIcon: { writable: true, value: undefined},
};

/**
 * Column.js mixes this module into its prototype.
 * @mixin
 */
exports.mixin = {
    createColumnProperties: createColumnProperties
};

},{}],29:[function(require,module,exports){
'use strict';

/**
 * Behavior.js mixes this module into its prototype.
 * @mixin
 */
exports.mixin = {
    /**
     * @summary The total height of the "fixed rows."
     * @desc The total height of all (non-scrollable) rows preceding the (scrollable) data subgrid.
     * @memberOf Behavior#
     * @return {number} The height in pixels of the fixed rows area of the hypergrid, the total height of:
     * 1. All rows of all subgrids preceding the data subgrid.
     * 2. The first `fixedRowCount` rows of the data subgrid.
     */
    getFixedRowsHeight: function() {
        var subgrid, isData, r, R,
            subgrids = this.subgrids,
            height = 0;

        for (var i = 0; i < subgrids.length && !isData; ++i) {
            subgrid = subgrids[i];
            isData = subgrid.isData;
            R = isData ? this.grid.properties.fixedRowCount : subgrid.getRowCount();
            for (r = 0; r < R; ++r) {
                height += this.getRowHeight(r, subgrid);
            }
        }

        return height;
    },

    /**
     * @memberOf Behavior#
     * @param {number|CellEvent} yOrCellEvent - Data row index local to `dataModel`; or a `CellEvent` object.
     * @param {boolean} [prototype] - Prototype for a new properties object when one does not already exist. If you don't define this and one does not already exist, this call will return `undefined`.
     * Typical defined value is `null`, which creates a plain object with no prototype, or `Object.prototype` for a more "natural" object.
     * _(Required when 3rd param provided.)_
     * @param {dataModelAPI} [dataModel=this.dataModel] - This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
     * @returns {object|undefined} The row properties object which will be one of:
     * * object - existing row properties object or new row properties object created from `prototype`; else
     * * `false` - row found but no existing row properties object and `prototype` was not defined; else
     * * `undefined` - no such row
     */
    getRowProperties: function(yOrCellEvent, prototype, dataModel) {
        if (typeof yOrCellEvent === 'object') {
            dataModel = yOrCellEvent.subgrid;
            yOrCellEvent = yOrCellEvent.dataCell.y;
        }

        var metadata = (dataModel || this.dataModel).getRowMetadata(yOrCellEvent, prototype === undefined ? undefined : null);
        return metadata && (metadata.__ROW || prototype !== undefined && (metadata.__ROW = Object.create(prototype)));
    },

    /**
     * Reset the row properties in its entirety to the given row properties object.
     * @memberOf Behavior#
     * @param {number|CellEvent} yOrCellEvent - Data row index local to `dataModel`; or a `CellEvent` object.
     * @param {object|undefined} properties - The new row properties object. If `undefined`, this call is a no-op.
     * @param {dataModelAPI} [dataModel=this.dataModel] - This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
     */
    setRowProperties: function(yOrCellEvent, properties, dataModel) {
        if (!properties) {
            return;
        }

        if (typeof yOrCellEvent === 'object') {
            dataModel = yOrCellEvent.subgrid;
            yOrCellEvent = yOrCellEvent.dataCell.y;
        }

        var metadata = (dataModel || this.dataModel).getRowMetadata(yOrCellEvent, null);
        if (metadata) {
            metadata.__ROW = Object.create(this.rowPropertiesPrototype);
            this.addRowProperties(yOrCellEvent, properties, dataModel, metadata.__ROW);
            this.stateChanged();
        }
    },

    /**
     * Sets a single row property on a specific individual row.
     * @memberOf Behavior#
     * @param {number|CellEvent} yOrCellEvent - Data row index local to `dataModel`; or a `CellEvent` object.
     * @param {string} key - The property name.
     * @param value - The new property value.
     * @param {dataModelAPI} [dataModel=this.dataModel] - This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
     */
    setRowProperty: function(yOrCellEvent, key, value, dataModel) {
        var rowProps;
        var isHeight = (key === 'height');

        if (value !== undefined) {
            rowProps = this.getRowProperties(yOrCellEvent, this.rowPropertiesPrototype, dataModel);
            rowProps[key] = value;
        } else {
            // only try to undefine key if row props object exists; no point in creating it just to delete a non-existant key
            rowProps = this.getRowProperties(yOrCellEvent, undefined, dataModel);
            if (rowProps) {
                delete rowProps[isHeight ? '_height' : key];
            }
        }

        if (isHeight) {
            this.shapeChanged();
        } else {
            this.stateChanged();
        }
    },

    /**
     * Add all the properties in the given row properties object to the row properties.
     * @memberOf Behavior#
     * @param {number|CellEvent} yOrCellEvent - Data row index local to `dataModel`; or a `CellEvent` object.
     * @param {object|undefined} properties - An object containing new property values(s) to assign to the row properties. If `undefined`, this call is a no-op.
     * @param {dataModelAPI} [dataModel=this.dataModel] - This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
     */
    addRowProperties: function(yOrCellEvent, properties, dataModel, rowProps) {
        if (!properties) {
            return;
        }

        var isHeight, hasHeight;

        rowProps = rowProps || this.getRowProperties(yOrCellEvent, this.rowPropertiesPrototype, dataModel);

        if (rowProps) {
            Object.keys(properties).forEach(function(key) {
                var value = properties[key];
                if (value !== undefined) {
                    rowProps[key] = value;
                } else {
                    isHeight = key === 'height';
                    delete rowProps[isHeight ? '_height' : key];
                    hasHeight = hasHeight || isHeight;
                }
            });

            if (hasHeight) {
                this.shapeChanged();
            } else {
                this.stateChanged();
            }
        }
    },

    /**
     * @memberOf Behavior#
     * @param {number} yOrCellEvent - Data row index local to `dataModel`.
     * @param {dataModelAPI} [dataModel=this.dataModel]
     * @returns {number} The row height in pixels.
     */
    getRowHeight: function(yOrCellEvent, dataModel) {
        var rowProps = this.getRowProperties(yOrCellEvent, undefined, dataModel);
        return rowProps && rowProps.height || this.grid.properties.defaultRowHeight;
    },

    /**
     * @memberOf Behavior#
     * @desc set the pixel height of a specific row
     * @param {number} yOrCellEvent - Data row index local to dataModel.
     * @param {number} height - pixel height
     * @param {dataModelAPI} [dataModel=this.dataModel]
     */
    setRowHeight: function(yOrCellEvent, height, dataModel) {
        this.setRowProperty(yOrCellEvent, 'height', height, dataModel);
    }
};


exports.rowPropertiesPrototypeDescriptors = {
    height: {
        enumerable: true,
        get: function() {
            return this._height || this.defaultRowHeight;
        },
        set: function(height) {
            height = Math.max(5, Math.ceil(height));
            if (isNaN(height)) {
                height = undefined;
            }
            if (height !== this._height) {
                if (!height) {
                    delete this._height;
                } else {
                    // Define `_height` as non-enumerable so won't be included in output of saveState.
                    // (Instead the `height` getter is explicitly invoked and the result is included.)
                    Object.defineProperty(this, '_height', { value: height, configurable: true });
                }
                this.grid.behaviorStateChanged();
            }
        }
    }
};

},{}],30:[function(require,module,exports){
'use strict';

var dataModels = require('../dataModels/index');

/** @typedef subgridConstructorRef
 * @summary Type definition.
 * @desc One of:
 * * **`function` type** - Assumed to already be a data model constructor.
 * * **`string` type** - The name of a data model "class" (constructor) registered in the {@link src/dataModels} namespace. Used to look up the constructor in the namespace.
 */

/** @typedef subgridSpec
 * @summary Type definition.
 * @desc One of:
 * * **`object` type** _(except when an array)_ - Assumed to be a reference to an already-instantiated data model. Used as is.
 * * **`'data'` special value** - Set to the data subgrid (_i.e.,_ the behavior's already-instantiated data model).
 * * **{@link subgridConstructorRef}** _(see)_ - The constructor ref is resolved and called with the `new` keyword + a reference to the grid as the sole parameter.
 * * **`Array` object** — Accommodates data model constructor arguments. The constructor ref is resolved and called with the `new` keyword + a reference to the grid as the first parameter + the remaining elements as additional parameters. (If you don't have remaining elements, don't give an array here; just provide a simple `subgridConstructorRef` instead.) The array should have two or more elements:
 *   * The first element is a {@link subgridConstructorRef}.
 *   * Remaining elements are used as additional parameters to the constructor.
 */

/**
 * Behavior.js mixes this module into its prototype.
 * @mixin
 */
exports.mixin = {
    /**
     * An array where each element represents a subgrid to be rendered in the hypergrid.
     *
     * The list should always include at least one "data" subgrid, typically {@link Behavior#dataModel|dataModel}.
     * It may also include zero or more other types of subgrids such as header, filter, and summary subgrids.
     *
     * This object also sports a dictionary of subgrids in `lookup` property where each dictionary key is one of:
     * * **`subgrid.name`** (for those that have a defined name, which is presumed to be unique)
     * * **`subgrid.type`** (not unique, so if you plan on having multiple, name them!)
     * * **`'data'`** for the (one and only) data subgrid when unnamed (note that data subgrids have no `type`)
     *
     * The setter:
     * * "Enlivens" any constructors (see {@link Behavior~createSubgrid|createSubgrid} for details).
     * * Reconstructs the dictionary.
     * * Calls {@link Behavior#shapeChanged|shapeChanged()}.
     *
     * @param {subgridSpec[]} subgridSpecs
     *
     * @type {dataModelAPI[]}
     *
     * @memberOf Behavior#
     */
    set subgrids(subgridSpecs) {
        var subgrids = this._subgrids = [];

        subgrids.lookup = {};

        subgridSpecs.forEach(function(spec) {
            if (spec) {
                subgrids.push(this.createSubgrid(spec));
            }
        }, this);

        this.shapeChanged();
    },
    get subgrids() {
        return this._subgrids;
    },

    /**
     * @summary Maps a `subgridSpec` to a data model.
     * @desc The spec may describe either an existing data model, or a constructor for a new data model.
     * @param {subgridSpec} spec
     * @returns {dataModelAPI} A data model.
     * @memberOf Behavior#
     */
    createSubgrid: function(spec, args) {
        var subgrid, Constructor, variableArgArray;

        if (spec === 'data') {
            subgrid = this.dataModel;
        } else if (spec instanceof Array && spec.length) {
            Constructor = derefSubgridRef.call(this, spec[0]);
            variableArgArray = spec.slice(1);
            subgrid = this.createApply(Constructor, variableArgArray, undefined, { grid: this.grid });
            subgrid = this.decorateDataModel(subgrid);
        } else if (typeof spec === 'object') {
            subgrid = spec;
        } else {
            Constructor = derefSubgridRef.call(this, spec);
            variableArgArray = Array.prototype.slice.call(arguments, 1);
            subgrid = this.createApply(Constructor, variableArgArray, undefined, { grid: this.grid });
            subgrid = this.decorateDataModel(subgrid);
        }

        // undefined type is data
        if (!subgrid.type) {
            subgrid.type = 'data';
        }

        // make dictionary lookup entry
        var key = subgrid.type === 'data' && subgrid.type || subgrid.name || subgrid.type;
        this._subgrids.lookup[key] = this._subgrids.lookup[key] || subgrid; // only save first with this key

        // make isType boolean
        subgrid['is' + subgrid.type[0].toUpperCase() + subgrid.type.substr(1)] = true;

        return subgrid;
    },

    /**
     * @summary Gets the number of "header rows".
     * @desc Defined as the sum of all rows in all subgrids before the (first) data subgrid.
     * @memberOf Local.prototype
     */
    getHeaderRowCount: function() {
        var result = 0;

        this.subgrids.find(function(subgrid) {
            if (subgrid.isData) {
                return true; // stop
            }
            result += subgrid.getRowCount();
        });

        return result;
    },

    /**
     * @summary Gets the number of "footer rows".
     * @desc Defined as the sum of all rows in all subgrids after the (last) data subgrid.
     * @memberOf Local.prototype
     */
    getFooterRowCount: function() {
        var gotData;
        return this.subgrids.reduce(function(rows, subgrid) {
            if (gotData && !subgrid.isData) {
                rows += subgrid.getRowCount();
            } else {
                gotData = subgrid.isData;
            }
            return rows;
        }, 0);
    },

    /**
     * @summary Gets the total number of logical rows.
     * @desc Defined as the sum of all rows in all subgrids.
     * @memberOf Local.prototype
     */
    getLogicalRowCount: function() {
        return this.subgrids.reduce(function(rows, subgrid) {
            return (rows += subgrid.getRowCount());
        }, 0);
    }
};

/**
 * @summary Resolves a subgrid constructor reference.
 * @desc The ref is resolved to a data model constructor.
 * @this {Behavior}
 * @param {subgridConstructorRef} ref
 * @returns {DataModel} A data model constructor.
 * @memberOf Behavior~
 */
function derefSubgridRef(ref) {
    var Constructor;
    switch (typeof ref) {
        case 'string':
            Constructor = dataModels.get(ref);
            break;
        case 'function':
            Constructor = ref;
            break;
        default:
            throw new this.HypergridError('Expected subgrid ref to be registered name or constructor, but found ' + typeof ref + '.');
    }
    return Constructor;
}

},{"../dataModels/index":50}],31:[function(require,module,exports){
/* eslint-env browser */

'use strict';

var Base = require('../Base');
var effects = require('../lib/DOM/effects');
var Localization = require('../lib/Localization');

/**
 * @constructor
 * @desc Displays a cell editor and handles cell editor interactions.
 *
 * > This constructor (actually `initialize`) will be called upon instantiation of this class or of any class that extends from this class. See {@link https://github.com/joneit/extend-me|extend-me} for more info.
 *
 * Instances of `CellEditor` are used to render an HTML element on top of the grid exactly within the bound of a cell for purposes of editing the cell value.
 *
 * Extend this base class to implement your own cell editor.
 *
 * @param grid
 * @param {CellEditor#renderConfig} options - Properties listed below + arbitrary mustache "variables" for merging into template.
 * @param {Point} options.editPoint - Deprecated; use `options.gridCell`.
 * @param {string} [options.format] - Name of a localizer with which to override prototype's `localizer` property.
 */
var CellEditor = Base.extend('CellEditor', {

    initialize: function(grid, options) {
        // Mix in all enumerable properties for mustache use, typically `column` and `format`.
        for (var key in options) {
            this[key] = options[key];
        }

        this.event = options;

        var value = grid.behavior.getValue(this.event);
        if (value instanceof Array) {
            value = value[1]; //it's a nested object
        }

        /**
         * my instance of hypergrid
         * @type {Hypergrid}
         * @memberOf CellEditor.prototype
         */
        this.grid = grid;

        this.grid.cellEditor = this;

        this.locale = grid.localization.locale; // for template's `lang` attribute

        // Only override cell editor's default 'null' localizer if the custom localizer lookup succeeds.
        // Failure is when it returns the default ('string') localizer when 'string' is not what was requested.
        var localizer = this.grid.localization.get(options.format); // try to get named localizer
        if (!(localizer === Localization.prototype.string || options.format === 'string')) {
            this.localizer = localizer;
        }

        this.initialValue = value;

        var container = document.createElement('DIV');
        container.innerHTML = this.grid.modules.templater.render(this.template, this);

        /**
         * This object's input control, one of:
         * * *input element* - an `HTMLElement` that has a `value` attribute, such as `HTMLInputElement`, `HTMLButtonElement`, etc.
         * * *container element* - an `HTMLElement` containing one or more input elements, only one of which contains the editor value.
         *
         * For access to the input control itself (which may or may not be the same as `this.el`), see `this.input`.
         *
         * @type {HTMLElement}
         * @default null
         * @memberOf CellEditor.prototype
         */
        this.el = container.firstChild;

        this.input = this.el;

        this.errors = 0;

        var self = this;
        this.el.addEventListener('keyup', this.keyup.bind(this));
        this.el.addEventListener('keydown', function(e) {
            if (e.keyCode === 9) {
                // prevent TAB from leaving input control
                e.preventDefault();
            }
            grid.fireSyntheticEditorKeyDownEvent(self, e);
        });
        this.el.addEventListener('keypress', function(e) {
            grid.fireSyntheticEditorKeyPressEvent(self, e);
        });
        this.el.addEventListener('mousedown', function(e) {
            self.onmousedown(e);
        });
    },

    // If you override this method, be sure to call it as a final step (or call stopPropagation yourself).
    onmousedown: function(event) {
        event.stopPropagation(); // Catch mousedown here before it gets to the document listener defined in Hypergrid().
    },

    localizer: Localization.prototype.null,

    specialKeyups: {
        //0x08: 'clearStopEditing', // backspace
        0x09: 'stopEditing', // tab
        0x0d: 'stopEditing', // return/enter
        0x1b: 'cancelEditing' // escape
    },

    keyup: function(e) {
        var grid = this.grid,
            cellProps = this.event.properties,
            feedbackCount = cellProps.feedbackCount,
            keyChar = grid.canvas.getKeyChar(e),
            specialKeyup,
            stopped;

        // STEP 1: Call the special key handler as needed
        if (
            (specialKeyup = this.specialKeyups[e.keyCode]) &&
            (stopped = this[specialKeyup](feedbackCount))
        ) {
            grid.repaint();
        }

        // STEP 2: If this is a possible "nav key" consumable by CellSelection#handleKeyDown, try to stop editing and send it along
        if (cellProps.mappedNavKey(keyChar, e.ctrlKey)) {
            if (
                !specialKeyup &&
                // We didn't try to stop editing above so try to stop it now
                (stopped = this.stopEditing(feedbackCount))
            ) {
                grid.repaint();
            }

            if (stopped) {
                // Editing successfully stopped
                // -> send the event down the feature chain
                var finEvent = grid.canvas.newEvent(e, 'fin-editor-keydown', {
                    grid: grid,
                    alt: e.altKey,
                    ctrl: e.ctrlKey,
                    char: keyChar,
                    code: e.charCode,
                    key: e.keyCode,
                    meta: e.metaKey,
                    shift: e.shiftKey,
                    identifier: e.key,
                    editor: this
                });
                grid.delegateKeyDown(finEvent);
            }
        }

        this.grid.fireSyntheticEditorKeyUpEvent(this, e);

        return stopped;
    },

    /**
     * if true, check that the editor is in the right location
     * @type {boolean}
     * @default false
     * @memberOf CellEditor.prototype
     */
    checkEditorPositionFlag: false,

    /**
     * @memberOf CellEditor.prototype
     * @desc This function is a callback from the fin-hypergrid.   It is called after each paint of the canvas.
     */
    gridRenderedNotification: function() {
        this.checkEditor();
    },

    /**
     * @memberOf CellEditor.prototype
     * @desc scroll values have changed, we've been notified
     */
    scrollValueChangedNotification: function() {
        this.checkEditorPositionFlag = true;
    },

    /**
     * @memberOf CellEditor.prototype
     * @desc move the editor to the current editor point
     */
    moveEditor: function() {
        this.setBounds(this.event.bounds);
    },

    beginEditing: function() {
        if (this.grid.fireRequestCellEdit(this.event, this.initialValue)) {
            this.checkEditorPositionFlag = true;
            this.checkEditor();
        }
    },

    /**
     * @summary Put the value into our editor.
     * @desc Formats the value and displays it.
     * The localizer's {@link localizerInterface#format|format} method will be called.
     *
     * Override this method if your editor has additional or alternative GUI elements.
     *
     * @param {object} value - The raw unformatted value from the data source that we want to edit.
     * @memberOf CellEditor.prototype
     */
    setEditorValue: function(value) {
        this.input.value = this.localizer.format(value);
    },

    /**
     * @memberOf CellEditor.prototype
     * @desc display the editor
     */
    showEditor: function() {
        this.el.style.display = 'inline';
    },

    /**
     * @memberOf CellEditor.prototype
     * @desc hide the editor
     */
    hideEditor: function() {
        this.el.style.display = 'none';
    },

    /** @summary Stops editing.
     * @desc Before saving, validates the edited value in two phases as follows:
     * 1. Call `validateEditorValue`. (Calls the localizer's `invalid()` function, if available.)
     * 2. Catch any errors thrown by the {@link CellEditor#getEditorValue|getEditorValue} method.
     *
     * **If the edited value passes both phases of the validation:**
     * Saves the edited value by calling the {@link CellEditor#saveEditorValue|saveEditorValue} method.
     *
     * **On validation failure:**
     * 1. If `feedback` was omitted, cancels editing, discarding the edited value.
     * 2. If `feedback` was provided, gives the user some feedback (see `feedback`, below).
     *
     * @param {number} [feedback] What to do on validation failure. One of:
     * * **`undefined`** - Do not show the error effect or the end effect. Just discard the value and close the editor (as if `ESC` had been typed).
     * * **`0`** - Just shows the error effect (see the {@link CellEditor#errorEffect|errorEffect} property).
     * * **`1`** - Shows the error feedback effect followed by the detailed explanation.
     * * `2` or more:
     *   1. Shows the error feedback effect
     *   2. On every `feedback` tries, shows the detailed explanation.
     * * If `undefined` (omitted), simply cancels editing without saving edited value.
     * * If 0, shows the error feedback effect (see the {@link CellEditor#errorEffect|errorEffect} property).
     * * If > 0, shows the error feedback effect _and_ calls the {@link CellEditor#errorEffectEnd|errorEffectEnd} method) every `feedback` call(s) to `stopEditing`.
     * @returns {boolean} Truthy means successful stop. Falsy means syntax error prevented stop. Note that editing is canceled when no feedback requested and successful stop includes (successful) cancel.
     * @memberOf CellEditor.prototype
     */
    stopEditing: function(feedback) {
        /**
         * @type {boolean|string|Error}
         */
        var error = this.validateEditorValue();

        if (!error) {
            try {
                var value = this.getEditorValue();
            } catch (err) {
                error = err;
            }
        }

        if (!error && this.grid.fireSyntheticEditorDataChangeEvent(this, this.initialValue, value)) {
            try {
                this.saveEditorValue(value);
            } catch (err) {
                error = err;
            }
        }

        if (!error) {
            this.hideEditor();
            this.grid.cellEditor = null;
            this.el.remove();
        } else if (feedback >= 0) { // false when `feedback` undefined
            this.errorEffectBegin(++this.errors % feedback === 0 && error);
        } else { // invalid but no feedback
            this.cancelEditing();
        }

        return !error;
    },

    /** @summary Cancels editing.
     * @returns {boolean} Successful. (Cancel is always successful.)
     */
    cancelEditing: function() {
        this.setEditorValue(this.initialValue);
        this.hideEditor();
        this.grid.cellEditor = null;
        this.el.remove();

        return true;
    },

    /**
     * Calls the effect function indicated in the {@link module:defaults.feedbackEffect|feedbackEffect} property, which triggers a series of CSS transitions.
     * @param {boolean|string|Error} [error] - If defined, call the {@link CellEditor#errorEffectEnd|errorEffectEnd} method at the end of the last effect transition with this error.
     * @memberOf CellEditor.prototype
     */
    errorEffectBegin: function(error) {
        var spec = this.grid.properties.feedbackEffect, // spec may e a string or an object with name and options props
            options = Object.assign({}, spec.options), // if spec is a string, spec.options will be undefined
            effect = effects[spec.name || spec]; // if spec is a string, spec.name will be undefined

        if (error) {
            options.callback = this.errorEffectEnd.bind(this, error);
        }

        if (effect) {
            effect.call(this, options);
        }
    },

    /**
     * This function expects to be passed an error. There is no point in calling this function if there is no error. Nevertheless, if called with a falsy `error`, returns without doing anything.
     * @this {CellEditor}
     * @param {boolean|string|Error} [error]
     */
    errorEffectEnd: function(error, options) {
        if (error) {
            var msg =
                'Invalid value. To resolve, do one of the following:\n\n' +
                '   * Correct the error and try again.\n' +
                '         - or -\n' +
                '   * Cancel editing by pressing the "esc" (escape) key.';

            error = error.message || error;

            if (typeof error !== 'string') {
                error = '';
            }

            if (this.localizer.expectation) {
                error = error ? error + '\n' + this.localizer.expectation : this.localizer.expectation;
            }

            if (error) {
                if (/[\n\r]/.test(error)) {
                    error = '\n' + error;
                    error = error.replace(/[\n\r]+/g, '\n\n   * ');
                }
                msg += '\n\nAdditional information about this error: ' + error;
            }

            setTimeout(function() { // allow animation to complete
                alert(msg); // eslint-disable-line no-alert
            });
        }
    },

    /**
     * @desc save the new value into the behavior (model)
     * @returns {boolean} Data changed and pre-cell-edit event was not canceled.
     * @memberOf CellEditor.prototype
     */
    saveEditorValue: function(value) {
        var save = (
            !(value && value === this.initialValue) && // data changed
            this.grid.fireBeforeCellEdit(this.event.gridCell, this.initialValue, value, this) // proceed
        );

        if (save) {
            this.grid.behavior.setValue(this.event, value);
            this.grid.fireAfterCellEdit(this.event.gridCell, this.initialValue, value, this);
        }

        return save;
    },

    /**
     * @summary Extract the edited value from the editor.
     * @desc De-format the edited string back into a primitive value.
     *
     * The localizer's {@link localizerInterface#parse|parse} method will be called on the text box contents.
     *
     * Override this method if your editor has additional or alternative GUI elements. The GUI elements will influence the primitive value, either by altering the edited string before it is parsed, or by transforming the parsed value before returning it.
     * @returns {object} the current editor's value
     * @memberOf CellEditor.prototype
     */
    getEditorValue: function() {
        return this.localizer.parse(this.input.value);
    },

    /**
     * If there is no validator on the localizer, returns falsy (not invalid; possibly valid).
     * @returns {boolean|string} Truthy value means invalid. If a string, this will be an error message. If not a string, it merely indicates a generic invalid result.
     */
    validateEditorValue: function() {
        return this.localizer.invalid && this.localizer.invalid(this.input.value);
    },

    /**
     * @summary Request focus for my input control.
     * @desc See GRID-95 "Scrollbar moves inward" for issue and work-around explanation.
     * @memberOf CellEditor.prototype
     */
    takeFocus: function() {
        var el = this.el,
            leftWas = el.style.left,
            topWas = el.style.top;

        el.style.left = el.style.top = 0; // work-around: move to upper left

        var x = window.scrollX, y = window.scrollY;
        this.input.focus();
        window.scrollTo(x, y);
        this.selectAll();

        el.style.left = leftWas;
        el.style.top = topWas;
    },

    /**
     * @memberOf CellEditor.prototype
     * @desc select everything
     */
    selectAll: nullPattern,

    /**
     * @memberOf CellEditor.prototype
     * @desc set the bounds of my input control
     * @param {rectangle} rectangle - the bounds to move to
     */
    setBounds: function(cellBounds) {
        var style = this.el.style;

        style.left = px(cellBounds.x);
        style.top = px(cellBounds.y);
        style.width = px(cellBounds.width);
        style.height = px(cellBounds.height);
    },

    /**
     * @desc check that the editor is in the correct location, and is showing/hidden appropriately
     * @memberOf CellEditor.prototype
     */
    checkEditor: function() {
        if (this.checkEditorPositionFlag) {
            this.checkEditorPositionFlag = false;
            if (this.event.isCellVisible) {
                this.setEditorValue(this.initialValue);
                this.attachEditor();
                this.moveEditor();
                this.showEditor();
                this.takeFocus();
            } else {
                this.hideEditor();
            }
        }
    },

    attachEditor: function() {
        this.grid.div.appendChild(this.el);
    },

    template: ''

});

function nullPattern() {}
function px(n) { return n + 'px'; }


module.exports = CellEditor;

},{"../Base":12,"../lib/DOM/effects":67,"../lib/Localization":68}],32:[function(require,module,exports){
'use strict';

var CellEditor = require('./CellEditor');

/**
 * As of spring 2016:
 * Functions well in Chrome and Firefox; unimplemented in Safari.
 * @constructor
 * @extends CellEditor
 */
var Color = CellEditor.extend('Color', {

    template: '<input type="color" lang="{{locale}}" style="{{style}}">'

});

module.exports = Color;

},{"./CellEditor":31}],33:[function(require,module,exports){
/* eslint-env browser */

'use strict';

var CellEditor = require('./CellEditor');

var isChromium = window.chrome,
    winNav = window.navigator,
    vendorName = winNav.vendor,
    isOpera = winNav.userAgent.indexOf('OPR') > -1,
    isIEedge = winNav.userAgent.indexOf('Edge') > -1,
    isIOSChrome = winNav.userAgent.match('CriOS'),
    isChrome = !isIOSChrome &&
        isChromium !== null &&
        isChromium !== undefined &&
        vendorName === 'Google Inc.' &&
        isOpera == false && isIEedge == false; // eslint-disable-line eqeqeq

/**
 * As of spring 2016:
 * Functions well in Chrome except no localization (day, month names; date format).
 * Unimplemented in Safari, Firefox, Internet Explorer.
 * This is a "snmart" control. It detects Chrome:
 * * If Chrome, uses chromeDate overrides format to that required by the value attribute, yyyy-mm-dd. (Note that this is not the format displayed in the control, which is always mm/dd/yyyy.)
 * * Otherwise uses localized date format _but_ falls back to a regular text box.
 * @constructor
 * @extends CellEditor
 */
var Date = CellEditor.extend('Date', {

    initialize: function(grid) {

        var localizerName,
            usesDateInputControl = isChrome;

        if (usesDateInputControl) {
            localizerName = 'chromeDate';
            this.template = '<input type="date">';
        } else {
            localizerName = 'date';
            this.template = '<input type="text" lang="{{locale}}">';

            this.selectAll = function() {
                var lastCharPlusOne = this.getEditorValue().length;
                this.input.setSelectionRange(0, lastCharPlusOne);
            };
        }

        this.localizer = grid.localization.get(localizerName);
    }
});


module.exports = Date;

},{"./CellEditor":31}],34:[function(require,module,exports){
'use strict';

var Textfield = require('./Textfield');

/**
 * Functions well in Chrome, Safari, Firefox, and Internet Explorer.
 * @constructor
 * @extends Textfield
 */
var Number = Textfield.extend('Number', {

    initialize: function(grid) {
        this.localizer = grid.localization.get('number');
    }

});

module.exports = Number;

},{"./Textfield":37}],35:[function(require,module,exports){
'use strict';

var CellEditor = require('./CellEditor');

/**
 * @constructor
 * @extends CellEditor
 */
var Slider = CellEditor.extend('Slider', {

    template: '<input type="range" lang="{{locale}}" style="{{style}}">'

});

module.exports = Slider;

},{"./CellEditor":31}],36:[function(require,module,exports){
'use strict';

var CellEditor = require('./CellEditor');

/**
 * @constructor
 * @extends CellEditor
 */
var Spinner = CellEditor.extend('Spinner', {

    template: '<input type="number" lang="{{locale}}" style="{{style}}">'

});

module.exports = Spinner;

},{"./CellEditor":31}],37:[function(require,module,exports){
'use strict';

var CellEditor = require('./CellEditor');
var Localization = require('../lib/Localization');


/**
 * As of spring 2016:
 * Functions well in Chrome, Safari, Firefox, and Internet Explorer.
 * @constructor
 * @extends CellEditor
 */
var Textfield = CellEditor.extend('Textfield', {

    template: '<input type="text" lang="{{locale}}" class="hypergrid-textfield" style="{{style}}">',

    initialize: function() {
        this.input.style.textAlign = this.event.properties.halign;
    },

    localizer: Localization.prototype.string,

    selectAll: function() {
        this.input.setSelectionRange(0, this.input.value.length);
    }
});

module.exports = Textfield;

},{"../lib/Localization":68,"./CellEditor":31}],38:[function(require,module,exports){
'use strict';

var Registry = require('../lib/Registry');


var warnedBaseClass;

/**
 * @classdesc Registry of cell editor constructors.
 * @constructor
 */
var CellEditors = Registry.extend('CellEditors', {

    BaseClass: require('./CellEditor'), // abstract base class

    initialize: function() {
        // preregister the standard cell editors
        this.add(require('./Color'));
        this.add(require('./Date'));
        this.add(require('./Number'));
        this.add(require('./Slider'));
        this.add(require('./Spinner'));
        this.add(require('./Textfield'));
    },

    get: function(name) {
        if (name && name.toLowerCase() === 'celleditor') {
            if (!warnedBaseClass) {
                console.warn('grid.cellEditors.get("' + name + '") method call has been deprecated as of v2.1.0 in favor of grid.cellEditors.BaseClass property. (Will be removed in a future release.)');
                warnedBaseClass = true;
            }
            return this.BaseClass;
        }
        try {
            var CellEditor = Registry.prototype.get.call(this, name);
        } catch (err) {
            // fail silently
        }
        return CellEditor;
    }

});

module.exports = new CellEditors;

},{"../lib/Registry":69,"./CellEditor":31,"./Color":32,"./Date":33,"./Number":34,"./Slider":35,"./Spinner":36,"./Textfield":37}],39:[function(require,module,exports){
'use strict';

var CellRenderer = require('./CellRenderer');

/**
 * @constructor
 * @extends CellRenderer
 */
var Button = CellRenderer.extend('Button', {

    paint: function(gc, config) {
        var val = config.value,
            c = config.dataCell.x,
            r = config.gridCell.y,
            bounds = config.bounds,
            x = bounds.x + 1,
            y = bounds.y + 1,
            width = bounds.width - 1 - config.lineWidth,
            height = bounds.height - 1 - config.lineWidth,
            radius = height / 2,
            arcGradient = gc.createLinearGradient(x, y, x, y + height);

        if (config.mouseDown) {
            arcGradient.addColorStop(0, '#B5CBED');
            arcGradient.addColorStop(1, '#4d74ea');
        } else {
            arcGradient.addColorStop(0, '#ffffff');
            arcGradient.addColorStop(1, '#aaaaaa');
        }

        // draw the background
        gc.cache.fillStyle = config.backgroundColor;
        gc.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

        // draw the capsule
        gc.cache.fillStyle = arcGradient;
        gc.cache.strokeStyle = '#000000';
        this.roundRect(gc, x, y, width, height, radius, arcGradient, true);

        var ox = (width - gc.getTextWidth(val)) / 2;
        var oy = (height - gc.getTextHeight(gc.cache.font).descent) / 2;

        // draw the text
        gc.cache.textBaseline = 'middle';
        gc.cache.fillStyle = '#333333';
        gc.cache.font = height - 2 + 'px sans-serif';
        config.backgroundColor = 'rgba(0,0,0,0)';
        gc.fillText(val, x + ox, y + oy);

        // Identify that we are a button by inserting an array of bounds into buttonCells for this cell's coords,
        // one element per subrow. This will be a single-element array for a cell without `subrows`.
        var key = c + ',' + r,
            buttonCells = config.buttonCells,
            buttonSubrows = buttonCells[key] || (buttonCells[key] = []);

        buttonSubrows[config.subrow] = Object.assign({}, bounds);
    }
});

module.exports = Button;



},{"./CellRenderer":40}],40:[function(require,module,exports){
'use strict';

/** @typedef {object} CellRenderer#renderConfig
 *
 * This is the renderer config object, which is:
 * 1. First passed to a {@link dataModelAPI#getCell getCell} method implementation, which may override (most of) its values before returning.
 * 2. Then passed to the specified cell renderers' {@link CellRenderer#paint paint} function for rendering.
 *
 * #### Standard Properties
 *
 * On each and every render of every cell in view, this a fresh instance of an object created from a {@link CellEvent} object, which in turn descends from {@link module:defaults}. It therefore has all the standard properties defined in both objects (see).
 *
 * #### Additional Properties
 *
 * Properties marked _read-only_ below may in fact be writable, but should be considered **off limits** to overriding. Do not attempt to change these properties inside a {@link dataModelAPI#getCell getCell} method override.
 *
 * @property {boolean} config.allRowsSelected
 *
 * @property {BoundingRect} config.bounds - Bounding rect of the cell or subcell to be rendered.
 *
 * @property {object} buttonCells - _For cell renderer use only. Not available in `getCell` override._  (Button renderers register themselves in this object so the click handler can know whether or not to fire the 'fin-button-pressed' event.)
 *
 * @property {dataCellCoords} config.dataCell - _Read-only._ Data coordinates of the cell.
 *
 * @property {dataRowObject} config.dataRow - Access to other column values in the same row.
 *
 * @property {function} config.formatValue - _For cell renderer use only. Not available in `getCell` override._ The cell's value formatter function (based on the formatter name in `config.format`, as possibly mutated by `getCell`).
 *
 * @property {gridCellCoords} config.gridCell - _Read-only._ Grid coordinates of the cell.
 *
 * @property {} config.halign - The cell's horizontal alignment property, as interpreted by it's cell renderer.
 *
 * @property {boolean} config.isCellHovered -
 *
 * @property {boolean} config.isCellSelected -
 *
 * @property {boolean} config.isColumnHovered -
 *
 * @property {boolean} config.isColumnSelected -
 *
 * @property {boolean} config.isDataColumn -
 *
 * @property {boolean} config.isDataRow -
 *
 * @property {boolean} config.isFilterRow -
 *
 * @property {boolean} config.isHandleColumn -
 *
 * @property {boolean} config.isHeaderRow -
 *
 * @property {boolean} config.isInCurrentSelectionRectangle -
 *
 * @property {boolean} config.isRowHovered -
 *
 * @property {boolean} config.isRowSelected -
 *
 * @property {boolean} config.isSelected -
 *
 * @property {boolean} config.isTreeColumn -
 *
 * @property {boolean} config.isUserDataArea -
 *
 * @property {number} config.minWidth - _For cell renderer use only. Not available in `getCell` override._ The Cell renderer returns the pixel width of the rendered contents in this property.
 *
 * @property {boolean} config.mouseDown - The last mousedown event occured over this cell and the mouse is still down. Note, however, that the mouse may no longer be hovering over this cell when it has been dragged away.
 *
 * @property {} [config.prefillColor] - _For cell renderer use only. Do not mutate in `getCell` override._ (This is the color already painted behind the cell to be rendered. If the cell's specified background color is the same, renderer may (and should!) skip painting it. If `undefined`, this is a "partial render" and cell renderers that support partial rendering can use `config.snapshot` to determine whether or not to rerender the cell.)
 *
 * @property {object} [config.snapshot] - _For cell renderer use only. Not available in `getCell` override._ Supports _partial render._ In support of the {@link Renderer#paintCellsAsNeeded by-cells} "partial" grid renderer, cell renderers can save the essential render parameters in this property so that on subsequent calls, when the parameters are the same, cell renderers can skip the actual rendering. Only when the parameters have changed is the cell rendered and this property reset (with the new parameters). This object would typically include at the very least the (formatted) `value`, plus additional properties as needed to fully describe the appearance of the render, such as color, _etc._ This property is undefined the first time a cell is rendered by the `by-cells` grid renderer. See also the {@link dataModelAPI#configObject}'s `prefillColor` property.
 *
 * @property config.value - Value to be rendered.
 *
 * The renderer has available to it the `.formatValue()` function for formatting the value. The function comes from the localizer named in the `.format` property. If there is no localizer with that name, the function defaults to the `string` localizer's formatter (which simply invokes the value's `toString()` method).
 *
 * Typically a Local primitive value, values can be any type, including objects and arrays. The specified cell renderer is expected to know how to determine the value's type and render it.
 */

var Base = require('../Base');

/** @constructor
 * @desc Instances of `CellRenderer` are used to render the 2D graphics context within the bound of a cell.
 *
 * Extend this base class to implement your own cell renderer.
 *
 * @tutorial cell-renderer
 */
var CellRenderer = Base.extend('CellRenderer', {
    /**
     * @desc An empty implementation of a cell renderer, see [the null object pattern](http://c2.com/cgi/wiki?NullObject).
     *
     * @this {CellEditor}
     *
     * @param {CanvasRenderingContext2D} gc
     *
     * @param {CellRenderer#renderConfig} config
     *
     * @returns {number} Preferred pixel width of content. The content may or may not be rendered at that width depending on whether or not `config.bounds` was respected and whether or not the grid renderer is using clipping. (Clipping is generally not used due to poor performance.)
     *
     * @memberOf CellRenderer.prototype
     */
    paint: function(gc, config) {},

    /**
     * @desc A simple implementation of rounding a cell.
     * @param {CanvasRenderingContext2D} gc
     * @param {number} x - the x grid coordinate of my origin
     * @param {number} y - the y grid coordinate of my origin
     * @param {number} width - the width I'm allowed to draw within
     * @param {number} height - the height I'm allowed to draw within
     * @param {number} radius
     * @param {number} fill
     * @param {number} stroke
     * @memberOf CellRenderer.prototype
     */
    roundRect: function(gc, x, y, width, height, radius, fill, stroke) {

        if (!stroke) {
            stroke = true;
        }
        if (!radius) {
            radius = 5;
        }
        gc.beginPath();
        gc.moveTo(x + radius, y);
        gc.lineTo(x + width - radius, y);
        gc.quadraticCurveTo(x + width, y, x + width, y + radius);
        gc.lineTo(x + width, y + height - radius);
        gc.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        gc.lineTo(x + radius, y + height);
        gc.quadraticCurveTo(x, y + height, x, y + height - radius);
        gc.lineTo(x, y + radius);
        gc.quadraticCurveTo(x, y, x + radius, y);
        gc.closePath();
        if (stroke) {
            gc.stroke();
        }
        if (fill) {
            gc.fill();
        }
        gc.closePath();
    }
});

module.exports = CellRenderer;

},{"../Base":12}],41:[function(require,module,exports){
'use strict';

var CellRenderer = require('./CellRenderer');

/**
 * @constructor
 * @extends CellRenderer
 */
var ErrorCell = CellRenderer.extend('ErrorCell', {

    /**
     * @summary Writes error message into cell.
     *
     * @desc This function is guaranteed to be called as follows:
     *
     * ```javascript
     * gc.save();
     * gc.beginPath();
     * gc.rect(x, y, width, height);
     * gc.clip();
     * behavior.getCellProvider().renderCellError(gc, message, x, y, width, height);
     * gc.restore();
     * ```
     *
     * Before doing anything else, this function should clear the cell by setting `gc.fillStyle` and calling `gc.fill()`.
     *
     * @param {CanvasRenderingContext2D} gc
     * @param {object} config
     * @param {Rectangle} config.bounds - The clipping rect of the cell to be rendered.
     * @memberOf ErrorCell.prototype
     */
    paint: function(gc, config, message) {
        var x = config.bounds.x,
            y = config.bounds.y,
            // width = config.bounds.width,
            height = config.bounds.height;

        // clear the cell
        // (this makes use of the rect path defined by the caller)
        gc.cache.fillStyle = '#FFD500';
        gc.fill();

        // render message text
        gc.cache.fillStyle = '#A00';
        gc.cache.textAlign = 'start';
        gc.cache.textBaseline = 'middle';
        gc.cache.font = 'bold 6pt "arial narrow", verdana, geneva';
        gc.fillText(message, x + 4, y + height / 2 + 0.5);
    }
});

module.exports = ErrorCell;

},{"./CellRenderer":40}],42:[function(require,module,exports){
'use strict';

var CellRenderer = require('./CellRenderer');

/**
 * @constructor
 * @desc A rendering of the last Selection Model
 * @extends CellRenderer
 */
var LastSelection = CellRenderer.extend('LastSelection', {
    paint: function(gc, config) {
        var visOverlay = gc.alpha(config.selectionRegionOverlayColor) > 0,
            visOutline = gc.alpha(config.selectionRegionOutlineColor) > 0;

        if (visOverlay || visOutline) {
            var x = config.bounds.x,
                y = config.bounds.y,
                width = config.bounds.width,
                height = config.bounds.height;

            gc.beginPath();

            gc.rect(x, y, width, height);

            if (visOverlay) {
                gc.cache.fillStyle = config.selectionRegionOverlayColor;
                gc.fill();
            }

            if (visOutline) {
                gc.cache.lineWidth = 1;
                gc.cache.strokeStyle = config.selectionRegionOutlineColor;
                gc.stroke();
            }

            gc.closePath();
        }
    }
});

module.exports = LastSelection;



},{"./CellRenderer":40}],43:[function(require,module,exports){
'use strict';

var CellRenderer = require('./CellRenderer');
var images = require('../../images');

var WHITESPACE = /\s\s+/g;

/**
 * @constructor
 * @summary The default cell renderer for a vanilla cell.
 * @desc Great care has been taken in crafting this function as it needs to perform extremely fast.
 *
 * Use `gc.cache` instead which we have implemented to cache the graphics context properties. Reads on the graphics context (`gc`) properties are expensive but not quite as expensive as writes. On read of a `gc.cache` prop, the actual `gc` prop is read into the cache once and from then on only the cache is referenced for that property. On write, the actual prop is only written to when the new value differs from the cached value.
 *
 * Clipping bounds are not set here as this is also an expensive operation. Instead, we employ a number of strategies to truncate overflowing text and content.
 *
 * @extends CellRenderer
 */
var SimpleCell = CellRenderer.extend('SimpleCell', {
    paint: function(gc, config) {
        var val = config.value,
            bounds = config.bounds,
            x = bounds.x,
            y = bounds.y,
            width = bounds.width,
            height = bounds.height,
            iconPadding = config.iconPadding,
            partialRender = config.prefillColor === undefined, // signifies abort before rendering if same
            snapshot = config.snapshot,
            same = snapshot && partialRender,
            valWidth = 0,
            textColor, textFont,
            ixoffset, iyoffset,
            leftIcon, rightIcon, centerIcon,
            leftPadding, rightPadding,
            hover, hoverColor, selectColor, foundationColor, inheritsBackgroundColor,
            c, colors;

        // setting gc properties are expensive, let's not do it needlessly

        if (val && val.constructor === Array) {
            leftIcon = val[0];
            rightIcon = val[2];
            val = config.exec(val[1]);
            if (val && val.naturalWidth !== undefined) { // must be an image (much faster than instanceof HTMLImageElement)
                centerIcon = val;
                val = null;
            }
        } else {
            leftIcon = images[config.leftIcon];
            centerIcon = images[config.centerIcon];
            rightIcon = images[config.rightIcon];
        }

        // Note: vf == 0 is fastest equivalent of vf === 0 || vf === false which excludes NaN, null, undefined
        var renderValue = val || config.renderFalsy && val == 0; // eslint-disable-line eqeqeq

        if (renderValue) {
            val = config.formatValue(val, config);

            textFont = config.isSelected ? config.foregroundSelectionFont : config.font;

            textColor = gc.cache.strokeStyle = config.isSelected
                ? config.foregroundSelectionColor
                : config.color;
        } else {
            val = '';
        }

        same = same &&
            val === snapshot.value &&
            textFont === snapshot.textFont &&
            textColor === snapshot.textColor;

        // fill background only if our bgColor is populated or we are a selected cell
        colors = [];
        c = 0;
        if (config.isCellHovered && config.hoverCellHighlight.enabled) {
            hoverColor = config.hoverCellHighlight.backgroundColor;
        } else if (config.isRowHovered && (hover = config.hoverRowHighlight).enabled) {
            hoverColor = config.isDataColumn || !hover.header || hover.header.backgroundColor === undefined ? hover.backgroundColor : hover.header.backgroundColor;
        } else if (config.isColumnHovered && (hover = config.hoverColumnHighlight).enabled) {
            hoverColor = config.isDataRow || !hover.header || hover.header.backgroundColor === undefined ? hover.backgroundColor : hover.header.backgroundColor;
        }
        if (gc.alpha(hoverColor) < 1) {
            if (config.isSelected) {
                selectColor = config.backgroundSelectionColor;
            }

            if (gc.alpha(selectColor) < 1) {
                inheritsBackgroundColor = (config.backgroundColor === config.prefillColor);
                if (!inheritsBackgroundColor) {
                    foundationColor = true;
                    colors.push(config.backgroundColor);
                    same = same &&  foundationColor === snapshot.foundationColor &&
                        config.backgroundColor === snapshot.colors[c++];
                }
            }

            if (selectColor !== undefined) {
                colors.push(selectColor);
                same = same && selectColor === snapshot.colors[c++];
            }
        }
        if (hoverColor !== undefined) {
            colors.push(hoverColor);
            same = same && hoverColor === snapshot.colors[c++];
        }

        // todo check if icons have changed
        if (same && c === snapshot.colors.length) {
            return;
        }

        // return a snapshot to save in cellEvent for future comparisons by partial renderer
        config.snapshot = {
            value: val,
            textColor: textColor,
            textFont: textFont,
            foundationColor: foundationColor,
            colors: colors
        };

        layerColors(gc, colors, x, y, width, height, foundationColor);

        // Measure left and right icons, needed for rendering and for return value (min width)
        leftPadding = leftIcon ? iconPadding + leftIcon.width + iconPadding : config.cellPadding;
        rightPadding = rightIcon ? iconPadding + rightIcon.width + iconPadding : config.cellPadding;

        if (renderValue) {
            // draw text
            gc.cache.fillStyle = textColor;
            gc.cache.font = textFont;
            valWidth = config.isHeaderRow && config.headerTextWrapping
                ? renderMultiLineText(gc, config, val, leftPadding, rightPadding)
                : renderSingleLineText(gc, config, val, leftPadding, rightPadding);
        } else if (centerIcon) {
            // Measure & draw center icon
            iyoffset = Math.round((height - centerIcon.height) / 2);
            ixoffset = Math.round((width - centerIcon.width) / 2);
            gc.drawImage(centerIcon, x + width - ixoffset - centerIcon.width, y + iyoffset);
            valWidth = iconPadding + centerIcon.width + iconPadding;
        }

        if (leftIcon) {
            // Draw left icon
            iyoffset = Math.round((height - leftIcon.height) / 2);
            gc.drawImage(leftIcon, x + iconPadding, y + iyoffset);
        }

        if (rightIcon) {
            // Repaint background before painting right icon, because text may have flowed under where it will be.
            // This is a work-around to clipping which is too expensive to perform here.
            var rightX = x + width - (rightIcon.width + iconPadding);
            if (inheritsBackgroundColor) {
                foundationColor = true;
                colors.unshift(config.backgroundColor);
            }
            layerColors(gc, colors, rightX, y, rightPadding, height, foundationColor);

            // Draw right icon
            iyoffset = Math.round((height - rightIcon.height) / 2);
            gc.drawImage(rightIcon, rightX, y + iyoffset);
        }

        if (config.cellBorderThickness) {
            gc.beginPath();
            gc.rect(x, y, width, height);
            gc.cache.lineWidth = config.cellBorderThickness;
            gc.cache.strokeStyle = config.cellBorderStyle;
            gc.stroke();
            gc.closePath();
        }

        config.minWidth = leftPadding + valWidth + rightPadding;
    }
});

/**
 * @summary Renders single line text.
 * @param {CanvasRenderingContext2D} gc
 * @param {object} config
 * @param {Rectangle} config.bounds - The clipping rect of the cell to be rendered.
 * @param {*} val - The text to render in the cell.
 * @memberOf SimpleCell.prototype
 */
function renderMultiLineText(gc, config, val, leftPadding, rightPadding) {
    var x = config.bounds.x,
        y = config.bounds.y,
        width = config.bounds.width,
        height = config.bounds.height,
        cleanVal = (val + '').trim().replace(WHITESPACE, ' '), // trim and squeeze whitespace
        lines = findLines(gc, config, cleanVal.split(' '), width);

    if (lines.length === 1) {
        return renderSingleLineText(gc, config, cleanVal, leftPadding, rightPadding);
    }

    var halignOffset = leftPadding,
        valignOffset = config.voffset,
        halign = config.halign,
        textHeight = gc.getTextHeight(config.font).height;

    switch (halign) {
        case 'right':
            halignOffset = width - rightPadding;
            break;
        case 'center':
            halignOffset = width / 2;
            break;
    }

    var hMin = 0, vMin = Math.ceil(textHeight / 2);

    valignOffset += Math.ceil((height - (lines.length - 1) * textHeight) / 2);

    halignOffset = Math.max(hMin, halignOffset);
    valignOffset = Math.max(vMin, valignOffset);

    gc.cache.save(); // define a clipping region for cell
    gc.beginPath();
    gc.rect(x, y, width, height);
    gc.clip();

    gc.cache.textAlign = halign;
    gc.cache.textBaseline = 'middle';

    for (var i = 0; i < lines.length; i++) {
        gc.simpleText(lines[i], x + halignOffset, y + valignOffset + (i * textHeight));
    }

    gc.cache.restore(); // discard clipping region

    return width;
}

/**
 * @summary Renders single line text.
 * @param {CanvasRenderingContext2D} gc
 * @param {object} config
 * @param {Rectangle} config.bounds - The clipping rect of the cell to be rendered.
 * @param {*} val - The text to render in the cell.
 * @memberOf SimpleCell.prototype
 */
function renderSingleLineText(gc, config, val, leftPadding, rightPadding) {
    var x = config.bounds.x,
        y = config.bounds.y,
        width = config.bounds.width,
        halignOffset = leftPadding,
        halign = config.halign,
        minWidth,
        metrics;

    if (config.columnAutosizing) {
        metrics = gc.getTextWidthTruncated(val, width - leftPadding, config.truncateTextWithEllipsis);
        minWidth = metrics.width;
        val = metrics.string || val;
        switch (halign) {
            case 'right':
                halignOffset = width - rightPadding - metrics.width;
                break;
            case 'center':
                halignOffset = (width - metrics.width) / 2;
                break;
        }
    } else {
        metrics = gc.getTextWidthTruncated(val, width - leftPadding, config.truncateTextWithEllipsis, true);
        minWidth = 0;
        if (metrics.string !== undefined) {
            val = metrics.string;
        } else {
            switch (halign) {
                case 'right':
                    halignOffset = width - rightPadding - metrics.width;
                    break;
                case 'center':
                    halignOffset = (width - metrics.width) / 2;
                    break;
            }
        }
    }

    if (val !== null) {
        x += Math.max(leftPadding, halignOffset);
        y += config.bounds.height / 2;

        if (config.isUserDataArea) {
            if (config.link) {
                if (config.isCellHovered || !config.linkOnHover) {
                    if (config.linkColor) {
                        gc.cache.strokeStyle = config.linkColor;
                    }
                    gc.beginPath();
                    underline(config, gc, val, x, y, 1);
                    gc.stroke();
                    gc.closePath();
                }
                if (config.linkColor && (config.isCellHovered || !config.linkColorOnHover)) {
                    gc.cache.fillStyle = config.linkColor;
                }
            }

            if (config.strikeThrough === true) {
                gc.beginPath();
                strikeThrough(config, gc, val, x, y, 1);
                gc.stroke();
                gc.closePath();
            }
        }

        gc.cache.textAlign = 'left';
        gc.cache.textBaseline = 'middle';
        gc.simpleText(val, x, y);
    }

    return minWidth;
}

function findLines(gc, config, words, width) {

    if (words.length === 1) {
        return words;
    }

    // starting with just the first word...
    var stillFits, line = [words.shift()];
    while (
        // so lone as line still fits within current column...
    (stillFits = gc.getTextWidth(line.join(' ')) < width)
    // ...AND there are more words available...
    && words.length
        ) {
        // ...add another word to end of line and retest
        line.push(words.shift());
    }

    if (
        !stillFits // if line is now too long...
        && line.length > 1 // ...AND is multiple words...
    ) {
        words.unshift(line.pop()); // ...back off by (i.e., remove) one word
    }

    line = [line.join(' ')];

    if (words.length) { // if there's anything left...
        line = line.concat(findLines(gc, config, words, width)); // ...break it up as well
    }

    return line;
}

function strikeThrough(config, gc, text, x, y, thickness) {
    var textWidth = gc.getTextWidth(text);

    switch (gc.cache.textAlign) {
        case 'center':
            x -= textWidth / 2;
            break;
        case 'right':
            x -= textWidth;
            break;
    }

    y = Math.round(y + 0.5) - 0.5;

    gc.cache.lineWidth = thickness;
    gc.moveTo(x - 1, y);
    gc.lineTo(x + textWidth + 1, y);
}

function underline(config, gc, text, x, y, thickness) {
    var textHeight = gc.getTextHeight(config.font).height,
        textWidth = gc.getTextWidth(text);

    switch (gc.cache.textAlign) {
        case 'center':
            x -= textWidth / 2;
            break;
        case 'right':
            x -= textWidth;
            break;
    }

    y = Math.round(y + textHeight / 2) - 0.5;

    //gc.beginPath();
    gc.cache.lineWidth = thickness;
    gc.moveTo(x, y);
    gc.lineTo(x + textWidth, y);
}

function layerColors(gc, colors, x, y, width, height, foundationColor) {
    for (var i = 0; i < colors.length; i++) {
        if (foundationColor && !i) {
            gc.clearFill(x, y, width, height, colors[i]);
        } else {
            gc.cache.fillStyle = colors[i];
            gc.fillRect(x, y, width, height);
        }
    }
}

module.exports = SimpleCell;

},{"../../images":10,"./CellRenderer":40}],44:[function(require,module,exports){
'use strict';

var CellRenderer = require('./CellRenderer');

/**
 * Renders a slider button.
 * Currently however the user cannot interact with it.
 * @constructor
 * @extends CellRenderer
 */
var Slider = CellRenderer.extend('Slider', {
    paint: function(gc, config) {
        var x = config.bounds.x,
            y = config.bounds.y,
            width = config.bounds.width,
            height = config.bounds.height;
        gc.cache.strokeStyle = 'white';
        var val = config.value;
        var radius = height / 2;
        var offset = width * val;
        var bgColor = config.isSelected ? config.backgroundColor : '#333333';
        var btnGradient = gc.createLinearGradient(x, y, x, y + height);
        btnGradient.addColorStop(0, bgColor);
        btnGradient.addColorStop(1, '#666666');
        var arcGradient = gc.createLinearGradient(x, y, x, y + height);
        arcGradient.addColorStop(0, '#aaaaaa');
        arcGradient.addColorStop(1, '#777777');
        gc.cache.fillStyle = btnGradient;
        this.roundRect(gc, x, y, width, height, radius, btnGradient);
        if (val < 1.0) {
            gc.cache.fillStyle = arcGradient;
        } else {
            gc.cache.fillStyle = '#eeeeee';
        }
        gc.beginPath();
        gc.arc(x + Math.max(offset - radius, radius), y + radius, radius, 0, 2 * Math.PI);
        gc.fill();
        gc.closePath();
        config.minWidth = 100;
    }
});

module.exports = Slider;

},{"./CellRenderer":40}],45:[function(require,module,exports){
'use strict';

var CellRenderer = require('./CellRenderer');

/**
 * Renders a bar chart sparkline, hence the name.
 * @constructor
 * @extends CellRenderer
 */
var SparkBar = CellRenderer.extend('SparkBar', {
    paint: function(gc, config) {
        var x = config.bounds.x,
            y = config.bounds.y,
            width = config.bounds.width,
            height = config.bounds.height;

        gc.beginPath();
        var val = config.value;
        if (!val || !val.length) {
            return;
        }
        var count = val.length;
        var eWidth = width / count;
        var fgColor = config.isSelected ? config.foregroundSelectionColor : config.color;
        if (config.backgroundColor || config.isSelected) {
            gc.cache.fillStyle = config.isSelected ? 'blue' : config.backgroundColor;
            gc.fillRect(x, y, width, height);
        }
        gc.cache.fillStyle = fgColor;
        for (var i = 0; i < val.length; i++) {
            var barheight = val[i] / 110 * height;
            gc.fillRect(x + 5, y + height - barheight, eWidth * 0.6666, barheight);
            x += eWidth;
        }
        gc.closePath();
        config.minWidth = count * 10;
    }
});

module.exports = SparkBar;

},{"./CellRenderer":40}],46:[function(require,module,exports){
'use strict';

var CellRenderer = require('./CellRenderer');

/**
 * Renders a sparkline.
 * @see [Edward Tufte sparkline](http://www.edwardtufte.com/bboard/q-and-a-fetch-msg?msg_id=0001OR)
 * @constructor
 * @extends CellRenderer
 */
var SparkLine = CellRenderer.extend('SparkLine', {
    paint: function(gc, config) {
        var x = config.bounds.x,
            y = config.bounds.y,
            width = config.bounds.width,
            height = config.bounds.height;

        gc.beginPath();
        var val = config.value;
        if (!val || !val.length) {
            return;
        }
        var count = val.length;
        var eWidth = width / count;

        var fgColor = config.isSelected ? config.foregroundSelectionColor : config.color;
        if (config.backgroundColor || config.isSelected) {
            gc.cache.fillStyle = config.isSelected ? config.backgroundSelectionColor : config.backgroundColor;
            gc.fillRect(x, y, width, height);
        }
        gc.cache.strokeStyle = fgColor;
        gc.cache.fillStyle = fgColor;
        gc.beginPath();
        var prev;
        for (var i = 0; i < val.length; i++) {
            var barheight = val[i] / 110 * height;
            if (!prev) {
                prev = barheight;
            }
            gc.lineTo(x + 5, y + height - barheight);
            gc.arc(x + 5, y + height - barheight, 1, 0, 2 * Math.PI, false);
            x += eWidth;
        }
        config.minWidth = count * 10;
        gc.stroke();
        gc.closePath();
    }
});

module.exports = SparkLine;

},{"./CellRenderer":40}],47:[function(require,module,exports){
'use strict';

var CellRenderer = require('./CellRenderer');

/**
 * Renders a tree cell (presumably in the tree column).
 * @constructor
 * @extends CellRenderer
 */
var TreeCell = CellRenderer.extend('TreeCell', {
    paint: function(gc, config) {
        var x = config.bounds.x,
            y = config.bounds.y,
            val = config.value.data,
            indent = config.value.indent,
            icon = config.value.icon;

        // Fill background only if our bgColor is populated or we are a selected cell.
        if (config.backgroundColor || config.isSelected) {
            gc.cache.fillStyle = config.isSelected ? config.backgroundColor : config.backgroundColor;
            gc.fillRect(x, y, config.bounds.width, config.bounds.height);
        }

        if (!val || !val.length) {
            return;
        }

        gc.cache.fillStyle = config.isSelected ? config.backgroundColor : config.backgroundColor;

        var valignOffset = Math.ceil(config.bounds.height / 2);
        gc.fillText(icon + val, x + indent, y + valignOffset);

        config.minWidth = x + indent + gc.getTextWidth(icon + val) + 10;
    }
});

module.exports = TreeCell;

},{"./CellRenderer":40}],48:[function(require,module,exports){
'use strict';

var Registry = require('../lib/Registry');


var warnedBaseClass;

/**
 * @classdesc Registry of cell renderer singletons.
 * @constructor
 */
var CellRenderers = Registry.extend('CellRenderers', {

    BaseClass: require('./CellRenderer'), // abstract base class

    initialize: function() {
        // preregister the standard cell renderers
        this.add(require('./Button'));
        this.add(require('./SimpleCell'));
        this.add(require('./SliderCell'));
        this.add(require('./SparkBar'));
        this.add(require('./LastSelection'));
        this.add(require('./SparkLine'));
        this.add(require('./ErrorCell'));
        this.add(require('./TreeCell'));
    },

    // for better performance, instantiate at add time rather than render time.
    add: function(name, Constructor) {
        if (arguments.length === 1) {
            Constructor = name;
            return Registry.prototype.add.call(this, new Constructor);
        } else {
            return Registry.prototype.add.call(this, name, new Constructor);
        }
    },

    get: function(name) {
        if (name && name.toLowerCase() === 'emptycell') {
            if (!warnedBaseClass) {
                console.warn('grid.cellRenderers.get("' + name + '").constructor has been deprecated as of v2.1.0 in favor of grid.cellRenderers.BaseClass property. (Will be removed in a future release.)');
                warnedBaseClass = true;
            }
            this.BaseClass.constructor = this.BaseClass;
            return this.BaseClass;
        }
        return Registry.prototype.get.call(this, name);
    }

});

module.exports = new CellRenderers;

},{"../lib/Registry":69,"./Button":39,"./CellRenderer":40,"./ErrorCell":41,"./LastSelection":42,"./SimpleCell":43,"./SliderCell":44,"./SparkBar":45,"./SparkLine":46,"./TreeCell":47}],49:[function(require,module,exports){
'use strict';

var DataSourceBase = require('datasaur-base');

/**
 * @implements dataModelAPI
 * @param {Hypergrid} grid
 * @param {object} [options]
 * @param {string} [options.name]
 * @constructor
 */
var HeaderSubgrid = DataSourceBase.extend('HeaderSubgrid', {
    type: 'header',

    format: 'header', // override column format

    initialize: function(nextDataSource, options) {
        this.grid = options.grid;
    },

    getRowCount: function() {
        return this.grid.properties.showHeaderRow ? 1 : 0;
    },

    getValue: function(x, y) {
        var column = this.grid.behavior.getColumn(x);
        return column.header || column.name; // use field name when header undefined
    },

    setValue: function(x, y, value) {
        if (y < this.getRowCount()) {
            this.grid.behavior.getColumn(x).header = value;
        }
    },

    getRow: function(y) {
        return this.dataRow;
    }
});

module.exports = HeaderSubgrid;

},{"datasaur-base":3}],50:[function(require,module,exports){
'use strict';

var Registry = require('../lib/Registry');

/**
 * @classdesc Registry of cell editor constructors.
 * @param {object} options
 * @constructor
 */
var DataModels = Registry.extend('DataModels', {

    BaseClass: require('datasaur-base'),

    initialize: function() {
        // preregister the standard cell editors
        this.add(require('./HeaderSubgrid'));
    }

});

module.exports = new DataModels;

},{"../lib/Registry":69,"./HeaderSubgrid":49,"datasaur-base":3}],51:[function(require,module,exports){
'use strict';

var HypergridError = require('./lib/error');


var propClassEnum = {
    COLUMNS: 1,
    STRIPES: 2,
    ROWS: 3,
    CELLS: 4
};

var propClassLayersMap = {
    DEFAULT: [propClassEnum.COLUMNS, propClassEnum.STRIPES, propClassEnum.ROWS, propClassEnum.CELLS],
    NO_ROWS: [propClassEnum.CELLS]
};


/**
 * This module lists the properties that can be set on a {@link Hypergrid} along with their default values.
 * Edit this file to override the defaults.
 * @module defaults
 */

var defaults = {

    /**
     * @summary The global theme name.
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    themeName: 'default',

    /**
     * The default message to display in front of the canvas when there are no grid rows.
     * Format is HTML.
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    noDataMessage: '',

    /**
     * @summary List of subgrids by
     * @desc Restrict usage here to strings (naming data models) or arrays consisting of such a string + constructor arguments. That is, avoid {@link subgridSpec}'s function and object overloads and {@link subgridConstructorRef} function overload.
     * @default "[ 'HeaderSubgrid', 'data' ]"
     * @type {subgridSpec[]}
     * @memberOf module:defaults
     */
    subgrids: [
        'HeaderSubgrid',
        'data'
    ],

    /**
     * The font for data cells.
     * @default
     * @type {cssFont}
     * @memberOf module:defaults
     */
    font: '13px Tahoma, Geneva, sans-serif',

    /**
     * Font color for data cells.
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    color: 'rgb(25, 25, 25)',

    /**
     * Background color for data cells.
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    backgroundColor: 'rgb(241, 241, 241)',

    /**
     * Font style for selected cell(s).
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    foregroundSelectionFont: 'bold 13px Tahoma, Geneva, sans-serif',

    /**
     * Font color for selected cell(s).
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    foregroundSelectionColor: 'rgb(0, 0, 128)',
    /**
     * Background color for selected cell(s).
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    backgroundSelectionColor: 'rgba(147, 185, 255, 0.625)',


    /********** SECTION: COLUMN HEADER COLORS **********/

    // IMPORTANT CAVEAT: The code is inconsistent regarding the terminology. Is the "column header" section _the row_ of cells at the top (that act as headers for each column) or is it _the column_ of cells (that act as headers for each row)? Oh my.

    /**
     * @default
     * @type {cssFont}
     * @memberOf module:defaults
     */
    columnHeaderFont: '12px Tahoma, Geneva, sans-serif',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    columnHeaderColor: 'rgb(25, 25, 25)',

    /**
     * Font style for selected columns' headers.
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    columnHeaderForegroundSelectionFont: 'bold 12px Tahoma, Geneva, sans-serif',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    columnHeaderBackgroundColor: 'rgb(223, 227, 232)',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    columnHeaderForegroundSelectionColor: 'rgb(80, 80, 80)',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    columnHeaderBackgroundSelectionColor: 'rgba(255, 220, 97, 0.45)',

    /**
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    columnHeaderHalign: 'center',

    /**
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    columnHeaderRenderer: 'SimpleCell',


    /********** SECTION: ROW HEADER COLORS **********/

    /**
     * @default
     * @type {cssFont}
     * @memberOf module:defaults
     */
    rowHeaderFont: '12px Tahoma, Geneva, sans-serif',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    rowHeaderColor: 'rgb(25, 25, 25)',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    rowHeaderBackgroundColor: 'rgb(223, 227, 232)',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    rowHeaderForegroundSelectionColor: 'rgb(80, 80, 80)',

    /**
     * Font style for selected rows' headers.
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    rowHeaderForegroundSelectionFont: 'bold 12px Tahoma, Geneva, sans-serif',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    rowHeaderBackgroundSelectionColor: 'rgba(255, 220, 97, 0.45)',
    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    backgroundColor2: 'rgb(201, 201, 201)',


    /********** SECTION: TREE HEADER COLORS **********/

    /**
     * @default
     * @type {cssFont}
     * @memberOf module:defaults
     */
    treeHeaderFont: '12px Tahoma, Geneva, sans-serif',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    treeHeaderColor: 'rgb(25, 25, 25)',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    treeHeaderBackgroundColor: 'rgb(223, 227, 232)',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    treeHeaderForegroundSelectionColor: 'rgb(80, 80, 80)',

    /**
     * Font style for selected rows' headers.
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    treeHeaderForegroundSelectionFont: 'bold 12px Tahoma, Geneva, sans-serif',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    treeHeaderBackgroundSelectionColor: 'rgba(255, 220, 97, 0.45)',
    /********** SECTION: FILTER ROW COLORS **********/

    /**
     * @default
     * @type {cssFont}
     * @memberOf module:defaults
     */
    filterFont: '12px Tahoma, Geneva, sans-serif',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    filterColor: 'rgb(25, 25, 25)',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    filterBackgroundColor: 'white',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    filterForegroundSelectionColor: 'rgb(25, 25, 25)',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    filterBackgroundSelectionColor: 'rgb(255, 220, 97)',

    /**
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    filterHalign: 'center',

    /**
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    filterRenderer: 'SimpleCell',

    /**
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    filterEditor: 'TextField',

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    filterable: true,

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    showFilterRow: false,

    /**
     * @default
     * @type {number}
     * @memberOf module:defaults
     */
    voffset: 0,

    /**
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    scrollbarHoverOver: 'visible',

    /**
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    scrollbarHoverOff: 'hidden',

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    scrollingEnabled: true,

    /**
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    vScrollbarClassPrefix: '',

    /**
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    hScrollbarClassPrefix: '',

    /**
     * Horizontal alignment of each cell as interpreted by it's cell renderer.
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    halign: 'center',

    /**
     * Padding to left and right of cell value.
     *
     * NOTE: Right padding may not be visible if column is not sized wide enough.
     *
     * See also {@link module:defaults.iconPadding|iconPadding}.
     * @default
     * @type {number}
     * @memberOf module:defaults
     */
    cellPadding: 5,

    /**
     * Padding to left and right of cell icons.
     *
     * Overrides {@link module:defaults.cellPadding|cellPadding}:
     * * Left icon + `iconPadding` overrides left {@link module:defaults.cellPddingg|cellPddingg}.
     * * Right icon + `iconPadding` overrides right {@link module:defaults.cellPddingg|cellPddingg}.
     * @see {@link module:defaults.leftIcon|leftIcon}
     * @see {@link module:defaults.centerIcon|centerIcon}
     * @see {@link module:defaults.rightIcon|rightIcon}
     * @default
     * @type {number}
     * @memberOf module:defaults
     */
    iconPadding: 3,

    /**
     * @summary Name of image to appear at right of cell.
     * Must be a key from {@link module:images|images}.
     * @desc Used by {@link SimpleCell} cell renderer.
     * @see {@link module:defaults.centerIcon|centerIcon}
     * @see {@link module:defaults.rightIcon|rightIcon}
     * @see {@link module:defaults.iconPadding|iconPadding}
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    leftIcon: undefined,

    /**
     * @summary Name of image to appear at right of cell.
     * Must be a key from {@link module:images|images}.
     * @desc Used by {@link SimpleCell} cell renderer.
     * @see {@link module:defaults.leftIcon|leftIcon}
     * @see {@link module:defaults.rightIcon|rightIcon}
     * @see {@link module:defaults.iconPadding|iconPadding}
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    centerIcon: undefined,

    /**
     * @summary Name of image to appear at right of cell.
     * Must be a key from {@link module:images|images}.
     * @desc Used by {@link SimpleCell} cell renderer.
     * @see {@link module:defaults.leftIcon|leftIcon}
     * @see {@link module:defaults.centerIcon|centerIcon}
     * @see {@link module:defaults.iconPadding|iconPadding}
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    rightIcon: undefined,

    /**
     * Set to `true` to render `0` and `false`. Otherwise these value appear as blank cells.
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    renderFalsy: false,

    /**
     * The name of a transformer function defined in require('synonomous/transformers').
     *
     * If the named headerify function is defined, whenever the schema array changes, it is applied each element
     * (column schema) for each column that does not already have an explicitly defined `header` property.
     *
     * When this property does not name a defined headerify function, undefined column headers default to their column names.     *
     *
     * @see lib/headerifiers.js
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    headerify: 'toTitle',

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    gridLinesH: true,

    /** @type {number}
     * @default
     * @memberOf module:defaults
     * @see {@link module:dynamicProperties.lineWidth}
     */
    gridLinesHWidth: 1,

    /** @type {string}
     * @default
     * @memberOf module:defaults
     * @see {@link module:dynamicProperties.lineColor}
     */
    gridLinesHColor: 'rgb(199, 199, 199)',

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    gridLinesV: true,

    /** @type {number}
     * @default
     * @memberOf module:defaults
     * @see {@link module:dynamicProperties.lineWidth}
     */
    gridLinesVWidth: 1,

    /** @type {string}
     * @default
     * @memberOf module:defaults
     * @see {@link module:dynamicProperties.lineColor}
     */
    gridLinesVColor: 'rgb(199, 199, 199)',

    /**
     * Set canvas's CSS border to this string as well as `gridBorderLeft`, `gridBorderRight`, `gridBorderTop`, and `gridBorderBottom`.
     * If set to `true`, uses current `lineWidth` and `lineColor`.
     * If set to `false`, uses null.
     *
     * Caveat: The use of `grid.canvas.canvas.style.boxSizing = 'border-box'` is _not_ recommended due to
     * the fact that the canvas is squashed slightly to accommodate the border resulting in blurred text.
     *
     * @default
     * @type {boolean|string}
     * @memberOf module:defaults
     */
    gridBorder: false,

    /**
     * Set canvas's left CSS border to this string.
     * If set to `true`, uses current `lineWidth` and `lineColor`.
     * If set to `false`, uses null.
     * @default
     * @type {boolean|string}
     * @memberOf module:defaults
     */
    gridBorderLeft: false,

    /**
     * Set canvas's right CSS border to this string.
     * If set to `true`, uses current `lineWidth` and `lineColor`.
     * If set to `false`, uses null.
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    gridBorderRight: false,

    /**
     * Set canvas's top CSS border to this string.
     * If set to `true`, uses current `lineWidth` and `lineColor`.
     * If set to `false`, uses null.
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    gridBorderTop: false,

    /**
     * Set canvas's bottom CSS border to this string.
     * If set to `true`, uses current `lineWidth` and `lineColor`.
     * If set to `false`, uses null.
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    gridBorderBottom: false,

    /**
     * Define this property to style rule lines between fixed & scolling rows differently from `lineWidth`.
     * @default
     * @type {number}
     * @memberOf module:defaults
     */
    fixedLinesHWidth: 2,

    /**
     * Define this property to render just the edges of the lines between fixed & scolling rows, creating a double-line effect. The value is the thickness of the edges. Typical definition would be `1` in tandem with setting `fixedLinesWidth` to `3`.
     * @default
     * @type {number}
     * @memberOf module:defaults
     */
    fixedLinesHEdge: undefined, // undefined means no edge effect

    /**
     * Define this property to style rule lines between fixed & scolling rows differently from `lineColor`.
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    fixedLinesHColor: 'rgb(164,164,164)', // ~21% darker than `lineColor` default

    /**
     * Define this property to style rule lines between fixed & scolling columns differently from `lineWidth`.
     * @default
     * @type {number}
     * @memberOf module:defaults
     */
    fixedLinesVWidth: 2,

    /**
     * Define this property to render just the edges of the lines between fixed & scolling columns, creating a double-line effect. The value is the thickness of the edges. Typical definition would be `1` in tandem with setting `fixedLinesWidth` to `3`.
     * @default
     * @type {number}
     * @memberOf module:defaults
     */
    fixedLinesVEdge: undefined, // undefined means no edge effect

    /**
     * Define this property to style rule lines between fixed & scolling columns differently from `lineColor`.
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    fixedLinesVColor: 'rgb(164,164,164)', // ~21% darker than `lineColor` default

    /**
     * @default
     * @type {number}
     * @memberOf module:defaults
     */
    defaultRowHeight: 15,

    /**
     * @default
     * @type {number}
     * @memberOf module:defaults
     */
    defaultColumnWidth: 100,

    /**
     * @default
     * @type {number}
     * @memberOf module:defaults
     */
    minimumColumnWidth: 5,

    //for immediate painting, set these values to 0, true respectively

    /**
     * @default
     * @type {number}
     * @memberOf module:defaults
     */
    repaintIntervalRate: 60,

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    repaintImmediately: false,

    //enable or disable double buffering

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    useBitBlit: false,


    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    useHiDPI: true,

    /**
     * @summary Mappings for cell navigation keys.
     * @desc Cell navigation is handled in the {@link CellSelection} "feature". This property gives you control over which keypresses the built-in mechanism will respond to.
     *
     * (If this built-in cell selection logic is insufficient for your needs, you can also listen for the various "fin-key" events and carry out more complex operations in your listeners.)
     *
     * The keypress names used here are defined in Canvas.js. Note that all keypresses actually have two names, a normal name and a shifted name. The latter name is used when either **shift** is depressed.
     *
     * The built-in nav keypresses are as follows:
     * * **`UP`** _(up-arrow key)_ - Replace all selections with a single cell, one row up from the last selection.
     * * **`DOWN`** _(down-arrow key)_ - Replace all selections with a single cell, one row down from the last selection.
     * * **`LEFT`** _(left-arrow key)_ - Replace all selections with a single cell, one column to the left of the last selection.
     * * **`RIGHT`** _(right-arrow key)_ - Replace all selections with a single cell, one column to the right of the last selection.
     * * **`UPSHIFT`** _(shift + up-arrow)_ - Extend the last selection up one row.
     * * **`DOWNSHIFT`** _(shift + down-arrow)_ - Extend the last selection down one row.
     * * **`LEFTSHIFT`** _(shift + left-arrow)_ - Extend the last selection left one column.
     * * **`RIGHTSHIFT`** _(shift + right-arrow)_ - Extend the last selection right one column.
     *
     * To alter these or add other mappings see the examples below.
     *
     * A note regarding the other meta keys (**trl**, **option**, and **command**): Although these meta keys can be detected, they do not modify the key names as **shift** does. This is because they are more for system use and generally (with the possibly exception fo **ctrl**) should not be depended upon, as system functions will take priority and your app will never see these key presses.
     *
     * A special accommodation has been made to the {@link module:defaults.editOnKeydown|editOnKeydown} property:
     * * If `editOnKeydown` truthy AND mapped character is an actual (non-white-space) character (as opposed to say **tab** or **return**), then navigation requires **ctrl** key to distinguish between nav and data.
     * * If `editOnKeydown` falsy, the **ctrl** key is ignored.
     *
     * So in the last example, if `editOnKeydown` is ON, then `a` (without **ctrl**) would start editing the cell and **ctrl** + `a` would move the selection one column to the left.
     *
     * @example
     * // To void the above build-ins:
     * navKeyMap: {
     *     UP: undefined,
     *     UPSHIFT: undefined,
     *     DOWN: undefined,
     *     ...
     * }
     *
     * @example
     * // To map alternative nav keypresses to RETURN and TAB (default mapping):
     * navKeyMap: {
     *     RETURN: 'DOWN',
     *     RETURNSHIFT: 'UP',
     *     TAB: 'RIGHT',
     *     TABSHIFT: 'LEFT'
     * }
     *
     * @example
     * // To map alternative nav keypresses to a/w/d/s and extend select to A/W/D/S:
     * navKeyMap: {
     *     a: 'LEFT', A: 'LEFTSHIFT',
     *     w: 'UP', W: 'UPSHIFT',
     *     s: 'DOWN', S: 'DOWNSHIFT',
     *     d: 'RIGHT', D: 'RIGHTSHIFT'
     * }
     *
     * @default
     * @type {object|undefined}
     * @memberOf module:defaults
     */
    navKeyMap: {
        RETURN: 'DOWN',
        RETURNSHIFT: 'UP',
        TAB: 'RIGHT',
        TABSHIFT: 'LEFT'
    },

    /** @summary Validation failure feedback.
     * @desc Validation occurs on {@link CellEditor#stopEditing}, normally called on commit (`TAB`, `ENTER`, or any other keys listed in `navKeyMap`).
     *
     * On successful validation, the value is saved back to the data source and the editor is closed.
     *
     * On validation failure, feedback is shown to the user in the form of an "error effect" possibly followed by an "end effect" containing a detailed explanation.
     *
     * The error effect to use is named in `feedbackEffect
     *
     * The value of this property is the number of times to show the "error effect" on validation failure before showing the detailed explanation.
     *
     * `feedback` may be set to one of:
     * * **`undefined`** - Do not show the error effect or the alert. Just discard the value and close the editor (as if `ESC` had been typed).
     * * **`0`** - Just shows the error feedback effect (see the {@link CellEditor#errorEffect|errorEffect} property).
     * * **`1`** - Shows the error feedback effect followed by the detailed explanation.
     * * `2` or more:
     *   1. Shows the error feedback effect
     *   2. On every `feedback` tries, shows the detailed explanation.
     * @default
     * @type {number|undefined}
     * @memberOf module:defaults
     */
    feedbackCount: 3,

    /**
     * @default
     * @type {{name:string,options:object}|string}
     * @memberOf module:defaults
     */
    feedbackEffect: 'shaker',

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    readOnly: false,

    /**
     * @default
     * @type {number}
     * @memberOf module:defaults
     */
    fixedColumnCount: 0,

    /**
     * @default
     * @type {number}
     * @memberOf module:defaults
     */
    fixedRowCount: 0,

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     * @see {@link module:dynamicProperties.showRowNumbers}
     */
    rowHeaderNumbers: true,

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     * @see {@link module:dynamicProperties.showRowNumbers}
     */
    rowHeaderCheckboxes: true,

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    showTreeColumn: true,

    /**
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    treeRenderer: 'SimpleCell',

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    showHeaderRow: true,

    /** Clicking in a cell "selects" it; it is added to the select region and repainted with "cell selection" colors.
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    cellSelection: true,

    /** Clicking in a column header (top row) "selects" the column; the entire column is added to the select region and repainted with "column selection" colors.
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    columnSelection: true,

    /** Clicking in a row header (leftmost column) "selects" the row; the entire row is added to the select region and repainted with "row selection" colors.
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    rowSelection: true,

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    singleRowSelectionMode: true,

    /**
     * @summary Fill color for last selection overlay.
     * @desc The color should be translucent (or transparent). Note that "Partial" grid renderers (such as the {@link paintCellsAsNeeded} renderer) do not draw overlay because it just gets darker and darker for non-updated cells.
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    selectionRegionOverlayColor: 'transparent', // 'rgba(0, 0, 48, 0.2)',

    /**
     * @summary Stroke color for last selection overlay.
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    selectionRegionOutlineColor: 'rgb(69, 69, 69)',

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    columnAutosizing: true,

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    rowNumberAutosizing: true,

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    headerTextWrapping: false,

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    rowResize: false,


    /* CELL EDITING */

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    editable: true,

    /**
     * Edit cell on double-click rather than single-click.
     *
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    editOnDoubleClick: true,

    /**
     * Grid-level property.
     * When user presses a "printable" keyboard character _or_ BACKSPACE _or_ DELETE:
     * 1. Activate cell editor on current cell (i.e., origin of most recent selection).
     * 2. If cell editor is a text editor:
     *    1. Replace current value with the character the user typed; or
     *    2. Clear it on BACKSPACE, DELETE, or other invalid character (_e.g._ when user types a letter but the cell editor only accepts digits).
     *
     * > In invoked, user has the option to back out by pressing the ESCAPE key.
     *
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    editOnKeydown: true,

    /**
     * @summary Open cell editor when cell selected via keyboard navigation.
     * @desc Keyboard navigation always includes:
     * 1. The four arrow keys -- but only when there is no active text cell editor open
     * 2. Additional keys mapped to the four directs in {@link module:defaults.navKeyMap}
     *
     * Generally set at the grid level. If set at the column (or cell) level, note that the property pertains to the cell navigated _to,_ not the cell navigated _away from._
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    editOnNextCell: false,


    /* COLUMN SORTING */

    /**
     * Ignore sort handling in feature/ColumnSorting.js.
     * Useful for excluding some columns but not other from participating in sorting.
     *
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    unsortable: false,

    /**
     * Sort column on double-click rather than single-click.
     *
     * Used by:
     * * feature/ColumnSorting.js to decide which event to respond to (if any, see `unsortabe`).
     * * feature/ColumnSelection.js to decide whether or not to wait for double-click.
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    sortOnDoubleClick: true,

    /**
     * **This is a standard property definition for sort plug-in use.
     * It is not referenced in core.**
     *
     * The maximum number of columns that may participate in a multi-column sort (via ctrl-click headers).
     * @default
     * @type {number}
     * @memberOf module:defaults
     */
    maxSortColumns : 3,

    /**
     * **This is a standard property definition for sort plug-in use.
     * It is not referenced in core.**
     *
     * Column(s) participating and subsequently hidden still affect sort.
     *
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    sortOnHiddenColumns: true,


    /**
     * @summary Retain row selections.
     * @desc When falsy, row selections are cleared when selecting cells; when truthy, row selections are kept as is when selecting cells.
     * @todo Deprecate in favor of something simpler like `keepRowSelections`. (The current name is misleading and has caused some confusion among both developers and users. At the very least it should have been called `checkboxOnlyRowDeselections`.)
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    checkboxOnlyRowSelections: false,

    /**
     * @summary Select cell's entire row.
     * @desc When truthy, selecting a cell will also select the entire row it is in, subject to note #1 below.
     *
     * Notes:
     * 1. Ineffectual unless `checkboxOnlyRowSelections` is set to `false`.
     * 2. To allow auto-selection of _multiple rows,_ set `singleRowSelectionMode` to `false`.
     *
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    autoSelectRows: false,

    /**
     * @summary Select cell's entire column.
     * @desc When truthy, selecting a cell will also select the entire column it is in.
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    autoSelectColumns: false,

    /** @summary Name of a formatter for cell text.
     * @desc Unknown formatter falls back to the `string` formatter (simple conversion to string with `+ ''`).
     * @default undefined
     * @type {string}
     * @memberOf module:defaults
     * @tutorial localization
     */
    format: undefined,

    /** @summary Name of a cell editor from the {@link module:cellEditors|cellEditors API}..
     * @desc Not editable if named editor is does not exist.
     * @default undefined
     * @type {string}
     * @memberOf module:defaults
     * @tutorial cell-editors
     */
    editor: undefined,

    /**
     * Name of cell renderer from the {@link module:cellRenderers|cellRenderers API}.
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    renderer: 'SimpleCell',

    /**
     * Name of grid renderer.
     * Renderer must have been registered.
     * @see {@link Renderer#registerGridRenderer}.
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    gridRenderer: 'by-columns-and-rows',

    /********** HOVER COLORS **********/

    /** @typedef hoverColors
     * @property {boolean} [enable=false] - `false` means not hilite on hover
     * @property {cssColor} backgroundColor - cell, row, or column background color. Alpha channel will be respected and if given will be painted over the cells predetermined color.
     * @property {cssColor} [header.backgroundColor=backgroundColor] - for columns and rows, this is the background color of the column or row "handle" (header rows or columns, respectively). (Not used for cells.)
     */

    /** On mouse hover, whether to repaint the cell background and how.
     * @type {hoverColors}
     * @default '{ enabled: true, background: rgba(160, 160, 40, 0.30) }'
     * @memberOf module:defaults
     */
    hoverCellHighlight: {
        enabled: true,
        backgroundColor: 'rgba(160, 160, 40, 0.45)'
    },

    /** On mouse hover, whether to repaint the row background and how.
     * @type {hoverColors}
     * @default '{ enabled: true, background: rgba(100, 100, 25, 0.15) }'
     * @memberOf module:defaults
     */
    hoverRowHighlight: {
        enabled: true,
        backgroundColor: 'rgba(100, 100, 25, 0.30)'

    },

    /** On mouse hover, whether to repaint the column background and how.
     * @type {hoverColors}
     * @default '{ enabled: true, background: rgba(60, 60, 15, 0.15) }'
     * @memberOf module:defaults
     */
    hoverColumnHighlight: {
        enabled: true,
        backgroundColor: 'rgba(60, 60, 15, 0.15)'
    },

    /** @summary Display cell value as a link (with underline).
     * @desc One of:
     * * `boolean` - No action occurs on click; you would need to attach a 'fin-click' listener to the hypergrid object.
     *   * `true` - Displays the cell as a link.
     *   * _falsy_ - Displays the cell normally.
     * * `string` -  The URL is decorated (see {}) and then opened in a separate window/tab. See also {@link module:defaults.linkTarget|linkTarget}.
     *   * `'*'` - Use the cell value as the URL, ready for decorating (see {CellClick#openLink|openLink)).
     *   * _field name_ - Fetches the string from the named field in the same row, assumed to be a URL ready for decorating. (May contain only alphanumerics and underscore; no spaces or other punctuation.)
     *   * _otherwise_ Assumed to contains a URL ready for decorating.
     * * `function` - A function to execute to get the URL ready for decorating. The function is passed a single parameter, `cellEvent`, from which you can get the field `name`, `dataRow`, _etc._
     * * `Array` - An array to "apply" to {@link https://developer.mozilla.org/docs/Web/API/Window/open window.open} in its entirety. The first element is interpreted as above for `string` or `function`.
     *
     * In the case of `string` or `Array`, the link is further unpacked by {@link module:CellClick.openLink|openLink} and then sent to `grid.windowOpen`.
     *
     * @example
     * // following affect upper-left data cell:
     * grid.behavior.setCellProperty(0, 0, 'https://nytimes.com'); // absolute address using specific protocol
     * grid.behavior.setCellProperty(0, 0, '//nytimes.com'); // absolute address using current protocol
     * grid.behavior.setCellProperty(0, 0, '/page2.com'); // relative to current site
     * grid.behavior.setCellProperty(0, 0, 'mypage.com'); // relative to current page
     * grid.behavior.setCellProperty(0, 0, 'mypage.com?id=%value'); // cell's value will replace %value
     * grid.behavior.setCellProperty(0, 0, ['//www.newyorker.com', 'ny', undefined, true]) // target='ny', replace=true
     * @type {boolean|string|Array}
     * @type {boolean}
     * @default
     * @memberOf module:defaults
     */
    link: false,

    /** @summary The window (or tab) in which to open the link.
     * @desc The default ('_blank'`) will open a new window for every click.
     *
     * To have the first click open a new window and all subsequent clicks reuse that same window, set this to an arbitrary string.
     *
     * Otherwise, specific columns or cells can be set to open their links in their own window by setting the appropriate column's or cell's `linkTarget` property.
     * @default
     * @memberOf module:defaults
     */
    linkTarget: '_blank',

    /** @summary Underline link on hover only.
     * @type {boolean}
     * @default
     * @memberOf module:defaults
     */
    linkOnHover: false,

    /** @summary Color for link.
     * @desc Falsy means defer to foreground color.
     * @type {string}
     * @default
     * @memberOf module:defaults
     */
    linkColor: 'blue',

    /** @summary Color for visited link.
     * @desc Falsy means defer to foreground color.
     * @type {string}
     * @default
     * @memberOf module:defaults
     */
    linkVisitedColor: 'purple',

    /** @summary Color link on hover only.
     * @type {boolean}
     * @default
     * @memberOf module:defaults
     */
    linkColorOnHover: false,

    /** Display cell font with strike-through line drawn over it.
     * @type {boolean}
     * @default
     * @memberOf module:defaults
     */
    strikeThrough: false,

    /** Allow multiple cell region selections.
     * @type {boolean}
     * @default
     * @memberOf module:defaults
     */
    multipleSelections: false,

    /** @summary Re-render grid at maximum speed.
     * @desc In this mode:
     * * The "dirty" flag, set by calling `grid.repaint()`, is ignored.
     * * `grid.getCanvas().currentFPS` is a measure of the number times the grid is being re-rendered each second.
     * * The Hypergrid renderer gobbles up CPU time even when the grid appears idle (the very scenario `repaint()` is designed to avoid). For this reason, we emphatically advise against shipping applications using this mode.
     * @type {boolean}
     * @default
     * @memberOf module:defaults
     */
    enableContinuousRepaint: false,

    /** @summary Allow user to move columns .
     * @desc Columns can be reordered through either of two interfaces:
     * * Column Dragging feature
     * * behavior.columns API
     * @type {boolean}
     * @default
     * @memberOf module:defaults
     */
    columnsReorderable: true,

    /** @summary Column grab within this number of pixels from top of cell.
     * @type {number}
     * @default
     * @memberOf module:defaults
     */
    columnGrabMargin: 5,

    /** @summary Set up a clipping region around each column before painting cells.
     * @desc One of:
     * * `true` - Clip column.
     * * `false` - Do not clip column.
     * * `null` - Clip iff last active column.
     *
     * Clipping prevents text that overflows to the right of the cell from being rendered.
     * If you can guarantee that none of your text will overflow, turn column clipping off
     * for better performance. If not, you may still be able to get away without clipping.
     * If the background color of the next column is opaque, you don't really need to clip,
     * although text can leak out to the right of the last column. Clipping the last column
     * only can help this but not solve it since the leaked text from (say) the column before
     * the last column could stretch across the entire last column and leak out anyway.
     * The solution to this is to clip the rendered string so at most only a partial character
     * will overflow.
     * @type {boolean|undefined}
     * @default
     * @memberOf module:defaults
     */
    columnClip: true,

    /**
     * @summary Repeating pattern of property overrides for grid rows.
     * @desc Notes:
     * * "Grid row" refers to data rows.
     * * Row index modulo is applied when dereferencing this array. In other words, this array represents a _repeating pattern_ of properties to be applied to the data rows.
     * * For no row properties, specify a falsy value in place of the array.
     * * Do not specify an empty array (will throw an error).
     * * Each element of the array may be either:
     *   * An object containing property overrides to be applied to every cell of the row; or
     *   * A falsy value signifying that there are no row properties for this specific row.
     * * Caveat: Row properties use `Object.assign()` to copy properties and therefore are not as performant as column properties which use prototype chain.
     * * `Object.assign()` is a polyfill in older versions of Chrome (<45) and in all Internet Explorer (through 11).
     * @type {undefined|object[]}
     * @default
     * @memberOf module:defaults
     */
    rowStripes: undefined,

    // for Renderer.prototype.assignProps
    propClassLayers: propClassLayersMap.DEFAULT,

    /**
     * Used to access registered features -- unless behavior has a non-empty `features` property (array of feature contructors).
     */
    features: [
        'filters',
        'cellselection',
        'keypaging',
        'columnresizing',
        // 'rowresizing',
        'rowselection',
        'columnselection',
        'columnmoving',
        'columnsorting',
        'cellclick',
        'cellediting',
        'onhover'
    ],

    /** @summary Restore row selections across data transformations (`reindex` calls).
     * @desc The restoration is based on the underlying data row indexes.
     * @type {boolean}
     * @default
     * @memberOf module:defaults
     */
    restoreRowSelections: true,

    /** @summary Restore column selections across data transformations (`reindex` calls).
     * @desc The restoration is based on the column names.
     * @type {boolean}
     * @default
     * @memberOf module:defaults
     */
    restoreColumnSelections: true,

    /** @summary How to truncate text.
     * @desc A "quaternary" value, one of:
     * * `undefined` - Text is not truncated.
     * * `true` (default) - Truncate sufficient characters to fit ellipsis if possible. Most acceptable option that avoids need for clipping.
     * * `false` - Truncate *before* last partially visible character. Visibly annoying; semantically jarring.
     * * `null` - Truncate *after* partially visible character. Less visibly annoying; still semantically confusing. Best solution when combined with either column clipping or painting over with next column's background.
     * @type {boolean|null|undefined}
     * @default
     * @memberOf module:defaults
     */
    truncateTextWithEllipsis: true
};


var warned = {};

function rowPropertiesDeprecationWarning() {
    if (!warned.rowProperties) {
        warned.rowProperties = true;
        console.warn('The `rowProperties` property has been deprecated as of v2.1.0 in favor of `rowStripes`. (Will be removed in a future release.)');
    }
}

Object.defineProperties(defaults, {
    rowProperties: {
        get: function() {
            rowPropertiesDeprecationWarning();
            return this.rowStripes;
        },
        set: function(rowProperties) {
            rowPropertiesDeprecationWarning();
            this.rowStripes = rowProperties;
        }
    }
});

function columnOnlyError() {
    throw new HypergridError('Attempt to set/get column-only property on a non-column properties object.');
}

['name', 'type', 'header', 'calculator'].forEach(function(key) {
    Object.defineProperty(defaults, key, {
        set: columnOnlyError
    });
});

/** @typedef {string} cssColor
 * @see https://developer.mozilla.org/docs/Web/CSS/color_value
 */
/** @typedef {string} cssFont
 * @see https://developer.mozilla.org/docs/Web/CSS/font
 */


/**
 * Returns any value of `keyChar` that passes the following logic test:
 * 1. If a non-printable, white-space character, then nav key.
 * 2. If not (i.e., a normal character), can still be a nav key if not editing on key down.
 * 3. If not, can still be a nav key if CTRL key is down.
 *
 * Note: Callers are typcially only interested in the following values of `keyChar` and will ignore all others:
 * * `'LEFT'` and `'LEFTSHIFT'`
 * * `'RIGHT'` and `'RIGHTSHIFT'`
 * * `'UP'` and `'UPSHIFT'`
 * * `'DOWN'` and `'DOWNSHIFT'`
 *
 * @param {string} keyChar - A value from Canvas's `charMap`.
 * @param {boolean} [ctrlKey=false] - The CTRL key was down.
 * @returns {undefined|string} `undefined` means not a nav key; otherwise returns `keyChar`.
 * @memberOf module:defaults
 */
function navKey(keyChar, ctrlKey) {
    var result;
    if (keyChar.length > 1 || !this.editOnKeydown || ctrlKey) {
        result = keyChar; // return the mapped value
    }
    return result;
}

/**
 * Returns only values of `keyChar` that, when run through {@link module:defaults.navKeyMap|navKeyMap}, pass the {@link module:defaults.navKey|navKey} logic test.
 *
 * @param {string} keyChar - A value from Canvas's `charMap`, to be remapped through {@link module:defaults.navKeyMap|navKeyMap}.
 * @param {boolean} [ctrlKey=false] - The CTRL key was down.
 * @returns {undefined|string} `undefined` means not a nav key; otherwise returns `keyChar`.
 * @memberOf module:defaults
 */
function mappedNavKey(keyChar, ctrlKey) {
    keyChar = this.navKeyMap[keyChar];
    return keyChar && this.navKey(keyChar);
}

/** @summary Reapply cell properties after `getCell`.
 * @type {boolean}
 * @default
 * @memberOf module:defaults
 */
function reapplyCellProperties(value) {
    if (!warned.reapplyCellProperties) {
        console.warn('The `.reapplyCellProperties` property has been deprecated as of v2.1.3 in favor of using the new `.propClassLayers` property. (May be removed in a future release.) This property is now a setter which sets `.propClassLayers` to `.propClassLayersMap.DEFAULT` (grid ← columns ← stripes ← rows ← cells) on truthy or `propClassLayersMap.NO_ROWS` (grid ← columns ← cells) on falsy, which is what you will see on properties stringification. This will give the same effect in most cases as the former property implementation, but not in all cases due to it no longer being applied dynamically. Developers should discontinue use of this property and start specifying `.propClassLayers` instead.');
        warned.reapplyCellProperties = true;
    }
    this.propClassLayers = value ? propClassLayersMap.NO_ROWS : propClassLayersMap.DEFAULT;
}

function deleteProp(propName) {
    var descriptor = Object.getOwnPropertyDescriptor(this, propName);
    if (!descriptor) {
        return false; // own property not found
    } else if (!descriptor.get) {
        return delete this[propName]; // non-accessor property found (returns !descriptor.configurable)
    } else if (descriptor.get.toString().indexOf('.var.')) {
        this.var[propName] = Object.getPrototypeOf(this)[propName];
    } else {
        return true; // property not deletable
    }
    this.grid.repaint();
    return false; // delete was successful
}

/**
 * @summary Execute value if "calculator" (function) or if column has calculator.
 * @desc This function is referenced here so:
 * 1. It will be available to the cell renderers
 * 2. Its context will naturally be the `config` object
 * @default {@link module:defaults.exec|exec}
 * @method
 * @param vf - Value or function.
 * @memberOf module:defaults
 */
function exec(vf) {
    if (this.dataRow) {
        var calculator = (typeof vf)[0] === 'f' && vf || this.calculator;
        if (calculator) {
            vf = calculator(this.dataRow, this.name, this.subrow);
        }
    }
    return vf;
}

// Add "utility" props so they will be available wherever props are available but make them non-enumerable because they are not real props.
Object.defineProperties(defaults, {
    mixIn: { value: require('overrider').mixIn },
    delete: { value: deleteProp },
    propClassEnum: { value: propClassEnum },
    propClassLayersMap: { value: propClassLayersMap },
    navKey: { value: navKey },
    mappedNavKey: { value: mappedNavKey },
    reapplyCellProperties: { set: reapplyCellProperties },
    exec: { value: exec }
});

module.exports = defaults;

},{"./lib/error":76,"overrider":95}],52:[function(require,module,exports){
'use strict';

var Feature = require('./Feature');

/**
 * @constructor
 * @extends Feature
 */
var CellClick = Feature.extend('CellClick', {

    handleMouseMove: function(grid, event) {
        var link = event.properties.link,
            isActionableLink = link && typeof link !== 'boolean'; // actionable with truthy other than `true`

        this.cursor = isActionableLink ? 'pointer' : null;

        if (this.next) {
            this.next.handleMouseMove(grid, event);
        }
    },

    /**
     * @param {Hypergrid} grid
     * @param {CellEvent} event - the event details
     * @memberOf CellClick#
     */
    handleClick: function(grid, event) {
        var consumed = (event.isDataCell || event.isTreeColumn) && (
            this.openLink(grid, event) !== undefined ||
            grid.behavior.cellClicked(event)
        );

        if (!consumed && this.next) {
            this.next.handleClick(grid, event);
        }
    },

    /**
     * @summary Open the cell's URL.
     *
     * @desc The URL is found in the cell's {@link module:defaults.link|link} property, which serves two functions:
     * 1. **Renders as a link.** When truthy causes {@link SimpleCell} cell renderer to render the cell underlined with {@link module:defaults.linkColor|linkColor}. (See also {@link module:defaults.linkOnHover|linkOnHover} and {@link module:defaults.linkColorOnHover|linkColorOnHover}.) Therefore, setting this property to `true` will render as a link, although clicking on it will have no effect. This is useful if you wish to handle the click yourself by attaching a `'fin-click'` listener to your hypergrid.
     * 2. **Fetch the URL.** The value of the link property is interpreted as per {@link module:defaults.link|link}.
     * 3. **Decorate the URL.** The cell name (_i.e.,_ the data column name) and cell value are merged into the URL wherever the respective substrings `'%name'` and `'%value'` are found. For example, if the column name is "age" and the cell value is 6 (or a function returning 25), and the link is `'http://www.abc.com?%name=%value'`, then the actual link (first argument given to `grid.windowOpen`) would be `'http://www.abc.com?age=25'`.
     * 4. **Open the URL.** The link is then opened by {@link Hypergrid#windowOpen|grid.windowOpen}. If `link` is an array, it is "applied" to `grid.windowOpen` in its entirety; otherwise, `grid.windowOpen` is called with the link as the first argument and {@link module:defaults.linkTarget|linkTarget} as the second.
     * 5. **Decorate the link.** On successful return from `windowOpen()`, the text is colored as "visited" as per the cell's {@link module:defaults.linkVisitedColor|linkVisitedColor} property (by setting the cell's `linkColor` property to its `linkVisitedColor` property).

     * @param {Hypergrid} grid
     * @param {CellEvent} cellEvent - Event details.
     *
     * @returns {boolean|window|null|undefined} One of:
     *
     * | Value | Meaning |
     * | :---- | :------ |
     * | `undefined` | no link to open |
     * | `null` | `grid.windowOpen` failed to open a window |
     * | _otherwise_ | A `window` reference returned by a successful call to `grid.windowOpen`. |
     *
     * @memberOf CellClick#
     */
    openLink: function(grid, cellEvent) {
        var result, url,
            dataRow = cellEvent.dataRow,
            config = Object.create(cellEvent.properties, { dataRow: { value: dataRow } }),
            value = config.exec(cellEvent.value),
            linkProp = cellEvent.properties.link,
            isArray = linkProp instanceof Array,
            link = isArray ? linkProp[0] : linkProp;

        // STEP 2: Fetch the URL
        switch (typeof link) {
            case 'string':
                if (link === '*') {
                    url = value;
                } else if (/^\w+$/.test(link)) {
                    url = dataRow[link];
                }
                break;

            case 'function':
                url = link(cellEvent);
                break;
        }

        if (url) {
            // STEP 3: Decorate the URL
            url = url.toString().replace(/%name/g, config.name).replace(/%value/g, value);

            // STEP 4: Open the URL
            if (isArray) {
                linkProp = linkProp.slice();
                linkProp[0] = url;
                result = grid.windowOpen.apply(grid, linkProp);
            } else {
                result = grid.windowOpen(url, cellEvent.properties.linkTarget);
            }
        }

        // STEP 5: Decorate the link as "visited"
        if (result) {
            cellEvent.setCellProperty('linkColor', grid.properties.linkVisitedColor);
            grid.renderer.resetCellPropertiesCache(cellEvent);
            grid.repaint();
        }

        return result;
    }

});

module.exports = CellClick;

},{"./Feature":59}],53:[function(require,module,exports){
'use strict';

var Feature = require('./Feature');
var CellEditor = require('../cellEditors/CellEditor');

/**
 * @constructor
 * @extends Feature
 */
var CellEditing = Feature.extend('CellEditing', {

    /**
     * @memberOf CellEditing.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleClick: function(grid, event) {
        edit.call(this, grid, event);
    },

    /**
     * @memberOf CellEditing.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleDoubleClick: function(grid, event) {
        edit.call(this, grid, event, true);
    },

    /**
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @memberOf KeyPaging.prototype
     */
    handleKeyDown: function(grid, event) {
        var char, isVisibleChar, isDeleteChar, editor, cellEvent;

        if (
            (cellEvent = grid.getGridCellFromLastSelection()) &&
            cellEvent.properties.editOnKeydown &&
            !grid.cellEditor &&
            (
                (char = event.detail.char) === 'F2' ||
                (isVisibleChar = char.length === 1 && !(event.detail.meta || event.detail.ctrl)) ||
                (isDeleteChar = char === 'DELETE' || char === 'BACKSPACE')
            )
        ) {
            editor = grid.onEditorActivate(cellEvent);

            if (editor instanceof CellEditor) {
                if (isVisibleChar) {
                    editor.input.value = char;
                } else if (isDeleteChar) {
                    editor.setEditorValue('');
                }
                event.detail.primitiveEvent.preventDefault();
            }
        } else if (this.next) {
            this.next.handleKeyDown(grid, event);
        }
    }

});

function edit(grid, event, onDoubleClick) {
    if (
        event.isDataCell &&
        !(event.getCellProperty('editOnDoubleClick') ^ onDoubleClick) // both same (true or falsy)?
    ) {
        grid.onEditorActivate(event);
    }

    if (this.next) {
        this.next[onDoubleClick ? 'handleDoubleClick' : 'handleClick'](grid, event);
    }
}

module.exports = CellEditing;

},{"../cellEditors/CellEditor":31,"./Feature":59}],54:[function(require,module,exports){
'use strict';

var Feature = require('./Feature');

/**
 * @constructor
 * @extends Feature
 */
var CellSelection = Feature.extend('CellSelection', {

    /**
     * The pixel location of the mouse pointer during a drag operation.
     * @type {Point}
     * @memberOf CellSelection.prototype
     */
    currentDrag: null,

    /**
     * the cell coordinates of the where the mouse pointer is during a drag operation
     * @type {Object}
     * @memberOf CellSelection.prototype
     */
    lastDragCell: null,

    /**
     * a millisecond value representing the previous time an autoscroll started
     * @type {number}
     * @default 0
     * @memberOf CellSelection.prototype
     */
    sbLastAuto: 0,

    /**
     * a millisecond value representing the time the current autoscroll started
     * @type {number}
     * @default 0
     * @memberOf CellSelection.prototype
     */
    sbAutoStart: 0,

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseUp: function(grid, event) {
        if (this.dragging) {
            this.dragging = false;
        }
        if (this.next) {
            this.next.handleMouseUp(grid, event);
        }
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDown: function(grid, event) {
        var dx = event.gridCell.x,
            dy = event.dataCell.y,
            isSelectable = grid.behavior.getCellProperty(event.dataCell.x, event.gridCell.y, 'cellSelection');

        if (isSelectable && event.isDataCell && !event.primitiveEvent.detail.isRightClick) {
            var dCell = grid.newPoint(dx, dy),
                primEvent = event.primitiveEvent,
                keys = primEvent.detail.keys;
            this.dragging = true;
            this.extendSelection(grid, dCell, keys);
        } else if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDrag: function(grid, event) {
        if (this.dragging && grid.properties.cellSelection && !event.primitiveEvent.detail.isRightClick) {
            this.currentDrag = event.primitiveEvent.detail.mouse;
            this.lastDragCell = grid.newPoint(event.gridCell.x, event.dataCell.y);
            this.checkDragScroll(grid, this.currentDrag);
            this.handleMouseDragCellSelection(grid, this.lastDragCell, event.primitiveEvent.detail.keys);
        } else if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleKeyDown: function(grid, event) {
        var detail = event.detail,
            cellEvent = grid.getGridCellFromLastSelection(true),
            navKey = cellEvent && (
                cellEvent.properties.mappedNavKey(detail.char, detail.ctrl) ||
                cellEvent.properties.navKey(detail.char, detail.ctrl)
            ),
            handler = this['handle' + navKey];


        // STEP 1: Move the selection
        if (handler) {
            handler.call(this, grid, detail);

            // STEP 2: Open the cell editor at the new position if it has `editOnNextCell` and is `editable`
            cellEvent = grid.getGridCellFromLastSelection(true); // new cell
            if (cellEvent.properties.editOnNextCell) {
                grid.editAt(cellEvent); // succeeds only if `editable`
            }

            // STEP 3: If editor not opened on new cell, take focus
            if (!grid.cellEditor) {
                grid.takeFocus();
            }
        } else if (this.next) {
            this.next.handleKeyDown(grid, event);
        }
    },

    /**
     * @memberOf CellSelection.prototype
     * @desc Handle a mousedrag selection.
     * @param {Hypergrid} grid
     * @param {Object} mouse - the event details
     * @param {Array} keys - array of the keys that are currently pressed down
     */
    handleMouseDragCellSelection: function(grid, gridCell, keys) {
        var x = Math.max(0, gridCell.x),
            y = Math.max(0, gridCell.y),
            previousDragExtent = grid.getDragExtent(),
            mouseDown = grid.getMouseDown(),
            newX = x - mouseDown.x,
            newY = y - mouseDown.y;

        if (previousDragExtent.x === newX && previousDragExtent.y === newY) {
            return;
        }

        grid.clearMostRecentSelection();

        grid.select(mouseDown.x, mouseDown.y, newX, newY);
        grid.setDragExtent(grid.newPoint(newX, newY));

        grid.repaint();
    },

    /**
     * @memberOf CellSelection.prototype
     * @desc this checks while were dragging if we go outside the visible bounds, if so, kick off the external autoscroll check function (above)
     * @param {Hypergrid} grid
     * @param {Object} mouse - the event details
     */
    checkDragScroll: function(grid, mouse) {
        if (!grid.properties.scrollingEnabled) {
            return;
        }
        var b = grid.getDataBounds();
        var inside = b.contains(mouse);
        if (inside) {
            if (grid.isScrollingNow()) {
                grid.setScrollingNow(false);
            }
        } else if (!grid.isScrollingNow()) {
            grid.setScrollingNow(true);
            this.scrollDrag(grid);
        }
    },

    /**
     * @memberOf CellSelection.prototype
     * @desc this function makes sure that while we are dragging outside of the grid visible bounds, we srcroll accordingly
     * @param {Hypergrid} grid
     */
    scrollDrag: function(grid) {
        if (!grid.isScrollingNow()) {
            return;
        }

        var dragStartedInHeaderArea = grid.isMouseDownInHeaderArea(),
            lastDragCell = this.lastDragCell,
            b = grid.getDataBounds(),

            xOffset = 0,
            yOffset = 0,

            numFixedColumns = grid.getFixedColumnCount(),
            numFixedRows = grid.getFixedRowCount(),

            dragEndInFixedAreaX = lastDragCell.x < numFixedColumns,
            dragEndInFixedAreaY = lastDragCell.y < numFixedRows;

        if (!dragStartedInHeaderArea) {
            if (this.currentDrag.x < b.origin.x) {
                xOffset = -1;
            }
            if (this.currentDrag.y < b.origin.y) {
                yOffset = -1;
            }
        }
        if (this.currentDrag.x > b.origin.x + b.extent.x) {
            xOffset = 1;
        }
        if (this.currentDrag.y > b.origin.y + b.extent.y) {
            yOffset = 1;
        }

        var dragCellOffsetX = xOffset;
        var dragCellOffsetY = yOffset;

        if (dragEndInFixedAreaX) {
            dragCellOffsetX = 0;
        }
        if (dragEndInFixedAreaY) {
            dragCellOffsetY = 0;
        }

        this.lastDragCell = lastDragCell.plusXY(dragCellOffsetX, dragCellOffsetY);
        grid.scrollBy(xOffset, yOffset);
        this.handleMouseDragCellSelection(grid, lastDragCell, []); // update the selection
        grid.repaint();
        setTimeout(this.scrollDrag.bind(this, grid), 25);
    },

    /**
     * @memberOf CellSelection.prototype
     * @desc extend a selection or create one if there isnt yet
     * @param {Hypergrid} grid
     * @param {Object} gridCell - the event details
     * @param {Array} keys - array of the keys that are currently pressed down
     */
    extendSelection: function(grid, gridCell, keys) {
        var hasCTRL = keys.indexOf('CTRL') >= 0,
            hasSHIFT = keys.indexOf('SHIFT') >= 0,
            mousePoint = grid.getMouseDown(),
            x = gridCell.x, // - numFixedColumns + scrollLeft;
            y = gridCell.y; // - numFixedRows + scrollTop;

        //were outside of the grid do nothing
        if (x < 0 || y < 0) {
            return;
        }

        //we have repeated a click in the same spot deslect the value from last time
        if (
            hasCTRL &&
            x === mousePoint.x &&
            y === mousePoint.y
        ) {
            grid.clearMostRecentSelection();
            grid.popMouseDown();
            grid.repaint();
            return;
        }

        if (!hasCTRL && !hasSHIFT) {
            grid.clearSelections();
        }

        if (hasSHIFT) {
            grid.clearMostRecentSelection();
            grid.select(mousePoint.x, mousePoint.y, x - mousePoint.x, y - mousePoint.y);
            grid.setDragExtent(grid.newPoint(x - mousePoint.x, y - mousePoint.y));
        } else {
            grid.select(x, y, 0, 0);
            grid.setMouseDown(grid.newPoint(x, y));
            grid.setDragExtent(grid.newPoint(0, 0));
        }
        grid.repaint();
    },


    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     */
    handleDOWNSHIFT: function(grid) {
        this.moveShiftSelect(grid, 0, 1);
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleUPSHIFT: function(grid) {
        this.moveShiftSelect(grid, 0, -1);
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleLEFTSHIFT: function(grid) {
        this.moveShiftSelect(grid, -1, 0);
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleRIGHTSHIFT: function(grid) {
        this.moveShiftSelect(grid, 1, 0);
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleDOWN: function(grid, event) {
        //keep the browser viewport from auto scrolling on key event
        event.primitiveEvent.preventDefault();

        var count = this.getAutoScrollAcceleration();
        grid.moveSingleSelect(0, count);
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleUP: function(grid, event) {
        //keep the browser viewport from auto scrolling on key event
        event.primitiveEvent.preventDefault();

        var count = this.getAutoScrollAcceleration();
        grid.moveSingleSelect(0, -count);
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleLEFT: function(grid) {
        grid.moveSingleSelect(-1, 0);
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleRIGHT: function(grid) {
        grid.moveSingleSelect(1, 0);
    },

    /**
     * @memberOf CellSelection.prototype
     * @desc If we are holding down the same navigation key, accelerate the increment we scroll
     * #### returns: integer
     */
    getAutoScrollAcceleration: function() {
        var count = 1;
        var elapsed = this.getAutoScrollDuration() / 2000;
        count = Math.max(1, Math.floor(elapsed * elapsed * elapsed * elapsed));
        return count;
    },

    /**
     * @memberOf CellSelection.prototype
     * @desc set the start time to right now when we initiate an auto scroll
     */
    setAutoScrollStartTime: function() {
        this.sbAutoStart = Date.now();
    },

    /**
     * @memberOf CellSelection.prototype
     * @desc update the autoscroll start time if we haven't autoscrolled within the last 500ms otherwise update the current autoscroll time
     */
    pingAutoScroll: function() {
        var now = Date.now();
        if (now - this.sbLastAuto > 500) {
            this.setAutoScrollStartTime();
        }
        this.sbLastAuto = Date.now();
    },

    /**
     * @memberOf CellSelection.prototype
     * @desc answer how long we have been auto scrolling
     * #### returns: integer
     */
    getAutoScrollDuration: function() {
        if (Date.now() - this.sbLastAuto > 500) {
            return 0;
        }
        return Date.now() - this.sbAutoStart;
    },

    /**
     * @memberOf CellSelection.prototype
     * @desc Augment the most recent selection extent by (offsetX,offsetY) and scroll if necessary.
     * @param {Hypergrid} grid
     * @param {number} offsetX - x coordinate to start at
     * @param {number} offsetY - y coordinate to start at
     */
    moveShiftSelect: function(grid, offsetX, offsetY) {
        if (grid.extendSelect(offsetX, offsetY)) {
            this.pingAutoScroll();
        }
    }

});

module.exports = CellSelection;

},{"./Feature":59}],55:[function(require,module,exports){
/* eslint-env browser */
/* global requestAnimationFrame */

'use strict';

// This feature is responsible for column drag and drop reordering.
// This object is a mess and desperately needs a complete rewrite.....

var Feature = require('./Feature');

var GRAB = ['grab', '-moz-grab', '-webkit-grab'],
    GRABBING = ['grabbing', '-moz-grabbing', '-webkit-grabbing'],
    setName = function(name) { this.cursor = name; };

var columnAnimationTime = 150;
var dragger;
var draggerCTX;
var floatColumn;
var floatColumnCTX;

/**
 * @constructor
 * @extends Feature
 */
var ColumnMoving = Feature.extend('ColumnMoving', {

    /**
     * queue up the animations that need to play so they are done synchronously
     * @type {Array}
     * @memberOf CellMoving.prototype
     */
    floaterAnimationQueue: [],

    /**
     * am I currently auto scrolling right
     * @type {boolean}
     * @memberOf CellMoving.prototype
     */
    columnDragAutoScrollingRight: false,

    /**
     * am I currently auto scrolling left
     * @type {boolean}
     * @memberOf CellMoving.prototype
     */
    columnDragAutoScrollingLeft: false,

    /**
     * is the drag mechanism currently enabled ("armed")
     * @type {boolean}
     * @memberOf CellMoving.prototype
     */
    dragArmed: false,

    /**
     * am I dragging right now
     * @type {boolean}
     * @memberOf CellMoving.prototype
     */
    dragging: false,

    /**
     * the column index of the currently dragged column
     * @type {number}
     * @memberOf CellMoving.prototype
     */
    dragCol: -1,

    /**
     * an offset to position the dragged item from the cursor
     * @type {number}
     * @memberOf CellMoving.prototype
     */
    dragOffset: 0,

    /**
     * @memberOf CellMoving.prototype
     * @desc give me an opportunity to initialize stuff on the grid
     * @param {Hypergrid} grid
     */
    initializeOn: function(grid) {
        this.isFloatingNow = false;
        this.initializeAnimationSupport(grid);
        if (this.next) {
            this.next.initializeOn(grid);
        }
    },

    /**
     * @memberOf CellMoving.prototype
     * @desc initialize animation support on the grid
     * @param {Hypergrid} grid
     */
    initializeAnimationSupport: function(grid) {
        if (!dragger) {
            dragger = document.createElement('canvas');
            dragger.setAttribute('width', '0px');
            dragger.setAttribute('height', '0px');
            dragger.style.position = 'fixed';

            document.body.appendChild(dragger);
            draggerCTX = dragger.getContext('2d');
        }
        if (!floatColumn) {
            floatColumn = document.createElement('canvas');
            floatColumn.setAttribute('width', '0px');
            floatColumn.setAttribute('height', '0px');
            floatColumn.style.position = 'fixed';

            document.body.appendChild(floatColumn);
            floatColumnCTX = floatColumn.getContext('2d');
        }

    },

    /**
     * @memberOf CellMoving.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDrag: function(grid, event) {

        var gridCell = event.gridCell;
        var x;
        //var y;

        var distance = Math.abs(event.primitiveEvent.detail.dragstart.x - event.primitiveEvent.detail.mouse.x);

        if (distance < 10 || event.isColumnFixed) {
            if (this.next) {
                this.next.handleMouseDrag(grid, event);
            }
            return;
        }

        if (event.isHeaderCell && this.dragArmed && !this.dragging) {
            this.dragging = true;
            this.dragCol = gridCell.x;
            this.dragOffset = event.mousePoint.x;
            this.detachChain();
            x = event.primitiveEvent.detail.mouse.x - this.dragOffset;
            //y = event.primitiveEvent.detail.mouse.y;
            this.createDragColumn(grid, x, this.dragCol);
        } else if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }

        if (this.dragging) {
            x = event.primitiveEvent.detail.mouse.x - this.dragOffset;
            //y = event.primitiveEvent.detail.mouse.y;
            this.dragColumn(grid, x);
        }
    },

    /**
     * @memberOf CellMoving.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDown: function(grid, event) {
        if (
            grid.properties.columnsReorderable &&
            !event.isColumnFixed
        ) {
            if (event.isHeaderCell) {
                this.dragArmed = true;
                this.cursor = GRABBING;
                grid.clearSelections();
            }
        }
        if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    },

    /**
     * @memberOf CellMoving.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseUp: function(grid, event) {
        //var col = event.gridCell.x;
        if (this.dragging) {
            this.cursor = null;
            //delay here to give other events a chance to be dropped
            var self = this;
            this.endDragColumn(grid);
            setTimeout(function() {
                self.attachChain();
            }, 200);
        }
        this.dragCol = -1;
        this.dragging = false;
        this.dragArmed = false;
        this.cursor = null;
        grid.repaint();

        if (this.next) {
            this.next.handleMouseUp(grid, event);
        }

    },

    /**
     * @memberOf CellMoving.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseMove: function(grid, event) {
        if (
            grid.properties.columnsReorderable &&
            !event.isColumnFixed &&
            !this.dragging &&
            event.isHeaderCell &&
            event.mousePoint.y < grid.properties.columnGrabMargin
        ) {
            this.cursor = GRAB;
        } else {
            this.cursor = null;
        }

        if (this.next) {
            this.next.handleMouseMove(grid, event);
        }

        if (event.isHeaderCell && this.dragging) {
            this.cursor = GRABBING;
        }
    },

    /**
     * @memberOf CellMoving.prototype
     * @desc this is the main event handler that manages the dragging of the column
     * @param {Hypergrid} grid
     * @param {boolean} draggedToTheRight - are we moving to the right
     */
    floatColumnTo: function(grid, draggedToTheRight) {
        this.floatingNow = true;

        var visibleColumns = grid.renderer.visibleColumns;
        var scrollLeft = grid.getHScrollValue();
        var floaterIndex = grid.renderOverridesCache.floater.columnIndex;
        var draggerIndex = grid.renderOverridesCache.dragger.columnIndex;
        var hdpiratio = grid.renderOverridesCache.dragger.hdpiratio;

        var draggerStartX;
        var floaterStartX;
        var fixedColumnCount = grid.getFixedColumnCount();
        var draggerWidth = grid.getColumnWidth(draggerIndex);
        var floaterWidth = grid.getColumnWidth(floaterIndex);

        var max = grid.getVisibleColumnsCount();

        var doffset = 0;
        var foffset = 0;

        if (draggerIndex >= fixedColumnCount) {
            doffset = scrollLeft;
        }
        if (floaterIndex >= fixedColumnCount) {
            foffset = scrollLeft;
        }

        if (draggedToTheRight) {
            draggerStartX = visibleColumns[Math.min(max, draggerIndex - doffset)].left;
            floaterStartX = visibleColumns[Math.min(max, floaterIndex - foffset)].left;

            grid.renderOverridesCache.dragger.startX = (draggerStartX + floaterWidth) * hdpiratio;
            grid.renderOverridesCache.floater.startX = draggerStartX * hdpiratio;

        } else {
            floaterStartX = visibleColumns[Math.min(max, floaterIndex - foffset)].left;
            draggerStartX = floaterStartX + draggerWidth;

            grid.renderOverridesCache.dragger.startX = floaterStartX * hdpiratio;
            grid.renderOverridesCache.floater.startX = draggerStartX * hdpiratio;
        }
        grid.swapColumns(draggerIndex, floaterIndex);
        grid.renderOverridesCache.dragger.columnIndex = floaterIndex;
        grid.renderOverridesCache.floater.columnIndex = draggerIndex;


        this.floaterAnimationQueue.unshift(this.doColumnMoveAnimation(grid, floaterStartX, draggerStartX));

        this.doFloaterAnimation(grid);

    },

    /**
     * @memberOf CellMoving.prototype
     * @desc manifest the column drag and drop animation
     * @param {Hypergrid} grid
     * @param {number} floaterStartX - the x start coordinate of the column underneath that floats behind the dragged column
     * @param {number} draggerStartX - the x start coordinate of the dragged column
     */
    doColumnMoveAnimation: function(grid, floaterStartX, draggerStartX) {
        var self = this;
        return function() {
            var d = floatColumn;
            d.style.display = 'inline';
            self.setCrossBrowserProperty(d, 'transform', 'translate(' + floaterStartX + 'px, ' + 0 + 'px)');

            //d.style.webkit-webkit-Transform = 'translate(' + floaterStartX + 'px, ' + 0 + 'px)';
            //d.style.webkit-webkit-Transform = 'translate(' + floaterStartX + 'px, ' + 0 + 'px)';

            requestAnimationFrame(function() {
                self.setCrossBrowserProperty(d, 'transition', (self.isWebkit ? '-webkit-' : '') + 'transform ' + columnAnimationTime + 'ms ease');
                self.setCrossBrowserProperty(d, 'transform', 'translate(' + draggerStartX + 'px, ' + -2 + 'px)');
            });
            grid.repaint();
            //need to change this to key frames

            setTimeout(function() {
                self.setCrossBrowserProperty(d, 'transition', '');
                grid.renderOverridesCache.floater = null;
                grid.repaint();
                self.doFloaterAnimation(grid);
                requestAnimationFrame(function() {
                    d.style.display = 'none';
                    self.isFloatingNow = false;
                });
            }, columnAnimationTime + 50);
        };
    },

    /**
     * @memberOf CellMoving.prototype
     * @desc manifest the floater animation
     * @param {Hypergrid} grid
     */
    doFloaterAnimation: function(grid) {
        if (this.floaterAnimationQueue.length === 0) {
            this.floatingNow = false;
            grid.repaint();
            return;
        }
        var animation = this.floaterAnimationQueue.pop();
        animation();
    },

    /**
     * @memberOf CellMoving.prototype
     * @desc create the float column at columnIndex underneath the dragged column
     * @param {Hypergrid} grid
     * @param {number} columnIndex - the index of the column that will be floating
     */
    createFloatColumn: function(grid, columnIndex) {

        var fixedColumnCount = grid.getFixedColumnCount();
        var scrollLeft = grid.getHScrollValue();

        if (columnIndex < fixedColumnCount) {
            scrollLeft = 0;
        }

        var columnWidth = grid.getColumnWidth(columnIndex);
        var colHeight = grid.div.clientHeight;
        var d = floatColumn;
        var style = d.style;
        var location = grid.div.getBoundingClientRect();

        style.top = (location.top - 2) + 'px';
        style.left = location.left + 'px';

        var hdpiRatio = grid.getHiDPI(floatColumnCTX);

        d.setAttribute('width', Math.round(columnWidth * hdpiRatio) + 'px');
        d.setAttribute('height', Math.round(colHeight * hdpiRatio) + 'px');
        style.boxShadow = '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)';
        style.width = columnWidth + 'px'; //Math.round(columnWidth / hdpiRatio) + 'px';
        style.height = colHeight + 'px'; //Math.round(colHeight / hdpiRatio) + 'px';
        style.borderTop = '1px solid ' + grid.properties.lineColor;
        style.backgroundColor = grid.properties.backgroundColor;

        var startX = grid.renderer.visibleColumns[columnIndex - scrollLeft].left * hdpiRatio;

        floatColumnCTX.scale(hdpiRatio, hdpiRatio);

        grid.renderOverridesCache.floater = {
            columnIndex: columnIndex,
            ctx: floatColumnCTX,
            startX: startX,
            width: columnWidth,
            height: colHeight,
            hdpiratio: hdpiRatio
        };

        style.zIndex = '4';
        this.setCrossBrowserProperty(d, 'transform', 'translate(' + startX + 'px, ' + -2 + 'px)');
        GRABBING.forEach(setName, style);
        grid.repaint();
    },

    /**
     * @memberOf CellMoving.prototype
     * @desc utility function for setting cross browser css properties
     * @param {HTMLElement} element - descripton
     * @param {string} property - the property
     * @param {string} value - the value to assign
     */
    setCrossBrowserProperty: function(element, property, value) {
        var uProperty = property[0].toUpperCase() + property.substr(1);
        this.setProp(element, 'webkit' + uProperty, value);
        this.setProp(element, 'Moz' + uProperty, value);
        this.setProp(element, 'ms' + uProperty, value);
        this.setProp(element, 'O' + uProperty, value);
        this.setProp(element, property, value);
    },

    /**
     * @memberOf CellMoving.prototype
     * @desc utility function for setting properties on HTMLElements
     * @param {HTMLElement} element - descripton
     * @param {string} property - the property
     * @param {string} value - the value to assign
     */
    setProp: function(element, property, value) {
        if (property in element.style) {
            element.style[property] = value;
        }
    },

    /**
     * @memberOf CellMoving.prototype
     * @desc create the dragged column at columnIndex above the floated column
     * @param {Hypergrid} grid
     * @param {number} x - the start position
     * @param {number} columnIndex - the index of the column that will be floating
     */
    createDragColumn: function(grid, x, columnIndex) {

        var fixedColumnCount = grid.getFixedColumnCount();
        var scrollLeft = grid.getHScrollValue();

        if (columnIndex < fixedColumnCount) {
            scrollLeft = 0;
        }

        var hdpiRatio = grid.getHiDPI(draggerCTX);
        var columnWidth = grid.getColumnWidth(columnIndex);
        var colHeight = grid.div.clientHeight;
        var d = dragger;
        var location = grid.div.getBoundingClientRect();
        var style = d.style;

        style.top = location.top + 'px';
        style.left = location.left + 'px';
        style.opacity = 0.85;
        style.boxShadow = '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)';
        //style.zIndex = 100;
        style.borderTop = '1px solid ' + grid.properties.lineColor;
        style.backgroundColor = grid.properties.backgroundColor;

        d.setAttribute('width', Math.round(columnWidth * hdpiRatio) + 'px');
        d.setAttribute('height', Math.round(colHeight * hdpiRatio) + 'px');

        style.width = columnWidth + 'px'; //Math.round(columnWidth / hdpiRatio) + 'px';
        style.height = colHeight + 'px'; //Math.round(colHeight / hdpiRatio) + 'px';

        var startX = grid.renderer.visibleColumns[columnIndex - scrollLeft].left * hdpiRatio;

        draggerCTX.scale(hdpiRatio, hdpiRatio);

        grid.renderOverridesCache.dragger = {
            columnIndex: columnIndex,
            startIndex: columnIndex,
            ctx: draggerCTX,
            startX: startX,
            width: columnWidth,
            height: colHeight,
            hdpiratio: hdpiRatio
        };

        this.setCrossBrowserProperty(d, 'transform', 'translate(' + x + 'px, -5px)');
        style.zIndex = '5';
        GRABBING.forEach(setName, style);
        grid.repaint();
    },

    /**
     * @memberOf CellMoving.prototype
     * @desc this function is the main dragging logic
     * @param {Hypergrid} grid
     * @param {number} x - the start position
     */
    dragColumn: function(grid, x) {

        //TODO: this function is overly complex, refactor this in to something more reasonable
        var self = this;

        var autoScrollingNow = this.columnDragAutoScrollingRight || this.columnDragAutoScrollingLeft;

        var hdpiRatio = grid.getHiDPI(draggerCTX);

        var dragColumnIndex = grid.renderOverridesCache.dragger.columnIndex;

        var minX = 0;
        var maxX = grid.renderer.getFinalVisibleColumnBoundary();
        x = Math.min(x, maxX + 15);
        x = Math.max(minX - 15, x);

        //am I at my lower bound
        var atMin = x < minX && dragColumnIndex !== 0;

        //am I at my upper bound
        var atMax = x > maxX;

        var d = dragger;

        this.setCrossBrowserProperty(d, 'transition', (self.isWebkit ? '-webkit-' : '') + 'transform ' + 0 + 'ms ease, box-shadow ' + columnAnimationTime + 'ms ease');

        this.setCrossBrowserProperty(d, 'transform', 'translate(' + x + 'px, ' + -10 + 'px)');
        requestAnimationFrame(function() {
            d.style.display = 'inline';
        });

        var overCol = grid.renderer.getColumnFromPixelX(x + (d.width / 2 / hdpiRatio));

        if (atMin) {
            overCol = 0;
        }

        if (atMax) {
            overCol = grid.getColumnCount() - 1;
        }

        var doAFloat = dragColumnIndex > overCol;
        doAFloat = doAFloat || (overCol - dragColumnIndex >= 1);

        if (doAFloat && !autoScrollingNow) {
            var draggedToTheRight = dragColumnIndex < overCol;
            // if (draggedToTheRight) {
            //     overCol -= 1;
            // }
            if (this.isFloatingNow) {
                return;
            }

            this.isFloatingNow = true;
            this.createFloatColumn(grid, overCol);
            this.floatColumnTo(grid, draggedToTheRight);
        } else {

            if (x < minX - 10) {
                this.checkAutoScrollToLeft(grid, x);
            }
            if (x > minX - 10) {
                this.columnDragAutoScrollingLeft = false;
            }
            //lets check for autoscroll to right if were up against it
            if (atMax || x > maxX + 10) {
                this.checkAutoScrollToRight(grid, x);
                return;
            }
            if (x < maxX + 10) {
                this.columnDragAutoScrollingRight = false;
            }
        }
    },

    /**
     * @memberOf CellMoving.prototype
     * @desc autoscroll to the right if necessary
     * @param {Hypergrid} grid
     * @param {number} x - the start position
     */
    checkAutoScrollToRight: function(grid, x) {
        if (this.columnDragAutoScrollingRight) {
            return;
        }
        this.columnDragAutoScrollingRight = true;
        this._checkAutoScrollToRight(grid, x);
    },

    _checkAutoScrollToRight: function(grid, x) {
        if (!this.columnDragAutoScrollingRight) {
            return;
        }
        var scrollLeft = grid.getHScrollValue();
        if (!grid.dragging || scrollLeft > (grid.sbHScroller.range.max - 2)) {
            return;
        }
        var draggedIndex = grid.renderOverridesCache.dragger.columnIndex;
        grid.scrollBy(1, 0);
        var newIndex = draggedIndex + 1;

        grid.swapColumns(newIndex, draggedIndex);
        grid.renderOverridesCache.dragger.columnIndex = newIndex;

        setTimeout(this._checkAutoScrollToRight.bind(this, grid, x), 250);
    },

    /**
     * @memberOf CellMoving.prototype
     * @desc autoscroll to the left if necessary
     * @param {Hypergrid} grid
     * @param {number} x - the start position
     */
    checkAutoScrollToLeft: function(grid, x) {
        if (this.columnDragAutoScrollingLeft) {
            return;
        }
        this.columnDragAutoScrollingLeft = true;
        this._checkAutoScrollToLeft(grid, x);
    },

    _checkAutoScrollToLeft: function(grid, x) {
        if (!this.columnDragAutoScrollingLeft) {
            return;
        }

        var scrollLeft = grid.getHScrollValue();
        if (!grid.dragging || scrollLeft < 1) {
            return;
        }
        var draggedIndex = grid.renderOverridesCache.dragger.columnIndex;
        grid.swapColumns(draggedIndex + scrollLeft, draggedIndex + scrollLeft - 1);
        grid.scrollBy(-1, 0);
        setTimeout(this._checkAutoScrollToLeft.bind(this, grid, x), 250);
    },

    /**
     * @memberOf CellMoving.prototype
     * @desc a column drag has completed, update data and cleanup
     * @param {Hypergrid} grid
     */
    endDragColumn: function(grid) {

        var fixedColumnCount = grid.getFixedColumnCount();
        var scrollLeft = grid.getHScrollValue();

        var columnIndex = grid.renderOverridesCache.dragger.columnIndex;

        if (columnIndex < fixedColumnCount) {
            scrollLeft = 0;
        }

        var self = this;
        var startX = grid.renderer.visibleColumns[columnIndex - scrollLeft].left;
        var d = dragger;
        var changed = grid.renderOverridesCache.dragger.startIndex !== grid.renderOverridesCache.dragger.columnIndex;
        self.setCrossBrowserProperty(d, 'transition', (self.isWebkit ? '-webkit-' : '') + 'transform ' + columnAnimationTime + 'ms ease, box-shadow ' + columnAnimationTime + 'ms ease');
        self.setCrossBrowserProperty(d, 'transform', 'translate(' + startX + 'px, ' + -1 + 'px)');
        d.style.boxShadow = '0px 0px 0px #888888';

        setTimeout(function() {
            grid.renderOverridesCache.dragger = null;
            grid.repaint();
            requestAnimationFrame(function() {
                d.style.display = 'none';
                grid.endDragColumnNotification(); //internal notification
                if (changed){
                    grid.fireSyntheticOnColumnsChangedEvent(); //public notification
                }
            });
        }, columnAnimationTime + 50);

    }

});

module.exports = ColumnMoving;

},{"./Feature":59}],56:[function(require,module,exports){
'use strict';

var Feature = require('./Feature');

/**
 * @constructor
 * @extends Feature
 */
var ColumnResizing = Feature.extend('ColumnResizing', {

    /**
     * the pixel location of the where the drag was initiated
     * @type {number}
     * @default
     * @memberOf ColumnResizing.prototype
     */
    dragStart: -1,

    /**
     * the starting width/height of the row/column we are dragging
     * @type {number}
     * @default -1
     * @memberOf ColumnResizing.prototype
     */
    dragStartWidth: -1,

    /**
     * @memberOf ColumnResizing.prototype
     * @desc get the mouse x,y coordinate
     * @returns {number}
     * @param {MouseEvent} event - the mouse event to query
     */
    getMouseValue: function(event) {
        return event.primitiveEvent.detail.mouse.x;
    },

    /**
     * @memberOf ColumnResizing.prototype
     * @desc returns the index of which divider I'm over
     * @returns {number}
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    overAreaDivider: function(grid, event) {
        var leftMostColumnIndex = grid.behavior.leftMostColIndex;
        return event.gridCell.x !== leftMostColumnIndex && event.mousePoint.x <= 3 ||
            event.mousePoint.x >= event.bounds.width - 3;
    },

    /**
     * @memberOf ColumnResizing.prototype
     * @desc return the cursor name
     * @returns {string}
     */
    getCursorName: function() {
        return 'col-resize';
    },

    /**
     * @memberOf ColumnResizing.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDrag: function(grid, event) {
        if (this.dragColumn) {
            var delta = this.getMouseValue(event) - this.dragStart;
            grid.behavior.setColumnWidth(this.dragColumn, this.dragStartWidth + delta);
        } else if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
    },

    /**
     * @memberOf ColumnResizing.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDown: function(grid, event) {
        if (event.isHeaderRow && this.overAreaDivider(grid, event)) {
            if (event.mousePoint.x <= 3) {
                var columnIndex = event.gridCell.x - 1;
                this.dragColumn = grid.behavior.getActiveColumn(columnIndex);
                //this.dragStartWidth = grid.renderer.visibleColumns[columnIndex].width;
                var visibleColIndex = grid.behavior.rowColumnIndex;
                var dragColumn = this.dragColumn;
                grid.renderer.visibleColumns.forEachWithNeg(function(vCol, vIndex){
                    var col = vCol.column;
                    if (col.index === dragColumn.index){
                        visibleColIndex = vIndex;
                    }
                });
                this.dragStartWidth = grid.renderer.visibleColumns[visibleColIndex].width;
            } else {
                this.dragColumn = event.column;
                this.dragStartWidth = event.bounds.width;
            }

            this.dragStart = this.getMouseValue(event);
            //this.detachChain();
        } else if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    },

    /**
     * @memberOf ColumnResizing.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseUp: function(grid, event) {
        if (this.dragColumn) {
            this.cursor = null;
            this.dragColumn = false;

            event.primitiveEvent.stopPropagation();
            //delay here to give other events a chance to be dropped
            grid.behaviorShapeChanged();
        } else if (this.next) {
            this.next.handleMouseUp(grid, event);
        }
    },

    /**
     * @memberOf ColumnResizing.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseMove: function(grid, event) {
        if (!this.dragColumn) {
            this.cursor = null;

            if (this.next) {
                this.next.handleMouseMove(grid, event);
            }

            this.cursor = event.isHeaderRow && this.overAreaDivider(grid, event) ? this.getCursorName() : null;
        }
    },

    /**
     * @param {Hypergrid} grid
     * @param {CellEvent} cellEvent
     * @memberOf ColumnResizing.prototype
     */
    handleDoubleClick: function(grid, event) {
        if (event.isHeaderRow && this.overAreaDivider(grid, event)) {
            var column = event.mousePoint.x <= 3
                ? grid.behavior.getActiveColumn(event.gridCell.x - 1)
                : event.column;
            column.addProperties({
                columnAutosizing: true,
                columnAutosized: false // todo: columnAutosizing should be a setter that automatically resets columnAutosized on state change to true
            });
            setTimeout(function() { // do after next render, which measures text now that auto-sizing is on
                grid.autosizeColumn(column);
            });
        } else if (this.next) {
            this.next.handleDoubleClick(grid, event);
        }
    }

});

module.exports = ColumnResizing;

},{"./Feature":59}],57:[function(require,module,exports){
'use strict';

var Feature = require('./Feature');

/**
 * @constructor
 * @extends Feature
 */
var ColumnSelection = Feature.extend('ColumnSelection', {

    /**
     * The pixel location of the mouse pointer during a drag operation.
     * @type {Point}
     * @default null
     * @memberOf ColumnSelection.prototype
     */
    currentDrag: null,

    /**
     * The horizontal cell coordinate of the where the mouse pointer is during a drag operation.
     * @type {Object}
     * @default null
     * @memberOf ColumnSelection.prototype
     */
    lastDragColumn: null,

    /**
     * a millisecond value representing the previous time an autoscroll started
     * @type {number}
     * @default 0
     * @memberOf ColumnSelection.prototype
     */
    sbLastAuto: 0,

    /**
     * a millisecond value representing the time the current autoscroll started
     * @type {number}
     * @default 0
     * @memberOf ColumnSelection.prototype
     */
    sbAutoStart: 0,


    /**
     * @memberOf ColumnSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseUp: function(grid, event) {
        if (this.dragging) {
            this.dragging = false;
        }
        if (this.next) {
            this.next.handleMouseUp(grid, event);
        }
    },

    handleDoubleClick: function(grid, event) {
        if (this.doubleClickTimer) {
            clearTimeout(this.doubleClickTimer); // prevent mouseDown from continuing
            this.doubleClickTimer = undefined;
        }
        if (this.next) {
            this.next.handleDoubleClick(grid, event);
        }
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDown: function(grid, event) {
        if (this.doubleClickTimer) {
            return;
        }

        // todo: >= 5 depends on header being top-most row which is currently always true but we may allow header "section" to be arbitrary position within quadrant (see also handleMouseDown in ColumnMoving.js)
        if (
            grid.properties.columnSelection &&
            event.mousePoint.y >= 5 &&
            !event.primitiveEvent.detail.isRightClick &&
            event.isHeaderCell
        ) {
            // HOLD OFF WHILE WAITING FOR DOUBLE-CLICK
            this.doubleClickTimer = setTimeout(
                doubleClickTimerCallback.bind(this, grid, event),
                doubleClickDelay.call(this, grid, event)
            );
        } else if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDrag: function(grid, event) {
        if (
            grid.properties.columnSelection &&
            !this.isColumnDragging(grid) &&
            !event.primitiveEvent.detail.isRightClick &&
            this.dragging
        ) {
            //if we are in the fixed area do not apply the scroll values
            this.lastDragColumn = event.gridCell.x;
            this.currentDrag = event.primitiveEvent.detail.mouse;
            this.checkDragScroll(grid, this.currentDrag);
            this.handleMouseDragCellSelection(grid, this.lastDragColumn, event.primitiveEvent.detail.keys);
        } else if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleKeyDown: function(grid, event) {
        var detail = event.detail,
            handler = grid.getLastSelectionType() === 'column' &&
                this['handle' + detail.char];

        if (handler) {
            handler.call(this, grid, detail);
        } else if (this.next) {
            this.next.handleKeyDown(grid, event);
        }
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc Handle a mousedrag selection
     * @param {Hypergrid} grid
     * @param {Object} mouse - the event details
     * @param {Array} keys - array of the keys that are currently pressed down
     */
    handleMouseDragCellSelection: function(grid, x, keys) {
        var mouseX = grid.getMouseDown().x;

        grid.clearMostRecentColumnSelection();

        grid.selectColumn(mouseX, x);
        grid.setDragExtent(grid.newPoint(x - mouseX, 0));

        grid.repaint();
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc this checks while were dragging if we go outside the visible bounds, if so, kick off the external autoscroll check function (above)
     * @param {Hypergrid} grid
     * @param {Object} mouse - the event details
     */
    checkDragScroll: function(grid, mouse) {
        if (
            grid.properties.scrollingEnabled &&
            grid.getDataBounds().contains(mouse)
        ) {
            if (grid.isScrollingNow()) {
                grid.setScrollingNow(false);
            }
        } else {
            if (!grid.isScrollingNow()) {
                grid.setScrollingNow(true);
                this.scrollDrag(grid);
            }
        }
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc this function makes sure that while we are dragging outside of the grid visible bounds, we srcroll accordingly
     * @param {Hypergrid} grid
     */
    scrollDrag: function(grid) {
        if (!grid.isScrollingNow()) {
            return;
        }

        var b = grid.getDataBounds(),
            xOffset;

        if (this.currentDrag.x < b.origin.x) {
            xOffset = -1;
        } else if (this.currentDrag.x > b.origin.x + b.extent.x) {
            xOffset = 1;
        }

        if (xOffset) {
            if (this.lastDragColumn >= grid.getFixedColumnCount()) {
                this.lastDragColumn += xOffset;
            }
            grid.scrollBy(xOffset, 0);
        }

        this.handleMouseDragCellSelection(grid, this.lastDragColumn, []); // update the selection
        grid.repaint();
        setTimeout(this.scrollDrag.bind(this, grid), 25);
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc extend a selection or create one if there isnt yet
     * @param {Hypergrid} grid
     * @param {Object} gridCell - the event details
     * @param {Array} keys - array of the keys that are currently pressed down
     */
    extendSelection: function(grid, x, keys) {
        if (!grid.abortEditing()) { return; }

        var mouseX = grid.getMouseDown().x,
            hasSHIFT = keys.indexOf('SHIFT') > 0;

        if (x < 0) { // outside of the grid?
            return; // do nothing
        }

        if (hasSHIFT) {
            grid.clearMostRecentColumnSelection();
            grid.selectColumn(x, mouseX);
            grid.setDragExtent(grid.newPoint(x - mouseX, 0));
        } else {
            grid.toggleSelectColumn(x, keys);
            grid.setMouseDown(grid.newPoint(x, 0));
            grid.setDragExtent(grid.newPoint(0, 0));
        }

        grid.repaint();
    },


    /**
     * @memberOf ColumnSelection.prototype
     * @param {Hypergrid} grid
     */
    handleDOWNSHIFT: function(grid) {},

    /**
     * @memberOf ColumnSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleUPSHIFT: function(grid) {},

    /**
     * @memberOf ColumnSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleLEFTSHIFT: function(grid) {
        this.moveShiftSelect(grid, -1);
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleRIGHTSHIFT: function(grid) {
        this.moveShiftSelect(grid, 1);
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleDOWN: function(grid) {

        // var mouseCorner = grid.getMouseDown().plus(grid.getDragExtent());
        // var maxRows = grid.getRowCount() - 1;

        // var newX = mouseCorner.x;
        // var newY = grid.getHeaderRowCount() + grid.getVScrollValue();

        // newY = Math.min(maxRows, newY);

        // grid.clearSelections();
        // grid.select(newX, newY, 0, 0);
        // grid.setMouseDown(new grid.rectangular.Point(newX, newY));
        // grid.setDragExtent(new grid.rectangular.Point(0, 0));

        // grid.repaint();
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleUP: function(grid) {},

    /**
     * @memberOf ColumnSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleLEFT: function(grid) {
        this.moveSingleSelect(grid, -1);
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleRIGHT: function(grid) {
        this.moveSingleSelect(grid, 1);
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc If we are holding down the same navigation key, accelerate the increment we scroll
     * #### returns: integer
     */
    getAutoScrollAcceleration: function() {
        var elapsed = this.getAutoScrollDuration() / 2000;
        return Math.max(1, Math.floor(elapsed * elapsed * elapsed * elapsed));
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc set the start time to right now when we initiate an auto scroll
     */
    setAutoScrollStartTime: function() {
        this.sbAutoStart = Date.now();
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc update the autoscroll start time if we haven't autoscrolled within the last 500ms otherwise update the current autoscroll time
     */
    pingAutoScroll: function() {
        var now = Date.now();
        if (now - this.sbLastAuto > 500) {
            this.setAutoScrollStartTime();
        }
        this.sbLastAuto = Date.now();
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc answer how long we have been auto scrolling
     * #### returns: integer
     */
    getAutoScrollDuration: function() {
        if (Date.now() - this.sbLastAuto > 500) {
            return 0;
        }
        return Date.now() - this.sbAutoStart;
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc Augment the most recent selection extent by (offsetX,offsetY) and scroll if necessary.
     * @param {Hypergrid} grid
     * @param {number} offsetX - x coordinate to start at
     * @param {number} offsetY - y coordinate to start at
     */
    moveShiftSelect: function(grid, offsetX) {
        var origin = grid.getMouseDown(),
            extent = grid.getDragExtent(),
            newX = extent.x + offsetX,
            maxViewableColumns = grid.renderer.visibleColumns.length - 1,
            maxColumns = grid.getColumnCount() - 1;

        if (!grid.properties.scrollingEnabled) {
            maxColumns = Math.min(maxColumns, maxViewableColumns);
        }

        newX = Math.min(maxColumns - origin.x, Math.max(-origin.x, newX));

        grid.clearMostRecentColumnSelection();
        grid.selectColumn(origin.x, origin.x + newX);
        grid.setDragExtent(grid.newPoint(newX, 0));

        if (grid.insureModelColIsVisible(newX + origin.x, offsetX)) {
            this.pingAutoScroll();
        }

        grid.repaint();
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc Replace the most recent selection with a single cell selection that is moved (offsetX,offsetY) from the previous selection extent.
     * @param {Hypergrid} grid
     * @param {number} offsetX - x coordinate to start at
     * @param {number} offsetY - y coordinate to start at
     */
    moveSingleSelect: function(grid, offsetX) {
        var extent = grid.getDragExtent(),
            mouseCorner = grid.getMouseDown().plus(extent),
            newX = mouseCorner.x + offsetX,
            maxColumns = grid.getColumnCount() - 1,
            maxViewableColumns = grid.getVisibleColumnsCount() - 1;

        if (!grid.properties.scrollingEnabled) {
            maxColumns = Math.min(maxColumns, maxViewableColumns);
        }

        newX = Math.min(maxColumns, Math.max(0, newX));

        grid.clearSelections();
        grid.selectColumn(newX);
        grid.setMouseDown(grid.newPoint(newX, 0));
        grid.setDragExtent(grid.newPoint(0, 0));

        if (grid.insureModelColIsVisible(newX, offsetX)) {
            this.pingAutoScroll();
        }

        grid.repaint();
    },

    isColumnDragging: function(grid) {
        var dragger = grid.lookupFeature('ColumnMoving');
        return dragger && dragger.dragging && !this.dragging;
    }

});

function doubleClickDelay(grid, event) {
    var columnProperties;

    return (
        event.isHeaderCell &&
        !(columnProperties = event.columnProperties).unsortable &&
        columnProperties.sortOnDoubleClick &&
        300
    );
}

function doubleClickTimerCallback(grid, event) {
    this.doubleClickTimer = undefined;
    this.dragging = true;
    this.extendSelection(grid, event.gridCell.x, event.primitiveEvent.detail.keys);
}

module.exports = ColumnSelection;

},{"./Feature":59}],58:[function(require,module,exports){
'use strict';

var Feature = require('./Feature');

/**
 * @constructor
 * @extends Feature
 */
var ColumnSorting = Feature.extend('ColumnSorting', {

    /**
     * @memberOf ColumnSorting.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleClick: function(grid, event) {
        sort.call(this, grid, event);
    },

    /**
     * @memberOf ColumnSorting.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleDoubleClick: function(grid, event) {
        sort.call(this, grid, event, true);
    },

    /**
     * @memberOf ColumnSorting.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseMove: function(grid, event) {
        var columnProperties;
        if (
            event.isRowFixed &&
            event.isHeaderCell &&
            (columnProperties = grid.behavior.getColumnProperties(event.gridCell.x)) &&
            !columnProperties.unsortable
        ) {
            this.cursor = 'pointer';
        } else {
            this.cursor = null;
        }
        if (this.next) {
            this.next.handleMouseMove(grid, event);
        }
    }

});

function sort(grid, event, onDoubleClick) {
    var columnProperties;
    if (
        event.isHeaderCell &&
        !(columnProperties = event.columnProperties).unsortable &&
        !(columnProperties.sortOnDoubleClick ^ onDoubleClick) // both same (true or falsy)?
    ) {
        grid.fireSyntheticColumnSortEvent(event.gridCell.x, event.primitiveEvent.detail.keys);
    }

    if (this.next) {
        this.next[onDoubleClick ? 'handleDoubleClick' : 'handleClick'](grid, event);
    }
}

module.exports = ColumnSorting;

},{"./Feature":59}],59:[function(require,module,exports){
'use strict';

var Base = require('../Base');

/**
 * Instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 * @constructor
 */
var Feature = Base.extend('Feature', {

    /**
     * the next feature to be given a chance to handle incoming events
     * @type {Feature}
     * @default null
     * @memberOf Feature.prototype
     */
    next: null,

    /**
     * a temporary holding field for my next feature when I'm in a disconnected state
     * @type {Feature}
     * @default null
     * @memberOf Feature.prototype
     */
    detached: null,

    /**
     * the cursor I want to be displayed
     * @type {string}
     * @default null
     * @memberOf Feature.prototype
     */
    cursor: null,

    /**
     * the cell location where the cursor is currently
     * @type {Point}
     * @default null
     * @memberOf Feature.prototype
     */
    currentHoverCell: null,

    /**
     * @memberOf Feature.prototype
     * @desc set my next field, or if it's populated delegate to the feature in my next field
     * @param {Feature} nextFeature - this is how we build the chain of responsibility
     * @private
     * @comment Not really private but was cluttering up all the feature doc pages.
     */
    setNext: function(nextFeature) {
        if (this.next) {
            this.next.setNext(nextFeature);
        } else {
            this.next = nextFeature;
            this.detached = nextFeature;
        }
    },

    /**
     * @memberOf Feature.prototype
     * @desc disconnect my child
     */
    detachChain: function() {
        this.next = null;
    },

    /**
     * @memberOf Feature.prototype
     * @desc reattach my child from the detached reference
     */
    attachChain: function() {
        this.next = this.detached;
    },

    /**
     * @memberOf Feature.prototype
     * @desc handle mouse move down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private
     * @comment Not really private but was cluttering up all the feature doc pages.
     */
    handleMouseMove: function(grid, event) {
        if (this.next) {
            this.next.handleMouseMove(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private
     * @comment Not really private but was cluttering up all the feature doc pages.
     */
    handleMouseExit: function(grid, event) {
        if (this.next) {
            this.next.handleMouseExit(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private
     * @comment Not really private but was cluttering up all the feature doc pages.
     */
    handleMouseEnter: function(grid, event) {
        if (this.next) {
            this.next.handleMouseEnter(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private
     * @comment Not really private but was cluttering up all the feature doc pages.
     */
    handleMouseDown: function(grid, event) {
        if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private
     * @comment Not really private but was cluttering up all the feature doc pages.
     */
    handleMouseUp: function(grid, event) {
        if (this.next) {
            this.next.handleMouseUp(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private
     * @comment Not really private but was cluttering up all the feature doc pages.
     */
    handleKeyDown: function(grid, event) {
        if (this.next) {
            this.next.handleKeyDown(grid, event);
        } else {
            return true;
        }
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private
     * @comment Not really private but was cluttering up all the feature doc pages.
     */
    handleKeyUp: function(grid, event) {
        if (this.next) {
            this.next.handleKeyUp(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private
     * @comment Not really private but was cluttering up all the feature doc pages.
     */
    handleWheelMoved: function(grid, event) {
        if (this.next) {
            this.next.handleWheelMoved(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private
     * @comment Not really private but was cluttering up all the feature doc pages.
     */
    handleDoubleClick: function(grid, event) {
        if (this.next) {
            this.next.handleDoubleClick(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private
     * @comment Not really private but was cluttering up all the feature doc pages.
     */
    handleClick: function(grid, event) {
        if (this.next) {
            this.next.handleClick(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private
     * @comment Not really private but was cluttering up all the feature doc pages.
     */
    handleMouseDrag: function(grid, event) {
        if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private
     * @comment Not really private but was cluttering up all the feature doc pages.
     */
    handleContextMenu: function(grid, event) {
        if (this.next) {
            this.next.handleContextMenu(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @desc toggle the column picker
     * @private
     * @comment Not really private but was cluttering up all the feature doc pages.
     */
    moveSingleSelect: function(grid, x, y) {
        if (this.next) {
            this.next.moveSingleSelect(grid, x, y);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    isFirstFixedRow: function(grid, event) {
        return event.gridCell.y < 1;
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    isFirstFixedColumn: function(grid, event) {
        return event.gridCell.x === 0;
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private
     * @comment Not really private but was cluttering up all the feature doc pages.
     */
    setCursor: function(grid) {
        if (this.next) {
            this.next.setCursor(grid);
        }
        if (this.cursor) {
            grid.beCursor(this.cursor);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private
     * @comment Not really private but was cluttering up all the feature doc pages.
     */
    initializeOn: function(grid) {
        if (this.next) {
            this.next.initializeOn(grid);
        }
    }

});


module.exports = Feature;

},{"../Base":12}],60:[function(require,module,exports){
'use strict';

var Feature = require('./Feature');

/**
 * @constructor
 */
var Filters = Feature.extend('Filters', {

    /**
     * Navigate away from the filter cell when:
     * 1. Coming from a cell editor (`event.detail.editor` defined).
     * 2. The cell editor was for a filter cell.
     * 3. The key (`event.detail.char) maps (through {@link module:defaults.navKeyMap|navKeyMap}) to one of:
     *    * `'UP'` or `'DOWN'` - Selects first visible data cell under filter cell.
     *    * `'LEFT'` - Opens filter cell editor in previous filterable column; if nonesuch, selects first visible data cell under filter cell.
     *    * `'RIGHT'` - Opens filter cell editor in next filterable column; if nonesuch, selects first visible data cell under filter cell.
     */
    handleKeyDown: function(grid, event) {
        var cellEvent, mappedNavKey, handler,
            detail = event.detail;

        if (detail.editor) {
            cellEvent = detail.editor.event;
            if (cellEvent.isFilterCell) {
                mappedNavKey = cellEvent.properties.mappedNavKey(detail.char);
                handler = this['handle' + mappedNavKey];
            }
        }

        if (handler) {
            handler.call(this, grid, detail);
        } else if (this.next) {
            this.next.handleKeyDown(grid, event);
        }
    },

    handleLEFT: function(grid, detail) { moveLaterally(grid, detail, -1); },
    handleRIGHT: function(grid, detail) { moveLaterally(grid, detail, +1); },
    handleUP: moveDown,
    handleDOWN: moveDown,

    handleDoubleClick: function(grid, event) {
        if (event.isFilterCell) {
            grid.onEditorActivate(event);
        } else if (this.next) {
            this.next.handleDoubleClick(grid, event);
        }
    },

    handleClick: function(grid, event) {
        if (event.isFilterCell) {
            grid.onEditorActivate(event);
        } else if (this.next) {
            this.next.handleClick(grid, event);
        }
    }

});

function moveLaterally(grid, detail, deltaX) {
    var cellEvent = detail.editor.event,
        gridX = cellEvent.visibleColumn.index,
        gridY = cellEvent.visibleRow.index,
        originX = gridX,
        C = grid.renderer.visibleColumns.length;

    cellEvent = new grid.behavior.CellEvent; // redefine so we don't reset the original below

    while (
        (gridX = (gridX + deltaX + C) % C) !== originX &&
        cellEvent.resetGridXY(gridX, gridY)
    ) {
        if (cellEvent.properties.filterable) {
            // Select previous or next filterable column's filter cell
            grid.editAt(cellEvent);
            return;
        }
    }

    moveDown(grid, cellEvent);
}

function moveDown(grid, detail) {
    var cellEvent = detail.editor.event,
        gridX = cellEvent.visibleColumn.index;

    // Select first visible grid cell of this column
    grid.selectViewportCell(gridX, 0);
    grid.takeFocus();
}

module.exports = Filters;

},{"./Feature":59}],61:[function(require,module,exports){
'use strict';

var Feature = require('./Feature');

var commands = {
    PAGEDOWN: function(grid) { grid.pageDown(); },
    PAGEUP: function(grid) { grid.pageUp(); },
    PAGELEFT: function(grid) { grid.pageLeft(); },
    PAGERIGHT: function(grid) { grid.pageRight(); }
};

/**
 * @constructor
 */
var KeyPaging = Feature.extend('KeyPaging', {

    /**
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @memberOf KeyPaging.prototype
     */
    handleKeyDown: function(grid, event) {
        var func = commands[event.detail.char];
        if (func) {
            func(grid);
        } else if (this.next) {
            this.next.handleKeyDown(grid, event);
        }
    }

});

module.exports = KeyPaging;

},{"./Feature":59}],62:[function(require,module,exports){
'use strict';

var Feature = require('./Feature');

/**
 * @constructor
 */
var OnHover = Feature.extend('OnHover', {

    /**
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @memberOf OnHover.prototype
     */
    handleMouseMove: function(grid, event) {
        var hoverCell = grid.hoverCell;
        if (!event.gridCell.equals(hoverCell)) {
            if (hoverCell) {
                this.handleMouseExit(grid, hoverCell);
            }
            this.handleMouseEnter(grid, event);
            grid.setHoverCell(event);
        } else if (this.next) {
            this.next.handleMouseMove(grid, event);
        }
    }

});

module.exports = OnHover;

},{"./Feature":59}],63:[function(require,module,exports){
'use strict';

var Feature = require('./Feature');

/**
 * @constructor
 */
var RowSelection = Feature.extend('RowSelection', {

    /**
     * The pixel location of the mouse pointer during a drag operation.
     * @type {Point}
     * @default null
     * @memberOf RowSelection.prototype
     */
    currentDrag: null,

    /**
     * The cell coordinates of the where the mouse pointer is during a drag operation.
     * @type {Object}
     * @default null
     * @memberOf RowSelection.prototype
     */
    lastDragCell: null,

    /**
     * a millisecond value representing the previous time an autoscroll started
     * @type {number}
     * @default 0
     * @memberOf RowSelection.prototype
     */
    sbLastAuto: 0,

    /**
     * a millisecond value representing the time the current autoscroll started
     * @type {number}
     * @default 0
     * @memberOf RowSelection.prototype
     */
    sbAutoStart: 0,

    dragArmed: false,

    /**
     * @memberOf RowSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseUp: function(grid, event) {
        if (this.dragArmed) {
            this.dragArmed = false;
            grid.fireSyntheticRowSelectionChangedEvent();
        } else if (this.dragging) {
            this.dragging = false;
            grid.fireSyntheticRowSelectionChangedEvent();
        } else if (this.next) {
            this.next.handleMouseUp(grid, event);
        }
    },

    /**
     * @memberOf RowSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDown: function(grid, event) {
        var rowSelectable = grid.properties.rowSelection &&
            !event.primitiveEvent.detail.isRightClick &&
            grid.properties.showRowNumbers &&
            event.isHandleColumn;

        if (rowSelectable && event.isHeaderHandle) {
            //global row selection
            grid.toggleSelectAllRows();
        } else if (rowSelectable && event.isDataRow)  {
            // if we are in the fixed area, do not apply the scroll values
            this.dragArmed = true;
            this.extendSelection(grid, event.dataCell.y, event.primitiveEvent.detail.keys);
        } else if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    },

    /**
     * @memberOf RowSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDrag: function(grid, event) {
        if (
            this.dragArmed &&
            grid.properties.rowSelection &&
            !event.primitiveEvent.detail.isRightClick
        ) {
            //if we are in the fixed area do not apply the scroll values
            this.lastDragRow = event.dataCell.y;
            this.dragging = true;
            this.currentDrag = event.primitiveEvent.detail.mouse;
            this.checkDragScroll(grid, this.currentDrag);
            this.handleMouseDragCellSelection(grid, this.lastDragRow, event.primitiveEvent.detail.keys);
        } else if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
    },

    /**
     * @memberOf RowSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleKeyDown: function(grid, event) {
        var handler;
        if (
            grid.getLastSelectionType() === 'row' &&
            (handler = this['handle' + event.detail.char])
        ) {
            handler.call(this, grid, event.detail);
        } else if (this.next) {
            this.next.handleKeyDown(grid, event);
        }
    },

    /**
     * @memberOf RowSelection.prototype
     * @desc Handle a mousedrag selection
     * @param {Hypergrid} grid
     * @param {Object} mouse - the event details
     * @param {Array} keys - array of the keys that are currently pressed down
     */
    handleMouseDragCellSelection: function(grid, y, keys) {
        var mouseY = grid.getMouseDown().y;

        grid.clearMostRecentRowSelection();

        grid.selectRow(mouseY, y);
        grid.setDragExtent(grid.newPoint(0, y - mouseY));

        grid.repaint();
    },

    /**
     * @memberOf RowSelection.prototype
     * @desc this checks while were dragging if we go outside the visible bounds, if so, kick off the external autoscroll check function (above)
     * @param {Hypergrid} grid
     * @param {Object} mouse - the event details
     */
    checkDragScroll: function(grid, mouse) {
        if (
            grid.properties.scrollingEnabled &&
            grid.getDataBounds().contains(mouse)
        ) {
            if (grid.isScrollingNow()) {
                grid.setScrollingNow(false);
            }
        } else {
            if (!grid.isScrollingNow()) {
                grid.setScrollingNow(true);
                this.scrollDrag(grid);
            }
        }
    },

    /**
     * @memberOf RowSelection.prototype
     * @desc this function makes sure that while we are dragging outside of the grid visible bounds, we srcroll accordingly
     * @param {Hypergrid} grid
     */
    scrollDrag: function(grid) {
        if (!grid.isScrollingNow()) {
            return;
        }

        var b = grid.getDataBounds(),
            yOffset;

        if (this.currentDrag.y < b.origin.y) {
            yOffset = -1;
        } else if (this.currentDrag.y > b.origin.y + b.extent.y) {
            yOffset = 1;
        }

        if (yOffset) {
            if (this.lastDragRow >= grid.getFixedRowCount()) {
                this.lastDragRow += yOffset;
            }
            grid.scrollBy(0, yOffset);
        }

        this.handleMouseDragCellSelection(grid, this.lastDragRow, []); // update the selection
        grid.repaint();
        setTimeout(this.scrollDrag.bind(this, grid), 25);
    },

    /**
     * @memberOf RowSelection.prototype
     * @desc extend a selection or create one if there isnt yet
     * @param {Hypergrid} grid
     * @param {Object} gridCell - the event details
     * @param {Array} keys - array of the keys that are currently pressed down
     */
    extendSelection: function(grid, y, keys) {
        if (!grid.abortEditing()) { return; }

        var mouseY = grid.getMouseDown().y,
            hasSHIFT = keys.indexOf('SHIFT') !== -1;

        if (y < 0) { // outside of the grid?
            return; // do nothing
        }

        if (hasSHIFT) {
            grid.clearMostRecentRowSelection();
            grid.selectRow(y, mouseY);
            grid.setDragExtent(grid.newPoint(0, y - mouseY));
        } else {
            grid.toggleSelectRow(y, keys);
            grid.setMouseDown(grid.newPoint(0, y));
            grid.setDragExtent(grid.newPoint(0, 0));
        }

        grid.repaint();
    },


    /**
     * @memberOf RowSelection.prototype
     * @param {Hypergrid} grid
     */
    handleDOWNSHIFT: function(grid) {
        this.moveShiftSelect(grid, 1);
    },

    /**
     * @memberOf RowSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleUPSHIFT: function(grid) {
        this.moveShiftSelect(grid, -1);
    },

    /**
     * @memberOf RowSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleLEFTSHIFT: function(grid) {},

    /**
     * @memberOf RowSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleRIGHTSHIFT: function(grid) {},

    /**
     * @memberOf RowSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleDOWN: function(grid) {
        this.moveSingleSelect(grid, 1);
    },

    /**
     * @memberOf RowSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleUP: function(grid) {
        this.moveSingleSelect(grid, -1);
    },

    /**
     * @memberOf RowSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleLEFT: function(grid) {},

    /**
     * @memberOf RowSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleRIGHT: function(grid) {
        var mouseCorner = grid.getMouseDown().plus(grid.getDragExtent()),
            maxColumns = grid.getColumnCount() - 1,
            newX = grid.getHScrollValue(),
            newY = mouseCorner.y;

        newX = Math.min(maxColumns, newX);

        grid.clearSelections();
        grid.select(newX, newY, 0, 0);
        grid.setMouseDown(grid.newPoint(newX, newY));
        grid.setDragExtent(grid.newPoint(0, 0));

        grid.repaint();
    },

    /**
     * @memberOf RowSelection.prototype
     * @desc If we are holding down the same navigation key, accelerate the increment we scroll
     * #### returns: integer
     */
    getAutoScrollAcceleration: function() {
        var count = 1;
        var elapsed = this.getAutoScrollDuration() / 2000;
        count = Math.max(1, Math.floor(elapsed * elapsed * elapsed * elapsed));
        return count;
    },

    /**
     * @memberOf RowSelection.prototype
     * @desc set the start time to right now when we initiate an auto scroll
     */
    setAutoScrollStartTime: function() {
        this.sbAutoStart = Date.now();
    },

    /**
     * @memberOf RowSelection.prototype
     * @desc update the autoscroll start time if we haven't autoscrolled within the last 500ms otherwise update the current autoscroll time
     */
    pingAutoScroll: function() {
        var now = Date.now();
        if (now - this.sbLastAuto > 500) {
            this.setAutoScrollStartTime();
        }
        this.sbLastAuto = Date.now();
    },

    /**
     * @memberOf RowSelection.prototype
     * @desc answer how long we have been auto scrolling
     * #### returns: integer
     */
    getAutoScrollDuration: function() {
        if (Date.now() - this.sbLastAuto > 500) {
            return 0;
        }
        return Date.now() - this.sbAutoStart;
    },

    /**
     * @memberOf RowSelection.prototype
     * @desc Augment the most recent selection extent by (offsetX,offsetY) and scroll if necessary.
     * @param {Hypergrid} grid
     * @param {number} offsetX - x coordinate to start at
     * @param {number} offsetY - y coordinate to start at
     */
    moveShiftSelect: function(grid, offsetY) {
        var origin = grid.getMouseDown(),
            extent = grid.getDragExtent(),
            maxViewableRows = grid.renderer.visibleRows.length - 1,
            maxRows = grid.getRowCount() - 1;

        if (!grid.properties.scrollingEnabled) {
            maxRows = Math.min(maxRows, maxViewableRows);
        }

        var newY = extent.y + offsetY;

        newY = Math.min(maxRows - origin.y, Math.max(-origin.y, newY));

        grid.clearMostRecentRowSelection();
        grid.selectRow(origin.y, origin.y + newY);
        grid.setDragExtent(grid.newPoint(0, newY));

        if (grid.insureModelRowIsVisible(newY + origin.y, offsetY)) {
            this.pingAutoScroll();
        }

        grid.fireSyntheticRowSelectionChangedEvent();

        grid.repaint();
    },

    /**
     * @memberOf RowSelection.prototype
     * @desc Replace the most recent selection with a single cell selection that is moved (offsetX,offsetY) from the previous selection extent.
     * @param {Hypergrid} grid
     * @param {number} offsetX - x coordinate to start at
     * @param {number} offsetY - y coordinate to start at
     */
    moveSingleSelect: function(grid, offsetY) {
        var maxRows = grid.getRowCount() - 1,
            maxViewableRows = grid.getVisibleRowsCount() - 1,
            mouseCorner = grid.getMouseDown().plus(grid.getDragExtent()),
            newY = mouseCorner.y + offsetY;

        if (!grid.properties.scrollingEnabled) {
            maxRows = Math.min(maxRows, maxViewableRows);
        }

        newY = Math.min(maxRows, Math.max(0, newY));

        grid.clearSelections();
        grid.selectRow(newY);
        grid.setMouseDown(grid.newPoint(0, newY));
        grid.setDragExtent(grid.newPoint(0, 0));

        if (grid.insureModelRowIsVisible(newY, offsetY)) {
            this.pingAutoScroll();
        }

        grid.fireSyntheticRowSelectionChangedEvent();
        grid.repaint();
    },

    isSingleRowSelection: function() {
        return true;
    }

});

module.exports = RowSelection;

},{"./Feature":59}],64:[function(require,module,exports){
'use strict';

var Feature = require('./Feature');

/**
 * @constructor
 */
var ThumbwheelScrolling = Feature.extend('ThumbwheelScrolling', {

    /**
     * @memberOf ThumbwheelScrolling.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleWheelMoved: function(grid, e) {
        if (!grid.properties.scrollingEnabled) {
            return;
        }

        var primEvent = e.primitiveEvent,
            deltaX = Math.sign(primEvent.wheelDeltaX || -primEvent.deltaX),
            deltaY = Math.sign(primEvent.wheelDeltaY || -primEvent.deltaY);

        if (deltaX || deltaY) {
            grid.scrollBy(
                -deltaX || 0, // 0 if NaN
                -deltaY || 0
            );
        }
    }

});


module.exports = ThumbwheelScrolling;

},{"./Feature":59}],65:[function(require,module,exports){
'use strict';

var Registry = require('../lib/Registry');


/**
 * @classdesc Registry of feature constructors.
 * @param {boolean} [privateRegistry=false] - This instance will use a private registry.
 * @constructor
 */
var Features = Registry.extend('Features', {

    BaseClass: require('./Feature'), // abstract base class

    initialize: function() {
        // preregister the standard cell renderers
        this.add(Features.CellClick);
        this.add(Features.CellEditing);
        this.add(Features.CellSelection);
        this.add(Features.ColumnMoving);
        this.add(Features.ColumnResizing);
        this.add(Features.ColumnSelection);
        this.add(Features.ColumnSorting);
        this.add(Features.Filters);
        this.add(Features.KeyPaging);
        this.add(Features.OnHover);
        // this.add(require('./RowResizing'));
        this.add(Features.RowSelection);
        this.add(Features.ThumbwheelScrolling);
    }

});


// Following shared props provided solely in support of build file usage, e.g., `fin.Hypergrid.features.yada`,
// presumably for overriding built-in features, and are not meant to be used elsewhere.

Features.BaseClass = require('./Feature'); // abstract base class
Features.CellClick = require('./CellClick');
Features.CellEditing = require('./CellEditing');
Features.CellSelection = require('./CellSelection');
Features.ColumnMoving = require('./ColumnMoving');
Features.ColumnResizing = require('./ColumnResizing');
Features.ColumnSelection = require('./ColumnSelection');
Features.ColumnSorting = require('./ColumnSorting');
Features.Filters = require('./Filters');
Features.KeyPaging = require('./KeyPaging');
Features.OnHover = require('./OnHover');
// Features.RowResizing = require('./RowResizing');
Features.RowSelection = require('./RowSelection');
Features.ThumbwheelScrolling = require('./ThumbwheelScrolling');


module.exports = new Features;

},{"../lib/Registry":69,"./CellClick":52,"./CellEditing":53,"./CellSelection":54,"./ColumnMoving":55,"./ColumnResizing":56,"./ColumnSelection":57,"./ColumnSorting":58,"./Feature":59,"./Filters":60,"./KeyPaging":61,"./OnHover":62,"./RowSelection":63,"./ThumbwheelScrolling":64}],66:[function(require,module,exports){
/* eslint-env browser */

'use strict';

if (typeof window.CustomEvent !== 'function') {
    window.CustomEvent = function(event, params) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    };

    window.CustomEvent.prototype = window.Event.prototype;
}

var rectangular = require('rectangular');

var RESIZE_POLLING_INTERVAL = 200,
    paintables = [],
    resizables = [],
    paintRequest,
    resizeInterval,
    charMap = makeCharMap();

function Canvas(div, component) {
    var self = this;

    // create the containing <div>...</div>
    this.div = div;
    this.component = component;

    this.dragEndtime = Date.now();

    // create and append the info <div>...</div> (to be displayed when there are no data rows)
    this.infoDiv = document.createElement('div');
    this.infoDiv.className = 'info';
    this.div.appendChild(this.infoDiv);

    // create and append the canvas
    this.gc = getCachedContext(this.canvas = document.createElement('canvas'));
    this.bc = getCachedContext(this.buffer = document.createElement('canvas'));

    this.div.appendChild(this.canvas);

    this.canvas.style.outline = 'none';

    this.mouseLocation = new rectangular.Point(-1, -1);
    this.dragstart = new rectangular.Point(-1, -1);
    //this.origin = new rectangular.Point(0, 0);
    this.bounds = new rectangular.Rectangle(0, 0, 0, 0);
    this.hasMouse = false;

    document.addEventListener('mousemove', function(e) {
        if (self.hasMouse || self.isDragging()) {
            self.finmousemove(e);
        }
    });
    document.addEventListener('mouseup', function(e) {
        self.finmouseup(e);
    });
    document.addEventListener('wheel', function(e) {
        self.finwheelmoved(e);
    });
    document.addEventListener('keydown', function(e) {
        self.finkeydown(e);
    });
    document.addEventListener('keyup', function(e) {
        self.finkeyup(e);
    });

    this.canvas.onmouseover = function() {
        self.hasMouse = true;
    };
    this.addEventListener('focus', function(e) {
        self.finfocusgained(e);
    });
    this.addEventListener('blur', function(e) {
        self.finfocuslost(e);
    });
    this.addEventListener('mousedown', function(e) {
        self.finmousedown(e);
    });
    this.addEventListener('mouseout', function(e) {
        self.hasMouse = false;
        self.finmouseout(e);
    });
    this.addEventListener('click', function(e) {
        self.finclick(e);
    });
    this.addEventListener('dblclick', function(e) {
        self.findblclick(e);
    });
    this.addEventListener('contextmenu', function(e) {
        self.fincontextmenu(e);
        e.preventDefault();
        return false;
    });

    this.canvas.setAttribute('tabindex', 0);

    this.resize();

    this.beginResizing();
    this.beginPainting();
}

Canvas.prototype = {
    constructor: Canvas.prototype.constructor,
    div: null,
    component: null,
    canvas: null,
    focuser: null,
    buffer: null,
    ctx: null,
    mouseLocation: null,
    dragstart: null,
    origin: null,
    bounds: null,
    dirty: false,
    size: null,
    mousedown: false,
    dragging: false,
    repeatKeyCount: 0,
    repeatKey: null,
    repeatKeyStartTime: 0,
    currentKeys: [],
    hasMouse: false,
    dragEndTime: 0,
    lastRepaintTime: 0,
    currentPaintCount: 0,
    currentFPS: 0,
    lastFPSComputeTime: 0,

    addEventListener: function(name, callback) {
        this.canvas.addEventListener(name, callback);
    },

    removeEventListener: function(name, callback) {
        this.canvas.removeEventListener(name, callback);
    },

    stopPaintLoop: stopPaintLoop,
    restartPaintLoop: restartPaintLoop,

    stopResizeLoop: stopResizeLoop,
    restartResizeLoop: restartResizeLoop,

    detached: function() {
        this.stopPainting();
        this.stopResizing();
    },

    getCurrentFPS:function() {
        return this.currentFPS;
    },


    tickPaint: function(now) {
        var isContinuousRepaint = this.component.properties.enableContinuousRepaint,
            fps = this.component.properties.repaintIntervalRate;
        if (fps === 0) {
            return;
        }
        var interval = 1000 / fps;

        var elapsed = now - this.lastRepaintTime;
        if (elapsed > interval && (isContinuousRepaint || this.dirty)) {
            this.paintNow();
            this.lastRepaintTime = now;
            /* - (elapsed % interval);*/
            if (isContinuousRepaint) {
                this.currentPaintCount++;
                if (now - this.lastFPSComputeTime >= 1000) {
                    this.currentFPS = (this.currentPaintCount * 1000) / (now - this.lastFPSComputeTime);
                    this.currentPaintCount = 0;
                    this.lastFPSComputeTime = now;
                }
            }
        }
    },

    beginPainting: function() {
        var self = this;
        this.dirty = true;
        this.tickPainter = function(now) {
            self.tickPaint(now);
        };
        paintables.push(this);
    },

    stopPainting: function() {
        paintables.splice(paintables.indexOf(this), 1);
    },

    beginResizing: function() {
        var self = this;
        this.tickResizer = function() {
            self.checksize();
        };
        resizables.push(this);
    },

    stopResizing: function() {
        resizables.splice(resizables.indexOf(this), 1);
    },

    start: function() {
        this.beginPainting();
        this.beginResizing();
    },

    stop: function() {
        this.stopPainting();
        this.stopResizing();
    },

    getDivBoundingClientRect: function() {
        // Make sure our canvas has integral dimensions
        var rect = this.div.getBoundingClientRect();
        var top = Math.floor(rect.top),
            left = Math.floor(rect.left),
            width = Math.ceil(rect.width),
            height = Math.ceil(rect.height);

        return {
            top: top,
            right: left + width,
            bottom: top + height,
            left: left,
            width: width,
            height: height,
            x: rect.x,
            y: rect.y
        };
    },

    checksize: function() {
        //this is expensive lets do it at some modulo
        var sizeNow = this.getDivBoundingClientRect();
        if (sizeNow.width !== this.size.width || sizeNow.height !== this.size.height) {
            this.resize();
        }
    },

    resize: function() {
        var box = this.size = this.getDivBoundingClientRect();

        this.width = box.width;
        this.height = box.height;

        //fix ala sir spinka, see
        //http://www.html5rocks.com/en/tutorials/canvas/hidpi/
        //just add 'hdpi' as an attribute to the fin-canvas tag
        var ratio = 1;
        var isHIDPI = window.devicePixelRatio && this.component.properties.useHiDPI;
        if (isHIDPI) {
            var devicePixelRatio = window.devicePixelRatio || 1;
            var backingStoreRatio = this.gc.webkitBackingStorePixelRatio ||
                this.gc.mozBackingStorePixelRatio ||
                this.gc.msBackingStorePixelRatio ||
                this.gc.oBackingStorePixelRatio ||
                this.gc.backingStorePixelRatio || 1;

            ratio = devicePixelRatio / backingStoreRatio;
            //this.canvasCTX.scale(ratio, ratio);
        }

        this.buffer.width = this.canvas.width = this.width * ratio;
        this.buffer.height = this.canvas.height = this.height * ratio;

        this.canvas.style.width = this.buffer.style.width = this.width + 'px';
        this.canvas.style.height = this.buffer.style.height = this.height + 'px';

        this.bc.scale(ratio, ratio);
        if (isHIDPI && !this.component.properties.useBitBlit) {
            this.gc.scale(ratio, ratio);
        }

        this.bounds = new rectangular.Rectangle(0, 0, this.width, this.height);
        this.component.setBounds(this.bounds);
        this.resizeNotification();
        this.paintNow();
    },

    resizeNotification: function() {
        this.dispatchNewEvent(undefined, 'fin-canvas-resized', {
            width: this.width,
            height: this.height
        });
    },

    getBounds: function() {
        return this.bounds;
    },

    paintNow: function() {
        var useBitBlit = this.component.properties.useBitBlit,
            gc = useBitBlit ? this.bc : this.gc;

        try {
            gc.cache.save();
            this.component.paint(gc);
            this.dirty = false;
        } catch (e) {
            console.error(e);
        } finally {
            gc.cache.restore();
        }

        if (useBitBlit) {
            this.flushBuffer();
        }
    },

    flushBuffer: function() {
        if (this.buffer.width > 0 && this.buffer.height > 0) {
            this.gc.drawImage(this.buffer, 0, 0);
        }
    },

    newEvent: function(primitiveEvent, name, detail) {
        var event = {
            detail: detail || {}
        };
        if (primitiveEvent) {
            event.detail.primitiveEvent = primitiveEvent;
        }
        return new CustomEvent(name, event);
    },

    dispatchNewEvent: function(primitiveEvent, name, detail) {
        return this.canvas.dispatchEvent(this.newEvent(primitiveEvent, name, detail));
    },

    dispatchNewMouseKeysEvent: function(event, name, detail) {
        detail = detail || {};
        detail.mouse = this.mouseLocation;
        detail.keys = this.currentKeys;
        return this.dispatchNewEvent(event, name, detail);
    },

    finmousemove: function(e) {
        if (!this.isDragging() && this.mousedown) {
            this.beDragging();
            this.dispatchNewMouseKeysEvent(e, 'fin-canvas-dragstart', {
                isRightClick: this.isRightClick(e),
                dragstart: this.dragstart
            });
            this.dragstart = new rectangular.Point(this.mouseLocation.x, this.mouseLocation.y);
        }
        this.mouseLocation = this.getLocal(e);
        //console.log(this.mouseLocation);
        if (this.isDragging()) {
            this.dispatchNewMouseKeysEvent(e, 'fin-canvas-drag', {
                dragstart: this.dragstart,
                isRightClick: this.isRightClick(e)
            });
        }
        if (this.bounds.contains(this.mouseLocation)) {
            this.dispatchNewMouseKeysEvent(e, 'fin-canvas-mousemove');
        }
    },

    finmousedown: function(e) {
        this.mouseLocation = this.mouseDownLocation = this.getLocal(e);
        this.mousedown = true;

        this.dispatchNewMouseKeysEvent(e, 'fin-canvas-mousedown', {
            isRightClick: this.isRightClick(e)
        });
        this.takeFocus();
    },

    finmouseup: function(e) {
        if (!this.mousedown) {
            // ignore document:mouseup unless preceded by a canvas:mousedown
            return;
        }
        if (this.isDragging()) {
            this.dispatchNewMouseKeysEvent(e, 'fin-canvas-dragend', {
                dragstart: this.dragstart,
                isRightClick: this.isRightClick(e)
            });
            this.beNotDragging();
            this.dragEndtime = Date.now();
        }
        this.mousedown = false;
        this.dispatchNewMouseKeysEvent(e, 'fin-canvas-mouseup', {
            dragstart: this.dragstart,
            isRightClick: this.isRightClick(e)
        });
        //this.mouseLocation = new rectangular.Point(-1, -1);
    },

    finmouseout: function(e) {
        if (!this.mousedown) {
            this.mouseLocation = new rectangular.Point(-1, -1);
        }
        this.repaint();
        this.dispatchNewMouseKeysEvent(e, 'fin-canvas-mouseout', {
            dragstart: this.dragstart
        });
    },

    finwheelmoved: function(e) {
        if (this.isDragging() || !this.hasFocus()) {
            return;
        }
        e.preventDefault();
        this.dispatchNewMouseKeysEvent(e, 'fin-canvas-wheelmoved', {
            isRightClick: this.isRightClick(e)
        });
    },

    finclick: function(e) {
        this.mouseLocation = this.getLocal(e);
        this.dispatchNewMouseKeysEvent(e, 'fin-canvas-click', {
            isRightClick: this.isRightClick(e)
        });
    },

    findblclick: function(e) {
        this.mouseLocation = this.getLocal(e);
        this.dispatchNewMouseKeysEvent(e, 'fin-canvas-dblclick', {
            isRightClick: this.isRightClick(e)
        });
    },

    getCharMap: function() {
        return charMap;
    },

    getKeyChar: function(e) {
        var key = e.keyCode || e.detail.key,
            shift = e.shiftKey || e.detail.shift;
        return charMap[key][shift ? 1 : 0];
    },

    finkeydown: function(e) {
        if (!this.hasFocus()) {
            return;
        }

        // prevent TAB from moving focus off the canvas element
        if (e.keyCode === 9) {
            e.preventDefault();
        }

        var keyChar = this.getKeyChar(e);
        if (e.repeat) {
            if (this.repeatKey === keyChar) {
                this.repeatKeyCount++;
            } else {
                this.repeatKey = keyChar;
                this.repeatKeyStartTime = Date.now();
            }
        } else {
            this.repeatKey = null;
            this.repeatKeyCount = 0;
            this.repeatKeyStartTime = 0;
        }
        if (this.currentKeys.indexOf(keyChar) === -1) {
            this.currentKeys.push(keyChar);
        }

        this.dispatchNewEvent(e, 'fin-canvas-keydown', {
            alt: e.altKey,
            ctrl: e.ctrlKey,
            char: keyChar,
            code: e.charCode,
            key: e.keyCode,
            meta: e.metaKey,
            repeatCount: this.repeatKeyCount,
            repeatStartTime: this.repeatKeyStartTime,
            shift: e.shiftKey,
            identifier: e.key,
            currentKeys: this.currentKeys.slice(0)
        });
    },

    finkeyup: function(e) {
        if (!this.hasFocus()) {
            return;
        }

        // prevent TAB from moving focus off the canvas element
        if (e.keyCode === 9) {
            e.preventDefault();
        }

        var keyChar = this.getKeyChar(e);
        this.currentKeys.splice(this.currentKeys.indexOf(keyChar), 1);
        this.repeatKeyCount = 0;
        this.repeatKey = null;
        this.repeatKeyStartTime = 0;
        this.dispatchNewEvent(e, 'fin-canvas-keyup', {
            alt: e.altKey,
            ctrl: e.ctrlKey,
            char: keyChar,
            code: e.charCode,
            key: e.keyCode,
            meta: e.metaKey,
            repeat: e.repeat,
            shift: e.shiftKey,
            identifier: e.key,
            currentKeys: this.currentKeys.slice(0)
        });
    },

    finfocusgained: function(e) {
        this.dispatchNewEvent(e, 'fin-canvas-focus-gained');
    },

    finfocuslost: function(e) {
        this.dispatchNewEvent(e, 'fin-canvas-focus-lost');
    },

    fincontextmenu: function(e) {
        if (e.ctrlKey && this.currentKeys.indexOf('CTRL') === -1) {
            this.currentKeys.push('CTRL');
        }

        this.dispatchNewMouseKeysEvent(e, 'fin-canvas-context-menu', {
            isRightClick: this.isRightClick(e)
        });
    },

    repaint: function() {
        this.dirty = true;
        if (!paintRequest || this.component.properties.repaintIntervalRate === 0) {
            this.paintNow();
        }
    },

    getMouseLocation: function() {
        return this.mouseLocation;
    },

    getOrigin: function() {
        var rect = this.canvas.getBoundingClientRect();
        var p = new rectangular.Point(rect.left, rect.top);
        return p;
    },

    getLocal: function(e) {
        var rect = this.canvas.getBoundingClientRect();
        var p = new rectangular.Point(e.clientX - rect.left, e.clientY - rect.top);
        return p;
    },

    hasFocus: function() {
        return document.activeElement === this.canvas;
    },

    takeFocus: function() {
        var self = this;
        if (!this.hasFocus()) {
            setTimeout(function() {
                self.canvas.focus();
            }, 10);
        }
    },

    beDragging: function() {
        this.dragging = true;
        this.disableDocumentElementSelection();
    },

    beNotDragging: function() {
        this.dragging = false;
        this.enableDocumentElementSelection();
    },

    isDragging: function() {
        return this.dragging;
    },

    disableDocumentElementSelection: function() {
        var style = document.body.style;
        style.cssText = style.cssText + '-webkit-user-select: none';
    },

    enableDocumentElementSelection: function() {
        var style = document.body.style;
        style.cssText = style.cssText.replace('-webkit-user-select: none', '');
    },

    setFocusable: function(truthy) {
        this.focuser.style.display = truthy ? '' : 'none';
    },

    isRightClick: function(e) {
        var isRightMB;
        e = e || window.event;

        if ('which' in e) { // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
            isRightMB = e.which === 3;
        } else if ('button' in e) { // IE, Opera
            isRightMB = e.button === 2;
        }
        return isRightMB;
    },

    dispatchEvent: function(e) {
        return this.canvas.dispatchEvent(e);
    },

    setInfo: function(message, width) {
        if (message) {
            if (width !== undefined) {
                if (width && !isNaN(Number(width))) {
                    width += 'px';
                }
                this.infoDiv.style.width = width;
            }

            if (message.indexOf('<')) {
                this.infoDiv.innerHTML = message;
            } else {
                this.infoDiv.innerText = message;
            }
        }

        this.infoDiv.style.display = message ? 'block' : 'none';
    }
};

function paintLoopFunction(now) {
    if (paintRequest) {
        paintables.forEach(function(paintable) {
            try {
                paintable.tickPainter(now);
            } catch (e) {
                console.error(e);
            }

            if (paintable.component.tickNotification) {
                paintable.component.tickNotification();
            }
        });
        paintRequest = requestAnimationFrame(paintLoopFunction);
    }
}
function restartPaintLoop() {
    paintRequest = paintRequest || requestAnimationFrame(paintLoopFunction);
}
function stopPaintLoop() {
    if (paintRequest) {
        cancelAnimationFrame(paintRequest);
        paintRequest = undefined;
    }
}
restartPaintLoop();

function resizablesLoopFunction(now) {
    if (resizeInterval) {
        for (var i = 0; i < resizables.length; i++) {
            try {
                resizables[i].tickResizer(now);
            } catch (e) {
                console.error(e);
            }
        }
    }
}
function restartResizeLoop() {
    resizeInterval = resizeInterval || setInterval(resizablesLoopFunction, RESIZE_POLLING_INTERVAL);
}
function stopResizeLoop() {
    if (resizeInterval) {
        clearInterval(resizeInterval);
        resizeInterval = undefined;
    }
}
restartResizeLoop();

function makeCharMap() {
    var map = [];

    var empty = ['', ''];

    for (var i = 0; i < 256; i++) {
        map[i] = empty;
    }

    map[27] = ['ESC', 'ESCSHIFT'];
    map[192] = ['`', '~'];
    map[49] = ['1', '!'];
    map[50] = ['2', '@'];
    map[51] = ['3', '#'];
    map[52] = ['4', '$'];
    map[53] = ['5', '%'];
    map[54] = ['6', '^'];
    map[55] = ['7', '&'];
    map[56] = ['8', '*'];
    map[57] = ['9', '('];
    map[48] = ['0', ')'];
    map[189] = ['-', '_'];
    map[187] = ['=', '+'];
    map[8] = ['BACKSPACE', 'BACKSPACESHIFT'];
    map[46] = ['DELETE', 'DELETESHIFT'];
    map[9] = ['TAB', 'TABSHIFT'];
    map[81] = ['q', 'Q'];
    map[87] = ['w', 'W'];
    map[69] = ['e', 'E'];
    map[82] = ['r', 'R'];
    map[84] = ['t', 'T'];
    map[89] = ['y', 'Y'];
    map[85] = ['u', 'U'];
    map[73] = ['i', 'I'];
    map[79] = ['o', 'O'];
    map[80] = ['p', 'P'];
    map[219] = ['[', '{'];
    map[221] = [']', '}'];
    map[220] = ['\\', '|'];
    map[220] = ['CAPSLOCK', 'CAPSLOCKSHIFT'];
    map[65] = ['a', 'A'];
    map[83] = ['s', 'S'];
    map[68] = ['d', 'D'];
    map[70] = ['f', 'F'];
    map[71] = ['g', 'G'];
    map[72] = ['h', 'H'];
    map[74] = ['j', 'J'];
    map[75] = ['k', 'K'];
    map[76] = ['l', 'L'];
    map[186] = [';', ':'];
    map[222] = ['\'', '|'];
    map[13] = ['RETURN', 'RETURNSHIFT'];
    map[16] = ['SHIFT', 'SHIFT'];
    map[90] = ['z', 'Z'];
    map[88] = ['x', 'X'];
    map[67] = ['c', 'C'];
    map[86] = ['v', 'V'];
    map[66] = ['b', 'B'];
    map[78] = ['n', 'N'];
    map[77] = ['m', 'M'];
    map[188] = [',', '<'];
    map[190] = ['.', '>'];
    map[191] = ['/', '?'];
    map[16] = ['SHIFT', 'SHIFT'];
    map[17] = ['CTRL', 'CTRLSHIFT'];
    map[18] = ['ALT', 'ALTSHIFT'];
    map[91] = ['COMMANDLEFT', 'COMMANDLEFTSHIFT'];
    map[32] = ['SPACE', 'SPACESHIFT'];
    map[93] = ['COMMANDRIGHT', 'COMMANDRIGHTSHIFT'];
    map[18] = ['ALT', 'ALTSHIFT'];
    map[38] = ['UP', 'UPSHIFT'];
    map[37] = ['LEFT', 'LEFTSHIFT'];
    map[40] = ['DOWN', 'DOWNSHIFT'];
    map[39] = ['RIGHT', 'RIGHTSHIFT'];

    map[33] = ['PAGEUP', 'PAGEUPSHIFT'];
    map[34] = ['PAGEDOWN', 'PAGEDOWNSHIFT'];
    map[35] = ['PAGERIGHT', 'PAGERIGHTSHIFT']; // END
    map[36] = ['PAGELEFT', 'PAGELEFTSHIFT']; // HOME

    map[112] = ['F1', 'F1SHIFT'];
    map[113] = ['F2', 'F2SHIFT'];
    map[114] = ['F3', 'F3SHIFT'];
    map[115] = ['F4', 'F4SHIFT'];
    map[116] = ['F5', 'F5SHIFT'];
    map[117] = ['F6', 'F6SHIFT'];
    map[118] = ['F7', 'F7SHIFT'];
    map[119] = ['F8', 'F8SHIFT'];
    map[120] = ['F9', 'F9SHIFT'];
    map[121] = ['F10', 'F10SHIFT'];
    map[122] = ['F11', 'F11SHIFT'];
    map[123] = ['F12', 'F12SHIFT'];

    return map;
}

function getCachedContext(canvasElement, type) {
    var gc = canvasElement.getContext(type || '2d'),
        props = {},
        values = {};

    // Stub out all the prototype members of the canvas 2D graphics context:
    Object.keys(Object.getPrototypeOf(gc)).forEach(makeStub);

    // Some older browsers (e.g., Chrome 40) did not have all members of canvas
    // 2D graphics context in the prototype so we make this additional call:
    Object.keys(gc).forEach(makeStub);

    function makeStub(key) {
        if (
            !(key in props) &&
            !/^(webkit|moz|ms|o)[A-Z]/.test(key) &&
            typeof gc[key] !== 'function'
        ) {
            Object.defineProperty(props, key, {
                get: function() {
                    return (values[key] = values[key] || gc[key]);
                },
                set: function(value) {
                    if (value !== values[key]) {
                        gc[key] = values[key] = value;
                    }
                }
            });
        }
    }

    gc.cache = props;

    gc.cache.save = function() {
        gc.save();
        values = Object.create(values);
    };

    gc.cache.restore = function() {
        gc.restore();
        values = Object.getPrototypeOf(values);
    };

    gc.conditionalsStack = [];

    Object.getOwnPropertyNames(Canvas.graphicsContextAliases).forEach(function(alias) {
        gc[alias] = gc[Canvas.graphicsContextAliases[alias]];
    });

    return Object.assign(gc, require('./graphics'));
}

Canvas.graphicsContextAliases = {
    simpleText: 'fillText'
};


module.exports = Canvas;

},{"./graphics":78,"rectangular":99}],67:[function(require,module,exports){
/* eslint-env browser */

/** @module effects */

/** @typedef {function} effectFunction
 * @desc Element to perform transitions upon is `options.el` if defined or `this.el`.
 * @param {object} [options]
 * @param {HTMLElement} [options.el=this.el]
 * @param {function} [options.callback] Function to call at conclusion of transitions.
 * @param {string} [options.duration='0.065s'] - Duration of each transition.
 * @param {object} [options.styles=defaultGlowerStyles] - Hash of CSS styles and values to transition. (For {@link effects~glower|glower} only.
 */

'use strict';

/**
 * Shake element back and fourth a few times as if to say, "Nope!"
 * @type {effectFunction}
 * @memberOf module:effects
 */
exports.shaker = function(options) {
    options = options || {};
    var context = this,
        el = options.el || context.el,
        duration = options.duration || '0.065s',
        computedStyle = window.getComputedStyle(el),
        transitions = computedStyle.transition.split(','),
        position = computedStyle.position,
        x = parseInt(computedStyle.left),
        dx = -3,
        shakes = 6;

    transitions.push('left ' + duration);
    el.style.transition = transitions.join(',');
    el.addEventListener('transitionend', shaker);
    shaker();
    function shaker(event) {
        if (!event || event.propertyName === 'left') {
            el.style.left = x + dx + 'px';
            if (!shakes--) {
                el.removeEventListener('transitionend', shaker);
                transitions.pop();
                el.style.transition = transitions.join(',');
                el.style.position = position;
                if (options.callback) {
                    options.callback.call(context, options);
                }
            }
            dx = shakes ? -dx : 0;
        }
    }
};

var defaultGlowerStyles = {
    'background-color': 'yellow',
    'box-shadow': '0 0 10px red'
};

/**
 * Transition styles on element for a moment and revert as if to say, "Whoa!."
 * @type {effectFunction}
 * @memberOf module:effects
 */
exports.glower = function(options) {
    options = options || {};
    var context = this,
        el = options.el || context.el,
        duration = options.duration || '0.25s',
        styles = options.styles || defaultGlowerStyles,
        values = styles.length,
        computedStyle = window.getComputedStyle(el),
        styleWas = {},
        transition = computedStyle.transition,
        transitions = transition.split(',');

    Object.keys(styles).forEach(function(style) {
        styleWas[style] = {
            style: computedStyle[style],
            undo: true
        };
        transitions.push(style + ' ' + duration);
    });

    el.style.transition = transitions.join(',');
    el.addEventListener('transitionend', glower);
    Object.keys(styles).forEach(function(style) {
        el.style[style] = styles[style];
    });

    function glower(event) {
        var was = styleWas[event.propertyName];
        if (was.undo) {
            el.style[event.propertyName] = was.style;
            was.undo = false;
        } else if (!--values) {
            el.removeEventListener('transitionend', glower);
            el.style.transition = transition;
            if (options.callback) {
                options.callback.call(context, options);
            }
        }
    }
};

},{}],68:[function(require,module,exports){
/* eslint-env browser */

/**
 * @module localization
 */

'use strict';

var Base = require('../Base');


/**
 * @param {string} defaultLocale
 * @param {string} [locale=defaultlocale]
 * @param {object} [options]
 * @constructor
 */
var Formatter = Base.extend({
    initialize: function(defaultLocale, locale, options) {
        if (typeof locale === 'object') {
            options = locale;
            locale = defaultLocale;
        }

        this.locale = locale;

        if (options) {
            if (typeof options.invalid === 'function') {
                this.invalid = options.invalid;
            }

            if (options.expectation) {
                this.expectation = options.expectation;
            }
        }
    }
});


// Safari has no Intl implementation
if (!window.Intl) {
    window.Intl = {
        NumberFormat: function(locale, options) {
            var digits = '0123456789';
            this.format = function(n) {
                var s = n.toString();
                if (!options || options.useGrouping === undefined || options.useGrouping) {
                    var dp = s.indexOf('.');
                    if (dp < 0) {
                        dp = s.length;
                    }
                    while ((dp -= 3) > 0 && digits.indexOf(s[dp - 1]) >= 0) {
                        s = s.substr(0, dp) + ',' + s.substr(dp);
                    }
                }
                return s;
            };
        },
        DateTimeFormat: function(locale, options) {
            this.format = function(date) {
                if (date != null) {
                    if (typeof date !== 'object') {
                        date = new Date(date);
                    }
                    date = date.getMonth() + 1 + '-' + date.getDate() + '-' + date.getFullYear();
                } else {
                    date = null;
                }
                return date;
            };
        }
    };
}


/**
 * @summary Create a number localizer.
 * @implements localizerInterface
 * @desc Create an object conforming to {@link localizerInterface} for numbers, using {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat|Intl.NumberFormat}.
 * @param {string} defaultLocale
 * @param {string} [locale=defaultLocale] - Passed to the {@link Intl.NumberFormat|https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat} constructor.
 * @param {object} [options] - Passed to the `Intl.NumberFormat` constructor.
 * @param {boolean} [options.acceptStandardDigits=false] - Accept standard digits and decimal point interchangeably with localized digits and decimal point. (This option is interpreted here; it is not used by `Intl.NumberFormat`.)
 * @constructor
 * @extends Formatter
 * @tutorial localization
 */
var NumberFormatter = Formatter.extend('NumberFormatter', {
    initialize: function(defaultLocale, locale, options) {
        if (typeof locale === 'object') {
            options = locale;
        }

        options = options || {};

        this.format = new Intl.NumberFormat(this.locale, options).format;

        var mapperOptions = { useGrouping: false },
            mapper = new Intl.NumberFormat(this.locale, mapperOptions).format;

        this.demapper = demap.bind(this);

        /**
         * @summary A string containing the valid characters.
         * @desc Contains all localized digits + localized decimal point.
         * If we're accepting standard digits, will also contain all the standard digits + standard decimal point (if different than localized versions).
         * @type {string}
         * @private
         * @desc Localized digits and decimal point. Will also include standardized digits and decimal point if `options.acceptStandardDigits` is truthy.
         *
         * For internal use by the {@link NumberFormatter#parse|parse} method.
         * @memberOf NumberFormatter.prototype
         */
        this.map = mapper(10123456789.5).substr(1, 11); // localized '0123456789.'

        if (options.acceptStandardDigits && this.map !== '0123456789.') {
            this.map += '0123456789.';  // standard '0123456789.'
        }

        /** @summary A regex that tests `true` on first invalid character.
         * @type {RegExp}
         * @private
         * @desc Valid characters include:
         *
         * * Localized digits
         * * Localized decimal point
         * * Standard digits (when `options.acceptStandardDigits` is truthy)
         * * Standard decimal point (when `options.acceptStandardDigits` is truthy)
         * * Cosmetic characters added by formatter as per `options` (for human-friendly readability).
         *
         * Any characters outside this set are considered invalid.
         *
         * Set by the constructor; consumed by the {@link module:localization~NumberFormatter#invalid|invalid} method.
         *
         * Testing a string against this pattern yields `true` if at least one invalid character or `false` if all characters are valid.
         * @memberOf NumberFormatter.prototype
         */
        this.invalids = new RegExp(
            '[^' +
            this.format(11111).replace(this.map[1], '') + // thousands separator if in use
            this.map + // digits + decimal point
            ']'
        );
    },

    /** @summary Tests for invalid characters.
     * @desc Tests a localized string representation of a number that it contains any invalid characters.
     *
     * The number may be unformatted or it may be formatted with any of the permitted formatting characters, as implied by the constructor's `options` (passed to `Intl.NumberFormat`). Any other characters are considered invalid.
     *
     * However, standard digits and the standard decimal point are considered valid if the value of `options.acceptStandardDigits` as provided to the constructor was truthy. (Of course, these are always valid for locales that use them.)
     *
     * Use this method to:
     * 1. Filter out invalid characters on a `onkeydown` event; or
     * 2. Test an edited string prior to calling the {@link module:localization~NumberFormatter#parse|parse}.
     *
     * NOTE: This method does not check grammatical syntax; it only checks for invalid characters.
     *
     * @param number
     * @returns {boolean|string} Falsy means valid which in this case means contains only valid characters.
     * @memberOf NumberFormatter.prototype
     */
    invalid: function(number) {
        return this.invalids.test(number);
    },

    expectation:
        'Expected a number with optional commas (thousands grouping separator), optional decimal point, and an optional fractional part.\n' +
        'Comma separators are part of the format and will always be displayed for values >= 1000.\n' +
        'Edited values are always saved in their entirety even though the formatted value is rounded to the specified number of decimal places.',

    /**
     * This method will:
     * * Convert localized digits and decimal point characters to standard digits and decimal point characters.
     * * "Clean" the string by ignoring all other characters.
     * * Coerce the string to a number primitive.
     * @param {string} formattedLocalizedNumber - May or may not be formatted.
     * @returns {number} Number primitive.
     * @throws {string} Invalid number.
     * @memberOf NumberFormatter.prototype
     */
    parse: function(formattedLocalizedNumber) {
        var number = Number(
            formattedLocalizedNumber.split('').map(this.demapper).join('')
        );

        if (isNaN(number)) {
            throw 'Invalid Number';
        }

        return number;
    }
});

function demap(c) {
    var d = this.map.indexOf(c) % 11;
    return d < 0 ? '' : d < 10 ? d : '.';
}

/**
 * @implements localizerInterface
 * @param {string} defaultLocale
 * @param {string} [locale=defaultlocale] - Passed to the {@link Intl.DateFormat|https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/DateFormat} constructor.
 * @param {object} [options] - Passed to the `Intl.DateFormat` constructor.
 * @constructor
 * @extends Formatter
 */
var DateFormatter = Formatter.extend('DateFormatter', {
    initialize: function(defaultLocale, locale, options) {
        if (typeof locale === 'object') {
            options = locale;
        }

        options = options || {};

        /** @summary Transform a date object into human-friendly string representation.
         * @method
         */
        this.format = new Intl.DateTimeFormat(this.locale, options).format;

        // Get digits because may be chinese or "real Arabic" numerals.
        var testOptions = { useGrouping: false, style: 'decimal' },
            localizeNumber = new Intl.NumberFormat(this.locale, testOptions).format,
            localizedDigits = this.localizedDigits = localizeNumber(10123456789).substr(1, 10); // all localized digits in numerical order

        this.digitFormatter = formatDigit.bind(this);
        this.digitParser = parseDigit.bind(this);

        // Localize a test date with the default numeric parts to find out the resulting order of these parts.
        var yy = 1987,
            mm = 12,
            dd = 30,
            YY = this.transformNumber(this.digitFormatter, yy),
            MM = this.transformNumber(this.digitFormatter, mm),
            DD = this.transformNumber(this.digitFormatter, dd),
            testDate = new Date(yy, mm - 1, dd),
            localizeDate = new Intl.DateTimeFormat(this.locale).format,
            localizedDate = localizeDate(testDate), // all localized digits + localized punctuation
            missingDigits = new Intl.NumberFormat(this.locale).format(456),
            localizedNumberPattern = this.localizedNumberPattern = new RegExp('[' + localizedDigits + ']+', 'g'),
            parts = localizedDate.match(localizedNumberPattern);

        this.partsMap = {
            yy: parts.indexOf(YY),
            mm: parts.indexOf(MM),
            dd: parts.indexOf(DD)
        };

        if (options.acceptStandardDigits) {
            missingDigits += '1234567890';
        }

        /** @summary A regex that tests `true` on first invalid character.
         * @type {RegExp}
         * @private
         * @desc Valid characters include:
         *
         * * Localized digits
         * * Standard digits (when `options.acceptStandardDigits` is truthy)
         * * Localized punctuation to delimit date parts
         *
         * Any characters outside this set are considered invalid. Note that this only currently implemented when all three date parts are numeric
         *
         * Set by the constructor; consumed by the {@link NumberFormatter#valid|valid} method.
         *
         * Testing a string against this pattern yields `true` if at least one invalid character or `false` if all characters are valid.
         * @memberOf DateFormatter.prototype
         */
        this.invalids = new RegExp(
            '[^' +
            localizedDate.replace(/-/g, '\\-') +
            missingDigits +
            ']'
        );
    },

    /** @summary Tests for invalid characters.
     * @desc Tests a localized string representation of a number that it contains any invalid characters.
     *
     * The date is assumed to contain localized digits and punctuation as would be returned by `Intl.DateFormat` with the given `locale` and `options`. Any other characters are considered invalid.
     *
     * However, standard digits and the standard decimal point are also considered valid if the value of `options.acceptStandardDigits` as provided to the constructor was truthy. (Of course, these are always valid for locales that use them.)
     *
     * Use this method to:
     * 1. Filter out invalid characters on a `onkeydown` event; or
     * 2. Test an edited string prior to calling the {@link module:localization~DateFormatter#parse|parse}.
     *
     * NOTE: The current implementation only supports date formats using all numerics (which is the default for `Intl.DateFormat`).
     *
     * NOTE: This method does not check grammatical syntax; it only checks for invalid characters.
     *
     * @param number
     * @returns {boolean} Contains only valid characters.
     * @memberOf DateFormatter.prototype
     */
    invalid: function(number) {
        return this.invalids.test(number);
    },

    /**
     * This method will:
     * * Convert localized date to Date object.
     * * "Clean" the string by ignoring all other characters.
     * * Coerce the string to a number primitive.
     * @param {string} localizedDate
     * @returns {Date}
     * @throws {string} Invalid date.
     * @memberOf DateFormatter.prototype
     */
    parse: function(localizedDate) {
        var date,
            parts = localizedDate.match(this.localizedNumberPattern);

        if (parts && parts.length === 3) {
            var y = this.transformNumber(this.digitParser, parts[this.partsMap.yy]),
                m = this.transformNumber(this.digitParser, parts[this.partsMap.mm]) - 1,
                d = this.transformNumber(this.digitParser, parts[this.partsMap.dd]);

            date = new Date(y, m, d);
        } else {
            throw 'Invalid Date';
        }

        return date;
    },

    /**
     * Transform a number to or from a string representation with localized digits.
     * @param {function} digitTransformer - A function bound to `this`.
     * @param {number} number
     * @returns {string}
     * @private
     * @memberOf DateFormatter.prototype
     */
    transformNumber: function(digitTransformer, number) {
        return number.toString().split('').map(digitTransformer).join('');
    }
});

function formatDigit(d) {
    return this.localizedDigits[d];
}

function parseDigit(c) {
    var d = this.localizedDigits.indexOf(c);
    if (d < 0) { d = ''; }
    return d;
}

/**
 * All members are localizers (conform to {@link localizerInterface}) with exception of `get`, `set`, and localizer constructors which are named (by convention) ending in "Formmatter".
 *
 * The application developer is free to add localizers and localizer factory methods. See the {@link Localization#construct|construct} convenience method which may be helpful in this regard.
 * @param locale
 * @param {object} [numberOptions]
 * @param {object} [dateOptions]
 * @constructor
 */
function Localization(locale, numberOptions, dateOptions) {
    this.locale = locale;

    /**
     * @name number
     * @see The {@link NumberFormatter|NumberFormatter} class
     * @memberOf Localization.prototype
     */
    this.int = this.float = this.construct('number', NumberFormatter, numberOptions);

    /**
     * @see The {@link DateFormatter|DateFormatter} class
     * @memberOf Localization.prototype
     */
    this.construct('date', DateFormatter, dateOptions);
}

Localization.prototype = {
    constructor: Localization.prototype.constructor,
    $$CLASS_NAME: 'Localization',

    /** @summary Creates a localizer from a localizer factory object using the default locale.
     * @desc Performs the following actions:
     * 1. Binds `Constructor` to `locale`.
     * 2. Adds the newly bound constructor to this object (for future reference) with the key "NameFormatter" (where "Name" is the localizer name, all lower case but with an initial capital).
     * 3. Uses the newly bound constructor to create a new localized localizer with the provided options.
     * 4. Adds new localizer to this object via {@link Localization#add|add}.
     *
     * @param {string} localizerName
     * @param {Constructor
     * @param {object} {factoryOptions}
     * @returns {localizerInterface} The new localizer.
     */
    construct: function(localizerName, Constructor, factoryOptions) {
        var constructorName = localizerName[0].toUpperCase() + localizerName.substr(1).toLowerCase() + 'Formatter',
            BoundConstructor = Constructor.bind(null, this.locale),
            localizer = new BoundConstructor(factoryOptions);

        this[constructorName] = BoundConstructor;

        return this.add(localizerName, localizer);
    },

    /** @summary Register a localizer.
     * @desc Checks the provided localizer that it conforms to {@link localizerInterface}
     * and adds it to the object using localizerName all lower case as the key.
     * @param {string} name
     * @param {localizerInterface} localizer
     * @memberOf Localization.prototype
     * @returns {localizerInterface} The provided localizer.
     */
    add: function(name, localizer) {
        if (typeof name === 'object') {
            localizer = name;
            name = undefined;
        }

        if (
            typeof localizer !== 'object' ||
            typeof localizer.format !== 'function' ||
            typeof localizer.parse !== 'function' ||
            localizer.invalid && typeof localizer.invalid !== 'function' ||
            localizer.expectation && typeof localizer.expectation !== 'string'
        ) {
            throw 'Expected localizer object to conform to interface.';
        }

        name = name || localizer.name;
        name = name && name.toLowerCase();
        this[name] = localizer;

        return localizer;
    },

    /**
     *
     * @param localizerName
     * @returns {localizerInterface}
     * @memberOf Localization.prototype
     */
    get: function(name) {
        return this[name && name.toLowerCase()] || this.string;
    },

    ///  ///  ///  ///  ///    LOCALIZERS    ///  ///  ///  ///  ///

    // Special localizer for use by Chrome's date input control.
    chromeDate: {
        format: function(date) {
            if (date != null) {
                if (typeof date !== 'object') {
                    date = new Date(date);
                }

                var yy = date.getFullYear(),
                    m = date.getMonth() + 1, mm = m < 10 ? '0' + m : m,
                    d = date.getDate(), dd = d < 10 ? '0' + d : d;

                date = yy + '-' + mm + '-' + dd;
            } else {
                date = null;
            }
            return date;
        },
        parse: function(str) {
            var date,
                parts = str.split('-');
            if (parts && parts.length === 3) {
                date = new Date(parts[0], parts[1] - 1, parts[2]);
            } else {
                date = null;
            }
            return date;
        }
    },

    null: {
        format: function(value) {
            return value;
        },
        parse: function(str) {
            return str;
        }
    },

    string: {
        format: function(value) {
            return value + '';
        },
        parse: function(str) {
            return str + '';
        }
    }
};

module.exports = Localization;

},{"../Base":12}],69:[function(require,module,exports){
'use strict';

var Base = require('../Base');

/**
 * @class
 */
var Registry = Base.extend('Registry', {
    initialize: function() {
        this.items = Object.create(null);
    },

    /**
     * @summary Register an item and return it.
     * @desc Adds an item to the registry using the provided name (or the class name), converted to all lower case.
     * @param {string} [name] - Case-insensitive item key. If not given, fallsback to `item.prototype.$$CLASS_NAME` or `item.prototype.name` or `item.name`.
     * @param [item] - If unregistered or omitted, nothing is added and method returns `undefined`.
     *
     * > Note: `$$CLASS_NAME` is normally set by providing a string as the (optional) first parameter (`alias`) in your {@link https://www.npmjs.com/package/extend-me|extend} call.
     *
     * @returns Newly registered item or `undefined` if unregistered.
     *
     * @memberOf Registry#
     */
    add: function(name, item) {
        if (arguments.length === 1) {
            item = name;
            name = undefined;
        }

        if (!item) {
            return;
        }

        name = name || item.getClassName && item.getClassName();

        if (!name) {
            throw new this.HypergridError('Cannot register ' + this.friendlyName() + ' without a name.');
        }

        return (this.items[name] = item);
    },

    /**
     * @summary Register a synonym for an existing item.
     * @param {string} synonymName
     * @param {string} existingName
     * @returns {function|Constructor} The previously registered item this new synonym points to.
     * @memberOf Registry#
     */
    addSynonym: function(synonymName, existingName) {
        return (this.items[synonymName] = this.get(existingName));
    },

    /**
     * Fetch a registered item.
     * @param {string} [name]
     * @returns {*|undefined} A registered item or `undefined` if unregistered.
     * @memberOf Registry#
     */
    get: function(name) {
        if (!name) {
            return;
        }

        var result = this.items[name]; // for performance reasons, do not convert to lower case

        if (!result) {
            var lowerName = name.toLowerCase(); // name may differ in case only
            var foundName = Object.keys(this.items).find(function(key) { return lowerName === key.toLowerCase(); });

            result = this.items[foundName];

            if (result) {
                // Register name as a synonym for the found name for faster access next
                // time without having to convert to lower case on every get.
                this.addSynonym(name, foundName);
            } else {
                throw new this.HypergridError('Expected "' + name + '" to be a case-insensitive match for a registered ' + this.friendlyName() + '.');
            }
        }

        return result;
    },

    friendlyName: function() {
        if (this.BaseClass) {
            var name = this.BaseClass.getClassName();
            name = name && name.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
        } else {
            name = singularOf(this.getClassName()).toLowerCase();
        }
        name = name || 'item';
        return indefArtOf(name) + ' ' + name;
    }
});

var endings = [
    { plural: /ies$/, singular: 'y' },
    { plural: /s$/, singular: '' }
];

function singularOf(name) {
    endings.find(function(ending) {
        if (ending.plural.test(name)) {
            name = name.replace(ending.plural, ending.singular);
            return true;
        }
    });
    return name;
}

function indefArtOf(name) {
    return /^[aeiou]/.test(name) ? 'an' : 'a';
}


module.exports = Registry;

},{"../Base":12}],70:[function(require,module,exports){
'use strict';

var RangeSelectionModel = require('sparse-boolean-array');

/**
 *
 * @constructor
 * @desc We represent selections as a list of rectangles because large areas can be represented and tested against quickly with a minimal amount of memory usage. Also we need to maintain the selection rectangles flattened counter parts so we can test for single dimension contains. This is how we know to highlight the fixed regions on the edges of the grid.
 */

function SelectionModel(grid) {
    this.grid = grid;
    this.reset();
}

SelectionModel.prototype = {

    constructor: SelectionModel.prototype.constructor,

    /**
     * @type {boolean}
     * @memberOf SelectionModel.prototype
     */
    allRowsSelected: false,

    reset: function() {
        /**
         * @name selections
         * @type {Rectangle[]}
         * @summary The selection rectangles.
         * @desc Created as an empty array upon instantiation by the {@link SelectionModel|constructor}.
         * @memberOf SelectionModel.prototype
         */
        this.selections = [];

        /**
         * @name flattenedX
         * @type {Rectangle[]}
         * @summary The selection rectangles flattened in the horizontal direction (no width).
         * @desc Created as an empty array upon instantiation by the {@link SelectionModel|constructor}.
         * @memberOf SelectionModel.prototype
         */
        this.flattenedX = [];

        /**
         * @name flattenedY
         * @type {Rectangle[]}
         * @summary The selection rectangles flattened in the vertical direction (no height).
         * @desc Created as an empty array upon instantiation by the {@link SelectionModel|constructor}.
         * @memberOf SelectionModel.prototype
         */
        this.flattenedY = [];

        /**
         * @name rowSelectionModel
         * @type {RangeSelectionModel}
         * @summary The selection rectangles.
         * @desc Created as a new RangeSelectionModel upon instantiation by the {@link SelectionModel|constructor}.
         * @memberOf SelectionModel.prototype
         */
        this.rowSelectionModel = new RangeSelectionModel();

        /**
         * @name columnSelectionModel
         * @type {RangeSelectionModel}
         * @summary The selection rectangles.
         * @desc Created as a new RangeSelectionModel upon instantiation by the {@link SelectionModel|constructor}.
         * @memberOf SelectionModel.prototype
         */
        this.columnSelectionModel = new RangeSelectionModel();

        this.setLastSelectionType('');
    },

    /**
     * @memberOf SelectionModel.prototype
     * @returns {*}
     */
    getLastSelection: function() {
        var sels = this.selections;
        var sel = sels[sels.length - 1];
        return sel;
    },

    /**
     * @memberOf SelectionModel.prototype
     * @returns {*}
     */
    getLastSelectionType: function() {
        return this.lastSelectionType;
    },

    /**
     * @param type
     * @memberOf SelectionModel.prototype
     */
    setLastSelectionType: function(type) {
        this.lastSelectionType = type;
    },

    /**
     * @memberOf SelectionModel.prototype
     * @description Select the region described by the given coordinates.
     *
     * @param {number} ox - origin x coordinate
     * @param {number} oy - origin y coordinate
     * @param {number} ex - extent x coordinate
     * @param {number} ey - extent y coordinate
     * @param {boolean} silent - whether to fire selection changed event
     */
    select: function(ox, oy, ex, ey, silent) {
        var newSelection = this.grid.newRectangle(ox, oy, ex, ey);

        //Cache the first selected cell before it gets normalized to top-left origin
        newSelection.firstSelectedCell = this.grid.newPoint(ox, oy);

        newSelection.lastSelectedCell = (
            newSelection.firstSelectedCell.x === newSelection.origin.x &&
            newSelection.firstSelectedCell.y === newSelection.origin.y
        )
            ? newSelection.corner
            : newSelection.origin;

        if (this.grid.properties.multipleSelections) {
            this.selections.push(newSelection);
            this.flattenedX.push(newSelection.flattenXAt(0));
            this.flattenedY.push(newSelection.flattenYAt(0));
        } else {
            this.selections[0] = newSelection;
            this.flattenedX[0] = newSelection.flattenXAt(0);
            this.flattenedY[0] = newSelection.flattenYAt(0);
        }
        this.setLastSelectionType('cell');

        if (!silent) {
            this.grid.selectionChanged();
        }
    },

    /**
     * @memberOf SelectionModel.prototype
     * @param {number} ox - origin x coordinate
     * @param {number} oy - origin y coordinate
     * @param {number} ex - extent x coordinate
     * @param {number} ey - extent y coordinate
     */
    toggleSelect: function(ox, oy, ex, ey) {

        var selected, index;

        selected = this.selections.find(function(selection, idx) {
            index = idx;
            return (
                selection.origin.x === ox && selection.origin.y === oy &&
                selection.extent.x === ex && selection.extent.y === ey
            );
        });

        if (selected) {
            this.selections.splice(index, 1);
            this.flattenedX.splice(index, 1);
            this.flattenedY.splice(index, 1);
            this.grid.selectionChanged();
        } else {
            this.select(ox, oy, ex, ey);
        }
    },

    /**
     * @memberOf SelectionModel.prototype
     * @desc Remove the last selection that was created.
     */
    clearMostRecentSelection: function(keepRowSelections) {
        if (!keepRowSelections) {
            this.setAllRowsSelected(false);
        }
        if (this.selections.length) { --this.selections.length; }
        if (this.flattenedX.length) { --this.flattenedX.length; }
        if (this.flattenedY.length) { --this.flattenedY.length; }
        //this.getGrid().selectionChanged();
    },

    /**
     * @memberOf SelectionModel.prototype
     */
    clearMostRecentColumnSelection: function() {
        this.columnSelectionModel.clearMostRecentSelection();
        this.setLastSelectionType('column');
    },

    /**
     * @memberOf SelectionModel.prototype
     */
    clearMostRecentRowSelection: function() {
        this.rowSelectionModel.clearMostRecentSelection();
        this.setLastSelectionType('row');
    },

    /**
     * @memberOf SelectionModel.prototype
     */
    clearRowSelection: function() {
        this.rowSelectionModel.clear();
        this.setLastSelectionType('row');
    },

    /**
     * @memberOf SelectionModel.prototype
     * @returns {*}
     */
    getSelections: function() {
        return this.selections;
    },

    /**
     * @memberOf SelectionModel.prototype
     * @returns {boolean} There are active selection(s).
     */
    hasSelections: function() {
        return this.selections.length !== 0;
    },

    /**
     * @memberOf SelectionModel.prototype
     * @returns {boolean}
     */
    hasRowSelections: function() {
        return !this.rowSelectionModel.isEmpty();
    },

    /**
     * @memberOf SelectionModel.prototype
     * @returns {boolean}
     */
    hasColumnSelections: function() {
        return !this.columnSelectionModel.isEmpty();
    },

    /**
     * @memberOf SelectionModel.prototype
     * @return {boolean} Selection covers a specific column.
     * @param {number} y
     */
    isCellSelectedInRow: function(y) {
        return this._isCellSelected(this.flattenedX, 0, y);
    },

    /**
     * @memberOf SelectionModel.prototype
     * @returns Selection covers a specific row.
     * @param {number} x
     */
    isCellSelectedInColumn: function(x) {
        return this._isCellSelected(this.flattenedY, x, 0);
    },

    /**
     * @memberOf SelectionModel.prototype
     * @summary Selection query function.
     * @returns {boolean} The given cell is selected (part of an active selection).
     * @param {Rectangle[]} selections - Selection rectangles to search through.
     * @param {number} x
     * @param {number} y
     */
    isSelected: function(x, y) {
        return (
            this.isColumnSelected(x) ||
            this.isRowSelected(y) ||
            this._isCellSelected(this.selections, x, y)
        );
    },

    /**
     * @memberOf SelectionModel.prototype
     * @param x
     * @param y
     * @returns {*}
     */
    isCellSelected: function(x, y) {
        return this._isCellSelected(this.selections, x, y);
    },

    /**
     * @memberOf SelectionModel.prototype
     * @param selections
     * @param x
     * @param y
     * @returns {boolean}
     * @private
     */
    _isCellSelected: function(selections, x, y) {
        var self = this;
        return !!selections.find(function(selection) {
            return self.rectangleContains(selection, x, y);
        });
    },

    /**
     * @memberOf SelectionModel.prototype
     * @desc empty out all our state
     *
     */
    clear: function(keepRowSelections) {
        this.selections.length = 0;
        this.flattenedX.length = 0;
        this.flattenedY.length = 0;
        this.columnSelectionModel.clear();
        if (!keepRowSelections) {
            this.setAllRowsSelected(false);
            this.rowSelectionModel.clear();
        }
        //this.getGrid().selectionChanged();
    },

    /**
     * @memberOf SelectionModel.prototype
     * @param {number} ox - origin x coordinate
     * @param {number} oy - origin y coordinate
     * @param {number} ex - extent x coordinate
     * @param {number} ey - extent y coordinate
     * @returns {boolean}
     */
    isRectangleSelected: function(ox, oy, ex, ey) {
        return !!this.selections.find(function(selection) {
            return (
                selection.origin.x === ox && selection.origin.y === oy &&
                selection.extent.x === ex && selection.extent.y === ey
            );
        });
    },

    /**
     * @memberOf SelectionModel.prototype
     * @param x
     * @returns {*}
     */
    isColumnSelected: function(x) {
        return this.columnSelectionModel.isSelected(x);
    },

    /**
     * @memberOf SelectionModel.prototype
     * @param y
     * @returns {boolean|*}
     */
    isRowSelected: function(y) {
        return this.allRowsSelected || this.rowSelectionModel.isSelected(y);
    },

    /**
     * @memberOf SelectionModel.prototype
     * @param x1
     * @param x2
     */
    selectColumn: function(x1, x2) {
        this.columnSelectionModel.select(x1, x2);
        this.setLastSelectionType('column');
    },

    /**
     * @memberOf SelectionModel.prototype
     */
    selectAllRows: function() {
        this.clear();
        this.setAllRowsSelected(true);
    },

    /**
     * @memberOf SelectionModel.prototype
     * @returns {boolean}
     */

    setAllRowsSelected: function(isIt) {
        this.allRowsSelected = isIt;
    },

    areAllRowsSelected: function() {
        return this.allRowsSelected;
    },

    /**
     * @memberOf SelectionModel.prototype
     * @param y1
     * @param y2
     */
    selectRow: function(y1, y2) {
        this.rowSelectionModel.select(y1, y2);
        this.setLastSelectionType('row');
    },

    /**
     * @memberOf SelectionModel.prototype
     * @param x1
     * @param x2
     */
    deselectColumn: function(x1, x2) {
        this.columnSelectionModel.deselect(x1, x2);
        this.setLastSelectionType('column');
    },

    /**
     * @memberOf SelectionModel.prototype
     * @param y1
     * @param y2
     */
    deselectRow: function(y1, y2) {
        if (this.areAllRowsSelected()) {
            // To deselect a row, we must first remove the all rows flag...
            this.setAllRowsSelected(false);
            // ...and create a single range representing all rows
            this.rowSelectionModel.select(0, this.grid.getRowCount() - 1);
        }
        this.rowSelectionModel.deselect(y1, y2);
        this.setLastSelectionType('row');
    },

    /**
     * @memberOf SelectionModel.prototype
     * @returns {*}
     */
    getSelectedRows: function() {
        if (this.areAllRowsSelected()) {
            var headerRows = this.grid.getHeaderRowCount();
            var rowCount = this.grid.getRowCount() - headerRows;
            var result = new Array(rowCount);
            for (var i = 0; i < rowCount; i++) {
                result[i] = i + headerRows;
            }
            return result;
        }
        return this.rowSelectionModel.getSelections();
    },

    /**
     * @memberOf SelectionModel.prototype
     * @returns {*|Array.Array.number}
     */
    getSelectedColumns: function() {
        return this.columnSelectionModel.getSelections();
    },

    /**
     * @memberOf SelectionModel.prototype
     * @returns {boolean}
     */
     isColumnOrRowSelected: function() {
        return !this.columnSelectionModel.isEmpty() || !this.rowSelectionModel.isEmpty();
    },

    /**
     * @memberOf SelectionModel.prototype
     * @returns {Array}
     */
    getFlattenedYs: function() {
        var result = [];
        var set = {};
        this.selections.forEach(function(selection) {
            var top = selection.origin.y;
            var size = selection.extent.y + 1;
            for (var r = 0; r < size; r++) {
                var ti = r + top;
                if (!set[ti]) {
                    result.push(ti);
                    set[ti] = true;
                }
            }
        });
        result.sort(function(x, y) {
            return x - y;
        });
        return result;
    },

    /**
     * @memberOf SelectionModel.prototype
     * @param offset
     */
    selectRowsFromCells: function(offset, keepRowSelections) {
        offset = offset || 0;

        var sm = this.rowSelectionModel;

        if (!keepRowSelections) {
            this.setAllRowsSelected(false);
            sm.clear();
        }

        this.selections.forEach(function(selection) {
            var top = selection.origin.y,
                extent = selection.extent.y;
            top += offset;
            sm.select(top, top + extent);
        });
    },

    /**
     * @memberOf SelectionModel.prototype
     * @param offset
     */
    selectColumnsFromCells: function(offset) {
        offset = offset || 0;

        var sm = this.columnSelectionModel;
        sm.clear();

        this.selections.forEach(function(selection) {
            var left = selection.origin.x,
                extent = selection.extent.x;
            left += offset;
            sm.select(left, left + extent);
        });
    },

    /**
     * @memberOf SelectionModel.prototype
     * @param x
     * @param y
     * @returns {*}
     */
    isInCurrentSelectionRectangle: function(x, y) {
        var last = this.selections[this.selections.length - 1];
        return last && this.rectangleContains(last, x, y);
    },

    /**
     * @memberOf SelectionModel.prototype
     * @param rect
     * @param x
     * @param y
     * @returns {boolean}
     */
    rectangleContains: function(rect, x, y) { //TODO: explore why this works and contains on rectanglular does not
        var minX = rect.origin.x;
        var minY = rect.origin.y;
        var maxX = minX + rect.extent.x;
        var maxY = minY + rect.extent.y;

        if (rect.extent.x < 0) {
            minX = maxX;
            maxX = rect.origin.x;
        }

        if (rect.extent.y < 0) {
            minY = maxY;
            maxY = rect.origin.y;
        }

        var result =
            x >= minX &&
            y >= minY &&
            x <= maxX &&
            y <= maxY;

        return result;
    }
};

module.exports = SelectionModel;

},{"sparse-boolean-array":100}],71:[function(require,module,exports){
'use strict';

/**
 * For each key in src:
 * * When `src[key]` is defined, assigns it to `object[key]` when the latter does not exist or is writable or is a setter
 * * When `src[key]` is undefined:
 *    * When `object[key]` is a configurable property and not a setter, deletes it
 *    * Else when `object[key]` is writable or is a setter, assigns `undefined` (setter handles deletion)
 * @param {object} dest
 * @param {object} src - Defined values set the corresponding key in `dest`. `undefined` values delete the key from `dest`.
 */
module.exports = function(dest, src) {
    Object.keys(src).forEach(function(key) {
        var descriptor = Object.getOwnPropertyDescriptor(dest, key),
            value = src[key];

        if (value !== undefined) {
            if (!descriptor || descriptor.writable || descriptor.set) {
                dest[key] = value;
            }
        } else if (descriptor) {
            if (descriptor.configurable && !descriptor.set) {
                delete dest[key];
            } else if (descriptor.writable || descriptor.set) {
                dest[key] = undefined;
            }
        } // else no descriptor so no property to delete
    });
};

},{}],72:[function(require,module,exports){
'use strict';

var cellEventProperties = Object.defineProperties({}, { // all props non-enumerable
    /**
     * The raw value of the cell, unformatted.
     * @memberOf CellEvent#
     */
    value: {
        get: function() { return this.subgrid.getValue(this.dataCell.x, this.dataCell.y); },
        set: function(value) { this.subgrid.setValue(this.dataCell.x, this.dataCell.y, value); }
    },

    /**
     * An object representing the whole data row, including hidden columns.
     * @type {object}
     * @memberOf CellEvent#
     */
    dataRow: {
        get: function() { return this.subgrid.getRow(this.dataCell.y); }
    },

    /**
     * The formatted value of the cell.
     * @memberOf CellEvent#
     */
    formattedValue: {
        get: function() { return this.grid.formatValue(this.properties.format, this.value); }
    },

    /**
     * The bounds of the cell.
     * @property {number} left
     * @property {number} top
     * @property {number} width
     * @property {number} height
     * @memberOf CellEvent#
     */
    bounds: { get: function() {
        return this._bounds || (this._bounds = {
            x: this.visibleColumn.left,
            y: this.visibleRow.top,
            width: this.visibleColumn.width,
            height: this.visibleRow.height
        });
    } },

    columnProperties: { get: function() {
        var cp = this._columnProperties;
        if (!cp) {
            cp = this.column.properties;
            if (this.isHandleColumn){
                cp = cp.rowHeader;
            } else if (this.isTreeColumn) {
                cp = cp.treeHeader;
            } else if (this.isDataRow) {
                // cp already set to basic props
            } else if (this.isFilterRow) {
                cp = cp.filterProperties;
            } else { // unselected header, summary, etc., all have save look as unselected header
                cp = cp.columnHeader;
            }
            this._columnProperties = cp;
        }
        return cp;
    } },
    cellOwnProperties: { get: function() {
        // do not use for get/set prop because may return null; instead use .getCellProperty('prop') or .properties.prop (preferred) to get, setCellProperty('prop', value) to set
        if (this._cellOwnProperties === undefined) {
            this._cellOwnProperties = this.column.getCellOwnProperties(this.dataCell.y, this.subgrid);
        }
        return this._cellOwnProperties; // null return means there is no cell properties object
    } },
    /**
     * @returns {string} Cell properties object if it exists, else the column properties object it would have as a prototype if did exist.
     * @method
     * @memberOf CellEvent#
     */
    properties: { get: function() {
        return this.cellOwnProperties || this.columnProperties;
    } },
    /**
     * @param {string} key - Property name.
     * @returns {string} Property value.
     * @method
     * @memberOf CellEvent#
     */
    getCellProperty: { value: function(key) {
        // included for completeness but `.properties[key]` is preferred
        return this.properties[key];
    } },
    /**
     * @param {string} key - Property name.
     * @param {string} value - Property value.
     * @method
     * @memberOf CellEvent#
     */
    setCellProperty: { value: function(key, value) {
        // do not use `.cellOwnProperties[key] = value` because object may be null (this method creates new object as needed)
        this._cellOwnProperties = this.column.setCellProperty(this.dataCell.y, key, value, this.subgrid);
    } },

    rowOwnProperties: {
        // undefined return means there is no row properties object
        get: function() {
            return this.behavior.getRowProperties(this, undefined, this.subgrid);
        }
    },
    rowProperties: {
        get: function() {
            // use carefully! creates new object as needed; only use when object definitely needed: for setting prop with `.rowProperties[key] = value` or `Object.assign(.rowProperties, {...})`; use getRowProperty(key) instead for getting a property that may not exist because it will not create a new object
            return this.behavior.getRowProperties(this, null, this.subgrid);
        },
        set: function(properties) {
            // for resetting whole row properties object: `.rowProperties = {...}`
            this.behavior.setRowProperties(this, properties, this.subgrid); // calls `stateChanged()`
        }
    },
    getRowProperty: { value: function(key) {
        // undefined return means there is no row properties object OR no such row property `[key]`
        var rowProps = this.rowOwnProperties;
        return rowProps && rowProps[key];
    } },
    setRowProperty: { value: function(key, value) {
        // creates new object as needed
        this.rowProperties[key] = value; // todo: call `stateChanged()` after refac-as-flags
    } },

    // special method for use by renderer which reuses cellEvent object for performance reasons
    reset: { value: function(visibleColumn, visibleRow) {
        // getter caches
        this._columnProperties = undefined;
        this._cellOwnProperties = undefined;
        this._bounds = undefined;

        // partial render support
        this.snapshot = [];
        this.minWidth = undefined;
        // this.disabled = undefined;

        this.visibleColumn = visibleColumn;
        this.visibleRow = visibleRow;

        this.subgrid = visibleRow.subgrid;

        this.column = visibleColumn.column; // enumerable so will be copied to cell renderer object

        this.gridCell.x = visibleColumn.columnIndex;
        this.gridCell.y = visibleRow.index;

        this.dataCell.x = this.column && this.column.index;
        this.dataCell.y = visibleRow.rowIndex;
    } },

    /**
     * Set up this `CellEvent` instance to point to the cell at the given grid coordinates.
     * @desc If the requested cell is not be visible (due to being scrolled out of view or outside the bounds of the rendered grid), the instance is not reset.
     * @param {number} gridC - Horizontal grid cell coordinate adjusted for horizontal scrolling after fixed columns.
     * @param {number} gridY - Raw vertical grid cell coordinate.
     * @returns {boolean} Visibility.
     * @method
     * @memberOf CellEvent#
     */
    resetGridCY: { value: function(gridC, gridY) {
        var vr, vc, visible = (
            (vc = this.renderer.getVisibleColumn(gridC)) &&
            (vr = this.renderer.getVisibleRow(gridY))
        );
        if (visible) { this.reset(vc, vr); }
        return visible;
    } },

    /**
     * Set up this `CellEvent` instance to point to the cell at the given grid coordinates.
     * @desc If the requested cell is not be visible (due to being scrolled out of view or outside the bounds of the rendered grid), the instance is not reset.
     * @param {number} gridX - Raw horizontal grid cell coordinate.
     * @param {number} gridY - Raw vertical grid cell coordinate.
     * @returns {boolean} Visibility.
     * @method
     * @memberOf CellEvent#
     */
    resetGridXY: { value: function(gridX, gridY) {
        var vr, vc, visible = (
            (vc = this.renderer.visibleColumns[gridX]) &&
            (vr = this.renderer.getVisibleRow(gridY))
        );
        if (visible) { this.reset(vc, vr); }
        return visible;
    } },

    /**
     * @summary Set up this `CellEvent` instance to point to the cell at the given data coordinates.
     * @desc If the requested cell is not be visible (due to being scrolled out of view), the instance is not reset.
     * @param {number} dataX - Horizontal data cell coordinate.
     * @param {number} dataY - Vertical data cell coordinate.
     * @param {dataModelAPI} [subgrid=this.behavior.subgrids.data]
     * @returns {boolean} Visibility.
     * @method
     * @memberOf CellEvent#
     */
    resetDataXY: { value: function(dataX, dataY, subgrid) {
        var vr, vc, visible = (
            (vc = this.renderer.getVisibleDataColumn(dataX)) &&
            (vr = this.renderer.getVisibleDataRow(dataY, subgrid))
        );
        if (visible) { this.reset(vc, vr); }
        return visible;
    } },

    /**
     * Set up this `CellEvent` instance to point to the cell at the given grid column and data row coordinates.
     * @desc If the requested cell is not be visible (due to being scrolled out of view or outside the bounds of the rendered grid), the instance is not reset.
     * @param {number} gridX - Horizontal grid cell coordinate (adjusted for horizontal scrolling after fixed columns).
     * @param {number} dataY - Vertical data cell coordinate.
     * @param {dataModelAPI} [subgrid=this.behavior.subgrids.data]
     * @param {boolean} [useAllCells] - Search in all rows and columns instead of only rendered ones.
     * @returns {boolean} Visibility.
     * @method
     * @memberOf CellEvent#
     */
    resetGridXDataY: { value: function(gridX, dataY, subgrid, useAllCells) {
        var visible, vc, vr;

        if (useAllCells) {
            // When expanding selections larger than the viewport, the origin/corner
            // points may not be rendered and would normally fail to reset cell's position.
            // Mock column and row objects for this.reset() to use:
            vc = {
                column: this.behavior.getColumn(gridX),
                columnIndex: gridX
            };
            vr = {
                subgrid: subgrid || this.behavior.subgrids.lookup.data,
                rowIndex: dataY
            };
            visible = true;
        } else {
            visible = (
                (vc = this.renderer.getVisibleColumn(gridX)) &&
                (vr = this.renderer.getVisibleDataRow(dataY, subgrid))
            );
        }

        if (visible) {
            this.reset(vc, vr);
        }

        return visible && this;
    } },

    /**
     * Copy self with or without own properties
     * @param {boolan} [assign=false] - Copy the own properties to the clone.
     * @returns {CellEvent}
     * @method
     * @memberOf CellEvent#
     */
    clone: { value: function(assign) {
        var cellEvent = new this.constructor;

        cellEvent.resetGridXY(this.visibleColumn.index, this.visibleRow.index);

        if (assign) {
            // copy own props
            Object.assign(cellEvent, this);
        }

        return cellEvent;
    } },

    editPoint: {
        get: function() {
            throw 'The `.editPoint` property is no longer available as of v1.2.10. Use the following coordinates instead:\n' +
            '`.gridCell.x` - The active column index. (Adjusted for column scrolling after fixed columns.)\n' +
            '`.gridCell.y` - The vertical grid coordinate. (Unaffected by row scrolling.)\n' +
            '`.dataCell.x` - The data model\'s column index. (Unaffected by column scrolling.)\n' +
            '`.dataCell.y` - The data model\'s row index. (Adjusted for data row scrolling after fixed rows.)\n';
        }
    },

    /** "Visible" means scrolled into view.
     * @type {boolean}
     * @memberOf CellEvent#
     */
    isRowVisible:    { get: function() { return !!this.visibleRow; } },
    /** "Visible" means scrolled into view.
     * @type {boolean}
     * @memberOf CellEvent#
     */
    isColumnVisible: { get: function() { return !!this.visibleColumn; } },
    /** "Visible" means scrolled into view.
     * @type {boolean}
     * @memberOf CellEvent#
     */
    isCellVisible:   { get: function() { return this.isRowVisible && this.isColumnVisible; } },


    /** A data row is any row in the data subgrid; all other rows (headers, footers, _etc._) are not data rows.
     * @type {boolean}
     * @memberOf CellEvent#
     */
    isDataRow:    { get: function() { return this.subgrid.isData; } },
    /** A data column is any column that is not the row number column or the tree column.
     * @type {boolean}
     * @memberOf CellEvent#
     */
    isDataColumn: { get: function() { return this.gridCell.x >= 0; } },
    /** A data cell is a cell in both a data row and a data column.
     * @type {boolean}
     * @memberOf CellEvent#
     */
    isDataCell:   { get: function() { return this.isDataRow && this.isDataColumn; } },


    /** @type {boolean}
     * @memberOf CellEvent#
     */
    isRowSelected:    { get: function() { return this.isDataRow && this.selectionModel.isRowSelected(this.dataCell.y); } },
    /** @type {boolean}
     * @memberOf CellEvent#
     */
    isColumnSelected: { get: function() { return this.isDataColumn && this.selectionModel.isColumnSelected(this.gridCell.x); } },
    /** @type {boolean}
     * @memberOf CellEvent#
     */
    isCellSelected:   { get: function() { return this.selectionModel.isCellSelected(this.gridCell.x, this.dataCell.y); } },


    /** @type {boolean}
     * @memberOf CellEvent#
     */
    isRowHovered:    { get: function() { return this.grid.canvas.hasMouse && this.isDataRow && this.grid.hoverCell && this.grid.hoverCell.y === this.gridCell.y; } },
    /** @type {boolean}
     * @memberOf CellEvent#
     */
    isColumnHovered: { get: function() { return this.grid.canvas.hasMouse && this.isDataColumn && this.grid.hoverCell && this.grid.hoverCell.x === this.gridCell.x; } },
    /** @type {boolean}
     * @memberOf CellEvent#
     */
    isCellHovered:   { get: function() { return this.isRowHovered && this.isColumnHovered; } },


    /** @type {boolean}
     * @memberOf CellEvent#
     */
    isRowFixed:    { get: function() { return this.isDataRow && this.dataCell.y < this.grid.properties.fixedRowCount; } },
    /** @type {boolean}
     * @memberOf CellEvent#
     */
    isColumnFixed: { get: function() { return this.isDataColumn && this.gridCell.x < this.grid.properties.fixedColumnCount; } },
    /** @type {boolean}
     * @memberOf CellEvent#
     */
    isCellFixed:   { get: function() { return this.isRowFixed && this.isColumnFixed; } },


    /** @type {boolean}
     * @memberOf CellEvent#
     */
    isHandleColumn: { get: function() { return this.gridCell.x === this.behavior.rowColumnIndex && this.grid.properties.showRowNumbers; } },
    /** @type {boolean}
     * @memberOf CellEvent#
     */
    isHandleCell:   { get: function() { return this.isHandleColumn && this.isDataRow; } },


    /** @type {boolean}
     * @memberOf CellEvent#
     */
    isTreeColumn: { get: function() { return this.gridCell.x === this.behavior.treeColumnIndex; } },


    /** @type {boolean}
     * @memberOf CellEvent#
     */
    isHeaderRow:    { get: function() { return this.subgrid.isHeader; } },
    /** @type {boolean}
     * @memberOf CellEvent#
     */
    isHeaderHandle: { get: function() { return this.isHeaderRow && this.isHandleColumn; } },
    /** @type {boolean}
     * @memberOf CellEvent#
     */
    isHeaderCell:   { get: function() { return this.isHeaderRow && this.isDataColumn; } },


    /** @type {boolean}
     * @memberOf CellEvent#
     */
    isFilterRow:    { get: function() { return this.subgrid.isFilter; } },
    /** @type {boolean}
     * @memberOf CellEvent#
     */
    isFilterHandle: { get: function() { return this.isFilterRow && this.isHandleColumn; } },
    /** @type {boolean}
     * @memberOf CellEvent#
     */
    isFilterCell:   { get: function() { return this.isFilterRow && this.isDataColumn; } },


    /** @type {boolean}
     * @memberOf CellEvent#
     */
    isSummaryRow:    { get: function() { return this.subgrid.isSummary; } },
    /** @type {boolean}
     * @memberOf CellEvent#
     */
    isSummaryHandle: { get: function() { return this.isSummaryRow && this.isHandleColumn; } },
    /** @type {boolean}
     * @memberOf CellEvent#
     */
    isSummaryCell:   { get: function() { return this.isSummaryRow && this.isDataColumn; } },


    /** @type {boolean}
     * @memberOf CellEvent#
     */
    isTopTotalsRow:    { get: function() { return this.subgrid === this.behavior.subgrids.lookup.topTotals; } },
    /** @type {boolean}
     * @memberOf CellEvent#
     */
    isTopTotalsHandle: { get: function() { return this.isTopTotalsRow && this.isHandleColumn; } },
    /** @type {boolean}
     * @memberOf CellEvent#
     */
    isTopTotalsCell:   { get: function() { return this.isTopTotalsRow && this.isDataColumn; } },


    /** @type {boolean}
     * @memberOf CellEvent#
     */
    isBottomTotalsRow:    { get: function() { return this.subgrid === this.behavior.subgrids.lookup.bottomTotals; } },
    /** @type {boolean}
     * @memberOf CellEvent#
     */
    isBottomTotalsHandle: { get: function() { return this.isBottomTotalsRow && this.isHandleColumn; } },
    /** @type {boolean}
     * @memberOf CellEvent#
     */
    isBottomTotalsCell:   { get: function() { return this.isBottomTotalsRow && this.isDataColumn; } },

    $$CLASS_NAME: { value: 'CellEvent' }
});

var Point = require('rectangular').Point;

/**
 * Variation of `rectangular.Point` but with writable `x` and `y`
 * @constructor
 */
function WritablePoint(x, y) {
    // skip x and y initialization here for performance
    // because typically reset after instantiation
}

WritablePoint.prototype = Point.prototype;


var writableDescriptor = { writable: true };
var eumerableDescriptor = { writable: true, enumerable: true };

/** @typedef {WritablePoint} dataCellCoords
 * @property {number} x - The data model's column index, unaffected by column scrolling; _i.e.,_
 * an index suitable for dereferencing the column object to which the cell belongs via {@link Behavior#getColumn}.
 * @property {number} y - The data model's row index, adjusted for data row scrolling after fixed rows.
 */

/** @typedef {WritablePoint} gridCellCoords
 * @property {number} x - The active column index, adjusted for column scrolling after fixed columns; _i.e.,_
 * an index suitable for dereferencing the column object to which the cell belongs via {@link Behavior#getActiveColumn}.
 * @property {number} y - The vertical grid coordinate, unaffected by subgrid, row scrolling, and fixed rows.
 */

/**
 * @name cellEventFactory
 *
 * @summary Create a custom `CellEvent` class.
 *
 * @desc Create a custom definition of `CellEvent` for each grid instance, setting the `grid`, `behavior`, and `dataModel` properties on the prototype. As this happens once per grid instantiation, it avoids having to perform this set up work on every `CellEvent` instantiation.
 *
 * @param {HyperGrid} grid
 *
 * @returns {function}
 */
function factory(grid) {

    /**
     * @summary Create a new CellEvent object.
     *
     * @classdesc `CellEvent` is a very low-level object that needs to be super-efficient. JavaScript objects are well known to be light weight in general, but at this level we need to be careful.
     *
     * These objects were originally only being created on mouse events. This was no big deal as mouse events are few and far between. However, as of v1.2.0, the renderer now also creates one for each visible cell on each and every grid paint.
     *
     * For this reason, to maintain performance, each grid gets a custom definition of `CellEvent`, created by this class factory, with the following optimizations:
     *
     * * Use of `extend-me` is avoided because its `initialize` chain is a bit too heavy here.
     * * Custom versions of `CellEvent` for each grid lightens the load on the constructor.
     *
     * @desc All own enumerable properties are mixed into cell editor:
     * * Includes `this.column` defined by constructor (as enumerable).
     * * Excludes all other properties defined by constructor and prototype, all of which are non-enumerable.
     * * Any additional (enumerable) members mixed in by application's `getCellEditorAt` override.
     *
     * Including the params calls {@link CellEvent#resetGridCY resetGridCY(gridX, gridY)}.
     * Alternatively, instantiate without params and/or later call one of these:
     * * {@link CellEvent#resetGridXY resetGridXY(...)}
     * * {@link CellEvent#resetDataXY resetDataXY(...)}
     * * {@link CellEvent#resetGridXDataY resetGridXDataY(...)}
     *
     * @param {number} [gridX] - grid cell coordinate (adjusted for horizontal scrolling after fixed columns).
     * @param {number} [gridY] - grid cell coordinate, adjusted (adjusted for vertical scrolling if data subgrid)
     * @constructor CellEvent
     */
    function CellEvent(gridX, gridY) {
        // remaining instance vars are non-enumerable so `CellEditor` constructor won't mix them in (for mustache use).
        Object.defineProperties(this, {
            /**
             * @name visibleColumn
             * @type {visibleColumnArray}
             * @memberOf CellEvent#
             */
            visibleColumn: writableDescriptor,

            /**
             * @name visibleRow
             * @type {visibleRowArray}
             * @memberOf CellEvent#
             */
            visibleRow: writableDescriptor,

            /**
             * @name subgrid
             * @type {dataModelAPI}
             * @memberOf CellEvent#
             */
            subgrid: writableDescriptor,

            /**
             * @name gridCell
             * @type {gridCellCoords}
             * @memberOf CellEvent#
             */
            gridCell: {
                value: new WritablePoint
            },

            /**
             * @name dataCell
             * @type {dataCellCoords}
             * @memberOf CellEvent#
             */
            dataCell: {
                value: new WritablePoint
            },

            /**
             * A reference to the cell's {@link Column} object.
             *
             * This property is enumerable so that it will be copied to cell editor on {@link CellEditor} instantiation.
             * @name column
             * @type {Column}
             * @memberOf CellEvent#
             */
            column: eumerableDescriptor,

            // getter caches
            _columnProperties: writableDescriptor,
            _cellOwnProperties: writableDescriptor,
            _bounds: writableDescriptor,

            // Following supports cell renderers' "partial render" capability:
            snapshot: writableDescriptor,
            minWidth: writableDescriptor,
            disabled: writableDescriptor
        });

        if (arguments.length) {
            this.resetGridCY(gridX, gridY);
        }
    }

    CellEvent.prototype = Object.create(cellEventProperties, {
        constructor: { value: CellEvent },
        grid: { value: grid },
        renderer: { value: grid.renderer },
        selectionModel: { value: grid.selectionModel },
        behavior: { value: grid.behavior },
        dataModel: { value: grid.behavior.dataModel }
    });

    return CellEvent;
}

module.exports = factory;

},{"rectangular":99}],73:[function(require,module,exports){
'use strict';

// console.warn polyfill as needed
// used for deprecation warnings
if (!console.warn) {
    console.warn = function() {
        console.log.apply(console, ['WARNING:'].concat(Array.prototype.slice.call(arguments)));
    };
}

var regexIsMethod = /^[\w\.]+\(.*\)$/;

/**
 * User is warned and new property is returned or new method is called and the result is returned.
 * @param {string} methodName - Warning key paired with arbitrary warning in `dotProps` OR deprecated method name with parentheses containing optional argument list paired with replacement property or method in `dotProps`.
 * @param {string} dotProps - Arbitrary warning paired with warning key in `methodName` OR dot-separated new property name to invoke or method name to call. Method names are indicated by including parentheses with optional argument list. The arguments in each list are drawn from the arguments presented in the `methodName` parameter.
 * @param {string} since - Version in which the name was deprecated.
 * @param {Arguments|Array} [args] - The actual arguments in the order listed in `methodName`. Only needed when arguments need to be forwarded.
 * @param {string} [notes] - Notes to add to message.
 * @returns {*} Return value of new property or method call.
 */
var deprecated = function(methodName, dotProps, since, args, notes) {
    if (typeof args === 'string') {
        // `args` omitted
        notes = args;
        args = undefined;
    }

    var chain = dotProps.split('.'),
        warned = this.$$DEPRECATION_WARNED = this.$$DEPRECATION_WARNED || {},
        result = this,
        isSimpleWarning = dotProps.indexOf(' ') >= 0,
        isMethodCall = regexIsMethod.test(methodName),
        memberType,
        warning;

    if (!(methodName in warned)) {
        warned[methodName] = deprecated.warnings;
    }

    if (isMethodCall) {
        if (isSimpleWarning) {
            throw 'Expected replacement method or property in 2nd parameter of deprecated() call.';
        } else if (warned[methodName]) {
            --warned[methodName];
            memberType = regexIsMethod.test(dotProps) ? 'method' : 'property';
            warning = 'The .' + methodName + ' method has been deprecated as of v' + since +
                ' in favor of the .' + chain.join('.') + ' ' + memberType + '.' +
                ' (Will be removed in a future release.)';

            if (notes) {
                warning += ' ' + notes;
            }

            console.warn(warning);
        }
    } else if (isSimpleWarning) {
        if (warned[methodName]) {
            --warned[methodName];
            console.warn(dotProps);
        }
        return;
    } else {
        throw 'Expected method name with parentheses in 1st parameter OR simple warning (containing one or more spaces) in 2nd parameter of deprecated() call.';
    }

    var formalArgList = argList(methodName);

    function mapToFormalArg(argName) {
        var index = formalArgList.indexOf(argName);
        if (index === -1) {
            throw 'Actual arg "' + argName + '" not found in formal arg list ' + formalArgList;
        }
        return args[index];
    }

    for (var i = 0, last = chain.length - 1; i <= last; ++i) {
        var link = chain[i],
            name = link.match(/\w+/)[0],
            linkIsMethodCall = regexIsMethod.test(link),
            actualArgList = linkIsMethodCall ? argList(link) : undefined,
            actualArgs = [];

        if (actualArgList) {
            actualArgs = actualArgList.map(mapToFormalArg);
            result = result[name].apply(result, actualArgs);
        } else if (linkIsMethodCall) {
            result = result[name]();
        } else {
            result = result[name];
        }
    }

    return result;
};

deprecated.warnings = 1; // 3 or 5 would get more attention

function argList(s) {
    return s.match(/^\w+\((.*)\)$/)[1].match(/(\w+)/g);
}

module.exports = deprecated;

},{}],74:[function(require,module,exports){
/* globals CustomEvent */

'use strict';

var details = [
    'gridCell',
    'dataCell',
    'mousePoint',
    'keys',
    'row'
];

/**
 * @this {Hypergrid}
 * @param {string} eventName
 * @param {boolean} [cancelable=false] - Event implements `preventDefault()`. Must be boolean if given.
 * _If omitted, `event` and `primitiveEvent` are promoted to 2nd and 3rd argument positions, respecitvely._
 * @param {object} event
 * @param {CellEvent|MouseEvent|KeyboardEvent|object} [primitiveEvent]
 * @returns {undefined|boolean}
 */
module.exports = function(eventName, cancelable, event, primitiveEvent) {
    var detail;

    if (!this.canvas) {
        return;
    }

    if (typeof cancelable !== 'boolean') {
        primitiveEvent = event; // propmote primitiveEvent to 3rd position
        event = cancelable; // promote event to 2nd position
        cancelable = false; // default when omitted
    }

    if (!event) {
        event = {};
    }

    if (!event.type) {
        event.type = eventName;
    }

    if (!event.detail) {
        event = { detail: event };
    }

    detail = event.detail;

    if (!detail.grid) { // CellEvent objects already have a (read-only) `grid` prop
        detail.grid = this;
    }

    detail.time = Date.now();

    if (primitiveEvent) {
        if (!detail.primitiveEvent) {
            detail.primitiveEvent = primitiveEvent;
        }
        details.forEach(function(key) {
            if (key in primitiveEvent && !(key in detail)) {
                detail[key] = primitiveEvent[key];
            }
        });
        if ('dataRow' in primitiveEvent) {
            // reference (without invoking) cellEvent's `dataRow` getter when available
            Object.defineProperty(detail, 'row', { get: function() { return primitiveEvent.dataRow; } });
        }
    }

    event.cancelable = cancelable;

    return this.canvas.dispatchEvent(new CustomEvent(eventName, event));
};

},{}],75:[function(require,module,exports){
'use strict';

var warnedDoubleClickDelay;

/**
 * @summary Dynamic grid property getter/setters.
 * @desc  Dynamic grid properties can make use of a _backing store._
 * This backing store is created in the same layer (the grid properties layer) by {@link Hypergrid#clearState|clearState} and backs grid-only properties. We currently do not create one for descendant objects, such as column and cell properties objects.
 * The members of the backing store have the same names as the dynamic properties that utilize them.
 * They are initialized by {@link Hypergrid#clearState|clearState} to the default values from {@link module:defaults|defaults} object members, (also) of the same name.
 *
 * Note that dynamic properties must enumerable to be visible to {@link Hypergrid#saveState}.
 * @name dynamicProperties
 * @module
 */
var dynamicPropertyDescriptors = {
    /**
     * @returns {string|undefined|object} One of:
     * * **string:** When theme name is registered (except 'default').
     * * **undefined:** When theme layer is empty (or theme name is 'default').
     * * **object:** When theme name is not registered.
     * @memberOf module:dynamicProperties
     */
    theme: {
        enumerable: true,
        get: function() {
            return this.grid.getTheme();
        },
        set: function(theme) {
            this.grid.applyTheme(theme);
        }
    },

    /**
     * @memberOf module:dynamicProperties
     */
    subgrids: {
        enumerable: true,
        get: function() {
            return this.var.subgrids;
        },
        set: function(subgrids) {
            this.var.subgrids = subgrids.slice();

            if (this.grid.behavior) {
                this.grid.behavior.subgrids = subgrids;
            }
        }
    },

    /**
     * @memberOf module:dynamicProperties
     */
    features: {
        enumerable: true,
        get: function() {
            return this.var.features;
        },
        set: function(features) {
            this.var.features = features.slice();
            if (this.grid.behavior) {
                this.grid.behavior.initializeFeatureChain(features);
                this.grid.allowEvents(this.grid.getRowCount());
            }
        }
    },

    /**
     * @memberOf module:dynamicProperties
     */
    gridRenderer: {
        enumerable: true,
        get: function() {
            return this.var.gridRenderer;
        },
        set: function(rendererName) {
            this.var.gridRenderer = rendererName;
            this.grid.renderer.setGridRenderer(rendererName);
        }
    },

    /**
     * @memberOf module:dynamicProperties
     */
    columnIndexes: {
        enumerable: true,
        get: function() {
            return this.grid.behavior.getActiveColumns().map(function(column) {
                return column.index;
            });
        },
        set: function(columnIndexes) {
            this.grid.behavior.setColumnOrder(columnIndexes);
            this.grid.behavior.changed();
        }
    },

    /**
     * @memberOf module:dynamicProperties
     */
    columnNames: {
        enumerable: true,
        get: function() {
            return this.grid.behavior.getActiveColumns().map(function(column) {
                return column.name;
            });
        },
        set: function(columnNames) {
            this.grid.behavior.setColumnOrderByName(columnNames);
            this.grid.behavior.changed();
        }
    },

    /**
     * @memberOf module:dynamicProperties
     */
    rows: {
        enumerable: true,
        get: getRowPropertiesBySubgridAndRowIndex,
        set: function(rowsHash) {
            if (rowsHash) {
                setRowPropertiesBySubgridAndRowIndex.call(this, rowsHash);
                this.grid.behavior.changed();
            }
        }
    },

    /**
     * @memberOf module:dynamicProperties
     */
    columns: {
        enumerable: true,
        get: getColumnPropertiesByColumnIndexOrName,
        set: function(columnsHash) {
            if (columnsHash) {
                setColumnPropertiesByColumnIndexOrName.call(this, columnsHash);
                this.grid.behavior.changed();
            }
        }
    },

    /**
     * @memberOf module:dynamicProperties
     */
    cells: {
        enumerable: true,
        get: getCellPropertiesByColumnNameAndRowIndex,
        set: function(cellsHash) {
            if (cellsHash) {
                setCellPropertiesByColumnNameAndRowIndex.call(this, cellsHash);
                this.grid.behavior.changed();
            }
        }
    },

    /**
     * @memberOf module:dynamicProperties
     */
    rowHeaderCheckboxes: {
        enumerable: true,
        get: function() {
            return this.var.rowHeaderCheckboxes;
        },
        set: function(enabled) {
            this.var.rowHeaderCheckboxes = enabled;
            this.grid.renderer.resetRowHeaderColumnWidth();
        }
    },

    /**
     * @memberOf module:dynamicProperties
     */
    rowHeaderNumbers: {
        enumerable: true,
        get: function() {
            return this.var.rowHeaderNumbers;
        },
        set: function(enabled) {
            this.var.rowHeaderNumbers = enabled;
            this.grid.renderer.resetRowHeaderColumnWidth();
        }
    },

    /**
     * Legacy property; now points to both `rowHeaderFeatures` props.
     * @memberOf module:dynamicProperties
     */
    showRowNumbers: {
        enumerable: false,
        get: function() {
            return this.rowHeaderCheckboxes || this.rowHeaderNumbers;
        },
        set: function(enabled) {
            this.rowHeaderCheckboxes = this.rowHeaderNumbers = enabled;
        }
    },

    // remove to expire warning:
    doubleClickDelay: {
        enumerable: true,
        get: function() {
            return this.var.doubleClickDelay;
        },
        set: function(delay) {
            if (!warnedDoubleClickDelay) {
                warnedDoubleClickDelay = true;
                console.warn('The doubleClickDelay property has been deprecated as of v2.1.0. Setting this property no longer has any effect. Set double-click speed in your system\'s mouse preferences. (This warning will be removed in a future release.)');
            }
            this.var.doubleClickDelay = delay;
        }
    },

    // The following grid line props are now dynamic (as of v2.1.0).
    // They're non-enumerable so they will not be output with `grid.saveState()`.
    // The new (as of 2.1.0) props they refer to are output instead:
    // `gridLinesHColor`, `gridLinesVColor`, `gridLinesHWidth`, and `gridLinesVWidth`
    lineColor: {
        get: function() { return this.gridLinesHColor; },
        set: function(color) { this.gridLinesHColor = this.gridLinesVColor = color; }
    },

    lineWidth: {
        get: function() { return this.gridLinesHWidth; },
        set: function(width) { this.gridLinesHWidth = this.gridLinesVWidth = width; }
    },

    gridBorder: getGridBorderDescriptor(),
    gridBorderLeft: getGridBorderDescriptor('Left'),
    gridBorderRight: getGridBorderDescriptor('Right'),
    gridBorderTop: getGridBorderDescriptor('Top'),
    gridBorderBottom: getGridBorderDescriptor('Bottom')
};

/**
 * @name module:dynamicProperties.columnProperties
 */
dynamicPropertyDescriptors.columnProperties = dynamicPropertyDescriptors.columns;


function getRowPropertiesBySubgridAndRowIndex() { // to be called with grid.properties as context
    var subgrids = {};
    var behavior = this.grid.behavior;
    var defaultRowHeight = this.grid.properties.defaultRowHeight;
    behavior.subgrids.forEach(function(dataModel) {
        var key = dataModel.name || dataModel.type;
        for (var rowIndex = 0, rowCount = dataModel.getRowCount(); rowIndex < rowCount; ++rowIndex) {
            var rowProps = behavior.getRowProperties(rowIndex, undefined, dataModel);
            if (rowProps) {
                // create height mixin by invoking `height` getter
                var height = { height: rowProps.height };
                if (height.height === defaultRowHeight) {
                    height = undefined;
                }

                // clone it and mix in height
                rowProps = Object.assign({}, rowProps, height);

                // only include if at least one defined prop
                if (Object.getOwnPropertyNames(rowProps).find(definedProp)) {
                    var subgrid = subgrids[key] || (subgrids[key] = {});
                    subgrid[rowIndex] = rowProps;
                }
            }
        }
        function definedProp(key) { return rowProps[key] !== undefined; }
    });
    return subgrids;
}

function setRowPropertiesBySubgridAndRowIndex(rowsHash) { // to be called with grid.properties as context
    var behavior = this.grid.behavior,
        methodName = this.settingState ? 'setRowProperties' : 'addRowProperties';

    Object.keys(rowsHash).forEach(function(subgridName) {
        var subgrid = behavior.subgrids.lookup[subgridName];
        if (subgrid) {
            var subgridHash = rowsHash[subgridName];
            Object.keys(subgridHash).forEach(function(rowIndex) {
                var properties = subgridHash[rowIndex];
                behavior[methodName](rowIndex, properties, subgrid);
            });
        }
    });
}

function getColumnPropertiesByColumnIndexOrName() { // to be called with grid.properties as context
    var columns = this.grid.behavior.getColumns(),
        headerify = this.grid.headerify;
    return columns.reduce(function(obj, column) {
        var properties = Object.keys(column.properties).reduce(function(properties, key) {
            switch (key) {
                case 'preferredWidth': // not a public property
                    break;
                case 'header':
                    if (headerify && column.properties.header === headerify(column.properties.name)) {
                        break;
                    }
                    // fallthrough
                default:
                    properties[key] = column.properties[key];
            }
            return properties;
        }, {});
        if (Object.keys(properties).length) {
            obj[column.name] = properties;
        }
        return obj;
    }, {});
}

function setColumnPropertiesByColumnIndexOrName(columnsHash) { // to be called with grid.properties as context
    this.grid.behavior.addAllColumnProperties(columnsHash, this.settingState);
}

function getCellPropertiesByColumnNameAndRowIndex() {
    var behavior = this.grid.behavior,
        columns = behavior.getColumns(),
        subgrids = {};

    behavior.subgrids.forEach(function(dataModel) {
        var key = dataModel.name || dataModel.type;

        for (var rowIndex = 0, rowCount = dataModel.getRowCount(); rowIndex < rowCount; ++rowIndex) {
            columns.forEach(copyCellOwnProperties);
        }

        function copyCellOwnProperties(column) {
            var properties = behavior.getCellOwnProperties(column.index, rowIndex, dataModel);
            if (properties) {
                var subgrid = subgrids[key] = subgrids[key] || {},
                    row = subgrid[rowIndex] = subgrid[rowIndex] = {};
                row[column.name] = Object.assign({}, properties);
            }
        }
    });

    return subgrids;
}

function setCellPropertiesByColumnNameAndRowIndex(cellsHash) { // to be called with grid.properties as context
    var subgrids = this.grid.behavior.subgrids,
        columns = this.grid.behavior.getColumns(),
        methodName = this.settingState ? 'setCellProperties' : 'addCellProperties';

    Object.keys(cellsHash).forEach(function(subgridName) {
        var subgrid = subgrids.lookup[subgridName];
        if (subgrid) {
            var subgridHash = cellsHash[subgridName];
            Object.keys(subgridHash).forEach(function(rowIndex) {
                var columnProps = subgridHash[rowIndex];
                Object.keys(columnProps).forEach(function(columnName) {
                    var properties = columnProps[columnName];
                    if (properties) {
                        var column = columns.find(function(column) {
                            return column.name === columnName;
                        });
                        if (column) {
                            column[methodName](rowIndex, properties, subgrid);
                        }
                    }
                });
            });
        }
    });
}

function getGridBorderDescriptor(edge) {
    var propName = 'gridBorder' + (edge || '');

    return {
        enumerable: true,
        get: function() {
            return this.var[propName];
        },
        set: function(border) {
            this.var[propName] = border;

            if (!edge) {
                this.var.gridBorderLeft = this.var.gridBorderRight = this.var.gridBorderTop = this.var.gridBorderBottom = border;
            }

            this.grid.resetGridBorder(edge);
        }
    };
}

module.exports = dynamicPropertyDescriptors;

},{}],76:[function(require,module,exports){
'use strict';

function HypergridError(message) {
    this.message = message;
}

// extend from `Error`
HypergridError.prototype = Object.create(Error.prototype);

// override error name displayed in console
HypergridError.prototype.name = 'HypergridError';

module.exports = HypergridError;

},{}],77:[function(require,module,exports){
'use strict';

/**
 * @module fields
 */

var Decorator = require('synonomous');

var REGEXP_META_PREFIX = /^__/; // starts with double underscore

var fields = {

    /**
     * Decorate given grid schema with:
     * * Synonym(s) based on `name` property of each element:
     * @param {columnSchema[]} schema
     * @returns {columnSchema[]} The given schema.
     * @memberOf module:fields
     */
    decorateSchema: function(schema) {
        var decorator = new Decorator;

        decorator.decorateArray(schema);

        return schema;
    },

    /**
     * Decorate each element of schema with:
     * * `header` property (when undefined)
     * @param {columnSchema[]} schema
     * @param {string} [headerifierName] - Name of string transformer to use to generate headers (from column names) for those columns without defined headers. If omitted or undefined, no decoration takes place.
     * @returns {columnSchema[]} The given schema.
     * @memberOf module:fields
     */
    decorateColumnSchema: function(schema, headerifierName) {
        var decorator = new Decorator;

        decorator.transformations = {};
        decorator.transformations[headerifierName] = 'header';

        decorator.decorateArray(schema);

        return schema;
    },

    /**
     * @summary Normalizes and returns given schema array.
     * @desc For each "column schema" (element of schema array):
     *
     * 1. Objectify column schemata<br>
     * Ensures each column schema is an object with a `name` property.
     * 2. Index schema schemata<br>
     * Adds an `index` property to each column schema element.
     * 3. Decorates schema<br>
     * Decorates the schema array object itself with column names and column name synonyms. This is helpful for looking up column schema by column name rather than by index. To get the index of a column when you know the name:
     * ```javascript
     * var schema = dataModel.getSchema();
     * var columnName = 'foo';
     * var columnIndex = schema[columnName].index;
     * ```
     * 4. Adds missing headers.
     *
     * This function is safe to call repeatedly.
     *
     * Called via `data-schema-changed` event by data model implementation of `setSchema`.
     *
     * @param {rawColumnSchema[]} schema
     * @returns {columnSchema[]}
     * @memberOf module:fields
     */
    normalizeSchema: function(schema) {
        // Make sure each element of `schema` is an object with a `name` property.
        schema.forEach(function(columnSchema, index) {
            if (typeof columnSchema === 'string') {
                schema[index] = {
                    name: columnSchema
                };
            }
        });

        // Remove all meta data columns from schema
        for (var i = schema.length; i--;) {
            if (REGEXP_META_PREFIX.test(schema[i].name)) {
                schema.splice(i, 1);
            }
        }

        // Set `index` property.
        schema.forEach(function(columnSchema, index) {
            columnSchema.index = index;
        });

        return schema;
    },

    /**
     * @summary Get keys of given hash with "metakeys" filtered out.
     * @desc Metakeys are keys beginning with a double-underscore.
     *
     * DO NOT REMOVE -- Not used in fin-hypergrid/core but has legacy exposure.
     * @param {object} hash
     * @returns {string[]} Member names from `hash` that do _not_ begin with double-underscore.
     * @memberOf module:fields
     */
    getFieldNames: function(hash) {
        return Object.keys(hash || {}).filter(function(fieldName) {
            return !REGEXP_META_PREFIX.test(fieldName);
        });
    },

    /**
     * Used by {@link module:fields.getSchema getSchema}.
     * Override as needed for different titleization flavor.
     * @param {string} key
     * @returns {string} Title version of key (for use as column header).
     * @memberOf module:fields
     */
    titleize: require('synonomous/transformers').toTitle,

    /**
     * @summary Returns a schema derived from given sample data row with "metakeys" filtered out.
     * @desc Metakeys are keys beginning with a double-underscore.
     *
     * DO NOT REMOVE -- Not used in fin-hypergrid/core but has legacy exposure.
     * @param {dataRowObject[]} [data]
     * @returns {columnSchema[]} Array object also decroated with synonyms for elements.
     * @memberOf module:fields
     */
    getSchema: function(data) {
        var dataRow = data && data[0] || {},
            schema = fields.getFieldNames(dataRow);

        fields.normalizeSchema(schema);
        fields.decorateSchema(schema);
        fields.decorateColumnSchema(schema, 'toTitle');

        return schema;
    }
};

module.exports = fields;

},{"synonomous":101,"synonomous/transformers":102}],78:[function(require,module,exports){
/* eslint-env browser */

'use strict';

var API;

function clearFill(x, y, width, height, color) {
    var a = alpha(color);
    if (a < 1) {
        // If background is translucent, we must clear the rect before the fillRect
        // below to prevent mixing with previous frame's render of this cell.
        this.clearRect(x, y, width, height);
    }
    if (a > 0) {
        this.cache.fillStyle = color;
        this.fillRect(x, y, width, height);
    }
}

var ALPHA_REGEX = /^(transparent|((RGB|HSL)A\(.*,\s*([\d\.]+)\)))$/i;
// Tried using an `alphaCache` here but it didn't make a measurable difference.
function alpha(cssColorSpec) {
    var matches, result;

    if (!cssColorSpec) {
        // undefined so not visible; treat as transparent
        result = 0;
    } else if ((matches = cssColorSpec.match(ALPHA_REGEX)) === null) {
        // an opaque color (a color spec with no alpha channel)
        result = 1;
    } else if (matches[4] === undefined) {
        // cssColorSpec must have been 'transparent'
        result = 0;
    } else {
        result = Number(matches[4]);
    }

    return result;
}

var fontMetrics = {};

/**
 * Accumulates width of string in pixels, character by character, by chaching character widths and reusing those values when previously cached.
 *
 * NOTE: There is a minor measuring error when taking the sum of the pixel widths of individual characters that make up a string vs. the pixel width of the string taken as a whole. This is possibly due to kerning or rounding. The error is typically about 0.1%.
 * @memberOf module:defaults
 * @param {CanvasRenderingContext2D} gc
 * @param {string} string - Text to measure.
 * @returns {nubmer} Width of string in pixels.
 */
function getTextWidth(string) {
    var metrics = fontMetrics[this.cache.font] = fontMetrics[this.cache.font] || {};
    string += '';
    for (var i = 0, sum = 0, len = string.length; i < len; ++i) {
        var c = string[i];
        sum += metrics[c] = metrics[c] || this.measureText(c).width;
    }
    return sum;
}

var ELLIPSIS = '\u2026'; // The "…" (dot-dot-dot) character

/**
 * Similar to `getTextWidth` except:
 * 1. Aborts accumulating when sum exceeds given `width`.
 * 2. Returns an object containing both the truncated string and the sum (rather than a number primitive containing the sum alone).
 * @param {CanvasRenderingContext2D} gc
 * @param {string} string - Text to measure.
 * @param {number} width - Width of target cell; overflow point.
 * @param {boolean|null|undefined} truncateTextWithEllipsis - _Per {@link module:defaults.truncateTextWithEllipsis}._
 * @param {boolean} [abort=false] - Abort measuring upon overflow. Returned `width` sum will reflect truncated string rather than untruncated string. Note that returned `string` is truncated in either case.
 * @returns {{string:string,width:number}}
 * * `object.string` - `undefined` if it fits; truncated version of provided `string` if it does not.
 * * `object.width` - Width of provided `string` if it fits; width of truncated string if it does not.
 */
function getTextWidthTruncated(string, width, truncateTextWithEllipsis, abort) {
    var metrics = fontMetrics[this.cache.font],
        truncating = truncateTextWithEllipsis !== undefined,
        truncString, truncWidth, truncAt;

    if (!metrics) {
        metrics = fontMetrics[this.cache.font] = {};
        metrics[ELLIPSIS] = this.measureText(ELLIPSIS).width;
    }

    string += ''; // convert to string
    width += truncateTextWithEllipsis === false ? 2 : -1; // fudge for inequality
    for (var i = 0, sum = 0, len = string.length; i < len; ++i) {
        var char = string[i];
        var charWidth = metrics[char] = metrics[char] || this.measureText(char).width;
        sum += charWidth;
        if (!truncString && truncating && sum > width) {
            truncAt = i;
            switch (truncateTextWithEllipsis) {
                case true: // truncate sufficient characters to fit ellipsis if possible
                    truncWidth = sum - charWidth + metrics[ELLIPSIS];
                    while (truncAt && truncWidth > width) {
                        truncWidth -= metrics[string[--truncAt]];
                    }
                    truncString = truncWidth > width
                        ? '' // not enough room even for ellipsis
                        : truncString = string.substr(0, truncAt) + ELLIPSIS;
                    break;
                case false: // truncate *before* last partially visible character
                    truncString = string.substr(0, truncAt);
                    break;
                default: // truncate *after* partially visible character
                    if (++truncAt < string.length) {
                        truncString = string.substr(0, truncAt);
                    }
            }
            if (abort) { break; }
        }
    }
    return {
        string: truncString,
        width: sum
    };
}

var fontData = {};

/**
 * @memberOf module:defaults
 * @param font
 * @returns {*}
 */
function getTextHeight(font) {
    var result = fontData[font];

    if (!result) {
        result = {};

        var text = document.createElement('span');
        text.textContent = 'Hg';
        text.style.font = font;

        var block = document.createElement('div');
        block.style.display = 'inline-block';
        block.style.width = '1px';
        block.style.height = '0px';

        var div = document.createElement('div');
        div.appendChild(text);
        div.appendChild(block);

        div.style.position = 'absolute';
        document.body.appendChild(div);

        try {

            block.style.verticalAlign = 'baseline';

            var blockRect = block.getBoundingClientRect();
            var textRect = text.getBoundingClientRect();

            result.ascent = blockRect.top - textRect.top;

            block.style.verticalAlign = 'bottom';
            result.height = blockRect.top - textRect.top;

            result.descent = result.height - result.ascent;

        } finally {
            document.body.removeChild(div);
        }
        if (result.height !== 0) {
            fontData[font] = result;
        }
    }

    return result;
}

function clipSave(conditional, x, y, width, height) {
    this.conditionalsStack.push(conditional);
    if (conditional) {
        this.cache.save();
        this.beginPath();
        this.rect(x, y, width, height);
        this.clip();
    }
}

function clipRestore(conditional) {
    if (this.conditionalsStack.pop()) {
        this.cache.restore(); // Remove clip region
    }
}

API = {
    clearFill: clearFill,
    alpha: alpha,
    getTextWidth: getTextWidth,
    getTextWidthTruncated: getTextWidthTruncated,
    getTextHeight: getTextHeight,
    clipSave: clipSave,
    clipRestore: clipRestore,
    truncateTextWithEllipsis: true
};

module.exports = API;

},{}],79:[function(require,module,exports){
'use strict';


/* IMPORTANT NOTE:
 * If any of the modules listed below is removed from Hypergrid, the polyfill(s) they define must be added here!!!
 *
 * 1. object-iterators defines Array.prototype.find
 */


/* eslint-disable no-extend-native */

// https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Math/sign#Polyfill
// (Safari now supports Math.sign but IE still does not as of v11.)
Math.sign = Math.sign = function(x) {
    x = +x; // convert to a number
    if (x === 0 || isNaN(x)) {
        return x;
    }
    return x > 0 ? 1 : -1;
};

// Lite version of: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex#Polyfill
if (typeof Array.prototype.findIndex !== 'function') {
    Array.prototype.findIndex = function(predicate) {
        var context = arguments[1];
        for (var i = 0, len = this.length; i < len; i++) {
            if (predicate.call(context, this[i], i, this)) {
                return i;
            }
        }
        return -1;
    };
}

// Simpler version of: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/fill#Polyfill
if (typeof Array.prototype.fill !== 'function') {
    Array.prototype.fill = function(value, start, end) {
        start = start === undefined ? 0 : start < 0 ? this.length + start : start;
        end = end === undefined ? this.length : end < 0 ? this.length + end : end;
        for (var i = start || 0; i < end; ++i) {
            this[i] = value;
        }
        return this;
    };
}

// Lite version of: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
if (typeof Object.assign !== 'function') {
    Object.assign = function(target) {
        for (var index = 1; index < arguments.length; index++) {
            var source = arguments[index];
            if (source != null) {
                for (var nextKey in source) {
                    if (source.hasOwnProperty(nextKey)) {
                        target[nextKey] = source[nextKey];
                    }
                }
            }
        }
        return target;
    };
}

if (typeof Object.getOwnPropertyDescriptors !== 'function') {
    Object.getOwnPropertyDescriptors = function(object) {
        return Object.getOwnPropertyNames(object).reduce(function(descriptors, key) {
            descriptors[key] = Object.getOwnPropertyDescriptor(object, key);
            return descriptors;
        }, {});
    };
}

},{}],80:[function(require,module,exports){
'use strict';

var HypergridError = require('./error');

/**
 * @param {function|string} string
 * @returns {function}
 * @private
 */
module.exports = function(string) {
    switch (typeof string) {
        case 'undefined':
        case 'function':
            return string;
        case 'string':
            break;
        default:
            throw new HypergridError('Expected string, function, or undefined.');
    }

    var args = string.match(/^function\s*\w*\s*\(([^]*?)\)/);
    if (!args) {
        throw new HypergridError('Expected function keyword with formal parameter list.');
    }
    args = args[1].split(',').map(function(s, i) {
        s = s.match(/\s*(\w*)\s*/); // trim each argument
        if (!s && i) {
            throw new HypergridError('Expected formal parameter.');
        }
        return s[1];
    });

    var body = string.match(/{\s*([^]*?)\s*}\s*$/);
    if (!body) {
        throw new HypergridError('Expected function body.');
    }
    body = body[1];

    if (args.length === 1 && !args[0]) {
        args[0] = body;
    } else {
        args = args.concat(body);
    }

    return Function.apply(null, args);
};

},{"./error":76}],81:[function(require,module,exports){
'use strict';

function bundleColumns(resetCellEvents) {
    var gridProps = this.grid.properties,
        vr, visibleRows = this.visibleRows,
        r, R = visibleRows.length, pool;

    if (resetCellEvents) {
        pool = this.cellEventPool;
        var p = 0;
        this.visibleColumns.forEachWithNeg(function(vc) {
            for (r = 0; r < R; r++, p++) {
                vr = visibleRows[r];
                // reset pool member to reflect coordinates of cell in newly shaped grid
                pool[p].reset(vc, vr);
            }
        });
    }

    var bundle,
        columnBundles = [],
        gridPrefillColor = gridProps.backgroundColor,
        backgroundColor;

    this.visibleColumns.forEachWithNeg(function(vc) {
        backgroundColor = vc.column.properties.backgroundColor;
        if (bundle && bundle.backgroundColor === backgroundColor) {
            bundle.right = vc.right;
        } else if (backgroundColor === gridPrefillColor) {
            bundle = undefined;
        } else {
            bundle = {
                backgroundColor: backgroundColor,
                left: vc.left,
                right: vc.right
            };
            columnBundles.push(bundle);
        }
    });

    this.columnBundles = columnBundles;
}

module.exports = bundleColumns;

},{}],82:[function(require,module,exports){
'use strict';

function bundleRows(resetCellEvents) {
    var gridProps = this.grid.properties,
        vr, visibleRows = this.visibleRows,
        r, R = visibleRows.length,
        p, pool;

    if (resetCellEvents) {
        pool = this.cellEventPool;
        for (p = 0, r = 0; r < R; r++) {
            vr = visibleRows[r];
            this.visibleColumns.forEachWithNeg(function(vc) { // eslint-disable-line no-loop-func
                p++;
                // reset pool member to reflect coordinates of cell in newly shaped grid
                pool[p].reset(vc, vr);
            });
        }
    }

    var bundle, rowBundles = [],
        gridPrefillColor = gridProps.backgroundColor,
        rowStripes = gridProps.rowStripes,
        rowPrefillColors = Array(R),
        stripe, backgroundColor;

    for (r = 0; r < R; r++) {
        vr = visibleRows[r]; // first cell in row r
        stripe = vr.subgrid.isData && rowStripes && rowStripes[vr.rowIndex % rowStripes.length];
        backgroundColor = rowPrefillColors[r] = stripe && stripe.backgroundColor || gridPrefillColor;
        if (bundle && bundle.backgroundColor === backgroundColor) {
            bundle.bottom = vr.bottom;
        } else if (backgroundColor === gridPrefillColor) {
            bundle = undefined;
        } else {
            bundle = {
                backgroundColor: backgroundColor,
                top: vr.top,
                bottom: vr.bottom
            };
            rowBundles.push(bundle);
        }
    }

    this.rowBundles = rowBundles;
    this.rowPrefillColors = rowPrefillColors;
}

module.exports = bundleRows;

},{}],83:[function(require,module,exports){
'use strict';

var paintCellsByColumnsAndRows = require('./by-columns-and-rows');

/** @summary Render the grid only as needed ("partial render").
 * @desc Paints all the cells of a grid, one column at a time, but only as needed.
 *
 * #### On reset
 *
 * Defers to {@link Renderer#paintCellsByColumnsAndRows|paintCellsByColumnsAndRows}, which clears the canvas, draws the grid, and draws the grid lines.
 *
 * #### On the next call (after reset)
 *
 * First, a background rect is drawn using the grid background color.
 *
 * Then, each cell is drawn. If its background differs from the grid background, the background is repainted.
 *
 * `try...catch` surrounds each cell paint in case a cell renderer throws an error.
 * The error message is error-logged to console AND displayed in cell.
 *
 * #### On subsequent calls
 *
 * Iterates through each cell, calling `_paintCell` with `undefined` prefill color. This signifies partial render to the {@link SimpleCell} cell renderer, which only renders the cell when it's text, font, or colors have changed.
 *
 * Each cell to be rendered is described by a {@link CellEvent} object. For performance reasons, to avoid constantly instantiating these objects, we maintain a pool of these. When the grid shape changes, we reset their coordinates by setting {@link CellEvent#reset|reset} on each.
 *
 * See also the discussion of clipping in {@link Renderer#paintCellsByColumns|paintCellsByColumns}.
 * @this {Renderer}
 * @param {CanvasRenderingContext2D} gc
 * @memberOf Renderer.prototype
 */
function paintCellsAsNeeded(gc) {
    var cellEvent,
        visibleColumns = this.visibleColumns,
        visibleRows = this.visibleRows,
        C = visibleColumns.length, cLast = C - 1,
        r, R = visibleRows.length,
        p = 0, pool = this.cellEventPool,
        preferredWidth,
        columnClip,
        // clipToGrid,
        // viewWidth = C ? visibleColumns[cLast].right : 0,
        viewHeight = R ? visibleRows[R - 1].bottom : 0;


    if (!C || !R) { return; }

    if (this.gridRenderer.reset) {
        this.resetAllGridRenderers();
        paintCellsByColumnsAndRows.call(this, gc);
        this.gridRenderer.reset = false;
    }

    // gc.clipSave(clipToGrid, 0, 0, viewWidth, viewHeight);

    // For each column...
    this.visibleColumns.forEachWithNeg(function(vc, c) {
        cellEvent = pool[p]; // first cell in column c
        vc = cellEvent.visibleColumn;

        // Optionally clip to visible portion of column to prevent text from overflowing to right.
        columnClip = vc.column.properties.columnClip;
        gc.clipSave(columnClip || columnClip === null && c === cLast, 0, 0, vc.right, viewHeight);

        // For each row of each subgrid (of each column)...
        for (preferredWidth = r = 0; r < R; r++, p++) {
            cellEvent = pool[p]; // next cell down the column (redundant for first cell in column)

            try {
                preferredWidth = Math.max(preferredWidth, this._paintCell(gc, pool[p]));
            } catch (e) {
                this.renderErrorCell(e, gc, vc, pool[p].visibleRow);
            }
        }

        gc.clipRestore(columnClip);

        cellEvent.column.properties.preferredWidth = Math.round(preferredWidth);
    }.bind(this));

    // gc.clipRestore(clipToGrid);
}

paintCellsAsNeeded.key = 'by-cells';

paintCellsAsNeeded.partial = true; // skip painting selectionRegionOverlayColor

module.exports = paintCellsAsNeeded;

},{"./by-columns-and-rows":84}],84:[function(require,module,exports){
'use strict';

var bundleColumns = require('./bundle-columns');
var bundleRows = require('./bundle-rows');

/** @summary Render the grid with consolidated row OR column rects.
 * @desc Paints all the cells of a grid, one column at a time.
 *
 * First, a background rect is drawn using the grid background color.
 *
 * Then, if there are any rows with their own background color _that differs from the grid background color,_ these are consolidated and the consolidated groups of row backgrounds are all drawn before iterating through cells. These row backgrounds get priority over column backgrounds.
 *
 * If there are no such row background rects to draw, the column rects are consolidated and drawn instead (again, before the cells). Note that these column rects are _not_ suitable for clipping overflow text from previous columns. If you have overflow text, either turn on clipping (big performance hit) or turn on one of the `truncateTextWithEllipsis` options.
 *
 * `try...catch` surrounds each cell paint in case a cell renderer throws an error.
 * The error message is error-logged to console AND displayed in cell.
 *
 * Each cell to be rendered is described by a {@link CellEvent} object. For performance reasons, to avoid constantly instantiating these objects, we maintain a pool of these. When the grid shape changes, we reset their coordinates by setting {@link CellEvent#reset|reset} on each.
 *
 * See also the discussion of clipping in {@link Renderer#paintCellsByColumns|paintCellsByColumns}.
 * @this {Renderer}
 * @param {CanvasRenderingContext2D} gc
 * @memberOf Renderer.prototype
 */
function paintCellsByColumnsAndRows(gc) {
    var grid = this.grid,
        gridProps = grid.properties,
        prefillColor, rowPrefillColors, gridPrefillColor = gridProps.backgroundColor,
        cellEvent,
        rowBundle, rowBundles,
        columnBundle, columnBundles,
        visibleColumns = this.visibleColumns,
        visibleRows = this.visibleRows,
        c, C = visibleColumns.length,
        cLast = C - 1,
        r, R = visibleRows.length,
        pool = this.cellEventPool,
        preferredWidth,
        columnClip,
        // clipToGrid,
        viewWidth = C ? visibleColumns[C - 1].right : 0,
        viewHeight = R ? visibleRows[R - 1].bottom : 0;

    gc.clearRect(0, 0, this.bounds.width, this.bounds.height);

    if (!C || !R) { return; }

    if (gc.alpha(gridPrefillColor) > 0) {
        gc.cache.fillStyle = gridPrefillColor;
        gc.fillRect(0, 0, viewWidth, viewHeight);
    }

    if (this.gridRenderer.reset) {
        this.resetAllGridRenderers();
        this.gridRenderer.reset = false;
        bundleRows.call(this, false);
        bundleColumns.call(this, true);
    } else if (this.gridRenderer.rebundle) {
        this.gridRenderer.rebundle = false;
        bundleColumns.call(this);
    }

    rowBundles = this.rowBundles;
    if (rowBundles.length) {
        rowPrefillColors = this.rowPrefillColors;
        for (r = rowBundles.length; r--;) {
            rowBundle = rowBundles[r];
            gc.clearFill(0, rowBundle.top, viewWidth, rowBundle.bottom - rowBundle.top, rowBundle.backgroundColor);
        }
    } else {
        for (columnBundles = this.columnBundles, c = columnBundles.length; c--;) {
            columnBundle = columnBundles[c];
            gc.clearFill(columnBundle.left, 0, columnBundle.right - columnBundle.left, viewHeight, columnBundle.backgroundColor);
        }
    }

    // gc.clipSave(clipToGrid, 0, 0, viewWidth, viewHeight);

    // For each column...
    var p = 0;
    this.visibleColumns.forEachWithNeg(function(vc, c) {

        cellEvent = pool[p];
        vc = cellEvent.visibleColumn;

        if (!rowPrefillColors) {
            prefillColor = cellEvent.column.properties.backgroundColor;
        }

        // Optionally clip to visible portion of column to prevent text from overflowing to right.
        columnClip = vc.column.properties.columnClip;
        gc.clipSave(columnClip || columnClip === null && c === cLast, 0, 0, vc.right, viewHeight);

        // For each row of each subgrid (of each column)...
        for (preferredWidth = r = 0; r < R; r++, p++) {
            // if (!pool[p].disabled) {
                if (rowPrefillColors) {
                    prefillColor = rowPrefillColors[r];
                }

                try {
                    preferredWidth = Math.max(preferredWidth, this._paintCell(gc, pool[p], prefillColor));
                } catch (e) {
                    this.renderErrorCell(e, gc, vc, pool[p].visibleRow);
                }
            // }
        }

        gc.clipRestore(columnClip);

        cellEvent.column.properties.preferredWidth = Math.round(preferredWidth);
    }.bind(this));

    // gc.clipRestore(clipToGrid);

    this.paintGridlines(gc);
}

paintCellsByColumnsAndRows.key = 'by-columns-and-rows';
paintCellsByColumnsAndRows.rebundle = true; // see rebundleGridRenderers

module.exports = paintCellsByColumnsAndRows;

},{"./bundle-columns":81,"./bundle-rows":82}],85:[function(require,module,exports){
'use strict';

var bundleColumns = require('./bundle-columns');

/** @summary Render the grid with discrete column rects.
 * @desc Paints all the cells of a grid, one column at a time.
 *
 * In this grid renderer, a background rect is _not_ drawn using the grid background color.
 *
 * Rather, all columns paint their own background rects, with color defaulting to grid background color.
 *
 * The idea of painting each column rect is to "clip" text that might have overflowed from the previous column by painting over it with the background from this column. Only the last column will show overflowing text, and only if the canvas width exceeds the grid width. If this is the case, you can turn on clipping for the last column only by setting `columnClip` to `true` for the last column.
 *
 * NOTE: As a convenience feature, setting `columnClip` to `null` will clip only the last column, so simply setting it on the grid (rather than the last column) will have the same effect. This is much more convenient because you don't have to worry about the last column being redefined (moved, hidden, etc).
 *
 * `try...catch` surrounds each cell paint in case a cell renderer throws an error.
 * The error message is error-logged to console AND displayed in cell.
 *
 * Each cell to be rendered is described by a {@link CellEvent} object. For performance reasons, to avoid constantly instantiating these objects, we maintain a pool of these. When the grid shape changes, we reset their coordinates by setting {@link CellEvent#reset|reset} on each.
 *
 * See also the discussion of clipping in {@link Renderer#paintCellsByColumnsDiscrete|paintCellsByColumnsDiscrete}.

 * @this {Renderer}
 * @param {CanvasRenderingContext2D} gc
 * @memberOf Renderer.prototype
 */
function paintCellsByColumnsDiscrete(gc) {
    var prefillColor,
        cellEvent,
        visibleColumns = this.visibleColumns,
        visibleRows = this.visibleRows,
        C = visibleColumns.length, cLast = C - 1,
        r, R = visibleRows.length,
        pool = this.cellEventPool,
        preferredWidth,
        columnClip,
        // clipToGrid,
        // viewWidth = C ? visibleColumns[C - 1].right : 0,
        viewHeight = R ? visibleRows[R - 1].bottom : 0;

    gc.clearRect(0, 0, this.bounds.width, this.bounds.height);

    if (!C || !R) { return; }

    if (this.gridRenderer.reset) {
        this.resetAllGridRenderers(['by-columns']);
        this.gridRenderer.reset = false;
        bundleColumns.call(this, true);
    }

    // gc.clipSave(clipToGrid, 0, 0, viewWidth, viewHeight);

    // For each column...
    var p = 0;
    this.visibleColumns.forEachWithNeg(function(vc, c) {
        cellEvent = pool[p]; // first cell in column c
        vc = cellEvent.visibleColumn;

        prefillColor = cellEvent.column.properties.backgroundColor;
        gc.clearFill(vc.left, 0, vc.width, viewHeight, prefillColor);

        // Optionally clip to visible portion of column to prevent text from overflowing to right.
        columnClip = vc.column.properties.columnClip;
        gc.clipSave(columnClip || columnClip === null && c === cLast, 0, 0, vc.right, viewHeight);

        // For each row of each subgrid (of each column)...
        for (preferredWidth = r = 0; r < R; r++, p++) {
            cellEvent = pool[p]; // next cell down the column (redundant for first cell in column)

            try {
                preferredWidth = Math.max(preferredWidth, this._paintCell(gc, cellEvent, prefillColor));
            } catch (e) {
                this.renderErrorCell(e, gc, vc, cellEvent.visibleRow);
            }
        }

        gc.clipRestore(columnClip);

        cellEvent.column.properties.preferredWidth = Math.round(preferredWidth);
    }.bind(this));

    // gc.clipRestore(clipToGrid);

    this.paintGridlines(gc);
}

paintCellsByColumnsDiscrete.key = 'by-columns-discrete';

module.exports = paintCellsByColumnsDiscrete;

},{"./bundle-columns":81}],86:[function(require,module,exports){
'use strict';

var bundleColumns = require('./bundle-columns');

/** @summary Render the grid with consolidated column rects.
 * @desc Paints all the cells of a grid, one column at a time.
 *
 * First, a background rect is drawn using the grid background color.
 *
 * Then, if there are any columns with their own background color _that differs from the grid background color,_ these are consolidated and the consolidated groups of column backgrounds are all drawn before iterating through cells. Note that these column rects are _not_ suitable for clipping overflow text from previous columns. If you have overflow text, either turn on clipping (big performance hit) or turn on one of the `truncateTextWithEllipsis` options.
 *
 * `try...catch` surrounds each cell paint in case a cell renderer throws an error.
 * The error message is error-logged to console AND displayed in cell.
 *
 * Each cell to be rendered is described by a {@link CellEvent} object. For performance reasons, to avoid constantly instantiating these objects, we maintain a pool of these. When the grid shape changes, we reset their coordinates by setting {@link CellEvent#reset|reset} on each.
 *
 * **Regading clipping.** The reason for clipping is to prevent text from overflowing into the next column. However there is a serious performance cost.
 *
 * For performance reasons {@link Renderer#_paintCell|_paintCell} does not set up a clipping region for each cell. However, iff grid property `columnClip` is truthy, this grid renderer will set up a clipping region to prevent text overflow to right. If `columnClip` is `null`, a clipping region will only be set up on the last column. Otherwise, there will be no clipping region.
 *
 * The idea of clipping just the last column is because in addition to the optional graphics clipping, we also clip ("truncate") text. Text can be truncated conservatively so it will never overflow. The problem with this is that characters vanish as they hit the right cell boundary, which may or may be obvious depending on font size. Alternatively, text can be truncated so that the overflow will be a maximum of 1 character. This allows partial characters to be rendered. But this is where graphics clipping is required.
 *
 * When renderering column by column as this particular renderer does, _and_ when the background color _of the next cell to the right_ is opaque (alpha = 1), clipping can be turned off because each column will _overpaint_ any text that overflowed from the one before. However, any text that overflows the last column will paint into unused canvas region to the right of the grid. This is the _raison d'être_ for "clip last column only" option mentioned above (when `columnClip` is set to `null`). To avoid even this performance cost (of clipping just the last column), column widths can be set to fill the available canvas.
 *
 * Note that text never overflows to left because text starting point is never < 0. The reason we don't clip to the left is for cell renderers that need to re-render to the left to produce a merged cell effect, such as grouped column header.

 * @this {Renderer}
 * @param {CanvasRenderingContext2D} gc
 * @memberOf Renderer.prototype
 */
function paintCellsByColumns(gc) {
    var grid = this.grid,
        gridProps = grid.properties,
        prefillColor, gridPrefillColor = gridProps.backgroundColor,
        cellEvent,
        columnBundle, columnBundles,
        visibleColumns = this.visibleColumns,
        visibleRows = this.visibleRows,
        c, C = visibleColumns.length, cLast = C - 1,
        r, R = visibleRows.length,
        pool = this.cellEventPool,
        preferredWidth,
        columnClip,
        // clipToGrid,
        viewWidth = C ? visibleColumns[cLast].right : 0,
        viewHeight = R ? visibleRows[R - 1].bottom : 0;


    gc.clearRect(0, 0, this.bounds.width, this.bounds.height);

    if (!C || !R) { return; }

    if (gc.alpha(gridPrefillColor) > 0) {
        gc.cache.fillStyle = gridPrefillColor;
        gc.fillRect(0, 0, viewWidth, viewHeight);
    }

    if (this.gridRenderer.reset) {
        this.resetAllGridRenderers(['by-columns-discrete']);
        this.gridRenderer.reset = false;
        bundleColumns.call(this, true);
    } else if (this.gridRenderer.rebundle) {
        this.gridRenderer.rebundle = false;
        bundleColumns.call(this);
    }

    for (columnBundles = this.columnBundles, c = columnBundles.length; c--;) {
        columnBundle = columnBundles[c];
        gc.clearFill(columnBundle.left, 0, columnBundle.right - columnBundle.left, viewHeight, columnBundle.backgroundColor);
    }

    // gc.clipSave(clipToGrid, 0, 0, viewWidth, viewHeight);

    // For each column...
    var p = 0;
    this.visibleColumns.forEachWithNeg(function(vc, c) {
        cellEvent = pool[p]; // first cell in column c
        vc = cellEvent.visibleColumn;

        prefillColor = cellEvent.column.properties.backgroundColor;

        // Optionally clip to visible portion of column to prevent text from overflowing to right.
        columnClip = vc.column.properties.columnClip;
        gc.clipSave(columnClip || columnClip === null && c === cLast, 0, 0, vc.right, viewHeight);

        // For each row of each subgrid (of each column)...
        for (preferredWidth = r = 0; r < R; r++, p++) {
            cellEvent = pool[p]; // next cell down the column (redundant for first cell in column)

            try {
                preferredWidth = Math.max(preferredWidth, this._paintCell(gc, cellEvent, prefillColor));
            } catch (e) {
                this.renderErrorCell(e, gc, vc, cellEvent.visibleRow);
            }
        }

        gc.clipRestore(columnClip);

        cellEvent.column.properties.preferredWidth = Math.round(preferredWidth);
    }.bind(this));

    // gc.clipRestore(clipToGrid);

    this.paintGridlines(gc);
}

paintCellsByColumns.key = 'by-columns';
paintCellsByColumns.rebundle = true; // see rebundleGridRenderers

module.exports = paintCellsByColumns;

},{"./bundle-columns":81}],87:[function(require,module,exports){
'use strict';

var bundleRows = require('./bundle-rows');

/** @summary Render the grid.
 * @desc _**NOTE:** This grid renderer is not as performant as the others and it's use is not recommended if you care about performance. The reasons for the wanting performance are unclear, possibly having to do with the way Chrome optimizes access to the column objects?_
 *
 * Paints all the cells of a grid, one row at a time.
 *
 * First, a background rect is drawn using the grid background color.
 *
 * Then, if there are any rows with their own background color _that differs from the grid background color,_ these are consolidated and the consolidated groups of row backgrounds are all drawn before iterating through cells.
 *
 * `try...catch` surrounds each cell paint in case a cell renderer throws an error.
 * The error message is error-logged to console AND displayed in cell.
 *
 * Each cell to be rendered is described by a {@link CellEvent} object. For performance reasons, to avoid constantly instantiating these objects, we maintain a pool of these. When the grid shape changes, we reset their coordinates by setting {@link CellEvent#reset|reset} on each.
 *
 * See also the discussion of clipping in {@link Renderer#paintCellsByColumns|paintCellsByColumns}.
 * @this {Renderer}
 * @param {CanvasRenderingContext2D} gc
 * @memberOf Renderer.prototype
 */
function paintCellsByRows(gc) {
    var grid = this.grid,
        gridProps = grid.properties,
        prefillColor, rowPrefillColors, gridPrefillColor = gridProps.backgroundColor,
        cellEvent,
        rowBundle, rowBundles = this.rowBundles,
        visibleColumns = this.visibleColumns,
        vr, visibleRows = this.visibleRows,
        c, C = visibleColumns.length, c0 = 0, cLast = C - 1,
        r, R = visibleRows.length,
        p, pool = this.cellEventPool,
        preferredWidth = Array(C - c0).fill(0),
        columnClip,
        // clipToGrid,
        viewWidth = C ? visibleColumns[C - 1].right : 0,
        viewHeight = R ? visibleRows[R - 1].bottom : 0,
        drawLines = gridProps.gridLinesH,
        lineWidth = gridProps.gridLinesHWidth,
        lineColor = gridProps.gridLinesHColor;

    gc.clearRect(0, 0, this.bounds.width, this.bounds.height);

    if (!C || !R) { return; }

    if (gc.alpha(gridPrefillColor) > 0) {
        gc.cache.fillStyle = gridPrefillColor;
        gc.fillRect(0, 0, viewWidth, viewHeight);
    }

    if (this.gridRenderer.reset) {
        this.resetAllGridRenderers();
        this.gridRenderer.reset = false;
        bundleRows.call(this, true);
    }

    rowPrefillColors = this.rowPrefillColors;

    for (r = rowBundles.length; r--;) {
        rowBundle = rowBundles[r];
        gc.clearFill(0, rowBundle.top, viewWidth, rowBundle.bottom - rowBundle.top, rowBundle.backgroundColor);
    }

    // gc.clipSave(clipToGrid, 0, 0, viewWidth, viewHeight);

    // For each row of each subgrid...
    for (p = 0, r = 0; r < R; r++) {
        prefillColor = rowPrefillColors[r];

        if (drawLines) {
            gc.cache.fillStyle = lineColor;
            gc.fillRect(0, pool[p].visibleRow.bottom, viewWidth, lineWidth);
        }

        // For each column (of each row)...
        this.visibleColumns.forEachWithNeg(function(vc) {  // eslint-disable-line no-loop-func
            p++;
            cellEvent = pool[p]; // next cell across the row (redundant for first cell in row)
            vc = cellEvent.visibleColumn;

            // Optionally clip to visible portion of column to prevent text from overflowing to right.
            columnClip = vc.column.properties.columnClip;
            gc.clipSave(columnClip || columnClip === null && c === cLast, 0, 0, vc.right, viewHeight);

            try {
                preferredWidth[c] = Math.max(preferredWidth[c], this._paintCell(gc, cellEvent, prefillColor));
            } catch (e) {
                this.renderErrorCell(e, gc, vc, vr);
            }

            gc.clipRestore(columnClip);
        }.bind(this));
    }

    // gc.clipRestore(clipToGrid);

    this.paintGridlines(gc);

    this.visibleColumns.forEachWithNeg(function(vc, c) {
        vc.column.properties.preferredWidth = Math.round(preferredWidth[c]);
    });
}

paintCellsByRows.key = 'by-rows';

module.exports = paintCellsByRows;

},{"./bundle-rows":82}],88:[function(require,module,exports){
/* eslint-env browser */
/* global requestAnimationFrame */

'use strict';

var Base = require('../Base');
var images = require('../../images');
var layerProps = require('./layer-props');


var visibleColumnPropertiesDescriptorFn = function(grid) {
    return {
        findWithNeg: {
            // Like the Array.prototype version except searches the negative indexes as well.
            value: function(iteratee, context) {
                for (var i = grid.behavior.leftMostColIndex; i < 0; i++) {
                    if (!this[i]) {
                        continue;
                    }
                    if (iteratee.call(context, this[i], i, this)) {
                        return this[i];
                    }
                }
                return Array.prototype.find.call(this, iteratee, context);
            }
        },
        forEachWithNeg: {
            // Like the Array.prototype version except it iterates the negative indexes as well.
            value: function(iteratee, context) {
                for (var i = grid.behavior.leftMostColIndex; i < 0; i++) {
                    if (!this[i]) {
                        continue;
                    }
                    iteratee.call(context, this[i], i, this);
                }
                return Array.prototype.forEach.call(this, iteratee, context);
            }

        },

        totalLength: {
            get: function() {
                return Math.abs(grid.behavior.leftMostColIndex) + this.length;
            }
        }
    };
};


/**
 * @summary List of grid renderers available to new grid instances.
 * @desc Developer may augment this list with additional grid renderers before grid instantiation by calling @link {Renderer.registerGridRenderer}.
 * @memberOf Renderer~
 * @private
 * @type {function[]}
 */
var paintCellsFunctions = [];


/** @typedef {object} CanvasRenderingContext2D
 * @see [CanvasRenderingContext2D](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D)
 */

/** @typedef {object} visibleColumnArray
 * @property {number} index - A back reference to the element's array index in {@link Renderer#visibleColumns}.
 * @property {number} columnIndex - Dereferences {@link Behavior#columns}, the subset of _active_ columns, specifying which column to show in that position.
 * @property {number} left - Pixel coordinate of the left edge of this column, rounded to nearest integer.
 * @property {number} right - Pixel coordinate of the right edge of this column, rounded to nearest integer.
 * @property {number} width - Width of this column in pixels, rounded to nearest integer.
 */

/** @typedef {object} visibleRowArray
 * @property {number} index - A back reference to the element's array index in {@link Renderer#visibleRows}.
 * @property {number} rowIndex - Local vertical row coordinate within the subgrid to which the row belongs, adjusted for scrolling.
 * @property {dataModelAPI} subgrid - A reference to the subgrid to which the row belongs.
 * @property {number} top - Pixel coordinate of the top edge of this row, rounded to nearest integer.
 * @property {number} bottom - Pixel coordinate of the bottom edge of this row, rounded to nearest integer.
 * @property {number} height - Height of this row in pixels, rounded to nearest integer.
 */

/**
 * @constructor
 * @desc fin-hypergrid-renderer is the canvas enabled top level sub component that handles the renderering of the Grid.
 *
 * It relies on two other external subprojects
 *
 * 1. fin-canvas: a wrapper to provide a simpler interface to the HTML5 canvas component
 * 2. rectangular: a small npm module providing Point and Rectangle objects
 *
 * The fin-hypergrid-renderer is in a unique position to provide critical functionality to the fin-hypergrid in a hightly performant manner.
 * Because it MUST iterate over all the visible cells it can store various bits of information that can be encapsulated as a service for consumption by the fin-hypergrid component.
 *
 * Instances of this object have basically four main functions.
 *
 * 1. render fixed row headers
 * 2. render fixed col headers
 * 3. render main data cells
 * 4. render grid lines
 *
 * Same parameters as {@link Renderer#initialize|initialize}, which is called by this constructor.
 *
 */
var Renderer = Base.extend('Renderer', {

    //the shared single item "pooled" cell object for drawing each cell
    cell: {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    },

    scrollHeight: 0,

    viewHeight: 0,

    reset: function() {
        this.bounds = {
            width: 0,
            height: 0
        };

        /**
         * Represents the ordered set of visible columns. Array size is always the exact number of visible columns, the last of which may only be partially visible.
         *
         * This sequence of elements' `columnIndex` values assumes one of three patterns. Which pattern is base on the following two questions:
         * * Are there "fixed" columns on the left?
         * * Is the grid horizontally scrolled?
         *
         * The set of `columnIndex` values consists of:
         * 1. The first element will be -1 if the row handle column is being rendered.
         * 2. A zero-based list of consecutive of integers representing the fixed columns (if any).
         * 3. An n-based list of consecutive of integers representing the scrollable columns (where n = number of fixed columns + the number of columns scrolled off to the left).
         * @type {visibleColumnArray}
         */
        this.visibleColumns = Object.defineProperties([], visibleColumnPropertiesDescriptorFn(this.grid));

        /**
         * Represents the ordered set of visible rows. Array size is always the exact number of visible rows.
         *
         * The sequence of elements' `rowIndex` values is local to each subgrid.
         * * **For each non-scrollable subgrid:** The sequence is a zero-based list of consecutive integers.
         * * **For the scrollable subgrid:**
         *   1. A zero-based list of consecutive of integers representing the fixed rows (if any).
         *   2. An n-based list of consecutive of integers representing the scrollable rows (where n = number of fixed rows + the number of rows scrolled off the top).
         *
         * Note that non-scrollable subgrids can come both before _and_ after the scrollable subgrid.
         * @type {visibleRowArray}
         */
        this.visibleRows = [];

        this.insertionBounds = [];

        this.cellEventPool = [];
    },

    /**
     * @summary Constructor logic
     * @desc This method will be called upon instantiation of this class or of any class that extends from this class.
     * > All `initialize()` methods in the inheritance chain are called, in turn, each with the same parameters that were passed to the constructor, beginning with that of the most "senior" class through that of the class of the new instance.
     * @memberOf Renderer.prototype
     */
    initialize: function(grid) {
        this.grid = grid;

        this.gridRenderers = {};
        paintCellsFunctions.forEach(function(paintCellsFunction) {
            this.registerGridRenderer(paintCellsFunction);
        }, this);

        // typically grid properties won't exist yet
        this.setGridRenderer(this.properties.gridRenderer || 'by-columns-and-rows');

        this.reset();
    },

    registerGridRenderer: function(paintCellsFunction) {
        this.gridRenderers[paintCellsFunction.key] = {
            paintCells: paintCellsFunction
        };
    },

    setGridRenderer: function(key) {
        var gridRenderer = this.gridRenderers[key];

        if (!gridRenderer) {
            throw new this.HypergridError('Unregistered grid renderer "' + key + '"');
        }

        if (gridRenderer !== this.gridRenderer) {
            this.gridRenderer = gridRenderer;
            this.gridRenderer.reset = true;
        }
    },

    resetAllGridRenderers: function(blackList) {
        // Notify renderers that grid shape has changed
        Object.keys(this.gridRenderers).forEach(function(key) {
            this.gridRenderers[key].reset = !blackList || blackList.indexOf(key) < 0;
        }, this);
    },

    /**
     * Certain renderers that pre-bundle column rects based on columns' background colors need to re-bundle when columns' background colors change. This method sets the `rebundle` property to `true` for those renderers that have that property.
     */
    rebundleGridRenderers: function() {
        Object.keys(this.gridRenderers).forEach(function(key) {
            if (this.gridRenderers[key].paintCells.rebundle) {
                this.gridRenderers[key].rebundle = true;
            }
        }, this);
    },

    resetRowHeaderColumnWidth: function() {
        this.lastKnowRowCount = undefined;
    },

    computeCellsBounds: function() {
        this.needsComputeCellsBounds = true;
    },

    /**
     * CAUTION: Keep in place! Used by {@link Canvas}.
     * @memberOf Renderer.prototype
     * @returns {Object} The current grid properties object.
     */
    get properties() {
        return this.grid.properties;
    },

    /**
     * @memberOf Renderer.prototype
     * @summary Notify the fin-hypergrid every time we've repainted.
     * @desc This is the entry point from fin-canvas.
     * @param {CanvasRenderingContext2D} gc
     */
    paint: function(gc) {
        if (this.grid.canvas) {
            this.renderGrid(gc);
            this.grid.gridRenderedNotification();
        }
    },

    tickNotification: function() {
        this.grid.tickNotification();
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} Answer how many rows we rendered
     */
    getVisibleRowsCount: function() {
        return this.visibleRows.length - 1;
    },

    getVisibleScrollHeight: function() {
        return this.viewHeight - this.grid.getFixedRowsHeight();
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} Number of columns we just rendered.
     */
    getVisibleColumnsCount: function() {
        return this.visibleColumns.length - 1;
    },

    /**
     * @memberOf Renderer.prototype
     * @param {CellEvent|number} x - CellEvent object or grid column coordinate.
     * @param {number} [y] - Grid row coordinate. Omit if `xOrCellEvent` is a CellEvent.
     * @returns {Rectangle} Bounding rect of cell with the given coordinates.
     */
    getBoundsOfCell: function(x, y) {
        var vc = this.visibleColumns[x],
            vr = this.visibleRows[y];

        return {
            x: vc.left,
            y: vr.top,
            width: vc.width,
            height: vr.height
        };
    },

    /**
     * @memberOf Renderer.prototype
     * @desc answer the column index under the coordinate at pixelX
     * @param {number} pixelX - The horizontal coordinate.
     * @returns {number} The column index under the coordinate at pixelX.
     */
    getColumnFromPixelX: function(pixelX) {
        var width = 0,
            fixedColumnCount = this.grid.getFixedColumnCount(),
            scrollLeft = this.grid.getHScrollValue(),
            visibleColumns = this.visibleColumns;

        for (var c = 1; c < visibleColumns.length - 1; c++) {
            width = visibleColumns[c].left - (visibleColumns[c].left - visibleColumns[c - 1].left) / 2;
            if (pixelX < width) {
                if (c > fixedColumnCount) {
                    c += scrollLeft;
                }
                return c - 1;
            }
        }
        if (c > fixedColumnCount) {
            c += scrollLeft;
        }
        return c - 1;
    },


    /**
     * @memberOf Renderer.prototype
     * @desc Answer specific data cell coordinates given mouse coordinates in pixels.
     * @param {Point} point
     * @returns {Point} Cell coordinates
     */
    getGridCellFromMousePoint: function(point) {

        var x = point.x,
            y = point.y,
            isPseudoRow = false,
            isPseudoCol = false,
            vrs = this.visibleRows,
            vcs = this.visibleColumns,
            firstColumn = vcs[this.grid.behavior.leftMostColIndex],
            inFirstColumn = x < firstColumn.right,
            vc = inFirstColumn ? firstColumn : vcs.findWithNeg(function(vc) { return x < vc.right; }),
            vr = vrs.find(function(vr) { return y < vr.bottom; }),
            result = {fake: false};

        //default to last row and col
        if (vr) {
            isPseudoRow = false;
        } else {
            vr = vrs[vrs.length - 1];
            isPseudoRow = true;
        }

        if (vc) {
            isPseudoCol = false;
        } else {
            vc = vcs[vcs.length - 1];
            isPseudoCol = true;
        }

        var mousePoint = this.grid.newPoint(x - vc.left, y - vr.top),
            cellEvent = new this.grid.behavior.CellEvent(vc.columnIndex, vr.index);

        // cellEvent.visibleColumn = vc;
        // cellEvent.visibleRow = vr;

        result.cellEvent = Object.defineProperty(cellEvent, 'mousePoint', {value: mousePoint});

        if (isPseudoCol || isPseudoRow) {
            result.fake = true;
            this.grid.beCursor(null);
        }

        return result;
    },

    /**
     * Matrix of unformatted values of visible cells.
     * @returns {Array<Array>}
     */
    getVisibleCellMatrix: function() {
        var rows = Array(this.visibleRows.length);
        var adjust = this.grid.behavior.hasTreeColumn() ? 1 : 0;
        for (var y = 0; y < rows.length; ++y) { rows[y] = Array(this.visibleColumns.length); }
        this.cellEventPool.map(function(cell) {
            var x = cell.gridCell.x + adjust;
            if (x >= 0) {
                rows[cell.gridCell.y][x] = cell.value;
            }
        });
        return rows;
    },

    /**
     * @summary Get the visibility of the column matching the provided grid column index.
     * @desc Requested column may not be visible due to being scrolled out of view.
     * @memberOf Renderer.prototype
     * @summary Determines if a column is visible.
     * @param {number} columnIndex - the column index
     * @returns {boolean} The given column is visible.
     */
    isColumnVisible: function(columnIndex) {
        return !!this.getVisibleColumn(columnIndex);
    },

    /**
     * @summary Get the "visible column" object matching the provided grid column index.
     * @desc Requested column may not be visible due to being scrolled out of view.
     * @memberOf Renderer.prototype
     * @summary Find a visible column object.
     * @param {number} columnIndex - The grid column index.
     * @returns {object|undefined} The given column if visible or `undefined` if not.
     */
    getVisibleColumn: function(columnIndex) {
        return this.visibleColumns.findWithNeg(function(vc) {
            return vc.columnIndex === columnIndex;
        });
    },

    /**
     * @desc Calculate the minimum left column index so the target column shows up in viewport (we need to be aware of viewport's width, number of fixed columns and each column's width)
     * @param {number} targetColIdx - Target column index
     * @returns {number} Minimum left column index so target column shows up
     */
    getMinimumLeftPositionToShowColumn: function(targetColIdx) {
        var fixedColumnCount = this.grid.getFixedColumnCount();
        var fixedColumnsWidth = 0;
        var rowNumbersWidth = 0;
        var filtersWidth = 0;
        var viewportWidth = 0;
        var leftColIdx = 0;
        var targetRight = 0;
        var lastFixedColumn = null;
        var computedCols = [];
        var col = null;
        var i = 0;
        var left = 0;
        var right = 0;


        // 1) for each column, we'll compute left and right position in pixels (until target column)
        for (i = 0; i <= targetColIdx; i++) {
            left = right;
            right += Math.ceil(this.grid.getColumnWidth(i));

            computedCols.push({
                left: left,
                right: right
            });
        }

        targetRight = computedCols[computedCols.length - 1].right;

        // 2) calc usable viewport width
        lastFixedColumn = computedCols[fixedColumnCount - 1];

        if (this.properties.showRowNumbers) {
            rowNumbersWidth = this.grid.getColumnWidth(this.grid.behavior.rowColumnIndex);
        }

        if (this.grid.hasTreeColumn()) {
            filtersWidth = this.grid.getColumnWidth(this.grid.behavior.treeColumnIndex);
        }

        fixedColumnsWidth = lastFixedColumn ? lastFixedColumn.right : 0;
        viewportWidth = this.getBounds().width - fixedColumnsWidth - rowNumbersWidth - filtersWidth;

        // 3) from right to left, find the last column that can still render target column
        i = targetColIdx;

        do {
            leftColIdx = i;
            col = computedCols[i];
            i--;
        } while (col.left + viewportWidth > targetRight && i >= 0);

        return leftColIdx;
    },

    /**
     * @summary Get the visibility of the column matching the provided data column index.
     * @desc Requested column may not be visible due to being scrolled out of view or if the column is inactive.
     * @memberOf Renderer.prototype
     * @summary Determines if a column is visible.
     * @param {number} columnIndex - the column index
     * @returns {boolean} The given column is visible.
     */
    isDataColumnVisible: function(columnIndex) {
        return !!this.getVisibleDataColumn(columnIndex);
    },

    /**
     * @summary Get the "visible column" object matching the provided data column index.
     * @desc Requested column may not be visible due to being scrolled out of view or if the column is inactive.
     * @memberOf Renderer.prototype
     * @summary Find a visible column object.
     * @param {number} columnIndex - The grid column index.
     * @returns {object|undefined} The given column if visible or `undefined` if not.
     */
    getVisibleDataColumn: function(columnIndex) {
        return this.visibleColumns.findWithNeg(function(vc) {
            return vc.column.index === columnIndex;
        });
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The width x coordinate of the last rendered column
     */
    getFinalVisibleColumnBoundary: function() {
        var chop = this.isLastColumnVisible() ? 2 : 1;
        var colWall = this.visibleColumns[this.visibleColumns.length - chop].right;
        return Math.min(colWall, this.getBounds().width);
    },

    /**
     * @summary Get the visibility of the row matching the provided grid row index.
     * @desc Requested row may not be visible due to being outside the bounds of the rendered grid.
     * @memberOf Renderer.prototype
     * @summary Determines visibility of a row.
     * @param {number} rowIndex - The grid row index.
     * @returns {boolean} The given row is visible.
     */
    isRowVisible: function(rowIndex) {
        return !!this.visibleRows[rowIndex];
    },

    /**
     * @summary Get the "visible row" object matching the provided grid row index.
     * @desc Requested row may not be visible due to being outside the bounds of the rendered grid.
     * @memberOf Renderer.prototype
     * @summary Find a visible row object.
     * @param {number} rowIndex - The grid row index.
     * @returns {object|undefined} The given row if visible or `undefined` if not.
     */
    getVisibleRow: function(rowIndex) {
        return this.visibleRows[rowIndex];
    },

    /**
     * @summary Get the visibility of the row matching the provided data row index.
     * @desc Requested row may not be visible due to being scrolled out of view.
     * @memberOf Renderer.prototype
     * @summary Determines visibility of a row.
     * @param {number} rowIndex - The data row index.
     * @param {dataModelAPI} [subgrid=this.behavior.subgrids.data]
     * @returns {boolean} The given row is visible.
     */
    isDataRowVisible: function(rowIndex, subgrid) {
        return !!this.getVisibleDataRow(rowIndex, subgrid);
    },

    /**
     * @summary Get the "visible row" object matching the provided data row index.
     * @desc Requested row may not be visible due to being scrolled out of view.
     * @memberOf Renderer.prototype
     * @summary Find a visible row object.
     * @param {number} rowIndex - The data row index within the given subgrid.
     * @param {dataModelAPI} [subgrid=this.behavior.subgrids.data]
     * @returns {object|undefined} The given row if visible or `undefined` if not.
     */
    getVisibleDataRow: function(rowIndex, subgrid) {
        subgrid = subgrid || this.grid.behavior.subgrids.lookup.data;
        return this.visibleRows.find(function(vr) {
            return vr.subgrid === subgrid && vr.rowIndex === rowIndex;
        });
    },

    /**
     * @memberOf Renderer.prototype
     * @summary Determines if a cell is selected.
     * @param {number} x - the x cell coordinate
     * @param {number} y - the y cell coordinate*
     * @returns {boolean} The given cell is fully visible.
     */
    isSelected: function(x, y) {
        return this.grid.isSelected(x, y);
    },

    /**
     * @memberOf Renderer.prototype
     * @desc This is the main forking of the renderering task.
     * @param {CanvasRenderingContext2D} gc
     */
    renderGrid: function(gc) {
        this.grid.deferredBehaviorChange();

        gc.beginPath();

        this.buttonCells = {};

        var rowCount = this.grid.getRowCount();
        if (rowCount !== this.lastKnowRowCount) {
            var newWidth = resetRowHeaderColumnWidth.call(this, gc, rowCount);
            if (newWidth !== this.handleColumnWidth) {
                this.needsComputeCellsBounds = true;
                this.handleColumnWidth = newWidth;
            }
            this.lastKnowRowCount = rowCount;
        }

        if (this.needsComputeCellsBounds) {
            computeCellsBounds.call(this);
            this.needsComputeCellsBounds = false;
        }

        this.gridRenderer.paintCells.call(this, gc);

        this.renderOverrides(gc);

        this.renderLastSelection(gc);

        gc.closePath();
    },

    renderLastSelection: function(gc) {
        var selections = this.grid.selectionModel.getSelections();
        if (!selections || selections.length === 0) {
            return;
        }

        var selection = this.grid.selectionModel.getLastSelection();
        if (selection.origin.x === -1) {
            // no selected area, lets exit
            return;
        }

        var vci = this.visibleColumnsByIndex,
            vri = this.visibleRowsByDataRowIndex,
            lastColumn = this.visibleColumns[this.visibleColumns.length - 1], // last column in scrollable section
            lastRow = vri[this.dataWindow.corner.y]; // last row in scrollable data section
        if (
            !lastColumn || !lastRow ||
            selection.origin.x > lastColumn.columnIndex ||
            selection.origin.y > lastRow.rowIndex
        ) {
            // selection area begins to right or below grid
            return;
        }

        var vcOrigin = vci[selection.origin.x],
            vcCorner = vci[selection.corner.x],
            vrOrigin = vri[selection.origin.y],
            vrCorner = vri[selection.corner.y];
        if (
            !(vcOrigin || vcCorner) || // entire selection scrolled out of view to left of scrollable region
            !(vrOrigin || vrCorner)    // entire selection scrolled out of view above scrollable region
        ) {
            return;
        }

        var gridProps = this.properties;
        vcOrigin = vcOrigin || this.visibleColumns[gridProps.fixedColumnCount];
        vrOrigin = vrOrigin || this.visibleRows[gridProps.fixedRowCount];
        vcCorner = vcCorner || (selection.corner.x > lastColumn.columnIndex ? lastColumn : vci[gridProps.fixedColumnCount - 1]);
        vrCorner = vrCorner || (selection.corner.y > lastRow.rowIndex ? lastRow : vri[gridProps.fixedRowCount - 1]);

        // Render the selection model around the bounds
        var config = {
            bounds: {
                x: vcOrigin.left,
                y: vrOrigin.top,
                width: vcCorner.right - vcOrigin.left,
                height: vrCorner.bottom - vrOrigin.top
            },
            selectionRegionOverlayColor: this.gridRenderer.paintCells.partial ? 'transparent' : gridProps.selectionRegionOverlayColor,
            selectionRegionOutlineColor: gridProps.selectionRegionOutlineColor
        };
        this.grid.cellRenderers.get('lastselection').paint(gc, config);
        if (this.gridRenderer.paintCells.key === 'by-cells') {
            this.gridRenderer.reset = true; // fixes GRID-490
        }
    },

    /**
     * @memberOf Renderer.prototype
     * @desc iterate the renderering overrides and manifest each
     * @param {CanvasRenderingContext2D} gc
     */
    renderOverrides: function(gc) {
        var cache = this.grid.renderOverridesCache;
        for (var key in cache) {
            if (cache.hasOwnProperty(key)) {
                var override = cache[key];
                if (override) {
                    this.renderOverride(gc, override);
                }
            }
        }
    },

    /**
     * @memberOf Renderer.prototype
     * @desc copy each overrides specified area to it's target and blank out the source area
     * @param {CanvasRenderingContext2D} gc
     * @param {OverrideObject} override - an object with details contain an area and a target context
     */
    renderOverride: function(gc, override) {
        //lets blank out the drag row
        var hdpiRatio = override.hdpiratio;
        var startX = override.startX; //hdpiRatio * edges[override.columnIndex];
        var width = override.width + 1;
        var height = override.height;
        var targetCTX = override.ctx;
        var imgData = gc.getImageData(startX, 0, Math.round(width * hdpiRatio), Math.round(height * hdpiRatio));
        targetCTX.putImageData(imgData, 0, 0);
        gc.cache.fillStyle = this.properties.backgroundColor2;
        gc.fillRect(Math.round(startX / hdpiRatio), 0, width, height);
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} Current vertical scroll value.
     */
    getScrollTop: function() {
        return this.grid.getVScrollValue();
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} Current horizontal scroll value.
     */
    getScrollLeft: function() {
        return this.grid.getHScrollValue();
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {boolean} The last col was rendered (is visible)
     */
    isLastColumnVisible: function() {
        var lastColumnIndex = this.grid.getColumnCount() - 1;
        return !!this.visibleColumns.findWithNeg(function(vc) { return vc.columnIndex === lastColumnIndex; });
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The rendered column width at index
     */
    getRenderedWidth: function(index) {
        var result,
            columns = this.visibleColumns;

        if (index >= columns.length) {
            result = columns[columns.length - 1].right;
        } else {
            result = columns[index].left;
        }

        return result;
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The rendered row height at index
     */
    getRenderedHeight: function(index) {
        var result,
            rows = this.visibleRows;

        if (index >= rows.length) {
            var last = rows[rows.length - 1];
            result = last.bottom;
        } else {
            result = rows[index].top;
        }

        return result;
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {boolean} User is currently dragging a column for reordering.
     */
    isDraggingColumn: function() {
        return this.grid.isDraggingColumn();
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The row to go to for a page up.
     */
    getPageUpRow: function() {
        var grid = this.grid,
            scrollHeight = this.getVisibleScrollHeight(),
            top = this.dataWindow.origin.y - this.properties.fixedRowCount - 1,
            scanHeight = 0;
        while (scanHeight < scrollHeight && top >= 0) {
            scanHeight += grid.getRowHeight(top);
            top--;
        }
        return top + 1;
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The row to goto for a page down.
     */
    getPageDownRow: function() {
        return this.dataWindow.corner.y - this.properties.fixedRowCount + 1;
    },

    renderErrorCell: function(err, gc, vc, vr) {
        var message = err && (err.message || err) || 'Unknown error.',
            bounds = { x: vc.left, y: vr.top, width: vc.width, height: vr.height },
            config = { bounds: bounds };

        console.error(message);

        gc.cache.save(); // define clipping region
        gc.beginPath();
        gc.rect(bounds.x, bounds.y, bounds.width, bounds.height);
        gc.clip();

        this.grid.cellRenderers.get('errorcell').paint(gc, config, message);

        gc.cache.restore(); // discard clipping region
    },

    /**
     * @memberOf Renderer.prototype
     * @desc We opted to not paint borders for each cell as that was extremely expensive. Instead we draw grid lines here.
     * @param {CanvasRenderingContext2D} gc
     */
    paintGridlines: function(gc) {
        var visibleColumns = this.visibleColumns, C = visibleColumns.length,
            visibleRows = this.visibleRows, R = visibleRows.length;

        if (C && R) {
            var gridProps = this.properties,
                viewWidth = visibleColumns[C - 1].right,
                viewHeight = visibleRows[R - 1].bottom;

            if (gridProps.gridLinesV) {
                gc.cache.fillStyle = gridProps.gridLinesVColor;
                for (var right, vc = visibleColumns[0], c = 1; c < C; c++) {
                    right = vc.right;
                    vc = visibleColumns[c];
                    if (!vc.gap) {
                        gc.fillRect(right, 0, gridProps.gridLinesVWidth, viewHeight);
                    }
                }
            }

            if (gridProps.gridLinesH) {
                gc.cache.fillStyle = gridProps.gridLinesHColor;
                for (var bottom, vr = visibleRows[0], r = 1; r < R; r++) {
                    bottom = vr.bottom;
                    vr = visibleRows[r];
                    if (!vr.gap) {
                        gc.fillRect(0, bottom, viewWidth, gridProps.gridLinesHWidth);
                    }
                }
            }

            var edgeWidth;
            var gap = visibleRows.gap;
            if (gap) {
                gc.cache.fillStyle = gridProps.fixedLinesHColor || gridProps.gridLinesHColor;
                edgeWidth = gridProps.fixedLinesHEdge;
                if (edgeWidth) {
                    gc.fillRect(0, gap.top, viewWidth, edgeWidth);
                    gc.fillRect(0, gap.bottom - edgeWidth, viewWidth, edgeWidth);
                } else {
                    gc.fillRect(0, gap.top, viewWidth, gap.bottom - gap.top);
                }
            }

            gap = visibleColumns.gap;
            if (gap) {
                gc.cache.fillStyle = gridProps.fixedLinesVColor || gridProps.gridLinesVColor;
                edgeWidth = gridProps.fixedLinesVEdge;
                if (edgeWidth) {
                    gc.fillRect(gap.left, 0, edgeWidth, viewHeight);
                    gc.fillRect(gap.right - edgeWidth, 0, edgeWidth, viewHeight);
                } else {
                    gc.fillRect(gap.left, 0, gap.right - gap.left, viewHeight);
                }
            }
        }
    },

    /**
     * @memberOf Renderer.prototype
     * @param {CanvasRenderingContext2D} gc
     * @param x
     * @param y
     */
    paintCell: function(gc, x, y) {
        gc.moveTo(0, 0);

        var c = this.visibleColumns[x].index, // todo refac
            r = this.visibleRows[y].index;

        if (c) { //something is being viewed at at the moment (otherwise returns undefined)
            this._paintCell(gc, c, r);
        }
    },

    /**
     * @summary Render a single cell.
     * @param {CanvasRenderingContext2D} gc
     * @param {CellEvent} cellEvent
     * @param {string} [prefillColor] If omitted, this is a partial renderer; all other renderers must provide this.
     * @returns {number} Preferred width of renndered cell.
     * @private
     * @memberOf Renderer
     */
    _paintCell: function(gc, cellEvent, prefillColor) {
        var grid = this.grid,
            selectionModel = grid.selectionModel,

            isHandleColumn = cellEvent.isHandleColumn,
            isTreeColumn = cellEvent.isTreeColumn,
            isColumnSelected = cellEvent.isColumnSelected,

            isDataRow = cellEvent.isDataRow,
            isRowSelected = cellEvent.isRowSelected,
            isCellSelected = cellEvent.isCellSelected,

            isHeaderRow = cellEvent.isHeaderRow,
            isFilterRow = cellEvent.isFilterRow,

            isRowHandleOrHierarchyColumn = isHandleColumn || isTreeColumn,
            isUserDataArea = !isRowHandleOrHierarchyColumn && isDataRow,

            config = this.assignProps(cellEvent),

            x = (config.gridCell = cellEvent.gridCell).x,
            r = (config.dataCell = cellEvent.dataCell).y,

            value,
            format,
            isSelected;

        if (isHandleColumn) {
            isSelected = isRowSelected || selectionModel.isCellSelectedInRow(r);
            config.halign = 'right';
        } else if (isTreeColumn) {
            isSelected = isRowSelected || selectionModel.isCellSelectedInRow(r);
            config.halign = 'left';
        } else if (isDataRow) {
            isSelected = isCellSelected || isRowSelected || isColumnSelected;
            format = config.format;
        } else {
            format = cellEvent.subgrid.format || config.format; // subgrid format can override column format
            if (isFilterRow) {
                isSelected = false;
            } else if (isColumnSelected) {
                isSelected = true;
            } else {
                isSelected = selectionModel.isCellSelectedInColumn(x); // header or summary or other non-meta
            }
        }

        // Set cell contents:
        // * For all cells: set `config.value` (writable property)
        // * For cells outside of row handle column: also set `config.dataRow` for use by valOrFunc
        if (!isHandleColumn) {
            //Including hierarchyColumn
            config.dataRow = cellEvent.dataRow;
            value = cellEvent.value;
        } else {
            if (isDataRow) {
                // row handle for a data row
                if (config.rowHeaderNumbers) {
                    value = r + 1; // row number is 1-based
                }
            } else if (isHeaderRow) {
                // row handle for header row: gets "master" checkbox
                config.allRowsSelected = selectionModel.areAllRowsSelected();
            }
        }

        config.isSelected = isSelected;
        config.isDataColumn = !isRowHandleOrHierarchyColumn;
        config.isHandleColumn = isHandleColumn;
        config.isTreeColumn = isTreeColumn;
        config.isDataRow = isDataRow;
        config.isHeaderRow = isHeaderRow;
        config.isFilterRow = isFilterRow;
        config.isUserDataArea = isUserDataArea;
        config.isColumnHovered = cellEvent.isColumnHovered;
        config.isRowHovered = cellEvent.isRowHovered;
        config.isCellHovered = cellEvent.isCellHovered;
        config.bounds = cellEvent.bounds;
        config.isCellSelected = isCellSelected;
        config.isRowSelected = isRowSelected;
        config.isColumnSelected = isColumnSelected;
        config.isInCurrentSelectionRectangle = selectionModel.isInCurrentSelectionRectangle(x, r);
        config.prefillColor = prefillColor;
        config.buttonCells = this.buttonCells; // allow the renderer to identify itself if it's a button
        config.subrow = 0;

        if (grid.mouseDownState) {
            config.mouseDown = grid.mouseDownState.gridCell.equals(cellEvent.gridCell);
        }

        // subrow logic - coded for efficiency when no subrows (!value.subrows)
        var isArray = isUserDataArea && value && value.constructor === Array, // fastest array determination
            subrows = isArray && value.subrows && value.length;

        if (subrows) {
            var bounds = config.bounds = Object.assign({}, config.bounds);
            bounds.height /= subrows;
            config.subrows = subrows;
            config.value = config.exec(value[0]);
        } else {
            subrows = 1;
            config.value = !isArray && isUserDataArea ? config.exec(value) : value;
        }

        while (true) { // eslint-disable-line
            // This call's dataModel.getCell which developer can override to:
            // * mutate the (writable) properties of `config` (including config.value)
            // * mutate cell renderer choice (instance of which is returned)
            var cellRenderer = cellEvent.subgrid.getCell(config, config.renderer);

            config.formatValue = grid.getFormatter(format);

            // Following supports partial render
            config.snapshot = cellEvent.snapshot;
            config.minWidth = cellEvent.minWidth; // in case `paint` aborts before setting `minWidth`

            // Render the cell
            cellRenderer.paint(gc, config);

            // Following supports partial render:
            cellEvent.snapshot[config.subrow] = config.snapshot;
            if (cellEvent.minWidth === undefined || config.minWidth > cellEvent.minWidth) {
                cellEvent.minWidth = config.minWidth;
            }

            if (++config.subrow === subrows) {
                break;
            }

            bounds.y += bounds.height;
            config.value = config.exec(value[config.subrow]);
        }

        return config.minWidth;
    },

    /**
     * Overridable for alternative or faster logic.
     * @param CellEvent
     * @returns {object} Layered config object.
     */
    assignProps: layerProps,

    /**
     * @param {number|CellEvent} colIndexOrCellEvent - This is the "data" x coordinate.
     * @param {number} [rowIndex] - This is the "data" y coordinate. Omit if `colIndexOrCellEvent` is a `CellEvent`.
     * @param {dataModelAPI} [dataModel=this.grid.behavior.dataModel] Omit if `colIndexOrCellEvent` is a `CellEvent`.
     * @returns {CellEvent} The matching `CellEvent` object from the renderer's pool. Returns `undefined` if the requested cell is not currently visible (due to being scrolled out of view).
     */
    findCell: function(colIndexOrCellEvent, rowIndex, dataModel) {
        var colIndex, cellEvent,
            pool = this.cellEventPool;

        if (typeof colIndexOrCellEvent === 'object') {
            // colIndexOrCellEvent is a cell event object
            dataModel = rowIndex;
            rowIndex = colIndexOrCellEvent.visibleRow.rowIndex;
            colIndex = colIndexOrCellEvent.column.index;
        } else {
            colIndex = colIndexOrCellEvent;
        }

        dataModel = dataModel || this.grid.behavior.dataModel;

        for (var p = 0, len = this.visibleColumns.length * this.visibleRows.length; p < len; ++p) {
            cellEvent = pool[p];
            if (
                cellEvent.subgrid === dataModel &&
                cellEvent.column.index === colIndex &&
                cellEvent.visibleRow.rowIndex === rowIndex
            ) {
                return cellEvent;
            }
        }
    },

    /**
     * Resets the cell properties cache in the matching `CellEvent` object from the renderer's pool. This will insure that a new cell properties object will be known to the renderer. (Normally, the cache is not reset until the pool is updated by the next call to {@link Renderer#computeCellBounds}).
     * @param {number|CellEvent} xOrCellEvent
     * @param {number} [y]
     * @param {dataModelAPI} [dataModel=this.grid.behavior.dataModel]
     * @returns {CellEvent} The matching `CellEvent` object.
     */
    resetCellPropertiesCache: function(xOrCellEvent, y, dataModel) {
        var cellEvent = this.findCell.apply(this, arguments);
        if (cellEvent) { cellEvent._cellOwnProperties = undefined; }
        return cellEvent;
    },

    resetAllCellPropertiesCaches: function() {
        this.cellEventPool.forEach(function(cellEvent) {
            cellEvent._cellOwnProperties = undefined;
        });
    },

    isViewableButton: function(c, r) {
        // Cell with 'button' renderer clicked returns an array; other cells return `undefined`.
        // The array contains bounding rect per subrow with a button. When no subrows array length is 1.
        return this.buttonCells[c + ',' + r];
    },

    getBounds: function() {
        return this.bounds;
    },

    setBounds: function(bounds) {
        return (this.bounds = bounds);
    },

    setInfo: function(message) {
        var width;
        if (this.visibleColumns.length) {
            width = this.visibleColumns[this.visibleColumns.length - 1].right;
        }
        this.grid.canvas.setInfo(message, width);
    }
});

/**
 * This function creates several data structures:
 * * {@link Renderer#visibleColumns}
 * * {@link Renderer#visibleRows}
 *
 * Original comment:
 * "this function computes the grid coordinates used for extremely fast iteration over
 * painting the grid cells. this function is very fast, for thousand rows X 100 columns
 * on a modest machine taking usually 0ms and no more that 3 ms."
 *
 * @this {Renderer}
 */
function computeCellsBounds() {
    //var startTime = Date.now();

    var scrollTop = this.getScrollTop(),
        scrollLeft = this.getScrollLeft(),

        fixedColumnCount = this.grid.getFixedColumnCount(),
        fixedRowCount = this.grid.getFixedRowCount(),

        bounds = this.getBounds(),
        grid = this.grid,
        behavior = grid.behavior,
        noTreeColumn = !behavior.hasTreeColumn(),
        editorCellEvent = grid.cellEditor && grid.cellEditor.event,

        vcEd, xEd,
        vrEd, yEd,
        sgEd, isSubgridEd,

        insertionBoundsCursor = 0,
        previousInsertionBoundsCursorValue = 0,

        gridProps = grid.properties,
        lineWidthV = gridProps.gridLinesVWidth,
        lineWidthH = gridProps.gridLinesHWidth,
        fixedWidthV = gridProps.fixedLinesVWidth || gridProps.gridLinesVWidth,
        fixedWidthH = gridProps.fixedLinesHWidth || gridProps.gridLinesHWidth,
        hasFixedColumnGap = fixedWidthV && fixedColumnCount,
        hasFixedRowGap = fixedWidthH && fixedRowCount,

        start = 0,
        numOfInternalCols = 0,
        x, X, // horizontal pixel loop index and limit
        y, Y, // vertical pixel loop index and limit
        c, C, // column loop index and limit
        g, G, // subgrid loop index and limit
        r, R, // row loop index and limit
        subrows, // rows in subgrid g
        base, // sum of rows for all subgrids so far
        subgrids = behavior.subgrids,
        subgrid,
        rowIndex,
        scrollableSubgrid,
        footerHeight,
        vx, vy,
        vr, vc,
        width, height,
        firstVX, lastVX,
        firstVY, lastVY,
        topR,
        gap,
        left, widthSpaced, heightSpaced; // adjusted for cell spacing

    if (editorCellEvent) {
        xEd = editorCellEvent.gridCell.x;
        yEd = editorCellEvent.dataCell.y;
        sgEd = editorCellEvent.subgrid;
    }

    if (noTreeColumn) {
        this.visibleColumns[behavior.treeColumnIndex] = undefined;
    } else {
        start = Math.min(start, behavior.treeColumnIndex);
        numOfInternalCols += 1;
    }

    if (gridProps.showRowNumbers) {
        start = Math.min(start, behavior.rowColumnIndex);
        numOfInternalCols += 1;
    }

    this.scrollHeight = 0;

    this.visibleColumns.length = 0;
    this.visibleColumns.gap = undefined;

    this.visibleRows.length = 0;
    this.visibleRows.gap = undefined;

    this.visibleColumnsByIndex = []; // array because number of columns will always be reasonable
    this.visibleRowsByDataRowIndex = {}; // hash because keyed by (fixed and) scrolled row indexes

    this.insertionBounds = [];

    for (
        x = 0, c = start, C = grid.getColumnCount(), X = bounds.width || grid.canvas.width;
        c < C && x <= X;
        c++
    ) {
        if (noTreeColumn && c === behavior.treeColumnIndex) {
            continue;
        }

        vx = c;
        if (c >= fixedColumnCount) {
            lastVX = vx += scrollLeft;
            if (firstVX === undefined) {
                firstVX = lastVX;
            }
        }
        if (vx >= C) {
            break; // scrolled beyond last column
        }

        width = Math.ceil(behavior.getColumnWidth(vx));

        gap = false;
        if (x) {
            if ((gap = hasFixedColumnGap && c === fixedColumnCount)) {
                x += fixedWidthV - lineWidthV;
                this.visibleColumns.gap = {
                    left: vc.right,
                    right: undefined
                };
            }
            left = x + lineWidthV;
            widthSpaced = width - lineWidthV;
        } else {
            left = x;
            widthSpaced = width;
        }

        this.visibleColumns[c] = this.visibleColumnsByIndex[vx] = vc = {
            index: c,
            columnIndex: vx,
            column: behavior.getActiveColumn(vx),
            gap: gap,
            left: left,
            width: widthSpaced,
            right: left + widthSpaced
        };

        if (gap) {
            this.visibleColumns.gap.right = vc.left;
        }

        if (xEd === vx) {
            vcEd = vc;
        }

        x += width;

        insertionBoundsCursor += Math.round(width / 2) + previousInsertionBoundsCursorValue;
        this.insertionBounds.push(insertionBoundsCursor);
        previousInsertionBoundsCursorValue = Math.round(width / 2);
    }

    // get height of total number of rows in all subgrids following the data subgrid
    footerHeight = gridProps.defaultRowHeight * behavior.getFooterRowCount();

    for (
        base = r = g = y = 0, G = subgrids.length, Y = bounds.height - footerHeight;
        g < G;
        g++, base += subrows
    ) {
        subgrid = subgrids[g];
        subrows = subgrid.getRowCount();
        scrollableSubgrid = subgrid.isData;
        isSubgridEd = (sgEd === subgrid);
        topR = r;

        // For each row of each subgrid...
        for (R = r + subrows; r < R && y < Y; r++) {
            vy = r;
            gap = false;
            if (scrollableSubgrid) {
                if ((gap = hasFixedRowGap && r === fixedRowCount)) {
                    y += fixedWidthH - lineWidthH;
                    this.visibleRows.gap = {
                        top: vr.bottom,
                        bottom: undefined
                    };
                }
                if (r >= fixedRowCount) {
                    vy += scrollTop;
                    lastVY = vy - base;
                    if (firstVY === undefined) {
                        firstVY = lastVY;
                    }
                    if (vy >= R) {
                        break; // scrolled beyond last row
                    }
                }
            }

            rowIndex = vy - base;
            height = behavior.getRowHeight(rowIndex, subgrid);

            heightSpaced = height - lineWidthH;
            this.visibleRows[r] = vr = {
                index: r,
                subgrid: subgrid,
                gap: gap,
                rowIndex: rowIndex,
                top: y,
                height: heightSpaced,
                bottom: y + heightSpaced
            };

            if (gap) {
                this.visibleRows.gap.bottom = vr.top;
            }

            if (scrollableSubgrid) {
                this.visibleRowsByDataRowIndex[vy - base] = vr;
            }

            if (isSubgridEd && yEd === rowIndex) {
                vrEd = vr;
            }

            y += height;
        }

        if (scrollableSubgrid) {
            subrows = r - topR;
            Y += footerHeight;
        }
    }

    if (editorCellEvent) {
        editorCellEvent.visibleColumn = vcEd;
        editorCellEvent.visibleRow = vrEd;
        editorCellEvent.gridCell.y = vrEd && vrEd.index;
        editorCellEvent._bounds = null;
    }

    this.viewHeight = Y;

    this.dataWindow = this.grid.newRectangle(firstVX, firstVY, lastVX - firstVX, lastVY - firstVY);

    // Resize CellEvent pool
    var pool = this.cellEventPool,
        previousLength = pool.length,
        P = (this.visibleColumns.length + numOfInternalCols) * this.visibleRows.length;

    if (P > previousLength) {
        pool.length = P; // grow pool to accommodate more cells
    }
    for (var p = previousLength; p < P; p++) {
        pool[p] = new behavior.CellEvent; // instantiate new members
    }

    this.resetAllGridRenderers();
}

/**
 * @summary Resize the handle column.
 * @desc Handle column width is sum of:
 * * Width of text the maximum row number, if visible, based on handle column's current font
 * * Width of checkbox, if visible
 * * Some padding
 *
 * @this {Renderer}
 * @param gc
 * @param rowCount
 */
function resetRowHeaderColumnWidth(gc, rowCount) {
    var columnProperties = this.grid.behavior.getColumnProperties(this.grid.behavior.rowColumnIndex),
        gridProps = this.grid.properties,
        width = 2 * columnProperties.cellPadding;

    // Checking images.checked also supports a legacy feature in which checkbox could be hidden by undefining the image.
    if (gridProps.rowHeaderCheckboxes && images.checked) {
        width += images.checked.width;
    }

    if (gridProps.rowHeaderNumbers) {
        var cellProperties = columnProperties.rowHeader;
        gc.cache.font = cellProperties.foregroundSelectionFont.indexOf('bold ') >= 0
            ? cellProperties.foregroundSelectionFont
            : cellProperties.font;

        width += gc.getTextWidth(rowCount);
    }

    columnProperties.preferredWidth = columnProperties.width = width;
}

function registerGridRenderer(paintCellsFunction) {
    if (paintCellsFunctions.indexOf(paintCellsFunction) < 0) {
        paintCellsFunctions.push(paintCellsFunction);
    }
}

registerGridRenderer(require('./by-cells'));
registerGridRenderer(require('./by-columns'));
registerGridRenderer(require('./by-columns-discrete'));
registerGridRenderer(require('./by-columns-and-rows'));
registerGridRenderer(require('./by-rows'));

Renderer.registerGridRenderer = registerGridRenderer;

module.exports = Renderer;

},{"../../images":10,"../Base":12,"./by-cells":83,"./by-columns":86,"./by-columns-and-rows":84,"./by-columns-discrete":85,"./by-rows":87,"./layer-props":89}],89:[function(require,module,exports){
'use strict';

var defaults = require('../defaults');

var COLUMNS = defaults.propClassEnum.COLUMNS,
    CELLS = defaults.propClassEnum.CELLS,
    propClassGet = [];

propClassGet[COLUMNS] = function(cellEvent) {
    return cellEvent.columnProperties;
};
propClassGet[CELLS] = function(cellEvent) {
    return cellEvent.cellOwnProperties;
};
propClassGet[defaults.propClassEnum.STRIPES] = function(cellEvent) {
    var rowStripes = cellEvent.isDataRow && cellEvent.columnProperties.rowStripes;
    return rowStripes && rowStripes[cellEvent.dataCell.y % rowStripes.length];
};
propClassGet[defaults.propClassEnum.ROWS] = function(cellEvent) {
    return cellEvent.rowOwnProperties;
};

function assignProps(cellEvent) {
    var i, base, assignments,
        props = cellEvent.properties,
        propLayers = props.propClassLayers;

    switch (propLayers[0]) {
        case COLUMNS:
            i = 1; // skip column prop layer
            base = cellEvent.columnProperties; // because column has grid props as prototype
            break;
        case CELLS:
            i = 1; // skip cell prop layer
            base = cellEvent.properties; // because cell has column props as prototype
            break;
        default:
            i = 0; // all prop layers
            base = this.grid.properties;
    }

    for (assignments = [Object.create(base)]; i < propLayers.length; ++i) {
        assignments.push(propClassGet[propLayers[i]](cellEvent));
    }

    return Object.assign.apply(Object, assignments);
}

module.exports = assignProps;

},{"../defaults":51}],90:[function(require,module,exports){
'use strict';

/* eslint-env node, browser */

var cssInjector = require('css-injector');

/**
 * @constructor FinBar
 * @summary Create a scrollbar object.
 * @desc Creating a scrollbar is a three-step process:
 *
 * 1. Instantiate the scrollbar object by calling this constructor function. Upon instantiation, the DOM element for the scrollbar (with a single child element for the scrollbar "thumb") is created but is not insert it into the DOM.
 * 2. After instantiation, it is the caller's responsibility to insert the scrollbar, {@link FinBar#bar|this.bar}, into the DOM.
 * 3. After insertion, the caller must call {@link FinBar#resize|resize()} at least once to size and position the scrollbar and its thumb. After that, `resize()` should also be called repeatedly on resize events (as the content element is being resized).
 *
 * Suggested configurations:
 * * _**Unbound**_<br/>
 * The scrollbar serves merely as a simple range (slider) control. Omit both `options.onchange` and `options.content`.
 * * _**Bound to virtual content element**_<br/>
 * Virtual content is projected into the element using a custom event handler supplied by the programmer in `options.onchange`. A typical use case would be to handle scrolling of the virtual content. Other use cases include data transformations, graphics transformations, _etc._
 * * _**Bound to real content**_<br/>
 * Set `options.content` to the "real" content element but omit `options.onchange`. This will cause the scrollbar to use the built-in event handler (`this.scrollRealContent`) which implements smooth scrolling of the content element within the container.
 *
 * @param {finbarOptions} [options={}] - Options object. See the type definition for member details.
 */
function FinBar(options) {

    // make bound versions of all the mouse event handler
    var bound = this._bound = {};
    for (key in handlersToBeBound) {
        bound[key] = handlersToBeBound[key].bind(this);
    }

    /**
     * @name thumb
     * @summary The generated scrollbar thumb element.
     * @desc The thumb element's parent element is always the {@link FinBar#bar|bar} element.
     *
     * This property is typically referenced internally only. The size and position of the thumb element is maintained by `_calcThumb()`.
     * @type {Element}
     * @memberOf FinBar.prototype
     */
    var thumb = this.thumb = document.createElement('div');
    thumb.classList.add('thumb');
    thumb.onclick = bound.shortStop;
    thumb.onmouseover = bound.onmouseover;
    thumb.onmouseout = this._bound.onmouseout;

    /**
     * @name bar
     * @summary The generated scrollbar element.
     * @desc The caller inserts this element into the DOM (typically into the content container) and then calls its {@link FinBar#resize|resize()} method.
     *
     * Thus the node tree is typically:
     * * A **content container** element, which contains:
     *   * The content element(s)
     *   * This **scrollbar element**, which in turn contains:
     *     * The **thumb element**
     *
     * @type {Element}
     * @memberOf FinBar.prototype
     */
    var bar = this.bar = document.createElement('div');
    bar.classList.add('finbar-vertical');
    bar.onmousedown = this._bound.onmousedown;
    if (this.paging) { bar.onclick = bound.onclick; }
    bar.appendChild(thumb);

    options = options || {};

    // presets
    this.orientation = 'vertical';
    this._min = this._index = 0;
    this._max = 100;

    // options
    for (var key in options) {
        if (options.hasOwnProperty(key)) {
            var option = options[key];
            switch (key) {

                case 'index':
                    this._index = option;
                    break;

                case 'range':
                    validRange(option);
                    this._min = option.min;
                    this._max = option.max;
                    this.contentSize = option.max - option.min + 1;
                    break;

                default:
                    if (
                        key.charAt(0) !== '_' &&
                        typeof FinBar.prototype[key] !== 'function'
                    ) {
                        // override prototype defaults for standard ;
                        // extend with additional properties (for use in onchange event handlers)
                        this[key] = option;
                    }
                    break;

            }
        }
    }

    cssInjector(cssFinBars, 'finbar-base', options.cssStylesheetReferenceElement);
}

FinBar.prototype = {

    /**
     * @summary The scrollbar orientation.
     * @desc Set by the constructor to either `'vertical'` or `'horizontal'`. See the similarly named property in the {@link finbarOptions} object.
     *
     * Useful values are `'vertical'` (the default) or `'horizontal'`.
     *
     * Setting this property resets `this.oh` and `this.deltaProp` and changes the class names so as to reposition the scrollbar as per the CSS rules for the new orientation.
     * @default 'vertical'
     * @type {string}
     * @memberOf FinBar.prototype
     */
    set orientation(orientation) {
        if (orientation === this._orientation) {
            return;
        }

        this._orientation = orientation;

        /**
         * @readonly
         * @name oh
         * @summary <u>O</u>rientation <u>h</u>ash for this scrollbar.
         * @desc Set by the `orientation` setter to either the vertical or the horizontal orientation hash. The property should always be synchronized with `orientation`; do not update directly!
         *
         * This object is used internally to access scrollbars' DOM element properties in a generalized way without needing to constantly query the scrollbar orientation. For example, instead of explicitly coding `this.bar.top` for a vertical scrollbar and `this.bar.left` for a horizontal scrollbar, simply code `this.bar[this.oh.leading]` instead. See the {@link orientationHashType} definition for details.
         *
         * This object is useful externally for coding generalized {@link finbarOnChange} event handler functions that serve both horizontal and vertical scrollbars.
         * @type {orientationHashType}
         * @memberOf FinBar.prototype
         */
        this.oh = orientationHashes[this._orientation];

        if (!this.oh) {
            error('Invalid value for `options._orientation.');
        }

        /**
         * @name deltaProp
         * @summary The name of the `WheelEvent` property this scrollbar should listen to.
         * @desc Set by the constructor. See the similarly named property in the {@link finbarOptions} object.
         *
         * Useful values are `'deltaX'`, `'deltaY'`, or `'deltaZ'`. A value of `null` means to ignore mouse wheel events entirely.
         *
         * The mouse wheel is one-dimensional and only emits events with `deltaY` data. This property is provided so that you can override the default of `'deltaX'` with a value of `'deltaY'` on your horizontal scrollbar primarily to accommodate certain "panoramic" interface designs where the mouse wheel should control horizontal rather than vertical scrolling. Just give `{ deltaProp: 'deltaY' }` in your horizontal scrollbar instantiation.
         *
         * Caveat: Note that a 2-finger drag on an Apple trackpad emits events with _both_ `deltaX ` and `deltaY` data so you might want to delay making the above adjustment until you can determine that you are getting Y data only with no X data at all (which is a sure bet you on a mouse wheel rather than a trackpad).

         * @type {object|null}
         * @memberOf FinBar.prototype
         */
        this.deltaProp = this.oh.delta;

        this.bar.className = this.bar.className.replace(/(vertical|horizontal)/g, orientation);

        if (this.bar.style.cssText || this.thumb.style.cssText) {
            this.bar.removeAttribute('style');
            this.thumb.removeAttribute('style');
            this.resize();
        }
    },
    get orientation() {
        return this._orientation;
    },

    /**
     * @summary Callback for scroll events.
     * @desc Set by the constructor via the similarly named property in the {@link finbarOptions} object. After instantiation, `this.onchange` may be updated directly.
     *
     * This event handler is called whenever the value of the scrollbar is changed through user interaction. The typical use case is when the content is scrolled. It is called with the `FinBar` object as its context and the current value of the scrollbar (its index, rounded) as the only parameter.
     *
     * Set this property to `null` to stop emitting such events.
     * @type {function(number)|null}
     * @memberOf FinBar.prototype
     */
    onchange: null,

    /**
     * @summary Add a CSS class name to the bar element's class list.
     * @desc Set by the constructor. See the similarly named property in the {@link finbarOptions} object.
     *
     * The bar element's class list will always include `finbar-vertical` (or `finbar-horizontal` based on the current orientation). Whenever this property is set to some value, first the old prefix+orientation is removed from the bar element's class list; then the new prefix+orientation is added to the bar element's class list. This property causes _an additional_ class name to be added to the bar element's class list. Therefore, this property will only add at most one additional class name to the list.
     *
     * To remove _classname-orientation_ from the bar element's class list, set this property to a falsy value, such as `null`.
     *
     * > NOTE: You only need to specify an additional class name when you need to have mulltiple different styles of scrollbars on the same page. If this is not a requirement, then you don't need to make a new class; you would just create some additional rules using the same selectors in the built-in stylesheet (../css/finbars.css):
     * *`div.finbar-vertical` (or `div.finbar-horizontal`) for the scrollbar
     * *`div.finbar-vertical > div` (or `div.finbar-horizontal > div`) for the "thumb."
     *
     * Of course, your rules should come after the built-ins.
     * @type {string}
     * @memberOf FinBar.prototype
     */
    set classPrefix(prefix) {
        if (this._classPrefix) {
            this.bar.classList.remove(this._classPrefix + this.orientation);
        }

        this._classPrefix = prefix;

        if (prefix) {
            this.bar.classList.add(prefix + '-' + this.orientation);
        }
    },
    get classPrefix() {
        return this._classPrefix;
    },

    /**
     * @name increment
     * @summary Number of scrollbar index units representing a pageful. Used exclusively for paging up and down and for setting thumb size relative to content size.
     * @desc Set by the constructor. See the similarly named property in the {@link finbarOptions} object.
     *
     * Can also be given as a parameter to the {@link FinBar#resize|resize} method, which is pertinent because content area size changes affect the definition of a "pageful." However, you only need to do this if this value is being used. It not used when:
     * * you define `paging.up` and `paging.down`
     * * your scrollbar is using `scrollRealContent`
     * @type {number}
     * @memberOf FinBar.prototype
     */
    increment: 1,

    /**
     * @name barStyles
     * @summary Scrollbar styles to be applied by {@link FinBar#resize|resize()}.
     * @desc Set by the constructor. See the similarly named property in the {@link finbarOptions} object.
     *
     * This is a value to be assigned to {@link FinBar#styles|styles} on each call to {@link FinBar#resize|resize()}. That is, a hash of values to be copied to the scrollbar element's style object on resize; or `null` for none.
     *
     * @see {@link FinBar#style|style}
     * @type {finbarStyles|null}
     * @memberOf FinBar.prototype
     */
    barStyles: null,

    /**
     * @name style
     * @summary Additional scrollbar styles.
     * @desc See type definition for more details. These styles are applied directly to the scrollbar's `bar` element.
     *
     * Values are adjusted as follows before being applied to the element:
     * 1. Included "pseudo-property" names from the scrollbar's orientation hash, {@link FinBar#oh|oh}, are translated to actual property names before being applied.
     * 2. When there are margins, percentages are translated to absolute pixel values because CSS ignores margins in its percentage calculations.
     * 3. If you give a value without a unit (a raw number), "px" unit is appended.
     *
     * General notes:
     * 1. It is always preferable to specify styles via a stylesheet. Only set this property when you need to specifically override (a) stylesheet value(s).
     * 2. Can be set directly or via calls to the {@link FinBar#resize|resize} method.
     * 3. Should only be set after the scrollbar has been inserted into the DOM.
     * 4. Before applying these new values to the element, _all_ in-line style values are reset (by removing the element's `style` attribute), exposing inherited values (from stylesheets).
     * 5. Empty object has no effect.
     * 6. Falsey value in place of object has no effect.
     *
     * > CAVEAT: Do not attempt to treat the object you assign to this property as if it were `this.bar.style`. Specifically, changing this object after assigning it will have no effect on the scrollbar. You must assign it again if you want it to have an effect.
     *
     * @see {@link FinBar#barStyles|barStyles}
     * @type {finbarStyles}
     * @memberOf FinBar.prototype
     */
    set style(styles) {
        var keys = Object.keys(styles = extend({}, styles, this._auxStyles));

        if (keys.length) {
            var bar = this.bar,
                barRect = bar.getBoundingClientRect(),
                container = this.container || bar.parentElement,
                containerRect = container.getBoundingClientRect(),
                oh = this.oh;

            // Before applying new styles, revert all styles to values inherited from stylesheets
            bar.removeAttribute('style');

            keys.forEach(function (key) {
                var val = styles[key];

                if (key in oh) {
                    key = oh[key];
                }

                if (!isNaN(Number(val))) {
                    val = (val || 0) + 'px';
                } else if (/%$/.test(val)) {
                    // When bar size given as percentage of container, if bar has margins, restate size in pixels less margins.
                    // (If left as percentage, CSS's calculation will not exclude margins.)
                    var oriented = axis[key],
                        margins = barRect[oriented.marginLeading] + barRect[oriented.marginTrailing];
                    if (margins) {
                        val = parseInt(val, 10) / 100 * containerRect[oriented.size] - margins + 'px';
                    }
                }

                bar.style[key] = val;
            });
        }
    },

    /**
     * @readonly
     * @name paging
     * @summary Enable page up/dn clicks.
     * @desc Set by the constructor. See the similarly named property in the {@link finbarOptions} object.
     *
     * If truthy, listen for clicks in page-up and page-down regions of scrollbar.
     *
     * If an object, call `.paging.up()` on page-up clicks and `.paging.down()` will be called on page-down clicks.
     *
     * Changing the truthiness of this value after instantiation currently has no effect.
     * @type {boolean|object}
     * @memberOf FinBar.prototype
     */
    paging: true,

    /**
     * @name range
     * @summary Setter for the minimum and maximum scroll values.
     * @desc Set by the constructor. These values are the limits for {@link FooBar#index|index}.
     *
     * The setter accepts an object with exactly two numeric properties: `.min` which must be less than `.max`. The values are extracted and the object is discarded.
     *
     * The getter returns a new object with `.min` and '.max`.
     *
     * @type {rangeType}
     * @memberOf FinBar.prototype
     */
    set range(range) {
        validRange(range);
        this._min = range.min;
        this._max = range.max;
        this.contentSize = range.max - range.min + 1;
        this.index = this.index; // re-clamp
    },
    get range() {
        return {
            min: this._min,
            max: this._max
        };
    },

    /**
     * @summary Index value of the scrollbar.
     * @desc This is the position of the scroll thumb.
     *
     * Setting this value clamps it to {@link FinBar#min|min}..{@link FinBar#max|max}, scroll the content, and moves thumb.
     *
     * Getting this value returns the current index. The returned value will be in the range `min`..`max`. It is intentionally not rounded.
     *
     * Use this value as an alternative to (or in addition to) using the {@link FinBar#onchange|onchange} callback function.
     *
     * @see {@link FinBar#_setScroll|_setScroll}
     * @type {number}
     * @memberOf FinBar.prototype
     */
    set index(idx) {
        idx = Math.min(this._max, Math.max(this._min, idx)); // clamp it
        this._setScroll(idx);
        // this._setThumbSize();
    },
    get index() {
        return this._index;
    },

    /**
     * @private
     * @summary Move the thumb.
     * @desc Also displays the index value in the test panel and invokes the callback.
     * @param idx - The new scroll index, a value in the range `min`..`max`.
     * @param [scaled=f(idx)] - The new thumb position in pixels and scaled relative to the containing {@link FinBar#bar|bar} element, i.e., a proportional number in the range `0`..`thumbMax`. When omitted, a function of `idx` is used.
     * @memberOf FinBar.prototype
     */
    _setScroll: function (idx, scaled) {
        this._index = idx;

        // Display the index value in the test panel
        if (this.testPanelItem && this.testPanelItem.index instanceof Element) {
            this.testPanelItem.index.innerHTML = Math.round(idx);
        }

        // Call the callback
        if (this.onchange) {
            this.onchange.call(this, Math.round(idx));
        }

        // Move the thumb
        if (scaled === undefined) {
            scaled = (idx - this._min) / (this._max - this._min) * this._thumbMax;
        }
        this.thumb.style[this.oh.leading] = scaled + 'px';
    },

    scrollRealContent: function (idx) {
        var containerRect = this.content.parentElement.getBoundingClientRect(),
            sizeProp = this.oh.size,
            maxScroll = Math.max(0, this.content[sizeProp] - containerRect[sizeProp]),
            //scroll = Math.min(idx, maxScroll);
            scroll = (idx - this._min) / (this._max - this._min) * maxScroll;
        //console.log('scroll: ' + scroll);
        this.content.style[this.oh.leading] = -scroll + 'px';
    },

    /**
     * @summary Recalculate thumb position.
     *
     * @desc This method recalculates the thumb size and position. Call it once after inserting your scrollbar into the DOM, and repeatedly while resizing the scrollbar (which typically happens when the scrollbar's parent is resized by user.
     *
     * > This function shifts args if first arg omitted.
     *
     * @param {number} [increment=this.increment] - Resets {@link FooBar#increment|increment} (see).
     *
     * @param {finbarStyles} [barStyles=this.barStyles] - (See type definition for details.) Scrollbar styles to be applied to the bar element.
     *
     * Only specify a `barStyles` object when you need to override stylesheet values. If provided, becomes the new default (`this.barStyles`), for use as a default on subsequent calls.
     *
     * It is generally the case that the scrollbar's new position is sufficiently described by the current styles. Therefore, it is unusual to need to provide a `barStyles` object on every call to `resize`.
     *
     * @returns {FinBar} Self for chaining.
     * @memberOf FinBar.prototype
     */
    resize: function (increment, barStyles) {
        var bar = this.bar;

        if (!bar.parentNode) {
            return; // not in DOM yet so nothing to do
        }

        var container = this.container || bar.parentElement,
            containerRect = container.getBoundingClientRect();

        // shift args if if 1st arg omitted
        if (typeof increment === 'object') {
            barStyles = increment;
            increment = undefined;
        }

        this.style = this.barStyles = barStyles || this.barStyles;

        // Bound to real content: Content was given but no onchange handler.
        // Set up .onchange, .containerSize, and .increment.
        // Note this only makes sense if your index unit is pixels.
        if (this.content) {
            if (!this.onchange) {
                this.onchange = this.scrollRealContent;
                this.contentSize = this.content[this.oh.size];
                this._min = 0;
                this._max = this.contentSize - 1;
            }
        }
        if (this.onchange === this.scrollRealContent) {
            this.containerSize = containerRect[this.oh.size];
            this.increment = this.containerSize / (this.contentSize - this.containerSize) * (this._max - this._min);
        } else {
            this.containerSize = 1;
            this.increment = increment || this.increment;
        }

        var index = this.index;
        this.testPanelItem = this.testPanelItem || this._addTestPanelItem();
        this._setThumbSize();
        this.index = index;

        if (this.deltaProp !== null) {
            container.addEventListener('wheel', this._bound.onwheel);
        }

        return this;
    },

    /**
     * @summary Shorten trailing end of scrollbar by thickness of some other scrollbar.
     * @desc In the "classical" scenario where vertical scroll bar is on the right and horizontal scrollbar is on the bottom, you want to shorten the "trailing end" (bottom and right ends, respectively) of at least one of them so they don't overlay.
     *
     * This convenience function is an programmatic alternative to hardcoding the correct style with the correct value in your stylesheet; or setting the correct style with the correct value in the {@link FinBar#barStyles|barStyles} object.
     *
     * @see {@link FinBar#foreshortenBy|foreshortenBy}.
     *
     * @param {FinBar|null} otherFinBar - Other scrollbar to avoid by shortening this one; `null` removes the trailing space
     * @returns {FinBar} For chaining
     */
    shortenBy: function (otherFinBar) { return this.shortenEndBy('trailing', otherFinBar); },

    /**
     * @summary Shorten leading end of scrollbar by thickness of some other scrollbar.
     * @desc Supports non-classical scrollbar scenarios where vertical scroll bar may be on left and horizontal scrollbar may be on top, in which case you want to shorten the "leading end" rather than the trailing end.
     * @see {@link FinBar#shortenBy|shortenBy}.
     * @param {FinBar|null} otherFinBar - Other scrollbar to avoid by shortening this one; `null` removes the trailing space
     * @returns {FinBar} For chaining
     */
    foreshortenBy: function (otherFinBar) { return this.shortenEndBy('leading', otherFinBar); },

    /**
     * @summary Generalized shortening function.
     * @see {@link FinBar#shortenBy|shortenBy}.
     * @see {@link FinBar#foreshortenBy|foreshortenBy}.
     * @param {string} whichEnd - a CSS style property name or an orientation hash name that translates to a CSS style property name.
     * @param {FinBar|null} otherFinBar - Other scrollbar to avoid by shortening this one; `null` removes the trailing space
     * @returns {FinBar} For chaining
     */
    shortenEndBy: function (whichEnd, otherFinBar) {
        if (!otherFinBar) {
            delete this._auxStyles;
        } else if (otherFinBar instanceof FinBar && otherFinBar.orientation !== this.orientation) {
            var otherStyle = window.getComputedStyle(otherFinBar.bar),
                ooh = orientationHashes[otherFinBar.orientation];
            this._auxStyles = {};
            this._auxStyles[whichEnd] = otherStyle[ooh.thickness];
        }
        return this; // for chaining
    },

    /**
     * @private
     * @summary Sets the proportional thumb size and hides thumb when 100%.
     * @desc The thumb size has an absolute minimum of 20 (pixels).
     * @memberOf FinBar.prototype
     */
    _setThumbSize: function () {
        var oh = this.oh,
            thumbComp = window.getComputedStyle(this.thumb),
            thumbMarginLeading = parseInt(thumbComp[oh.marginLeading]),
            thumbMarginTrailing = parseInt(thumbComp[oh.marginTrailing]),
            thumbMargins = thumbMarginLeading + thumbMarginTrailing,
            barSize = this.bar.getBoundingClientRect()[oh.size],
            thumbSize = Math.max(20, barSize * this.containerSize / this.contentSize);

        if (this.containerSize < this.contentSize) {
            this.bar.style.visibility = 'visible';
            this.thumb.style[oh.size] = thumbSize + 'px';
        } else {
            this.bar.style.visibility = 'hidden';
        }

        /**
         * @private
         * @name _thumbMax
         * @summary Maximum offset of thumb's leading edge.
         * @desc This is the pixel offset within the scrollbar of the thumb when it is at its maximum position at the extreme end of its range.
         *
         * This value takes into account the newly calculated size of the thumb element (including its margins) and the inner size of the scrollbar (the thumb's containing element, including _its_ margins).
         *
         * NOTE: Scrollbar padding is not taken into account and assumed to be 0 in the current implementation and is assumed to be `0`; use thumb margins in place of scrollbar padding.
         * @type {number}
         * @memberOf FinBar.prototype
         */
        this._thumbMax = barSize - thumbSize - thumbMargins;

        this._thumbMarginLeading = thumbMarginLeading; // used in mousedown
    },

    /**
     * @summary Remove the scrollbar.
     * @desc Unhooks all the event handlers and then removes the element from the DOM. Always call this method prior to disposing of the scrollbar object.
     * @memberOf FinBar.prototype
     */
    remove: function () {
        this.bar.onmousedown = null;
        this._removeEvt('mousemove');
        this._removeEvt('mouseup');

        (this.container || this.bar.parentElement)._removeEvt('wheel', this._bound.onwheel);

        this.bar.onclick =
            this.thumb.onclick =
                this.thumb.onmouseover =
                    this.thumb.transitionend =
                        this.thumb.onmouseout = null;

        this.bar.remove();
    },

    /**
     * @private
     * @function _addTestPanelItem
     * @summary Append a test panel element.
     * @desc If there is a test panel in the DOM (typically an `<ol>...</ol>` element) with class names of both `this.classPrefix` and `'test-panel'` (or, barring that, any element with class name `'test-panel'`), an `<li>...</li>` element will be created and appended to it. This new element will contain a span for each class name given.
     *
     * You should define a CSS selector `.listening` for these spans. This class will be added to the spans to alter their appearance when a listener is added with that class name (prefixed with 'on').
     *
     * (This is an internal function that is called once by the constructor on every instantiation.)
     * @returns {Element|undefined} The appended `<li>...</li>` element or `undefined` if there is no test panel.
     * @memberOf FinBar.prototype
     */
    _addTestPanelItem: function () {
        var testPanelItem,
            testPanelElement = document.querySelector('.' + this._classPrefix + '.test-panel') || document.querySelector('.test-panel');

        if (testPanelElement) {
            var testPanelItemPartNames = [ 'mousedown', 'mousemove', 'mouseup', 'index' ],
                item = document.createElement('li');

            testPanelItemPartNames.forEach(function (partName) {
                item.innerHTML += '<span class="' + partName + '">' + partName.replace('mouse', '') + '</span>';
            });

            testPanelElement.appendChild(item);

            testPanelItem = {};
            testPanelItemPartNames.forEach(function (partName) {
                testPanelItem[partName] = item.getElementsByClassName(partName)[0];
            });
        }

        return testPanelItem;
    },

    _addEvt: function (evtName) {
        var spy = this.testPanelItem && this.testPanelItem[evtName];
        if (spy) { spy.classList.add('listening'); }
        window.addEventListener(evtName, this._bound['on' + evtName]);
    },

    _removeEvt: function (evtName) {
        var spy = this.testPanelItem && this.testPanelItem[evtName];
        if (spy) { spy.classList.remove('listening'); }
        window.removeEventListener(evtName, this._bound['on' + evtName]);
    }
};

function extend(obj) {
    for (var i = 1; i < arguments.length; ++i) {
        var objn = arguments[i];
        if (objn) {
            for (var key in objn) {
                obj[key] = objn[key];
            }
        }
    }
    return obj;
}

function validRange(range) {
    var keys = Object.keys(range),
        valid =  keys.length === 2 &&
            typeof range.min === 'number' &&
            typeof range.max === 'number' &&
            range.min <= range.max;

    if (!valid) {
        error('Invalid .range object.');
    }
}

/**
 * @private
 * @name handlersToBeBound
 * @type {object}
 * @desc The functions defined in this object are all DOM event handlers that are bound by the FinBar constructor to each new instance. In other words, the `this` value of these handlers, once bound, refer to the FinBar object and not to the event emitter. "Do not consume raw."
 */
var handlersToBeBound = {
    shortStop: function (evt) {
        evt.stopPropagation();
    },

    onwheel: function (evt) {
        this.index += evt[this.deltaProp];
        evt.stopPropagation();
        evt.preventDefault();
    },

    onclick: function (evt) {
        var thumbBox = this.thumb.getBoundingClientRect(),
            goingUp = evt[this.oh.coordinate] < thumbBox[this.oh.leading];

        if (typeof this.paging === 'object') {
            this.index = this.paging[goingUp ? 'up' : 'down'](Math.round(this.index));
        } else {
            this.index += goingUp ? -this.increment : this.increment;
        }

        // make the thumb glow momentarily
        this.thumb.classList.add('hover');
        var self = this;
        this.thumb.addEventListener('transitionend', function waitForIt() {
            this.removeEventListener('transitionend', waitForIt);
            self._bound.onmouseup(evt);
        });

        evt.stopPropagation();
    },

    onmouseover: function () {
        this.thumb.classList.add('hover');
    },

    onmouseout: function () {
        this.thumb.classList.remove('hover');
    },

    onmousedown: function (evt) {
        var thumbBox = this.thumb.getBoundingClientRect();
        this.pinOffset = evt[this.oh.axis] - thumbBox[this.oh.leading] + this.bar.getBoundingClientRect()[this.oh.leading] + this._thumbMarginLeading;
        document.documentElement.style.cursor = 'default';

        this._addEvt('mousemove');
        this._addEvt('mouseup');

        evt.stopPropagation();
        evt.preventDefault();
    },

    onmousemove: function (evt) {
        var scaled = Math.min(this._thumbMax, Math.max(0, evt[this.oh.axis] - this.pinOffset));
        var idx = scaled / this._thumbMax * (this._max - this._min) + this._min;

        this._setScroll(idx, scaled);

        evt.stopPropagation();
        evt.preventDefault();
    },

    onmouseup: function (evt) {
        this._removeEvt('mousemove');
        this._removeEvt('mouseup');

        document.documentElement.style.cursor = 'auto';

        var thumbBox = this.thumb.getBoundingClientRect();
        if (
            thumbBox.left <= evt.clientX && evt.clientX <= thumbBox.right &&
            thumbBox.top <= evt.clientY && evt.clientY <= thumbBox.bottom
        ) {
            this._bound.onmouseover(evt);
        } else {
            this._bound.onmouseout(evt);
        }

        evt.stopPropagation();
        evt.preventDefault();
    }
};

var orientationHashes = {
    vertical: {
        coordinate:     'clientY',
        axis:           'pageY',
        size:           'height',
        outside:        'right',
        inside:         'left',
        leading:        'top',
        trailing:       'bottom',
        marginLeading:  'marginTop',
        marginTrailing: 'marginBottom',
        thickness:      'width',
        delta:          'deltaY'
    },
    horizontal: {
        coordinate:     'clientX',
        axis:           'pageX',
        size:           'width',
        outside:        'bottom',
        inside:         'top',
        leading:        'left',
        trailing:       'right',
        marginLeading:  'marginLeft',
        marginTrailing: 'marginRight',
        thickness:      'height',
        delta:          'deltaX'
    }
};

var axis = {
    top:    'vertical',
    bottom: 'vertical',
    height: 'vertical',
    left:   'horizontal',
    right:  'horizontal',
    width:  'horizontal'
};

var cssFinBars; // definition inserted by gulpfile between following comments
/* inject:css */
cssFinBars = 'div.finbar-horizontal,div.finbar-vertical{position:absolute;margin:3px}div.finbar-horizontal>.thumb,div.finbar-vertical>.thumb{position:absolute;background-color:#d3d3d3;-webkit-box-shadow:0 0 1px #000;-moz-box-shadow:0 0 1px #000;box-shadow:0 0 1px #000;border-radius:4px;margin:2px;opacity:.4;transition:opacity .5s}div.finbar-horizontal>.thumb.hover,div.finbar-vertical>.thumb.hover{opacity:1;transition:opacity .5s}div.finbar-vertical{top:0;bottom:0;right:0;width:11px}div.finbar-vertical>.thumb{top:0;right:0;width:7px}div.finbar-horizontal{left:0;right:0;bottom:0;height:11px}div.finbar-horizontal>.thumb{left:0;bottom:0;height:7px}';
/* endinject */

function error(msg) {
    throw 'finbars: ' + msg;
}

// Interface
module.exports = FinBar;

},{"css-injector":2}],91:[function(require,module,exports){
/* eslint-env browser */

'use strict';

var automat = require('automat');

/**
 * @summary Injects the named stylesheet into `<head>`.
 * @desc Stylesheets are inserted consecutively at end of `<head>` unless `before === true` (or omitted and `injectStylesheetTemplate.before` truthy) in which case they are inserted consecutively before first stylesheet found in `<head>` (if any) at load time.
 *
 * The calling context (`this`) is a stylesheet registry.
 * If `this` is undefined, the global stylesheet registry (css/index.js) is used.
 * @this {object}
 * @param {boolean} [before=injectStylesheetTemplate.before] - Add stylesheet before intially loaded stylesheets.
 *
 * _If omitted:_
 * 1. `id` is promoted to first argument position
 * 2. `injectStylesheetTemplate.before` is `true` by default
 * @param {string} id - The name of the style sheet in `this`, a stylesheet "registry" (hash of stylesheets).
 * @returns {Element|*}
 */
function injectStylesheetTemplate(before, id) {
    var optionalArgsStartAt, stylesheet, head, refNode, css, args,
        prefix = injectStylesheetTemplate.prefix;

    if (typeof before === 'boolean') {
        optionalArgsStartAt = 2;
    } else {
        id = before;
        before = injectStylesheetTemplate.before;
        optionalArgsStartAt = 1;
    }

    stylesheet = document.getElementById(prefix + id);

    if (!stylesheet) {
        head = document.querySelector('head');

        if (before) {
            // note position of first stylesheet
            refNode = Array.prototype.slice.call(head.children).find(function(child) {
                var id = child.getAttribute('id');
                return child.tagName === 'STYLE' && (!id || id.indexOf(prefix) !== prefix) ||
                    child.tagName === 'LINK' && child.getAttribute('rel') === 'stylesheet';
            });
        }

        css = this[id];

        if (!css) {
            throw 'Expected to find member `' + id + '` in calling context.';
        }

        args = [
            '<style>\n' + css + '\n</style>\n',
            head,
            refNode || null // explicitly null per https://developer.mozilla.org/en-US/docs/Web/API/Node/insertBefore
        ];

        if (arguments.length > 1) {
            args = args.concat(Array.prototype.slice.call(arguments, optionalArgsStartAt));
        }

        stylesheet = automat.append.apply(null, args)[0];
        stylesheet.id = prefix + id;
    }

    return stylesheet;
}

injectStylesheetTemplate.before = true;
injectStylesheetTemplate.prefix = 'injected-stylesheet-';

module.exports = injectStylesheetTemplate;

},{"automat":1}],92:[function(require,module,exports){
'use strict';

var openQuote = /["']/;
var closeQuote = {
    '"': /[^\\]"/,
    "'": /[^\\]'/
};
var emptyQuotes = /''|""/g;

function Literalz(s) {
    var i, j, qt;

    this.original = s;

    this.extractions = [];

    for (var i = 0; (j = s.substr(i).search(openQuote)) >= 0; i++) {
        i += j;
        qt = s[i++];
        j = s.substr(i).search(closeQuote[qt]);
        if (j < 0) {
            // closed quote not found
            break;
        }
        this.extractions.push(s.substr(i, ++j)); // stow literal contents sans quotes
        s = s.substr(0, i) + s.substr(i + j); // literal contents removed
    }

    this.extract = s;
}

// This is for chaining purposes, e.g., `(new Literalz('...').replace(...).replace(...).inject()`
Literalz.prototype.replace = function(a, b) {
    this.extract = this.extract.replace(a, b);
    return this;
}

Literalz.prototype.inject = function() {
    var i = 0, extractions = this.extractions;
    return this.extract.replace(emptyQuotes, function (match) {
        return match[0] + extractions[i++] + match[1];
    });
};

module.exports = Literalz;

},{}],93:[function(require,module,exports){
/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 */

/*global define: false Mustache: true*/

(function defineMustache (global, factory) {
  if (typeof exports === 'object' && exports && typeof exports.nodeName !== 'string') {
    factory(exports); // CommonJS
  } else if (typeof define === 'function' && define.amd) {
    define(['exports'], factory); // AMD
  } else {
    global.Mustache = {};
    factory(global.Mustache); // script, wsh, asp
  }
}(this, function mustacheFactory (mustache) {

  var objectToString = Object.prototype.toString;
  var isArray = Array.isArray || function isArrayPolyfill (object) {
    return objectToString.call(object) === '[object Array]';
  };

  function isFunction (object) {
    return typeof object === 'function';
  }

  /**
   * More correct typeof string handling array
   * which normally returns typeof 'object'
   */
  function typeStr (obj) {
    return isArray(obj) ? 'array' : typeof obj;
  }

  function escapeRegExp (string) {
    return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
  }

  /**
   * Null safe way of checking whether or not an object,
   * including its prototype, has a given property
   */
  function hasProperty (obj, propName) {
    return obj != null && typeof obj === 'object' && (propName in obj);
  }

  // Workaround for https://issues.apache.org/jira/browse/COUCHDB-577
  // See https://github.com/janl/mustache.js/issues/189
  var regExpTest = RegExp.prototype.test;
  function testRegExp (re, string) {
    return regExpTest.call(re, string);
  }

  var nonSpaceRe = /\S/;
  function isWhitespace (string) {
    return !testRegExp(nonSpaceRe, string);
  }

  var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  function escapeHtml (string) {
    return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap (s) {
      return entityMap[s];
    });
  }

  var whiteRe = /\s*/;
  var spaceRe = /\s+/;
  var equalsRe = /\s*=/;
  var curlyRe = /\s*\}/;
  var tagRe = /#|\^|\/|>|\{|&|=|!/;

  /**
   * Breaks up the given `template` string into a tree of tokens. If the `tags`
   * argument is given here it must be an array with two string values: the
   * opening and closing tags used in the template (e.g. [ "<%", "%>" ]). Of
   * course, the default is to use mustaches (i.e. mustache.tags).
   *
   * A token is an array with at least 4 elements. The first element is the
   * mustache symbol that was used inside the tag, e.g. "#" or "&". If the tag
   * did not contain a symbol (i.e. {{myValue}}) this element is "name". For
   * all text that appears outside a symbol this element is "text".
   *
   * The second element of a token is its "value". For mustache tags this is
   * whatever else was inside the tag besides the opening symbol. For text tokens
   * this is the text itself.
   *
   * The third and fourth elements of the token are the start and end indices,
   * respectively, of the token in the original template.
   *
   * Tokens that are the root node of a subtree contain two more elements: 1) an
   * array of tokens in the subtree and 2) the index in the original template at
   * which the closing tag for that section begins.
   */
  function parseTemplate (template, tags) {
    if (!template)
      return [];

    var sections = [];     // Stack to hold section tokens
    var tokens = [];       // Buffer to hold the tokens
    var spaces = [];       // Indices of whitespace tokens on the current line
    var hasTag = false;    // Is there a {{tag}} on the current line?
    var nonSpace = false;  // Is there a non-space char on the current line?

    // Strips all whitespace tokens array for the current line
    // if there was a {{#tag}} on it and otherwise only space.
    function stripSpace () {
      if (hasTag && !nonSpace) {
        while (spaces.length)
          delete tokens[spaces.pop()];
      } else {
        spaces = [];
      }

      hasTag = false;
      nonSpace = false;
    }

    var openingTagRe, closingTagRe, closingCurlyRe;
    function compileTags (tagsToCompile) {
      if (typeof tagsToCompile === 'string')
        tagsToCompile = tagsToCompile.split(spaceRe, 2);

      if (!isArray(tagsToCompile) || tagsToCompile.length !== 2)
        throw new Error('Invalid tags: ' + tagsToCompile);

      openingTagRe = new RegExp(escapeRegExp(tagsToCompile[0]) + '\\s*');
      closingTagRe = new RegExp('\\s*' + escapeRegExp(tagsToCompile[1]));
      closingCurlyRe = new RegExp('\\s*' + escapeRegExp('}' + tagsToCompile[1]));
    }

    compileTags(tags || mustache.tags);

    var scanner = new Scanner(template);

    var start, type, value, chr, token, openSection;
    while (!scanner.eos()) {
      start = scanner.pos;

      // Match any text between tags.
      value = scanner.scanUntil(openingTagRe);

      if (value) {
        for (var i = 0, valueLength = value.length; i < valueLength; ++i) {
          chr = value.charAt(i);

          if (isWhitespace(chr)) {
            spaces.push(tokens.length);
          } else {
            nonSpace = true;
          }

          tokens.push([ 'text', chr, start, start + 1 ]);
          start += 1;

          // Check for whitespace on the current line.
          if (chr === '\n')
            stripSpace();
        }
      }

      // Match the opening tag.
      if (!scanner.scan(openingTagRe))
        break;

      hasTag = true;

      // Get the tag type.
      type = scanner.scan(tagRe) || 'name';
      scanner.scan(whiteRe);

      // Get the tag value.
      if (type === '=') {
        value = scanner.scanUntil(equalsRe);
        scanner.scan(equalsRe);
        scanner.scanUntil(closingTagRe);
      } else if (type === '{') {
        value = scanner.scanUntil(closingCurlyRe);
        scanner.scan(curlyRe);
        scanner.scanUntil(closingTagRe);
        type = '&';
      } else {
        value = scanner.scanUntil(closingTagRe);
      }

      // Match the closing tag.
      if (!scanner.scan(closingTagRe))
        throw new Error('Unclosed tag at ' + scanner.pos);

      token = [ type, value, start, scanner.pos ];
      tokens.push(token);

      if (type === '#' || type === '^') {
        sections.push(token);
      } else if (type === '/') {
        // Check section nesting.
        openSection = sections.pop();

        if (!openSection)
          throw new Error('Unopened section "' + value + '" at ' + start);

        if (openSection[1] !== value)
          throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
      } else if (type === 'name' || type === '{' || type === '&') {
        nonSpace = true;
      } else if (type === '=') {
        // Set the tags for the next time around.
        compileTags(value);
      }
    }

    // Make sure there are no open sections when we're done.
    openSection = sections.pop();

    if (openSection)
      throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);

    return nestTokens(squashTokens(tokens));
  }

  /**
   * Combines the values of consecutive text tokens in the given `tokens` array
   * to a single token.
   */
  function squashTokens (tokens) {
    var squashedTokens = [];

    var token, lastToken;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      token = tokens[i];

      if (token) {
        if (token[0] === 'text' && lastToken && lastToken[0] === 'text') {
          lastToken[1] += token[1];
          lastToken[3] = token[3];
        } else {
          squashedTokens.push(token);
          lastToken = token;
        }
      }
    }

    return squashedTokens;
  }

  /**
   * Forms the given array of `tokens` into a nested tree structure where
   * tokens that represent a section have two additional items: 1) an array of
   * all tokens that appear in that section and 2) the index in the original
   * template that represents the end of that section.
   */
  function nestTokens (tokens) {
    var nestedTokens = [];
    var collector = nestedTokens;
    var sections = [];

    var token, section;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      token = tokens[i];

      switch (token[0]) {
        case '#':
        case '^':
          collector.push(token);
          sections.push(token);
          collector = token[4] = [];
          break;
        case '/':
          section = sections.pop();
          section[5] = token[2];
          collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens;
          break;
        default:
          collector.push(token);
      }
    }

    return nestedTokens;
  }

  /**
   * A simple string scanner that is used by the template parser to find
   * tokens in template strings.
   */
  function Scanner (string) {
    this.string = string;
    this.tail = string;
    this.pos = 0;
  }

  /**
   * Returns `true` if the tail is empty (end of string).
   */
  Scanner.prototype.eos = function eos () {
    return this.tail === '';
  };

  /**
   * Tries to match the given regular expression at the current position.
   * Returns the matched text if it can match, the empty string otherwise.
   */
  Scanner.prototype.scan = function scan (re) {
    var match = this.tail.match(re);

    if (!match || match.index !== 0)
      return '';

    var string = match[0];

    this.tail = this.tail.substring(string.length);
    this.pos += string.length;

    return string;
  };

  /**
   * Skips all text until the given regular expression can be matched. Returns
   * the skipped string, which is the entire tail if no match can be made.
   */
  Scanner.prototype.scanUntil = function scanUntil (re) {
    var index = this.tail.search(re), match;

    switch (index) {
      case -1:
        match = this.tail;
        this.tail = '';
        break;
      case 0:
        match = '';
        break;
      default:
        match = this.tail.substring(0, index);
        this.tail = this.tail.substring(index);
    }

    this.pos += match.length;

    return match;
  };

  /**
   * Represents a rendering context by wrapping a view object and
   * maintaining a reference to the parent context.
   */
  function Context (view, parentContext) {
    this.view = view;
    this.cache = { '.': this.view };
    this.parent = parentContext;
  }

  /**
   * Creates a new context using the given view with this context
   * as the parent.
   */
  Context.prototype.push = function push (view) {
    return new Context(view, this);
  };

  /**
   * Returns the value of the given name in this context, traversing
   * up the context hierarchy if the value is absent in this context's view.
   */
  Context.prototype.lookup = function lookup (name) {
    var cache = this.cache;

    var value;
    if (cache.hasOwnProperty(name)) {
      value = cache[name];
    } else {
      var context = this, names, index, lookupHit = false;

      while (context) {
        if (name.indexOf('.') > 0) {
          value = context.view;
          names = name.split('.');
          index = 0;

          /**
           * Using the dot notion path in `name`, we descend through the
           * nested objects.
           *
           * To be certain that the lookup has been successful, we have to
           * check if the last object in the path actually has the property
           * we are looking for. We store the result in `lookupHit`.
           *
           * This is specially necessary for when the value has been set to
           * `undefined` and we want to avoid looking up parent contexts.
           **/
          while (value != null && index < names.length) {
            if (index === names.length - 1)
              lookupHit = hasProperty(value, names[index]);

            value = value[names[index++]];
          }
        } else {
          value = context.view[name];
          lookupHit = hasProperty(context.view, name);
        }

        if (lookupHit)
          break;

        context = context.parent;
      }

      cache[name] = value;
    }

    if (isFunction(value))
      value = value.call(this.view);

    return value;
  };

  /**
   * A Writer knows how to take a stream of tokens and render them to a
   * string, given a context. It also maintains a cache of templates to
   * avoid the need to parse the same template twice.
   */
  function Writer () {
    this.cache = {};
  }

  /**
   * Clears all cached templates in this writer.
   */
  Writer.prototype.clearCache = function clearCache () {
    this.cache = {};
  };

  /**
   * Parses and caches the given `template` and returns the array of tokens
   * that is generated from the parse.
   */
  Writer.prototype.parse = function parse (template, tags) {
    var cache = this.cache;
    var tokens = cache[template];

    if (tokens == null)
      tokens = cache[template] = parseTemplate(template, tags);

    return tokens;
  };

  /**
   * High-level method that is used to render the given `template` with
   * the given `view`.
   *
   * The optional `partials` argument may be an object that contains the
   * names and templates of partials that are used in the template. It may
   * also be a function that is used to load partial templates on the fly
   * that takes a single argument: the name of the partial.
   */
  Writer.prototype.render = function render (template, view, partials) {
    var tokens = this.parse(template);
    var context = (view instanceof Context) ? view : new Context(view);
    return this.renderTokens(tokens, context, partials, template);
  };

  /**
   * Low-level method that renders the given array of `tokens` using
   * the given `context` and `partials`.
   *
   * Note: The `originalTemplate` is only ever used to extract the portion
   * of the original template that was contained in a higher-order section.
   * If the template doesn't use higher-order sections, this argument may
   * be omitted.
   */
  Writer.prototype.renderTokens = function renderTokens (tokens, context, partials, originalTemplate) {
    var buffer = '';

    var token, symbol, value;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      value = undefined;
      token = tokens[i];
      symbol = token[0];

      if (symbol === '#') value = this.renderSection(token, context, partials, originalTemplate);
      else if (symbol === '^') value = this.renderInverted(token, context, partials, originalTemplate);
      else if (symbol === '>') value = this.renderPartial(token, context, partials, originalTemplate);
      else if (symbol === '&') value = this.unescapedValue(token, context);
      else if (symbol === 'name') value = this.escapedValue(token, context);
      else if (symbol === 'text') value = this.rawValue(token);

      if (value !== undefined)
        buffer += value;
    }

    return buffer;
  };

  Writer.prototype.renderSection = function renderSection (token, context, partials, originalTemplate) {
    var self = this;
    var buffer = '';
    var value = context.lookup(token[1]);

    // This function is used to render an arbitrary template
    // in the current context by higher-order sections.
    function subRender (template) {
      return self.render(template, context, partials);
    }

    if (!value) return;

    if (isArray(value)) {
      for (var j = 0, valueLength = value.length; j < valueLength; ++j) {
        buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate);
      }
    } else if (typeof value === 'object' || typeof value === 'string' || typeof value === 'number') {
      buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate);
    } else if (isFunction(value)) {
      if (typeof originalTemplate !== 'string')
        throw new Error('Cannot use higher-order sections without the original template');

      // Extract the portion of the original template that the section contains.
      value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender);

      if (value != null)
        buffer += value;
    } else {
      buffer += this.renderTokens(token[4], context, partials, originalTemplate);
    }
    return buffer;
  };

  Writer.prototype.renderInverted = function renderInverted (token, context, partials, originalTemplate) {
    var value = context.lookup(token[1]);

    // Use JavaScript's definition of falsy. Include empty arrays.
    // See https://github.com/janl/mustache.js/issues/186
    if (!value || (isArray(value) && value.length === 0))
      return this.renderTokens(token[4], context, partials, originalTemplate);
  };

  Writer.prototype.renderPartial = function renderPartial (token, context, partials) {
    if (!partials) return;

    var value = isFunction(partials) ? partials(token[1]) : partials[token[1]];
    if (value != null)
      return this.renderTokens(this.parse(value), context, partials, value);
  };

  Writer.prototype.unescapedValue = function unescapedValue (token, context) {
    var value = context.lookup(token[1]);
    if (value != null)
      return value;
  };

  Writer.prototype.escapedValue = function escapedValue (token, context) {
    var value = context.lookup(token[1]);
    if (value != null)
      return mustache.escape(value);
  };

  Writer.prototype.rawValue = function rawValue (token) {
    return token[1];
  };

  mustache.name = 'mustache.js';
  mustache.version = '2.3.0';
  mustache.tags = [ '{{', '}}' ];

  // All high-level mustache.* functions use this writer.
  var defaultWriter = new Writer();

  /**
   * Clears all cached templates in the default writer.
   */
  mustache.clearCache = function clearCache () {
    return defaultWriter.clearCache();
  };

  /**
   * Parses and caches the given template in the default writer and returns the
   * array of tokens it contains. Doing this ahead of time avoids the need to
   * parse templates on the fly as they are rendered.
   */
  mustache.parse = function parse (template, tags) {
    return defaultWriter.parse(template, tags);
  };

  /**
   * Renders the `template` with the given `view` and `partials` using the
   * default writer.
   */
  mustache.render = function render (template, view, partials) {
    if (typeof template !== 'string') {
      throw new TypeError('Invalid template! Template should be a "string" ' +
                          'but "' + typeStr(template) + '" was given as the first ' +
                          'argument for mustache#render(template, view, partials)');
    }

    return defaultWriter.render(template, view, partials);
  };

  // This is here for backwards compatibility with 0.4.x.,
  /*eslint-disable */ // eslint wants camel cased function name
  mustache.to_html = function to_html (template, view, partials, send) {
    /*eslint-enable*/

    var result = mustache.render(template, view, partials);

    if (isFunction(send)) {
      send(result);
    } else {
      return result;
    }
  };

  // Export the escaping function so that the user may override it.
  // See https://github.com/janl/mustache.js/issues/244
  mustache.escape = escapeHtml;

  // Export these mainly for testing, but also for advanced usage.
  mustache.Scanner = Scanner;
  mustache.Context = Context;
  mustache.Writer = Writer;

  return mustache;
}));

},{}],94:[function(require,module,exports){
/* object-iterators.js - Mini Underscore library
 * by Jonathan Eiten
 *
 * The methods below operate on objects (but not arrays) similarly
 * to Underscore (http://underscorejs.org/#collections).
 *
 * For more information:
 * https://github.com/joneit/object-iterators
 */

'use strict';

/**
 * @constructor
 * @summary Wrap an object for one method call.
 * @Desc Note that the `new` keyword is not necessary.
 * @param {object|null|undefined} object - `null` or `undefined` is treated as an empty plain object.
 * @return {Wrapper} The wrapped object.
 */
function Wrapper(object) {
    if (object instanceof Wrapper) {
        return object;
    }
    if (!(this instanceof Wrapper)) {
        return new Wrapper(object);
    }
    this.originalValue = object;
    this.o = object || {};
}

/**
 * @name Wrapper.chain
 * @summary Wrap an object for a chain of method calls.
 * @Desc Calls the constructor `Wrapper()` and modifies the wrapper for chaining.
 * @param {object} object
 * @return {Wrapper} The wrapped object.
 */
Wrapper.chain = function (object) {
    var wrapped = Wrapper(object); // eslint-disable-line new-cap
    wrapped.chaining = true;
    return wrapped;
};

Wrapper.prototype = {
    /**
     * Unwrap an object wrapped with {@link Wrapper.chain|Wrapper.chain()}.
     * @return {object|null|undefined} The value originally wrapped by the constructor.
     * @memberOf Wrapper.prototype
     */
    value: function () {
        return this.originalValue;
    },

    /**
     * @desc Mimics Underscore's [each](http://underscorejs.org/#each) method: Iterate over the members of the wrapped object, calling `iteratee()` with each.
     * @param {function} iteratee - For each member of the wrapped object, this function is called with three arguments: `(value, key, object)`. The return value of this function is undefined; an `.each` loop cannot be broken out of (use {@link Wrapper#find|.find} instead).
     * @param {object} [context] - If given, `iteratee` is bound to this object. In other words, this object becomes the `this` value in the calls to `iteratee`. (Otherwise, the `this` value will be the unwrapped object.)
     * @return {Wrapper} The wrapped object for chaining.
     * @memberOf Wrapper.prototype
     */
    each: function (iteratee, context) {
        var o = this.o;
        Object.keys(o).forEach(function (key) {
            iteratee.call(this, o[key], key, o);
        }, context || o);
        return this;
    },

    /**
     * @desc Mimics Underscore's [find](http://underscorejs.org/#find) method: Look through each member of the wrapped object, returning the first one that passes a truth test (`predicate`), or `undefined` if no value passes the test. The function returns the value of the first acceptable member, and doesn't necessarily traverse the entire object.
     * @param {function} predicate - For each member of the wrapped object, this function is called with three arguments: `(value, key, object)`. The return value of this function should be truthy if the member passes the test and falsy otherwise.
     * @param {object} [context] - If given, `predicate` is bound to this object. In other words, this object becomes the `this` value in the calls to `predicate`. (Otherwise, the `this` value will be the unwrapped object.)
     * @return {*} The found property's value, or undefined if not found.
     * @memberOf Wrapper.prototype
     */
    find: function (predicate, context) {
        var o = this.o;
        var result;
        if (o) {
            result = Object.keys(o).find(function (key) {
                return predicate.call(this, o[key], key, o);
            }, context || o);
            if (result !== undefined) {
                result = o[result];
            }
        }
        return result;
    },

    /**
     * @desc Mimics Underscore's [filter](http://underscorejs.org/#filter) method: Look through each member of the wrapped object, returning the values of all members that pass a truth test (`predicate`), or empty array if no value passes the test. The function always traverses the entire object.
     * @param {function} predicate - For each member of the wrapped object, this function is called with three arguments: `(value, key, object)`. The return value of this function should be truthy if the member passes the test and falsy otherwise.
     * @param {object} [context] - If given, `predicate` is bound to this object. In other words, this object becomes the `this` value in the calls to `predicate`. (Otherwise, the `this` value will be the unwrapped object.)
     * @return {*} An array containing the filtered values.
     * @memberOf Wrapper.prototype
     */
    filter: function (predicate, context) {
        var o = this.o;
        var result = [];
        if (o) {
            Object.keys(o).forEach(function (key) {
                if (predicate.call(this, o[key], key, o)) {
                    result.push(o[key]);
                }
            }, context || o);
        }
        return result;
    },

    /**
     * @desc Mimics Underscore's [map](http://underscorejs.org/#map) method: Produces a new array of values by mapping each value in list through a transformation function (`iteratee`). The function always traverses the entire object.
     * @param {function} iteratee - For each member of the wrapped object, this function is called with three arguments: `(value, key, object)`. The return value of this function is concatenated to the end of the new array.
     * @param {object} [context] - If given, `iteratee` is bound to this object. In other words, this object becomes the `this` value in the calls to `predicate`. (Otherwise, the `this` value will be the unwrapped object.)
     * @return {*} An array containing the filtered values.
     * @memberOf Wrapper.prototype
     */
    map: function (iteratee, context) {
        var o = this.o;
        var result = [];
        if (o) {
            Object.keys(o).forEach(function (key) {
                result.push(iteratee.call(this, o[key], key, o));
            }, context || o);
        }
        return result;
    },

    /**
     * @desc Mimics Underscore's [reduce](http://underscorejs.org/#reduce) method: Boil down the values of all the members of the wrapped object into a single value. `memo` is the initial state of the reduction, and each successive step of it should be returned by `iteratee()`.
     * @param {function} iteratee - For each member of the wrapped object, this function is called with four arguments: `(memo, value, key, object)`. The return value of this function becomes the new value of `memo` for the next iteration.
     * @param {*} [memo] - If no memo is passed to the initial invocation of reduce, the iteratee is not invoked on the first element of the list. The first element is instead passed as the memo in the invocation of the iteratee on the next element in the list.
     * @param {object} [context] - If given, `iteratee` is bound to this object. In other words, this object becomes the `this` value in the calls to `iteratee`. (Otherwise, the `this` value will be the unwrapped object.)
     * @return {*} The value of `memo` "reduced" as per `iteratee`.
     * @memberOf Wrapper.prototype
     */
    reduce: function (iteratee, memo, context) {
        var o = this.o;
        if (o) {
            Object.keys(o).forEach(function (key, idx) {
                memo = (!idx && memo === undefined) ? o[key] : iteratee(memo, o[key], key, o);
            }, context || o);
        }
        return memo;
    },

    /**
     * @desc Mimics Underscore's [extend](http://underscorejs.org/#extend) method: Copy all of the properties in each of the `source` object parameter(s) over to the (wrapped) destination object (thus mutating it). It's in-order, so the properties of the last `source` object will override properties with the same name in previous arguments or in the destination object.
     * > This method copies own members as well as members inherited from prototype chain.
     * @param {...object|null|undefined} source - Values of `null` or `undefined` are treated as empty plain objects.
     * @return {Wrapper|object} The wrapped destination object if chaining is in effect; otherwise the unwrapped destination object.
     * @memberOf Wrapper.prototype
     */
    extend: function (source) {
        var o = this.o;
        Array.prototype.slice.call(arguments).forEach(function (object) {
            if (object) {
                for (var key in object) {
                    o[key] = object[key];
                }
            }
        });
        return this.chaining ? this : o;
    },

    /**
     * @desc Mimics Underscore's [extendOwn](http://underscorejs.org/#extendOwn) method: Like {@link Wrapper#extend|extend}, but only copies its "own" properties over to the destination object.
     * @param {...object|null|undefined} source - Values of `null` or `undefined` are treated as empty plain objects.
     * @return {Wrapper|object} The wrapped destination object if chaining is in effect; otherwise the unwrapped destination object.
     * @memberOf Wrapper.prototype
     */
    extendOwn: function (source) {
        var o = this.o;
        Array.prototype.slice.call(arguments).forEach(function (object) {
            Wrapper(object).each(function (val, key) { // eslint-disable-line new-cap
                o[key] = val;
            });
        });
        return this.chaining ? this : o;
    }
};

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
if (!Array.prototype.find) {
    Array.prototype.find = function (predicate) { // eslint-disable-line no-extend-native
        if (this === null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}

module.exports = Wrapper;

},{}],95:[function(require,module,exports){
'use strict';

/** @module overrider */

/**
 * Mixes members of all `sources` into `target`, handling getters and setters properly.
 *
 * Any number of `sources` objects may be given and each is copied in turn.
 *
 * @example
 * var overrider = require('overrider');
 * var target = { a: 1 }, source1 = { b: 2 }, source2 = { c: 3 };
 * target === overrider(target, source1, source2); // true
 * // target object now has a, b, and c; source objects untouched
 *
 * @param {object} object - The target object to receive sources.
 * @param {...object} [sources] - Object(s) containing members to copy to `target`. (Omitting is a no-op.)
 * @returns {object} The target object (`target`)
 */
function overrider(target, sources) { // eslint-disable-line no-unused-vars
    for (var i = 1; i < arguments.length; ++i) {
        mixIn.call(target, arguments[i]);
    }

    return target;
}

/**
 * Mix `this` members into `target`.
 *
 * @example
 * // A. Simple usage (using .call):
 * var mixInTo = require('overrider').mixInTo;
 * var target = { a: 1 }, source = { b: 2 };
 * target === overrider.mixInTo.call(source, target); // true
 * // target object now has both a and b; source object untouched
 *
 * @example
 * // B. Semantic usage (when the source hosts the method):
 * var mixInTo = require('overrider').mixInTo;
 * var target = { a: 1 }, source = { b: 2, mixInTo: mixInTo };
 * target === source.mixInTo(target); // true
 * // target object now has both a and b; source object untouched
 *
 * @this {object} Target.
 * @param target
 * @returns {object} The target object (`target`)
 * @memberOf module:overrider
 */
function mixInTo(target) {
    var descriptor;
    for (var key in this) {
        if ((descriptor = Object.getOwnPropertyDescriptor(this, key))) {
            Object.defineProperty(target, key, descriptor);
        }
    }
    return target;
}

/**
 * Mix `source` members into `this`.
 *
 * @example
 * // A. Simple usage (using .call):
 * var mixIn = require('overrider').mixIn;
 * var target = { a: 1 }, source = { b: 2 };
 * target === overrider.mixIn.call(target, source) // true
 * // target object now has both a and b; source object untouched
 *
 * @example
 * // B. Semantic usage (when the target hosts the method):
 * var mixIn = require('overrider').mixIn;
 * var target = { a: 1, mixIn: mixIn }, source = { b: 2 };
 * target === target.mixIn(source) // true
 * // target now has both a and b (and mixIn); source untouched
 *
 * @param source
 * @returns {object} The target object (`this`)
 * @memberOf overrider
 * @memberOf module:overrider
 */
function mixIn(source) {
    var descriptor;
    for (var key in source) {
        if ((descriptor = Object.getOwnPropertyDescriptor(source, key))) {
            Object.defineProperty(this, key, descriptor);
        }
    }
    return this;
}

overrider.mixInTo = mixInTo;
overrider.mixIn = mixIn;

module.exports = overrider;

},{}],96:[function(require,module,exports){
'use strict';

// converts traditional expression syntax to JavaScript

module.exports = function(literalz) {
    return literalz
        .replace(/\band\b/gi, '&&')
        .replace(/\bor\b/gi, '||')
        .replace(/\bnot\b/gi, '!')
        .replace(/([^<>!=])=([^=])/g, '$1===$2')
        .replace(/<>/g, '!==');
};

},{}],97:[function(require,module,exports){
'use strict';

module.exports = {

    javascript: function(expression) {
        return expression;
    },

    traditional: require('./SQL-to-JS.js')

};

},{"./SQL-to-JS.js":96}],98:[function(require,module,exports){
'use strict';

var Literalz = require('literalz');

var converters = require('./converters');

function compile(expression, options) {
    var predicate;

    if (expression) {
        var literalz = new Literalz(expression);

        options = options || {};

        // convert expression to JavaScript syntax
        if (options.syntax) {
            var converter = converters[options.syntax];
            if (!converter) {
                throw new ReferenceError('Syntax converter ' + options.syntax + ' not defined.');
            }
            expression = converter(literalz).inject();
        }

        // Check expression for assignment operator
        if (!options.assignments) {
            throwErrorOnAssign(literalz.extract)
        }

        // Check expression for reference errors
        if (options.keys) {
            throwErrorOnUndefinedColumnName(options.keys, literalz.extract);
        }

        // Following will throw SyntaxError on bad expression
        predicate = new Function('domain', 'with(domain){return (' + expression + ')}');
    }

    return predicate;
}

// Throws ReferenceError on unknown variable (including global object and properties thereof)
function throwErrorOnUndefinedColumnName(keys, extract) {
    var regexRefs = /([a-zA-Z$_][\w$]+)(\s*\.\s*[a-zA-Z$_][\w$]+)*/g, // identifier[.identifier]...
        parts, variable;

    keys = keys.concat(['true', 'false']);

    // search for variable references, excluding property references (with dot operator prefix)
    while ((parts = regexRefs.exec(extract))) {
        variable = parts[1];
        if (keys.indexOf(variable) < 0) {
            throw new ReferenceError(variable + ' not defined.');
        }
    }
}

function throwErrorOnAssign(extract) {
    if (/[^<>!=]=[^=]/.test(extract)) {
        throw new SyntaxError('Unexpected assignment operator in expression.');
    }
}

module.exports = {
    compile: compile,
    converters: converters
};

},{"./converters":97,"literalz":92}],99:[function(require,module,exports){
'use strict';

/* eslint-env node, browser */

/**
 * Creates a new read-only property and attaches it to the provided context.
 * @private
 * @param {string} name - Name for new property.
 * @param {*} [value] - Value of new property.
 */
function addReadOnlyProperty(name, value) {
    Object.defineProperty(this, name, {
        value: value,
        writable: false,
        enumerable: true,
        configurable: false
    });
}

/**
 * @constructor Point
 *
 * @desc This object represents a single point in an abstract 2-dimensional matrix.
 *
 * The unit of measure is typically pixels.
 * (If used to model computer graphics, vertical coordinates are typically measured downwards
 * from the top of the window. This convention however is not inherent in this object.)
 *
 * Note: This object should be instantiated with the `new` keyword.
 *
 * @param {number} x - the new point's `x` property
 * @param {number} y - the new point's `y` property
 */
function Point(x, y) {

    /**
     * @name x
     * @type {number}
     * @summary This point's horizontal coordinate.
     * @desc Created upon instantiation by the {@link Point|constructor}.
     * @memberOf Point.prototype
     * @abstract
     */
    addReadOnlyProperty.call(this, 'x', Number(x) || 0);

    /**
     * @name y
     * @type {number}
     * @summary This point's vertical coordinate.
     * @desc Created upon instantiation by the {@link Point|constructor}.
     * @memberOf Point.prototype
     * @abstract
     */
    addReadOnlyProperty.call(this, 'y', Number(y) || 0);

}

Point.prototype = {

    /**
     * @returns {Point} A new point which is this point's position increased by coordinates of given `offset`.
     * @param {Point} offset - Horizontal and vertical values to add to this point's coordinates.
     * @memberOf Point.prototype
     */
    plus: function(offset) {
        return new Point(
            this.x + offset.x,
            this.y + offset.y
        );
    },

    /**
     * @returns {Point} A new point which is this point's position increased by given offsets.
     * @param {number} [offsetX=0] - Value to add to this point's horizontal coordinate.
     * @param {number} [offsetY=0] - Value to add to this point's horizontal coordinate.
     * @memberOf Point.prototype
     */
    plusXY: function(offsetX, offsetY) {
        return new Point(
            this.x + (offsetX || 0),
            this.y + (offsetY || 0)
        );
    },

    /**
     * @returns {Point} A new point which is this point's position decreased by coordinates of given `offset`.
     * @param {Point} offset - Horizontal and vertical values to subtract from this point's coordinates.
     * @memberOf Point.prototype
     */
    minus: function(offset) {
        return new Point(
            this.x - offset.x,
            this.y - offset.y
        );
    },

    /**
     * @returns {Point} A new `Point` positioned to least x and least y of this point and given `offset`.
     * @param {Point} point - A point to compare to this point.
     * @memberOf Point.prototype
     */
    min: function(point) {
        return new Point(
            Math.min(this.x, point.x),
            Math.min(this.y, point.y)
        );
    },

    /**
     * @returns {Point} A new `Point` positioned to greatest x and greatest y of this point and given `point`.
     * @param {Point} point - A point to compare to this point.
     * @memberOf Point.prototype
     */
    max: function(point) {
        return new Point(
            Math.max(this.x, point.x),
            Math.max(this.y, point.y)
        );
    },

    /**
     * @returns {number} Distance between given `point` and this point using Pythagorean Theorem formula.
     * @param {Point} point - A point from which to compute the distance to this point.
     * @memberOf Point.prototype
     */
    distance: function(point) {
        var deltaX = point.x - this.x,
            deltaY = point.y - this.y;

        return Math.sqrt(
            deltaX * deltaX +
            deltaY * deltaY
        );
    },

    /**
     * _(Formerly: `equal`.)_
     * @returns {boolean} `true` iff _both_ coordinates of this point are exactly equal to those of given `point`.
     * @param {Point} point - A point to compare to this point.
     * @memberOf Point.prototype
     */
    equals: function(point) {
        var result = false;

        if (point) {
            result =
                this.x === point.x &&
                this.y === point.y;
        }

        return result;
    },

    /**
     * @returns {boolean} `true` iff _both_ coordinates of this point are greater than those of given `point`.
     * @param {Point} point - A point to compare to this point
     * @memberOf Point.prototype
     */
    greaterThan: function(point) {
        return (
            this.x > point.x &&
            this.y > point.y
        );
    },

    /**
     * @returns {boolean} `true` iff _both_ coordinates of this point are less than those of given `point`.
     * @param {Point} point - A point to compare to this point
     * @memberOf Point.prototype
     */
    lessThan: function(point) {
        return (
            this.x < point.x &&
            this.y < point.y
        );
    },

    /**
     * _(Formerly `greaterThanEqualTo`.)_
     * @returns {boolean} `true` iff _both_ coordinates of this point are greater than or equal to those of given `point`.
     * @param {Point} point - A point to compare to this point
     * @memberOf Point.prototype
     */
    greaterThanOrEqualTo: function(point) {
        return (
            this.x >= point.x &&
            this.y >= point.y
        );
    },

    /**
     * _(Formerly `lessThanEqualTo`.)_
     * @returns {boolean} `true` iff _both_ coordinates of this point are less than or equal to those of given `point`.
     * @param {Point} point - A point to compare to this point.
     * @memberOf Point.prototype
     */
    lessThanOrEqualTo: function(point) {
        return (
            this.x <= point.x &&
            this.y <= point.y
        );
    },

    /**
     * _(Formerly `isContainedWithinRectangle`.)_
     * @param rect {Rectangle} - Rectangle to test this point against.
     * @returns {boolean} `true` iff this point is within given `rect`.
     * @memberOf Point.prototype
     */
    within: function(rect) {
        var minX = rect.origin.x,
            maxX = minX + rect.extent.x;
        var minY = rect.origin.y,
            maxY = minY + rect.extent.y;

        if (rect.extent.x < 0) {
            minX = maxX;
            maxX = rect.origin.x;
        }

        if (rect.extent.y < 0) {
            minY = maxY;
            maxY = rect.origin.y;
        }

        return (
            minX <= this.x && this.x < maxX &&
            minY <= this.y && this.y < maxY
        );
    }
};

Point.prototype.EQ = Point.prototype.equals;
Point.prototype.GT = Point.prototype.greaterThan;
Point.prototype.LT = Point.prototype.lessThan;
Point.prototype.GE = Point.prototype.greaterThanOrEqualTo;
Point.prototype.LE = Point.prototype.lessThanOrEqualTo;


/**
 * @constructor Rectangle
 *
 * @desc This object represents a rectangular area within an abstract 2-dimensional matrix.
 *
 * The unit of measure is typically pixels.
 * (If used to model computer graphics, vertical coordinates are typically measured downwards
 * from the top of the window. This convention however is not inherent in this object.)
 *
 * Normally, the `x` and `y` parameters to the constructor describe the upper left corner of the rect.
 * However, negative values of `width` and `height` will be added to the given `x` and `y`. That is,
 * a negative value of the `width` parameter will extend the rect to the left of the given `x` and
 * a negative value of the `height` parameter will extend the rect above the given `y`.
 * In any case, after instantiation the following are guaranteed to always be true:
 * * The `extent`, `width`, and `height` properties _always_ give positive values.
 * * The `origin`, `top`, and `left` properties _always_ reflect the upper left corner.
 * * The `corner`, `bottom`, and `right` properties _always_ reflect the lower right corner.
 *
 * Note: This object should be instantiated with the `new` keyword.
 *
 * @param {number} [x=0] - Horizontal coordinate of some corner of the rect.
 * @param {number} [y=0] - Vertical coordinate of some corner of the rect.
 * @param {number} [width=0] - Width of the new rect. May be negative (see above).
 * @param {number} [height=0] - Height of the new rect. May be negative (see above).
 */
function Rectangle(x, y, width, height) {

    x = Number(x) || 0;
    y = Number(y) || 0;
    width = Number(width) || 0;
    height = Number(height) || 0;

    if (width < 0) {
        x += width;
        width = -width;
    }

    if (height < 0) {
        y += height;
        height = -height;
    }

    /**
     * @name origin
     * @type {Point}
     * @summary Upper left corner of this rect.
     * @desc Created upon instantiation by the {@linkplain Rectangle|constructor}.
     * @memberOf Rectangle.prototype
     * @abstract
     */
    addReadOnlyProperty.call(this, 'origin', new Point(x, y));

    /**
     * @name extent
     * @type {Point}
     * @summary this rect's width and height.
     * @desc Unlike the other `Point` properties, `extent` is not a global coordinate pair; rather it consists of a _width_ (`x`, always positive) and a _height_ (`y`, always positive).
     *
     * This object might be more legitimately typed as something like `Area` with properties `width` and `height`; however we wanted it to be able to use it efficiently with a point's `plus` and `minus` methods (that is, without those methods having to check and branch on the type of its parameter).
     *
     * Created upon instantiation by the {@linkplain Rectangle|constructor}.
     * @see The {@link Rectangle#corner|corner} method.
     * @memberOf Rectangle.prototype
     * @abstract
     */
    addReadOnlyProperty.call(this, 'extent', new Point(width, height));

    /**
     * @name corner
     * @type {Point}
     * @summary Lower right corner of this rect.
     * @desc This is a calculated value created upon instantiation by the {@linkplain Rectangle|constructor}. It is `origin` offset by `extent`.
     *
     * **Note:** These coordinates actually point to the pixel one below and one to the right of the rect's actual lower right pixel.
     * @memberOf Rectangle.prototype
     * @abstract
     */
    addReadOnlyProperty.call(this, 'corner', new Point(x + width, y + height));

    /**
     * @name center
     * @type {Point}
     * @summary Center of this rect.
     * @desc Created upon instantiation by the {@linkplain Rectangle|constructor}.
     * @memberOf Rectangle.prototype
     * @abstract
     */
    addReadOnlyProperty.call(this, 'center', new Point(x + (width / 2), y + (height / 2)));

}

Rectangle.prototype = {

    /**
     * @type {number}
     * @desc _(Formerly a function; now a getter.)_
     * @summary Minimum vertical coordinate of this rect.
     * @memberOf Rectangle.prototype
     */
    get top() {
        return this.origin.y;
    },

    /**
     * @type {number}
     * @desc _(Formerly a function; now a getter.)_
     * @summary Minimum horizontal coordinate of this rect.
     * @memberOf Rectangle.prototype
     */
    get left() {
        return this.origin.x;
    },

    /**
     * @type {number}
     * @desc _(Formerly a function; now a getter.)_
     * @summary Maximum vertical coordinate of this rect + 1.
     * @memberOf Rectangle.prototype
     */
    get bottom() {
        return this.corner.y;
    },

    /**
     * @type {number}
     * @desc _(Formerly a function; now a getter.)_
     * @summary Maximum horizontal coordinate of this rect + 1.
     * @memberOf Rectangle.prototype
     */
    get right() {
        return this.corner.x;
    },

    /**
     * @type {number}
     * @desc _(Formerly a function; now a getter.)_
     * @summary Width of this rect (always positive).
     * @memberOf Rectangle.prototype
     */
    get width() {
        return this.extent.x;
    },

    /**
     * @type {number}
     * @desc _(Formerly a function; now a getter.)_
     * @summary Height of this rect (always positive).
     * @memberOf Rectangle.prototype
     */
    get height() {
        return this.extent.y;
    },

    /**
     * @type {number}
     * @desc _(Formerly a function; now a getter.)_
     * @summary Area of this rect.
     * @memberOf Rectangle.prototype
     */
    get area() {
        return this.width * this.height;
    },

    /**
     * @returns {Rectangle} A copy of this rect but with horizontal position reset to given `x` and no width.
     * @param {number} x - Horizontal coordinate of the new rect.
     * @memberOf Rectangle.prototype
     */
    flattenXAt: function(x) {
        return new Rectangle(x, this.origin.y, 0, this.extent.y);
    },

    /**
     * @returns {Rectangle} A copy of this rect but with vertical position reset to given `y` and no height.
     * @param {number} y - Vertical coordinate of the new rect.
     * @memberOf Rectangle.prototype
     */
    flattenYAt: function(y) {
        return new Rectangle(this.origin.x, y, this.extent.x, 0);
    },

    /**
     * @returns {boolean} `true` iff given `point` entirely contained within this rect.
     * @param {Point} pointOrRect - The point or rect to test for containment.
     * @memberOf Rectangle.prototype
     */
    contains: function(pointOrRect) {
        return pointOrRect.within(this);
    },

    /**
     * _(Formerly `isContainedWithinRectangle`.)_
     * @returns {boolean} `true` iff `this` rect is entirely contained within given `rect`.
     * @param {Rectangle} rect - Rectangle to test against this rect.
     * @memberOf Rectangle.prototype
     */
    within: function(rect) {
        return (
            rect.origin.lessThanOrEqualTo(this.origin) &&
            rect.corner.greaterThanOrEqualTo(this.corner)
        );
    },

    /**
     * _(Formerly: `insetBy`.)_
     * @returns {Rectangle} That is enlarged/shrunk by given `padding`.
     * @param {number} padding - Amount by which to increase (+) or decrease (-) this rect
     * @see The {@link Rectangle#shrinkBy|shrinkBy} method.
     * @memberOf Rectangle.prototype
     */
    growBy: function(padding) {
        return new Rectangle(
            this.origin.x + padding,
            this.origin.y + padding,
            this.extent.x - padding - padding,
            this.extent.y - padding - padding);
    },

    /**
     * @returns {Rectangle} That is enlarged/shrunk by given `padding`.
     * @param {number} padding - Amount by which to decrease (+) or increase (-) this rect.
     * @see The {@link Rectangle#growBy|growBy} method.
     * @memberOf Rectangle.prototype
     */
    shrinkBy: function(padding) {
        return this.growBy(-padding);
    },

    /**
     * @returns {Rectangle} Bounding rect that contains both this rect and the given `rect`.
     * @param {Rectangle} rect - The rectangle to union with this rect.
     * @memberOf Rectangle.prototype
     */
    union: function(rect) {
        var origin = this.origin.min(rect.origin),
            corner = this.corner.max(rect.corner),
            extent = corner.minus(origin);

        return new Rectangle(
            origin.x, origin.y,
            extent.x, extent.y
        );
    },

    /**
     * iterate over all points within this rect, invoking `iteratee` for each.
     * @param {function(number,number)} iteratee - Function to call for each point.
     * Bound to `context` when given; otherwise it is bound to this rect.
     * Each invocation of `iteratee` is called with two arguments:
     * the horizontal and vertical coordinates of the point.
     * @param {object} [context=this] - Context to bind to `iteratee` (when not `this`).
     * @memberOf Rectangle.prototype
     */
    forEach: function(iteratee, context) {
        context = context || this;
        for (var x = this.origin.x, x2 = this.corner.x; x < x2; x++) {
            for (var y = this.origin.y, y2 = this.corner.y; y < y2; y++) {
                iteratee.call(context, x, y);
            }
        }
    },

    /**
     * @returns {Rectangle} One of:
     * * _If this rect intersects with the given `rect`:_
     *      a new rect representing that intersection.
     * * _If it doesn't intersect and `ifNoneAction` defined:_
     *      result of calling `ifNoneAction`.
     * * _If it doesn't intersect and `ifNoneAction` undefined:_
     *      `null`.
     * @param {Rectangle} rect - The rectangle to intersect with this rect.
     * @param {function(Rectangle)} [ifNoneAction] - When no intersection, invoke and return result.
     * Bound to `context` when given; otherwise bound to this rect.
     * Invoked with `rect` as sole parameter.
     * @param {object} [context=this] - Context to bind to `ifNoneAction` (when not `this`).
     * @memberOf Rectangle.prototype
     */
    intersect: function(rect, ifNoneAction, context) {
        var result = null,
            origin = this.origin.max(rect.origin),
            corner = this.corner.min(rect.corner),
            extent = corner.minus(origin);

        if (extent.x > 0 && extent.y > 0) {
            result = new Rectangle(
                origin.x, origin.y,
                extent.x, extent.y
            );
        } else if (typeof ifNoneAction === 'function') {
            result = ifNoneAction.call(context || this, rect);
        }

        return result;
    },

    /**
     * @returns {boolean} `true` iff this rect overlaps with given `rect`.
     * @param {Rectangle} rect - The rectangle to intersect with this rect.
     * @memberOf Rectangle.prototype
     */
    intersects: function(rect) {
        return (
            rect.corner.x > this.origin.x &&
            rect.corner.y > this.origin.y &&
            rect.origin.x < this.corner.x &&
            rect.origin.y < this.corner.y
        );
    }
};

// Interface
exports.Point = Point;
exports.Rectangle = Rectangle;

},{}],100:[function(require,module,exports){
'use strict';

/* eslint-env node, browser */

(function (module) {  // eslint-disable-line no-unused-expressions

    // This closure supports NodeJS-less client side includes with <script> tags. See https://github.com/joneit/mnm.

    /**
     * @constructor RangeSelectionModel
     *
     * @desc This object models selection of "cells" within an abstract single-dimensional matrix.
     *
     * Disjoint selections can be built with calls to the following methods:
     * * {@link RangeSelectionModel#select|select(start, stop)} - Add a range to the matrix.
     * * {@link RangeSelectionModel#deselect|deselect(start, stop)} - Remove a range from the matrix.
     *
     * Two more methods are available:
     * * Test a cell to see if it {@link RangeSelectionModel#isSelected|isSelected(cell)}
     * * {@link RangeSelectionModel#clear|clear()} the matrix
     *
     * Internally, the selection is run-length-encoded. It is therefore a "sparse" matrix
     * with undefined bounds. A single data property called `selection` is an array that
     * contains all the "runs" (ranges) of selected cells albeit in no particular order.
     * This property should not normally need to be accessed directly.
     *
     * Note: This object should be instantiated with the `new` keyword.
     *
     * @returns {RangeSelectionModel} Self (i.e., `this` object).
     */
    function RangeSelectionModel() {
        /**
         * @name selection
         * @type {Array.Array.number}
         * @summary Unordered list of runs.
         * @desc A "run" is defined as an Array(2) where:
         * * element [0] is the beginning of the run
         * * element [1] is the end of the run (inclusive) and is always >= element [0]
         * The order of the runs within is undefined.
         * @memberOf RangeSelectionModel.prototype
         * @abstract
         */
        this.selection = [];

        //we need to be able to go back in time
        //the states field
        this.states = [];

        //clone and store my current state
        //so we can unwind changes if need be
        this.storeState = function () {
            var sels = this.selection;
            var state = [];
            var copy;
            for (var i = 0; i < sels.length; i++) {
                copy = [].concat(sels[i]);
                state.push(copy);
            }
            this.states.push(state);
        };
    }

    RangeSelectionModel.prototype = {

        /**
         * @summary Add a contiguous run of points to the selection.
         * @desc Insert a new run into `this.selection`.
         * The new run will be merged with overlapping and adjacent runs.
         *
         * The two parameters may be given in either order.
         * The start and stop elements in the resulting run will however always be ordered.
         * (However, note that the order of the runs within `this.selection` is itself always unordered.)
         *
         * Note that `this.selection` is updated in place, preserving validity of any external references.
         * @param {number} start - Start of run. May be greater than `stop`.
         * @param {number} [stop=stop] - End of run (inclusive). May be less than `start`.
         * @returns {RangeSelectionModel} Self (i.e., `this`), for chaining.
         * @memberOf RangeSelectionModel.prototype
         */
        select: function (start, stop) {
            this.storeState();
            var run = makeRun(start, stop);
            var splicer = [0, 1];
            this.selection.forEach(function (each) {
                if (overlaps(each, run) || abuts(each, run)) {
                    run = merge(each, run);
                } else {
                    splicer.push(each);
                }
            });
            splicer.push(run);
            splicer[1] = this.selection.length;
            this.selection.splice.apply(this.selection, splicer); // update in place to preserve external references
            return this;
        },

        /**
         * @summary Remove a contiguous run of points from the selection.
         * @desc Truncate and/or remove run(s) from `this.selection`.
         * Removing part of existing runs will (correctly) shorten them or break them into two fragments.
         *
         * The two parameters may be given in either order.
         *
         * Note that `this.selection` is updated in place, preserving validity of any external references.
         * @param {number} start - Start of run. May be greater than `stop`.
         * @param {number} [stop=stop] - End of run (inclusive). May be less than `start`.
         * @returns {RangeSelectionModel} Self (i.e., `this`), for chaining.
         * @memberOf RangeSelectionModel.prototype
         */
        deselect: function (start, stop) {
            var run = makeRun(start, stop);
            var splicer = [0, 0];
            this.selection.forEach(function (each) {
                if (overlaps(each, run)) {
                    var pieces = subtract(each, run);
                    splicer = splicer.concat(pieces);
                } else {
                    splicer.push(each);
                }
            });
            splicer[1] = this.selection.length;
            this.selection.splice.apply(this.selection, splicer); // update in place to preserve external references
            return this;
        },

        /**
         * @summary Empties `this.selection`, effectively removing all runs.
         * @returns {RangeSelectionModel} Self (i.e., `this`), for chaining.
         * @memberOf RangeSelectionModel.prototype
         */
        clear: function () {
            this.states.length = 0;
            this.selection.length = 0;
            return this;
        },

        clearMostRecentSelection: function () {
            if (this.states.length === 0) {
                return;
            }
            this.selection = this.states.pop();
        },

        /**
         * @summary Determines if the given `cell` is selected.
         * @returns {boolean} `true` iff given `cell` is within any of the runs in `this.selection`.
         * @param {number} cell - The cell to test for inclusion in the selection.
         * @memberOf RangeSelectionModel.prototype
         */
        isSelected: function (cell) {
            return this.selection.some(function (each) {
                return each[0] <= cell && cell <= each[1];
            });
        },

        isEmpty: function (){
            return this.selection.length === 0;
        },

        /**
         * @summary Return the indexes that are selected.
         * @desc Return the indexes that are selected.
         * @returns {Array.Array.number}
         * @memberOf RangeSelectionModel.prototype
         */
        getSelections: function (){
            var result = [];
            this.selection.forEach(function (each) {
                for (var i = each[0]; i <= each[1]; i++) {
                    result.push(i);
                }
            });
            result.sort(function (a, b){
                return a - b;
            });
            return result;
        }

    };

    /**
     * @private
     * @summary Preps `start` and `stop` params into order array
     * @function makeRun
     * @desc Utility function called by both `select()` and `deselect()`.
     * @param {number|number[]} start - Start of run. if array, `start` and `stop` are taken from first two elements.
     * @param {number} [stop=start] - End of run (inclusive).
     */
    function makeRun(start, stop) {
        return (
            start instanceof Array
                ? makeRun.apply(this, start) // extract params from given array
                : stop === undefined
                ? [ start, start ] // single param is a run that stops where it starts
                : start <= stop
                ? [ start, stop ]
                : [ stop, start ] // reverse descending params into ascending order
        );
    }

    /**
     * @private
     * @function overlaps
     * @returns {boolean} `true` iff `run1` overlaps `run2`
     * @summary Comparison operator that determines if given runs overlap with one another.
     * @desc Both parameters are assumed to be _ordered_ arrays.
     *
     * Overlap is defined to include the case where one run completely contains the other.
     *
     * Note: This operator is commutative.
     * @param {number[]} run1 - first run
     * @param {number[]} run2 - second run
     */
    function overlaps(run1, run2) {
        return (
            run1[0] <= run2[0] && run2[0] <= run1[1] || // run2's start is within run1 OR...
            run1[0] <= run2[1] && run2[1] <= run1[1] || // run2's stop is within run1 OR...
            run2[0] <  run1[0] && run1[1] <  run2[1]    // run2 completely contains run1
        );
    }

    /**
     * @private
     * @function abuts
     * @summary Comparison operator that determines if given runs are consecutive with one another.
     * @returns {boolean} `true` iff `run1` is consecutive with `run2`
     * @desc Both parameters are assumed to be _ordered_ arrays.
     *
     * Note: This operator is commutative.
     * @param {number[]} run1 - first run
     * @param {number[]} run2 - second run
     */
    function abuts(run1, run2) {
        return (
            run1[1] === run2[0] - 1 || // run1's top immediately precedes run2's start OR...
            run2[1] === run1[0] - 1    // run2's top immediately precedes run1's start
        );
    }

    /**
     * @private
     * @function subtract
     * @summary Operator that subtracts one run from another.
     * @returns {Array.Array.number} The remaining pieces of `minuend` after removing `subtrahend`.
     * @desc Both parameters are assumed to be _ordered_ arrays.
     *
     * This function _does not assumes_ that `overlap()` has already been called with the same runs and has returned `true`.
     *
     * Returned array contains 0, 1, or 2 runs which are the portion(s) of `minuend` that do _not_ include `subtrahend`.
     *
     * Caveat: This operator is *not* commutative.
     * @param {number[]} minuend - a run from which to "subtract" `subtrahend`
     * @param {number[]} subtrahend - a run to "subtracted" from `minuend`
     */
    function subtract(minuend, subtrahend) {
        var m0 = minuend[0];
        var m1 = minuend[1];
        var s0 = subtrahend[0];
        var s1 = subtrahend[1];
        var result = [];

        if (s0 <= m0 && s1 < m1) {
            //subtrahend extends before minuend: return remaining piece of `minuend`
            result.push([s1 + 1, m1]);
        } else if (s0 > m0 && s1 >= m1) {
            //subtrahend extends after minuend: return remaining piece of `minuend`
            result.push([m0, s0 - 1]);
        } else if (m0 < s0 && s1 < m1) {
            //completely inside: return 2 smaller pieces resulting from the hole
            result.push([m0, s0 - 1]);
            result.push([s1 + 1, m1]);
        } else if (s1 < m0 || s0 > m1) {
            // completely outside: return `minuend` untouched
            result.push(minuend);
        }

        //else subtrahend must completely overlap minuend so return no pieces

        return result;
    }


    // Local utility functions

    /**
     * @private
     * @function merge
     * @summary Operator that merges given runs.
     * @returns {number[]} A single merged run.
     * @desc Both parameters are assumed to be _ordered_ arrays.
     *
     * The runs are assumed to be overlapping or adjacent to one another.
     *
     * Note: This operator is commutative.
     * @param {number[]} run1 - a run to merge with `run2`
     * @param {number[]} run2 - a run to merge with `run1`
     */
    function merge(run1, run2) {
        var min = Math.min(Math.min.apply(Math, run1), Math.min.apply(Math, run2));
        var max = Math.max(Math.max.apply(Math, run1), Math.max.apply(Math, run2));
        return [min, max];
    }

    // Interface
    module.exports = RangeSelectionModel;
})(
    typeof module === 'object' && module || (window.RangeSelectionModel = {}),
    typeof module === 'object' && module.exports || (window.RangeSelectionModel.exports = {})
) || (
    typeof module === 'object' || (window.RangeSelectionModel = window.RangeSelectionModel.exports)
);

/* About the above IIFE:
 * This file is a "modified node module." It functions as usual in Node.js *and* is also usable directly in the browser.
 * 1. Node.js: The IIFE is superfluous but innocuous.
 * 2. In the browser: The IIFE closure serves to keep internal declarations private.
 * 2.a. In the browser as a global: The logic in the actual parameter expressions + the post-invocation expression
 * will put your API in `window.RangeSelectionModel`.
 * 2.b. In the browser as a module: If you predefine a `window.module` object, the results will be in `module.exports`.
 * The bower component `mnm` makes this easy and also provides a global `require()` function for referencing your module
 * from other closures. In either case, this works with both NodeJs-style export mechanisms -- a single API assignment,
 * `module.exports = yourAPI` *or* a series of individual property assignments, `module.exports.property = property`.
 *
 * Before the IIFE runs, the actual parameter expressions are executed:
 * 1. If `window` object undefined, we're in NodeJs so assume there is a `module` object with an `exports` property
 * 2. If `window` object defined, we're in browser
 * 2.a. If `module` object predefined, use it
 * 2.b. If `module` object undefined, create a `RangeSelectionModel` object
 *
 * After the IIFE returns:
 * Because it always returns undefined, the expression after the || will execute:
 * 1. If `window` object undefined, then we're in NodeJs so we're done
 * 2. If `window` object defined, then we're in browser
 * 2.a. If `module` object predefined, we're done; results are in `moudule.exports`
 * 2.b. If `module` object undefined, redefine`RangeSelectionModel` to be the `RangeSelectionModel.exports` object
 */

},{}],101:[function(require,module,exports){
'use strict';

var transformers = require('./transformers');

var optionNames = ['transformations', 'propPath', 'dictPath', 'force'];

/**
 * @classdesc This object holds a list of transformations used by {@link Synonomous.prototype.getSynonyms} and {@link Synonomous.prototype.decorateList}.
 *
 * Additional transformer functions may be mixed into the prototype (or added to an instance).
 *
 * @param {object} [options]
 * @param {string[]} [options.transformations] - If omitted, {@link Synonomous.prototype.transformations} serves as a default.
 * @param {string} [options.propPath] - If omitted, {@link Synonomous.prototype.propPath} serves as a default.
 * @param {string} [options.dictPath] - If omitted, {@link Synonomous.prototype.dictPath} serves as a default.
 * @param {boolean} [options.force=false] - If truthy, new property values override existing values; else new values are discarded.
 * @constructor
 */
function Synonomous(options) {
    if (options) {
        optionNames.forEach(function(key) {
            if (options[key]) {
                this[key] = options[key];
            }
        }, this);
    }
}

Synonomous.prototype = {
    constructor: Synonomous,

    /**
     * @summary Default list of active registered transformations by  _or_ an object whose keys name the transformations.
     * @desc Used by {@link Synonomous.prototype.getSynonyms} and {@link Synonomous.prototype.decorateList}.
     * When an object, the former just uses the keys, ignoring the values, while the latter uses both the keys and the values.
     *
     * An override may be defined on the instance, easily done by supplying as a constructor option.
     *
     * This is a global default; mutate only if you want to change the default for all your instances.
     * @see {@link Synonomous.prototype.verbatim}
     * @see {@link Synonomous.prototype.toCamelCase}
     * @default
     * @type {string[]|object}
     * @memberOf Synonomous#
     */
    transformations: [
        'verbatim',
        'toCamelCase'
    ],

    /**
     * @summary Drill down path for name to make synonyms of.
     * @desc Used by {@link Synonomous.prototype.decorateList}.
     *
     * This is the default property dot-path within each list element to find the value to make synonyms of.
     * If undefined (and no temporary override is given in the call to `decorateList`),
     * the element value itself (coerced to a string) is used to make the synonyms.
     *
     * The setter accepts any falsy value to undefine; or a string of dot-separated parts; or an array of parts.
     *
     * The getter always returns an array with a `toString` override that returns dot-separated string when coerced to a string.
     *
     * An override may be defined on the instance, easily done by supplying as a constructor option.
     *
     * The global default for all instances can be reset using the setter with the prototype as the execution context,
     * _e.g._ `Synonomous.prototype.propPath = newValue;`.
     *
     * @type {undefined|string[]}
     * @memberOf Synonomous#
     */
    set propPath(crumbs) {
        this._propPath = newBreadcrumbs(crumbs);
    },
    get propPath() {
        return this._propPath;
    },
    _propPath: ['name'], // default for all instances

    /**
     * @summary Default path to property to decorate; or undefined to decorate the object itself.
     * @desc Used by {@link Synonomous.prototype.decorate} and {@link Synonomous.prototype.decorateList}.
     *
     * The setter accepts any falsy value to undefine; or a string of dot-separated parts; or an array of parts.
     *
     * The getter always returns an array with a `toString` override that returns dot-separated string when coerced to a string.
     *
     * If undefined, decorations are placed in `list[this.dictPath[0]][this.dictPath[1]][etc]`; else decorations are placed directly on `list` itself.
     *
     * An override may be defined on the instance, easily done by supplying to as a constructor option.
     *
     * The global default for all instances can be reset using the setter with the prototype as the execution context,
     * _e.g._ `Synonomous.prototype.dictPath = newValue;`.
     *
     * @type {undefined|string|string[]}
     * @memberOf Synonomous#
     */
    set dictPath(crumbs) {
        this._dictPath = newBreadcrumbs(crumbs);
    },
    get dictPath() {
        return this._dictPath;
    },
    _dictPath: [], // default for all instances, settable by Synonomous.prototype.dictPath setter

    /**
     * If `name` is a string and non-blank, returns an array containing unique non-blank synonyms of `name` generated by the transformer functions named in `this.transformations`.
     * @param {string} name - String to make synonyms of.
     * @parma {string[]|object} transformations - When provided, temporarily overrides `this.transformations`.
     * @memberOf Synonomous#
     */
    getSynonyms: function(name, transformations) {
        var synonyms = [];
        if (typeof name === 'string' && name) {
            transformations = transformations || this.transformations;
            if (!Array.isArray(transformations)) {
                transformations = Object.keys(transformations);
            }
            transformations.forEach(function(key) {
                if (typeof transformers[key] !== 'function') {
                    throw new ReferenceError('Unknown transformer "' + key + '"');
                }
                var synonym = transformers[key](name);
                if (synonym !== '' && !(synonym in synonyms)) {
                    synonyms.push(synonym);
                }
            });
        }
        return synonyms;
    },

    /**
     * Decorate an object `obj` with properties named in `propNames` all referencing `item`.
     * @param {object} obj - The object to decorate. If `this.dictPath` is defined, then decorate `obj[this.dictPath]` instead (created as needed).
     *
     * @param {string[]} propNames
     * @param item
     * @returns {object} `obj`, now with additional properties (possibly)
     */
    decorate: function(obj, propNames, item) {
        var drilldownContext = drilldown(obj, this.dictPath),
            force = this.force;

        propNames.forEach(function(propName) {
            if (force || !(propName in drilldownContext)) {
                drilldownContext[propName] = item;
            }
        });

        return obj;
    },

    /**
     * @summary Add dictionary synonyms to an array.
     *
     * @desc Adds synonyms for a single element (`index`) or the entire array, based on a given property of each element (`propPath`) or the element itself.
     *
     * That is, each element is either iteself converted to a string; or is an object with a property named by following `propPath` which is converted to a string.
     *
     * For each element, all transformers named in `this.transformations` are run on that string.
     * * _When `this.transformations` is an array:_
     * **Create dictionary entries (synonyms) for the element.**
     * Specifically: All the resulting unique non-blank "synonyms" are added as properties to the array with the value of the property being a reference to the element (if it was an object) or a copy of the element (if it was a string), subject to the following rules:
     *    1. Duplicate synonyms are not added.
     *    2. Blank synonyms are not added.
     * * _When `this.transformations` is an non-array object:_
     * **Create a new property inside the element for each transformation.**
     * Specifically: The keys of `this.transformations` name the transformers. The values are dot-paths (dot-separated-strings or arrays) to properties inside each element, set to the string returned by the transformer named by the key.
     *
     * @param {number} [index] - Index of element of `list` to add synonyms for. If omitted:
     * 1. Adds synonyms for all elements of `list`.
     * 2. `list` and `index` are promoted to the 1st and 2nd parameter positions, respectively.
     * @param {(string|Object.<string, string>)[]} list - Array whose element(s) to make synonyms of _and_ the object to decorate. If `this.dictPath` is defined, then decorate `list[this.dictPath]` instead (created as needed).
     * @param {string} [propPath=this.propPath] - Name of the property in each element of `list` to make synonyms of. If defined _and_ list element is an object, adds synonyms of `list[propPath]` as string; else adds synonyms of the list element itself as string.
     * @returns {Array} `list`
     * @memberOf Synonomous#
     */
    decorateList: function(index, list, propPath) {
        var elements;
        if (typeof index === 'number') {
            elements = [list[index]];
        } else {
            // promote args
            list = elements = arguments[0];
            propPath = arguments[1];
        }
        propPath = propPath ? newBreadcrumbs(propPath) : this.propPath;
        elements.forEach(function(item) {
            var value = propPath !== undefined && typeof item === 'object' ? drilldown(item, propPath) : item;
            if (Array.isArray(this.transformations)) {
                var synonyms = this.getSynonyms(value);
                this.decorate(list, synonyms, item);
            } else {
                Object.keys(this.transformations).forEach(injectTransformedValueIntoItem.bind(this, item, value));
            }
        }, this);
        return list;
    }
};


// a.k.a.'s:
Synonomous.prototype.decorateObject = Synonomous.prototype.decorate;
Synonomous.prototype.decorateArray = Synonomous.prototype.decorateList;


function drilldown(collection, breadcrumbs) {
    return breadcrumbs.reduce(function(result, crumb) {
        return result[crumb] || (result[crumb] = Object.create(null));
    }, collection);
}

function newBreadcrumbs(crumbs) {
    if (!crumbs) {
        crumbs = [];
    } else if (Array.isArray(crumbs)) {
        crumbs = crumbs.slice();
    } else {
        crumbs = (crumbs + '').split('.');
    }

    crumbs.toString = crumbsToString;

    return crumbs;
}

/**
 * @this {Array}
 * @returns {string}
 */
function crumbsToString() {
    return this.join('.');
}

function injectTransformedValueIntoItem(item, value, transformation) {
    var transformer = transformers[transformation],
        path = this.transformations[transformation],
        pathList = Array.isArray(path) ? path.slice() : path.split('.'),
        propName = pathList.splice(pathList.length - 1, 1)[0],
        drillDownContext = drilldown(item, pathList);

    if (this.force || !(propName in drillDownContext)) {
        drillDownContext[propName] = transformer(value);
    }
}


module.exports = Synonomous;

},{"./transformers":102}],102:[function(require,module,exports){
'use strict';

// all instances of xX or _X
var REGEX_CAMEL_CASE_OR_UNDERSCORE = /([^_A-Z])([A-Z]+)/g;
var REGEX_ALL_PUNC_RUN = /[^a-z0-9]+/gi;

// all instances of _x
var REGEX_ALL_PUNC_RUN_BEFORE_LETTER = /[^a-z0-9]+([a-z0-9])?/ig;
function WITH_UPPER_CASE(match, char) { return char === undefined ? '' : char.toUpperCase(); }

var REGEX_INITIAL_DIGIT = /^(\d)/;
var WITH_DOLLAR_PREFIX = '$$$1';

var REGEX_INITIAL_CAPITAL = /^([A-Z])/;
function WITH_LOWER_CASE(match, char) { return char.toLowerCase(); }

var REGEXP_LOWER_CASE_LETTER = /[a-z]/;
var REGEXP_WORD_SEPARATORS = /[\s\-_]*([^\s\-_])([^\s\-_]+)/g;
var WITH_CAPTIAL_LETTER = function(a, b, c) { return b.toUpperCase() + c; };

var REGEXP_CAPITAL_LETTERS = /[A-Z]+/g;
var WITH_PREFIXED_SPACE = ' $&';

var REGEXP_OVER_CAPITALIZED_WORDS = /([A-Z]+)([A-Z][a-z])/g;
var WITH_SEPARATE_WORDS = '$1 $2';

/** @typedef {function} Transformer
 * @param {string} key
 * @returns {string}
 */

module.exports = {
    /** A transformer that returns its input converted to a string with ` + '' `.
     * @memberOf Synonomous#
     */
    verbatim: function(key) {
        return key + '';
    },

    /** A transformer that converts runs of punctuation (non-alphanumerics, actually) to "camelCase" by removing such runs and capitalizing the first letter of each word.
     * The first letter of the first word is forced to lower case.
     * Otherwise, leaves other letters' case as they were.
     *
     * When the result begins with a digit, it's prefixed with with `$` for two reasons:
     * 1. To avoid conflicts with array element indexes.
     * 2. To create an identifier that can be used to the right of the dot (`.`) dereferencing operator (identifiers cannot start with a digit but can contain a `$`).
     *
     * @type {Transformer}
     * @memberOf Synonomous#
     */
    toCamelCase: function(key) {
        return key
            .replace(REGEX_ALL_PUNC_RUN_BEFORE_LETTER, WITH_UPPER_CASE)
            .replace(REGEX_INITIAL_DIGIT, WITH_DOLLAR_PREFIX)
            .replace(REGEX_INITIAL_CAPITAL, WITH_LOWER_CASE);
    },

    /** A transformer that converts all runs of punctuation (non-alphanumerics, actually), as well as all camel case transitions, to underscore.
     * Results are converted to all caps.
     *
     * When the result begins with a digit, it's prefixed with with `$` for two reasons:
     * 1. To avoid conflicts with array element indexes.
     * 2. To create an identifier that can be used to the right of the dot (`.`) dereferencing operator (identifiers cannot start with a digit but can contain a `$`).
     *
     * @type {Transformer}
     * @memberOf Synonomous#
     */
    toAllCaps: function(key) {
        return key
            .replace(REGEX_ALL_PUNC_RUN, '_')
            .replace(REGEX_CAMEL_CASE_OR_UNDERSCORE, '$1_$2')
            .replace(REGEX_INITIAL_DIGIT, WITH_DOLLAR_PREFIX)
            .toUpperCase();
    },

    /**
     * A transformer that separates camel case or white-space-, hyphen-, or underscore-separated-words into truly separate words and capitalizing the first letter of each.
     *
     * This transformer is meant to create column headers from column names. It deliberating inserts spaces so the results are unsuitable as JavaScript identifiers.
     * @type {Transformer}
     * @memberOf Synonomous#
     */
    toTitle: function(key) {
        return (REGEXP_LOWER_CASE_LETTER.test(key) ? key : key.toLowerCase())
            .replace(REGEXP_WORD_SEPARATORS, WITH_CAPTIAL_LETTER)
            .replace(REGEXP_CAPITAL_LETTERS, WITH_PREFIXED_SPACE)
            .replace(REGEXP_OVER_CAPITALIZED_WORDS, WITH_SEPARATE_WORDS)
            .trim();
    }
};

},{}],103:[function(require,module,exports){
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
},{"fin-hypergrid/src/cellEditors//Textfield":37,"fin-hypergrid/src/cellEditors/CellEditor":31}],104:[function(require,module,exports){
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
    },

    getCellEditorAt: function(columnIndex, rowIndex, editorName, cellEvent) {
        return cellEvent.isDataColumn && (
            cellEvent.grid.cellEditors.create('FilterEditor', cellEvent) ||
            cellEvent.grid.cellEditors.create(editorName, cellEvent) // in case FilterEditor not defined
        );
    }
});

module.exports = FilterSubgrid;
},{"datasaur-base":3}],105:[function(require,module,exports){
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

},{"./FilterEditor":103,"./FilterSubgrid":104,"./make-data":106,"datasaur-filter":4,"datasaur-local":6,"fin-hypergrid":14,"fin-hypergrid/src/dataModels":50}],106:[function(require,module,exports){
'use strict';

var firstNames = ['', 'Olivia', 'Sophia', 'Ava', 'Isabella', 'Boy', 'Liam', 'Noah', 'Ethan', 'Mason', 'Logan', 'Moe', 'Larry', 'Curly', 'Shemp', 'Groucho', 'Harpo', 'Chico', 'Zeppo', 'Stanley', 'Hardy'],
    
    lastNames = ['', 'Wirts', 'Oneil', 'Smith', 'Barbarosa', 'Soprano', 'Gotti', 'Columbo', 'Luciano', 'Doerre', 'DePena'],
    
    months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
    
    days = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'],
    
    states = ['', 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];

function randomPerson() {
    var firstName = Math.round((firstNames.length - 1) * Math.random()),
        lastName = Math.round((lastNames.length - 1) * Math.random()),
        number_of_pets = Math.round(10 * Math.random()),
        birthyear = 1900 + Math.round(Math.random() * 114),
        birthmonth = Math.round(Math.random() * 11),
        birthday = Math.round(Math.random() * 29),
        birthstate = Math.round(Math.random() * (states.length - 1)),
        residencestate = Math.round(Math.random() * (states.length - 1)),
        travel = Math.random() * 1000,
        income = 50000 + Math.random() * 10000,
        employed = Math.round(Math.random());
    
    return {
        last_name: lastNames[lastName], //jshint ignore:line
        first_name: firstNames[firstName], //jshint ignore:line
        number_of_pets: number_of_pets,
        birthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
        birthState: states[birthstate],
        residenceState: states[residencestate],
        employed: employed === 1,
        income: income,
        travel: travel
    };
}

module.exports = function(numRows) {
    numRows = numRows || 10000;

    for (var i = 0, data = Array(numRows); i < numRows; i++) {
        data[i] = randomPerson();
    }
    
    return data;
};

},{}]},{},[105])