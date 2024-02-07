import BackgroundCircles from "../BackGround/BackGroundCircles";
import LoginForm from "../Login/LoginForm";

import "./HomePage.css";

const LoginPage = () => {
    return (
        <div className="join flex h-screen w-screen justify-center items-center">
            <BackgroundCircles />
            <LoginForm />
        </div>
    );
};

export default LoginPage;
