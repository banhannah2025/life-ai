import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileOverview } from "@/components/profile/ProfileOverview";

export default function ProfilePage() {
  return (
    <Card className="w-full border border-slate-200 bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <ProfileOverview />
      </CardContent>
    </Card>
  );
}
