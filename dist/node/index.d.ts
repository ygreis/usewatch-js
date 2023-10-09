type stateProps = {
    value: any;
    oldValue: any;
    hasChanged: boolean;
};
declare global {
    interface Window {
        __statesProxies__: stateProps;
    }
}
export declare const setState: (propsOrKey: any | string, props?: any) => stateProps;
export declare const useWatch: (callback: any, proxies: any) => void;
export declare const useState: (proxyKey: string) => stateProps;
export {};
