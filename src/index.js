window.__statesProxies__ = setState({});

function useWatch(callback, proxies) {
  proxies.forEach((item) => {
    item.watch = [...item.watch, function() {
      callback?.(...proxies);
    }];
  })
}

function setState(propsOrKey, props) {

  var handler = {
    get: function (currentProps, attr) {
      return currentProps[attr];
    },
    set: function (currentProps, attr, value) {
      if (currentProps[attr] !== value) {

        currentProps.oldValue = currentProps.value;
        currentProps.hasChanged = true;

        currentProps[attr] = value;
        
        if (currentProps.watch) {
          currentProps.watch.forEach((push) => {
            push(currentProps);
          })
          currentProps.hasChanged = false;
        }
      }
      return true;
    },
  };

  var proxy = new Proxy({
    value: props || propsOrKey,
    watch: []
  }, handler);
  
  if (props) {
    window.__statesProxies__.value[propsOrKey].value = props;
  }

  return proxy;

}

function useState(proxyKey) {
  if(window.__statesProxies__?.value[proxyKey]){
    return window.__statesProxies__.value[proxyKey];
  }
  window.__statesProxies__.value[proxyKey] = setState(undefined)
  return window.__statesProxies__.value[proxyKey];

}
