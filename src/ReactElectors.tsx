import * as Electors from 'electors';
import { Connect, Store, ProviderProps, ReactElectorsSelector } from './types';
import React from 'react';
import { Subscription, createSubscription } from './Subscription';

export const ReactElectors = {
  useMemo: Electors.useMemo,
  createConnect,
};

export const useMemo = Electors.useMemo;

const StoreContext = React.createContext<Store<any> | null>(null);
const SubContext = React.createContext<Subscription | null>(null);

export function createConnect<State>(): Connect<State> {
  const Provider: React.FC<ProviderProps<State>> = React.memo<ProviderProps<State>>(
    ({ children, store }) => {
      const [sub] = React.useState(() => createSubscription());

      const subSubCallRequested = React.useRef<boolean>(false);

      const forceUpdate = useForceUpdate();

      React.useLayoutEffect(() => {
        return store.subscribe(() => {
          sub.callChildren();
          subSubCallRequested.current = true;
          forceUpdate();
        });
      }, [sub, store, forceUpdate]);

      React.useLayoutEffect(() => {
        if (subSubCallRequested.current) {
          subSubCallRequested.current = false;
          sub.callSub();
        }
      });

      return (
        <StoreContext.Provider value={store}>
          <SubContext.Provider value={sub}>{children}</SubContext.Provider>
        </StoreContext.Provider>
      );
    }
  );
  Provider.displayName = 'ElectorsProvider';

  const Helper: React.FC = React.memo(({ children }) => {
    const parentSub = React.useContext(SubContext);
    if (parentSub === null) {
      throw new Error(`Provider is missing !`);
    }

    const [sub] = React.useState(() => createSubscription());

    const subSubCallRequested = React.useRef<boolean>(false);

    const forceUpdate = useForceUpdate();

    React.useLayoutEffect(() => {
      return parentSub.subscribeSubscription(() => {
        sub.callChildren();
        subSubCallRequested.current = true;
        forceUpdate();
      });
    }, [sub, parentSub, forceUpdate]);

    React.useLayoutEffect(() => {
      if (subSubCallRequested.current) {
        subSubCallRequested.current = false;
        sub.callSub();
      }
    });

    return <SubContext.Provider value={sub}>{children}</SubContext.Provider>;
  });
  Helper.displayName = 'ElectorsHelper';

  function useChildren<Inputs extends Array<any>, Output>(
    selector: ReactElectorsSelector<State, Inputs, Output>,
    ...inputs: Inputs
  ): Output {
    return Electors.useChildren(selector as any, ...inputs);
  }

  function useSelector<Inputs extends Array<any>, Output>(
    selector: ReactElectorsSelector<State, Inputs, Output>,
    ...inputs: Inputs
  ): Output {
    const sub = React.useContext(SubContext);
    const store = React.useContext(StoreContext);
    if (sub === null || store === null) {
      throw new Error(`Provider is missing !`);
    }

    const [selectCtx] = React.useState(() =>
      Electors.createContext(
        // inject state
        (select, ...inputs) => (select as any)(store.getState(), ...inputs)
      )
    );
    const forceUpdate = useForceUpdate();

    const selectorRef = React.useRef(selector);
    selectorRef.current = selector;

    const inputsRef = React.useRef(inputs);
    inputsRef.current = inputs;

    const stateRef = React.useRef<Output>();
    stateRef.current = selectCtx.execute(selectorRef.current as any, ...inputsRef.current);

    // Cleanup on unmount
    React.useEffect(() => {
      return () => {
        selectCtx.destroy();
      };
    }, [selectCtx]);

    React.useEffect(() => {
      const unsubscribe = sub.subscribeChildren(() => {
        const nextState = selectCtx.execute(selectorRef.current as any, ...inputsRef.current);

        if (stateRef.current !== nextState) {
          forceUpdate();
        }
      });
      const state = selectCtx.execute(selectorRef.current as any, ...inputsRef.current);
      if (state !== stateRef.current) {
        forceUpdate();
      }
      return unsubscribe;
    }, [store, forceUpdate, selectCtx, sub]);

    return stateRef.current as any;
  }

  return {
    useChildren,
    useSelector,
    Provider,
    Helper,
  };
}

function useForceUpdate(): () => void {
  const [, setState] = React.useState({});
  return React.useCallback(() => {
    setState({});
  }, []);
}
