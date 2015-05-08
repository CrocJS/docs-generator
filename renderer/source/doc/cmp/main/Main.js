croc.Class.define('doc.cmp.main.Main', {
    extend: croc.cmp.Widget,
    
    options: {
        api: {},
        tabsModel: {}
    },
    
    members: {
        /**
         * Инициализация модели виджета
         * @protected
         */
        _initModel: function() {
            doc.cmp.main.Main.superclass._initModel.apply(this, arguments);
            
            this._options.membersView = {
                'private': false,
                'protected': false,
                inherited: false,
                included: true,
                properties: true
            };
        }
    }
});