import dynamic from "next/dynamic";

const ProfileClient = dynamic(() => import("@/features/profile/components/profile-client").then((module) => module.ProfileClient), {
  ssr: false,
});

const ProfilePage = () => {
  return <ProfileClient />;
};

export default ProfilePage;
