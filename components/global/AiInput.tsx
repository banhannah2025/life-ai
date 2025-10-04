import { Button } from "../ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";


export default function AiInput (){
    return(
        <div className="w-full justify-items-center text-center justify-center content-center h-screen items-center">
    <Card className="flex justify-center justify-items-center content-center max-w-200 min-h-50 text-center shadow-lg">
        <CardHeader>
            <CardTitle className="text-2xl">Welcome to Life-AI</CardTitle>
            <CardDescription>What can I help you with today?</CardDescription>
            
        </CardHeader>
        <CardContent>
            <form>
                <div className="flex justify-center content-center p-3">
                <input id="text" type="text" placeholder="Whats on your mind?" required className="bg-white shadow-lg border text-center w-full rounded-md" />
                <Button className="ml-5 text-lg shadow-lg opacity-70 bg-blue-500">Submit</Button>
                </div>
            </form>
            
        </CardContent>
        
    </Card>
    </div>
    );
};