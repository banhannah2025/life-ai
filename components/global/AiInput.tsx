import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";


export default function AiInput(){
    return (
    <Card className="flex w-3/4 flex-col border border-slate-200 bg-white shadow-lg backdrop-blur">
        <CardHeader className="mx-auto w-full max-w-4xl space-y-2 text-center">
            <CardTitle className="text-2xl font-semibold text-slate-900">Welcome to Life-AI</CardTitle>
            <CardDescription className="text-sm text-slate-500">What can we help you uncover today?</CardDescription>
            
        </CardHeader>
        <CardContent className="mx-auto w-full max-w-4xl">
            <form className="flex flex-col gap-3 sm:flex-row">
                <Input id="text" type="text" placeholder="Ask a question or describe your task" required className="h-12 flex-1 text-base" />
                <Button className="h-12 sm:w-auto">Submit</Button>
            </form>
            
        </CardContent>
        
    </Card>
    );
};
