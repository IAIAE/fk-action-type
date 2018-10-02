interface AnyObject{
    [prop: string]: any;
}
export enum LogType {
    NAME_DUPLICATE= 1,
    LISTEN_TYPE_DUPLICATE= 2, 
    DISPATCH_NO_LISTEN_ACTION= 3,
}
export default class Data {
    static _task: Array<()=>boolean>;
    static _getStore: (name: string) => Data|null;
    /**
     * 是否进行静态引用检查，如果是，将检查所有listenOther的依赖是否存在
     */
    static staticCheck: (value: boolean) => void;
    /**
     * 注册一个上报函数，fk-action-type在一些console.warn的时候会调用这个函数进行上报
     */
    static injectLogger: (loggerFunc: (logObj: {type:LogType, msg: string}) => void) => void;
    name: string;
    globaleStore: ReduxStore;
    _hookListeners: {
        [actionType: string]: Array<{
            from: string;
            getDispatch: ()=>(action: Action, snapshot: AnyObject)=>any;
        }>
    }
    _eventCache: {
        [eventName: string]: (...args: any[])=>Action;
    }
    defaultData: AnyObject;
    _reducerArr: Array<{
        [actionType: string]: Reducer<AnyObject, Action>
    }>
    _reducer: Reducer<AnyObject, Action>;

    constructor(name: string, defaulData?: AnyObject);
    dispatch: DispatchFunc;
    /**
      * 清空store的状态，一般在组件销毁的时候调用。
      * 在组件销毁时，如果你希望此时的数据状态可以保留，那么不要调用此方法。
      * 而如果你希望数据状态随着组件销毁一起清空。就调用该方法。
      */
    reset: resetFunc;
    getDispatch(eventName: string): DispatchFunc;

    /**
     * 监听一个事件，在config里面配置对应的action和reducer 
     * @param eventName 事件名称
     * @param config {action: {}, reducer: {}} 这样的形式
     * @returns this 返回this自身，可以链式调用
     */
    listen(eventName:string, config?:AnyObject): Data;

    /**
     * 监听一个事件，触发的时候调用旁路函数，不会改变组件本身数据，其他组件也能监听到这个事件
     * @param eventName 事件名称
     * @param func 旁路函数
     */
    passbyListen(eventName:string, func:(...args:any[])=>void): Data;

    /**
     * 将这个Data对象伪装成一个reducer的样子，返回结果可以直接当做reducer用。
     * @returns (state, action)=>newState 的一个方法。
     */
    asifReducer(): ReducerLike<AnyObject, Action>;

    /**
     * 不推荐用了这个方法
     * @param actionType 
     * @param reducerFunc 
     */
    addReducer(actionType: string, reducerFunc: Reducer<AnyObject, Action>): Data;

    /**
     * 监听其他Data的事件，如果触发了，就会调用cb，传入两个参数，
     * 第一个参数是action，即其他Data发出的action，
     * 第二个参数是snapshot，即当前自己store的一个快照 
     * @param actionType 其他Data的action.type
     * @param cb 事件回调cb(action, snapshot) 
     */
    listenOther(actionType: string, cb: (action: Action, snapshot: AnyObject)=>any): Data;

    /**
     * 内部使用，不推荐改动
     * @param eventName 
     */
    getActionType(eventName: string): string;

    /**
     * 初始化这个Data，传入的第一个参数是Redux创建的store对象，主要用来获取store.dispatch方法
     * @param store 一个Redux的store
     */
    init(store: ReduxStore): void;
}
interface Reducer<T, A>{
    (state: T, action?: A): T;
}
interface resetFunc{
    (): any;
}
interface ReduxStore{
    dispatch: (action: Action)=>any;
    getState: ()=>AnyObject;
}
interface DispatchFunc{
    (eventName?: string, ...rest:any[]):any
}
interface ReducerLike<T, A>{
    (state: T, action?: A): T;

    /**
     * Data.dispath('click', param1, param2, ...)
     * 发送一个事件给数据层
     */
    dispatch: DispatchFunc;

    /**
      * 清空store的状态，一般在组件销毁的时候调用。
      * 在组件销毁时，如果你希望此时的数据状态可以保留，那么不要调用此方法。
      * 而如果你希望数据状态随着组件销毁一起清空。就调用该方法。
      */
    reset: resetFunc;

    /**
     * 指向内部的一个Data实例，一般情况下你可以不用在意这个属性。
     */
    _data: Data;
}
interface Action {
    type: string;
    data?: AnyObject;
    [otherProps: string]: any;
}