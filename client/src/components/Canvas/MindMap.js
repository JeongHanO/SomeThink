//  node ./node_modules/y-websocket/bin/server.js
import Graph from "react-graph-vis";
import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import TopBar from "../TopBar/TopBar";
import html2canvas from "html2canvas";
import fileDownload from "js-file-download";

import {
    handleDoubleClick,
    handleNodeDragEnd,
    handleClickOutside,
    handleCanvasDrag,
    handleAddTextNode,
    handleAddImageNode as handleAddImageNodeOriginal,
    handleNodeContextMenu,
    handleNodeDragging,
    createTextInput,
    makeHandleMemoChange,
    handleMouseWheel,
} from "./EventHandler";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

import NodeContextMenu from "./NodeContextMenu";
import EdgeContextMenu from "./EdgeContextMenu";
import ImageContextMenu from "./ImageContextMenu";
import TextContextMenu from "./TextContextMenu";
import LowToolBar from "../LowToolBar/LowToolBar";
import UserMouseMove from "./UserMouseMove";
import Memo from "./MemoNode";

import "./MindMap.css";
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

const isCyclic = (graph, fromNode, toNode) => {
    const insertEdge = `Edge ${fromNode} to ${toNode}`;
    graph.push(insertEdge);
    const visited = new Set();
    let dfsq = ["1"];
    while (dfsq.length > 0) {
        const current = dfsq.shift();
        if (visited.has(current)) {
            return false;
        }
        visited.add(current);
        graph.forEach((edge) => {
            if (edge.startsWith(`Edge ${current} to `)) {
                dfsq.push(edge.split(" ")[3]);
            }
        });
    }
    return true;
};

