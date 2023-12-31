export const colors = [
    "#FF5733", // 빨간색
    "#33A7FF", // 파란색
    "#9A33FF", // 보라색
    "#FF33E4", // 분홍색
    "#33FFC4", // 청록색
    "#336DFF", // 하늘색
    "#FF33A9", // 자홍색
    "#33FF49", // 녹색
    "#FF8C33", // 적갈색
    "#9AFF33", // 연두색
];

export const mindMapOptions = {
    layout: {
        hierarchical: false,
    },
    nodes: {
        shape: "circle",
        size: 30,
        mass: 1,
        // color: "#FBD85D",
        widthConstraint: {
            maximum: 100,
        },
        font: {
            face: "MainFont",
        },
        shadow: {
            enabled: true,
            size: 1,
        },
    },
    edges: {
        arrows: {
            to: {
                enabled: false,
            },
        },
        width: 4,
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
        enabled: false,
    },
};

export let rootNode = {
    id: 1,
    label: "팀 여행",
    x: 0,
    y: 0,
    physics: false,
    fixed: true,
    color: "#f5b252",
    widthConstraint: { minimum: 100, maximum: 200 }, // 너비를 100으로 고정
    heightConstraint: { minimum: 100, maximum: 200 }, // 높이를 100으로 고정
    font: { size: 30 },
};

export const MAX_STACK_LENGTH = 10;

export const ROOT_NODE_COLOR = "#f5b252";

export const throttle = (callback, delay) => {
    let previousCall = new Date().getTime();
    return function () {
        const time = new Date().getTime();

        if (time - previousCall >= delay) {
            previousCall = time;
            callback.apply(null, arguments);
        }
    };
};

export const ROOTNODE_ID = 1;
export const BOOKMARK_ICON = "🔻";

export const DECIMAL_PLACES = 0;

export const MAX_ZOOM_SCALE = 2.5;
export const MIN_ZOOM_SCALE = 0.2;

export const ANIMATION_ZOOM_SCALE = 0.4;
export const ANIMATION_DURATION = 2000;
