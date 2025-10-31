import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/ProfileForm";

export default function EditProfilePage() {
  return (
    <Card className="w-full border border-slate-200 bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Edit profile</CardTitle>
      </CardHeader>
      <CardContent>
        <ProfileForm />
      </CardContent>
    </Card>
  );
}
