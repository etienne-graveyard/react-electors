import { Subscription } from 'suub';
import produce from 'immer';
import { ReactElectorsSelector, useMemo, createConnect } from '../../src';

type Selector<Output, Inputs extends Array<any> = []> = ReactElectorsSelector<
  State,
  Inputs,
  Output
>;

interface Todo {
  title: string;
  done: boolean;
  id: number;
}

interface State {
  todos: Array<Todo>;
  hideDone: boolean;
}

export const store = createStore<State>({
  todos: [],
  hideDone: false,
});

// Connect

export const { Provider: ConnectProvider, useSelector, useChildren } = createConnect<State>();

// Selector

const useVisibleTodos: Selector<Todo[]> = state => {
  return useMemo(() => {
    if (state.hideDone) {
      return state.todos.filter(t => t.done === false);
    }
    return state.todos;
  }, [state.hideDone, state.todos]);
};

const useVisibleTodosCount: Selector<number> = () => {
  return useChildren(useVisibleTodos).length;
};

// selector can take parameter
const useTodo: Selector<Todo | null, [number]> = (state, todoId) => {
  return useMemo(() => {
    return state.todos.find(todo => todo.id === todoId) || null;
  }, [state.todos, todoId]);
};

const useDoneCount: Selector<number> = state => {
  const done = useMemo(() => state.todos.filter(t => t.done), [state.todos]);
  return done.length;
};

// This is just a simple store using immer
function createStore<T>(initial: T) {
  const sub = Subscription.create();
  let state = initial;
  return {
    getState: () => state,
    update: (updater: (draft: T) => any) => {
      state = produce(state, updater);
      sub.call();
    },
    subscribe: sub.subscribe,
  };
}

export const selectors = {
  visibleTodos: useVisibleTodos,
  todo: useTodo,
  todos: useTodo,
  visibleTodosCount: useVisibleTodosCount,
  doneCount: useDoneCount,
};
