import { useAppSelector } from "@/store/hooks";
import React from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = ({ children }: { children: React.ReactNode }) => {
  const token = useAppSelector((state) => {
    return state.auth.token;
  });
  console.log(token);
  return (
    <section className="">
      <div className="  bg-slate-50 w-full h-11 px-10 flex justify-between items-center">
        <div className="left">
          <h1 className=" font-semibold text-xl  ">
            Opin<span className="text-green-800">X</span>
          </h1>
        </div>
        <div className="right">
          <ul className=" flex space-x-2">
            <li className=" text-slate-800">
              <Link to={"/"}>Home</Link>
            </li>
            {token ? (
              <>
                <li>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      {" "}
                      <Avatar>
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>CN</AvatarFallback>
                      </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Profile</DropdownMenuItem>
                      <DropdownMenuItem>Billing</DropdownMenuItem>
                      <DropdownMenuItem>Team</DropdownMenuItem>
                      <DropdownMenuItem>Subscription</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              </>
            ) : (
              <>
                <li className=" bg-black text-white px-3 py-1 rounded-md">
                  <Link to={"/login"}>Start Trading</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
      <div className="px-10">{children}</div>
    </section>
  );
};

export default Navbar;
