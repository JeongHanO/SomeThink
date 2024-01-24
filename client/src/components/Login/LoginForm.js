import { useState } from "react";

import Logo from "../../../src/img/icon/logo.png";

const LoginForm = () => {
    return (
        <form className="flex flex-col w-1/2 items-center gap-4 p-4 bg-[#f9f9f9] rounded-[10px]">
            <img src={Logo} alt="logo" className="w-1/2" />
            <label>Email</label>
            <input />
            <label>Password</label>
            <input />
            <button className="bg-[#fbd85d] border-[1px] rounded-[10px] p-2 w-1/4 transform transition duration-300 hover:scale-110">
                Login
            </button>
        </form>
    );
};

export default LoginForm;