// const MindMap = (sessionId, leaveSession, toggleAudio, audioEnabled) => {
const MindMap = ({ sessionId, leaveSession, toggleAudio, audioEnabled, userName }) => {
    const ydocRef = useRef(null);
    const ymapRef = useRef(null);
    const networkRef = useRef(null);

    const [selectedImage, setSelectedImage] = useState(false);
    let options = {
        layout: {
            hierarchical: false,
        },
        nodes: {
            shape: "circle",
            size: 30,
            mass: 1,
            color: "#FBD85D",
            widthConstraint: {
                maximum: 60,
            },
        },
        edges: {
            arrows: {
                to: {
                    enabled: true,
                },
            },
            color: "#000000",
        },
        physics: {
            enabled: false,
        },
        interaction: {
            multiselect: false,
            zoomView: false,
        },
        manipulation: {
            addEdge: (data, callback) => {},
            addNode: false,
            editEdge: false,
            deleteNode: false,
            deleteEdge: false,
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

    if (!selectedImage) {
        options = {
            ...options,
            interaction: {
                ...options.interaction,
                zoomView: true,
            },
        };
    }

    const [fromNode, setFromNode] = useState(null);
    const [isCreatingEdge, setIsCreatingEdge] = useState(false);
    const [inputId, setInputId] = useState("");
    const [mouseCoordinates, setMouseCoordinates] = useState([]);
    const [contextMenuPos, setContextMenuPos] = useState({ xPos: 0, yPos: 0 });
    const [isNodeContextMenuVisible, setIsNodeContextMenuVisible] = useState(false);
    const [isEdgeContextMenuVisible, setIsEdgeContextMenuVisible] = useState(false);
    const [isImageContextMenuVisible, setIsImageContextMenuVisible] = useState(false);
    const [isTextContextMenuVisible, setIsTextContextMenuVisible] = useState(false);
    const contextMenuRef = useRef(null);
    const [isCreatingText, setIsCreatingText] = useState(false);
    const [isCreatingImage, setIsCreatingImage] = useState(false);
    const [memo, setMemo] = useState("");
    const [isMemoVisible, setIsMemoVisible] = useState(false);
    const [selectedNodeLabels, setSelectedNodeLabels] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedEdge, setSelectedEdge] = useState(null);
    const memoizedHandleClickOutside = useCallback(
        handleClickOutside(
            contextMenuRef,
            setIsNodeContextMenuVisible,
            setIsEdgeContextMenuVisible,
            setIsImageContextMenuVisible,
            setIsTextContextMenuVisible,
            setIsCreatingImage
        ),
        [contextMenuRef, setIsNodeContextMenuVisible]
    );
    const handleAddImageNode = (imageUrl) => handleAddImageNodeOriginal({ imageUrl, ymapRef });
    const openNodeContextMenu = handleNodeContextMenu({
        setContextMenuPos,
        setIsNodeContextMenuVisible,
        setIsEdgeContextMenuVisible,
        setIsImageContextMenuVisible,
        setIsTextContextMenuVisible,
        isCreatingImage,
        setIsCreatingImage,
        ymapRef,
    });
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [windowHeight, setWindowHeight] = useState(window.innerHeight);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
            setWindowHeight(window.innerHeight);
        };

        // 컴포넌트가 마운트될 때와 사이즈 변경 시에 이벤트 핸들러를 등록합니다.
        window.addEventListener("resize", handleResize);

        // 컴포넌트가 언마운트될 때 이벤트 핸들러를 해제합니다.
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    useEffect(() => {
        ydocRef.current = new Y.Doc();
        const provider = new WebsocketProvider(
            "wss://somethink.online/room",
            sessionId,
            ydocRef.current
        );
        // const provider = new WebsocketProvider("ws://localhost:1234", "12327", ydocRef.current);
        ymapRef.current = ydocRef.current.getMap("MindMap");
        ymapRef.current.set("Node 1", JSON.stringify(rootNode));
        ymapRef.current.set("Counter", 2);

        ymapRef.current.observe((event) => {
            const updatedGraph = {
                nodes: [],
                edges: [],
            };

            const updatedMemo = {
                memo: "",
            };

            const Mouses = [];

            ymapRef.current.forEach((value, key) => {
                if (key.startsWith("Node")) {
                    const node = JSON.parse(value);
                    updatedGraph.nodes.push(node);
                } else if (key.startsWith("Edge")) {
                    const edge = JSON.parse(value);
                    updatedGraph.edges.push(edge);
                } else if (key === "Memo") {
                    updatedMemo.memo = value;
                } else if (key.startsWith("Mouse")) {
                    const coordinate = JSON.parse(value);
                    Mouses.push([coordinate.id, coordinate.x, coordinate.y]);
                }
            });

            setMindMap((prevState) => ({
                ...prevState,
                graph: updatedGraph,
            }));
            setMemo(updatedMemo.memo);
            setMouseCoordinates(Mouses);
        });

        const handleResetNode = () => {
            handleReset();
        };

        window.addEventListener("resetNode", handleResetNode);

        return () => {
            window.removeEventListener("resetNode", handleResetNode);
        };
    }, []);

    const handleInputChange = (event) => {
        setInputId(event.target.value.replace(/[^0-9]/g, ""));
    };

    const handleMouseMove = (e) => {
        if (networkRef.current !== null) {
            const coord = networkRef.current.DOMtoCanvas({ x: e.clientX, y: e.clientY });
            const nx = coord.x;
            const ny = coord.y;
            ymapRef.current.set(
                `Mouse ${userName}`,
                JSON.stringify({ x: nx, y: ny, id: userName })
            );
        }
    };

    const handleUserSelect = (event) => {
        // NOTE: 임시 유저 ID
        const tempUserId = userName;

        if (isCreatingEdge) {
            if (event.nodes.length > 0) {
                const toNode = event.nodes[0];
                if (toNode === fromNode) {
                    alert("자기 자신을 가리키는 엣지는 만들 수 없습니다!");
                    setIsCreatingEdge(false);
                    setFromNode(null);
                    return;
                }
                if (
                    ymapRef.current.has(`Edge ${fromNode} to ${toNode}`) ||
                    ymapRef.current.has(`Edge ${toNode} to ${fromNode}`)
                ) {
                    alert("이미 존재하는 엣지입니다!");
                    setIsCreatingEdge(false);
                    setFromNode(null);
                    return;
                }
                if (
                    !isCyclic(
                        Array.from(ymapRef.current.keys()).filter((key) => key.startsWith("Edge ")),
                        fromNode,
                        toNode
                    )
                ) {
                    alert("순환 구조를 만들 수 없습니다!");
                    setIsCreatingEdge(false);
                    setFromNode(null);
                    return;
                }
                let createdEdge;
                if (
                    checkIsConnectedToRoot(
                        Array.from(ymapRef.current.keys()).filter((key) => key.startsWith("Edge ")),
                        toNode
                    )
                ) {
                    createEdge(toNode, fromNode);
                    createdEdge = `Edge ${toNode} to ${fromNode}`;
                } else {
                    createEdge(fromNode, toNode);
                    createdEdge = `Edge ${fromNode} to ${toNode}`;
                }
                sortEdgesCorrectly(
                    Array.from(ymapRef.current.keys()).filter((key) => key.startsWith("Edge ")),
                    createdEdge
                );
                setIsCreatingEdge(false);
                setFromNode(null);
            }
            return;
        }

        if (event.nodes.length > 0) {
            // 노드 선택시
            setSelectedNode(event.nodes[0]);
            checkPrevSelected(tempUserId);
            let selectedNode = JSON.parse(ymapRef.current.get(`Node ${event.nodes[0]}`));
            ymapRef.current.set(`User ${tempUserId} selected`, `Node ${event.nodes[0]}`);
            selectedNode.borderWidth = 2;
            if (selectedNode.id === 1) {
                selectedNode.color = {
                    border: "#CBFFA9",
                };
            } else {
                selectedNode.color = {
                    border: "#CBFFA9",
                    background: "#FBD85D",
                };
            }
            selectedNode.owner = tempUserId;
            ymapRef.current.set(`Node ${event.nodes[0]}`, JSON.stringify(selectedNode));
        }
        // 선택 해제시
        else {
            setSelectedNode(null);
            checkPrevSelected(tempUserId);
        }
    };

    // 유저가 선택한 값이 있는지 검사
    const checkPrevSelected = (userId) => {
        const tempValue = ymapRef.current.get(`User ${userId} selected`);
        // 있다면 해당 값 원래대로 돌려놓음
        if (tempValue) {
            let userData = JSON.parse(ymapRef.current.get(tempValue));
            if (userData) {
                if (userData.label) {
                    userData.borderWidth = 1;
                    if (userData.id === 1) {
                        userData.color = "#f5b252";
                    } else {
                        userData.color = "#FBD85D";
                    }
                    ymapRef.current.set(`Node ${userData.id}`, JSON.stringify(userData));
                }
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Delete") {
            if (selectedNode) {
                deleteNodes(selectedNode);
            } else if (selectedEdge) {
                deleteEdge([`${selectedEdge}`]);
            }
        }
        if (e.key === " ") {
            networkRef.current.moveTo({
                position: { x: 0, y: 0 },
                scale: 1.0,
                offset: { x: 0, y: 0 },
            });
        }
    };

    const handleReset = () => {
        const IsReset = window.confirm("모든 노드를 삭제하시겠습니까?");
        if (ymapRef.current && IsReset) {
            // ymap이 초기화되었을 경우에만 clear() 메서드를 호출합니다.
            ymapRef.current.clear();
            ymapRef.current.set("Node 1", JSON.stringify(rootNode));
            ymapRef.current.set("Counter", 2);
        }
    };

    const checkIsConnectedToRoot = (edges, node) => {
        let dfsq = [`${node}`];
        while (dfsq.length > 0) {
            const current = dfsq.shift();
            if (current === "1") {
                return true;
            }
            edges.forEach((edge) => {
                if (edge.endsWith(` to ${current}`)) {
                    dfsq.push(edge.split(" ")[1]);
                }
            });
        }
        return false;
    };

    const createEdge = (fromNode, toNode) => {
        ymapRef.current.set(
            `Edge ${fromNode} to ${toNode}`,
            JSON.stringify({
                from: fromNode,
                to: toNode,
                id: `${fromNode} to ${toNode}`,
            })
        );
    };

    const sortEdgesCorrectly = (edges, createdEdge) => {
        let edgeList = edges.filter((edge) => edge != createdEdge);
        let newEdgeList = [];
        let bfsq = [`${createdEdge.split(" ")[3]}`];
        while (bfsq.length > 0) {
            const current = bfsq.shift();
            edgeList.forEach((edge) => {
                if (edge.startsWith(`Edge ${current} to `)) {
                    newEdgeList.push(edge);
                    ymapRef.current.delete(edge);
                    // FIXME: 반복을 인덱싱을 통해 하도록 해서 삭제 성능개선을 할 수 있을듯?
                    edgeList = edgeList.filter((e) => e != edge);
                    bfsq.push(edge.split(" ")[3]);
                } else if (edge.endsWith(` to ${current}`)) {
                    newEdgeList.push(`Edge ${current} to ${edge.split(" ")[1]}`);
                    ymapRef.current.delete(edge);
                    // FIXME: 반복을 인덱싱을 통해 하도록 해서 삭제 성능개선을 할 수 있을듯?
                    edgeList = edgeList.filter((e) => e != edge);
                    bfsq.push(edge.split(" ")[1]);
                }
            });
        }

        newEdgeList.forEach((edge) => {
            const from = edge.split(" ")[1];
            const to = edge.split(" ")[3];
            ymapRef.current.set(
                `Edge ${from} to ${to}`,
                JSON.stringify({
                    from: from,
                    to: to,
                    id: `${from} to ${to}`,
                })
            );
        });
    };

    const deleteEdge = (selectedEdge) => {
        selectedEdge.forEach((edge) => {
            const splitedEdge = edge.split(" ");
            const from = splitedEdge[0];
            const to = splitedEdge[2];
            ymapRef.current.delete(`Edge ${from} to ${to}`);
        });
        setIsEdgeContextMenuVisible(false);
    };

    const createNode = (selectedNodeId) => {
        const selectedNode = JSON.parse(ymapRef.current.get(`Node ${selectedNodeId}`));
        const nodeCount = Math.floor(Math.random() * 1000);
        // const nodeCount = ymapRef.current.get("Counter");

        if (!selectedNode) {
            return;
        }

        const createNodeCallback = (label) => {
            if (!label || label.trim() === "") {
                alert("키워드를 입력해주세요!");
                removeTextInput();
            } else {
                const newNode = {
                    id: nodeCount,
                    label: label,
                    x: selectedNode.x,
                    y: selectedNode.y + 100,
                    color: "#FBD85D",
                };

                ymapRef.current.set(`Node ${nodeCount}`, JSON.stringify(newNode));
                ymapRef.current.set(
                    `Edge ${selectedNodeId} to ${nodeCount}`,
                    JSON.stringify({
                        from: selectedNodeId,
                        to: nodeCount,
                        id: `${selectedNodeId} to ${nodeCount}`,
                    })
                );

                ymapRef.current.set("Counter", nodeCount + 1);
                removeTextInput();
            }
        };

        const removeTextInput = () => {
            const textField = document.getElementById("createNodeTextField");
            if (textField) {
                document.body.removeChild(textField);
            }
        };

        const textField = createTextInput(``, createNodeCallback, () => {
            setSelectedNode(null);
            removeTextInput();
        });

        textField.id = "createNodeTextField";

        document.body.appendChild(textField);
        textField.focus();
    };

    const closeNodeContextMenu = () => {
        setIsNodeContextMenuVisible(false);
    };

    const closeEdgeContextMenu = () => {
        setIsEdgeContextMenuVisible(false);
    };

    const closeImageContextMenu = () => {
        setIsImageContextMenuVisible(false);
    };

    const closeTextContextMenu = () => {
        setIsTextContextMenuVisible(false);
    };

    const modifyNode = (nodeId, newLabel) => {
        const node = JSON.parse(ymapRef.current.get(`Node ${nodeId}`));
        if (node) {
            node.label = newLabel;
            ymapRef.current.set(`Node ${nodeId}`, JSON.stringify(node));
        }
    };

    useEffect(() => {
        if (selectedNode !== null) {
            const node = JSON.parse(ymapRef.current.get(`Node ${selectedNode}`));
            if (node.shape === "image") {
                console.log("image");
                setSelectedImage(true);
            }
        } else {
            setSelectedImage(false);
        }

        const handleAddNode = (event) => {
            if (!selectedNode) {
                return;
            }
            createNode(selectedNode);
        };
        const __handleAddTextNode = (event) => {
            setIsCreatingText(true);
        };
        const __handleAddImageNode = (event) => {
            setIsCreatingImage(true);
        };
        const handleSwitchMemo = (event) => {
            setIsMemoVisible((prev) => !prev);
        };
        const __handleMouseWheel = (event) => {
            if (selectedNode) {
                handleMouseWheel(event, selectedNode, ymapRef);
            }
        };
        document.addEventListener("click", memoizedHandleClickOutside);
        window.addEventListener("addNode", handleAddNode);
        window.addEventListener("addText", __handleAddTextNode);
        window.addEventListener("addImage", __handleAddImageNode);
        window.addEventListener("switchMemo", handleSwitchMemo);
        window.addEventListener("wheel", __handleMouseWheel);
        return () => {
            document.removeEventListener("click", handleClickOutside);
            window.removeEventListener("addNode", handleAddNode);
            window.removeEventListener("addText", __handleAddTextNode);
            window.removeEventListener("addImage", __handleAddImageNode);
            window.removeEventListener("switchMemo", handleSwitchMemo);
            window.removeEventListener("wheel", __handleMouseWheel);
        };
    }, [selectedNode, memoizedHandleClickOutside, isCreatingImage, selectedImage]);

    const deleteSingleNode = (nodeId) => {
        // NOTE: 임시 유저 ID
        const tempUserId = userName;
        ymapRef.current.delete(`Node ${nodeId}`);
        ymapRef.current.get(`User ${tempUserId} selected`) === `Node ${nodeId}` &&
            ymapRef.current.delete(`User ${tempUserId} selected`);
    };

    const deleteNodes = (nodeId) => {
        if (nodeId === 1) {
            alert("루트 노드는 삭제할 수 없습니다!");
            return;
        }
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
                const nodeId = nodeCount + index++;
                const newNode = {
                    id: nodeId,
                    label: label.trim(),
                    x: clickedNode.x + 100 * (index + 1),
                    y: clickedNode.y + 100,
                    physics: false,
                    color: "#FBD85D",
                    size: 30,
                };

                ymapRef.current.set(`Node ${nodeId}`, JSON.stringify(newNode));
                return newNode;
            });

            const newEdges = newNodes.map((node) => {
                const edge = {
                    from: clickedNodeId,
                    to: node.id,
                    id: `${clickedNodeId} to ${node.id}`,
                };
                const edgeKey = `Edge ${clickedNodeId} to ${node.id}`;
                ymapRef.current.set(edgeKey, JSON.stringify(edge));

                return edge;
            });

            ymapRef.current.set("Counter", nodeCount + newNodeLabels.length);
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };

    const handleMemoChange = makeHandleMemoChange(ymapRef, setMemo);

    const [MindMap, setMindMap] = useState(() => {
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
                    } else if (edges.length === 1) {
                        setSelectedEdge(edges[0]);
                    }
                },
                doubleClick: (events) => handleDoubleClick(events, ymapRef, modifyNode),
                oncontext: openNodeContextMenu,
                click: openNodeContextMenu,
            },
        };
    });

    const captureRef = useRef(null);

    const handleExportClick = () => {
        if (captureRef.current) {
            html2canvas(captureRef.current).then((canvas) => {
                canvas.toBlob((blob) => {
                    fileDownload(blob, "screenshot.png");
                });
            });
        }
    };

    const { graph, events } = MindMap;
    return (
        <div
            onKeyDown={handleKeyPress}
            onMouseMove={(e) => handleMouseMove(e)}
            style={{ position: "absolute", width: "100vw", height: "100vh", zIndex: 0 }}
        >
            <UserMouseMove
                userMouseData={mouseCoordinates}
                networkRef={networkRef}
                userName={userName}
            />
            <TopBar
                onExportClick={handleExportClick}
                sessionId={sessionId}
                leaveSession={leaveSession}
                toggleAudio={toggleAudio}
                audioEnabled={audioEnabled}
            />
            <div ref={captureRef} style={{ width: "100%", height: "100%" }}>
                <div type="text" value={sessionId} style={{ position: "absolute", zIndex: 1 }} />
                <PreventRefresh />
                {isMemoVisible && <Memo memo={memo} handleMemoChange={handleMemoChange} />}
                <Graph
                    graph={MindMap.graph}
                    options={options}
                    events={{
                        ...MindMap.events,
                        dragging: (events) => handleNodeDragging(events, ymapRef, userName),
                        dragEnd: (events) => handleNodeDragEnd(events, ymapRef, setSelectedNode),
                        drag: handleCanvasDrag,
                        click: (events) => {
                            handleAddTextNode(
                                events,
                                isCreatingText,
                                ymapRef,
                                setSelectedNode,
                                setSelectedEdge,
                                setIsCreatingText
                            );
                        },
                        select: handleUserSelect,
                        oncontext: openNodeContextMenu,
                    }}
                    style={{ height: "100%", width: "100%" }}
                    getNetwork={(network) => {
                        network.on("initRedraw", () => {
                            networkRef.current = network;
                        });
                    }}
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
                            selectedNode={selectedNode}
                            onClose={closeNodeContextMenu}
                            deleteNode={deleteNodes}
                            createNode={createNode}
                            setIsCreatingText={setIsCreatingText}
                            setIsCreatingEdge={setIsCreatingEdge}
                            setFromNode={setFromNode}
                            handleAddImageNode={handleAddImageNode}
                            handleNodeSelect={handleNodeSelect}
                        />
                    </div>
                )}
                {isEdgeContextMenuVisible && (
                    <div
                        ref={contextMenuRef}
                        className="context-menu"
                        style={{
                            position: "absolute",
                            left: contextMenuPos.xPos,
                            top: contextMenuPos.yPos,
                        }}
                    >
                        <EdgeContextMenu
                            selectedEdge={contextMenuPos.selectedEdge}
                            onClose={closeEdgeContextMenu}
                            deleteEdge={deleteEdge}
                        />
                    </div>
                )}
                {isImageContextMenuVisible && isCreatingImage && (
                    <div
                        ref={contextMenuRef}
                        className="context-menu"
                        style={{
                            position: "absolute",
                            left: contextMenuPos.xPos,
                            top: contextMenuPos.yPos,
                        }}
                    >
                        <ImageContextMenu
                            handleAddImageNode={handleAddImageNode}
                            onClose={closeImageContextMenu}
                            setIsCreatingImage={setIsCreatingImage}
                        />
                    </div>
                )}
                {isTextContextMenuVisible && (
                    <div
                        ref={contextMenuRef}
                        className="context-menu"
                        style={{
                            position: "absolute",
                            left: contextMenuPos.xPos,
                            top: contextMenuPos.yPos,
                        }}
                    >
                        <TextContextMenu
                            selectedText={contextMenuPos.selectedNodeId}
                            onClose={closeTextContextMenu}
                            deleteNode={deleteNodes}
                        />
                    </div>
                )}
            </div>
            <LowToolBar />
        </div>
    );
};

export default MindMap;
