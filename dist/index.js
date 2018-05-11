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

var nameHash = {};

function Data$1(name, defaultData) {
    if (!name) {
        throw new Error('a Data must has a name, please use `new Data(\'name\')`');
    }
    if (nameHash[name]) {
        console.warn('duplicate name \'' + name + '\' when new Data. please consider change a name;');
    }
    nameHash[name] = this;
    this._hookListeners = {};
    this._eventCache = {};
    this._reducerArr = [];
    this.name = name;
    this.defaultData = defaultData;
    if (Data$1._task.length) {
        Data$1._task = Data$1._task.filter(function (_) {
            return !_();
        });
    }
}
Data$1._task = [];
Data$1._getStore = function (name) {
    return nameHash[name];
};

Data$1.prototype.getDispath = function (eventName) {
    if (this.storeDispatch) return this.storeDispatch;
    if (!this.globaleStore) {
        console.error('call ' + this.name + '.dispatch(\'' + eventName + '\') error. maybe you don\'t specified the \'getStore\' when init, check it.');
        return emptyFunc;
    }
    this.storeDispatch = this.globaleStore().dispatch;
    return this.storeDispatch;
};

Data$1.prototype.event = function (eventName, config) {
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
};
function dispatchFunc(eventName) {
    var _action = this._eventCache[eventName];
    if (!_action) {
        console.warn('no function listen event:: ' + eventName);
        return;
    }

    for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        rest[_key - 1] = arguments[_key];
    }

    return this.getDispath(eventName)(_action.apply(null, rest));
}
Data$1.prototype.dispatch = dispatchFunc;
Data$1.prototype.asifReducer = function () {
    var _this = this;

    var self = this;
    var reducer = function reducer(state, action) {
        return _this._reducer(state, action);
    };
    reducer.dispatch = dispatchFunc.bind(this);
    reducer._data = this;
    return reducer;
};
/**
 * 这个主要是考虑到其他Data发出的action也可能改变另一个Data，所以还是用原始的reducer来实现
 */
Data$1.prototype.addReducer = function (actionType, reducerFunc) {
    this._reducerArr.push(defineProperty({}, actionType, reducerFunc));
    return this;
};

Data$1.prototype.external = function (type, reducerFunc) {
    var _this2 = this;

    var otherStoreName = type.split('.')[0];
    if (otherStoreName) {
        var task = function task() {
            var otherStore = Data$1._getStore(otherStoreName);
            if (otherStore) {
                !otherStore._hookListeners[type] && (otherStore._hookListeners[type] = []);
                otherStore._hookListeners[type].push(function (_) {
                    return _this2.getDispath(type);
                });
                return true;
            } else {
                return false;
            }
        };
        if (!task()) {
            Data$1._task.push(task);
        }
    }
    this._reducerArr.push(defineProperty({}, type, reducerFunc));
    return this;
};

Data$1.prototype.getActionType = function (eventName) {
    return this.name + '.' + eventName;
};

Data$1.prototype.init = function (getStore) {
    if (!getStore) {
        console.error('fk-action-type::' + this.name + ' need a \'getStore\' method when init. check your parameter when call ' + this.name + '.init().');
        return;
    }
    this.globaleStore = getStore;
    var reducers = this._reducerArr;
    var reducerConfig = Object.assign.apply(Object, [{}].concat(toConsumableArray(reducers)));
    this._reducer = reducerGen(reducerConfig, this.defaultData);
};

return Data$1;

})));
