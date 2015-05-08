croc.Class.define('doc.cmp.Page', {
    extend: croc.cmp.common.Resizer,
    
    options: {
        api: {}
    },
    
    members: {
        /**
         * @returns {doc.data.TabsModel}
         */
        getTabsModel: function() {
            return this.__tabsModel;
        },
        
        /**
         * Инициализация модели виджета
         * @protected
         */
        _initModel: function() {
            this._options.zones = [
                {minSize: 300, maxSize: 600, hiddenSize: 30},
                {stretch: true}
            ];
            
            doc.cmp.Page.superclass._initModel.apply(this, arguments);
            
            var tabsModel = this.__tabsModel = new doc.data.TabsModel({
                model: this._model,
                property: 'tabsModel',
                api: this._options.api
            });
            this._options.api.tree.forEach(function(node) {
                node.expanded = true;
            });
            tabsModel.addTab(doc.cmp.main.HomeTab.tab, true);
        },
        
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @protected
         */
        _initWidget: function() {
            doc.cmp.Page.superclass._initWidget.apply(this, arguments);
            
            //routing
            var internalSet = false;
            var history = croc.getService(croc.services.History);
            history.listenProperty('params', function(params) {
                if (internalSet) {
                    return;
                }
                if (!_.isEmpty(params)) {
                    internalSet = true;
                    this.__tabsModel.setSymbol(Object.keys(params)[0]);
                    internalSet = false;
                }
            }, this);
            
            var setHistory = function(symbol) {
                if (internalSet) {
                    return;
                }
                var params = {};
                if (symbol) {
                    params[symbol] = true;
                }
                internalSet = true;
                history.setParams(params);
                internalSet = false;
            }.bind(this);
            
            this.__tabsModel.on('symbolSet', setHistory);
            this.__tabsModel.on('changeActiveTab', function(tab) {
                if (!tab) {
                    setHistory(null);
                }
            });
        }
    }
});
