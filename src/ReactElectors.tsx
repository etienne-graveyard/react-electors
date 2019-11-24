import Electors from 'electors';
import { Connect, Store, ProviderProps, ReactElectorsSelector } from './types';
import React from 'react';

export const ReactElectors = {
  useMemo: Electors.useMemo,
  createConnect,
};

function createConnect<State>(): Connect<State> {
  const ConnectContext = React.createContext<Store<State> | null>(null);

  const Provider: React.FC<ProviderProps<State>> = React.memo<ProviderProps<State>>(
    ({ children, store }) => {
      return <ConnectContext.Provider value={store}>{children}</ConnectContext.Provider>;
    }
  );
  Provider.displayName = 'ConnectProvider';

  function selectChildren<Inputs extends Array<any>, Output>(
    selector: ReactElectorsSelector<State, Inputs, Output>,
    ...inputs: Inputs
  ): Output {
    return Electors.useChildren(selector as any, ...inputs);
  }

  function useSelector<Inputs extends Array<any>, Output>(
    selector: ReactElectorsSelector<State, Inputs, Output>,
    ...inputs: Inputs
  ): Output {
    const store = React.useContext(ConnectContext);
    if (store === null) {
      throw new Error(`ConnectContext is missing !`);
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
      const unsubscribe = store.subscribe(() => {
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
    }, [store, forceUpdate, selectCtx]);

    return stateRef.current as any;
  }

  return {
    selectChildren,
    useSelector,
    Provider,
  };
}

function useForceUpdate(): () => void {
  const [, setState] = React.useState({});
  return React.useCallback(() => {
    setState({});
  }, []);
}
