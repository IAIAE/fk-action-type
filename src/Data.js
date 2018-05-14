import { reducerGen } from './reducerGen'

function iden(_) { return _; }
function emptyFunc() { }
// global data hash
let nameHash = {}
// global setTimeout timer that check listen event is correct.
let checkTimer = null;

function checkListen(){
    if(Data._staticCheckUselessListen!==true) return;
    if(Data._task.length){
        Data._task.forEach(task=>{
            console.warn(`NO_SUCH_DATA::: '${task.from}' listenOther an event that called '${task.type}', but there is no '${task.to}', please check it!!!!!`)
        })
    }
    Object.keys(nameHash).forEach(key=>{
        let data = nameHash[key]
        let _hookListeners = data._hookListeners;
        if(!_hookListeners) return;
        Object.keys(_hookListeners).forEach(hookName=>{
            let actionType = hookName.split('.')[1];
            if(!isExistEvent(data, hookName, actionType)){
                _hookListeners[hookName].forEach(listener=>{
                    console.warn(`NO_SUCH_EVENT::: '${listener.from}' listenOther an event that called '${hookName}', but there is no '${actionType}' event under '${data.name}', please check it!!!!`)
                })
            }
        })
    })
}

function isExistEvent(data, hookName, actionType){
    if(data._eventCache[actionType]) return true;
    if(data._reducerArr.some(obj=>Object.keys(obj).some(key=>key==hookName))) return true;
    return false;
}



function Data(name, defaultData) {
    if (!name) {
        throw new Error('a Data must has a name, please use `new Data(\'name\')`');
    }
    if (nameHash[name]) {
        console.warn(`duplicate name '${name}' when new Data. please consider change a name;`)
    }
    nameHash[name] = this;
    this._hookListeners = {};
    this._eventCache = {};
    this.name = name;
    this.defaultData = defaultData
    // there is a __reset reducer that clear the data.
    this._reducerArr = [{
        [this.getActionType('__reset')]: (state)=>defaultData
    }];
    if(Data._task.length){
        Data._task = Data._task.filter(_=>(!_()))
    }
    clearTimeout(checkTimer)
    checkTimer = setTimeout(checkListen, 8000)   // ten second.
}
Data._task = [];
Data._getStore = (name) => {
    return nameHash[name]
}
Data.staticCheck = function(value){
    Data._staticCheckUselessListen = value;
}

Data.prototype.getDispatch = function (eventName) {
    if (this.storeDispatch) return this.storeDispatch;
    if (!this.globaleStore) {
        console.error(`call ${this.name}.dispatch('${eventName}') error. maybe you don't specified the 'getStore' when init, check it.`);
        return emptyFunc;
    }
    this.storeDispatch = this.globaleStore().dispatch;
    return this.storeDispatch;
}

Data.prototype.listen = function (eventName, config) {
    let self = this;
    if (this._eventCache[eventName]) {
        console.warn('add event `' + eventName + '` already exist, ignore*****');
        return this;
    }
    config = config || {};
    let actionGen = config.action;
    let reducerMap = config.reducer;

    const ACTION_TYPE = this.getActionType(eventName);
    // create the real action
    let _action = actionGen ? actionGen(ACTION_TYPE) : (data) => ({ type: ACTION_TYPE, data })

    // create the real reducer. if config.reducer is undefined, means this action will not change the state, so reducer is needless.
    reducerMap && this._reducerArr.push(reducerMap(ACTION_TYPE))

    this._eventCache[eventName] = _action;
    return this;
}
function dispatchFunc(eventName, ...rest) {
    let _action = this._eventCache[eventName]
    if (!_action) {
        console.warn('no function listen event:: ' + eventName)
        return;
    }
    return this.getDispatch(eventName)(_action.apply(null, rest));
}
Data.prototype.dispatch = dispatchFunc
function resetFunc(){
    return this.getDispatch('__reset')({type: this.getActionType('__reset')})
}
Data.prototype.reset = resetFunc
Data.prototype.asifReducer = function () {
    let self = this;
    let reducer = (state, action)=>this._reducer(state, action)
    reducer.dispatch = dispatchFunc.bind(this)
    reducer.reset = resetFunc.bind(this)
    reducer._data = this;
    return reducer;
}


/**
 * 这个主要是考虑到其他Data发出的action也可能改变另一个Data，所以还是用原始的reducer来实现
 */
Data.prototype.addReducer = function (actionType, reducerFunc) {
    this._reducerArr.push({
        [actionType]: reducerFunc
    })
    return this;
}


Data.prototype.listenOther = function (type, reducerFunc) {
    let otherStoreName = type.split('.')[0]
    if (otherStoreName) {
        const task = () => {
            let otherStore = Data._getStore(otherStoreName)
            if(otherStore){
                !otherStore._hookListeners[type] && (otherStore._hookListeners[type] = [])
                otherStore._hookListeners[type].push({
                    getDispatch:_=>this.getDispatch(type),
                    from: this.name,
                })
                return true;
            }else{
                return false;
            }
        }
        task.from = this.name;
        task.to = otherStoreName;
        task.type = type;
        if (!task()) {
            Data._task.push(task)
        }
    }
    this._reducerArr.push({
        [type]: reducerFunc
    })
    return this;
}

Data.prototype.getActionType = function (eventName) {
    return this.name + '.' + eventName
}

Data.prototype.init = function (getStore) {
    if (!getStore) {
        console.error(`fk-action-type::${this.name} need a 'getStore' method when init. check your parameter when call ${this.name}.init().`);
        return;
    }
    this.globaleStore = getStore;
    let reducers = this._reducerArr;
    let reducerConfig = Object.assign({}, ...reducers);
    this._reducer = reducerGen(reducerConfig, this.defaultData)
}

export default Data;