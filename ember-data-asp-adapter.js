(function () {

    var get = Ember.get, getPath = Ember.getPath;

    DS.ASPAdapter = DS.Adapter.extend({
        /**
        Request base url
        @type String
        */
        baseUrl: '',

        /**
        Indicates if bulk commits are allowed
        @type Boolean
        */
        bulkCommit: false,

        /**
        Creates a new record
        @param {DS.Adapter} store Data adapter
        @param {DS.Model} type Model type
        @param {Ember.Object} model Object to create
        */
        createRecord: function (store, type, model) {
            var root = this.rootForType(type),
                data = this.titleize(get(model, 'data')),
                plural = this.pluralize(root),
                url = [this.baseUrl, plural, 'create'].join('/');

            this.ajax(url, {
                data: data,
                success: function (json) {
                    store.didCreateRecord(model, json[root]);
                }
            });
        },

        /**
        Creates multiple records
        @param {DS.Adapter} store Data adapter
        @param {DS.Model} type Model type
        @param {Array} models Objects to create
        */
        createRecords: function (store, type, models) {
            if (get(this, 'bulkCommit') === false) {
                return this._super(store, type, models);
            }

            var root = this.rootForType(type),
                plural = this.pluralize(root),
                data = {},
                url = [this.baseUrl, plural, 'create'].join('/'),
                titleize = this.titleize;

            data[plural] = models.map(function (model) {
                return titleize(get(model, 'data'));
            });

            this.ajax(url, "POST", {
                data: data,
                success: function (json) {
                    store.didCreateRecords(type, models, json[plural]);
                }
            });

            return this;
        },

        /**
        Updates changes in an object
        @param {DS.Adapter} store Data adapter
        @param {DS.Model} type Model type
        @param {Ember.Object} model Object to update
        */
        updateRecord: function (store, type, model) {
            var primaryKey = getPath(type, 'proto.primaryKey'),
                id = get(model, primaryKey),
                root = this.rootForType(type),
                data = this.titleize(get(model, 'data')),
                plural = this.pluralize(root),
                url = [this.baseUrl, plural, 'edit', id].join("/");

            this.ajax(url, "POST", {
                data: data,
                success: function (json) {
                    store.didUpdateRecord(model, json[root]);
                }
            });
        },

        /**
        Updates changes in multiple objects
        @param {DS.Adapter} store Data adapter
        @param {DS.Model} type Model type
        @param {Ember.Object} models Objects to update
        */
        updateRecords: function (store, type, models) {
            if (get(this, 'bulkCommit') === false) {
                return this._super(store, type, models);
            }

            var root = this.rootForType(type),
                plural = this.pluralize(root),
                url = [this.baseUrl, plural, 'edit'].join('/'),
                data = {},
                titleize = this.titleize;

            data[plural] = models.map(function (model) {
                return titleize(get(model, 'data'));
            });

            this.ajax(url, "POST", {
                data: data,
                success: function (json) {
                    store.didUpdateRecords(models, json[plural]);
                }
            });

            return this;
        },

        /**
        Deletes an object.
        @param {DS.Adapter} store Data adapter
        @param {DS.Model} type Model type
        @param {Ember.Object} model Object to delete
        */
        deleteRecord: function (store, type, model) {
            var primaryKey = getPath(type, 'proto.primaryKey'),
                id = get(model, primaryKey),
                root = this.rootForType(type),
                plural = this.pluralize(root),
                url = [this.baseUrl, plural, 'delete', id].join('/');

            this.ajax(url, "POST", {
                success: function () {
                    store.didDeleteRecord(model);
                }
            });

            return this;
        },

        /**
        Deletes multiple objects
        @param {DS.Adapter} store Data adapter
        @param {DS.Model} type Model type
        @param {Ember.Object} models Objects to delete
        */
        deleteRecords: function (store, type, models) {
            if (get(this, 'bulkCommit') === false) {
                return this._super(store, type, models);
            }

            var root = this.rootForType(type),
                plural = this.pluralize(root),
                url = [this.baseUrl, plural, 'delete'].join('/'),
                primaryKey = getPath(type, 'proto.primaryKey'),
                data = {};

            data[plural] = models.map(function (model) {
                return get(model, primaryKey);
            });

            this.ajax(url, "POST", {
                data: data,
                success: function () {
                    store.didDeleteRecords(models);
                }
            });

            return this;
        },

        /**
        Finds an object with the specified id.
        @param {DS.Adapter} store Data adapter
        @param {DS.Model} type Model type
        @param {Number|String} id Object id
        */
        find: function (store, type, id) {
            var root = this.rootForType(type),
                url = [this.baseUrl, this.pluralize(root), 'details', id].join('/');

            this.ajax(url, "GET", {
                success: function (json) {
                    store.load(type, json[root]);
                }
            });

            return this;
        },

        /**
        Finds multiple objects by their ids.
        @param {DS.Adapter} store Data adapter
        @param {DS.Model} type Model type
        @param {Array} ids Object ids
        */
        findMany: function (store, type, ids) {
            var root = this.rootForType(type),
                plural = this.pluralize(root),
                url = [this.baseUrl, plural].join('/');

            this.ajax(url, "GET", {
                data: { ids: ids },
                success: function (json) {
                    store.loadMany(type, ids, json[plural]);
                }
            });
        },

        /**
        Finds all the object of a given type
        @param {DS.Adapter} store Data adapter
        @param {DS.Model} type Model type
        */
        findAll: function (store, type) {
            var root = this.rootForType(type),
                plural = this.pluralize(root);

            this.ajax("/" + plural, "GET", {
                success: function (json) {
                    store.loadMany(type, json[plural]);
                }
            });
        },

        /**
        Queries for objects of a given type
        @param {DS.Adapter} store Data adapter
        @param {DS.Model} type Model type
        @param {String} query Query
        @param {DS.ModelArray} modelArray Destination object
        */
        findQuery: function (store, type, query, modelArray) {
            var root = this.rootForType(type),
                plural = this.pluralize(root);

            this.ajax("/" + plural, "GET", {
                data: query,
                success: function (json) {
                    modelArray.load(json[plural]);
                }
            });
        },

        // HELPERS

        /**
        Hash of special plural cases.
        @type Object
        */
        plurals: {},

        /**
        Pluralizes the given name.
        You can define a plurals hash to define 
        special-case pluralization.
        @param {String} word 
        Word to pluralized
        @return {St ring} Pluralized word
        */
        pluralize: function (word) {
            if (this.plurals[word]) {
                return this.plurals[word];
            }
            if (/y$/i.test(word)) {
                return word.slice(0, -1) + 'ies';
            }
            return word + 's';
        },

        /**
        Titleizes the properties of the give object.
        @param {Object} data Object to titleize
        @return {Object} Object with titleize properties
        */
        titleizeData: function (data) {
            var tdata = {},
                t = this.titleize;
            for (var prop in data) {
                tdata[t(prop)] = data[prop];
            }
            return tdata;
        },

        /**
        Uppercase the first letter in the text or the 
        first letter of the object properties.
        @param {String|Object} data Data to titleize
        */
        titleize: function (data) {
            if (typeof data === 'object') {
                return this.titleizeData(data); 
            }
            var letter = data.charAt(0).toUpperCase();
            return letter + data.slice(1);
        },


        rootForType: function (type) {
            if (type.url) { return type.url; }

            var parts = type.toString().split("."),
                name = parts[parts.length - 1];

            return name.replace(/([A-Z])/g, '_$1').toLowerCase().slice(1);
        },

        /**
        Encapsulates an ajax request by adding common ajax options.
        @param {String} url Request url
        @param {String} type Request verb
        @param {Object} hash Request options
        */
        ajax: function (url, type, hash) {
            hash.url = url;
            hash.type = type;
            hash.dataType = "json";

            jQuery.ajax(hash);
        }
    });

} ());