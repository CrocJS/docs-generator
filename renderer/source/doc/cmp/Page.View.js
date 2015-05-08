croc.View.define('doc.cmp.Page.View', {
    members: {
        onCreate: function() {
            doc.cmp.Page.View.superclass.onCreate.apply(this, arguments);
            
            $(document.body).on('click', '.js-page-symbol', function(e) {
                var symbol = $(e.currentTarget).data('symbol');
                this._widget.getTabsModel().setSymbol(symbol);
            }.bind(this));
        }
    }
});
