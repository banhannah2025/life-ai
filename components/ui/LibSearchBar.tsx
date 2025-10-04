import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "./card";
import { Checkbox } from "./checkbox";
import { Input } from "./input";
import { Menubar } from "./menubar";


export function LibSearchBar(){
    return (
        <div className="flex">
            <Card>
                <CardHeader className="w-full text-underline">
                    <div className="flex">
                    <CardTitle>Search the Library!</CardTitle>
                    <Input placeholder="Input keywords to search"/>
                    </div>
                    <CardDescription>Select all that apply:</CardDescription>
                    
                </CardHeader>
                
                <CardContent>
                    <div id="jurisdictionHeaders" className="h-full flex justify-between items-center text-center">
                        <div className="w-1/3 h-full border-r-2">
                        <div className="text-md font-bold text-center border-b-2">Jurisdiction</div>
                        <div className="flex pt-3 w-full">
                        <Checkbox className="text-black border-black">Hello World</Checkbox>
                        <p className="text-center justify-center justify-items-center items-center content-center text-sm pl-3">Hello World</p>
                        </div>
                        </div>
                        <div className="w-1/3 h-full">
                        <div className="text-md font-bold text-center border-b-2">Database</div>
                        <div className="flex pt-3 w-full"></div>
                        </div>
                        <div className="w-1/3 h-full border-l-2">
                        <div className="text-md font-bold text-center border-b-2">Search Tools</div>
                        <div className="flex pt-3 w-full"></div>
                        </div>
                    </div>
                    
                </CardContent>
            </Card>
    </div>
    )
}