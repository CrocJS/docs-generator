croc.Class.define('doc.cmp.info.Info', {
    extend: doc.cmp.main.Tab,
    
    statics: {
        __MEMBER_TYPES: ['method', 'property', 'option', 'event', 'constant']
    },
    
    options: {
        expanded: {
            value: {
                method: true,
                option: false,
                event: true,
                property: true,
                'constant': true
            }
        }
    },
    
    members: {
        /**
         * Инициализация модели виджета
         * @protected
         */
        _initModel: function() {
            doc.cmp.info.Info.superclass._initModel.apply(this, arguments);
            
            this.__desc = this._options.desc = this._options.tab.object;
            this.__tabsModel = this._options.tabsModel;
            this.__apiMap = this._options.api.map;
            this.__viewSource = this._options.api.viewSource;
            this.__processDesc(this.__desc);
            
            this._options.definer = this.__desc.isClass ? 'Class' : this.__desc.definer;
            this._options.filterString = this._options._filterString = '';
            
            //мгновенный поиск
            if (croc.isClient) {
                this._model.on('change', '_filterString', _.debounce(
                    this.disposableFunc(function(value) {
                        if (value) {
                            this._model.set('selectedMember', null);
                        }
                        this._model.set('filterRegExp', value && new RegExp(croc.utils.strEscapeRegexp(value), 'i'));
                        this._model.set('filterString', value);
                    }, this), 300
                ));
            }
            
            //фильтруем члены класса
            var selectedItem;
            var selectedSection;
            this._model.on('change', 'tab.member', function() {
                selectedItem = null;
            });
            
            this._model.on('change', 'membersView.*', function() {
                this._model.increment('_membersView');
            }.bind(this));
            
            doc.cmp.info.Info.__MEMBER_TYPES.forEach(function(type) {
                this._model.checkItem('selected', 'selectedMember', 'sections.' + type);
                this._model.start(
                    'sections.' + type,
                    'desc.' + croc.utils.strPluralize(type), '_membersView', 'filterRegExp', 'tab.member',
                    {copy: 'none', mode: 'array'},
                    function(members, view, re, member) {
                        view = this._options.membersView;
                        return members.filter(function(x) {
                            if (member && (!member.section || member.section === type) && member.name === x.name) {
                                if (selectedItem) {
                                    if (selectedItem === x) {
                                        return true;
                                    }
                                }
                                else {
                                    selectedItem = x;
                                    selectedSection = type;
                                    return true;
                                }
                            }
                            
                            return (view.private || !x.private) && (view.protected || !x.protected) &&
                                (view.inherited || !x.inherited) && (view.included || !x.included) &&
                                (view.properties || !x.property) &&
                                (!re || re.test(x.name) ||
                                x.description && re.test(x.description));
                        });
                    }.bind(this));
            }, this);
            
            this._options.sectionsOrder = ['constant', 'event', 'property', 'option', 'method'];
            
            var memberListener = function() {
                if (selectedItem) {
                    this._model.set('expanded.' + selectedSection, true);
                }
                this._model.set('selectedMember', selectedItem);
            }.bind(this);
            this._model.on('all', 'tab.member', memberListener);
            memberListener();
        },
        
        __createSourceLink: function(code) {
            return this.__viewSource.render({
                file: code[0],
                line: code[1] || 0
            });
        },
        
        __getParents: function(cls) {
            var parent = this.__apiMap[cls.extend];
            return parent ? this.__getParents(parent).concat(this.__processDesc(parent)) : [];
        },
        
        __includeAndInherit: function(desc, prop, section) {
            if (!desc[prop]) {
                desc[prop] = [];
            }
            
            desc.includes.forEach(function(mixin) {
                desc[prop] = desc[prop].concat(mixin[prop].filter(function(x) {
                    return !x.static && !_.some(desc[prop], {name: x.name});
                }).map(function(propDesc) {
                    propDesc = _.clone(propDesc);
                    if (!propDesc.included) {
                        propDesc.included = mixin.qualifiedName;
                    }
                    return propDesc;
                }));
            });
            if (desc.parent) {
                desc[prop] = desc[prop].concat(desc.parent[prop].filter(function(x) {
                    return !x.static && !_.some(desc[prop], {name: x.name});
                }).map(function(propDesc) {
                    propDesc = _.clone(propDesc);
                    if (!propDesc.inherited) {
                        propDesc.inherited = desc.parent.qualifiedName;
                    }
                    return propDesc;
                }));
            }
            desc[prop] = desc[prop].sort(function(a, b) {
                return a.name.indexOf('__') === 0 && b.name.indexOf('__') !== 0 ? 1 :
                    b.name.indexOf('__') === 0 && a.name.indexOf('__') !== 0 ? -1 :
                        a.name.indexOf('_') === 0 && b.name.indexOf('_') !== 0 ? 1 :
                            b.name.indexOf('_') === 0 && a.name.indexOf('_') !== 0 ? -1 :
                                a.static && !b.static ? -1 : !a.static && b.static ? 1 :
                                    a.name.localeCompare(b.name);
            });
            
            //required by interface
            desc[prop].forEach(function(x) {
                x.section = section;
                x.requiredBy = {};
                desc.implements.forEach(function(iface) {
                    var requiredBy = _.find(iface[prop], {name: x.name});
                    if (requiredBy) {
                        x.requiredBy[requiredBy.inherited || iface.qualifiedName] = true;
                    }
                });
                x.requiredBy = Object.keys(x.requiredBy);
            });
        },
        
        __processDesc: function(desc) {
            if (desc.$$processed) {
                return desc;
            }
            var map = this.__apiMap;
            
            desc.isMixin = desc.definer === 'Mixin';
            desc.isInterface = desc.definer === 'Interface';
            desc.isClass = !desc.isMixin && !desc.isInterface;
            desc.source = this.__createSourceLink(desc.code);
            
            desc.parents = this.__getParents(desc);
            desc.parent = _.last(desc.parents);
            
            desc.includes = !desc.include ? [] :
                desc.include.map(function(x) { return this.__processDesc(map[x]); }, this);
            desc.implements = !desc.implement ? [] :
                desc.implement.map(function(x) { return this.__processDesc(map[x]); }, this);
            
            desc.methods = (desc.statics || []).concat(desc.members || [])
                .filter(function(x) { return x.memberType === 'method'; });
            desc.constants = (desc.statics || []).concat(desc.members || [])
                .filter(function(x) { return x.memberType === 'field'; });
            
            doc.cmp.info.Info.__MEMBER_TYPES.forEach(function(type) {
                var prop = croc.utils.strPluralize(type);
                if (prop === 'constants') {
                    desc[prop] = desc[prop].map(_.clone);
                }
                else {
                    this.__includeAndInherit(desc, prop, type);
                }
                desc[prop].forEach(function(x) {
                    x.access = x.private ? 'private' : x.protected ? 'protected' : 'public';
                    x.source = this.__createSourceLink(x.code);
                    
                    x.expandable = x.param && x.param.length || x.requiredBy && x.requiredBy.length ||
                    x.value !== undefined || prop === 'properties';
                }, this);
            }, this);
            
            desc.$$processed = true;
            
            if (desc.isInterface) {
                desc.implementations = _.filter(map, function(x) {
                    return x.implement && _.contains(x.implement, desc.qualifiedName);
                });
            }
            else if (desc.isMixin) {
                desc.includers = _.filter(map, function(x) {
                    return x.include && _.contains(x.include, desc.qualifiedName);
                });
            }
            desc.children = _.filter(map, {extend: desc.qualifiedName});
            
            return desc;
        }
    }
});