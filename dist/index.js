(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.FkActionType = factory());
}(this, (function () { 'use strict';

/**
 * usage: reducerGen({
 *      fetching: function(state, action){ return state;},
 *      success: function(state, action){ return actioin.payload},
 *      fail: state=>state
 * })
 * @param {Object} config 
 */
function reducerGen(config, defaultStatus) {
    var cases = Object.keys(config);
    defaultStatus = defaultStatus || {};
    return function () {
        var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultStatus;
        var action = arguments[1];

        if (~cases.indexOf(action.type)) {
            var newState = config[action.type](state, action);
            return newState;
        } else {
            return state;
        }
    };
}

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();





var defineProperty = function (obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
};



































var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

function emptyFunc() {}
// global data hash
var nameHash = {};
// global setTimeout timer that check listen event is correct.
var checkTimer = null;

function checkListen() {
    if (Data$1._staticCheckUselessListen !== true) return;
    if (Data$1._task.length) {
        Data$1._task.forEach(function (task) {
            console.warn('NO_SUCH_DATA::: \'' + task.from + '\' listenOther an event that called \'' + task.type + '\', but there is no \'' + task.to + '\', please check it!!!!!');
        });
    }
    Object.keys(nameHash).forEach(function (key) {
        var data = nameHash[key];
        var _hookListeners = data._hookListeners;
        if (!_hookListeners) return;
        Object.keys(_hookListeners).forEach(function (hookName) {
            var actionType = hookName.split('.')[1];
            if (!isExistEvent(data, hookName, actionType)) {
                _hookListeners[hookName].forEach(function (listener) {
                    console.warn('NO_SUCH_EVENT::: \'' + listener.from + '\' listenOther an event that called \'' + hookName + '\', but there is no \'' + actionType + '\' event under \'' + data.name + '\', please check it!!!!');
                });
            }
        });
    });
}

function isExistEvent(data, hookName, actionType) {
    if (data._eventCache[actionType]) return true;
    if (data._reducerArr.some(function (obj) {
        return Object.keys(obj).some(function (key) {
            return key == hookName;
        });
    })) return true;
    return false;
}
function dispatchFunc(eventName) {
    var _action = this._eventCache[eventName];
    if (!_action) {
        console.warn('no function listen event:: ' + eventName);
        return;
    }

    for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        rest[_key - 1] = arguments[_key];
    }

    return this.getDispatch(eventName)(_action.apply(null, rest));
}
function resetFunc() {
    return this.getDispatch('__reset')({ type: this.getActionType('__reset') });
}

var Data$1 = function () {
    function Data(name, defaultData) {
        classCallCheck(this, Data);

        _initialiseProps.call(this);

        if (!name) {
            throw new Error('a Data must has a name, please use `new Data(\'name\')`');
        }
        if (nameHash[name]) {
            console.warn('duplicate name \'' + name + '\' when new Data. please consider change a name;');
        }
        nameHash[name] = this;
        this._hookListeners = {};
        this._eventCache = {};
        this.name = name;
        this.defaultData = defaultData || {};
        // there is a __reset reducer that clear the data.
        this._reducerArr = [defineProperty({}, this.getActionType('__reset'), function (state) {
            return defaultData;
        })];
        if (Data._task.length) {
            Data._task = Data._task.filter(function (_) {
                return !_();
            });
        }
        clearTimeout(checkTimer);
        checkTimer = setTimeout(checkListen, 8000);
    }

    createClass(Data, [{
        key: 'getDispatch',
        value: function getDispatch(eventName) {
            if (this.storeDispatch) return this.storeDispatch;
            if (!this.globaleStore) {
                console.error('call ' + this.name + '.dispatch(\'' + eventName + '\') error. maybe you don\'t specified the \'getStore\' when init, check it.');
                return emptyFunc;
            }
            this.storeDispatch = this.globaleStore().dispatch;
            return this.storeDispatch;
        }
    }, {
        key: 'listen',
        value: function listen(eventName, config) {
            var self = this;
            if (this._eventCache[eventName]) {
                console.warn('add event `' + eventName + '` already exist, ignore*****');
                return this;
            }
            config = config || {};
            var actionGen = config.action;
            var reducerMap = config.reducer;

            var ACTION_TYPE = this.getActionType(eventName);
            // create the real action
            var _action = actionGen ? actionGen(ACTION_TYPE) : function (data) {
                return { type: ACTION_TYPE, data: data };
            };

            // create the real reducer. if config.reducer is undefined, means this action will not change the state, so reducer is needless.
            reducerMap && this._reducerArr.push(reducerMap(ACTION_TYPE));

            this._eventCache[eventName] = _action;
            return this;
        }
    }, {
        key: 'asifReducer',
        value: function asifReducer() {
            var _this = this;

            var self = this;
            var reducer = function reducer(state, action) {
                return _this._reducer(state, action);
            };
            reducer.dispatch = dispatchFunc.bind(this);
            reducer.reset = resetFunc.bind(this);
            reducer._data = this;
            return reducer;
        }
    }, {
        key: 'addReducer',
        value: function addReducer(actionType, reducerFunc) {
            this._reducerArr.push(defineProperty({}, actionType, reducerFunc));
            return this;
        }
    }, {
        key: 'listenOther',
        value: function listenOther(type, cb) {
            var _this2 = this;

            var otherStoreName = type.split('.')[0];
            if (otherStoreName) {
                var task = function task() {
                    var otherStore = Data._getStore(otherStoreName);
                    if (otherStore) {
                        !otherStore._hookListeners[type] && (otherStore._hookListeners[type] = []);
                        otherStore._hookListeners[type].push({
                            getDispatch: function getDispatch(_) {
                                return function (action) {
                                    return cb(action, _this2.globaleStore().getState());
                                };
                            },
                            from: _this2.name
                        });
                        return true;
                    } else {
                        return false;
                    }
                };
                task.from = this.name;
                task.to = otherStoreName;
                task.type = type;
                if (!task()) {
                    Data._task.push(task);
                }
            }
            // this._reducerArr.push({
            //     [type]: reducerFunc
            // })
            return this;
        }
    }, {
        key: 'getActionType',
        value: function getActionType(eventName) {
            return this.name + '.' + eventName;
        }
    }, {
        key: 'init',
        value: function init(getStore) {
            if (!getStore) {
                console.error('fk-action-type::' + this.name + ' need a \'getStore\' method when init. check your parameter when call ' + this.name + '.init().');
                return;
            }
            this.globaleStore = getStore;
            var reducers = this._reducerArr;
            var reducerConfig = Object.assign.apply(Object, [{}].concat(toConsumableArray(reducers)));
            this._reducer = reducerGen(reducerConfig, this.defaultData);
        }
    }]);
    return Data;
}();

Data$1._task = [];

Data$1._getStore = function (name) {
    return nameHash[name];
};

Data$1.staticCheck = function (value) {
    Data$1._staticCheckUselessListen = value;
};

var _initialiseProps = function _initialiseProps() {
    this.dispatch = dispatchFunc;
    this.reset = resetFunc;
};

return Data$1;

})));
