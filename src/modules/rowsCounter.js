import {Feature} from '../feature';
import {createElm, createText, elm, removeElm} from '../dom';
import {isFn} from '../types';

/**
 * Rows counter UI component
 * @export
 * @class RowsCounter
 * @extends {Feature}
 */
export class RowsCounter extends Feature {

    /**
     * Creates an instance of RowsCounter
     * @param {TableFilter} tf TableFilter instance
     */
    constructor(tf) {
        super(tf, 'rowsCounter');

        // TableFilter configuration
        let f = this.config;

        /**
         * ID of custom container element
         * @type {string}
         */
        this.rowsCounterTgtId = f.rows_counter_target_id || null;

        /**
         * Container DOM element
         * @type {DOMElement}
         * @private
         */
        this.rowsCounterDiv = null;

        /**
         * Container DOM element for label indicating the total number of rows
         * @type {DOMElement}
         * @private
         */
        this.rowsCounterSpan = null;

        /**
         * Text preceding the total number of rows
         * @type {String}
         */
        this.rowsCounterText = f.rows_counter_text || 'Rows: ';

        /**
         * Separator symbol appearing between the first and last visible rows of
         * current page when paging is enabled. ie: Rows: 31-40 / 70
         * @type {String}
         */
        this.fromToTextSeparator = f.from_to_text_separator || '-';

        /**
         * Separator symbol appearing between the first and last visible rows of
         * current page and the total number of filterable rows when paging is
         * enabled. ie: Rows: 31-40 / 70
         * @type {String}
         */
        this.overText = f.over_text || ' / ';

        /**
         * Css class for container element
         * @type {String}
         */
        this.totRowsCssClass = f.tot_rows_css_class || 'tot';

        /**
         * Prefix for container ID
         * @type {String}
         * @private
         */
        this.prfxCounter = 'counter_';

        /**
         * Prefix for DOM element containing the counter
         * @type {String}
         * @private
         */
        this.prfxTotRows = 'totrows_span_';

        /**
         * Prefix for label preceding the counter
         * @type {String}
         * @private
         */
        this.prfxTotRowsTxt = 'totRowsTextSpan_';

        /**
         * Callback fired before the counter is refreshed
         * @type {Function}
         */
        this.onBeforeRefreshCounter = isFn(f.on_before_refresh_counter) ?
            f.on_before_refresh_counter : null;

        /**
         * Callback fired after the counter is refreshed
         * @type {Function}
         */
        this.onAfterRefreshCounter = isFn(f.on_after_refresh_counter) ?
            f.on_after_refresh_counter : null;
    }

    /**
     * Initializes RowsCounter instance
     */
    init() {
        if (this.initialized) {
            return;
        }

        let tf = this.tf;

        //rows counter container
        let countDiv = createElm('div', ['id', this.prfxCounter + tf.id]);
        countDiv.className = this.totRowsCssClass;
        //rows counter label
        let countSpan = createElm('span', ['id', this.prfxTotRows + tf.id]);
        let countText = createElm('span', ['id', this.prfxTotRowsTxt + tf.id]);
        countText.appendChild(createText(this.rowsCounterText));

        // counter is added to defined element
        if (!this.rowsCounterTgtId) {
            tf.setToolbar();
        }
        let targetEl = !this.rowsCounterTgtId ?
            tf.lDiv : elm(this.rowsCounterTgtId);

        //default container: 'lDiv'
        if (!this.rowsCounterTgtId) {
            countDiv.appendChild(countText);
            countDiv.appendChild(countSpan);
            targetEl.appendChild(countDiv);
        }
        else {
            //custom container, no need to append statusDiv
            targetEl.appendChild(countText);
            targetEl.appendChild(countSpan);
        }
        this.rowsCounterDiv = countDiv;
        this.rowsCounterSpan = countSpan;

        // subscribe to events
        this.emitter.on(['after-filtering', 'grouped-by-page'],
            () => this.refresh(tf.getValidRowsNb()));
        this.emitter.on(['rows-changed'], () => this.refresh());

        /**
         * @inherited
         */
        this.initialized = true;
        this.refresh();
    }


    /**
     * Refreshes the rows counter
     * @param {Number} p Optional parameter the total number of rows to display
     * @returns
     */
    refresh(p) {
        if (!this.initialized || !this.isEnabled()) {
            return;
        }

        let tf = this.tf;

        if (this.onBeforeRefreshCounter) {
            this.onBeforeRefreshCounter.call(null, tf, this.rowsCounterSpan);
        }

        let totTxt;
        if (!tf.paging) {
            if (p && p !== '') {
                totTxt = p;
            } else {
                totTxt = tf.getFilterableRowsNb() - tf.nbHiddenRows;
            }
        } else {
            let paging = tf.feature('paging');
            if (paging) {
                //paging start row
                let pagingStartRow = parseInt(paging.startPagingRow, 10) +
                    ((tf.getValidRowsNb() > 0) ? 1 : 0);
                let pagingEndRow =
                    (pagingStartRow + paging.pagingLength) - 1 <=
                    tf.getValidRowsNb() ?
                        pagingStartRow + paging.pagingLength - 1 :
                        tf.getValidRowsNb();
                totTxt = pagingStartRow + this.fromToTextSeparator +
                    pagingEndRow + this.overText + tf.getValidRowsNb();
            }
        }

        this.rowsCounterSpan.innerHTML = totTxt;
        if (this.onAfterRefreshCounter) {
            this.onAfterRefreshCounter.call(
                null, tf, this.rowsCounterSpan, totTxt);
        }
    }

    /**
     * Remove feature
     */
    destroy() {
        if (!this.initialized) {
            return;
        }

        if (!this.rowsCounterTgtId && this.rowsCounterDiv) {
            removeElm(this.rowsCounterDiv);
        } else {
            elm(this.rowsCounterTgtId).innerHTML = '';
        }
        this.rowsCounterSpan = null;
        this.rowsCounterDiv = null;

        // unsubscribe to events
        this.emitter.off(['after-filtering', 'grouped-by-page'],
            () => this.refresh(tf.getValidRowsNb()));
        this.emitter.off(['rows-changed'], () => this.refresh());

        this.initialized = false;
    }
}
