import {reducerGen} from './reducerGen'

const iden = _=>_;
function emptyFunc() { }
// global data hash
let nameHash = {}
// global setTimeout timer that check listen event is correct.
let checkTimer = null;
const passbyAction = func => name => {
    return function(){
        // this is a passby way
        func.apply(null, arguments);
        // then return the real action
        return {
            type: name,
            data: arguments[0]
        }
    }
}
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
    // 不判断这些cgi的回调事件是否有对应reducer处理 todo: 更好的处理机制
    if(/(_success|_fail|_fetching)/.test(hookName)) return true;
    return false;
}
function dispatchFunc(eventName, ...rest) {
    let _action = this._eventCache[eventName]
    if (!_action) {
        console.warn('no function listen event:: ' + eventName)
        return;
    }
    return this.getDispatch(eventName)(_action.apply(null, rest));
}
function resetFunc(){
    return this.getDispatch('__reset')({type: this.getActionType('__reset')})
}

class Data{
    static _task = [];
    static _getStore = (name) => {
        return nameHash[name]
    }
    static staticCheck = function(value){
        Data._staticCheckUselessListen = value;
    }
    static injectLogger = function(log){
        if(typeof log == 'function'){
            Data.__logger = log;
        }else{
            console.warn('the logger must be a function! check the Data.injectLogger function you use.')
        }
    }
    constructor(name, defaultData){
        if (!name) {
            throw new Error('a Data must has a name, please use `new Data(\'name\')`');
        }
        if (nameHash[name]) {
            console.warn(`duplicate name '${name}' when new Data. please consider change a name;`)
            Data.__logger && Data.__logger(`duplicate name '${name}' when new Data. please consider change a name;`)
        }
        nameHash[name] = this;
        this._hookListeners = {};
        this._eventCache = {};
        this.name = name;
        this.defaultData = defaultData || {};
        // there is a __reset reducer that clear the data.
        this._reducerArr = [{
            [this.getActionType('__reset')]: (state)=>defaultData
        }];
        if(Data._task.length){
            Data._task = Data._task.filter(_=>(!_()))
        }
        clearTimeout(checkTimer)
        checkTimer = setTimeout(checkListen, 8000)
    }

    dispatch = dispatchFunc;
    reset = resetFunc;
    getDispatch(eventName) {
        if (this.storeDispatch) return this.storeDispatch;
        if (!this.globaleStore) {
            console.error(`call ${this.name}.dispatch('${eventName}') error. maybe you don't specified the 'getStore' when init, check it.`);
            return emptyFunc;
        }
        this.storeDispatch = this.globaleStore().dispatch;
        return this.storeDispatch;
    }
    passbyListen(eventName, func){
        const ACTION_TYPE = this.getActionType(eventName)
        let _action = passbyAction(func)(ACTION_TYPE)
        this._eventCache[eventName] = _action;
        return this;
    } 
    listen(eventName, config) {
        let self = this;
        if (this._eventCache[eventName]) {
            console.warn('add event `' + eventName + '` already exist, ignore*****');
            return this;
        }
        if(typeof config == 'function'){
            return this.passbyListen(eventName, config);
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
    asifReducer() {
        let self = this;
        let reducer = (state, action)=>this._reducer(state, action)
        reducer.dispatch = dispatchFunc.bind(this)
        reducer.reset = resetFunc.bind(this)
        reducer._data = this;
        return reducer;
    }
    addReducer(actionType, reducerFunc) {
        this._reducerArr.push({
            [actionType]: reducerFunc
        })
        return this;
    }
    listenOther(type, cb) {
        let otherStoreName = type.split('.')[0]
        if (otherStoreName) {
            const task = () => {
                let otherStore = Data._getStore(otherStoreName)
                if(otherStore){
                    !otherStore._hookListeners[type] && (otherStore._hookListeners[type] = [])
                    otherStore._hookListeners[type].push({
                        getDispatch:_=>(action)=>cb(action, this.globaleStore().getState()),
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
        // this._reducerArr.push({
        //     [type]: reducerFunc
        // })
        return this;
    }
    getActionType(eventName) {
        return this.name + '.' + eventName
    }
    init(getStore) {
        if (!getStore) {
            console.error(`fk-action-type::${this.name} need a 'getStore' method when init. check your parameter when call ${this.name}.init().`);
            return;
        }
        this.globaleStore = getStore;
        let reducers = this._reducerArr;
        let reducerConfig = Object.assign({}, ...reducers);
        this._reducer = reducerGen(reducerConfig, this.defaultData)
    }
}


export default Data;