define(['exports', '../types', '../dom', '../event', '../helpers'], function (exports, _types, _dom, _event, _helpers) {
    'use strict';

    var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

    var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

    Object.defineProperty(exports, '__esModule', {
        value: true
    });

    var PopupFilter = (function () {

        /**
         * Pop-up filter component
         * @param {Object} tf TableFilter instance
         */

        function PopupFilter(tf) {
            _classCallCheck(this, PopupFilter);

            // Configuration object
            var f = tf.config();

            // Enable external filters behaviour
            tf.isExternalFlt = true;
            tf.externalFltTgtIds = [];

            //filter icon path
            this.popUpImgFlt = f.popup_filters_image || tf.themesPath + 'icn_filter.gif';
            //active filter icon path
            this.popUpImgFltActive = f.popup_filters_image_active || tf.themesPath + 'icn_filterActive.gif';
            this.popUpImgFltHtml = f.popup_filters_image_html || '<img src="' + this.popUpImgFlt + '" alt="Column filter" />';
            //defines css class for popup div containing filter
            this.popUpDivCssClass = f.popup_div_css_class || 'popUpFilter';
            //callback function before popup filtes is opened
            this.onBeforePopUpOpen = _types.Types.isFn(f.on_before_popup_filter_open) ? f.on_before_popup_filter_open : null;
            //callback function after popup filtes is opened
            this.onAfterPopUpOpen = _types.Types.isFn(f.on_after_popup_filter_open) ? f.on_after_popup_filter_open : null;
            //callback function before popup filtes is closed
            this.onBeforePopUpClose = _types.Types.isFn(f.on_before_popup_filter_close) ? f.on_before_popup_filter_close : null;
            //callback function after popup filtes is closed
            this.onAfterPopUpClose = _types.Types.isFn(f.on_after_popup_filter_close) ? f.on_after_popup_filter_close : null;

            //stores filters spans
            this.popUpFltSpans = [];
            //stores filters icons
            this.popUpFltImgs = [];
            //stores filters containers
            this.popUpFltElms = this.popUpFltElmCache || [];
            this.popUpFltAdjustToContainer = true;

            //id prefix for pop-up filter span
            this.prfxPopUpSpan = 'popUpSpan_';
            //id prefix for pop-up div containing filter
            this.prfxPopUpDiv = 'popUpDiv_';

            this.tf = tf;
        }

        _createClass(PopupFilter, [{
            key: 'onClick',
            value: function onClick(e) {
                var evt = e || global.event,
                    elm = evt.target.parentNode,
                    colIndex = parseInt(elm.getAttribute('ci'), 10);

                this.closeAll(colIndex);
                this.toggle(colIndex);

                if (this.popUpFltAdjustToContainer) {
                    var popUpDiv = this.popUpFltElms[colIndex],
                        header = this.tf.getHeaderElement(colIndex),
                        headerWidth = header.clientWidth * 0.95;
                    if (_helpers.Helpers.isIE()) {
                        var headerLeft = _dom.Dom.position(header).left;
                        popUpDiv.style.left = headerLeft + 'px';
                    }
                    popUpDiv.style.width = parseInt(headerWidth, 10) + 'px';
                }
                _event.Event.cancel(evt);
                _event.Event.stop(evt);
            }
        }, {
            key: 'init',

            /**
             * Initialize DOM elements
             */
            value: function init() {
                var _this = this;

                var tf = this.tf;
                for (var i = 0; i < tf.nbCells; i++) {
                    if (tf['col' + i] === tf.fltTypeNone) {
                        continue;
                    }
                    var popUpSpan = _dom.Dom.create('span', ['id', this.prfxPopUpSpan + tf.id + '_' + i], ['ci', i]);
                    popUpSpan.innerHTML = this.popUpImgFltHtml;
                    var header = tf.getHeaderElement(i);
                    header.appendChild(popUpSpan);
                    _event.Event.add(popUpSpan, 'click', function (evt) {
                        _this.onClick(evt);
                    });
                    this.popUpFltSpans[i] = popUpSpan;
                    this.popUpFltImgs[i] = popUpSpan.firstChild;
                }
            }
        }, {
            key: 'buildAll',

            /**
             * Build all pop-up filters elements
             */
            value: function buildAll() {
                for (var i = 0; i < this.popUpFltElmCache.length; i++) {
                    this.build(i, this.popUpFltElmCache[i]);
                }
            }
        }, {
            key: 'build',

            /**
             * Build a specified pop-up filter elements
             * @param  {Number} colIndex Column index
             * @param  {Object} div      Optional container DOM element
             */
            value: function build(colIndex, div) {
                var tf = this.tf;
                var popUpDiv = !div ? _dom.Dom.create('div', ['id', this.prfxPopUpDiv + tf.id + '_' + colIndex]) : div;
                popUpDiv.className = this.popUpDivCssClass;
                tf.externalFltTgtIds.push(popUpDiv.id);
                var header = tf.getHeaderElement(colIndex);
                header.insertBefore(popUpDiv, header.firstChild);
                _event.Event.add(popUpDiv, 'click', function (evt) {
                    _event.Event.stop(evt);
                });
                this.popUpFltElms[colIndex] = popUpDiv;
            }
        }, {
            key: 'toggle',

            /**
             * Toogle visibility of specified filter
             * @param  {Number} colIndex Column index
             */
            value: function toggle(colIndex) {
                var tf = this.tf,
                    popUpFltElm = this.popUpFltElms[colIndex];

                if (popUpFltElm.style.display === 'none' || popUpFltElm.style.display === '') {
                    if (this.onBeforePopUpOpen) {
                        this.onBeforePopUpOpen.call(null, this, this.popUpFltElms[colIndex], colIndex);
                    }
                    popUpFltElm.style.display = 'block';
                    if (tf['col' + colIndex] === tf.fltTypeInp) {
                        var flt = tf.getFilterElement(colIndex);
                        if (flt) {
                            flt.focus();
                        }
                    }
                    if (this.onAfterPopUpOpen) {
                        this.onAfterPopUpOpen.call(null, this, this.popUpFltElms[colIndex], colIndex);
                    }
                } else {
                    if (this.onBeforePopUpClose) {
                        this.onBeforePopUpClose.call(null, this, this.popUpFltElms[colIndex], colIndex);
                    }
                    popUpFltElm.style.display = 'none';
                    if (this.onAfterPopUpClose) {
                        this.onAfterPopUpClose.call(null, this, this.popUpFltElms[colIndex], colIndex);
                    }
                }
            }
        }, {
            key: 'closeAll',

            /**
             * Close all filters excepted for the specified one if any
             * @param  {Number} exceptIdx Column index of the filter to not close
             */
            value: function closeAll(exceptIdx) {
                for (var i = 0; i < this.popUpFltElms.length; i++) {
                    if (i === exceptIdx) {
                        continue;
                    }
                    var popUpFltElm = this.popUpFltElms[i];
                    if (popUpFltElm) {
                        popUpFltElm.style.display = 'none';
                    }
                }
            }
        }, {
            key: 'buildIcons',

            /**
             * Build all the icons representing the pop-up filters
             */
            value: function buildIcons() {
                for (var i = 0; i < this.popUpFltImgs.length; i++) {
                    this.buildIcon(i, false);
                }
            }
        }, {
            key: 'buildIcon',

            /**
             * Build specified icon
             * @param  {Number} colIndex Column index
             * @param  {Boolean} active   Apply active state
             */
            value: function buildIcon(colIndex, active) {
                var activeImg = _types.Types.isUndef(active) ? true : active;
                if (this.popUpFltImgs[colIndex]) {
                    this.popUpFltImgs[colIndex].src = active ? this.popUpImgFltActive : this.popUpImgFlt;
                }
            }
        }, {
            key: 'destroy',

            /**
             * Remove pop-up filters
             */
            value: function destroy() {
                this.popUpFltElmCache = [];
                for (var i = 0; i < this.popUpFltElms.length; i++) {
                    var popUpFltElm = this.popUpFltElms[i],
                        popUpFltSpan = this.popUpFltSpans[i],
                        popUpFltImg = this.popUpFltImgs[i];
                    if (popUpFltElm) {
                        popUpFltElm.parentNode.removeChild(popUpFltElm);
                        this.popUpFltElmCache[i] = popUpFltElm;
                    }
                    popUpFltElm = null;
                    if (popUpFltSpan) {
                        popUpFltSpan.parentNode.removeChild(popUpFltSpan);
                    }
                    popUpFltSpan = null;
                    if (popUpFltImg) {
                        popUpFltImg.parentNode.removeChild(popUpFltImg);
                    }
                    popUpFltImg = null;
                }
                this.popUpFltElms = [];
                this.popUpFltSpans = [];
                this.popUpFltImgs = [];
            }
        }]);

        return PopupFilter;
    })();

    exports.PopupFilter = PopupFilter;
});
//# sourceMappingURL=popupFilter.js.map