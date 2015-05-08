croc.Class.define('doc.cmp.main.Tab', {
    extend: croc.cmp.Widget,
    
    properties: {
        tabsModel: {
            __setter: null,
            model: true
        },
        tab: {
            __setter: null,
            model: true
        }
    },
    
    options: {
        api: {},
        membersView: {}
    }
});
