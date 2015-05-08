croc.Class.define('doc.cmp.main.HomeTab', {
    extend: doc.cmp.main.Tab,
    
    statics: {
        tab: {
            icon: 'set_api mod_home',
            permanent: true
        }
    }
});

doc.cmp.main.HomeTab.tab.widget = doc.cmp.main.HomeTab.classname;
