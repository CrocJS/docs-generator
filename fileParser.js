var fs = require('fs');

var esprima = require('esprima');
var objectPath = require('object-path');
var _ = require('lodash');
var Q = require('q');

var library = require('./library');

const GLOBAL_SYMBOL = 'croc';
const DEFINERS = {Class: true, Interface: true, Mixin: true, Plain: true};

function Parser(content, file) {
    this.__content = content.toString();
    this.__file = file;
}

Parser.prototype = {
    constructor: Parser,

    getResult: function() {
        var oldMatch = this.__content.match(/(?:^|\n)([^\s=]+)\s*=[\s\n]*croc\.extend\(([^,]+),/);
        if (oldMatch) {
            var qualifiedName = oldMatch[1];
            return {
                extend: oldMatch[2],
                definer: 'Old',
                qualifiedName: qualifiedName,
                name: _.last(qualifiedName.split('.')),
                packageName: _.initial(qualifiedName.split('.')).join('.'),
                code: [this.__file, 0],
                description: '<b>Class has defined in old style!</b> Rewrite it to allow to generate documentation.'
            };
        }

        var ast = esprima.parse(this.__content, {attachComment: true, loc: true});
        //fs.writeFileSync('tmp.json', JSON.stringify(ast, null, 4));
        var result;
        ast.body.some(function(exp) {
            var callee = objectPath.get(exp, 'expression.callee');
            if (callee) {
                var method = objectPath.get(callee, 'property.name');
                var glob = objectPath.get(callee, 'object.name') || objectPath.get(callee, 'object.object.name');
                var definer = objectPath.get(callee, 'object.property.name') || 'Plain';
                if (method === 'define' && glob === GLOBAL_SYMBOL && DEFINERS[definer]) {
                    var qualifiedName = exp.expression.arguments[0].value;
                    result = _.assign({
                        definer: definer,
                        name: _.last(qualifiedName.split('.')),
                        qualifiedName: qualifiedName,
                        packageName: _.initial(qualifiedName.split('.')).join('.')
                    }, this.__parseComment(exp));

                    var description = exp.expression.arguments[1];
                    if (definer === 'Plain') {
                        result.statics = this.__parseMembers(description, true);
                        result.type = 'static';
                    }
                    else {
                        var properties;
                        description.properties.forEach(function(section) {
                            var key = section.key.name || section.key.value;
                            //noinspection CoffeeScriptSwitchStatementWithNoDefaultBranch
                            switch (key) {
                                case 'extend':
                                    result.extend = this.__getSymbol(section.value);
                                    break;

                                case 'implement':
                                case 'include':
                                    result[key] = this.__getSymbolsArray(section.value);
                                    break;

                                case 'type':
                                    result[key] = section.value.value;
                                    break;

                                case 'statics':
                                case 'members':
                                    result[key] = this.__parseMembers(section.value, key === 'statics');
                                    break;

                                case 'events':
                                    result.events = this.__parseEvents(section.value);
                                    break;

                                case 'properties':
                                    properties = this.__parseProperties(section.value, result.definer === 'Interface');
                                    result.properties = properties.properties;
                                    break;

                                case 'options':
                                    result.options = this.__parseOptions(section.value);
                                    break;
                            }
                        }, this);
                        if (properties) {
                            if (result.members) {
                                result.members = result.members.concat(properties.methods.filter(function(method) {
                                    return !_.find(result.members, function(x) { return x.name === method.name; });
                                }));
                            }
                            else {
                                result.members = properties.methods;
                            }
                            library.sortMembers(result.members);

                            if (result.events) {
                                result.events = result.events.concat(properties.events.filter(function(event) {
                                    return !_.find(result.events, function(x) { return x.name === event.name; });
                                }));
                            }
                            else {
                                result.events = properties.events;
                            }
                            library.sortMembers(result.events);

                            if (result.options) {
                                result.options = result.options.concat(properties.options.filter(function(option) {
                                    return !_.find(result.options, function(x) { return x.name === option.name; });
                                }));
                            }
                            else {
                                result.options = properties.options;
                            }
                            library.sortMembers(result.options);
                        }
                    }

                    return true;
                }
            }
        }, this);
        return result;
    },

    __getSymbol: function(desc) {
        if (desc.object) {
            return this.__getSymbol(desc.object) + '.' + desc.property.name;
        }
        else {
            return desc.name;
        }
    },

    __getSymbolsArray: function(desc) {
        return desc.elements ?
            desc.elements.map(function(x) { return this.__getSymbol(x); }, this) :
            [this.__getSymbol(desc)];
    },

    __foldAst: function(desc) {
        return desc.type === 'ArrayExpression' ? desc.elements.map(this.__foldAst, this) :
            desc.type === 'Literal' ? desc.value : undefined;
    },

    __parseComment: function(desc) {
        var comment = !_.isEmpty(desc.leadingComments) && _.last(desc.leadingComments);
        if (comment && comment.type === 'Block' && comment.value.indexOf('*') === 0) {
            var result = {};
            var clean = comment.value.replace(/(^|\n)[ \t]*\* ?/g, '$1').trim();
            result.description = clean.replace(/(?:\n|^)@(\w+) *([\s\S]*?)(?=\n@|$)/g,
                function(match, docletName, docletValue) {
                    var docletArr = docletName === 'param';
                    if (docletValue) {
                        docletValue = docletValue.trim();
                    }
                    if (docletName === 'return') {
                        docletName = 'returns';
                    }
                    var value = docletValue || true;

                    if (docletName === 'param') {
                        var paramMatch = docletValue.match(/^(?:\{(.*?)} )?\s*(\[)?([^ =\]]+)(?:=([^\]]+))?]?\s*([\s\S]*)$/);
                        value = {
                            name: paramMatch[3],
                            optional: !!paramMatch[2],
                            type: paramMatch[1],
                            defaultValue: paramMatch[4],
                            description: paramMatch[5]
                        };
                    }
                    else if (_.contains(['type', 'returns', 'see'], docletName)) {
                        var docletMatch = docletValue.match(/^\{(.*)}[\s\n]*$/);
                        value = docletMatch ? docletMatch[1] : docletValue;
                    }

                    if (docletArr) {
                        (result[docletName] || (result[docletName] = [])).push(value);
                    }
                    else {
                        result[docletName] = value;
                    }
                    return '';
                }.bind(this));
            result.code = [this.__file, +comment.loc.start.line];

            return result;
        }
        else {
            return {
                code: [this.__file, +desc.loc.start.line]
            };
        }
    },

    __parseEvents: function(desc) {
        return desc.properties.map(function(event) {
            return _.assign({name: event.key.name || event.key.value}, this.__parseComment(event));
        }, this);
    },

    __parseProperties: function(desc, isInterface) {
        var result = {
            methods: [],
            properties: [],
            events: [],
            options: []
        };

        desc.properties.forEach(function(property) {
            var propName = property.key.name || property.key.value;
            var propDesc = _.assign({
                name: propName,
                getter: 'public',
                setter: 'public'
            }, this.__parseComment(property));
            var getterDesc = {
                name: 'get' + _.capitalize(propName),
                returns: propDesc.type || '*',
                property: propName,
                description: 'Returns value of the property {@link #' + propName + '}',
                memberType: 'method',
                code: propDesc.code
            };
            var setterDesc = {
                name: 'set' + _.capitalize(propName),
                param: [{
                    name: 'value',
                    type: propDesc.type || '*'
                }],
                property: propName,
                description: 'Changes value of the property {@link #' + propName + '}',
                memberType: 'method',
                code: propDesc.code
            };
            var eventDesc = {
                name: 'change' + _.capitalize(propName),
                property: propName,
                param: [{
                    name: 'value',
                    type: propDesc.type || '*'
                }, {
                    name: 'old',
                    type: propDesc.type || '*'
                }],
                description: 'Fires after value changing of the property {@link #' + propName + '}',
                code: propDesc.code
            };
            var optionDesc = {
                name: propName,
                property: propName,
                description: (propDesc.description || '') +
                (!propDesc.description ? '' : (_.endsWith(propDesc.description.trim(), '.') ? '' : '.') + ' ') +
                'Option to specify value of the property {@link #' + propName + '}',
                type: propDesc.type,
                code: propDesc.code
            };
            var getterExists = false;
            var setterExists = false;
            var eventExists = false;
            var optionExists = false;

            property.value.properties.forEach(function(section) {
                var key = section.key.name || section.key.value;
                //noinspection CoffeeScriptSwitchStatementWithNoDefaultBranch
                switch (key) {
                    case 'inherit':
                        propDesc.inherit = section.value.value;
                        break;

                    case 'option':
                        optionExists = true;
                        if (typeof section.value.value === 'string') {
                            optionDesc.name = section.value.value;
                        }

                        break;

                    case '__getter':
                        propDesc.getter = 'private';
                        eventDesc.private = getterDesc.private = true;
                        getterDesc.name = '__' + getterDesc.name;
                        eventDesc.name = '__' + eventDesc.name;
                        getterExists = true;
                        break;

                    case '_getter':
                        propDesc.getter = 'protected';
                        eventDesc.protected = getterDesc.protected = true;
                        getterDesc.name = '_' + getterDesc.name;
                        eventDesc.name = '_' + eventDesc.name;
                        getterExists = true;
                        break;

                    case 'getter':
                        getterExists = true;
                        break;

                    case '__setter':
                        propDesc.setter = 'private';
                        setterDesc.private = true;
                        setterDesc.name = '__' + setterDesc.name;
                        setterExists = true;
                        break;

                    case '_setter':
                        propDesc.setter = 'protected';
                        setterDesc.protected = true;
                        setterDesc.name = '_' + setterDesc.name;
                        setterExists = true;
                        break;

                    case 'setter':
                        setterExists = true;
                        break;

                    case 'check':
                    case 'value':
                        optionDesc[key] = propDesc[key] = this.__foldAst(section.value);
                        break;

                    case 'apply':
                        if (typeof section.value.value === 'string') {
                            propDesc.apply = section.value.value;
                        }
                        break;

                    case 'event':
                        if (section.value.value) {
                            propDesc.event = true;
                            eventExists = true;
                        }
                        break;
                }
            }, this);

            result.properties.push(propDesc);
            if (!isInterface || !setterExists || getterExists) {
                result.methods.push(getterDesc);
            }
            if (!isInterface || !getterExists || setterExists) {
                result.methods.push(setterDesc);
            }
            if (eventExists) {
                result.events.push(eventDesc);
            }
            if (optionExists) {
                result.options.push(optionDesc);
            }
            result.private = getterDesc.private && setterDesc.private;
            if (!result.private) {
                result.protected = (getterDesc.protected || getterDesc.private) && (setterDesc.protected || getterDesc.protected);
            }
        }, this);

        return result;
    },

    __parseMembers: function(desc, isStatic) {
        return desc.properties.map(function(member) {
            var result = _.assign({
                name: member.key.name || member.key.value,
                memberType: member.value.type === 'FunctionExpression' ? 'method' : 'field'
            }, this.__parseComment(member));
            if (isStatic) {
                result.static = true;
            }
            return result;
        }, this);
    },

    __parseOptions: function(desc) {
        return desc.properties.map(function(option) {
            var result = _.assign({name: option.key.name || option.key.value}, this.__parseComment(option));
            if (option.value.type === 'ObjectExpression') {
                option.value.properties.forEach(function(section) {
                    var key = section.key.name || section.key.value;
                    if (key === 'check' || key === 'value') {
                        result[key] = this.__foldAst(section.value);
                    }
                    else if (key === 'required') {
                        result.required = section.value.value;
                    }
                }, this);
            }
            else {
                result.value = this.__foldAst(option.value);
            }
            return result;
        }, this);
    }
};


exports.parse = function(path, associatedFileName) {
    return Q.denodeify(fs.readFile)(path).then(function(file) {
        return new Parser(file, associatedFileName).getResult();
    });
};