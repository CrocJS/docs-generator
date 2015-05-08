var _ = require('lodash');

var library = require('./library');

module.exports = function(api) {
    var index = {
        'package': [],
        'class': [],
        'constant': [],
        event: [],
        property: [],
        option: [],
        method: []
    };

    function getAccess(member) {
        return member.private ? 2 : member.protected ? 1 : 0;
    }

    _.forOwn(api.map, function(cls) {
        index.class.push({
            object: cls.qualifiedName,
            name: cls.qualifiedName,
            type: 'class',
            access: 0
        });
        (cls.members || []).concat(cls.statics || []).forEach(function(member) {
            if (member.memberType === 'method') {
                index.method.push({
                    object: cls.qualifiedName,
                    name: member.name,
                    type: 'method',
                    property: !!member.property,
                    access: getAccess(member)
                });
            }
            else if (member.memberType === 'field' && member.static) {
                index.constant.push({
                    object: cls.qualifiedName,
                    name: member.name,
                    type: 'constant',
                    access: getAccess(member)
                });
            }
        });
        if (cls.events) {
            cls.events.forEach(function(event) {
                index.event.push({
                    object: cls.qualifiedName,
                    name: event.name,
                    type: 'event',
                    property: event.property,
                    access: getAccess(event)
                });
            });
        }
        if (cls.properties) {
            cls.properties.forEach(function(property) {
                index.property.push({
                    object: cls.qualifiedName,
                    name: property.name,
                    type: 'property',
                    access: getAccess(property)
                });
            });
        }
        if (cls.options) {
            cls.options.forEach(function(option) {
                index.option.push({
                    object: cls.qualifiedName,
                    name: option.name,
                    type: 'option',
                    access: getAccess(option)
                });
            });
        }
    });
    _.forOwn(index, function(arr, key) {
        index[key] = library.sortMembers(arr);
    });
    api.index = []
        .concat(index.class)
        .concat(index.property)
        .concat(index.method)
        .concat(index.option)
        .concat(index.constant)
        .concat(index.event);
    api.index = api.index.concat().sort(function(a, b) {
        return a.access !== b.access ? a.access - b.access :
            a.property && !b.property ? 1 :
                !a.property && b.property ? -1 :
                api.index.indexOf(a) - api.index.indexOf(b);
    });
};