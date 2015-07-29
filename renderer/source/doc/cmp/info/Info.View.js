croc.View.define('doc.cmp.info.Info.View', {
    
    construct: function() {
        doc.cmp.info.Info.View.superclass.construct.apply(this, arguments);
        this.__apiMap = this._model.get('api.map');
        this.__desc = this._model.get('desc');
    },
    
    members: {
        formatText: function(text, filterString) {
            if (!text) {
                return text;
            }
            text = croc.utils.strNl2br(text.replace(/\{@(?:link|see)\s*(.*?)\s*}/g, function(match, symbol) {
                return this.makeLink(symbol);
            }.bind(this)));
            if (filterString) {
                text = this.highlight(text, filterString);
            }
            return text;
        },
        
        formatType: function(type) {
            return croc.utils.strEscapeHtml(type).replace(/[\w._$]+/g, function(curType) {
                return this.makeLink(curType);
            }.bind(this));
        },
        
        highlight: function(text, filterString) {
            return croc.utils.strHighlightSubstring(text, filterString, '<span style="color: red">{content}</span>');
        },
        
        makeLink: function(symbol, options) {
            if (!options) {
                options = {};
            }
            
            if (typeof symbol === 'object') {
                symbol = symbol.qualifiedName;
            }
            
            symbol = symbol.replace('.options.', '/options!');
            var segments = symbol.split('#');
            if (!segments[0]) {
                segments[0] = this.__desc.qualifiedName;
            }
            
            if (!this.__apiMap[segments[0]]) {
                return symbol;
            }
            
            if (options.text) {
                symbol = options.text;
            }
            else if (symbol[0] !== '#') {
                symbol = options.full ? segments.join('#') :
                _.last(segments[0].split('.')) + (segments[1] && !options.omitMember ? '#' + segments[1] : '');
            }
            
            var title = options.full ? '' : segments.join('#');
            
            if (options.section) {
                segments[0] += '/' + options.section;
            }
            
            if (!segments[1] && !options.section && segments[0] === this.__desc.qualifiedName) {
                return '<span title="' + title + '" class="g-code">' + symbol + '</span>';
            }
            return '<span title="' + title + '" class="g-pseudo g-link g-code js-page-symbol" data-symbol="' + segments.join('!') + '">' +
                '<span class="g-pseudo-h">' + symbol + '</span>' +
                '</span>';
        },
        
        makeDefinedLink: function(member) {
            if (!member.inherited && !member.included) {
                return '<span class="g-code">' + this.__desc.name + '</span>';
            }
            var cls = member.inherited || member.included;
            return this.makeLink(cls + '#' + member.name, {omitMember: true, section: member.section});
        },
        
        memberHeadClick: function(model, e) {
            if (!$(e.target).closest('.js-page-symbol,.js-member-stopClick').length && model.get('expandable')) {
                model.set('expanded', !model.get('expanded'));
            }
        },
        
        onCreate: function() {
            doc.cmp.info.Info.View.superclass.onCreate.apply(this, arguments);
            
            this._model.on('all', 'tab.member', this.debounce(function(event, member) {
                if (member.name) {
                    var offset = this._widget.getElement().find('.js-info-selected').offset();
                    if (offset) {
                        $(window).scrollTop(offset.top - 60);
                        return;
                    }
                }
                $(window).scrollTop(0);
            }, this));
        },
        
        propertyPart: function(part, member) {
            var section = 'methods';
            var access = member[part + 'ter'];
            if (part === 'change') {
                section = 'events';
                access = member.getter;
            }
            access = access === 'private' ? '__' : access === 'protected' ? '_' : '';
            return this.makeLink('#' + access + part + croc.utils.strUcFirst(member.name), {section: section});
        }
    }
});
