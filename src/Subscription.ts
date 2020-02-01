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
  const childrenSub = Sub.create();
  const subSub = Sub.create();

  return {
    callChildren: childrenSub.call,
    callSub: subSub.call,
    subscribeChildren: childrenSub.subscribe,
    subscribeSubscription: subSub.subscribe,
  };
}
