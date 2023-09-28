type stateProps = {
  value: any,
  oldValue: any,
  hasChanged: boolean,
}

declare global {
  interface Window {
    __statesProxies__: stateProps;
  }
}

export const setState = (propsOrKey: any|string, props?:any): stateProps => {

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

// Global states
window.__statesProxies__ = setState({});

export const useWatch = (callback, proxies) => {
  proxies.forEach((item) => {
    item.watch = [...item.watch, function() {
      callback?.(...proxies);
    }];
  })
}

export const useState = (proxyKey: string): stateProps => {
  if(window.__statesProxies__?.value[proxyKey]){
    return window.__statesProxies__.value[proxyKey];
  }
  window.__statesProxies__.value[proxyKey] = setState(undefined)
  return window.__statesProxies__.value[proxyKey];

}
