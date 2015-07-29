/**
 * todo убирать selection при закрытии
 */
croc.Class.define('doc.cmp.navigation.search.Suggestion', {
    extend: croc.cmp.form.suggestion.Suggestion,
    
    options: {
        /**
         * Размер относительно размера target
         * @type {boolean}
         */
        autoSize: false,
        
        api: {},
        
        /**
         * Убрать фокус с поля после выбора
         * @type {boolean}
         */
        blurOnChoose: true,
        
        /**
         * Не выделять текст после выбора
         * @type {boolean}
         */
        disableTextSelection: true,
        
        mod: 'api',
        
        /**
         * @type {function(*):{text: ..., value: ...}}
         */
        normalizeFn: function(x) { return {text: x.name}; },
        
        initiallyEmpty: true,
        
        openCondition: {
            value: {
                items: false,
                search: true
            }
        },
        
        /**
         * Открывать даже пустой список
         * @type {boolean}
         */
        openEmpty: true,
    
        /**
         * Смещение bubble относительно target
         * число - смещение по горизонтали/вертикали
         * массив - вектор смещения
         * @type {number}
         */
        offset: 5,
        
        partialRendering: true,
        
        /**
         * Функция, которая возвращает части элементов массива, по которым возможен поиск
         * @type {function(*):Array}
         */
        searchableItemPartsFn: function(x) { return [x.name]; },
        
        visibleCount: 8,
        
        /**
         * Нужно ли обновлять значение поля при передвижении по списку подсказок
         * @type {Boolean}
         */
        updateInputOnSelect: false,
        
        /**
         * Нужно ли обновлять текстовое поле при выборе значения из подсказки
         * @type {string}
         */
        inputOnChoose: 'empty'
    },
    
    members: {
        selectAllTypes: function() {
            this._model.set('filterType', this.__allTypes);
        },
        
        toggleType: function(type) {
            if (this._options.allTypesSelected) {
                this._model.set('filterType',
                    _(this._options.types).map(function(x) { return [x, x === type]; }).zipObject().value());
            }
            else if (_.filter(this._options.filterType).length > 1 || !this._options.filterType[type]) {
                this._model.set('filterType.' + type, !this._options.filterType[type]);
            }
        },
        
        /**
         * Инициализация модели виджета
         * @protected
         */
        _initModel: function() {
            this._options.types = ['class', 'interface', 'mixin', 'constant', 'event', 'property', 'option', 'method'];
            this._options.filterType = _(this._options.types).map(function(x) { return [x, true]; }).zipObject().value();
            this.__allTypes = _.clone(this._options.filterType);
            
            var listener = function() {
                this._model.set('allTypesSelected', _.every(this._options.filterType));
                if (model) {
                    model.update();
                }
            }.bind(this);
            this._model.on('change', 'filterType', listener);
            this._model.on('change', 'filterType.*', listener);
            listener();
            
            var model = this._options.model = new croc.data.chain.From({source: this._options.api.index})
                .chain(croc.data.chain.Map, {
                    mapper: function(items) {
                        var types = this._options.filterType;
                        return this._options.allTypesSelected ? items : items.filter(function(item) {
                            return types[doc.Helper.getNodeType(item, this._options.api.map)];
                        }, this);
                    }.bind(this)
                });
            
            doc.cmp.navigation.search.Suggestion.superclass._initModel.apply(this, arguments);
        }
    }
});
