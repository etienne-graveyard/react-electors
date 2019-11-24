import React from 'react';
import ReactDOM from 'react-dom';
import { useSelector, selectors, store, ConnectProvider } from './store';

let nextTodoId = 0;

const App = () => {
  console.log('Render App');

  const [newTodo, setNewTodo] = React.useState('');

  const hideDone = useSelector(state => state.hideDone);
  const todos = useSelector(selectors.visibleTodos);
  const todosCount = useSelector(selectors.visibleTodosCount);

  return (
    <div>
      <div>
        <button
          onClick={() => {
            store.update(draft => {
              draft.hideDone = !draft.hideDone;
            });
          }}
        >
          {hideDone ? 'Show All' : 'Hide done'}
        </button>
      </div>
      <input
        type="text"
        placeholder="add todo"
        value={newTodo}
        onChange={e => setNewTodo(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            store.update(state => {
              state.todos.push({
                title: newTodo,
                done: false,
                id: nextTodoId++,
              });
            });
            setNewTodo('');
          }
        }}
      />
      <div>
        {todos.map(todo => {
          return <Todo todoId={todo.id} key={todo.id} />;
        })}
      </div>
      <p>Count: {todosCount}</p>
      <Done />
    </div>
  );
};

const Done = React.memo(function Done() {
  console.log('Render Done');

  const doneCount = useSelector(selectors.doneCount);

  return <p>Done: {doneCount}</p>;
});

const Todo = React.memo<{ todoId: number }>(function Todo({ todoId }) {
  console.log(`Render Todo ${todoId}`);

  const todo = useSelector(selectors.todo, todoId);

  if (!todo) {
    return null;
  }

  return (
    <div>
      <input
        type="checkbox"
        checked={todo.done}
        onChange={e => {
          store.update(draft => {
            const todo = draft.todos.find(t => t.id === todoId);
            if (todo) {
              todo.done = !todo.done;
            }
          });
        }}
      />
      <span>{todo.title}</span>
    </div>
  );
});

ReactDOM.render(
  <ConnectProvider store={store}>
    <App />
  </ConnectProvider>,
  document.getElementById('root')
);
