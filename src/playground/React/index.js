/**
 * ref: https://pomb.us/build-your-own-react/
 * Step I: The createElement Function
 * Step II: The render Function
 * Step III: Concurrent Mode
 * Step IV: Fibers
 * Step V: Render and Commit Phases
 * Step VI: Reconciliation
 * Step VII: Function Components
 * Step VIII: Hooks
 */

const Didact = {
  createElement,
  render,
  useState,
};

// ---------------- Step 0: How react works ----------------
const elementPrev = <h1 title="foo">Hello</h1>;
const elementReact = React.createElement("h1", { title: "foo" }, "Hello");
const elementNext = {
  type: "h1", // tagName
  props: {
    title: "foo",
    children: "Hello",
  },
};

const container = document.getElementById("root");
ReactDOM.render(elementReact, container);
const node = document.createElement(element.type);
node["title"] = elementReact.props.title;
const text = document.createTextNode(""); // innerText 대신 사용
text["nodeValue"] = elementReact.props.children;
node.appendChild(text);
container.appendChild(node);

// ---------------- Step I:The createElement Function ----------------
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

/** @jsx Didact.createElement */
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
);

const element1 = Didact.createElement(
  "div",
  { id: "foo" },
  Didact.createElement("a", null, "bar"),
  Didact.createElement("b")
);

ReactDOM.render(element, container);

// ---------------- Step II: The render Function ----------------
function renderPrev(element, container) {
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);

  element.props.children.forEach((child) => renderPrev(child, dom));

  const isProperty = (key) => key !== "children";
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = element.props[name];
    });

  container.appendChild(dom);
}

Didact.render(element, container);

// ---------------- Step III: Concurrent Mode ----------------
/**
 * 위의 render 코드로 재귀 호출은 문제가 있다.
 * 렌더링을 실행하면 전체 요소 트리를 렌더링 할 때까지 멈추지 않는다.
 *  element 트리가 크면 메인 스레드가 너무 오랫동안 차단될 수 있다.
 * 브라우저가 사용자 입력을 처리하거나 애니메이션을 부드럽게 유지하는 등 우선순위가 높은 작업을 수행해야 하는 경우에도 렌더링이 완료될 때 까지 기다려야 한다.
 *  => 작업을 작은 단위로 나누고, 각 단위를 마친 후에 수행해야 할 다른 작업이 있다면 브라우저가 렌더링을 중단하도록 할 것임.
 */
let nextUnitOfWork = null;
let wipRoot = null;

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);

    shouldYield = deadline.timeRemaining() < 1;
  }

  // 모든 작업을 마치면(다음 작업단위가 없음) 전체 Fiber Tree를 DOM에 commit
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

// 기본 스레드가 idle 상태일때 브라우저가  callback을 실행함(<=>setTimeout은 실행 시기를 알려줌)
requestIdleCallback(workLoop);

// ----------------  Step IV: Fibers ----------------
/**
 * 작업 단위를 구성하려면 Fiber Tree라는 데이터 구조가 필요함
 * 각 요소마다 하나의 Fiber가 있고, 각 Fiber는 작업 단위가 된다.
 * 각 Fiber는 아래 세 가지 작업을 수행한다.
 * 1. DOM에 요소 추가
 * 2.요소에 하위 요소에 대한 Fiber 생성
 * 3.다음 작업 단위 선택
 * 이 데이터 구조의 목표 중 하나는 다음 작업단위를 쉽게 찾도록 하는 것이다.
 * 각 파이버가 첫번째 child, next sibiling, parent에 대한 링크를 갖는 이유다.
 *
 */

function performUnitOfWork(nextUnitOfWork) {
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  // return next unit of work
  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibiling) {
      return nextFiber.sibiling;
    }

    nextFiber = nextFiber.parent;
  }
}

// ---------------- Step V: Render and Commit Phases ----------------

function commitRoot() {
  //  add nodes to dom
  deletions.forEach(commitWork);
  // 모든 node를 dom에 재귀적으로 추가함
  commitWork(wipRoot.child);
  currentRoot = wipRoot; // DOM에 commit한 마지막 Fiber Tree에 대한 ref를 저장.
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }

  //   const domParent = fiber.parent.dom;
  // DOM 노드가 없는 fiber가 있기 때문에 변경 필요
  // 1. DOM 노드가 있는 파이버를 찾을 때 까지 Fiber Tree를 위로 이동함

  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternative.props, fiber.props);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibiling);
}

function render(element, container) {
  // set next unit of work
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternative: currentRoot, // 이전 커밋 단계에서 DOM에 커밋한 예전 fiber와 링크해주는 속성
  };

  deletions = [];
  nextUnitOfWork = wipRoot;
}

