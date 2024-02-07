import { useState } from "react";

import Logo from "../../../src/img/icon/logo.png";

const LoginForm = () => {
    return (
        <form className="flex flex-col w-[382px] h-[388px] justify-center items-center gap-8 p-4 bg-[#f9f9f9] rounded-[10px]">
            <img src={Logo} alt="logo" className="w-full" />
            <div className="flex gap-2">
                <label htmlFor="email" className="w-[100px] text-center">
                    Email
                </label>
                <input id="email" />
            </div>
            <div className="flex gap-2">
                <label htmlFor="password" className="w-[100px] text-center">
                    Password
                </label>
                <input id="password" />
            </div>

            <button className="bg-[#fbd85d] border-[1px] rounded-[10px] p-2 w-1/4 transform transition duration-300 hover:scale-110">
                Login
            </button>
        </form>
    );
};

export default LoginForm;
