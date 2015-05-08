croc.Class.define('doc.cmp.navigation.Tree', {
    extend: doc.cmp.navigation.AbstractSideNav,
    
    members: {
        /**
         * Инициализация модели виджета
         * @protected
         */
        _initModel: function() {
            doc.cmp.navigation.Tree.superclass._initModel.apply(this, arguments);
            
            this._options.tree = this._options.api.tree;
            
            //раскрываем всю активную ветку, помечаем активный элемент
            var lastPath;
            this._options.tabsModel.listenProperty('activeTab', function(tab) {
                if (lastPath) {
                    this._model.del(lastPath + '.active');
                }
                if (tab && tab.objectName) {
                    var path = croc.utils.objFindPath(this._options.tree, function(node) {
                        return _.isPlainObject(node) && node.object === tab.objectName;
                    }, function(node, path) {
                        if (_.isPlainObject(node) && !node.expanded) {
                            this._model.set(path + '.expanded', true);
                        }
                    }.bind(this), 'tree');
                    if (path) {
                        this._model.set(path + '.active', true);
                    }
                    lastPath = path;
                }
                else {
                    lastPath = null;
                }
            }, this);
        }
    }
});
