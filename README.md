# fin-hypergrid-column-filter-demo

**Please see [`fin-hypergrid-filtering-demo`](https://github.com/fin-hypergrid/fin-hypergrid-filtering-demo) first and read that README in full for the fundamentals.**

## Running the pre-built hosted app

A pre-built version of `fin-hypergrid-column-filter-demo` is availble on GitHub pages [here](https://fin-hypergrid.github.io/fin-hypergrid-column-filter-demo).

## Building it yourself

### Prerequisites
These are the versions I have. The build may or may not work with earlier versions.
```bash
git --version # git version 2.14.1
node --version # v8.9.2
npm --version # 5.7.1
npm install -g browserify # you only need to do this one time
browserify --version # 15.2.0
```

### Build & Run
From your repositories folder:
```bash
git clone https://fin-hypergrid/fin-hypergrid-column-filter-demo.git
cd fin-hypergrid-column-filter-demo
npm install
sh build # bundle contents of src folder into build/index.js
open index.html # opens in browser but works on Mac OS only
```

## How to filter data rows with column filters

Run the app (see above).

To filter rows:
1. Click in a filter cell (found in 2nd grid row, under column headers)
2. Type in a filter expression, which may be either:
   * A regular JavaScript expression, including the column name<br>
Example: To see all unemployed people with more than 5 pets: In the Pets column, type: `!employed && number_of_pets > 5`
   * An alternate syntax expression _(see rules below)_<br>
Example for Pets column: `< 3 && !employed`
3. Hit **Enter** key
4. The app ANDs multiple column filters together and puts the result in the **Filter** text box.

> NOTE: You can hover the mouse over the **Filter** label to see a list of the column names.

## Study the code
The [`fin-after-cell-edit`]](https://github.com/fin-hypergrid/fin-hypergrid-column-filter-demo/blob/master/src/index.js#L41-L98) handler in src/index.js demonstrates how to:
* Activate the filter row using the included `FilterSubgrid`
* Rebuild the global filter as a concatenation of all the column filters whenever one is edited
* Pass options to [`datasaur-filter`](https://github.com/fin-hypergrid/datasaur-filter) (`vars` and `syntax`)

### Tranditional syntax
Let's expressions use VB/SQL operators `and`, `or`, `not`, `=`, and `<>` instead of their lesser-known C/JavaScript equivalents.

### Abbreviated syntax
The abbreviated syntax is more natural in column filter cells:
* The column name may be omitted when a subexpression begins with a relational operator
* The equality operator may be omitted as well when the column name is omitted
* The above abbreviations apply to all AND'd or OR'd subexpressions within the column filter expression
* 'or' or comma can be used for ORing instead of '||'
* 'and' or semicolon can be used for ANDing instead of '&&'

The second rule (default relational operator rule) tries to insert the equalality operator where it only sees one operand. This will obviously fail when that lone operand is a boolean test for truthiness. In such cases, instead of `variable` or `!variable` to test for truthiness or falsiness, compare to `true` or `false`.

Therefore, for a column named `age` (say):
* `<5` is converted to `age < 5`
* `5` is converted to `age === 5`
* `5,10,15` or `5||10||15` or `5 or 10 or 15` is converted to `age === 5 || age === 10 || age === 15`
* `>3 and <8` or `>3 && <8` is converted to `age > 3 && age < 8`
* `<3 and employed` is converted to `age < 3 and age === employed` _not what was intended_
* `<3 and employed===true` is converted to `age < 3 and employed === true` _as intended_

Regular syntax applies When a column filter expression does _not_ begin with a relational operator or if it starts with the column name.
