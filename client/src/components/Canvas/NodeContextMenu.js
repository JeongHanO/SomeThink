import React from "react";

import "./NodeContextMenu.css";

const NodeContextMenu = ({
  xPos,
  yPos,
  onClose,
  createNode,
  selectedNodeId,
}) => {
  const handleAddChildNode = () => {
    const x = xPos; // 자식 노드의 x 좌표를 부모 노드의 오른쪽으로 설정 (임의로 100px 이동)
    const y = yPos;
    createNode(x, y, selectedNodeId); // 선택된 노드에 자식 노드 생성
    onClose();
  };

  return (
    <div
      className="context-menu"
      style={{ top: yPos, left: xPos, position: "absolute", zIndex: 1 }}
      onClick={onClose}
    >
      <ul>
        <li onClick={handleAddChildNode}>자식 노드 추가</li>
        <li>노드 제거</li>
      </ul>
    </div>
  );
};

export default NodeContextMenu;
