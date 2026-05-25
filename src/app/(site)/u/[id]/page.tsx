import { ProfileView } from "@/features/profile/profile-view";

export default async function ProfilePage({ params }: PageProps<"/u/[id]">) {
  const { id } = await params;
  return <ProfileView userId={id} />;
}
