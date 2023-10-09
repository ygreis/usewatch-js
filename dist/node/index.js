var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
export var setState = function (propsOrKey, props) {
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
                    currentProps.watch.forEach(function (push) {
                        push(currentProps);
                    });
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
};
// Global states
window.__statesProxies__ = setState({});
export var useWatch = function (callback, proxies) {
    proxies.forEach(function (item) {
        item.watch = __spreadArray(__spreadArray([], item.watch, true), [function () {
                callback === null || callback === void 0 ? void 0 : callback.apply(void 0, proxies);
            }], false);
    });
};
export var useState = function (proxyKey) {
    var _a;
    if ((_a = window.__statesProxies__) === null || _a === void 0 ? void 0 : _a.value[proxyKey]) {
        return window.__statesProxies__.value[proxyKey];
    }
    window.__statesProxies__.value[proxyKey] = setState(undefined);
    return window.__statesProxies__.value[proxyKey];
};
