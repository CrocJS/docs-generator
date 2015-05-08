croc.Class.define('doc.data.TabsModel', {
    extend: croc.data.Model,
    
    statics: {
        /**
         * @private
         * @static
         */
        __MAX_TABS: 20
    },
    
    events: {
        /**
         * @param {string} symbol
         */
        symbolSet: null
    },
    
    properties: {
        activeTab: {
            apply: '__applyActiveTab',
            event: true
        },
        member: {
            model: true
        }
    },
    
    options: {
        api: {},
        data: {}
    },
    
    construct: function(options) {
        options.data = _.merge({
            tabs: [],
            activeTab: null,
            member: null
        }, options.data);
        
        doc.data.TabsModel.superclass.__construct__.apply(this, arguments);
    },
    
    members: {
        addTab: function(tab, activate) {
            if (this.tabs.length > doc.data.TabsModel.__MAX_TABS) {
                this._model.pop('tabs');
            }
            this._model.insert('tabs', this.__getBeginTabIndex(), [tab]);
            if (activate) {
                this.setActiveTab(tab);
            }
        },
        
        closeTab: function(tab) {
            var index = this.tabs.indexOf(tab);
            var activeTab = this.getActiveTab();
            this._model.remove('tabs', index);
            if (activeTab === tab) {
                this.setActiveTab(this.tabs.length === 0 ? null : this.tabs[index] || _.last(this.tabs));
            }
        },
        
        moveTabToBegin: function(tab) {
            this._model.move('tabs', this.tabs.indexOf(tab), this.__getBeginTabIndex(), 1);
        },
        
        setSymbol: function(symbol) {
            var tmp = symbol.split('!');
            var memberName = tmp[1];
            tmp = tmp[0];
            tmp = tmp.split('/');
            var section = tmp[1];
            var cls = tmp[0];
            
            this.__internalActiveTab = true;
            if (this.setTabFromSymbolObject(cls)) {
                if (memberName || section) {
                    this._model.set('activeTab.member', {
                        name: memberName,
                        section: section
                    });
                }
                else if (this.activeTab.member) {
                    this._model.del('activeTab.member');
                }
                this.fireEvent('symbolSet', symbol);
            }
            this.__internalActiveTab = false;
        },
        
        setTabFromSymbolObject: function(cls, dontFireSymbolSet) {
            var desc = this._options.api.map[cls];
            if (!desc) {
                return false;
            }
            
            var tab = _.find(this.tabs, {object: desc});
            if (!tab) {
                this.addTab(tab = {
                    title: desc.name,
                    objectName: desc.qualifiedName,
                    object: desc,
                    widget: doc.cmp.info.Info.classname,
                    icon: doc.Helper.getIconByObject(desc)
                });
            }
            
            this.setActiveTab(tab);
            
            return true;
        },
        
        __getBeginTabIndex: function() {
            var index = _.findIndex(this.tabs, function(x) { return !x.permanent; });
            return index === -1 ? this.tabs.length : index;
        },
        
        __applyActiveTab: function(tab, old) {
            if (old) {
                this._model.del('activeTab.active');
                this._model.removeRef('activeTab');
            }
            if (tab) {
                this._model.ref('activeTab', 'tabs.' + this.tabs.indexOf(tab), {updateIndices: true});
                this._model.set('activeTab.active', true);
            }
            else {
                this._model.set('activeTab', null);
            }
            
            if (!this.__internalActiveTab) {
                this.fireEvent('symbolSet', tab ? tab.objectName : '');
            }
        }
    }
});