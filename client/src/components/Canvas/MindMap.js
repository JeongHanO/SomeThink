import Graph from "react-graph-vis";
import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import {
    handleDoubleClick,
    handleNodeDragEnd,
    handleClickOutside,
    handleCanvasDrag,
    handleAddTextNode,
    handleAddImageNode as handleAddImageNodeOriginal,
    handleNodeContextMenu,
    handleNodeDragging,
} from "./eventHandler";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

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
    interaction: {
        multiselect: false,
    },
};

const rootNode = {
    id: 1,
    label: "Root",
    x: 0,
    y: 0,
    physics: false,
    fixed: true,
    color: "#f5b252",
};

const PreventRefresh = () => {
    useEffect(() => {
        const handleBeforeUnload = (event) => {
            event.preventDefault();
            event.returnValue = ""; // 이 줄은 최신 버전의 Chrome에서 필요합니다.
        };

        const handleUnload = () => {
            // 페이지를 떠날 때 처리할 작업을 여기에 추가합니다.
            // 예를 들어, 변경된 데이터를 저장하거나 서버에 업데이트를 요청하는 등의 작업을 수행할 수 있습니다.
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        window.addEventListener("unload", handleUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("unload", handleUnload);
        };
    }, []);

    return <></>;
};

const MindMap = () => {
    const [contextMenuPos, setContextMenuPos] = useState({ xPos: 0, yPos: 0 });
    const [isNodeContextMenuVisible, setIsNodeContextMenuVisible] = useState(false);
    const contextMenuRef = useRef(null);
    const [isCreatingText, setIsCreatingText] = useState(false);
    const [selectedNodeLabels, setSelectedNodeLabels] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const memoizedHandleClickOutside = useCallback(
        handleClickOutside(contextMenuRef, setIsNodeContextMenuVisible),
        [contextMenuRef, setIsNodeContextMenuVisible]
    );
    const handleAddImageNode = (imageUrl) => handleAddImageNodeOriginal({ imageUrl, ymapRef });
    const openNodeContextMenu = handleNodeContextMenu(
        setContextMenuPos,
        setIsNodeContextMenuVisible
    );

    const ydocRef = useRef(null);
    const ymapRef = useRef(null);

    useEffect(() => {
        ydocRef.current = new Y.Doc();
        const provider = new WebsocketProvider("ws://localhost:1234", "17", ydocRef.current);
        ymapRef.current = ydocRef.current.getMap("MindMap");
        ymapRef.current.set("Node 1", JSON.stringify(rootNode));
        ymapRef.current.set("Counter", 2);

        ymapRef.current.observe((event) => {
            setSelectedNode(null);
            setSelectedNodeLabels([]);

            const updatedGraph = {
                nodes: [],
                edges: [],
            };

            ymapRef.current.forEach((value, key) => {
                if (key.startsWith("Node")) {
                    const node = JSON.parse(value);
                    updatedGraph.nodes.push(node);
                } else if (key.startsWith("Edge")) {
                    const edge = JSON.parse(value);
                    updatedGraph.edges.push(edge);
                }
            });

            setState((prevState) => ({
                ...prevState,
                graph: updatedGraph,
            }));
        });
    }, []);

    const createNode = (selectedNodeId) => {
        const selectedNode = ymapRef.current.get(`Node ${selectedNodeId}`);
        const nodeCount = ymapRef.current.get("Counter");

        if (!selectedNode) {
            return;
        }

        const newNode = {
            id: nodeCount,
            label: `Node ${nodeCount}`,
            x: selectedNode.x,
            y: selectedNode.y + 100,
            color: "#FBD85D",
        };

        ymapRef.current.set(`Node ${nodeCount}`, JSON.stringify(newNode));
        ymapRef.current.set(
            `Edge ${selectedNodeId} to ${nodeCount}`,
            JSON.stringify({ from: selectedNodeId, to: nodeCount })
        );

        ymapRef.current.set("Counter", nodeCount + 1);
        setSelectedNode(null);
    };

    const closeContextMenu = () => {
        setIsNodeContextMenuVisible(false);
    };

    const modifyNode = (nodeId, newLabel) => {
        const node = JSON.parse(ymapRef.current.get(`Node ${nodeId}`));
        if (node) {
            node.label = newLabel;
            ymapRef.current.set(`Node ${nodeId}`, JSON.stringify(node));
        }
    };

    useEffect(() => {
        const handleAddNode = (event) => {
            if (!selectedNode) {
                return;
            }
            createNode(selectedNode);
        };
        const __handleAddTextNode = (event) => {
            setIsCreatingText(true);
        };
        document.addEventListener("click", memoizedHandleClickOutside);
        window.addEventListener("addNode", handleAddNode);
        window.addEventListener("addText", __handleAddTextNode);
        return () => {
            document.removeEventListener("click", handleClickOutside);
            window.removeEventListener("addNode", handleAddNode);
            window.removeEventListener("addText", __handleAddTextNode);
        };
    }, [selectedNode, memoizedHandleClickOutside]);

    const deleteSingleNode = (nodeId) => {
        ymapRef.current.delete(`Node ${nodeId}`);
    };

    const deleteNodes = (nodeId) => {
        const childNodes = Array.from(ymapRef.current.keys())
            .filter((key) => key.startsWith(`Edge ${nodeId} to `))
            .map((key) => key.split(" ")[3]);

        childNodes.forEach((childNodeId) => {
            deleteSingleNode(childNodeId);
            deleteNodes(childNodeId);
        });

        deleteSingleNode(nodeId);
    };

    const handleNodeSelect = async ({ nodes }) => {
        if (nodes.length === 0) {
            return;
        }

        const clickedNodeId = nodes[0];
        const clickedNode = JSON.parse(ymapRef.current.get(`Node ${clickedNodeId}`));

        if (!clickedNode) {
            return;
        }

        const connectedNodeIds = [clickedNodeId];
        let currentNodeId = clickedNodeId;

        while (currentNodeId !== 1) {
            const parentNodeId = Array.from(ymapRef.current.keys())
                .find((key) => key.startsWith("Edge ") && key.endsWith(` to ${currentNodeId}`))
                ?.split(" ")[1];

            if (!parentNodeId) {
                break;
            }

            connectedNodeIds.push(parentNodeId);
            currentNodeId = parentNodeId;
        }

        const rootLabel = ymapRef.current.get("Node 1")
            ? JSON.parse(ymapRef.current.get("Node 1"))?.label
            : null;

        const connectedNodeLabels = connectedNodeIds.map((nodeId) => {
            const node = JSON.parse(ymapRef.current.get(`Node ${nodeId}`));
            return node ? node.label : null;
        });

        setSelectedNodeLabels((prevLabels) => [
            clickedNode.label,
            ...connectedNodeLabels,
            rootLabel,
            ...prevLabels,
        ]);

        const allNodeLabels = Array.from(ymapRef.current.keys())
            .filter((key) => key.startsWith("Node "))
            .map((key) => {
                const node = JSON.parse(ymapRef.current.get(key));
                return node ? node.label : null;
            });

        try {
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    connectedKeywords: connectedNodeLabels.join(", "),
                    allKeywords: allNodeLabels.join(", "),
                }),
            });

            const data = await response.json();
            if (response.status !== 200) {
                throw data.error || new Error(`Request failed with status ${response.status}`);
            }

            const newNodeLabels = data.result.split(",");
            const nodeCount = Number(ymapRef.current.get("Counter"));

            const newNodes = newNodeLabels.map((label, index) => {
                const nodeId = nodeCount + index + 1;
                const newNode = {
                    id: nodeId,
                    label: label.trim(),
                    x: clickedNode.x + 100 * (index + 1),
                    y: clickedNode.y + 100,
                    physics: false,
                    color: "#FBD85D",
                };

                ymapRef.current.set(`Node ${nodeId}`, JSON.stringify(newNode));
                return newNode;
            });

            const newEdges = newNodes.map((node) => {
                const edge = {
                    from: clickedNodeId,
                    to: node.id,
                };

                const edgeId = `Edge ${clickedNodeId} to ${node.id}`;
                ymapRef.current.set(edgeId, JSON.stringify(edge));

                return edge;
            });

            ymapRef.current.set("Counter", nodeCount + newNodeLabels.length);
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };

    const [state, setState] = useState(() => {
        return {
            graph: {
                nodes: [rootNode],
                edges: [],
            },
            rootNode,
            events: {
                select: ({ nodes, edges }) => {
                    if (nodes.length === 1) {
                        setSelectedNode(nodes[0]);
                        setContextMenuPos((prevState) => ({
                            ...prevState,
                            selectedNodeId: nodes[0],
                        }));
                    }
                },
                doubleClick: (events) => handleDoubleClick(events, modifyNode),
                oncontext: openNodeContextMenu,
            },
        };
    });

    const { graph, events } = state;
    return (
        <div>
            <PreventRefresh />
            <Graph
                graph={state.graph}
                options={options}
                events={{
                    ...state.events,
                    dragging: (events) => handleNodeDragging(events, ymapRef),
                    dragEnd: (events) => handleNodeDragEnd(events, ymapRef),
                    drag: handleCanvasDrag,
                    click: (events) =>
                        handleAddTextNode(
                            events,
                            isCreatingText,
                            ymapRef,
                            setState,
                            setSelectedNode,
                            setIsCreatingText
                        ),
                    oncontext: openNodeContextMenu,
                }}
                style={{ height: "100vh" }}
            />
            {isNodeContextMenuVisible && (
                <div
                    ref={contextMenuRef}
                    className="context-menu"
                    style={{
                        position: "absolute",
                        left: contextMenuPos.xPos,
                        top: contextMenuPos.yPos,
                    }}
                >
                    <NodeContextMenu
                        selectedNodeId={contextMenuPos.selectedNodeId}
                        onClose={closeContextMenu}
                        deleteNode={deleteNodes}
                        createNode={createNode}
                        setIsCreatingText={setIsCreatingText}
                        handleAddImageNode={handleAddImageNode}
                        handleNodeSelect={handleNodeSelect}
                    />
                </div>
            )}
        </div>
    );
};

export default MindMap;
