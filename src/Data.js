import {reducerGen} from './reducerGen'

function iden(_){ return _; }

let nameHash = {}

function Data(name, defaultData){
    if(!name){
        throw new Error('a Data must has a name, please use `new Data(\'name\')`');
    }
    if(nameHash[name]){
        console.warn(`duplicate name '${name}' when new Data. please consider change a name;`)
    }
    nameHash[name] = {};
    this._eventCache = {};
    this._reducerArr = [];
    this.name = name;
    this.defaultData = defaultData
}

function emptyFunc(){}

Data.prototype.asifReducer = function(){
    let self = this;
    let reducer = (state, action)=>{
        return this._reducer(state, action)
    }
    reducer.dispatch = dispatchFunc.bind(this)
    reducer._data = this;
    return reducer;
}
Data.prototype.getDispath = function(methodName){
    if(this.storeDispatch) return this.storeDispatch;
    if(!this.globaleStore){
        console.error(`call ${this.name}.${methodName} error. maybe you don't specified the 'getStore' when init, check it.`);
        return emptyFunc;
    }
    this.storeDispatch = this.globaleStore().dispatch;
    return this.storeDispatch;
}

Data.prototype.event = function(eventName, config){
    let self = this;
    if(this._eventCache[eventName]){
        console.warn('add event `'+eventName+'` already exist, ignore*****');
        return this;
    }
    if(!config.action && !config.reducer){
        console.warn('the second parameter of event must have `action` or `reducer` property at least. please check it. this methoddefine is useless. but we\'ll define it still.')
        return this;
    }
    let actionGen = config.action;
    let reducerMap = config.reducer;

     
    
    const ACTION_TYPE = this.getActionType(eventName);
    // create the real action
    let _action = actionGen?actionGen(ACTION_TYPE):(data)=>({type: ACTION_TYPE, data})

    // create the real reducer. if config.reducer is undefined, means this action will not change the state, so reducer is needless.
    reducerMap && this._reducerArr.push(reducerMap(ACTION_TYPE))

    this._eventCache[eventName] = _action;
    return this;
}

Data.prototype.dispatch = function dispatchFunc(eventName, ...rest){
    let _action = this._eventCache[eventName] 
    if(!_action){
        console.warn('no function listen event:: '+eventName)
        return;
    }
    return this.getDispath(eventName)(_action.apply(null, rest));
}
/**
 * 这个主要是考虑到其他Data发出的action也可能改变另一个Data，所以还是用原始的reducer来实现
 */
Data.prototype.addReducer = function(actionType, reducerFunc){
    this._reducerArr.push({
        [actionType]: reducerFunc
    })
    return this;
}


Data.prototype.external = function(type, reducerFunc){
    this._reducerArr.push({
        [type]: reducerFunc
    })
    return this;
}

Data.prototype.getActionType = function(eventName){
    return this.name + '.' + methodName
}

Data.prototype.init = function(getStore){
    if(!getStore){
        console.error(`fk-action-type::${this.name} need a 'getStore' method when init. check your parameter when call ${this.name}.init().`);
        return;
    }
    this.globaleStore = getStore;
    let reducers = this._reducerArr;
    let reducerConfig = Object.assign({}, ...reducers);
    this._reducer = reducerGen(reducerConfig, this.defaultData)
}

export default Data;