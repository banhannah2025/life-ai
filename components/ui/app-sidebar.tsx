import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader } from "./sidebar";


export function AppSidebar() {
    return(
        
        <Sidebar className="mt-16 shadow-xl bg-white opacity-80">
            <SidebarHeader className="mt-5">Hello Name</SidebarHeader>
            <SidebarContent className="flex items-center">
                <div className="flex items-center">
                <Avatar className="flex h-30 w-30 content-center mt-2 border border-2 shadow-xs">
                    <AvatarImage className="content-center" src="#"/>
                    <AvatarFallback className="h-30 w-30 flex">RC</AvatarFallback>
                </Avatar>
                </div>
                <div className="w-full">
                <Link className="text-xs text-blue-600 hover:text-lg hover:text-black" href="#">Update Profile</Link>
                <h4 className="pl-4 font-bold mt-2 text-start">Documents</h4>
                <div>
                    
                </div>
                <h4 className="pl-4 font-bold mt-2 text-start">Connections</h4>
                <h4 className="pl-4 font-bold mt-2 text-start">Events</h4>
                </div>
            </SidebarContent>
               
            
           
        </Sidebar>
        
    )
}