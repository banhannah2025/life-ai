import { UserButton } from "@clerk/nextjs";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "../ui/navigation-menu";
import Link from "next/link";



export function NavBar() {
    return (
        <div className="w-screen h-16 shadow-lg fixed bg-white content-center align-center text-center pt-1 pb-1 position-fixed">
            
                <div className="grid grid-cols-3 gap-4 content-center">
                    <div className="flex gap-2">
                    <div className="font-bold text-left text-lg pl-16">Life-AI</div>
                    <div className="text-xs content-end text-red-700 font-bold">By CCPROS</div>
                    </div>
                    <div className="text-black">
                        <NavigationMenu viewport={false}>
                            <NavigationMenuList>
                            <NavigationMenuItem>
                                    <NavigationMenuLink className="hover:text-blue-500 hover:opacity-50 hover:text-lg hover:font-bold" asChild>
                                        <Link href="/"><div>Home</div></Link>
                                    </NavigationMenuLink>
                                
                                
                            </NavigationMenuItem>
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>
                    <div>
                        <UserButton />
                    </div>
                </div>
        
            
        </div>
    )
}