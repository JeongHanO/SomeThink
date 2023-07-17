import Graph from "react-graph-vis";
import React, { useState, useEffect, useRef } from "react";
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
        enabled: true,
        solver: "barnesHut",
        barnesHut: {
            centralGravity: -0.1,
            springConstant: 1,
            damping: 0.09,
            avoidOverlap: 0.5,
        },
        maxVelocity: 5,
        minVelocity: 0.5,
    },
    interaction: {
        multiselect: false,
    },
};

const MindMap = () => {
    const [contextMenuPos, setContextMenuPos] = useState({ xPos: 0, yPos: 0 });
    const [isNodeContextMenuVisible, setIsNodeContextMenuVisible] =
        useState(false);
    const contextMenuRef = useRef(null);
    const [isCreatingText, setIsCreatingText] = useState(false);
    const [result, setResult] = useState("");
    const [selectedNodeLabels, setSelectedNodeLabels] = useState([]);

    const createNode = (x, y, selectedNodeId) => {
        setState((prevState) => {
            const id = prevState.counter + 1;

            return {
                graph: {
                    nodes: [
                        ...prevState.graph.nodes,
                        {
                            id,
                            label: `Node ${id}`,
                            x,
                            y,
                            physics: true,
                            color: "#FBD85D",
                        },
                    ],
                    edges: [
                        ...prevState.graph.edges,
                        { from: selectedNodeId, to: id },
                    ],
                },
                counter: id,
                rootNode: prevState.rootNode,
                events: prevState.events,
            };
        });
    };

    const handleAddTextNode = (event) => {
        if (!isCreatingText) return;
        const { pointer } = event;
        const label = prompt("");
        if (label) {
            const newNode = {
                shape: "text",
                label: label,
                x: pointer.canvas.x,
                y: pointer.canvas.y,
                physics: false,
                font: {
                    size: 30,
                },
            };
            setState((prevState) => ({
                ...prevState,
                graph: {
                    ...prevState.graph,
                    nodes: [...prevState.graph.nodes, newNode],
                },
            }));
            setIsCreatingText(false);
        }
    };

    const handleAddImageNode = ({ imageUrl }) => {
        const newNode = {
            shape: "image",
            image: imageUrl,
            x: 0,
            y: -100,
            physics: false,
        };
        setState((prevState) => ({
            ...prevState,
            graph: {
                ...prevState.graph,
                nodes: [...prevState.graph.nodes, newNode],
            },
        }));
    };

    const handleNodeContextMenu = ({ event, nodes }) => {
        event.preventDefault();

        if (nodes.length > 0) {
            const xPos = event.clientX;
            const yPos = event.clientY;
            const selectedNodeId = nodes[0];
            setContextMenuPos({ xPos, yPos, selectedNodeId });
            setIsNodeContextMenuVisible(true);
        }
    };

    const handleDoubleClick = (event) => {
        if (event.nodes.length > 0) {
            const selectedNodeId = event.nodes[0];
            const newLabel = prompt("새로운 노드 이름을 입력하세요");
            if (newLabel === null) return;
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

    const handleClickOutside = (event) => {
        if (
            contextMenuRef.current &&
            !contextMenuRef.current.contains(event.target)
        ) {
            setIsNodeContextMenuVisible(false);
        }
    };

    useEffect(() => {
        document.addEventListener("click", handleClickOutside);

        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);

    const deleteSingleNode = (nodeId) => {
        setState((prevState) => {
            const updatedNodes = prevState.graph.nodes.filter(
                (node) => node.id !== nodeId
            );
            const updatedEdges = prevState.graph.edges.filter(
                (edge) => edge.from !== nodeId && edge.to !== nodeId
            );

            return {
                ...prevState,
                graph: {
                    ...prevState.graph,
                    nodes: updatedNodes,
                    edges: updatedEdges,
                },
            };
        });
    };

    const deleteNodes = (nodeId) => {
        const childNodes = state.graph.edges
            .filter((edge) => edge.from === nodeId)
            .map((edge) => edge.to);
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
        const clickedNode = state.graph.nodes.find(
            (node) => node.id === clickedNodeId
        );

        if (!clickedNode) {
            return;
        }

        const connectedNodeIds = [clickedNodeId];
        let currentNodeId = clickedNodeId;

        while (currentNodeId !== 1) {
            const parentNodeId = state.graph.edges.find(
                (edge) => edge.to === currentNodeId
            )?.from;

            if (!parentNodeId) {
                break;
            }

            connectedNodeIds.push(parentNodeId);
            currentNodeId = parentNodeId;
        }

        const rootLabel = state.graph.nodes.find(
            (node) => node.id === 1
        )?.label;
        const connectedNodeLabels = connectedNodeIds.map(
            (nodeId) =>
                state.graph.nodes.find((node) => node.id === nodeId)?.label
        );

        setSelectedNodeLabels((prevLabels) => [
            clickedNode.label,
            ...connectedNodeLabels,
            rootLabel,
            ...prevLabels,
        ]);

        try {
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    keyword: connectedNodeLabels.join(", "),
                }),
            });

            const data = await response.json();
            if (response.status !== 200) {
                throw (
                    data.error ||
                    new Error(`Request failed with status ${response.status}`)
                );
            }

            const newNodeLabels = data.result.split(",");
            const newNodes = newNodeLabels.map((label, index) => ({
                id: state.counter + 1 + index,
                label: label.trim(),
                x: clickedNode.x + 100 * (index + 1),
                y: clickedNode.y + 100,
                physics: true,
                color: "#FBD85D",
            }));

            const newEdges = newNodes.map((node) => ({
                from: clickedNodeId,
                to: node.id,
            }));

            setState((prevState) => ({
                ...prevState,
                counter: prevState.counter + newNodeLabels.length,
                graph: {
                    nodes: [...prevState.graph.nodes, ...newNodes],
                    edges: [...prevState.graph.edges, ...newEdges],
                },
            }));
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };

    const [state, setState] = useState(() => {
        const rootNode = {
            id: 1,
            label: "Root",
            x: 0,
            y: 0,
            physics: true,
            fixed: true,
            color: "#f5b252",
        };
        return {
            counter: 1,
            graph: {
                nodes: [rootNode],
                edges: [],
            },
            rootNode,
            events: {
                select: ({ nodes, edges }) => {
                    // console.log("Selected nodes:");
                    // console.log(nodes);
                    // console.log("Selected edges:");
                    // console.log(edges);
                },
                doubleClick: handleDoubleClick,
                oncontext: handleNodeContextMenu,
            },
        };
    });

    const { graph, events } = state;
    return (
        <div>
            <div>{result}</div>
            <Graph
                graph={state.graph}
                options={options}
                events={{
                    ...state.events,
                    click: handleAddTextNode,
                    oncontext: handleNodeContextMenu,
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
                        xPos={contextMenuPos.xPos}
                        yPos={contextMenuPos.yPos}
                        selectedNodeId={contextMenuPos.selectedNodeId}
                        selectedNode={contextMenuPos.selectedNode}
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
