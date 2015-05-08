croc.Class.define('doc.cmp.navigation.search.Form', {
    extend: croc.cmp.Widget,
    
    properties: {
        tabsModel: {
            __setter: null,
            model: true
        }
    },
    
    options: {
        api: {}
    },
    
    members: {
        selectItem: function(item) {
            this.getTabsModel().setSymbol(
                item.type === 'class' ? item.object : item.object + '/' + item.type + '!' + item.name);
        }
    }
});
