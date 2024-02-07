import "../Page/HomePage.css";

const BackgroundCircles = () => {
    return (
        <>
            <div className="big-circles" style={{ pointerEvents: "none" }}>
                <div className="big-circle"></div>
                <div className="big-circle"></div>
                <div className="big-circle"></div>
            </div>
            <div className="smallcircles" style={{ pointerEvents: "none" }}>
                <div className="small-circle"></div>
                <div className="small-circle"></div>
                <div className="small-circle"></div>
                <div className="small-circle"></div>
                <div className="small-circle"></div>
                <div className="small-circle"></div>
            </div>
        </>
    );
};

export default BackgroundCircles;
