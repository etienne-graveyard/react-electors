export interface Store<S> {
  getState(): S;
  subscribe(listener: () => void): Unsubscribe;
}

export type ReactElectorsSelector<State, Inputs extends Array<any>, Output> = (
  state: State,
  ...inputs: Inputs
) => Output;

type Unsubscribe = () => void;

export interface Connect<State> {
  selectChildren<Inputs extends Array<any>, Output>(
    selector: ReactElectorsSelector<State, Inputs, Output>,
    ...inputs: Inputs
  ): Output;
  useSelector: <Inputs extends any[], Output>(
    selector: ReactElectorsSelector<State, Inputs, Output>,
    ...inputs: Inputs
  ) => Output;
  Provider: React.FunctionComponent<ProviderProps<State>>;
}

export interface ProviderProps<State> {
  store: Store<State>;
}
