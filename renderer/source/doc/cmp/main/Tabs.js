croc.Class.define('doc.cmp.main.Tabs', {
    extend: croc.cmp.Widget,
    
    properties: {
        tabsModel: {
            __setter: null,
            model: true
        }
    },
    
    members: {
        /**
         * Инициализация модели виджета
         * @protected
         */
        _initModel: function() {
            doc.cmp.main.Tabs.superclass._initModel.apply(this, arguments);
            
            this._model.start('shown', 'tabsModel.tabs', function(x) { return !!x.length; });
            
            this._model.start('menuTabs', 'tabsModel.tabs',
                {copy: 'none', mode: 'array'},
                function(tabs) {
                    return tabs.filter(function(x) { return !x.permanent && x.title; });
                });
        }
    }
});
