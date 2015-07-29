croc.View.define('doc.cmp.navigation.AbstractSideNav.View', {
    type: 'abstract',
    
    construct: function() {
        doc.cmp.navigation.AbstractSideNav.View.superclass.construct.apply(this, arguments);
        this.updateScroll = this.debounce(this.updateScroll, this);
        this._widget.on('resize', this.updateScroll, this);
    },
    
    members: {
        /**
         * @returns {croc.cmp.common.Scrollable}
         */
        getScrollable: function() {
            return this.__scrollable;
        },
        
        updateScroll: function() {
            this.__scrollable.update();
        },
        
        setUpScrollable: function(el) {
            this.__scrollable = new croc.cmp.common.Scrollable({
                el: $(el),
                orientation: 'both',
                size: '2',
                visibility: 'hidden',
                delayedHide: true
            });
        }
    }
});