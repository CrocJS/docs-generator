var objectPath = require('object-path');

exports.render = function(str, obj) {
    return str.replace(
        /{([^{}]*)}/g,
        function(a, b) {
            var r = obj[b] || objectPath.get(obj, b);
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
};

exports.sortMembers = function(members) {
    return members.sort(function(a, b) {
        return a.name.indexOf('__') === 0 && b.name.indexOf('__') !== 0 ? 1 :
            b.name.indexOf('__') === 0 && a.name.indexOf('__') !== 0 ? -1 :
                a.name.indexOf('_') === 0 && b.name.indexOf('_') !== 0 ? 1 :
                    b.name.indexOf('_') === 0 && a.name.indexOf('_') !== 0 ? -1 :
                        a.name.localeCompare(b.name);
    });
};
