croc.View.define('doc.cmp.main.Tabs.View', {
    members: {
        onCreate: function() {
            doc.cmp.main.Tabs.View.superclass.onCreate.apply(this, arguments);
            
            var checkMoreButton = function() {
                var tabsList = this._model.get('_tabsList');
                //todo fix it
                if (tabsList) {
                    this._model.set('moreButton',
                        tabsList.children(':first').offset().top !== tabsList.children(':last').offset().top);
                }
            }.bind(this);
            
            this._widget.on('resize', checkMoreButton);
            this._model.on('all', 'tabsModel.tabs', this.disposableFunc(_.debounce(checkMoreButton, 0)));
            //todo fix it
            //this._getDisposer().defer(checkMoreButton);
            
            var tabsModel = this._widget.getTabsModel();
            tabsModel.on('changeActiveTab', function(tab) {
                var tabsList = this._model.get('_tabsList');
                //todo fix it
                if (tab && tabsList) {
                    var el = tabsList.children().eq(tabsModel.tabs.indexOf(tab));
                    if (el.offset().top !== tabsList.children(':first').offset().top) {
                        tabsModel.moveTabToBegin(tab);
                    }
                }
            }, this);
        }
    }
});
