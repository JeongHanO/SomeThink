import Graph from "react-graph-vis";
import React, { useState } from "react";
import ReactDOM from "react-dom";

import NodeContextMenu from "./NodeContextMenu";

const options = {
  layout: {
    hierarchical: false,
  },
  nodes: {
    shape: "circle",
    size: 30,
    mass: 1,
    color: "#FBD85D",
    fixed: false,
  },
  edges: {
    arrows: {
      to: {
        enabled: false,
      },
    },
    color: "#000000",
  },
  physics: {
    enabled: false,
  },
  // configure: {
  //   enabled: true,
  // },
};

const MindMap = () => {
  const [contextMenuPos, setContextMenuPos] = useState({ xPos: 0, yPos: 0 });
  const [isNodeContextMenuVisible, setIsNodeContextMenuVisible] =
    useState(false);

  const createNode = (x, y, selectedNodeId) => {
    setState((prevState) => {
      const id = prevState.counter + 1;
      return {
        graph: {
          nodes: [...prevState.graph.nodes, { id, label: `Node ${id}`, x, y }],
          edges: [...prevState.graph.edges, { from: selectedNodeId, to: id }],
        },
        counter: id,
        rootNode: prevState.rootNode, // 루트 노드 정보 유지
        events: prevState.events, // 이벤트 핸들러 유지
      };
    });
  };

  const handleNodeContextMenu = ({ event, nodes }) => {
    event.preventDefault();
    console.log(nodes);
    if (nodes.length > 0) {
      const xPos = event.clientX;
      const yPos = event.clientY;
      const selectedNodeId = nodes[0]; // 첫 번째 선택된 노드의 ID를 가져옴
      setContextMenuPos({ xPos, yPos, selectedNodeId });
      setIsNodeContextMenuVisible(true);
    }
  };

  const handleDoubleClick = (event) => {
    if (event.nodes.length > 0) {
      const selectedNodeId = event.nodes[0];
      const newLabel = prompt("새로운 노드 이름을 입력하세요");
      modifyNode(selectedNodeId, newLabel);
    }
  };

  const closeContextMenu = () => {
    setIsNodeContextMenuVisible(false);
  };

  const modifyNode = (nodeId, newLabel) => {
    setState((prevState) => {
      const updatedNodes = prevState.graph.nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, label: newLabel };
        }
        return node;
      });

      return {
        ...prevState,
        graph: {
          ...prevState.graph,
          nodes: updatedNodes,
        },
      };
    });
  };

  const [state, setState] = useState(() => {
    const rootNode = { id: 1, label: "Root", x: 0, y: 0 };
    return {
      counter: 1,
      graph: {
        nodes: [rootNode],
        edges: [],
      },
      rootNode,
      events: {
        select: ({ nodes, edges }) => {
          console.log("Selected nodes:");
          console.log(nodes);
          console.log("Selected edges:");
          console.log(edges);
        },
        doubleClick: handleDoubleClick,
        oncontext: handleNodeContextMenu,
      },
    };
  });

  const { graph, events } = state;
  return (
    <div>
      <Graph
        graph={state.graph}
        options={options}
        events={state.events}
        style={{ height: "100vh" }}
      />
      {isNodeContextMenuVisible && (
        <NodeContextMenu
          xPos={contextMenuPos.xPos}
          yPos={contextMenuPos.yPos}
          onClose={closeContextMenu}
          createNode={createNode}
          selectedNodeId={contextMenuPos.selectedNodeId}
        />
      )}
    </div>
  );
};

export default MindMap;
