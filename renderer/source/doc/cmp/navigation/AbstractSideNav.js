croc.Class.define('doc.cmp.navigation.AbstractSideNav', {
    type: 'abstract',
    extend: croc.cmp.Widget,
    
    properties: {
        api: {
            __setter: null,
            model: true
        },
        tabsModel: {
            __setter: null,
            model: true
        }
    }
});
