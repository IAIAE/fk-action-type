/**
 * usage: reducerGen({
 *      fetching: function(state, action){ return state;},
 *      success: function(state, action){ return actioin.payload},
 *      fail: state=>state
 * })
 * @param {Object} config 
 */
export function reducerGen(config, defaultStatus){
    let cases = Object.keys(config);
    defaultStatus = defaultStatus || {}
    return (state = defaultStatus, action) => {
        if(~cases.indexOf(action.type)){
            let newState = config[action.type](state, action);
            return newState;
        }else{
            return state;
        }
    }
}
