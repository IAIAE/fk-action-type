# this

这个是一个为了不写冗余的action和reducer而做的Redux的封装。使用方法如下：

首先创建一个`Data`的实例，构造方法包括两个参数，`name`和`defaultState`。`name`唯一标识一个Data对象，全局是不能重复的。`defaultState`和redux中的一个意思，指默认store的值。

下面我们以创建一个只有name属性的store为例子，我们有一个`setName`方法可以更改name属性的值。

如果是传统的redux，我们会怎么写？肯定像下面这样，首先创建一个action：
```javascript
let nameAction = (newName) => ({
    type: 'setName',
    data: newName
})
```
然后在另一个js文件中创建一个reducer：
```javascript
let nameReducer = (state, action) => {
    return Object.assign({}, state, {
        name: action.data
    })
}
```
很麻烦不是？为什么不能写到一起呢？


```javascript
let store = new Data('nameStore', {
    name: 'default name'
}).listen('setName', {
    action: name => (newName) => ({
        type: name,
        data: newName
    }),
    reducer: name => ({
        [name]: (state, action) => {
            return Object.assign({}, state, {
                name: action.data
            })
        }
    })
})
```
如果action纯粹是为了透传，那么action字段也可以省略。
```javascript
let store = new Data('nameStore', {
    name: 'default name'
}).listen('setName', {
    reducer: name => ({
        [name]: (state, action) => {
            return Object.assign({}, state, {
                name: action.data
            })
        }
    })
})
```
自己封装一下会更加简洁：
```javascript
let store = new Data('nameStore', {
    name: 'default name'
}).listen('setName', {
    reducer: simpleReducer((state, action) => ({
        name: action.data
    })) 
})
```

如何触发一个action呢？
```javascript
store.dispatch('setName', 'foo');
```

