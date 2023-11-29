type DomainModel = any;

class GraphicEditor {
  model: DomainModel;
  viewer: GraphicViewer;

  constructor() {
    this.model = undefined;
    this.viewer = new GraphicViewer();
  }

  initViewer() {
    // editor가 viewer에게 model을 전달하면서 part 만들어줘!
    this.viewer.createParts(this.model);
  }
}

import RectanglePart from "./RectanglePart";
import CirclePart from "./CirclePart";
import PenPart from "./PenPart";

type PartFactory = any;
class GraphicViewer {
  partFactory: PartFactory;

  setPartFactory(partFactory: PartFactory) {
    this.partFactory = partFactory;
  }
  createParts(model: PartFactory[]) {
    // model의 item을 순회하면서 타입별로 part를 생성 후 화면에 표시
    model.forEach((item) => {
      let part = this.partFactory.createPart(item);
      if (part) {
        // view rendering logic
        this.addPart(part);
      }
    });
  }

  addPart(part: PartFactory) {
    //
  }
}

class partFactory {
  createPart(item: PartFactory) {
    let part;
    if (item.type === "rect") {
      part = new RectanglePart(item);
    } else if (item.type === "circle") {
      part = new CirclePart(item);
    } else if (item.type === "pen") {
      part = new PenPart(item);
    }
  }
}

type Figure = any;
class Part {
  children: Part[] = [];
  parent?: Part;
  view: Figure;

  addChild(child: Part, index: number) {
    this.children.splice(index, 0, child);
    child.setParent(this);
    this.addChildView(child, index);
  }

  getView() {
    return this.view;
  }

  render() {
    this.getView().draw();
    this.children.forEach((child) => {
      child.render();
    });
  }

  private addChildView(child: Part, index: number) {
    var childView = child.getView();
    this.getView().append(childView, index);
  }

  setParent(child: Part) {
    //
  }
}

class TextPart extends Part {
  addChild(child: Part, index: number): void {
    throw new Error("Text Part cannot have a child");
  }
}
