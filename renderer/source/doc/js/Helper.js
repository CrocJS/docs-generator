croc.define('doc.Helper', {
    getIconByNode: function(node, symbolsMap) {
        var type = !node.object ? 'package' : node.type;
        if (!type || type === 'class') {
            return this.getIconByObject(symbolsMap[node.object]);
        }
        return 'set_api mod_' + type;
    },
    
    getIconByObject: function(object) {
        return 'set_api mod_' + this.getObjectType(object) + (object.type ? ' member_' + object.type : '');
    },
    
    getNodeType: function(node, symbolsMap) {
        return !node.object ? 'package' : node.type !== 'class' && node.type ? node.type :
            this.getObjectType(symbolsMap[node.object]);
    },
    
    getObjectType: function(object) {
        return object.definer === 'Interface' || object.definer === 'Mixin' ?
            object.definer.toLowerCase() :
            'class';
    }
});