croc.View.define('doc.cmp.navigation.Tree.View', {
    members: {
        clickNode: function(model) {
            if (model.get('items')) {
                model.set('expanded', !model.get('expanded'));
            }
            else {
                var node = model.get();
                var tab = this._widget.getTabsModel().getActiveTab();
                if (!tab || tab.objectName !== node.object) {
                    this._widget.getTabsModel().setTabFromSymbolObject(node.object);
                }
            }
        },
        
        hasNonRejected: function(items) {
            return items && items.some(function(x) { return !x.rejected; });
        },
        
        makeNodeName: function(node, search) {
            var isIndex = node.name === '$index';
            var html = croc.utils.strHighlightSubstring(isIndex ? node.parentName : node.name, search,
                '<span style="color: red;">{content}</span>');
            if (isIndex) {
                html = '<b>' + html + '</b>';
            }
            return html;
        },
        
        onCreate: function() {
            doc.cmp.navigation.Tree.View.superclass.onCreate.apply(this, arguments);
            
            this._model.on('change', 'tree.**', this.debounce(function(path) {
                if (_.endsWith(path, '.expanded')) {
                    this.updateScroll();
                }
            }, this));
            
            //scrollTo active element
            //this._widget.getTabsModel().listenProperty('activeTab', this.debounce(function(tab) {
            //    var el = this._widget.getElement().find('.js-active-node');
            //    if (el.length) {
            //        this.getScrollable().centerTo(el);
            //    }
            //}, this));
        }
    }
});