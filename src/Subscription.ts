import { Subscription as Sub } from 'suub';

type Listener = () => void;
type Unsubscribe = () => void;

export interface Subscription {
  subscribeChildren(listener: Listener): Unsubscribe;
  subscribeSubscription(listener: Listener): Unsubscribe;
  callChildren: () => void;
  callSub: () => void;
}

export function createSubscription(): Subscription {
  const childrenSub = Sub();
  const subSub = Sub();

  return {
    callChildren: childrenSub.emit,
    callSub: subSub.emit,
    subscribeChildren: childrenSub.subscribe,
    subscribeSubscription: subSub.subscribe,
  };
}