// ---------------- Step VI: Reconciliation ----------------
// node를 업데이트하거나 삭제하려는 경우: render함수에서 받은 요소를 DOM에 커밋한 마지막 Fiber Tree와 비교해야 함
// commit을 마친 후 DOM에 commit한 마지막 Fiber Tree에 대한 ref를 저장해야 함. = currentRoot
// alternate 속성을 모든 fiber에 추가함. 이전 커밋 단계에서 DOM에 커밋한 예전 fiber와 링크해주는 속성

let currentRoot = null;
let deletions = null;

function reconcileChildren(wipFiber, elements) {
  // create new fibers

  let index = 0;
  // 이전 Fiber의 하위요소와 재조정하려는 배열 목록을 동시에 반복함
  let oldFiber = wipFiber.alternative && wipFiber.alternative.child;
  let prevSibiling = null;

  while (index < elements.length || oldFiber != null) {
    // element: DOM에 렌더링하려는 것
    // oldFiber: 마지막으로 렌더링한 것
    const element = elements[index];
    let newFiber = null;

    // 이전 Fiber와 새 element의 type이 동일한 경우, DOM 노드를 유지하고 새 prop으로 업데이트
    // type이 다르고 새 element가 있으면, 새 DOM 노드를 만들어야 함
    // type이 다르고 oldFiber가 존재하는 경우 기존 노드를 제거해야함
    // ** react는 더 나은 reconciliation을 위해 key를 사용함. ex) element array에서 children이 위치를 변경하는 경우를 감지함

    const sameType = oldFiber && element && element.type == oldFiber.type;

    if (sameType) {
      // update the node
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternative: oldFiber,
        effectTag: "UPDATE,",
      };
    }
    if (element && !sameType) {
      // add this node
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternative: null,
        effectTag: "PLACEMENT,",
      };
    }
    if (oldFiber && !sameType) {
      // delete the oldFiber's node
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibiling.sibiling = newFiber;
    }

    prevSibiling = newFiber;
    index++;
  }
}

const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (prev, next) => (key) => !(key in next);
function updateDom(dom, prevProps, nextProps) {
  // 기존 Fiber의 prop과 새 Fiber의 prop을 비교해 없어진 prop은 제거하고, 새로 추가하거나 변경된 prop은 셋팅한다.

  // Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // Remove old properties a
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = "";
    });

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });

  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}

function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);

  return dom;
}

// ---------------- Step VII: Function Components ----------------
// 함수 구성요소의 Fiber에는 DOM 노드가 없다.
// 자식은 props 로 직접 가져오는 대신 함수를 실행해서 온다.
// Fiber 유형이 함수인지 확인하고 이에 따라 다른 업데이트 함수로 이동시킨다.

/** @jsx Didact.createElement */
function App(props) {
  return <h1>Hi {props.name}</h1>;
}

const elementFin = <App name="foo" />;
const containerFin = document.getElementById("root");
Didact.render(elementFin, containerFin);

let wipFiber = null;
let hookIndex = null;

function updateFunctionComponent(fiber) {
  // 함수 컴포넌트를 호출하기 전에 일부 전역 변수를 초기화 해야 함수 내부에서 사용할 수 있다.
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];

  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function updateHostComponent(fiber) {
  // add dom node
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  // 삭제: element에 대해 작업할때마다 DOM에 새 노드를 추가하고 있음. 전체 트리 렌더링을 완료하기 전에 브라우저가 작업을 중단할 수 있음. 이 경우 불완전한 UI를 보여주게 됨.
  //   if (fiber.parent) {
  //     fiber.parent.dom.appendChild(fiber.dom);
  //   }
  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}
// ---------------- Step VIII: Hooks ----------------
/** @jsx Didact.createElement */
function Counter() {
  const [state, setState] = Didact.useState(1);
  return <h1 onClick={() => setState((c) => c + 1)}>Count: {state}</h1>;
}

function useState(initial) {
  const oldHook =
    wipFiber.alternative &&
    wipFiber.alternative.hooks &&
    wipFiber.alternative.hoos[hookIndex];
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = action(hook.state);
  });

  const setState = (action) => {
    hook.queue.push(action);
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternative: currentRoot,
    };

    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
}

/**
 * React와의 차이
 * Didact에서는 렌더링 단계에서 전체 트리를 탐색한다. 대신 React는 몇 가지 힌트와 경험적 방법을 따라 아무것도 변경되지 않은 전체 하위 트리를 건너뛴다.
 * 또한 커밋 단계에서 전체 트리를 탐색한다. React는 Effect가 있는 Fiber만으로 연결된 목록을 유지하고 해당 Fiber만 방문한다.
 * 새로운 진행 중인 작업 트리를 구축할 때마다 각 Fiber에 대해 새로운 객체를 생성한다. React는 이전 트리의 Fiber를 재활용한다.
 * Didact는 렌더링 단계에서 새로운 업데이트를 받으면 진행 중인 작업 트리를 버리고 루트에서 다시 시작한다. React는 각 업데이트에 만료 타임스탬프를 태그하고 이를 사용하여 어떤 업데이트의 우선순위가 더 높은지 결정한다.
 */
