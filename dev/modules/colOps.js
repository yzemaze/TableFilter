define(['exports', '../dom', '../string', '../types'], function (exports, _dom, _string, _types) {
    'use strict';

    var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

    var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

    Object.defineProperty(exports, '__esModule', {
        value: true
    });

    var ColOps = (function () {

        /**
         * Column calculations
         * @param {Object} tf TableFilter instance
         */

        function ColOps(tf) {
            _classCallCheck(this, ColOps);

            var f = tf.config();
            this.colOperation = f.col_operation;

            //calls function before col operation
            this.onBeforeOperation = _types.Types.isFn(f.on_before_operation) ? f.on_before_operation : null;
            //calls function after col operation
            this.onAfterOperation = _types.Types.isFn(f.on_after_operation) ? f.on_after_operation : null;

            this.tf = tf;
        }

        _createClass(ColOps, [{
            key: 'calc',

            /**
             * Calculates columns' values
             * Configuration options are stored in 'colOperation' property
             * - 'id' contains ids of elements showing result (array)
             * - 'col' contains the columns' indexes (array)
             * - 'operation' contains operation type (array, values: 'sum', 'mean',
             *   'min', 'max', 'median', 'q1', 'q3')
             * - 'write_method' array defines which method to use for displaying the
             *    result (innerHTML, setValue, createTextNode) - default: 'innerHTML'
             * - 'tot_row_index' defines in which row results are displayed
             *   (integers array)
             *
             * - changes made by Nuovella:
             * (1) optimized the routine (now it will only process each column once),
             * (2) added calculations for the median, lower and upper quartile.
             */
            value: function calc() {
                if (!this.tf.isFirstLoad && !this.tf.hasGrid()) {
                    return;
                }

                if (this.onBeforeOperation) {
                    this.onBeforeOperation.call(null, this.tf);
                }

                var colOperation = this.colOperation,
                    labelId = colOperation.id,
                    colIndex = colOperation.col,
                    operation = colOperation.operation,
                    outputType = colOperation.write_method,
                    totRowIndex = colOperation.tot_row_index,
                    excludeRow = colOperation.exclude_row,
                    decimalPrecision = colOperation.decimal_precision !== undefined ? colOperation.decimal_precision : 2;

                //nuovella: determine unique list of columns to operate on
                var ucolIndex = [],
                    ucolMax = 0;
                ucolIndex[ucolMax] = colIndex[0];

                for (var ii = 1; ii < colIndex.length; ii++) {
                    var saved = 0;
                    //see if colIndex[ii] is already in the list of unique indexes
                    for (var jj = 0; jj <= ucolMax; jj++) {
                        if (ucolIndex[jj] === colIndex[ii]) {
                            saved = 1;
                        }
                    }
                    //if not saved then, save the index;
                    if (saved === 0) {
                        ucolMax++;
                        ucolIndex[ucolMax] = colIndex[ii];
                    }
                }

                if (_string.Str.lower(typeof labelId) == 'object' && _string.Str.lower(typeof colIndex) == 'object' && _string.Str.lower(typeof operation) == 'object') {
                    var row = this.tf.tbl.rows,
                        colvalues = [];

                    for (var ucol = 0; ucol <= ucolMax; ucol++) {
                        //this retrieves col values
                        //use ucolIndex because we only want to pass through this loop
                        //once for each column get the values in this unique column
                        colvalues.push(this.tf.getColValues(ucolIndex[ucol], true, excludeRow));

                        //next: calculate all operations for this column
                        var result,
                            nbvalues = 0,
                            temp,
                            meanValue = 0,
                            sumValue = 0,
                            minValue = null,
                            maxValue = null,
                            q1Value = null,
                            medValue = null,
                            q3Value = null,
                            meanFlag = 0,
                            sumFlag = 0,
                            minFlag = 0,
                            maxFlag = 0,
                            q1Flag = 0,
                            medFlag = 0,
                            q3Flag = 0,
                            theList = [],
                            opsThisCol = [],
                            decThisCol = [],
                            labThisCol = [],
                            oTypeThisCol = [],
                            mThisCol = -1;

                        for (var k = 0; k < colIndex.length; k++) {
                            if (colIndex[k] === ucolIndex[ucol]) {
                                mThisCol++;
                                opsThisCol[mThisCol] = _string.Str.lower(operation[k]);
                                decThisCol[mThisCol] = decimalPrecision[k];
                                labThisCol[mThisCol] = labelId[k];
                                oTypeThisCol = outputType !== undefined && _string.Str.lower(typeof outputType) === 'object' ? outputType[k] : null;

                                switch (opsThisCol[mThisCol]) {
                                    case 'mean':
                                        meanFlag = 1;
                                        break;
                                    case 'sum':
                                        sumFlag = 1;
                                        break;
                                    case 'min':
                                        minFlag = 1;
                                        break;
                                    case 'max':
                                        maxFlag = 1;
                                        break;
                                    case 'median':
                                        medFlag = 1;
                                        break;
                                    case 'q1':
                                        q1Flag = 1;
                                        break;
                                    case 'q3':
                                        q3Flag = 1;
                                        break;
                                }
                            }
                        }

                        for (var j = 0; j < colvalues[ucol].length; j++) {
                            //sort the list for calculation of median and quartiles
                            if (q1Flag == 1 || q3Flag == 1 || medFlag == 1) {
                                if (j < colvalues[ucol].length - 1) {
                                    for (k = j + 1; k < colvalues[ucol].length; k++) {
                                        if (eval(colvalues[ucol][k]) < eval(colvalues[ucol][j])) {
                                            temp = colvalues[ucol][j];
                                            colvalues[ucol][j] = colvalues[ucol][k];
                                            colvalues[ucol][k] = temp;
                                        }
                                    }
                                }
                            }
                            var cvalue = parseFloat(colvalues[ucol][j]);
                            theList[j] = parseFloat(cvalue);

                            if (!isNaN(cvalue)) {
                                nbvalues++;
                                if (sumFlag === 1 || meanFlag === 1) {
                                    sumValue += parseFloat(cvalue);
                                }
                                if (minFlag === 1) {
                                    if (minValue === null) {
                                        minValue = parseFloat(cvalue);
                                    } else {
                                        minValue = parseFloat(cvalue) < minValue ? parseFloat(cvalue) : minValue;
                                    }
                                }
                                if (maxFlag === 1) {
                                    if (maxValue === null) {
                                        maxValue = parseFloat(cvalue);
                                    } else {
                                        maxValue = parseFloat(cvalue) > maxValue ? parseFloat(cvalue) : maxValue;
                                    }
                                }
                            }
                        } //for j
                        if (meanFlag === 1) {
                            meanValue = sumValue / nbvalues;
                        }
                        if (medFlag === 1) {
                            var aux = 0;
                            if (nbvalues % 2 === 1) {
                                aux = Math.floor(nbvalues / 2);
                                medValue = theList[aux];
                            } else {
                                medValue = (theList[nbvalues / 2] + theList[nbvalues / 2 - 1]) / 2;
                            }
                        }
                        var posa;
                        if (q1Flag === 1) {
                            posa = 0;
                            posa = Math.floor(nbvalues / 4);
                            if (4 * posa == nbvalues) {
                                q1Value = (theList[posa - 1] + theList[posa]) / 2;
                            } else {
                                q1Value = theList[posa];
                            }
                        }
                        if (q3Flag === 1) {
                            posa = 0;
                            var posb = 0;
                            posa = Math.floor(nbvalues / 4);
                            if (4 * posa === nbvalues) {
                                posb = 3 * posa;
                                q3Value = (theList[posb] + theList[posb - 1]) / 2;
                            } else {
                                q3Value = theList[nbvalues - posa - 1];
                            }
                        }

                        for (var i = 0; i <= mThisCol; i++) {
                            switch (opsThisCol[i]) {
                                case 'mean':
                                    result = meanValue;
                                    break;
                                case 'sum':
                                    result = sumValue;
                                    break;
                                case 'min':
                                    result = minValue;
                                    break;
                                case 'max':
                                    result = maxValue;
                                    break;
                                case 'median':
                                    result = medValue;
                                    break;
                                case 'q1':
                                    result = q1Value;
                                    break;
                                case 'q3':
                                    result = q3Value;
                                    break;
                            }

                            var precision = !isNaN(decThisCol[i]) ? decThisCol[i] : 2;

                            //if outputType is defined
                            if (oTypeThisCol && result) {
                                result = result.toFixed(precision);

                                if (_dom.Dom.id(labThisCol[i])) {
                                    switch (_string.Str.lower(oTypeThisCol)) {
                                        case 'innerhtml':
                                            if (isNaN(result) || !isFinite(result) || nbvalues === 0) {
                                                _dom.Dom.id(labThisCol[i]).innerHTML = '.';
                                            } else {
                                                _dom.Dom.id(labThisCol[i]).innerHTML = result;
                                            }
                                            break;
                                        case 'setvalue':
                                            _dom.Dom.id(labThisCol[i]).value = result;
                                            break;
                                        case 'createtextnode':
                                            var oldnode = _dom.Dom.id(labThisCol[i]).firstChild;
                                            var txtnode = _dom.Dom.text(result);
                                            _dom.Dom.id(labThisCol[i]).replaceChild(txtnode, oldnode);
                                            break;
                                    } //switch
                                }
                            } else {
                                try {
                                    if (isNaN(result) || !isFinite(result) || nbvalues === 0) {
                                        _dom.Dom.id(labThisCol[i]).innerHTML = '.';
                                    } else {
                                        _dom.Dom.id(labThisCol[i]).innerHTML = result.toFixed(precision);
                                    }
                                } catch (e) {} //catch
                            } //else
                        } //for i

                        // row(s) with result are always visible
                        var totRow = totRowIndex && totRowIndex[ucol] ? row[totRowIndex[ucol]] : null;
                        if (totRow) {
                            totRow.style.display = '';
                        }
                    } //for ucol
                } //if typeof

                if (this.onAfterOperation) {
                    this.onAfterOperation.call(null, this.tf);
                }
            }
        }]);

        return ColOps;
    })();

    exports.ColOps = ColOps;
});
//# sourceMappingURL=colOps.js.map